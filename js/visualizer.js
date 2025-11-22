import { state } from './state.js';
import { analyser, dataArray, bufferLength } from './audio.js';
import { audio } from './audio.js';
import { checkLyrics } from './ui.js';

let animationId = null;
let visualizerBars = [];
const visualizerContainer = document.getElementById('visualizer');

// Кэшируем элементы неоновых линий
const leftGlow = document.getElementById('leftGlow');
const rightGlow = document.getElementById('rightGlow');

// Переменные анализа
const FREQ_RANGES = { 
    BASS: { start: 0, end: 10 }, 
    MID: { start: 10, end: 20 }, 
    HIGH: { start: 20, end: 30 } 
};

let energyHistory = [];
let beatCooldown = 0;
let lastBeatTime = 0;
let currentPulseIntensity = 0;

export function initVisualizerDOM() {
    visualizerContainer.innerHTML = '';
    visualizerBars = [];
    for (let i = 0; i < 30; i++) {
        const bar = document.createElement('div');
        bar.className = 'visualizer-bar';
        visualizerContainer.appendChild(bar);
        visualizerBars.push(bar);
    }
}

export function startVisualizer() {
    if (!animationId) {
        loop();
    }
}

export function stopVisualizer() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

function loop() {
    if (!analyser) return;
    analyser.getByteFrequencyData(dataArray);
    
    const features = analyzeAudioFeatures();
    
    checkLyrics(audio.currentTime);
    drawBars(features);
    updateGlow(features);
    
    // Затухание пульсации бита
    if (currentPulseIntensity > 0) {
        currentPulseIntensity -= 0.08;
        if (currentPulseIntensity < 0) currentPulseIntensity = 0;
    }

    animationId = requestAnimationFrame(loop);
}

function getFrequencyEnergy(range) {
    let sum = 0;
    const count = range.end - range.start;
    for (let i = range.start; i < range.end; i++) {
        sum += dataArray[i];
    }
    return sum / count / 255;
}

function analyzeAudioFeatures() {
    const bassEnergy = getFrequencyEnergy(FREQ_RANGES.BASS);
    const midEnergy = getFrequencyEnergy(FREQ_RANGES.MID);
    const highEnergy = getFrequencyEnergy(FREQ_RANGES.HIGH);
    
    // RMS (Общая энергия)
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sum / bufferLength) / 255;
    
    // Детектор бита
    let isBeat = false;
    energyHistory.push(rms);
    if (energyHistory.length > 30) energyHistory.shift();
    const energyAverage = energyHistory.reduce((a, b) => a + b, 0) / energyHistory.length;
    
    const currentTime = Date.now();
    if (beatCooldown <= 0) {
        if (bassEnergy > energyAverage * 1.4 + 0.15 && (currentTime - lastBeatTime) > 200) {
            isBeat = true;
            lastBeatTime = currentTime;
            currentPulseIntensity = 1.0;
            beatCooldown = 8;
        }
    } else {
        beatCooldown--;
    }

    return { rms, bassEnergy, midEnergy, highEnergy, isBeat };
}

function drawBars(features) {
    const track = state.currentTracks[state.currentTrackIndex];
    const visualizerColors = track ? track.visualizer : ['#fff', '#ccc'];
    
    for (let i = 0; i < visualizerBars.length; i++) {
        const index = Math.floor((i / visualizerBars.length) * bufferLength);
        const value = dataArray[index] / 255;
        
        let baseHeight = Math.max(5, value * 110);
        
        // Продвинутый буст разных частот для разных полос (взято из нового скрипта)
        if (i < 10) {
            baseHeight += features.bassEnergy * 25;
            if (features.isBeat) baseHeight += currentPulseIntensity * 20;
        } else if (i < 20) {
            baseHeight += features.midEnergy * 18;
        } else {
            baseHeight += features.highEnergy * 20;
        }
        
        visualizerBars[i].style.height = `${baseHeight}px`;
        visualizerBars[i].style.background = `linear-gradient(to top, ${visualizerColors[0]}, ${visualizerColors[1] || visualizerColors[0]})`;
    }
}

function updateGlow(features) {
    if (state.isLiteMode) {
        leftGlow.style.height = '10%';
        rightGlow.style.height = '10%';
        return;
    }

    // Используем RMS (общую громкость) и возводим в степень 1.5
    // Это дает плавный, но живой отклик, не улетающий в потолок.
    let h = Math.pow(features.rms, 1.5) * 200;
    
    if (h > 100) h = 100;
    if (h < 5) h = 5;

    if (leftGlow && rightGlow) {
        leftGlow.style.height = `${h}%`;
        rightGlow.style.height = `${h}%`;
        
        // Яркость тоже меняется
        const opacityVal = 0.3 + (features.rms * 1.2);
        leftGlow.style.opacity = opacityVal;
        rightGlow.style.opacity = opacityVal;
    }
}

// Пустые функции, чтобы main.js не ломался, если вдруг попытается их вызвать
export function createParticles() {} 
export function createCornerParticles() {}
