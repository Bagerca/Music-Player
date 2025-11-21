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
    if (!state.currentTracks.length) return;
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

export function loadTrack(index, autoPlay = false) {
    if (!state.currentTracks || index < 0 || index >= state.currentTracks.length) return;
    
    state.currentTrackIndex = index;
    const track = state.currentTracks[index];
    
    // Сброс
    pauseTrack();
    audio.src = track.path;
    audio.load();
    
    UI.updateTrackInfo(track);
    UI.loadLyrics(track); // Загрузка субтитров
    UI.updateTheme(track);

    if (autoPlay) {
        // Небольшая задержка для уверенности
        setTimeout(() => playTrack(), 100);
    }
}
