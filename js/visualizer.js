import { state } from './state.js';
import { analyser, dataArray, bufferLength } from './audio.js';
import { audio } from './audio.js';
import { checkLyrics } from './ui.js';
// ВАЖНОЕ ИСПРАВЛЕНИЕ ИМПОРТА:
import { checkStageEvents, cleanupAllEvents } from './stageManager.js';

let animationId = null;
let visualizerBars = [];
const visualizerContainer = document.getElementById('visualizer');

const leftGlow = document.getElementById('leftGlow');
const rightGlow = document.getElementById('rightGlow');

const FREQ_RANGES = { 
    BASS: { start: 0, end: 10 }, 
    MID: { start: 10, end: 20 }, 
    HIGH: { start: 20, end: 30 } 
};

let energyHistory = [];
let beatCooldown = 0;
let lastBeatTime = 0;
let currentPulseIntensity = 0;
let lastTrackIndex = -1; 

export function initVisualizerDOM() {
    if (!visualizerContainer) return;
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
        cleanupAllEvents(); // Чистим сцену при остановке
    }
}

function loop() {
    if (!analyser) return;
    
    try {
        analyser.getByteFrequencyData(dataArray);
        const features = analyzeAudioFeatures();
        
        checkLyrics(audio.currentTime);
        drawBars(features);
        updateGlow(features);
        
        // --- СЦЕНАРИИ ---
        const track = state.playbackList[state.playbackIndex];
        if (track) {
            if (state.playbackIndex !== lastTrackIndex) {
                cleanupAllEvents();
                lastTrackIndex = state.playbackIndex;
            }
            // Проверяем, есть ли события для текущего времени
            checkStageEvents(track.name, audio.currentTime, features);
        }
        // ----------------
        
        if (currentPulseIntensity > 0) {
            currentPulseIntensity -= 0.08;
            if (currentPulseIntensity < 0) currentPulseIntensity = 0;
        }

        animationId = requestAnimationFrame(loop);
    } catch (e) {
        console.error("Visualizer loop error:", e);
        stopVisualizer();
    }
}

function getFrequencyEnergy(range) {
    let sum = 0;
    const count = range.end - range.start;
    for (let i = range.start; i < range.end; i++) {
        if (dataArray[i] !== undefined) sum += dataArray[i];
    }
    return sum / count / 255;
}

function analyzeAudioFeatures() {
    const bassEnergy = getFrequencyEnergy(FREQ_RANGES.BASS);
    const midEnergy = getFrequencyEnergy(FREQ_RANGES.MID);
    const highEnergy = getFrequencyEnergy(FREQ_RANGES.HIGH);
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) sum += dataArray[i] * dataArray[i];
    const rms = Math.sqrt(sum / bufferLength) / 255;
    
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
    const track = state.playbackList[state.playbackIndex];
    const visualizerColors = track && track.visualizer ? track.visualizer : ['#fff', '#ccc'];
    for (let i = 0; i < visualizerBars.length; i++) {
        const index = Math.floor((i / visualizerBars.length) * bufferLength);
        const value = dataArray[index] / 255;
        let baseHeight = Math.max(5, value * 110);
        if (i < 10) {
            baseHeight += features.bassEnergy * 25;
            if (features.isBeat) baseHeight += currentPulseIntensity * 20;
        } else if (i < 20) {
            baseHeight += features.midEnergy * 18;
        } else {
            baseHeight += features.highEnergy * 20;
        }
        visualizerBars[i].style.height = `${baseHeight}px`;
        const color1 = visualizerColors[0] || '#fff';
        const color2 = visualizerColors[1] || visualizerColors[0] || '#ccc';
        visualizerBars[i].style.background = `linear-gradient(to top, ${color1}, ${color2})`;
    }
}

function updateGlow(features) {
    if (state.isLiteMode) {
        if (leftGlow) leftGlow.style.height = '10%';
        if (rightGlow) rightGlow.style.height = '10%';
        return;
    }
    let h = Math.pow(features.rms, 1.5) * 200;
    if (h > 100) h = 100;
    if (h < 5) h = 5;
    if (leftGlow && rightGlow) {
        leftGlow.style.height = `${h}%`;
        rightGlow.style.height = `${h}%`;
        const opacityVal = 0.3 + (features.rms * 1.2);
        leftGlow.style.opacity = opacityVal;
        rightGlow.style.opacity = opacityVal;
    }
}
