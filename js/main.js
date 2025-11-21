import { state, saveUserPlaylists, PLAYBACK_MODES } from './state.js';
import { getAllPlaylists } from './data.js';
import * as AudioCore from './audio.js';
import * as UI from './ui.js';
import * as Vis from './visualizer.js';

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    const allPlaylists = getAllPlaylists(state.userPlaylists, state.uploadedTracks);
    state.currentTracks = allPlaylists[state.currentPlaylistName];

    Vis.initVisualizerDOM();
    Vis.createParticles();
    
    if (state.currentTracks.length) {
        AudioCore.loadTrack(0);
    }
    
    setupEventListeners();
    
    // Скрываем прелоадер
    setTimeout(() => {
        const pre = document.getElementById('preloader');
        pre.classList.add('hide');
        setTimeout(() => pre.remove(), 500);
    }, 500);
});

function setupEventListeners() {
    // Аудио управление
    document.getElementById('playPauseBtn').onclick = AudioCore.togglePlay;
    document.getElementById('prevBtn').onclick = () => changeTrack(-1);
    document.getElementById('nextBtn').onclick = () => changeTrack(1);
    
    // Прогресс бар (клик)
    document.getElementById('progressBar').onclick = (e) => {
        const width = e.currentTarget.clientWidth;
        const clickX = e.offsetX;
        const duration = AudioCore.audio.duration;
        AudioCore.audio.currentTime = (clickX / width) * duration;
    };

    AudioCore.audio.addEventListener('timeupdate', UI.updateProgress);
    AudioCore.audio.addEventListener('ended', () => {
        if (state.playbackMode === PLAYBACK_MODES.ONCE) return;
        changeTrack(1);
    });

    // Громкость
    const volSlider = document.getElementById('volumeSlider');
    volSlider.oninput = () => AudioCore.audio.volume = volSlider.value / 100;

    // Клавиши
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT') return;
        if (e.code === 'Space') { e.preventDefault(); AudioCore.togglePlay(); }
        if (e.code === 'ArrowRight') AudioCore.audio.currentTime += 5;
        if (e.code === 'ArrowLeft') AudioCore.audio.currentTime -= 5;
        if (e.code === 'KeyL') toggleLiteMode();
    });

    // Плейлисты (открытие списка)
    document.getElementById('trackListBtn').onclick = () => {
        document.getElementById('playerContainer').classList.toggle('shifted');
        document.getElementById('trackListPanel').classList.toggle('active');
    };

    // Поиск
    document.getElementById('trackSearch').oninput = (e) => {
        const val = e.target.value.toLowerCase();
        const filtered = state.currentTracks.filter(t => 
            t.name.toLowerCase().includes(val) || t.artist.toLowerCase().includes(val)
        );
        UI.renderTrackList(filtered);
    };
}

function changeTrack(direction) {
    let newIndex = state.currentTrackIndex + direction;
    if (newIndex >= state.currentTracks.length) newIndex = 0;
    if (newIndex < 0) newIndex = state.currentTracks.length - 1;
    AudioCore.loadTrack(newIndex, true);
}

function toggleLiteMode() {
    state.isLiteMode = !state.isLiteMode;
    localStorage.setItem('isLiteMode', state.isLiteMode);
    document.body.classList.toggle('lite-mode', state.isLiteMode);
    document.getElementById('liteModeBtn').classList.toggle('active', state.isLiteMode);
    Vis.createParticles(); // Пересоздать (или очистить) частицы
}
