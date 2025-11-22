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

    // --- ГРОМКОСТЬ ---
    const volSlider = document.getElementById('volumeSlider');
    const volIcon = document.getElementById('volumeIcon');
    
    const updateVolumeVisuals = (val) => {
        // Обновляем ширину закрашенной части (background-size)
        volSlider.style.backgroundSize = `${val}% 100%`;
        AudioCore.audio.volume = val / 100;
        
        // Меняем иконку если звук 0 (Mute) или > 0
        if(val == 0) {
            volIcon.innerHTML = '<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>';
            volIcon.style.fill = 'rgba(255,255,255,0.4)';
        } else {
            volIcon.innerHTML = '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>';
            volIcon.style.fill = 'rgba(255,255,255,0.7)';
        }
    };

    // Инициализация при старте
    updateVolumeVisuals(volSlider.value);

    // Обработчик движения ползунка
    volSlider.oninput = (e) => {
        updateVolumeVisuals(e.target.value);
    };

    // Клик по иконке (Mute/Unmute)
    document.getElementById('muteBtn').onclick = () => {
        if (AudioCore.audio.volume > 0) {
            volSlider.dataset.prevVol = volSlider.value;
            volSlider.value = 0;
        } else {
            volSlider.value = volSlider.dataset.prevVol || 70;
        }
        updateVolumeVisuals(volSlider.value);
    };

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
        // УБРАНО: document.getElementById('playerContainer').classList.toggle('shifted');
        // Теперь плеер остается на месте
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
