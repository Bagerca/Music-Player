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

// Частицы (контейнер остался в HTML для эффектов краев, хоть сами частицы мы убрали)
// Оставляем массив пустым, чтобы не было ошибок
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
    // Создаем 30 полос
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
    
    // Получаем данные частот (от 0 до 255)
    analyser.getByteFrequencyData(dataArray);
    
    // 1. Анализ звука (вычисляем энергию басов и общую громкость)
    const features = analyzeAudioFeatures();
    
    // 2. Проверка субтитров
    checkLyrics(audio.currentTime);

    // 3. Отрисовка баров эквалайзера
    drawBars(features);
    
    // 4. Оживление неоновых линий
    updateGlow(features);
    
    // 5. Эффекты краев (если не Lite Mode)
    if (!state.isLiteMode) {
        updateEnergySurge();
    }
    
    animationId = requestAnimationFrame(loop);
}

function analyzeAudioFeatures() {
    let sum = 0;
    let bassSum = 0;
    
    // dataArray содержит 256 значений частот. 
    // Первые ~10-15 значений - это басы.
    for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
        if (i < 10) bassSum += dataArray[i];
    }
    
    // Нормализуем значения от 0 до 1
    const rms = sum / bufferLength / 255; // Средняя громкость
    const bassEnergy = bassSum / 10 / 255; // Энергия баса
    
    // Детектор бита (ударных)
    let isBeat = false;
    energyHistory.push(rms);
    if (energyHistory.length > 30) energyHistory.shift();
    const energyAverage = energyHistory.reduce((a, b) => a + b, 0) / energyHistory.length;
    
    // Если текущий бас резко выше среднего значения
    if (beatCooldown <= 0 && bassEnergy > energyAverage * 1.4 + 0.15) {
        isBeat = true;
        beatCooldown = 10; // Пауза перед следующим детектированием бита
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
        // Распределяем частоты по барам
        const index = Math.floor((i / visualizerBars.length) * bufferLength);
        const value = dataArray[index] / 255;
        
        let height = Math.max(5, value * 120); // Базовая высота
        
        // Эффект "подпрыгивания" баров при ударе бита
        if (features.isBeat) {
            height += 10;
        }
        
        visualizerBars[i].style.height = `${height}px`;
        visualizerBars[i].style.background = `linear-gradient(to top, ${colors.primary}, ${colors.accent})`;
    }
}

// --- НОВАЯ ЛОГИКА ДЛЯ НЕОНОВЫХ ЛИНИЙ ---
function updateGlow(features) {
    // Если Lite Mode включен - линии статичны (для экономии ресурсов)
    if (state.isLiteMode) {
        if (leftGlow) leftGlow.style.height = '15%';
        if (rightGlow) rightGlow.style.height = '15%';
        return;
    }

    if (leftGlow) {
        // Левая линия: реагирует на БАС
        // Умножаем на коэффициент, чтобы линия "прыгала" заметнее
        let h = Math.max(10, features.bassEnergy * 400); 
        if (h > 100) h = 100; // Ограничиваем 100%
        
        leftGlow.style.height = `${h}%`;
        // Меняем прозрачность: чем громче, тем ярче
        leftGlow.style.opacity = 0.4 + (features.bassEnergy * 0.6);
    }

    if (rightGlow) {
        // Правая линия: реагирует на ОБЩУЮ ГРОМКОСТЬ (RMS)
        let h = Math.max(10, features.rms * 500);
        if (h > 100) h = 100;
        
        rightGlow.style.height = `${h}%`;
        rightGlow.style.opacity = 0.4 + (features.rms * 0.6);
    }
}

// --- ЭФФЕКТЫ КРАЕВ ЭКРАНА ---
function activateEnergySurge(intensity) {
    energySurgeActive = true;
    energySurgeIntensity = intensity;
}

function updateEnergySurge() {
    if (!energySurgeActive) return;
    
    energySurgeIntensity -= 0.04; // Скорость затухания волны
    
    if (energySurgeIntensity < 0) {
        energySurgeIntensity = 0;
        energySurgeActive = false;
    }
    
    // Применяем прозрачность к волнам по краям экрана
    const waves = document.querySelectorAll('.energy-wave');
    waves.forEach(w => {
        w.style.opacity = energySurgeIntensity;
    });
}

// Пустая функция инициализации частиц (чтобы main.js не ругался)
export function createParticles() {
    // Частицы удалены
}
