import { state, saveUserPlaylists, PLAYBACK_MODES } from './state.js';
import { getAllPlaylists } from './data.js';
import * as AudioCore from './audio.js';
import * as UI from './ui.js';
import * as Vis from './visualizer.js';

document.addEventListener('DOMContentLoaded', () => {
    const allPlaylists = getAllPlaylists(state.userPlaylists, state.uploadedTracks);
    state.currentTracks = allPlaylists[state.currentPlaylistName] || allPlaylists["Все треки"];

    Vis.initVisualizerDOM();
    
    if (state.currentTracks.length) {
        AudioCore.loadTrack(0);
    }
    
    UI.renderPlaylistSelector();
    UI.renderTrackList();
    setupEventListeners();
    
    setTimeout(() => {
        const pre = document.getElementById('preloader');
        pre.classList.add('hide');
        setTimeout(() => pre.remove(), 500);
    }, 500);
});

function setupEventListeners() {
    // --- АУДИО ---
    document.getElementById('playPauseBtn').onclick = AudioCore.togglePlay;
    document.getElementById('prevBtn').onclick = () => changeTrack(-1);
    document.getElementById('nextBtn').onclick = () => changeTrack(1);
    document.getElementById('progressBar').onclick = (e) => {
        const width = e.currentTarget.clientWidth;
        const duration = AudioCore.audio.duration;
        AudioCore.audio.currentTime = (e.offsetX / width) * duration;
    };
    AudioCore.audio.addEventListener('timeupdate', UI.updateProgress);
    AudioCore.audio.addEventListener('ended', () => {
        if (state.playbackMode === PLAYBACK_MODES.ONCE) return;
        changeTrack(1);
    });

    // --- КОНТЕКСТНОЕ МЕНЮ И ЕГО ДЕЙСТВИЯ ---
    
    // 1. Закрытие меню при клике в любом месте
    document.addEventListener('click', (e) => {
        const menu = document.getElementById('contextMenu');
        if (!menu.contains(e.target)) {
            menu.classList.remove('active');
        }
    });

    // 2. Добавить в плейлист
    document.getElementById('ctxAddToPlaylist').onclick = () => {
        showAddToPlaylistModal();
        document.getElementById('contextMenu').classList.remove('active');
    };

    // 3. Скачать
    document.getElementById('ctxDownload').onclick = () => {
        downloadCurrentContextTrack();
        document.getElementById('contextMenu').classList.remove('active');
    };

    // 4. Удалить из плейлиста
    document.getElementById('ctxRemoveFromPlaylist').onclick = () => {
        removeTrackFromCurrentPlaylist();
        document.getElementById('contextMenu').classList.remove('active');
    };

    // 5. Модалка добавления
    document.getElementById('closeAddToPlaylistBtn').onclick = () => {
        document.getElementById('addToPlaylistModal').classList.remove('active');
    };

    // --- ГРОМКОСТЬ ---
    const volSlider = document.getElementById('volumeSlider');
    const updateVolume = (val) => {
        volSlider.style.backgroundSize = `${val}% 100%`;
        AudioCore.audio.volume = val / 100;
    };
    updateVolume(volSlider.value);
    volSlider.oninput = (e) => updateVolume(e.target.value);
    document.getElementById('muteBtn').onclick = () => {
        if (AudioCore.audio.volume > 0) {
            volSlider.dataset.prev = volSlider.value;
            volSlider.value = 0;
        } else {
            volSlider.value = volSlider.dataset.prev || 70;
        }
        updateVolume(volSlider.value);
    };
    
    // --- ПАНЕЛЬ И ПЛЕЙЛИСТЫ ---
    document.getElementById('trackListBtn').onclick = () => document.getElementById('trackListPanel').classList.toggle('active');
    document.getElementById('playlistTrigger').onclick = UI.togglePlaylistSelect;

    const modalOverlay = document.getElementById('modalOverlay');
    document.getElementById('createPlaylistBtn').onclick = () => {
        modalOverlay.classList.add('active');
        document.getElementById('newPlaylistName').focus();
    };
    document.getElementById('closeModalBtn').onclick = () => modalOverlay.classList.remove('active');
    document.getElementById('confirmPlaylistBtn').onclick = createNewPlaylist;
    document.getElementById('deletePlaylistBtn').onclick = deleteCurrentPlaylist;
    document.getElementById('uploadTrackBtn').onclick = () => document.getElementById('fileInput').click();
    document.getElementById('fileInput').onchange = handleFileUpload;

    // --- ПОИСК ---
    document.getElementById('trackSearch').oninput = (e) => {
        const val = e.target.value.toLowerCase();
        const filtered = state.currentTracks.filter(t => 
            t.name.toLowerCase().includes(val) || t.artist.toLowerCase().includes(val)
        );
        UI.renderTrackList(filtered);
    };

    // --- КЛАВИШИ ---
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT') return;
        if (e.code === 'Space') { e.preventDefault(); AudioCore.togglePlay(); }
        if (e.code === 'KeyL') toggleLiteMode();
    });
}

