import { stageEffects } from './eventsLibrary.js';

// Таймлайн: Когда что включать
// Время в секундах (1:45 = 105с, 2:42 = 162с)
export const trackTimeline = {
    "Alastor's Game": [
        // Первое появление (Радио соло)
        { start: 47.0, end: 66.0, effect: 'radioDial' },
        
        // Второе появление (Финальная часть)
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

    // === ВАЖНОЕ ИСПРАВЛЕНИЕ ===
    // Если мы уже запустили процесс исчезновения (isFadingOut = true),
    // то просто выходим. Не нужно пытаться удалить его снова или прерывать анимацию.
    // Таймер (setTimeout), запущенный в первый раз, сам удалит элемент.
    if (instance.isFadingOut) return;

    // Если элемент существует и еще не начал исчезать
    if (instance.wrapper) {
        // Проверяем, поддерживает ли эффект плавный выход (ищем класс контейнера радио)
        const alastorContainer = instance.wrapper.querySelector('.alastor-overlay-container');
        
        if (alastorContainer) {
            instance.isFadingOut = true; // Ставим флаг "Не трогать, идет анимация!"
            alastorContainer.classList.add('fade-out-event'); // Запускаем CSS анимацию
            
            // Ждем окончания анимации (1.4 сек), потом удаляем физически
            setTimeout(() => {
                removeInstanceComplete(id, instance);
            }, 1400);
            
            return; // Прерываем функцию, чтобы не удалить элемент прямо сейчас
        }
    }

    // Для всех остальных эффектов (или если что-то пошло не так) - удаляем сразу
    removeInstanceComplete(id, instance);
}

// Вспомогательная функция окончательного удаления из DOM и памяти
function removeInstanceComplete(id, instance) {
    // Проверка на случай, если трек переключили во время анимации
    if (instance.wrapper) instance.wrapper.remove();
    if (instance.styleEl) instance.styleEl.remove();
    activeEvents.delete(id);
}

export function cleanupAllEvents() {
    if (activeEvents.size > 0) {
        // При полной очистке (смена трека, стоп) удаляем всё мгновенно без анимаций
        Array.from(activeEvents.keys()).forEach(id => {
            const instance = activeEvents.get(id);
            if (instance) removeInstanceComplete(id, instance);
        });
        activeEvents.clear();
    }
}
