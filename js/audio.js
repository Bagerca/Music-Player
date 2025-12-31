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
let hpFilter;       // Убирает гул
let hfShelf;        // Добавляет яркость старым трекам
let preGain;        // Разгоняет громкость
let compressor;     // Выравнивает пики
let postGain;       // Финальная коррекция

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
    // Срезаем всё ниже 35Hz. Это дает компрессору "дышать", басы станут четче.
    hpFilter = audioContext.createBiquadFilter();
    hpFilter.type = 'highpass';
    hpFilter.frequency.value = 35; 
    hpFilter.Q.value = 0.7;

    // Б) Эквалайзер высоких частот (High-Shelf)
    // Чуть-чуть поднимаем верха (+2.5dB), чтобы старые записи звучали ярче и чище.
    hfShelf = audioContext.createBiquadFilter();
    hfShelf.type = 'highshelf';
    hfShelf.frequency.value = 10000; // От 10кГц и выше
    hfShelf.gain.value = 2.5;

    // В) Предусилитель (Pre-Gain)
    // Усиливаем сигнал перед компрессией, но аккуратнее (x2, а не x3).
    preGain = audioContext.createGain();
    preGain.gain.value = 2.0; 

    // Г) Умный Компрессор (The Glue)
    compressor = audioContext.createDynamicsCompressor();
    // Порог срабатывания: сжимаем всё, что громче -24dB
    compressor.threshold.value = -24; 
    // "Колено": плавный вход в компрессию (звучит мягче)
    compressor.knee.value = 20; 
    // Степень сжатия: 6 к 1. Достаточно плотно, но динамика живая.
    compressor.ratio.value = 6; 
    // Атака: 0.01 сек. Пропускает удар барабана, потом сжимает. Сохраняет панч.
    compressor.attack.value = 0.01; 
    // Релиз: 0.15 сек. Быстро возвращает громкость после пика.
    compressor.release.value = 0.15;

    // Д) Пост-усиление (Makeup Gain)
    // Компенсируем то, что "съел" компрессор.
    postGain = audioContext.createGain();
    postGain.gain.value = 1.3;

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
        hfShelf.connect(preGain);           // 3. Разгоняем
        preGain.connect(compressor);        // 4. Сжимаем (ровняем)
        compressor.connect(postGain);       // 5. Компенсируем
        postGain.connect(analyser);         // 6. Визуализируем готовый звук
        analyser.connect(audioContext.destination); // 7. На выход
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