export const stageEffects = {
    
    // === ЭФФЕКТ: ALASTOR RADIO (BIG & BOUNCY VERSION) ===
    radioDial: {
        // 1. HTML
        html: `
            <div class="alastor-overlay-container">
                <!-- Старый шум для атмосферы -->
                <div class="radio-noise"></div>
                
                <!-- Контейнер прибора -->
                <div class="vu-meter-casing" id="meterContainer">
                    
                    <!-- Лицевая панель -->
                    <div class="vu-face">
                        <!-- Текстура сетки -->
                        <div class="vu-grid"></div>
                        
                        <!-- Зловещая улыбка (SVG) -->
                        <div class="alastor-smile-wrapper" id="demonSmile">
                            <svg viewBox="0 0 100 60" class="smile-svg">
                                <!-- Зубы -->
                                <path d="M10,10 Q50,60 90,10" fill="none" stroke="#500" stroke-width="4" stroke-linecap="round" />
                                <path d="M15,15 L18,35 M25,20 L28,45 M38,25 L40,50 M50,25 L50,52 M62,25 L60,50 M75,20 L72,45 M85,15 L82,35" stroke="#500" stroke-width="3" stroke-linecap="round" />
                            </svg>
                        </div>

                        <!-- Шкала -->
                        <div class="vu-scale">
                            <!-- Дуга -->
                            <svg viewBox="0 0 200 100" class="scale-svg">
                                <path d="M20,100 A80,80 0 0,1 180,100" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2" />
                            </svg>
                            <!-- Деления -->
                            <div class="vu-ticks">
                                <span style="--r:-45"></span><span style="--r:-30"></span>
                                <span style="--r:-15"></span><span style="--r:0"></span>
                                <span style="--r:15"></span><span style="--r:30"></span>
                                <span style="--r:45" class="danger"></span>
                            </div>
                        </div>

                        <!-- Стрелка -->
                        <div class="vu-needle-pivot" id="eventPivot">
                            <div class="vu-needle"></div>
                            <div class="vu-needle-tail"></div>
                        </div>
                        
                        <!-- Крышка основания -->
                        <div class="vu-cap"></div>
                    </div>

                    <!-- Лампа -->
                    <div class="on-air-lamp" id="eventLight">
                        <span>BROADCASTING</span>
                    </div>
                </div>
            </div>
        `,

        // 2. CSS
        css: `
            .alastor-overlay-container {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                display: flex; justify-content: center; align-items: flex-end;
                pointer-events: none;
                overflow: hidden;
                /* Плавный вход/выход при переключении треков */
                opacity: 0; 
                animation: fadeInSlow 1.5s ease forwards;
            }

            @keyframes fadeInSlow { to { opacity: 1; } }

            /* Шум на фоне */
            .radio-noise {
                position: absolute; inset: -50%; width: 200%; height: 200%;
                background: url('data:image/svg+xml;utf8,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="n"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="1.5" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23n)" opacity="0.1"/%3E%3C/svg%3E');
                animation: noiseAnim 0.2s steps(4) infinite;
                z-index: 1;
                opacity: 0.15;
            }
            @keyframes noiseAnim { 0% {transform:translate(0,0)} 100% {transform:translate(10px,10px)} }

            /* КОРПУС - Сделан ОГРОМНЫМ */
            .vu-meter-casing {
                position: relative; 
                z-index: 2; /* За плеером, но над фоном */
                width: 700px; height: 400px;
                /* Масштабируем, чтобы он был массивным фоном */
                transform: scale(1.4) translateY(100px); 
                background: #080202;
                border: 6px solid #2a0a0a;
                border-radius: 300px 300px 0 0;
                box-shadow: 0 0 100px rgba(0,0,0,0.9), inset 0 0 50px #000;
                display: flex; justify-content: center;
                /* Плавное движение самого корпуса при басах */
                transition: transform 0.1s cubic-bezier(0.1, 0.9, 0.2, 1);
            }

            .vu-face {
                position: relative; top: 20px;
                width: 600px; height: 350px;
                background: radial-gradient(circle at 50% 100%, #300 0%, #050000 80%);
                border-radius: 280px 280px 0 0;
                overflow: hidden;
                box-shadow: inset 0 0 20px #000;
            }

            .vu-grid {
                position: absolute; inset: 0;
                background-image: 
                    linear-gradient(rgba(50, 0, 0, 0.1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(50, 0, 0, 0.1) 1px, transparent 1px);
                background-size: 20px 20px;
                opacity: 0.5;
            }

            /* УЛЫБКА */
            .alastor-smile-wrapper {
                position: absolute; top: 50%; left: 50%;
                transform: translate(-50%, -20%);
                width: 300px; height: 150px;
                opacity: 0;
                transition: opacity 0.1s;
                filter: drop-shadow(0 0 8px #ff0000);
            }
            .smile-svg { width: 100%; height: 100%; overflow: visible; }

            /* ШКАЛА */
            .vu-scale {
                position: absolute; bottom: 0; left: 0; width: 100%; height: 100%;
            }
            .scale-svg {
                position: absolute; bottom: 20px; left: 10%; width: 80%;
                overflow: visible;
            }
            .vu-ticks span {
                position: absolute; bottom: 0; left: 50%;
                width: 3px; height: 320px; /* Длинные риски */
                background: linear-gradient(to bottom, rgba(200, 150, 150, 0.4) 5%, transparent 10%);
                transform-origin: bottom center;
                transform: rotate(calc(var(--r) * 1deg));
            }
            .vu-ticks span.danger {
                background: linear-gradient(to bottom, #ff0000 10%, transparent 15%);
                width: 5px;
                box-shadow: 0 0 10px #f00;
            }

            /* СТРЕЛКА */
            .vu-needle-pivot {
                position: absolute; bottom: 20px; left: 50%;
                width: 0; height: 0;
                z-index: 20;
                transform: rotate(-45deg);
                /* Удаляем transition в CSS, будем двигать только JS для физики */
            }
            .vu-needle {
                position: absolute; bottom: 0; left: -2px;
                width: 4px; height: 340px;
                background: #ff1a1a;
                box-shadow: 0 0 15px #ff0000;
                border-radius: 4px;
            }
            .vu-needle-tail {
                position: absolute; top: 0; left: -4px;
                width: 8px; height: 50px;
                background: #500;
            }

            .vu-cap {
                position: absolute; bottom: -20px; left: 50%; transform: translateX(-50%);
                width: 100px; height: 60px;
                background: linear-gradient(#200, #000);
                border-radius: 50%;
                border: 2px solid #400;
                z-index: 30;
                box-shadow: 0 -5px 10px rgba(0,0,0,0.5);
            }

            /* ЛАМПА */
            .on-air-lamp {
                position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%);
                color: #300;
                font-family: monospace; font-size: 16px; letter-spacing: 5px; font-weight: bold;
                background: #100;
                padding: 5px 15px;
                border: 1px solid #300;
                border-radius: 4px;
                z-index: 5;
                transition: all 0.05s;
            }
            .on-air-lamp.lit {
                color: #fff;
                background: #900;
                border-color: #f00;
                box-shadow: 0 0 30px #f00;
                text-shadow: 0 0 5px #fff;
            }
        `,

        // 3. INIT
        init: (instance) => {
            instance.pivot = document.getElementById('eventPivot');
            instance.light = document.getElementById('eventLight');
            instance.smile = document.getElementById('demonSmile');
            instance.container = document.getElementById('meterContainer');
            
            // Физические переменные
            instance.angle = -45; 
            instance.velocity = 0; // Скорость стрелки
        },

        // 4. UPDATE (PHYSICS)
        update: (instance, features) => {
            if (!instance.pivot) return;

            // --- 1. РАСЧЕТ ЦЕЛИ (Target) ---
            // Используем логарифмическую шкалу для реализма (звук не линеен)
            // Добавляем бас отдельно для "удара"
            let signal = (features.rms * 2) + (features.bassEnergy * 0.8);
            
            // "Шум" (Jitter) - стрелка никогда не стоит идеально ровно
            const jitter = (Math.random() - 0.5) * 3;

            // Преобразуем 0..1 в угол -45..+45
            let targetAngle = -45 + (signal * 90) + jitter;
            
            // Ограничиваем пределы (чтобы не ломалась шея стрелки)
            if (targetAngle < -48) targetAngle = -48;
            if (targetAngle > 50) targetAngle = 50; // Позволяем легкий перегруз

            // --- 2. ФИЗИКА ПРУЖИНЫ (Spring Physics) ---
            // Сила пружины (тянет к цели)
            const springForce = 0.15; 
            // Затухание (чтобы не болталась вечно)
            const damping = 0.75; 

            // Ускорение = Разница * Сила
            const acceleration = (targetAngle - instance.angle) * springForce;
            
            // Скорость += Ускорение
            instance.velocity += acceleration;
            // Торможение
            instance.velocity *= damping;
            
            // Позиция += Скорость
            instance.angle += instance.velocity;

            // Применяем угол
            instance.pivot.style.transform = `rotate(${instance.angle}deg)`;

            // --- 3. РЕАКЦИЯ КОРПУСА НА БАС ---
            // Если сильный удар, трясем весь огромный прибор
            if (features.bassEnergy > 0.6) {
                const shakeX = (Math.random() - 0.5) * 6;
                const shakeY = (Math.random() - 0.5) * 6;
                const scaleBump = 1.42; // Чуть увеличиваем масштаб на ударе (было 1.4)
                
                // Используем translate3d для производительности
                instance.container.style.transform = `scale(${scaleBump}) translate3d(${shakeX}px, ${100 + shakeY}px, 0)`;
                
                // Включаем лампу
                instance.light.classList.add('lit');
                
                // Показываем улыбку
                instance.smile.style.opacity = (features.bassEnergy - 0.4) * 2;
                
            } else {
                // Возврат в норму
                instance.container.style.transform = `scale(1.4) translate3d(0, 100px, 0)`;
                instance.light.classList.remove('lit');
                
                // Плавно прячем улыбку
                let op = parseFloat(instance.smile.style.opacity) || 0;
                instance.smile.style.opacity = Math.max(0, op - 0.1);
            }
        }
    }
};
