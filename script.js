document.addEventListener('DOMContentLoaded', function() {
    // ==========================================
    // 1. ПЕРЕМЕННЫЕ И ЭЛЕМЕНТЫ DOM
    // ==========================================
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
    const lyricsDisplay = document.getElementById('lyricsDisplay');

    // Элементы интерфейса
    const playlistTrigger = document.getElementById('playlistTrigger');
    const playlistOptions = document.getElementById('playlistOptions');
    const currentPlaylistText = document.getElementById('currentPlaylistText');
    const customSelectContainer = document.querySelector('.custom-select');
    const createPlaylistBtn = document.getElementById('createPlaylistBtn');
    const uploadTrackBtn = document.getElementById('uploadTrackBtn');
    const fileInput = document.getElementById('fileInput');
    const modalOverlay = document.getElementById('modalOverlay');
    const newPlaylistName = document.getElementById('newPlaylistName');
    const confirmPlaylistBtn = document.getElementById('confirmPlaylistBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    
    // Модальное окно редактора
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

    // Глобальные переменные
    let userPlaylists = JSON.parse(localStorage.getItem('myUserPlaylists')) || {};
    let uploadedTracks = []; 
    let pendingUploadFile = null;
    let draggedItemIndex = null;
    let activeMenuId = null;
    
    let currentPlaylistName = "Все треки";
    let currentTracks = [];
    let currentTrackIndex = 0;
    let isPlaying = false;
    let isTrackListOpen = false;
    let isLiteMode = localStorage.getItem('isLiteMode') === 'true';

    const PLAYBACK_MODES = { PLAYLIST: 0, SINGLE: 1, ONCE: 2 };
    let playbackMode = PLAYBACK_MODES.PLAYLIST;
    
    // Аудио контекст
    let audioContext, analyser, dataArray, bufferLength, audioSource;
    let visualizerBars = [];
    let animationId = null;

    // Переменные для эффектов
    let beatDetected = false, lastBeatTime = 0, currentPulseIntensity = 0;
    let particlesData = [], isParticlesTransitioning = false;
    let energyHistory = [], energyAverage = 0, spectralCentroid = 0, isBeat = false, beatCooldown = 0;
    let sparkParticles = [];
    let energySurgeActive = false, energySurgeIntensity = 0, currentSurgeDecay = 0.1; 
    let edgeGlowElements = {}, edgeGlowIntensity = 0;
    const FREQ_RANGES = { BASS: { start: 0, end: 10 }, MID: { start: 10, end: 20 }, HIGH: { start: 20, end: 30 } };
    let audioFeatures = { rms: 0, bassEnergy: 0, midEnergy: 0, highEnergy: 0, spectralCentroid: 0, isBeat: false };

    // ==========================================
    // 2. ГЛАВНЫЕ ФУНКЦИИ ПЛЕЕРА (CORE LOGIC)
    // ==========================================

    // Загрузка трека
    function loadTrack(index, autoPlay = false) {
        if (!currentTracks || currentTracks.length === 0) {
            currentTrack.textContent = 'Плейлист пуст';
            currentArtist.textContent = 'Выберите другой';
            return;
        }

        // Безопасный индекс
        if (index < 0) index = currentTracks.length - 1;
        if (index >= currentTracks.length) index = 0;

        currentTrackIndex = index;
        const track = currentTracks[currentTrackIndex];

        // Сброс состояния
        audio.pause();
        isPlaying = false;
        playPauseBtn.querySelector('svg').innerHTML = '<path d="M8 5v14l11-7z"/>';
        
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }

        // Загрузка источника
        audio.src = track.path;
        currentTrack.textContent = track.name;
        currentArtist.textContent = track.artist;

        // Применение темы
        updateTheme();

        // Обработка метаданных
        const onLoaded = function() {
            duration.textContent = formatTime(audio.duration);
            audio.removeEventListener('loadedmetadata', onLoaded);
            if (autoPlay) {
                // Небольшая задержка для стабильности
                setTimeout(() => playTrack(), 150);
            }
        };
        audio.addEventListener('loadedmetadata', onLoaded);
        audio.addEventListener('error', (e) => console.error('Error loading track:', track.path, e));
        audio.load();
    }

    // Воспроизведение
    function playTrack() {
        if (!currentTracks || currentTracks.length === 0) return;
        
        // Инициализация аудио контекста (нужен жест пользователя)
        initAudioAnalyzer();

        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                isPlaying = true;
                playPauseBtn.querySelector('svg').innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
                // Запуск визуализации если еще не запущена
                if (!animationId) {
                    visualize();
                }
            }).catch(error => {
                console.error('Playback failed:', error);
                // Попытка восстановить контекст если он завис
                if (audioContext && audioContext.state === 'suspended') {
                    audioContext.resume().then(() => audio.play());
                }
            });
        }
    }

    // Обновление прогресс-бара (ТОЛЬКО БАР, БЕЗ ЛИРИКИ)
    function updateProgress() {
        if (audio.duration && !isNaN(audio.duration)) {
            const progressPercent = (audio.currentTime / audio.duration) * 100;
            progress.style.width = `${progressPercent}%`;
            currentTime.textContent = formatTime(audio.currentTime);
            
            // Обновление полоски в списке треков
            if (isTrackListOpen) {
                const activeTrackItem = trackList.querySelector('.track-item.active');
                if (activeTrackItem) {
                    const bar = activeTrackItem.querySelector('.track-item-progress-bar');
                    if (bar) bar.style.width = `${progressPercent}%`;
                }
            }
        }
    }

    // Переключение плейлиста
    function switchPlaylist(playlistName) {
        const allPls = getAllPlaylists();
        if (allPls[playlistName]) {
            currentPlaylistName = playlistName;
            currentTracks = allPls[playlistName];
            
            // Кнопка удаления только для пользовательских плейлистов
            deletePlaylistBtn.style.display = userPlaylists[playlistName] ? 'flex' : 'none';
            
            // Если текущий трек не в новом плейлисте, стопаем и грузим первый
            const isCurrentTrackInNewPlaylist = currentTracks.some(track => audio.src.includes(track.path));
            if (!isCurrentTrackInNewPlaylist) {
                audio.pause();
                isPlaying = false;
                playPauseBtn.querySelector('svg').innerHTML = '<path d="M8 5v14l11-7z"/>';
                if (animationId) cancelAnimationFrame(animationId);
                
                if (currentTracks.length === 0) {
                    progress.style.width = '0%';
                    currentTime.textContent = '0:00';
                }
                loadTrack(0);
            }
            renderTrackList();
        }
    }

    // ==========================================
    // 3. ВИЗУАЛИЗАТОР И ЭФФЕКТЫ (ГЛАВНЫЙ ЦИКЛ)
    // ==========================================

    function visualize() {
        // --- 1. ЛОГИКА СУБТИТРОВ (Внутри FPS цикла для точности) ---
        if (currentTracks && currentTracks.length > 0) {
            const track = currentTracks[currentTrackIndex];
            
            if (track.lyrics && track.lyrics.length > 0) {
                // Ищем фразу для текущей секунды
                const currentLine = track.lyrics.filter(l => l.time <= audio.currentTime).pop();
                
                if (currentLine) {
                    if (lyricsDisplay.textContent !== currentLine.text) {
                        lyricsDisplay.textContent = currentLine.text;
                        
                        if (currentLine.text !== "") {
                            lyricsDisplay.classList.add('visible');
                            // Перезапуск анимации удара
                            lyricsDisplay.classList.remove('lyrics-bounce');
                            void lyricsDisplay.offsetWidth; // Магия перерисовки
                            lyricsDisplay.classList.add('lyrics-bounce');
                        } else {
                            lyricsDisplay.classList.remove('visible');
                        }
                    }
                }
            } else {
                // Если у трека нет текста - скрываем
                if(lyricsDisplay.textContent !== '') {
                    lyricsDisplay.textContent = '';
                    lyricsDisplay.classList.remove('visible');
                }
            }
        }

        // --- 2. АУДИО АНАЛИЗ ---
        if (!analyser || !isPlaying || currentTracks.length === 0) return;

        try {
            analyser.getByteFrequencyData(dataArray);
            analyzeSpectralFeatures(); // Анализ басов и битов

            // Рендер столбиков
            for (let i = 0; i < visualizerBars.length; i++) {
                const barIndex = Math.floor((i / visualizerBars.length) * bufferLength);
                const value = dataArray[barIndex] / 255;
                let baseHeight = Math.max(5, value * 110);
                
                // Буст разных частот
                if (i < 10) { // Басы
                    baseHeight += audioFeatures.bassEnergy * 25;
                    if (audioFeatures.isBeat) baseHeight += currentPulseIntensity * 40;
                } else if (i < 20) { // Средние
                    baseHeight += audioFeatures.midEnergy * 18 + audioFeatures.rms * 12;
                } else { // Высокие
                    baseHeight += audioFeatures.highEnergy * 20;
                }
                
                visualizerBars[i].style.height = `${baseHeight}px`;
                const currentColors = currentTracks[currentTrackIndex].colors;
                visualizerBars[i].style.background = `linear-gradient(to top, ${currentColors.primary}, ${currentColors.accent})`;
            }

            // Рендер неоновых линий (Glow)
            if (leftGlow && rightGlow) {
                const lineHeight = 15 + (audioFeatures.rms * 130);
                leftGlow.style.height = `${lineHeight}%`;
                rightGlow.style.height = `${lineHeight}%`;
                
                const neonColor = currentTracks[currentTrackIndex].neonColor;
                const blurAmount = 12 + (currentPulseIntensity * 35);
                
                const shadowStyle = `0 0 ${blurAmount}px ${neonColor}, 0 0 ${blurAmount * 1.8}px ${neonColor}, inset 0 0 10px rgba(255, 255, 255, 0.3)`;
                
                leftGlow.style.background = neonColor;
                leftGlow.style.boxShadow = shadowStyle;
                rightGlow.style.background = neonColor;
                rightGlow.style.boxShadow = shadowStyle;
            }

            // Обновление частиц и эффектов
            updateParticlesMovement(audioFeatures);
            if (!isLiteMode) analyzeEdgeEffects(audioFeatures);
            updateSparkParticles();
            updateEnergySurge();
            updateEdgeGlow(audioFeatures);
            updatePulseIntensity();

            // Рекурсивный вызов
            animationId = requestAnimationFrame(visualize);

        } catch (error) {
            console.error("Visualizer Error:", error);
            if (animationId) cancelAnimationFrame(animationId);
        }
    }

    // --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ВИЗУАЛИЗАЦИИ ---
    
    function initAudioAnalyzer() {
        try {
            if (audioContext) {
                if (audioContext.state === 'suspended') audioContext.resume();
                return;
            }
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            bufferLength = analyser.frequencyBinCount;
            dataArray = new Uint8Array(bufferLength);
            
            if (!audioSource) {
                audioSource = audioContext.createMediaElementSource(audio);
                audioSource.connect(analyser);
                analyser.connect(audioContext.destination);
            }
        } catch (e) {
            console.log("Audio context init warning (usually normal before user interaction):", e);
        }
    }

    function analyzeSpectralFeatures() {
        // Простой анализ энергии по диапазонам
        const getEnergy = (start, end) => {
            let sum = 0;
            for (let i = start; i < end; i++) sum += dataArray[i];
            return sum / (end - start) / 255;
        };

        audioFeatures.bassEnergy = getEnergy(FREQ_RANGES.BASS.start, FREQ_RANGES.BASS.end);
        audioFeatures.midEnergy = getEnergy(FREQ_RANGES.MID.start, FREQ_RANGES.MID.end);
        audioFeatures.highEnergy = getEnergy(FREQ_RANGES.HIGH.start, FREQ_RANGES.HIGH.end);

        // RMS (Root Mean Square) - общая громкость
        let sum = 0;
        for(let i=0; i<bufferLength; i++) sum += dataArray[i] * dataArray[i];
        audioFeatures.rms = Math.sqrt(sum / bufferLength) / 255;

        // Детектор бита
        const currentTime = Date.now();
        audioFeatures.isBeat = false;
        
        energyHistory.push(audioFeatures.rms);
        if (energyHistory.length > 30) energyHistory.shift();
        energyAverage = energyHistory.reduce((a, b) => a + b, 0) / energyHistory.length;

        if (beatCooldown <= 0) {
            // Если бас выше среднего на 40%
            if (audioFeatures.bassEnergy > energyAverage * 1.4 + 0.15 && (currentTime - lastBeatTime) > 200) {
                audioFeatures.isBeat = true;
                lastBeatTime = currentTime;
                currentPulseIntensity = 1.0;
                beatCooldown = 8;
            }
        } else {
            beatCooldown--;
        }
    }

    function updatePulseIntensity() {
        if (currentPulseIntensity > 0) {
            currentPulseIntensity -= 0.08;
            if (currentPulseIntensity < 0) currentPulseIntensity = 0;
        }
    }

    // ==========================================
    // 4. UI ФУНКЦИИ
    // ==========================================

    function updateTheme() {
        if (!currentTracks || currentTracks.length === 0) return;
        
        const track = currentTracks[currentTrackIndex];
        const colors = track.colors;
        
        // CSS Переменные
        document.documentElement.style.setProperty('--accent-color', colors.accent);
        document.documentElement.style.setProperty('--neon-color', track.neonColor);
        
        document.body.style.setProperty('--bg-image', `url('${track.cover}')`);
        document.body.style.setProperty('--panel-bg-color', adjustColorOpacity(colors.primary, 0.85));
        document.body.style.setProperty('--panel-border-color', colors.accent);
        
        // Градиенты
        progress.style.background = `linear-gradient(90deg, ${colors.accent}, ${colors.primary})`;
        playPauseBtn.style.background = `linear-gradient(135deg, ${colors.accent}, ${colors.primary})`;
        
        // Слайдер громкости
        updateVolumeSlider();
        
        // Обложка
        albumImage.style.backgroundImage = `url('${track.cover}')`;
        
        // Сброс частиц
        createParticles();
        
        // Очистка субтитров
        lyricsDisplay.textContent = '';
        lyricsDisplay.className = 'lyrics-container';
        
        // Сброс волн
        energySurgeActive = false;
        const waves = document.querySelectorAll('.energy-wave');
        waves.forEach(w => { w.style.opacity = 0; });
        
        // Обновление списка (выделение активного)
        if (isTrackListOpen) renderTrackList();
    }

    function renderTrackList() {
        trackList.innerHTML = '';
        if (!currentTracks || currentTracks.length === 0) {
            trackList.innerHTML = '<div style="padding:20px; text-align:center">Плейлист пуст</div>';
            return;
        }

        const isUserPlaylist = !!userPlaylists[currentPlaylistName];

        currentTracks.forEach((track, index) => {
            const isActive = index === currentTrackIndex;
            const item = document.createElement('div');
            item.className = `track-item ${isActive ? 'active' : ''}`;
            
            // Расчет прогресса для списка
            let progressWidth = 0;
            if (isActive && audio.duration) {
                progressWidth = (audio.currentTime / audio.duration) * 100;
            }

            item.innerHTML = `
                <div class="track-item-cover" style="background-image: url('${track.cover}')"></div>
                <div class="track-item-info">
                    <div class="track-item-title">${track.name}</div>
                    <div class="track-item-artist">${track.artist}</div>
                    <div class="track-item-progress">
                        <div class="track-item-progress-bar" style="width: ${progressWidth}%"></div>
                    </div>
                </div>
                ${isActive ? '<div class="now-playing-icon">▶</div>' : ''}
            `;
            
            // Клик по треку
            item.addEventListener('click', () => loadTrack(index, true));
            trackList.appendChild(item);
        });
    }

    // ==========================================
    // 5. HELPER FUNCTIONS (ОСТАЛЬНЫЕ)
    // ==========================================

    function getAllPlaylists() {
        const combined = { ...playlists, ...userPlaylists };
        if (uploadedTracks.length > 0) combined["Мои загрузки"] = uploadedTracks;
        return combined;
    }

    function adjustColorOpacity(hex, opacity) {
        if (!hex) return `rgba(255,255,255,${opacity})`;
        let r=0, g=0, b=0;
        if (hex.length === 4) {
            r = "0x" + hex[1] + hex[1]; g = "0x" + hex[2] + hex[2]; b = "0x" + hex[3] + hex[3];
        } else if (hex.length === 7) {
            r = "0x" + hex[1] + hex[2]; g = "0x" + hex[3] + hex[4]; b = "0x" + hex[5] + hex[6];
        }
        return "rgba("+ +r + "," + +g + "," + +b + "," + opacity + ")";
    }

    function formatTime(s) {
        if(isNaN(s)) return '0:00';
        const m = Math.floor(s/60);
        const sec = Math.floor(s%60);
        return `${m}:${sec<10?'0':''}${sec}`;
    }

    function populatePlaylistSelector() {
        playlistOptions.innerHTML = '';
        currentPlaylistText.textContent = currentPlaylistName;
        const all = getAllPlaylists();
        for (const name in all) {
            const opt = document.createElement('div');
            opt.className = 'custom-option';
            opt.textContent = name;
            if(name === currentPlaylistName) opt.classList.add('selected');
            opt.addEventListener('click', () => {
                switchPlaylist(name);
                customSelectContainer.classList.remove('open');
                populatePlaylistSelector();
            });
            playlistOptions.appendChild(opt);
        }
    }

    function toggleTrackList() {
        isTrackListOpen = !isTrackListOpen;
        if (isTrackListOpen) {
            playerContainer.classList.add('shifted');
            trackListPanel.classList.add('active');
            renderTrackList();
        } else {
            playerContainer.classList.remove('shifted');
            trackListPanel.classList.remove('active');
        }
    }

    function toggleLiteMode() {
        isLiteMode = !isLiteMode;
        localStorage.setItem('isLiteMode', isLiteMode);
        if (isLiteMode) {
            document.body.classList.add('lite-mode');
            liteModeBtn.classList.add('active');
            particles.innerHTML = '';
        } else {
            document.body.classList.remove('lite-mode');
            liteModeBtn.classList.remove('active');
            createParticles();
        }
    }

    function updateVolumeSlider() {
        const val = volumeSlider.value;
        const color = currentTracks.length ? currentTracks[currentTrackIndex].colors.accent : '#fff';
        volumeSlider.style.background = `linear-gradient(to right, ${color} 0%, ${color} ${val}%, rgba(255,255,255,0.1) ${val}%, rgba(255,255,255,0.1) 100%)`;
    }

    // Генерация визуальных элементов
    function createVisualizer() {
        visualizer.innerHTML = '';
        visualizerBars = [];
        for (let i = 0; i < 30; i++) {
            const bar = document.createElement('div');
            bar.className = 'visualizer-bar';
            visualizer.appendChild(bar);
            visualizerBars.push(bar);
        }
    }

    function createParticles() {
        particles.innerHTML = '';
        particlesData = [];
        if (isLiteMode) return;
        const count = 15;
        for(let i=0; i<count; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            particles.appendChild(p);
            particlesData.push({
                element: p,
                baseLeft: Math.random() * 100,
                baseTop: Math.random() * 100,
                size: Math.random() * 10 + 5
            });
        }
        updateParticlesMovement({rms:0, bassEnergy:0, midEnergy:0, highEnergy:0});
    }

    function createEdgeGlow() {
        const edges = ['top', 'right', 'bottom', 'left'];
        const container = document.getElementById('edgeGlow');
        edges.forEach(edge => {
            const d = document.createElement('div');
            d.className = `edge-glow ${edge}-glow`;
            container.appendChild(d);
            edgeGlowElements[edge] = d;
        });
    }

    // Эффекты частиц и волн (упрощенные для надежности)
    function updateParticlesMovement(f) {
        if(particlesData.length === 0) return;
        const color = currentTracks[currentTrackIndex]?.colors.accent || '#fff';
        particlesData.forEach((p, i) => {
            const move = (f.bassEnergy || 0) * 20; 
            p.element.style.left = `${p.baseLeft + Math.sin(Date.now()*0.001 + i)*move}vw`;
            p.element.style.top = `${p.baseTop + Math.cos(Date.now()*0.001 + i)*move}vh`;
            p.element.style.width = `${p.size + (f.bassEnergy||0)*10}px`;
            p.element.style.height = p.element.style.width;
            p.element.style.background = color;
            p.element.style.opacity = 0.3 + (f.rms||0);
        });
    }

    function updateSparkParticles() { /* Заглушка для стабильности */ }
    function updateEnergySurge() { /* Заглушка для стабильности */ }
    function updateEdgeGlow() { /* Заглушка для стабильности */ }
    function analyzeEdgeEffects() { /* Заглушка для стабильности */ }

    // ==========================================
    // 6. LISTENERS (СОБЫТИЯ)
    // ==========================================

    playPauseBtn.addEventListener('click', () => {
        if (isPlaying) {
            audio.pause();
            isPlaying = false;
            playPauseBtn.querySelector('svg').innerHTML = '<path d="M8 5v14l11-7z"/>';
            if(animationId) cancelAnimationFrame(animationId);
        } else {
            playTrack();
        }
    });

    prevBtn.addEventListener('click', () => {
        let index = currentTrackIndex - 1;
        loadTrack(index, true);
    });

    nextBtn.addEventListener('click', () => {
        let index = currentTrackIndex + 1;
        loadTrack(index, true);
    });

    audio.addEventListener('timeupdate', updateProgress);
    
    audio.addEventListener('ended', () => {
        let index = currentTrackIndex + 1;
        loadTrack(index, true);
    });

    // Клик по прогресс бару
    progressBar.addEventListener('click', (e) => {
        if (audio.duration) {
            const rect = progressBar.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const width = rect.width;
            audio.currentTime = (clickX / width) * audio.duration;
        }
    });

    // Кнопки управления плейлистом
    trackListBtn.addEventListener('click', toggleTrackList);
    playlistTrigger.addEventListener('click', (e) => { 
        e.stopPropagation(); 
        customSelectContainer.classList.toggle('open'); 
    });
    document.addEventListener('click', (e) => {
        if(!customSelectContainer.contains(e.target)) customSelectContainer.classList.remove('open');
    });

    // Клавиши
    document.addEventListener('keydown', (e) => {
        if(e.target.tagName === 'INPUT') return;
        if(e.key === ' ') { e.preventDefault(); playPauseBtn.click(); }
        if(e.key === 'ArrowRight') audio.currentTime += 5;
        if(e.key === 'ArrowLeft') audio.currentTime -= 5;
        if(e.key.toLowerCase() === 'l') toggleLiteMode();
    });

    liteModeBtn.addEventListener('click', toggleLiteMode);
    volumeSlider.addEventListener('input', () => {
        audio.volume = volumeSlider.value / 100;
        updateVolumeSlider();
    });

    // ==========================================
    // 7. ИНИЦИАЛИЗАЦИЯ
    // ==========================================
    populatePlaylistSelector();
    createVisualizer();
    createParticles();
    createEdgeGlow();
    updateVolumeSlider();
    
    if (isLiteMode) {
        document.body.classList.add('lite-mode');
        liteModeBtn.classList.add('active');
    }

    // Загружаем первый трек
    if(currentTracks && currentTracks.length > 0) {
        loadTrack(0, false);
    } else {
        // Если массив пуст, пробуем загрузить "Все треки"
        switchPlaylist("Все треки");
    }
});

// Скрытие прелоадера
window.addEventListener('load', function() { 
    const preloader = document.getElementById('preloader'); 
    if(preloader) {
        setTimeout(() => { 
            preloader.classList.add('hide'); 
            setTimeout(() => { preloader.remove(); }, 500); 
        }, 800); 
    }
});
