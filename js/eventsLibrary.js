// --- js/eventsLibrary.js ---

export const stageEffects = {
    
    // === ЭФФЕКТ 1: ALASTOR RADIO (REMASTERED) ===
    radioDial: {
        // 1. HTML (Структура)
        html: `
            <div class="alastor-vignette"></div>
            <div class="radio-wrapper">
                <div class="meter-case">
                    <!-- Фон сетка -->
                    <div class="meter-bg-grid"></div>
                    
                    <!-- Дуга -->
                    <div class="meter-arc-path">
                        <div class="meter-danger-zone"></div>
                    </div>

                    <!-- Деления -->
                    <div class="meter-ticks">
                        <i style="--i:0"></i><i style="--i:1"></i><i style="--i:2"></i>
                        <i style="--i:3"></i><i style="--i:4"></i><i style="--i:5"></i>
                        <i style="--i:6"></i><i style="--i:7"></i><i style="--i:8"></i>
                        <i style="--i:9"></i><i style="--i:10"></i>
                    </div>

                    <!-- Стрелка -->
                    <div class="needle-container">
                        <div class="needle" id="eventNeedle"></div>
                        <div class="needle-cap"></div>
                    </div>

                    <!-- Лампочка -->
                    <div class="peak-led" id="eventLight"></div>
                    
                    <!-- Текст -->
                    <div class="meter-label">SIGNAL INPUT</div>
                </div>
            </div>
        `,

        // 2. CSS (Стили)
        css: `
            /* Затемнение экрана */
            .alastor-vignette {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                background: radial-gradient(circle, transparent 50%, #000 100%);
                z-index: 1;
                animation: fadeIn 1.5s ease;
            }

            /* Главный контейнер (Позиционирование) */
            .radio-wrapper {
                position: absolute;
                bottom: 0;
                left: 0; 
                width: 100%;
                height: 450px; /* Высота панели */
                display: flex;
                justify-content: center;
                align-items: flex-end;
                z-index: 2;
                overflow: hidden;
                animation: slideUp 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
            }

            /* Корпус прибора */
            .meter-case {
                position: relative;
                width: 900px;
                height: 100%;
                background: linear-gradient(to top, #1a0505, #000);
                border-top: 1px solid #330000;
                border-radius: 50% 50% 0 0 / 30% 30% 0 0; /* Овал */
                box-shadow: 0 0 100px rgba(255, 0, 0, 0.1);
                overflow: hidden;
            }

            /* Сетка на фоне */
            .meter-bg-grid {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                background-image: 
                    linear-gradient(rgba(50, 0, 0, 0.3) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(50, 0, 0, 0.3) 1px, transparent 1px);
                background-size: 50px 50px;
                opacity: 0.5;
            }

            /* Дуга шкалы */
            .meter-arc-path {
                position: absolute;
                bottom: -100px; left: 50%; transform: translateX(-50%);
                width: 700px; height: 700px;
                border-radius: 50%;
                border: 2px solid rgba(255, 255, 255, 0.1);
                box-shadow: inset 0 0 20px rgba(0,0,0,0.8);
            }
            
            /* Красная зона */
            .meter-danger-zone {
                position: absolute;
                top: -2px; right: 100px; /* Подгон под угол */
                width: 150px; height: 20px;
                border-top: 4px solid #ff0000;
                transform: rotate(25deg);
                transform-origin: left bottom;
                box-shadow: 0 0 10px #ff0000;
            }

            /* Деления */
            .meter-ticks {
                position: absolute;
                bottom: -100px; left: 50%; transform: translateX(-50%);
                width: 660px; height: 660px;
                pointer-events: none;
            }
            .meter-ticks i {
                position: absolute;
                top: 0; left: 50%;
                width: 2px; height: 15px;
                background: rgba(255, 255, 255, 0.5);
                transform-origin: 50% 330px; /* Радиус вращения */
                transform: translateX(-50%) rotate(calc((var(--i) - 5) * 12deg)); /* -5 смещает центр */
            }
            .meter-ticks i:nth-child(6) { background: #ff0000; height: 25px; width: 3px; } /* Центр */

            /* Стрелка */
            .needle-container {
                position: absolute;
                bottom: -120px; left: 50%; transform: translateX(-50%);
                width: 40px; height: 40px;
                z-index: 10;
            }
            .needle-cap {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                background: #333; border-radius: 50%;
                box-shadow: 0 0 10px black;
            }
            .needle {
                position: absolute;
                bottom: 20px; left: 50%;
                width: 4px; height: 340px;
                background: #ff3333;
                transform-origin: bottom center;
                transform: translateX(-50%) rotate(-60deg);
                border-radius: 2px;
                box-shadow: 0 0 15px rgba(255, 0, 0, 0.5);
                /* Убираем CSS transition, всё делает JS */
                will-change: transform; 
            }

            /* Лампочка перегруза */
            .peak-led {
                position: absolute;
                bottom: 60px; left: 50%; transform: translateX(-50%);
                width: 10px; height: 10px;
                background: #300;
                border-radius: 50%;
                border: 1px solid #500;
                box-shadow: 0 0 0 2px #100;
                transition: background 0.05s;
            }

            .meter-label {
                position: absolute;
                bottom: 20px; width: 100%; text-align: center;
                font-family: monospace; color: #500;
                font-size: 14px; letter-spacing: 4px;
                text-shadow: 0 0 5px #f00;
            }

            /* Анимации */
            @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
            @keyframes slideUp { 
                from { transform: translateY(100%); opacity: 0; } 
                to { transform: translateY(0); opacity: 1; } 
            }
        `,

        // 3. ИНИЦИАЛИЗАЦИЯ
        init: (instance) => {
            instance.needle = document.getElementById('eventNeedle');
            instance.light = document.getElementById('eventLight');
            instance.angle = -60; // Стартовый угол (лево)
            instance.velocity = 0; // Скорость движения
        },

        // 4. ЛОГИКА (PHYSICS UPDATE)
        update: (instance, features) => {
            if (!instance.needle) return;

            // --- НАСТРОЙКИ ЧУВСТВИТЕЛЬНОСТИ ---
            // RMS (громкость) + Bass (удар). 
            // Множитель 1.8 - оптимально, чтобы не билось постоянно в край.
            let inputSignal = (features.rms * 0.6 + features.bassEnergy * 0.4) * 1.8;
            
            // Добавляем "шум эфира" (постоянное микро-дрожание)
            // Даже в тишине стрелка чуть-чуть ходит
            inputSignal += (Math.random() - 0.5) * 0.05;

            // Ограничиваем сигнал от 0 до 1.2
            if (inputSignal < 0) inputSignal = 0;
            if (inputSignal > 1.2) inputSignal = 1.2;

            // Переводим сигнал в угол (-60 град ... +60 град)
            let targetAngle = -60 + (inputSignal * 120);

            // --- ФИЗИКА ИНЕРЦИИ ---
            // Если сигнал растет - стрелка летит быстро (удар)
            // Если сигнал падает - стрелка возвращается медленно (вес)
            const smoothing = targetAngle > instance.angle ? 0.3 : 0.05;
            
            // Линейная интерполяция (Lerp)
            instance.angle += (targetAngle - instance.angle) * smoothing;

            // Применяем поворот
            instance.needle.style.transform = `translateX(-50%) rotate(${instance.angle}deg)`;

            // --- ЛАМПОЧКА (OVERLOAD) ---
            if (instance.light) {
                if (instance.angle > 45) { // Если в красной зоне
                    instance.light.style.background = '#ff0000';
                    instance.light.style.boxShadow = '0 0 15px #ff0000';
                } else {
                    instance.light.style.background = '#300';
                    instance.light.style.boxShadow = 'none';
                }
            }
        }
    }
};
