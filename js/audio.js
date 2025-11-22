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
    // Важно: используем playbackList
    if (!state.playbackList.length) return;
    initAudioContext();
    
    const playPromise = audio.play();
    if (playPromise !== undefined) {
        playPromise.then(() => {
            state.isPlaying = true;
            UI.updatePlayPauseIcon(true);
            startVisualizer();
        }).catch(err => {
            console.error("Playback failed", err);
            state.isPlaying = false;
            UI.updatePlayPauseIcon(false);
        });
    }
}

export function pauseTrack() {
    audio.pause();
    state.isPlaying = false;
    UI.updatePlayPauseIcon(false);
    stopVisualizer();
}

export function togglePlay() {
    state.isPlaying ? pauseTrack() : playTrack();
}

// Загружает трек по индексу из playbackList
export function loadTrack(index, autoPlay = false) {
    if (!state.playbackList || index < 0 || index >= state.playbackList.length) return;
    
    state.playbackIndex = index;
    const track = state.playbackList[index];
    
    // Сброс
    pauseTrack();
    audio.src = track.path;
    audio.load();
    
    // Обновляем UI плеера (левая часть)
    UI.updateTrackInfo(track);
    UI.loadLyrics(track);
    UI.updateTheme(track);

    if (autoPlay) {
        setTimeout(() => playTrack(), 100);
    }
}
