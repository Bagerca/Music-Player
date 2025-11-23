// --- js/stageManager.js ---
import { stageEffects } from './eventsLibrary.js';

// Таймлайн: Когда что включать
export const trackTimeline = {
    "Alastor's Game": [
        { start: 47.0, end: 66.0, effect: 'radioDial' }
    ],
    // Можно добавить другие треки:
    // "Katana": [{ start: 10.0, end: 20.0, effect: 'matrixRain' }]
};

// Состояние
let activeEvents = new Map(); // Map: eventId -> { instanceData, styleElement }
const container = document.getElementById('stage-container');

export function checkStageEvents(trackName, currentTime, features) {
    const trackEvents = trackTimeline[trackName];

    // Если для трека ничего нет, чистим всё
    if (!trackEvents) {
        cleanupAllEvents();
        return;
    }

    trackEvents.forEach((event, index) => {
        const eventId = `${trackName}-${index}`;
        const effectDef = stageEffects[event.effect];

        if (!effectDef) return;

        // Попадаем в тайминг
        if (currentTime >= event.start && currentTime <= event.end) {
            
            // ВХОД (MOUNT)
            if (!activeEvents.has(eventId)) {
                mountEvent(eventId, effectDef);
            }
            
            // ОБНОВЛЕНИЕ (UPDATE)
            const instance = activeEvents.get(eventId);
            if (effectDef.update && instance) {
                effectDef.update(instance.data, features);
            }

        } else {
            // ВЫХОД (UNMOUNT)
            if (activeEvents.has(eventId)) {
                unmountEvent(eventId);
            }
        }
    });
}

// Функция монтажа (вставляет HTML и CSS)
function mountEvent(id, def) {
    if (!container) return;

    // 1. Вставляем CSS
    let styleEl = null;
    if (def.css) {
        styleEl = document.createElement('style');
        styleEl.innerHTML = def.css;
        document.head.appendChild(styleEl);
    }

    // 2. Вставляем HTML
    const wrapper = document.createElement('div');
    wrapper.className = 'stage-event-wrapper';
    wrapper.innerHTML = def.html;
    container.appendChild(wrapper);

    // 3. Инициализируем JS данные
    const instanceData = {};
    if (def.init) {
        // Ждем микротик, чтобы DOM успел отрисоваться
        requestAnimationFrame(() => def.init(instanceData));
    }

    // Сохраняем в Map
    activeEvents.set(id, { wrapper, styleEl, data: instanceData });
}

// Функция демонтажа (удаляет HTML и CSS)
function unmountEvent(id) {
    const instance = activeEvents.get(id);
    if (!instance) return;

    // Удаляем DOM
    if (instance.wrapper) instance.wrapper.remove();
    // Удаляем CSS
    if (instance.styleEl) instance.styleEl.remove();

    activeEvents.delete(id);
}

export function cleanupAllEvents() {
    if (activeEvents.size > 0) {
        activeEvents.forEach((_, id) => unmountEvent(id));
        activeEvents.clear();
    }
}