/* --- ФУНКЦИИ ЛОГИКИ --- */

function changeTrack(direction) {
    let newIndex = state.currentTrackIndex + direction;
    if (newIndex >= state.currentTracks.length) newIndex = 0;
    if (newIndex < 0) newIndex = state.currentTracks.length - 1;
    AudioCore.loadTrack(newIndex, true);
}

function showAddToPlaylistModal() {
    const list = document.getElementById('addToPlaylistOptions');
    list.innerHTML = '';
    const userPlaylistNames = Object.keys(state.userPlaylists);
    
    if (userPlaylistNames.length === 0) {
        list.innerHTML = '<div style="color:#aaa; text-align:center;">У вас нет своих плейлистов</div>';
    } else {
        userPlaylistNames.forEach(name => {
            const btn = document.createElement('div');
            btn.className = 'playlist-option-btn';
            btn.textContent = name;
            btn.onclick = () => {
                addTrackToPlaylist(name);
                document.getElementById('addToPlaylistModal').classList.remove('active');
            };
            list.appendChild(btn);
        });
    }
    document.getElementById('addToPlaylistModal').classList.add('active');
}

function addTrackToPlaylist(playlistName) {
    const track = state.currentTracks[state.contextTrackIndex];
    if (!state.userPlaylists[playlistName]) return;
    
    const exists = state.userPlaylists[playlistName].find(t => t.path === track.path);
    if (exists) {
        alert(`Трек уже есть в плейлисте "${playlistName}"`);
        return;
    }
    
    state.userPlaylists[playlistName].push(track);
    saveUserPlaylists();
    alert(`Трек добавлен в "${playlistName}"`);
}

function downloadCurrentContextTrack() {
    const track = state.currentTracks[state.contextTrackIndex];
    const a = document.createElement('a');
    a.href = track.path;
    a.download = `${track.artist} - ${track.name}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function removeTrackFromCurrentPlaylist() {
    const playlistName = state.currentPlaylistName;
    state.userPlaylists[playlistName].splice(state.contextTrackIndex, 1);
    saveUserPlaylists();
    UI.switchPlaylist(playlistName);
}

function createNewPlaylist() {
    const input = document.getElementById('newPlaylistName');
    const name = input.value.trim();
    if (!name) return;
    const allLists = getAllPlaylists(state.userPlaylists, state.uploadedTracks);
    if (allLists[name]) {
        alert('Плейлист с таким именем уже существует!');
        return;
    }
    state.userPlaylists[name] = [];
    saveUserPlaylists();
    input.value = '';
    document.getElementById('modalOverlay').classList.remove('active');
    UI.switchPlaylist(name);
}

function deleteCurrentPlaylist() {
    const name = state.currentPlaylistName;
    if (!confirm(`Удалить плейлист "${name}"?`)) return;
    delete state.userPlaylists[name];
    saveUserPlaylists();
    UI.switchPlaylist("Все треки");
}

function handleFileUpload(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    let addedCount = 0;
    files.forEach(file => {
        const objectUrl = URL.createObjectURL(file);
        const hue = Math.floor(Math.random() * 360);
        const randomColor = `hsl(${hue}, 80%, 60%)`;
        const randomBg = `hsl(${hue}, 60%, 10%)`;
        const newTrack = {
            name: file.name.replace(/\.[^/.]+$/, ""),
            artist: 'Local Upload',
            path: objectUrl,
            cover: 'picture/default_cover.jpg',
            colors: { primary: '#1a1a2e', secondary: randomBg, accent: randomColor },
            neonColor: randomColor,
            visualizer: [randomColor, '#ffffff', randomColor]
        };
        state.uploadedTracks.push(newTrack);
        const currentName = state.currentPlaylistName;
        const isSystem = ["Все треки", "Энергичные", "Chill & Retro", "Мои загрузки"].includes(currentName);
        if (!isSystem && state.userPlaylists[currentName]) {
            state.userPlaylists[currentName].push(newTrack);
            saveUserPlaylists();
        }
        addedCount++;
    });
    e.target.value = '';
    if (addedCount > 0) {
        UI.renderPlaylistSelector();
        UI.switchPlaylist(state.currentPlaylistName);
    }
}

function toggleLiteMode() {
    state.isLiteMode = !state.isLiteMode;
    localStorage.setItem('isLiteMode', state.isLiteMode);
    document.body.classList.toggle('lite-mode', state.isLiteMode);
    document.getElementById('liteModeBtn').classList.toggle('active', state.isLiteMode);
}
