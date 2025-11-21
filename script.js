document.addEventListener('DOMContentLoaded', function() {
    // --- ЭЛЕМЕНТЫ DOM ---
    const audio = document.getElementById('audioPlayer');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const trackListBtn = document.getElementById('trackListBtn');
    const playbackModeBtn = document.getElementById('playbackModeBtn');
    const liteModeBtn = document.getElementById('liteModeBtn');
    const volumeSlider = document.getElementById('volumeSlider');
    const currentTrack = document.getElementById('currentTrack');
    const currentArtist = document.getElementById('currentArtist');
    const progressBar = document.getElementById('progressBar');
    const progress = document.getElementById('progress');
    const currentTime = document.getElementById('currentTime');
    const duration = document.getElementById('duration');
    const visualizer = document.getElementById('visualizer');
    const albumArt = document.getElementById('albumArt');
    const albumImage = document.getElementById('albumImage');
    const particles = document.getElementById('particles');
    const leftGlow = document.getElementById('leftGlow');
    const rightGlow = document.getElementById('rightGlow');
    const playerContainer = document.getElementById('playerContainer');
    const trackListPanel = document.getElementById('trackListPanel');
    const trackList = document.getElementById('trackList');
    const trackSearch = document.getElementById('trackSearch');
    const deletePlaylistBtn = document.getElementById('deletePlaylistBtn');
    const lyricsDisplay = document.getElementById('lyricsDisplay'); // НОВОЕ

    // Кастомный селект
    const playlistTrigger = document.getElementById('playlistTrigger');
    const playlistOptions = document.getElementById('playlistOptions');
    const currentPlaylistText = document.getElementById('currentPlaylistText');
    const customSelectContainer = document.querySelector('.custom-select');

    // Управление плейлистами
    const createPlaylistBtn = document.getElementById('createPlaylistBtn');
    const uploadTrackBtn = document.getElementById('uploadTrackBtn');
    const fileInput = document.getElementById('fileInput');
    const modalOverlay = document.getElementById('modalOverlay');
    const newPlaylistName = document.getElementById('newPlaylistName');
    const confirmPlaylistBtn = document.getElementById('confirmPlaylistBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');

    // Редактор треков
    const trackEditModalOverlay = document.getElementById('trackEditModalOverlay');
    const editTrackTitle = document.getElementById('editTrackTitle');
    const editTrackArtist = document.getElementById('editTrackArtist');
    const editTrackCoverInput = document.getElementById('editTrackCoverInput');
    const editTrackCoverBtn = document.getElementById('editTrackCoverBtn');
    const coverPreview = document.getElementById('coverPreview');
    const editColorPrimary = document.getElementById('editColorPrimary');
    const editColorAccent = document.getElementById('editColorAccent');
    const confirmTrackEditBtn = document.getElementById('confirmTrackEditBtn');
    const closeTrackEditBtn = document.getElementById('closeTrackEditBtn');

    // --- ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ---
    let userPlaylists = JSON.parse(localStorage.getItem('myUserPlaylists')) || {};
    let uploadedTracks = []; 
    let pendingUploadFile = null;
    let draggedItemIndex = null;
    let activeMenuId = null;
    
    function getAllPlaylists() {
        const combined = { ...playlists, ...userPlaylists };
        if (uploadedTracks.length > 0) {
            combined["Мои загрузки"] = uploadedTracks;
        }
        return combined;
    }

    let currentPlaylistName = "Все треки";
    let currentTracks = getAllPlaylists()[currentPlaylistName] || playlists["Все треки"];
    let currentTrackIndex = 0;
    let isPlaying = false;
    let isTrackListOpen = false;
    let isLiteMode = localStorage.getItem('isLiteMode') === 'true';

    const PLAYBACK_MODES = { PLAYLIST: 0, SINGLE: 1, ONCE: 2 };
    let playbackMode = PLAYBACK_MODES.PLAYLIST;
    let audioContext, analyser, dataArray, bufferLength, audioSource;
    let visualizerBars = [];
    let animationId = null;

    let beatDetected = false, lastBeatTime = 0, beatThreshold = 0.7, currentPulseIntensity = 0;
    let particlesData = [], isParticlesTransitioning = false, particleTransitionProgress = 0;
    let energyHistory = [], energyAverage = 0, spectralCentroid = 0, isBeat = false, beatCooldown = 0;
    let sparkParticles = [], sparkCooldown = 0;
    
    // ПЕРЕМЕННЫЕ ДЛЯ УМНОЙ ВОЛНЫ
    let energySurgeActive = false;
    let energySurgeIntensity = 0;
    let currentSurgeDecay = 0.1; // Скорость затухания волны

    let edgeGlowElements = {}, edgeGlowIntensity = 0;
    const FREQ_RANGES = { BASS: { start: 0, end: 10 }, MID: { start: 10, end: 20 }, HIGH: { start: 20, end: 30 } };
    let audioFeatures = { rms: 0, bassEnergy: 0, midEnergy: 0, highEnergy: 0, spectralCentroid: 0, isBeat: false };

    // --- КАСТОМНЫЙ СЕЛЕКТ ---
    function populatePlaylistSelector() {
        playlistOptions.innerHTML = '';
        currentPlaylistText.textContent = currentPlaylistName;
        const allPls = getAllPlaylists();
        for (const playlistName in allPls) {
            const option = document.createElement('div');
            option.className = 'custom-option';
            option.textContent = playlistName;
            if (playlistName === currentPlaylistName) option.classList.add('selected');
            
            option.addEventListener('click', () => {
                currentPlaylistName = playlistName;
                currentPlaylistText.textContent = playlistName;
                switchPlaylist(playlistName);
                customSelectContainer.classList.remove('open');
                populatePlaylistSelector();
            });
            playlistOptions.appendChild(option);
        }
    }
    playlistTrigger.addEventListener('click', (e) => { e.stopPropagation(); customSelectContainer.classList.toggle('open'); });
    document.addEventListener('click', (e) => { if (!customSelectContainer.contains(e.target)) customSelectContainer.classList.remove('open'); });

    // --- УПРАВЛЕНИЕ ПЛЕЙЛИСТАМИ ---
    function createNewPlaylist(name) {
        if (!name) return;
        const allPls = getAllPlaylists();
        if (allPls[name]) { alert('Плейлист с таким именем уже существует!'); return; }
        userPlaylists[name] = [];
        saveUserPlaylists();
        currentPlaylistName = name;
        populatePlaylistSelector();
        switchPlaylist(name);
        closeModal();
    }

    function saveUserPlaylists() { localStorage.setItem('myUserPlaylists', JSON.stringify(userPlaylists)); }

    function deleteUserPlaylist() {
        if (confirm(`Удалить плейлист "${currentPlaylistName}"?`)) {
            delete userPlaylists[currentPlaylistName];
            saveUserPlaylists();
            currentPlaylistName = "Все треки";
            populatePlaylistSelector();
            switchPlaylist("Все треки");
        }
    }

    function addTrackToPlaylist(track, targetPlaylistName) {
        if (!userPlaylists[targetPlaylistName]) return;
        const exists = userPlaylists[targetPlaylistName].some(t => t.name === track.name && t.artist === track.artist);
        if (exists) { alert('Трек уже есть в этом плейлисте!'); return; }
        userPlaylists[targetPlaylistName].push(track);
        saveUserPlaylists();
        if (currentPlaylistName === targetPlaylistName) {
            currentTracks = userPlaylists[targetPlaylistName];
            renderTrackList();
        }
        alert(`Трек добавлен в "${targetPlaylistName}"`);
    }

    function removeTrack(index) {
        if (!userPlaylists[currentPlaylistName]) return;
        if (confirm('Убрать этот трек из плейлиста?')) {
            currentTracks.splice(index, 1);
            saveUserPlaylists();
            renderTrackList();
        }
    }

    // --- РЕДАКТОР ЗАГРУЗКИ ---
    function openTrackEditor(file) {
        pendingUploadFile = file;
        editTrackTitle.value = file.name.replace(/\.[^/.]+$/, "");
        editTrackArtist.value = "Unknown Artist";
        coverPreview.style.backgroundImage = '';
        editTrackCoverInput.value = '';
        editColorPrimary.value = '#1a1a2e';
        editColorAccent.value = '#00d1ff';
        trackEditModalOverlay.classList.add('active');
    }
    function closeTrackEditor() { trackEditModalOverlay.classList.remove('active'); pendingUploadFile = null; }
    function saveTrackFromEditor() {
        if (!pendingUploadFile) return;
        const objectUrl = URL.createObjectURL(pendingUploadFile);
        let coverUrl = 'picture/default_cover.jpg';
        if (editTrackCoverInput.files && editTrackCoverInput.files[0]) { coverUrl = URL.createObjectURL(editTrackCoverInput.files[0]); }
        const newTrack = {
            name: editTrackTitle.value || "Без названия", artist: editTrackArtist.value || "Неизвестен",
            path: objectUrl, cover: coverUrl,
            colors: { primary: editColorPrimary.value, secondary: adjustColorBrightness(editColorPrimary.value, -20), accent: editColorAccent.value },
            visualizer: [editColorAccent.value, '#ffffff'], neonColor: editColorAccent.value
        };
        uploadedTracks.push(newTrack);
        closeTrackEditor();
        currentPlaylistName = "Мои загрузки";
        populatePlaylistSelector();
        switchPlaylist("Мои загрузки");
    }
    function adjustColorBrightness(col, amt) {
        var usePound = false; if (col[0] == "#") { col = col.slice(1); usePound = true; }
        var num = parseInt(col,16);
        var r = (num >> 16) + amt; if (r > 255) r = 255; else if  (r < 0) r = 0;
        var b = ((num >> 8) & 0x00FF) + amt; if (b > 255) b = 255; else if  (b < 0) b = 0;
        var g = (num & 0x0000FF) + amt; if (g > 255) g = 255; else if (g < 0) g = 0;
        return (usePound?"#":"") + (g | (b << 8) | (r << 16)).toString(16);
    }

    // --- VISUALIZER & LOGIC ---
    
    function spawnCornerShockwaves(intensity = 1) {
        if (isLiteMode) return;
        
        const allCorners = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
        let activeCorners = [];

        // Если удар сильный - все углы. Если слабый - случайные 2.
        if (intensity > 0.8) {
            activeCorners = allCorners;
        } else {
            activeCorners = allCorners.sort(() => 0.5 - Math.random()).slice(0, 2);
        }

        activeCorners.forEach(corner => {
            const emitter = document.querySelector(`.corner-emitter.${corner}`);
            if (emitter) {
                const wave = document.createElement('div');
                wave.className = 'shockwave active';
                
                if (currentTracks.length > 0) { 
                    wave.style.borderColor = currentTracks[currentTrackIndex].colors.accent; 
                }
                
                // Динамический размер и прозрачность
                wave.style.borderWidth = `${2 + (intensity * 6)}px`; 
                wave.style.opacity = (intensity * 0.7).toString();

                emitter.appendChild(wave);
                setTimeout(() => { if (wave.parentNode) wave.parentNode.removeChild(wave); }, 800);
            }
        });
    }

    function toggleLiteMode() {
        isLiteMode = !isLiteMode; localStorage.setItem('isLiteMode', isLiteMode);
        const sparkParticlesContainer = document.getElementById('sparkParticles');
        if (isLiteMode) { sparkParticlesContainer.innerHTML = ''; document.body.classList.add('lite-mode'); liteModeBtn.classList.add('active'); } 
        else { document.body.classList.remove('lite-mode'); liteModeBtn.classList.remove('active'); }
    }
    
    function visualize() {
        // Логика субтитров (High Precision - 60 FPS)
        if (currentTracks && currentTracks.length > 0) {
            const track = currentTracks[currentTrackIndex];
            if (track.lyrics && track.lyrics.length > 0) {
                // Ищем строку, учитывая текущее время
                const currentLine = track.lyrics.filter(l => l.time <= audio.currentTime).pop();
                
                if (currentLine) {
                    if (lyricsDisplay.textContent !== currentLine.text) {
                        lyricsDisplay.textContent = currentLine.text;
                        
                        if (currentLine.text !== "") {
                            lyricsDisplay.classList.add('visible');
                            // Перезапуск анимации для удара
                            lyricsDisplay.classList.remove('lyrics-bounce');
                            void lyricsDisplay.offsetWidth; 
                            lyricsDisplay.classList.add('lyrics-bounce');
                        } else {
                            lyricsDisplay.classList.remove('visible');
                        }
                    }
                }
            } else {
                // Если лирики нет
                if(lyricsDisplay.textContent !== '') {
                    lyricsDisplay.textContent = '';
                    lyricsDisplay.classList.remove('visible');
                }
            }
        }

        if (!analyser || !isPlaying || currentTracks.length === 0) return;
        try {
            analyser.getByteFrequencyData(dataArray); analyzeSpectralFeatures(); 
            for (let i = 0; i < visualizerBars.length; i++) { const barIndex = Math.floor((i / visualizerBars.length) * bufferLength); const value = dataArray[barIndex] / 255; let baseHeight = Math.max(5, value * 110); if (i < 10) { const bassBoost = audioFeatures.bassEnergy * 25; const beatBoost = audioFeatures.isBeat ? currentPulseIntensity * 40 : 0; baseHeight += bassBoost + beatBoost; } else if (i < 20) { const midBoost = audioFeatures.midEnergy * 18; const energyBoost = audioFeatures.rms * 12; baseHeight += midBoost + energyBoost; } else { const highBoost = audioFeatures.highEnergy * 20; baseHeight += highBoost; } visualizerBars[i].style.height = `${baseHeight}px`; const currentColors = currentTracks[currentTrackIndex].colors; visualizerBars[i].style.background = `linear-gradient(to top, ${currentColors.primary}, ${currentColors.accent})`; }
            if (leftGlow && rightGlow) { const minHeight = 15; const lineHeight = minHeight + (audioFeatures.rms * 130); leftGlow.style.height = `${lineHeight}%`; rightGlow.style.height = `${lineHeight}%`; const brightness = 0.7 + (audioFeatures.spectralCentroid / bufferLength) * 0.5; leftGlow.style.opacity = brightness; rightGlow.style.opacity = brightness; const neonColor = currentTracks[currentTrackIndex].neonColor; const baseBlur = 12; const pulseBlur = currentPulseIntensity * 35; leftGlow.style.background = neonColor; leftGlow.style.boxShadow = `0 0 ${baseBlur + pulseBlur}px ${neonColor}, 0 0 ${(baseBlur + pulseBlur) * 1.8}px ${neonColor}, inset 0 0 10px rgba(255, 255, 255, 0.3)`; rightGlow.style.background = neonColor; rightGlow.style.boxShadow = `0 0 ${baseBlur + pulseBlur}px ${neonColor}, 0 0 ${(baseBlur + pulseBlur) * 1.8}px ${neonColor}, inset 0 0 10px rgba(255, 255, 255, 0.3)`; }
            updateParticlesMovement(audioFeatures); if (!isLiteMode) analyzeEdgeEffects(audioFeatures);
            updateSparkParticles(); updateEnergySurge(); updateEdgeGlow(audioFeatures); updatePulseIntensity();
            animationId = requestAnimationFrame(visualize);
        } catch (error) { if (animationId) cancelAnimationFrame(animationId); }
    }
    
    function initializePlayer() {
        populatePlaylistSelector(); createVisualizer(); createParticles(); createEdgeGlow(); updatePlaybackModeButton(); updateVolumeSlider();
        if (isLiteMode) { document.body.classList.add('lite-mode'); liteModeBtn.classList.add('active'); }
        if(currentTracks && currentTracks.length > 0) loadTrack(0);
        switchPlaylist(currentPlaylistName); 
    }
    liteModeBtn.addEventListener('click', toggleLiteMode);
    document.addEventListener('keydown', (e) => { if (e.target.tagName === 'INPUT') return; switch(e.key.toLowerCase()) { case 'arrowleft': seek(-5); break; case 'arrowright': seek(5); break; case ' ': e.preventDefault(); playPauseBtn.click(); break; case 'l': toggleLiteMode(); break; } });

    // --- SETUP LISTENERS ---
    createPlaylistBtn.addEventListener('click', () => { modalOverlay.classList.add('active'); newPlaylistName.focus(); });
    function closeModal() { modalOverlay.classList.remove('active'); newPlaylistName.value = ''; }
    closeModalBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });
    confirmPlaylistBtn.addEventListener('click', () => { createNewPlaylist(newPlaylistName.value); });
    
    uploadTrackBtn.addEventListener('click', () => { fileInput.click(); });
    fileInput.addEventListener('change', (e) => { if(e.target.files.length) openTrackEditor(e.target.files[0]); fileInput.value=''; });
    editTrackCoverBtn.addEventListener('click', () => editTrackCoverInput.click());
    editTrackCoverInput.addEventListener('change', (e) => { if (e.target.files && e.target.files[0]) { coverPreview.style.backgroundImage = `url('${URL.createObjectURL(e.target.files[0])}')`; } });
    closeTrackEditBtn.addEventListener('click', closeTrackEditor);
    confirmTrackEditBtn.addEventListener('click', saveTrackFromEditor);
    deletePlaylistBtn.addEventListener('click', deleteUserPlaylist);

    // --- MENU & DRAG DROP ---
    function renderTrackList() {
        trackList.innerHTML = '';
        if (!currentTracks || currentTracks.length === 0) { trackList.innerHTML = `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 200px; opacity: 0.5;"><svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor" style="margin-bottom: 10px;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"/></svg><div>Плейлист пуст</div></div>`; return; }
        const isUserPlaylist = !!userPlaylists[currentPlaylistName];
        currentTracks.forEach((track, index) => {
            const trackItem = document.createElement('div');
            const isTrackActive = audio.src.includes(track.path) && !audio.paused;
            trackItem.className = `track-item ${isTrackActive ? 'active' : ''}`;
            trackItem.dataset.index = index;
            const progressPercent = isTrackActive ? (audio.currentTime / audio.duration * 100) || 0 : 0;
            let dragHandleHTML = isUserPlaylist ? `<div class="drag-handle" title="Переместить"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg></div>` : `<div style="width: 10px;"></div>`;
            if (isUserPlaylist) { trackItem.draggable = true; addDragEvents(trackItem, index); }
            trackItem.innerHTML = `${dragHandleHTML}<div class="track-item-cover" style="background-image: url('${track.cover || 'picture/default_cover.jpg'}')"></div><div class="track-item-info"><div class="track-item-title">${track.name}</div><div class="track-item-artist">${track.artist}</div><div class="track-item-progress"><div class="track-item-progress-bar" style="width: ${progressPercent}%"></div></div></div>${isTrackActive ? `<div class="now-playing-icon"><svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 20c4.42 0 8-3.58 8-8s-3.58-8-8-8-8 3.58-8 8 3.58 8 8 8zM10 9.65l6 2.35-6 2.35V9.65z"/></svg></div>` : ''}<button class="track-menu-btn" id="menu-btn-${index}"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg></button><div class="context-menu" id="menu-${index}"><div class="context-menu-item add-to-pl" data-index="${index}"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 10H2v2h12v-2zm0-4H2v2h12V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM2 16h8v-2H2v2z"/></svg>Добавить в плейлист</div><div class="context-menu-item download-track" data-index="${index}"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>Скачать файл</div>${isUserPlaylist ? `<div class="menu-divider"></div><div class="context-menu-item delete-item remove-track" data-index="${index}"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>Удалить из плейлиста</div>` : ''}</div>`;
            trackItem.addEventListener('click', (e) => { if (e.target.closest('.track-menu-btn') || e.target.closest('.context-menu') || e.target.closest('.drag-handle')) return; loadTrack(index, true); });
            const menuBtn = trackItem.querySelector(`#menu-btn-${index}`);
            menuBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleContextMenu(index); });
            trackItem.querySelector('.add-to-pl').addEventListener('click', (e) => { e.stopPropagation(); addToPlaylistAction(track); closeAllMenus(); });
            trackItem.querySelector('.download-track').addEventListener('click', (e) => { e.stopPropagation(); downloadTrackAction(track); closeAllMenus(); });
            if (isUserPlaylist) { trackItem.querySelector('.remove-track').addEventListener('click', (e) => { e.stopPropagation(); removeTrack(index); closeAllMenus(); }); }
            trackList.appendChild(trackItem);
        });
    }
    function toggleContextMenu(index) { const menu = document.getElementById(`menu-${index}`); const btn = document.getElementById(`menu-btn-${index}`); if (activeMenuId === index) { closeAllMenus(); return; } closeAllMenus(); menu.classList.add('show'); btn.classList.add('active'); activeMenuId = index; }
    function closeAllMenus() { document.querySelectorAll('.context-menu').forEach(el => el.classList.remove('show')); document.querySelectorAll('.track-menu-btn').forEach(el => el.classList.remove('active')); activeMenuId = null; }
    document.addEventListener('click', (e) => { if (!e.target.closest('.track-menu-btn') && !e.target.closest('.context-menu')) { closeAllMenus(); } });
    function addToPlaylistAction(track) { const playlistNames = Object.keys(userPlaylists); if (playlistNames.length === 0) { alert("Сначала создайте хотя бы один плейлист!"); return; } let promptText = "Выберите плейлист (введите номер):\n"; playlistNames.forEach((name, i) => promptText += `${i + 1}. ${name}\n`); const choice = prompt(promptText); const choiceIndex = parseInt(choice) - 1; if (choiceIndex >= 0 && choiceIndex < playlistNames.length) { addTrackToPlaylist(track, playlistNames[choiceIndex]); } }
    function downloadTrackAction(track) { const a = document.createElement('a'); a.href = track.path; a.download = `${track.artist} - ${track.name}.mp3`; document.body.appendChild(a); a.click(); document.body.removeChild(a); }
    function addDragEvents(item, index) {
        item.addEventListener('dragstart', (e) => { if (!e.target.closest('.drag-handle')) { e.preventDefault(); return; } draggedItemIndex = index; item.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/html', item.innerHTML); });
        item.addEventListener('dragend', () => { item.classList.remove('dragging'); draggedItemIndex = null; document.querySelectorAll('.track-item').forEach(el => { el.classList.remove('drag-over-top'); el.classList.remove('drag-over-bottom'); }); });
        item.addEventListener('dragover', (e) => { if (draggedItemIndex === null) return; e.preventDefault(); e.dataTransfer.dropEffect = 'move'; const rect = item.getBoundingClientRect(); const offset = e.clientY - rect.top; item.classList.remove('drag-over-top'); item.classList.remove('drag-over-bottom'); if (offset < rect.height / 2) { item.classList.add('drag-over-top'); } else { item.classList.add('drag-over-bottom'); } });
        item.addEventListener('dragleave', () => { item.classList.remove('drag-over-top'); item.classList.remove('drag-over-bottom'); });
        item.addEventListener('drop', (e) => { e.preventDefault(); if (draggedItemIndex === null || draggedItemIndex === index) return; const rect = item.getBoundingClientRect(); const offset = e.clientY - rect.top; const isAfter = offset >= (rect.height / 2); let targetIndex = index; if (isAfter) targetIndex++; const [draggedTrack] = currentTracks.splice(draggedItemIndex, 1); if (draggedItemIndex < targetIndex) { targetIndex--; } currentTracks.splice(targetIndex, 0, draggedTrack); saveUserPlaylists(); renderTrackList(); if (currentTrackIndex === draggedItemIndex) { currentTrackIndex = targetIndex; } });
    }

    // --- MAIN PLAYER HELPERS ---
    function updatePlaybackModeButton() { const icon = playbackModeBtn.querySelector('svg'); switch(playbackMode) { case PLAYBACK_MODES.PLAYLIST: icon.innerHTML = '<path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>'; break; case PLAYBACK_MODES.SINGLE: icon.innerHTML = '<path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z"/>'; break; case PLAYBACK_MODES.ONCE: icon.innerHTML = '<path d="M5.64 3.64l1.42-1.42L20.36 18.22l-1.42 1.42L5.64 3.64zM7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>'; break; } }
    function togglePlaybackMode() { playbackMode = (playbackMode + 1) % 3; updatePlaybackModeButton(); }
    function updateVolumeSlider() { const volumeValue = volumeSlider.value; const accentColor = (currentTracks && currentTracks.length > 0) ? currentTracks[currentTrackIndex].colors.accent : '#ffffff'; volumeSlider.style.background = `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${volumeValue}%, rgba(255, 255, 255, 0.1) ${volumeValue}%, rgba(255, 255, 255, 0.1) 100%)`; }
    function createVisualizer() { visualizer.innerHTML = ''; visualizerBars = []; for (let i = 0; i < 30; i++) { const bar = document.createElement('div'); bar.className = 'visualizer-bar'; bar.style.height = '5px'; bar.style.alignSelf = 'flex-end'; visualizer.appendChild(bar); visualizerBars.push(bar); } }
    function initAudioAnalyzer() { try { if (audioContext) { if (audioContext.state === 'suspended') { audioContext.resume(); } return; } audioContext = new (window.AudioContext || window.webkitAudioContext)(); analyser = audioContext.createAnalyser(); if (!audioSource) { audioSource = audioContext.createMediaElementSource(audio); audioSource.connect(analyser); analyser.connect(audioContext.destination); } analyser.fftSize = 256; bufferLength = analyser.frequencyBinCount; dataArray = new Uint8Array(bufferLength); } catch (error) { console.error('Audio analyzer initialization failed:', error); } }
    function getFrequencyEnergy(range) { let sum = 0; const count = range.end - range.start; for (let i = range.start; i < range.end; i++) { sum += dataArray[i]; } return sum / count / 255; }
    function analyzeSpectralFeatures() { if (!analyser || !dataArray) return; const bassEnergy = getFrequencyEnergy(FREQ_RANGES.BASS); const midEnergy = getFrequencyEnergy(FREQ_RANGES.MID); const highEnergy = getFrequencyEnergy(FREQ_RANGES.HIGH); let sum = 0; for (let i = 0; i < bufferLength; i++) { sum += dataArray[i] * dataArray[i]; } const rms = Math.sqrt(sum / bufferLength) / 255; energyHistory.push(rms); if (energyHistory.length > 30) { energyHistory.shift(); } energyAverage = energyHistory.reduce((a, b) => a + b) / energyHistory.length; let weightedSum = 0; let energySum = 0; for (let i = 0; i < bufferLength; i++) { weightedSum += i * dataArray[i]; energySum += dataArray[i]; } spectralCentroid = energySum > 0 ? weightedSum / energySum : 0; const currentTime = Date.now(); isBeat = false; if (beatCooldown <= 0) { const threshold = energyAverage * 1.4 + 0.15; if (bassEnergy > threshold && (currentTime - lastBeatTime) > 200) { isBeat = true; lastBeatTime = currentTime; currentPulseIntensity = 1.0; beatCooldown = 8; } } else { beatCooldown--; } audioFeatures.rms = rms; audioFeatures.bassEnergy = bassEnergy; audioFeatures.midEnergy = midEnergy; audioFeatures.highEnergy = highEnergy; audioFeatures.spectralCentroid = spectralCentroid; audioFeatures.isBeat = isBeat; }
    function updatePulseIntensity() { if (currentPulseIntensity > 0) { currentPulseIntensity -= 0.08; if (currentPulseIntensity < 0) currentPulseIntensity = 0; } beatDetected = false; }
    function updateSparkParticles() { sparkParticles.forEach((spark, index) => { spark.life -= 0.02; if (spark.life <= 0) { if (spark.element.parentNode) { spark.element.parentNode.removeChild(spark.element); } sparkParticles.splice(index, 1); return; } const newX = parseFloat(spark.element.style.left) + spark.velocityX; const newY = parseFloat(spark.element.style.top) + spark.velocityY; spark.element.style.left = `${newX}px`; spark.element.style.top = `${newY}px`; spark.element.style.opacity = (spark.life * 0.8).toString(); const scale = spark.life * 0.7 + 0.3; spark.element.style.transform = `scale(${scale})`; }); }
    
    function adjustColorOpacity(hex, opacity) { let r=0, g=0, b=0; if (hex.length == 4) { r = "0x" + hex[1] + hex[1]; g = "0x" + hex[2] + hex[2]; b = "0x" + hex[3] + hex[3]; } else if (hex.length == 7) { r = "0x" + hex[1] + hex[2]; g = "0x" + hex[3] + hex[4]; b = "0x" + hex[5] + hex[6]; } return "rgba("+ +r + "," + +g + "," + +b + "," + opacity + ")"; }
    function formatTime(seconds) { if (isNaN(seconds)) return '0:00'; const mins = Math.floor(seconds / 60); const secs = Math.floor(seconds % 60); return `${mins}:${secs < 10 ? '0' : ''}${secs}`; }
    
    function updateProgress() { 
        if (audio.duration && !isNaN(audio.duration)) { 
            const progressPercent = (audio.currentTime / audio.duration) * 100; 
            progress.style.width = `${progressPercent}%`; 
            currentTime.textContent = formatTime(audio.currentTime); 
            
            if (isTrackListOpen) { 
                const activeTrackItem = trackList.querySelector('.track-item.active'); 
                if (activeTrackItem) { 
                    const progressBar = activeTrackItem.querySelector('.track-item-progress-bar'); 
                    if (progressBar) { progressBar.style.width = `${progressPercent}%`; } 
                } 
            } 

            // --- ЛОГИКА СУБТИТРОВ ---
            const track = currentTracks[currentTrackIndex];
            if (track.lyrics && track.lyrics.length > 0) {
                // Ищем текущую строку
                const currentLine = track.lyrics.filter(l => l.time <= audio.currentTime).pop();
                
                if (currentLine) {
                    if (lyricsDisplay.textContent !== currentLine.text) {
                        lyricsDisplay.textContent = currentLine.text;
                        
                        if (currentLine.text !== "") {
                            lyricsDisplay.classList.add('visible');
                            
                            // Эффект удара (Restart CSS animation)
                            lyricsDisplay.classList.remove('lyrics-bounce');
                            void lyricsDisplay.offsetWidth; // Магия JS для перезапуска анимации
                            lyricsDisplay.classList.add('lyrics-bounce');
                        } else {
                            lyricsDisplay.classList.remove('visible');
                        }
                    }
                }
            } else {
                // Если у трека нет лирики
                if(lyricsDisplay.textContent !== '') {
                    lyricsDisplay.textContent = '';
                    lyricsDisplay.classList.remove('visible');
                }
            }
        } 
    }

    function loadTrack(index, autoPlay = false) { if (currentTracks && index >= 0 && index < currentTracks.length) { currentTrackIndex = index; const track = currentTracks[currentTrackIndex]; audio.pause(); isPlaying = false; playPauseBtn.querySelector('svg').innerHTML = '<path d="M8 5v14l11-7z"/>'; if (animationId) { cancelAnimationFrame(animationId); animationId = null; } audio.src = track.path; currentTrack.textContent = track.name; currentArtist.textContent = track.artist; updateTheme(); const onLoaded = function() { duration.textContent = formatTime(audio.duration); audio.removeEventListener('loadedmetadata', onLoaded); if (autoPlay) { setTimeout(() => playTrack(), 100); } }; audio.addEventListener('loadedmetadata', onLoaded); audio.addEventListener('error', (e) => console.error('Error loading track:', track.path, e)); audio.load(); } else { currentTrack.textContent = 'Плейлист пуст'; currentArtist.textContent = 'Выберите другой'; albumImage.style.backgroundImage = 'none'; duration.textContent = '0:00'; progress.style.width = '0%'; } }
    function playTrack() { if (!currentTracks || currentTracks.length === 0) return; initAudioAnalyzer(); const playPromise = audio.play(); if (playPromise !== undefined) { playPromise.then(() => { isPlaying = true; playPauseBtn.querySelector('svg').innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>'; if (!animationId) { visualize(); } }).catch(error => { console.error('Playback failed:', error); if (audioContext && audioContext.state === 'suspended') { audioContext.resume().then(() => { audio.play().then(() => { isPlaying = true; playPauseBtn.querySelector('svg').innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>'; if (!animationId) { visualize(); } }).catch(e => console.error('Second playback attempt failed:', e)); }); } }); } }
    function seek(seconds) { if (audio.duration) { audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds)); } }
    playPauseBtn.addEventListener('click', () => { if (isPlaying) { audio.pause(); isPlaying = false; playPauseBtn.querySelector('svg').innerHTML = '<path d="M8 5v14l11-7z"/>'; if (animationId) { cancelAnimationFrame(animationId); animationId = null; } } else { playTrack(); } });
    prevBtn.addEventListener('click', () => { if (!currentTracks || currentTracks.length === 0) return; let newIndex = currentTrackIndex - 1; if (newIndex < 0) newIndex = currentTracks.length - 1; loadTrack(newIndex, true); });
    nextBtn.addEventListener('click', () => { if (!currentTracks || currentTracks.length === 0) return; let newIndex = currentTrackIndex + 1; if (newIndex >= currentTracks.length) newIndex = 0; loadTrack(newIndex, true); });
    playbackModeBtn.addEventListener('click', togglePlaybackMode);
    trackListBtn.addEventListener('click', toggleTrackList);
    trackSearch.addEventListener('input', (e) => { filterTracks(e.target.value); });
    volumeSlider.addEventListener('input', () => { audio.volume = volumeSlider.value / 100; updateVolumeSlider(); });
    progressBar.addEventListener('click', (e) => { if (audio.duration) { const clickX = e.offsetX; const width = progressBar.offsetWidth; const clickTime = (clickX / width) * audio.duration; audio.currentTime = clickTime; } });
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', () => { if (!currentTracks || currentTracks.length === 0) return; switch(playbackMode) { case PLAYBACK_MODES.PLAYLIST: let newIndex = currentTrackIndex + 1; if (newIndex >= currentTracks.length) newIndex = 0; loadTrack(newIndex, true); break; case PLAYBACK_MODES.SINGLE: loadTrack(currentTrackIndex, true); break; case PLAYBACK_MODES.ONCE: audio.pause(); isPlaying = false; playPauseBtn.querySelector('svg').innerHTML = '<path d="M8 5v14l11-7z"/>'; if (animationId) { cancelAnimationFrame(animationId); animationId = null; } break; } });
    audio.addEventListener('error', (e) => console.error('Audio element error:', e));
    
    function switchPlaylist(playlistName) { 
        const allPls = getAllPlaylists();
        if (allPls[playlistName]) { 
            currentPlaylistName = playlistName; 
            currentTracks = allPls[playlistName]; 
            if (userPlaylists[playlistName]) { deletePlaylistBtn.style.display = 'flex'; } else { deletePlaylistBtn.style.display = 'none'; }
            const isCurrentTrackInNewPlaylist = currentTracks.some(track => audio.src.includes(track.path)); 
            if (!isCurrentTrackInNewPlaylist) { 
                audio.pause(); isPlaying = false; playPauseBtn.querySelector('svg').innerHTML = '<path d="M8 5v14l11-7z"/>'; 
                if (animationId) cancelAnimationFrame(animationId); 
                if (currentTracks.length === 0) { progress.style.width = '0%'; currentTime.textContent = '0:00'; } 
                loadTrack(0); 
            } 
            renderTrackList(); 
        } 
    }
    
    initializePlayer();
});
window.addEventListener('load', function() { const preloader = document.getElementById('preloader'); setTimeout(() => { preloader.classList.add('hide'); setTimeout(() => { preloader.remove(); }, 500); }, 800); });
