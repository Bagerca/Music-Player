import { state } from './state.js';
import * as UI from './ui.js';
import { startVisualizer, stopVisualizer } from './visualizer.js';

export const audio = document.getElementById('audioPlayer');
export let audioContext;
export let analyser;
export let dataArray;
export let bufferLength;
let audioSource;

export function initAudioContext() {
    if (audioContext) {
        if (audioContext.state === 'suspended') audioContext.resume();
        return;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContext();
    analyser = audioContext.createAnalyser();
    
    if (!audioSource) {
        audioSource = audioContext.createMediaElementSource(audio);
        audioSource.connect(analyser);
        analyser.connect(audioContext.destination);
    }
    
    analyser.fftSize = 256;
    bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
}

export function playTrack() {
    if (!state.playbackList.length) return;
    initAudioContext();
    
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
        playPromise.then(() => {
            // Успешный старт
            state.isPlaying = true;
            UI.updatePlayPauseIcon(true);
            UI.updateFavicon(true); // Включаем анимацию
            startVisualizer();
        }).catch(err => {
            // ОБРАБОТКА ОШИБОК
            
            // AbortError возникает, если быстро переключать треки.
            // В этом случае мы НЕ должны сбрасывать UI, так как следующий трек уже грузится.
            if (err.name === 'AbortError') {
                return; 
            }

            // Реальная ошибка
            console.error("Playback failed", err);
            state.isPlaying = false;
            UI.updatePlayPauseIcon(false);
            UI.updateFavicon(false); // Выключаем анимацию
            stopVisualizer();
        });
    }
}

export function pauseTrack() {
    audio.pause();
    state.isPlaying = false;
    UI.updatePlayPauseIcon(false);
    UI.updateFavicon(false); // Выключаем анимацию
    stopVisualizer();
}

export function togglePlay() {
    state.isPlaying ? pauseTrack() : playTrack();
}

export function loadTrack(index, autoPlay = false) {
    if (!state.playbackList || index < 0 || index >= state.playbackList.length) return;
    
    state.playbackIndex = index;
    const track = state.playbackList[index];
    
    // Важный момент: не вызываем pauseTrack() здесь, чтобы не триггерить лишние события UI
    audio.pause(); 
    state.isPlaying = false;
    
    audio.src = track.path;
    audio.load();
    
    UI.updateTrackInfo(track);
    UI.loadLyrics(track);
    UI.updateTheme(track);

    if (autoPlay) {
        // Небольшая задержка, чтобы браузер успел подгрузить метаданные
        const playAttempt = setTimeout(() => {
            playTrack();
        }, 150); 
    } else {
        // Если автоплея нет (ручная загрузка), сбрасываем иконку в статику
        UI.updatePlayPauseIcon(false);
        UI.updateFavicon(false);
    }
}
