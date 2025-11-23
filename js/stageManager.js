import { stageEffects } from './eventsLibrary.js';

// Таймлайн: Когда что включать
// 1:21 = 81.0с
export const trackTimeline = {
    "Alastor's Game": [
        // Радио часть 1
        { start: 47.0, end: 66.0, effect: 'radioDial' },
        
        // === REALITY BREAK (УДАР НА 1:21) ===
        // Длится всего 0.8 секунды
        { start: 81.0, end: 81.8, effect: 'realityBreak' },
        
        // Радио часть 2
        { start: 105.0, end: 162.0, effect: 'radioDial' }
    ]
};

// Состояние
let activeEvents = new Map();
const container = document.getElementById('stage-container');

export function checkStageEvents(trackName, currentTime, features) {
    const trackEvents = trackTimeline[trackName];

    if (!trackEvents) {
        cleanupAllEvents();
        return;
    }

    trackEvents.forEach((event, index) => {
        // Уникальный ID для каждого отрезка времени
        const eventId = `${trackName}-${index}`;
        const effectDef = stageEffects[event.effect];

        if (!effectDef) return;

        // Попадаем в тайминг
        if (currentTime >= event.start && currentTime <= event.end) {
            if (!activeEvents.has(eventId)) {
                mountEvent(eventId, effectDef);
            }
            const instance = activeEvents.get(eventId);
            // Если событие существует и НЕ находится в процессе исчезновения, обновляем его
            if (effectDef.update && instance && !instance.isFadingOut) {
                effectDef.update(instance.data, features);
            }
        } else {
            // Время вышло, пора удалять
            if (activeEvents.has(eventId)) {
                unmountEvent(eventId);
            }
        }
    });
}

function mountEvent(id, def) {
    // Если контейнер еще не найден, ищем его снова
    const targetContainer = container || document.getElementById('stage-container');
    if (!targetContainer) return;

    let styleEl = null;
    if (def.css) {
        styleEl = document.createElement('style');
        styleEl.innerHTML = def.css;
        document.head.appendChild(styleEl);
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'stage-event-wrapper';
    wrapper.innerHTML = def.html;
    targetContainer.appendChild(wrapper);

    const instanceData = {};
    if (def.init) {
        requestAnimationFrame(() => def.init(instanceData));
    }

    activeEvents.set(id, { 
        wrapper, 
        styleEl, 
        data: instanceData,
        isFadingOut: false // Флаг для контроля анимации выхода
    });
}

function unmountEvent(id) {
    const instance = activeEvents.get(id);
    if (!instance) return;

    // === ЛОГИКА ПЛАВНОГО ВЫХОДА ===
    // Если мы уже запустили процесс исчезновения (isFadingOut = true), выходим.
    if (instance.isFadingOut) return;

    // Если элемент существует и еще не начал исчезать
    if (instance.wrapper) {
        // Проверяем, поддерживает ли эффект плавный выход (ищем класс радио)
        const alastorContainer = instance.wrapper.querySelector('.alastor-overlay-container');
        
        if (alastorContainer) {
            instance.isFadingOut = true; // Блокируем
            alastorContainer.classList.add('fade-out-event'); // Запускаем анимацию CSS
            
            // Ждем окончания анимации (1.4 сек), потом удаляем физически
            setTimeout(() => {
                removeInstanceComplete(id, instance);
            }, 1400);
            
            return; // Прерываем немедленное удаление
        }
    }

    // Для эффектов без плавного выхода (например, glitch) - удаляем сразу
    removeInstanceComplete(id, instance);
}

// Вспомогательная функция окончательного удаления
function removeInstanceComplete(id, instance) {
    if (instance.wrapper) instance.wrapper.remove();
    if (instance.styleEl) instance.styleEl.remove();
    activeEvents.delete(id);
}

export function cleanupAllEvents() {
    if (activeEvents.size > 0) {
        // При полной очистке (смена трека, стоп) удаляем всё мгновенно
        Array.from(activeEvents.keys()).forEach(id => {
            const instance = activeEvents.get(id);
            if (instance) removeInstanceComplete(id, instance);
        });
        activeEvents.clear();
    }
}
