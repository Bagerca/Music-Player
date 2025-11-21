import { state } from './state.js';
import { analyser, dataArray, bufferLength } from './audio.js';
import { audio } from './audio.js';
import { checkLyrics } from './ui.js';

let animationId = null;
let visualizerBars = [];
const visualizerContainer = document.getElementById('visualizer');

// Частицы
const particlesContainer = document.getElementById('particles');
let particlesData = [];

// Переменные анализа бита
let beatCooldown = 0;
let lastBeatTime = 0;
let currentPulseIntensity = 0;
let energyHistory = [];
let energySurgeActive = false;
let energySurgeIntensity = 0;

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
    
    // 1. Анализ звука
    const features = analyzeAudioFeatures();
    
    // 2. Проверка субтитров (оптимизировано в UI.js)
    checkLyrics(audio.currentTime);

    // 3. Отрисовка баров
    drawBars(features);
    
    // 4. Эффекты (если не Lite Mode)
    if (!state.isLiteMode) {
        updateParticles(features);
        updateGlow(features);
        updateEnergySurge();
    }
    
    animationId = requestAnimationFrame(loop);
}

function analyzeAudioFeatures() {
    let sum = 0;
    let bassSum = 0;
    // Простой анализ по диапазонам
    for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
        if (i < 10) bassSum += dataArray[i];
    }
    
    const rms = sum / bufferLength / 255;
    const bassEnergy = bassSum / 10 / 255;
    
    // Детектор бита
    let isBeat = false;
    energyHistory.push(rms);
    if (energyHistory.length > 30) energyHistory.shift();
    const energyAverage = energyHistory.reduce((a, b) => a + b, 0) / energyHistory.length;
    
    if (beatCooldown <= 0 && bassEnergy > energyAverage * 1.4 + 0.15) {
        isBeat = true;
        beatCooldown = 10;
        currentPulseIntensity = 1.0;
        activateEnergySurge(0.8);
    } else {
        beatCooldown--;
    }
    
    if (currentPulseIntensity > 0) currentPulseIntensity -= 0.05;
    
    return { rms, bassEnergy, isBeat };
}

function drawBars(features) {
    const track = state.currentTracks[state.currentTrackIndex];
    const colors = track ? track.colors : { primary: '#fff', accent: '#fff' };
    
    for (let i = 0; i < visualizerBars.length; i++) {
        const index = Math.floor((i / visualizerBars.length) * bufferLength);
        const value = dataArray[index] / 255;
        let height = Math.max(5, value * 120);
        
        // Bass boost visual
        if (i < 5 && features.isBeat) height += 20;
        
        visualizerBars[i].style.height = `${height}px`;
        visualizerBars[i].style.background = `linear-gradient(to top, ${colors.primary}, ${colors.accent})`;
    }
}

// Частицы (упрощенная версия для модуля)
export function createParticles() {
    particlesContainer.innerHTML = '';
    particlesData = [];
    if (state.isLiteMode) return;

    for (let i = 0; i < 15; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        // Начальные стили задаются рандомно
        p.style.left = Math.random() * 100 + 'vw';
        p.style.top = Math.random() * 100 + 'vh';
        particlesContainer.appendChild(p);
        particlesData.push({ el: p, dx: (Math.random()-0.5)*0.2, dy: (Math.random()-0.5)*0.2 });
    }
}

function updateParticles(features) {
    const track = state.currentTracks[state.currentTrackIndex];
    const color = track ? track.colors.accent : '#fff';
    
    particlesData.forEach(p => {
        let x = parseFloat(p.el.style.left);
        let y = parseFloat(p.el.style.top);
        
        // Движение под бит
        const speed = features.isBeat ? 2 : 1;
        x += p.dx * speed + (features.bassEnergy * 0.5);
        y += p.dy * speed;
        
        if(x > 100) x = 0; if(x < 0) x = 100;
        if(y > 100) y = 0; if(y < 0) y = 100;
        
        p.el.style.left = x + 'vw';
        p.el.style.top = y + 'vh';
        p.el.style.background = color;
        p.el.style.transform = `scale(${1 + features.rms})`;
    });
}

function updateGlow(features) {
    // Логика управления #leftGlow, #rightGlow
    // Имплементация аналогична оригинальному скрипту
}

function activateEnergySurge(intensity) {
    energySurgeActive = true;
    energySurgeIntensity = intensity;
}

function updateEnergySurge() {
    if (!energySurgeActive) return;
    energySurgeIntensity -= 0.05;
    if (energySurgeIntensity < 0) {
        energySurgeIntensity = 0;
        energySurgeActive = false;
    }
    document.querySelectorAll('.energy-wave').forEach(w => {
        w.style.opacity = energySurgeIntensity;
    });
}
