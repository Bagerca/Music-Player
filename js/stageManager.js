import { stageEffects } from './eventsLibrary.js';

// Таймлайн: Когда что включать
export const trackTimeline = {
    "Alastor's Game": [
        { start: 47.0, end: 66.0, effect: 'radioDial' }
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
        const eventId = `${trackName}-${index}`;
        const effectDef = stageEffects[event.effect];

        if (!effectDef) return;

        // Попадаем в тайминг
        if (currentTime >= event.start && currentTime <= event.end) {
            if (!activeEvents.has(eventId)) {
                mountEvent(eventId, effectDef);
            }
            const instance = activeEvents.get(eventId);
            if (effectDef.update && instance) {
                effectDef.update(instance.data, features);
            }
        } else {
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

    activeEvents.set(id, { wrapper, styleEl, data: instanceData });
}

function unmountEvent(id) {
    const instance = activeEvents.get(id);
    if (!instance) return;

    if (instance.wrapper) instance.wrapper.remove();
    if (instance.styleEl) instance.styleEl.remove();

    activeEvents.delete(id);
}

export function cleanupAllEvents() {
    if (activeEvents.size > 0) {
        // Создаем копию ключей, чтобы безопасно удалять во время перебора
        Array.from(activeEvents.keys()).forEach(id => unmountEvent(id));
        activeEvents.clear();
    }
}
