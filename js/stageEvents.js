// --- js/stageEvents.js ---

// Кэш элементов DOM (чтобы не искать их каждый кадр)
const DOM = {
    alastorMeter: null,
    alastorNeedle: null
};

// Инициализация DOM элементов (вызывается лениво)
function initDOM() {
    if (!DOM.alastorMeter) {
        DOM.alastorMeter = document.getElementById('alastorMeter');
        DOM.alastorNeedle = document.getElementById('alastorNeedle');
    }
}

// === 1. БИБЛИОТЕКА ЭФФЕКТОВ ===
// Здесь описываем логику поведения объектов
const effects = {
    // Эффект: Радио-шкала Аластора
    radioDial: {
        // Срабатывает 1 раз при начале тайминга
        onEnter: () => {
            initDOM();
            if (DOM.alastorMeter) DOM.alastorMeter.classList.add('active');
        },
        
        // Срабатывает каждый кадр внутри тайминга
        onUpdate: (features) => {
            if (DOM.alastorNeedle) {
                // Логика движения стрелки
                // features.rms - общая громкость (0.0 - 1.0)
                
                // Угол от -70 до 70 градусов
                let angle = (features.rms * 3.0 * 140) - 70;
                
                // Ограничители
                if (angle < -70) angle = -70;
                if (angle > 70) angle = 70;
                
                // Дрожание (Jitter) для эффекта старины
                const jitter = (Math.random() - 0.5) * 4;
                
                DOM.alastorNeedle.style.transform = `rotate(${angle + jitter}deg)`;
                
                // Свечение стрелки от басов
                DOM.alastorNeedle.style.boxShadow = `0 0 ${10 + features.bassEnergy * 40}px #ff3333`;
            }
        },
        
        // Срабатывает 1 раз при завершении тайминга
        onExit: () => {
            if (DOM.alastorMeter) DOM.alastorMeter.classList.remove('active');
        }
    }
    
    // Сюда можно добавить другие эффекты: 
    // strobeLights, textGlitch, cameraShake и т.д.
};

// === 2. ТАЙМЛАЙН СОБЫТИЙ ===
// Ключ - точное название трека из data.js
// Значение - массив событий
export const trackTimeline = {
    "Alastor's Game": [
        {
            start: 47.0,  // Начало (сек)
            end: 66.0,    // Конец (сек)
            effect: 'radioDial' // Название эффекта из библиотеки выше
        }
        // Можно добавить второе появление, например, в конце:
        // { start: 180.0, end: 200.0, effect: 'radioDial' }
    ],
    
    // Пример для другого трека:
    // "Katana": [ ... ]
};

// === 3. ДВИЖОК (НЕ ТРОГАТЬ) ===
let activeEvents = new Set(); // Храним запущенные события, чтобы не запускать onEnter вечно

export function checkStageEvents(trackName, currentTime, features) {
    const trackEvents = trackTimeline[trackName];

    // Если для трека нет сценария, просто убеждаемся, что всё выключено
    if (!trackEvents) {
        cleanupAllEvents();
        return;
    }

    trackEvents.forEach((event, index) => {
        const eventId = `${trackName}-${index}`; // Уникальный ID события
        const effectLogic = effects[event.effect];

        if (!effectLogic) return;

        // Проверяем, попадаем ли мы в тайминг
        if (currentTime >= event.start && currentTime <= event.end) {
            // ВХОД (только один раз)
            if (!activeEvents.has(eventId)) {
                if (effectLogic.onEnter) effectLogic.onEnter();
                activeEvents.add(eventId);
            }
            
            // ОБНОВЛЕНИЕ (каждый кадр)
            if (effectLogic.onUpdate) effectLogic.onUpdate(features);
            
        } else {
            // ВЫХОД (если событие было активно, но время вышло)
            if (activeEvents.has(eventId)) {
                if (effectLogic.onExit) effectLogic.onExit();
                activeEvents.delete(eventId);
            }
        }
    });
}

// Функция полной зачистки (вызывается при смене трека)
export function cleanupAllEvents() {
    activeEvents.forEach(eventId => {
        // Пытаемся понять, какой эффект закрыть (упрощенно)
        // В идеале нужно хранить ссылку на эффект, но здесь пройдемся по всем
        // и вызовем onExit для безопасности визуального состояния
        Object.values(effects).forEach(eff => {
            if (eff.onExit) eff.onExit();
        });
    });
    activeEvents.clear();
}
