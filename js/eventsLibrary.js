// === ЭФФЕКТ: ALASTOR RADIO (REWORKED) ===
    radioDial: {
        // 1. HTML: Винтажный корпус, шкала, стрелка и скрытая улыбка
        html: `
            <div class="alastor-overlay-container">
                <!-- Фоновый шум и виньетка -->
                <div class="radio-noise"></div>
                <div class="screen-dirt"></div>

                <!-- Основной прибор -->
                <div class="vu-meter-casing" id="meterContainer">
                    
                    <!-- Внутренняя панель -->
                    <div class="vu-face">
                        <!-- Тень и текстура -->
                        <div class="vu-texture"></div>
                        
                        <!-- Скрытая улыбка (проявляется от громкости) -->
                        <div class="alastor-smile" id="demonSmile">
                            <svg viewBox="0 0 100 50">
                                <path d="M10,10 Q50,50 90,10" fill="none" stroke="#4a0000" stroke-width="3" />
                                <path d="M10,10 L15,25 M20,15 L23,30 M30,18 L32,35 M40,20 L41,38 M50,20 L50,38 M60,20 L59,38 M70,18 L68,35 M80,15 L77,30 M90,10 L85,25" stroke="#4a0000" stroke-width="2" />
                            </svg>
                        </div>

                        <!-- Шкала делений -->
                        <div class="vu-scale">
                            <div class="vu-arc"></div>
                            <div class="vu-ticks">
                                <span style="--r:-45"></span><span style="--r:-30"></span>
                                <span style="--r:-15"></span><span style="--r:0"></span>
                                <span style="--r:15"></span><span style="--r:30"></span>
                                <span style="--r:45" class="danger"></span>
                            </div>
                            <div class="vu-labels">
                                <span class="lbl-left">-20</span>
                                <span class="lbl-mid">VU</span>
                                <span class="lbl-right">+3</span>
                            </div>
                        </div>

                        <!-- Стрелка -->
                        <div class="vu-needle-wrapper" id="eventPivot">
                            <div class="vu-needle"></div>
                            <div class="vu-needle-glow"></div>
                        </div>
                        
                        <!-- Основание стрелки -->
                        <div class="vu-cap">
                            <div class="vu-cap-screw"></div>
                        </div>
                    </div>

                    <!-- Лампа "ON AIR" / перегрузка -->
                    <div class="on-air-sign" id="eventLight">ON AIR</div>
                </div>
            </div>
        `,

        // 2. CSS: Art Deco, неон и мрачность
        css: `
            .alastor-overlay-container {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                display: flex; justify-content: center; align-items: flex-end;
                padding-bottom: 50px;
                overflow: hidden;
                perspective: 1000px;
                pointer-events: none;
            }

            /* Эффекты старой пленки */
            .radio-noise {
                position: absolute; inset: 0;
                background: url('data:image/svg+xml;utf8,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noiseFilter)" opacity="0.15"/%3E%3C/svg%3E');
                opacity: 0.1; z-index: 1;
                animation: noiseShift 0.2s steps(3) infinite;
            }
            @keyframes noiseShift { 0% { transform: translate(0,0); } 100% { transform: translate(10px, 10px); } }

            .screen-dirt {
                position: absolute; inset: 0;
                box-shadow: inset 0 0 150px rgba(0,0,0,0.9);
                z-index: 2;
            }

            /* КОРПУС ПРИБОРА (Стиль Art Deco) */
            .vu-meter-casing {
                position: relative; z-index: 10;
                width: 500px; height: 320px;
                background: #0f0505;
                border: 4px solid #3a1a1a;
                border-radius: 200px 200px 20px 20px; /* Форма арки */
                box-shadow: 0 20px 50px rgba(0,0,0,0.8), 0 0 0 10px #150505;
                transform-origin: bottom center;
                transform: translateY(100%);
                animation: popUp 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
            }

            @keyframes popUp { to { transform: translateY(0); } }

            /* ЛИЦЕВАЯ ПАНЕЛЬ */
            .vu-face {
                position: relative;
                width: 100%; height: 100%;
                background: radial-gradient(circle at 50% 80%, #3e1e1e 0%, #000000 90%);
                border-radius: 196px 196px 16px 16px;
                overflow: hidden;
            }

            /* УЛЫБКА ДЕМОНА */
            .alastor-smile {
                position: absolute;
                top: 50%; left: 50%;
                transform: translate(-50%, -20%) scale(1.5);
                width: 200px; height: 100px;
                opacity: 0; /* Управляется JS */
                filter: drop-shadow(0 0 5px #ff0000);
                transition: opacity 0.1s;
            }

            /* ШКАЛА */
            .vu-scale {
                position: absolute;
                bottom: -20px; left: 50%; transform: translateX(-50%);
                width: 400px; height: 250px;
            }
            .vu-ticks span {
                position: absolute; bottom: 0; left: 50%;
                width: 2px; height: 260px;
                background: linear-gradient(to bottom, rgba(255,215,0,0.6) 5%, transparent 15%);
                transform-origin: bottom center;
                transform: rotate(calc(var(--r) * 1deg));
            }
            .vu-ticks span.danger {
                background: linear-gradient(to bottom, #ff0000 15%, transparent 25%);
                width: 4px;
                box-shadow: 0 0 10px #ff0000;
            }

            .vu-labels {
                position: absolute; top: 60px; width: 100%;
                display: flex; justify-content: space-between;
                padding: 0 80px; box-sizing: border-box;
                font-family: 'Courier New', monospace;
                font-weight: bold; color: #bfafa6;
                text-shadow: 0 0 2px #000;
                opacity: 0.8;
            }

            /* СТРЕЛКА */
            .vu-needle-wrapper {
                position: absolute;
                bottom: 20px; left: 50%;
                width: 0; height: 0;
                transform: rotate(-45deg); /* Начало слева */
                transition: transform 0.05s linear; /* Очень быстрый отклик */
                z-index: 20;
            }
            .vu-needle {
                position: absolute;
                bottom: -10px; left: -1.5px;
                width: 3px; height: 270px;
                background: #ff0000;
                box-shadow: 0 0 5px rgba(255,0,0,0.8);
                border-radius: 2px;
            }
            /* Эффект шлейфа/размытия при движении */
            .vu-needle-glow {
                position: absolute;
                bottom: -10px; left: -4px;
                width: 8px; height: 270px;
                background: rgba(255,0,0,0.3);
                filter: blur(4px);
            }

            .vu-cap {
                position: absolute;
                bottom: -10px; left: 50%; transform: translateX(-50%);
                width: 70px; height: 40px;
                background: #1a0a0a;
                border-radius: 50% 50% 0 0;
                border-top: 1px solid #400;
                z-index: 25;
            }

            /* ЛАМПА ON AIR */
            .on-air-sign {
                position: absolute;
                bottom: 30px; left: 50%; transform: translateX(-50%);
                font-family: 'Montserrat', sans-serif;
                font-weight: 900; font-size: 14px; letter-spacing: 3px;
                color: #310000;
                background: #100000;
                padding: 4px 12px;
                border: 1px solid #300;
                border-radius: 4px;
                z-index: 5;
                transition: all 0.1s;
            }
            .on-air-sign.lit {
                color: #ffcccc;
                background: #500;
                border-color: #f00;
                box-shadow: 0 0 15px #f00, inset 0 0 10px #f00;
                text-shadow: 0 0 5px #fff;
            }
        `,

        // 3. ИНИЦИАЛИЗАЦИЯ
        init: (instance) => {
            instance.pivot = document.getElementById('eventPivot');
            instance.light = document.getElementById('eventLight');
            instance.smile = document.getElementById('demonSmile');
            instance.container = document.getElementById('meterContainer');
            
            instance.angle = -45; 
            instance.targetAngle = -45;
            
            // Для физики "дрожания"
            instance.jitter = 0;
        },

        // 4. ОБНОВЛЕНИЕ (60 FPS)
        update: (instance, features) => {
            if (!instance.pivot) return;

            // --- ЛОГИКА СТРЕЛКИ ---
            // 1. Базовый вход: Громкость + Бас
            // Умножаем на 1.5, чтобы стрелка летала агрессивнее
            let input = (features.rms * 0.8 + features.bassEnergy * 0.5) * 1.5;

            // 2. Эффект "Радиопомех" (Jitter)
            // Даже в тишине стрелка чуть-чуть дрожит, как старый прибор
            instance.jitter = (Math.random() - 0.5) * 2; 
            
            // 3. Реакция на удар (Beat)
            if (features.isBeat) {
                // Резкий скачок вперед
                input += 0.4;
                // Тряска всего корпуса
                instance.container.style.transform = `translate(${Math.random()*4 - 2}px, ${Math.random()*4 - 2}px)`;
            } else {
                instance.container.style.transform = `translate(0, 0)`;
            }

            // Ограничение (Clamp)
            if (input > 1.2) input = 1.2; // Небольшой зашкал допустим

            // Перевод в градусы (-45 ... +45)
            let target = -45 + (input * 90) + instance.jitter;

            // 4. Физика движения (Резко вверх, медленнее вниз - баллистика VU метра)
            if (target > instance.angle) {
                // Attack: очень быстро
                instance.angle += (target - instance.angle) * 0.4; 
            } else {
                // Decay: инерция, медленный возврат
                instance.angle += (target - instance.angle) * 0.15; 
            }

            instance.pivot.style.transform = `rotate(${instance.angle}deg)`;

            // --- УПРАВЛЕНИЕ ЛАМПОЙ И УЛЫБКОЙ ---
            
            // Лампа загорается при перегрузке (угол > 25)
            if (instance.angle > 25) {
                instance.light.classList.add('lit');
                // Улыбка становится видна, когда громко
                instance.smile.style.opacity = Math.min(1, (instance.angle / 45));
                instance.smile.style.transform = `translate(-50%, -20%) scale(${1.5 + (features.bassEnergy * 0.2)})`;
            } else {
                instance.light.classList.remove('lit');
                // Плавно гасим улыбку
                let currentOp = parseFloat(instance.smile.style.opacity) || 0;
                instance.smile.style.opacity = Math.max(0, currentOp - 0.05);
            }
        }
    },
