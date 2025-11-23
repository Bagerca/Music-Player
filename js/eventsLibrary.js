export const stageEffects = {
    
    // === ЭФФЕКТ: ALASTOR RADIO (ULTIMATE VERSION) ===
    radioDial: {
        // 1. HTML
        // Используем семантическую верстку с контейнером-осью (pivot)
        html: `
            <!-- Глобальные эффекты экрана -->
            <div class="crt-lines"></div>
            <div class="vignette-overlay"></div>
            
            <!-- Контейнер прибора -->
            <div class="meter-wrapper">
                <div class="meter-housing">
                    
                    <!-- Фон шкалы -->
                    <div class="meter-display">
                        <div class="grid-texture"></div>
                        <div class="shadow-overlay"></div>
                        
                        <!-- Графика шкалы -->
                        <div class="scale-graphics">
                            <div class="red-zone"></div>
                            <div class="ticks-container">
                                <!-- Генерируем деления через CSS -->
                                <i style="--a:-60"></i><i style="--a:-50"></i><i style="--a:-40"></i>
                                <i style="--a:-30"></i><i style="--a:-20"></i><i style="--a:-10"></i>
                                <i style="--a:0"></i>
                                <i style="--a:10"></i><i style="--a:20"></i><i style="--a:30"></i>
                                <i style="--a:40"></i><i style="--a:50"></i><i style="--a:60"></i>
                            </div>
                        </div>

                        <!-- Индикаторы -->
                        <div class="labels">
                            <span class="label-left">SIGNAL</span>
                            <span class="label-right">OVERLOAD</span>
                        </div>
                        
                        <div class="overload-led" id="eventLight"></div>
                    </div>

                    <!-- Механизм стрелки (Самое важное) -->
                    <div class="needle-pivot-center" id="eventPivot">
                        <div class="needle-body"></div>
                        <div class="needle-counterweight"></div>
                    </div>
                    
                    <!-- Крышка основания стрелки -->
                    <div class="pivot-cap"></div>
                </div>
            </div>
        `,

        // 2. CSS
        css: `
            /* --- ЭФФЕКТЫ ЭКРАНА --- */
            .vignette-overlay {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                background: radial-gradient(circle, transparent 50%, #050000 100%);
                pointer-events: none; z-index: 1;
                animation: fadeIn 2s ease;
            }
            .crt-lines {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
                background-size: 100% 2px, 3px 100%;
                pointer-events: none; z-index: 2;
            }

            /* --- КОНТЕЙНЕР --- */
            .meter-wrapper {
                position: absolute;
                bottom: 0; left: 0; width: 100%;
                height: 400px;
                display: flex;
                justify-content: center;
                align-items: flex-end;
                perspective: 1000px;
                overflow: hidden;
                z-index: 3;
                /* Плавное появление снизу */
                animation: slideUp 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }

            /* --- КОРПУС --- */
            .meter-housing {
                position: relative;
                width: 800px; height: 350px;
                background: #0a0000;
                border-top: 2px solid #330000;
                border-radius: 400px 400px 0 0; /* Идеальный полукруг */
                box-shadow: 0 0 50px rgba(100, 0, 0, 0.2);
                overflow: hidden;
            }

            /* ДИСПЛЕЙ */
            .meter-display {
                position: relative; width: 100%; height: 100%;
                background: radial-gradient(circle at 50% 100%, #2a0505 0%, #000000 80%);
            }
            
            .grid-texture {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                background-image: radial-gradient(#400 1px, transparent 1px);
                background-size: 20px 20px;
                opacity: 0.2;
            }

            /* ГРАФИКА ШКАЛЫ */
            .scale-graphics {
                position: absolute;
                bottom: 0; left: 50%; transform: translateX(-50%);
                width: 700px; height: 350px;
            }

            /* Красная зона (через conic gradient для точности) */
            .red-zone {
                position: absolute;
                bottom: 20px; left: 20px; right: 20px; top: 20px;
                border-radius: 50% 50% 0 0;
                /* Градиент рисует дугу только справа */
                background: conic-gradient(from 270deg at 50% 100%, transparent 0deg, transparent 60deg, rgba(255, 0, 0, 0.4) 120deg);
                mask-image: radial-gradient(circle at 50% 100%, transparent 60%, black 61%);
                -webkit-mask-image: radial-gradient(circle at 50% 100%, transparent 60%, black 61%);
            }

            /* Деления (Абсолютное позиционирование от центра низа) */
            .ticks-container {
                position: absolute;
                bottom: 0; left: 50%;
                width: 0; height: 0; /* Точка отсчета */
            }
            .ticks-container i {
                position: absolute;
                bottom: 0; left: -1px; /* Центрируем линию шириной 2px */
                width: 2px; 
                height: 320px; /* Радиус шкалы */
                background: linear-gradient(to bottom, rgba(255,255,255,0.7) 10%, transparent 20%);
                transform-origin: bottom center;
                transform: rotate(calc(var(--a) * 1deg));
            }
            /* Выделяем основные деления */
            .ticks-container i:nth-child(3n+1) { width: 4px; left: -2px; background: linear-gradient(to bottom, #ff3333 15%, transparent 25%); }

            /* --- СТРЕЛКА (МЕХАНИКА) --- */
            /* Pivot - это невидимая точка вращения в центре низа */
            .needle-pivot-center {
                position: absolute;
                bottom: 10px; left: 50%;
                width: 0; height: 0;
                z-index: 10;
                /* Вращаем ВЕСЬ этот контейнер. Это гарантирует, что стрелка не сместится. */
                /* JS будет менять transform: rotate(...) здесь */
                transform: rotate(-60deg); 
                will-change: transform;
            }

            .needle-body {
                position: absolute;
                bottom: 0; left: -2px; /* Центрируем ширину */
                width: 4px; height: 310px;
                background: #ff0000;
                box-shadow: 0 0 15px #ff0000;
                border-radius: 4px;
            }
            
            /* Противовес стрелки (для реализма) */
            .needle-counterweight {
                position: absolute;
                top: 0; left: -3px;
                width: 6px; height: 40px;
                background: #500;
            }

            .pivot-cap {
                position: absolute;
                bottom: -20px; left: 50%; transform: translateX(-50%);
                width: 60px; height: 60px;
                background: radial-gradient(circle, #333, #000);
                border: 2px solid #333;
                border-radius: 50%;
                z-index: 20;
                box-shadow: 0 -5px 20px rgba(0,0,0,0.8);
            }

            /* ТЕКСТ И ЛАМПОЧКИ */
            .labels {
                position: absolute; bottom: 50px; width: 100%;
                display: flex; justify-content: space-between;
                padding: 0 150px; box-sizing: border-box;
                font-family: monospace; color: #600;
                font-size: 12px; letter-spacing: 2px;
                text-shadow: 0 0 5px #300;
            }
            
            .overload-led {
                position: absolute; bottom: 80px; left: 50%; transform: translateX(-50%);
                width: 12px; height: 12px;
                background: #200;
                border-radius: 50%;
                box-shadow: inset 0 0 5px #000;
                transition: background 0.05s;
            }

            @keyframes fadeIn { from{opacity:0} to{opacity:1} }
            @keyframes slideUp { from{transform: translateY(100%)} to{transform: translateY(0)} }
        `,

        // 3. ИНИЦИАЛИЗАЦИЯ
        init: (instance) => {
            instance.pivot = document.getElementById('eventPivot');
            instance.light = document.getElementById('eventLight');
            
            // Физические параметры
            instance.angle = -60; // Текущий угол
            instance.velocity = 0; // Скорость
        },

        // 4. ФИЗИЧЕСКИЙ ДВИЖОК
        update: (instance, features) => {
            if (!instance.pivot) return;

            // 1. Расчет целевого значения (Target)
            // RMS (0..1) + Bass (0..1). Аластор любит басы.
            // Множитель 1.3 - чтобы стрелка ходила широко, но не билась постоянно.
            let input = (features.rms * 0.6 + features.bassEnergy * 0.4) * 1.3;
            
            // Добавляем "шум эфира" (Jitter)
            // Даже в тишине стрелка будет "дышать"
            const noise = (Math.random() - 0.5) * 0.08;
            input += noise;

            // Ограничиваем диапазон (Clamp)
            if (input < 0) input = 0;
            if (input > 1.1) input = 1.1; // Разрешаем легкий перегруз

            // Переводим в угол (-60 ... +60)
            // Диапазон хода = 120 градусов
            let targetAngle = -60 + (input * 120);

            // 2. Физика пружины (Spring Physics / Smoothing)
            // Attack (вверх) = 0.3 (Быстро)
            // Decay (вниз) = 0.08 (Медленно, инерция)
            let smooth = (targetAngle > instance.angle) ? 0.3 : 0.08;
            
            // Линейная интерполяция (Lerp)
            instance.angle += (targetAngle - instance.angle) * smooth;

            // 3. Отрисовка
            instance.pivot.style.transform = `rotate(${instance.angle}deg)`;

            // 4. Лампочка перегрузки
            if (instance.light) {
                // Если угол > 40 градусов (красная зона)
                if (instance.angle > 40) {
                    instance.light.style.background = '#ff0000';
                    instance.light.style.boxShadow = '0 0 15px #ff0000, 0 0 30px #ff0000';
                } else {
                    instance.light.style.background = '#300';
                    instance.light.style.boxShadow = 'inset 0 0 2px #000';
                }
            }
        }
    }
};
