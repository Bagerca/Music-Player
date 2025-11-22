import { state, saveUserPlaylists, PLAYBACK_MODES } from './state.js';
import { getAllPlaylists } from './data.js';
import * as AudioCore from './audio.js';
import * as UI from './ui.js';
import * as Vis from './visualizer.js';

document.addEventListener('DOMContentLoaded', () => {
    // Инициализация плейлистов
    const allPlaylists = getAllPlaylists(state.userPlaylists, state.uploadedTracks);
    state.currentTracks = allPlaylists[state.currentPlaylistName] || allPlaylists["Все треки"];

    // Визуализатор
    Vis.initVisualizerDOM();
    
    // Загрузка первого трека
    if (state.currentTracks.length) {
        AudioCore.loadTrack(0);
    }
    
    // Рендер UI
    UI.renderPlaylistSelector();
    UI.renderTrackList();

    setupEventListeners();
    
    // Скрываем прелоадер
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

    // --- ПЛЕЙЛИСТЫ И ПАНЕЛЬ ---
    document.getElementById('trackListBtn').onclick = () => {
        document.getElementById('trackListPanel').classList.toggle('active');
    };

    document.getElementById('playlistTrigger').onclick = UI.togglePlaylistSelect;

    // Создание плейлиста
    const modalOverlay = document.getElementById('modalOverlay');
    document.getElementById('createPlaylistBtn').onclick = () => {
        modalOverlay.classList.add('active');
        document.getElementById('newPlaylistName').focus();
    };
    document.getElementById('closeModalBtn').onclick = () => modalOverlay.classList.remove('active');
    document.getElementById('confirmPlaylistBtn').onclick = createNewPlaylist;

    // Удаление плейлиста
    document.getElementById('deletePlaylistBtn').onclick = deleteCurrentPlaylist;

    // Загрузка треков
    document.getElementById('uploadTrackBtn').onclick = () => document.getElementById('fileInput').click();
    document.getElementById('fileInput').onchange = handleFileUpload;

    // Поиск
    document.getElementById('trackSearch').oninput = (e) => {
        const val = e.target.value.toLowerCase();
        const filtered = state.currentTracks.filter(t => 
            t.name.toLowerCase().includes(val) || t.artist.toLowerCase().includes(val)
        );
        UI.renderTrackList(filtered);
    };

    // Клавиши
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT') return;
        if (e.code === 'Space') { e.preventDefault(); AudioCore.togglePlay(); }
        if (e.code === 'KeyL') toggleLiteMode();
    });
}

// --- ЛОГИКА ФУНКЦИЙ ---

function changeTrack(direction) {
    let newIndex = state.currentTrackIndex + direction;
    if (newIndex >= state.currentTracks.length) newIndex = 0;
    if (newIndex < 0) newIndex = state.currentTracks.length - 1;
    AudioCore.loadTrack(newIndex, true);
}

function createNewPlaylist() {
    const input = document.getElementById('newPlaylistName');
    const name = input.value.trim();
    const modalOverlay = document.getElementById('modalOverlay');

    if (!name) return;
    const allLists = getAllPlaylists(state.userPlaylists, state.uploadedTracks);
    if (allLists[name]) {
        alert('Плейлист с таким именем уже существует!');
        return;
    }

    state.userPlaylists[name] = [];
    saveUserPlaylists();
    
    input.value = '';
    modalOverlay.classList.remove('active');
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
            cover: 'picture/default_cover.jpg', // Убедись что эта картинка есть, или замени на любую
            colors: { primary: '#1a1a2e', secondary: randomBg, accent: randomColor },
            neonColor: randomColor,
            visualizer: [randomColor, '#ffffff', randomColor]
        };

        state.uploadedTracks.push(newTrack);
        
        // Добавляем в текущий пользовательский плейлист
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
