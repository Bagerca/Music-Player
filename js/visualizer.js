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

// Частицы (контейнер остался для эффектов краев)
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
    
    // 2. Проверка субтитров
    checkLyrics(audio.currentTime);

    // 3. Отрисовка баров
    drawBars(features);
    
    // 4. Оживление неоновых линий (ИСПРАВЛЕНО)
    updateGlow(features);
    
    // 5. Эффекты краев
    if (!state.isLiteMode) {
        updateEnergySurge();
    }
    
    animationId = requestAnimationFrame(loop);
}

function analyzeAudioFeatures() {
    let sum = 0;
    let bassSum = 0;
    
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
        
        if (features.isBeat) height += 10;
        
        visualizerBars[i].style.height = `${height}px`;
        visualizerBars[i].style.background = `linear-gradient(to top, ${colors.primary}, ${colors.accent})`;
    }
}

// --- ОБНОВЛЕННАЯ ФУНКЦИЯ ДЛЯ ЛИНИЙ ---
function updateGlow(features) {
    if (state.isLiteMode) {
        if (leftGlow) leftGlow.style.height = '15%';
        if (rightGlow) rightGlow.style.height = '15%';
        return;
    }

    // 1. Расчет высоты (ЕДИНЫЙ для обеих линий)
    // Мы берем энергию баса и умножаем на 180 (было 400).
    // Это значит, чтобы линия достигла 100% высоты, бас должен быть очень мощным.
    // Math.max(5, ...) гарантирует, что линия никогда не исчезнет полностью (минимум 5%).
    let h = Math.max(5, features.bassEnergy * 180);

    // Ограничиваем высоту, чтобы не вылезало за пределы
    if (h > 100) h = 100;

    // 2. Применяем одинаковые значения к левой и правой линии
    if (leftGlow && rightGlow) {
        const heightStr = `${h}%`;
        // Прозрачность тоже делаем помягче
        const opacityVal = 0.5 + (features.bassEnergy * 0.5);

        leftGlow.style.height = heightStr;
        leftGlow.style.opacity = opacityVal;

        rightGlow.style.height = heightStr;
        rightGlow.style.opacity = opacityVal;
    }
}

// --- ЭФФЕКТЫ КРАЕВ ---
function activateEnergySurge(intensity) {
    energySurgeActive = true;
    energySurgeIntensity = intensity;
}

function updateEnergySurge() {
    if (!energySurgeActive) return;
    energySurgeIntensity -= 0.04;
    if (energySurgeIntensity < 0) {
        energySurgeIntensity = 0;
        energySurgeActive = false;
    }
    const waves = document.querySelectorAll('.energy-wave');
    waves.forEach(w => {
        w.style.opacity = energySurgeIntensity;
    });
}

export function createParticles() {
    // Частицы отключены
}
