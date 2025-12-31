import { state } from './state.js';
import * as UI from './ui.js';
import { startVisualizer, stopVisualizer } from './visualizer.js';

export const audio = document.getElementById('audioPlayer');
export let audioContext;
export let analyser;
export let dataArray;
export let bufferLength;

let audioSource;

// Узлы нашей "студии мастеринга"
let hpFilter;       // Убирает гул (High-Pass)
let hfShelf;        // Добавляет яркость (High-Shelf)
let preGain;        // Разгоняет громкость перед компрессией
let compressor;     // Выравнивает пики (авто-громкость)
let postGain;       // Финальная коррекция громкости (Output Level)

export function initAudioContext() {
    if (audioContext) {
        if (audioContext.state === 'suspended') audioContext.resume();
        return;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContext();
    
    // --- 1. СОЗДАНИЕ УЗЛОВ ---
    analyser = audioContext.createAnalyser();
    
    // А) Фильтр низких частот (High-Pass)
    hpFilter = audioContext.createBiquadFilter();
    hpFilter.type = 'highpass';
    hpFilter.frequency.value = 35; 
    hpFilter.Q.value = 0.7;

    // Б) Эквалайзер высоких частот (High-Shelf)
    hfShelf = audioContext.createBiquadFilter();
    hfShelf.type = 'highshelf';
    hfShelf.frequency.value = 10000; 
    hfShelf.gain.value = 2.0;

    // В) Предусилитель (Pre-Gain)
    // Снизил до 1.2, чтобы входной сигнал был чище
    preGain = audioContext.createGain();
    preGain.gain.value = 1.2; 

    // Г) Умный Компрессор (Mastering Compressor)
    compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.value = -20; 
    compressor.knee.value = 20;       
    compressor.ratio.value = 5;       
    compressor.attack.value = 0.01;   
    compressor.release.value = 0.15;  

    // Д) Пост-усиление (Output Volume)
    // ВАЖНО: Снизил с 0.85 до 0.4. Теперь дефолтная громкость будет тихой и комфортной.
    postGain = audioContext.createGain();
    postGain.gain.value = 0.4;

    // --- 2. НАСТРОЙКА АНАЛИЗАТОРА ---
    analyser.fftSize = 256;
    bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
    
    // --- 3. ЦЕПОЧКА ПОДКЛЮЧЕНИЯ ---
    // Source -> HP Filter -> HF Shelf -> PreGain -> Compressor -> PostGain -> Analyser -> Output
    
    if (!audioSource) {
        audioSource = audioContext.createMediaElementSource(audio);
        
        audioSource.connect(hpFilter);      // 1. Чистим бас
        hpFilter.connect(hfShelf);          // 2. Добавляем блеск
        hfShelf.connect(preGain);           // 3. Подготавливаем уровень
        preGain.connect(compressor);        // 4. Выравниваем (авто-левелинг)
        compressor.connect(postGain);       // 5. Задаем ТИХУЮ громкость
        postGain.connect(analyser);         // 6. Визуализируем готовый звук
        analyser.connect(audioContext.destination); // 7. Выводим в колонки
    }
}

export function playTrack() {
    if (!state.playbackList.length) return;
    initAudioContext();
    
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
        playPromise.then(() => {
            state.isPlaying = true;
            UI.updatePlayPauseIcon(true);
            startVisualizer();
        }).catch(err => {
            if (err.name === 'AbortError') return;
            console.error("Playback failed", err);
            state.isPlaying = false;
            UI.updatePlayPauseIcon(false);
            stopVisualizer();
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
    if (!state.playbackList || index < 0 || index >= state.playbackList.length) return;
    
    state.playbackIndex = index;
    const track = state.playbackList[index];
    
    audio.pause(); 
    state.isPlaying = false;
    
    audio.src = track.path;
    audio.load();

    UI.updateTrackInfo(track);
    UI.loadLyrics(track);
    UI.updateTheme(track); 

    if (autoPlay) {
        setTimeout(() => playTrack(), 150); 
    } else {
        UI.updatePlayPauseIcon(false);
    }
}