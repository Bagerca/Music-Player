export const stageEffects = {
    
    // === ЭФФЕКТ 1: ALASTOR RADIO (FINAL BLURRED & SHIVER VERSION) ===
    radioDial: {
        // 1. HTML
        html: `
            <div class="alastor-overlay-container">
                <!-- Виньетка (затемнение по краям) -->
                <div class="alastor-vignette"></div>

                <!-- Фоновый шум -->
                <div class="radio-noise"></div>
                
                <!-- Контейнер прибора (С БЛЮРОМ) -->
                <div class="vu-meter-casing" id="meterContainer">
                    
                    <!-- Лицевая панель -->
                    <div class="vu-face">
                        <!-- Текстура -->
                        <div class="vu-grid"></div>
                        
                        <!-- Улыбка (скрытая) -->
                        <div class="alastor-smile-wrapper" id="demonSmile">
                            <svg viewBox="0 0 100 60" class="smile-svg">
                                <path d="M10,10 Q50,60 90,10" fill="none" stroke="#500" stroke-width="5" stroke-linecap="round" />
                                <path d="M15,15 L18,35 M25,20 L28,45 M38,25 L40,50 M50,25 L50,52 M62,25 L60,50 M75,20 L72,45 M85,15 L82,35" stroke="#500" stroke-width="3" stroke-linecap="round" />
                            </svg>
                        </div>

                        <!-- Шкала -->
                        <div class="vu-scale">
                            <svg viewBox="0 0 200 100" class="scale-svg">
                                <path d="M20,100 A80,80 0 0,1 180,100" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="3" />
                            </svg>
                            <div class="vu-ticks">
                                <span style="--r:-45"></span><span style="--r:-30"></span>
                                <span style="--r:-15"></span><span style="--r:0"></span>
                                <span style="--r:15"></span><span style="--r:30"></span>
                                <span style="--r:45" class="danger"></span>
                            </div>
                        </div>

                        <!-- Стрелка (ОДНА) -->
                        <div class="vu-needle-pivot" id="eventPivot">
                            <div class="vu-needle"></div>
                        </div>
                        
                        <!-- Крышка основания -->
                        <div class="vu-cap"></div>
                    </div>

                    <!-- Лампа -->
                    <div class="on-air-lamp" id="eventLight">
                        <span>ON AIR</span>
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
                opacity: 0; 
                animation: fadeInEvent 2s ease forwards;
            }

            @keyframes fadeInEvent { to { opacity: 1; } }

            /* Класс для плавного исчезновения (добавляется JS-ом) */
            .alastor-overlay-container.fade-out-event {
                opacity: 1;
                animation: fadeOutEvent 1.5s ease forwards !important;
            }
            @keyframes fadeOutEvent { to { opacity: 0; transform: scale(0.95); } }

            /* ВИНЬЕТКА */
            .alastor-vignette {
                position: absolute; inset: 0;
                background: radial-gradient(circle, transparent 30%, #000 90%);
                z-index: 10; 
            }

            .radio-noise {
                position: absolute; inset: -50%; width: 200%; height: 200%;
                background: url('data:image/svg+xml;utf8,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="n"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="1.5" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23n)" opacity="0.1"/%3E%3C/svg%3E');
                animation: noiseAnim 0.2s steps(4) infinite;
                z-index: 1;
                opacity: 0.1;
            }
            @keyframes noiseAnim { 0% {transform:translate(0,0)} 100% {transform:translate(10px,10px)} }

            /* КОРПУС С БЛЮРОМ */
            .vu-meter-casing {
                position: relative; 
                z-index: 2;
                width: 700px; height: 400px;
                transform: scale(1.4) translateY(80px); 
                background: #080202;
                border: 6px solid #2a0a0a;
                border-radius: 300px 300px 0 0;
                box-shadow: 0 0 100px rgba(0,0,0,0.9);
                display: flex; justify-content: center;
                
                /* Размытие */
                filter: blur(5px) brightness(0.6); 
                transition: transform 0.2s cubic-bezier(0.1, 0.9, 0.2, 1), filter 0.5s;
            }

            .vu-face {
                position: relative; top: 20px;
                width: 600px; height: 350px;
                background: radial-gradient(circle at 50% 100%, #300 0%, #050000 80%);
                border-radius: 280px 280px 0 0;
                overflow: hidden;
            }

            .vu-grid {
                position: absolute; inset: 0;
                background-image: 
                    linear-gradient(rgba(50, 0, 0, 0.2) 2px, transparent 2px),
                    linear-gradient(90deg, rgba(50, 0, 0, 0.2) 2px, transparent 2px);
                background-size: 30px 30px;
                opacity: 0.3;
            }

            .alastor-smile-wrapper {
                position: absolute; top: 50%; left: 50%;
                transform: translate(-50%, -20%);
                width: 350px; height: 180px;
                opacity: 0;
                transition: opacity 0.2s;
                filter: drop-shadow(0 0 15px #ff0000);
            }
            .smile-svg { width: 100%; height: 100%; overflow: visible; }

            .vu-scale { position: absolute; bottom: 0; left: 0; width: 100%; height: 100%; }
            .scale-svg { position: absolute; bottom: 20px; left: 10%; width: 80%; overflow: visible; }
            
            .vu-ticks span {
                position: absolute; bottom: 0; left: 50%;
                width: 4px; height: 310px;
                background: linear-gradient(to bottom, rgba(255, 255, 255, 0.6) 5%, transparent 12%);
                transform-origin: bottom center;
                transform: rotate(calc(var(--r) * 1deg));
            }
            .vu-ticks span.danger {
                background: linear-gradient(to bottom, #ff0000 15%, transparent 20%);
                width: 6px;
            }

            .vu-needle-pivot {
                position: absolute; bottom: 30px; left: 50%;
                width: 0; height: 0;
                z-index: 20;
                transform: rotate(-45deg);
            }
            .vu-needle {
                position: absolute; bottom: 0; left: -3px;
                width: 6px; height: 330px;
                background: #ff0000;
                box-shadow: 0 0 20px #ff0000;
                border-radius: 4px;
            }

            .vu-cap {
                position: absolute; bottom: -20px; left: 50%; transform: translateX(-50%);
                width: 120px; height: 70px;
                background: #000;
                border-radius: 50%;
                z-index: 30;
            }

            .on-air-lamp {
                position: absolute; bottom: 50px; left: 50%; transform: translateX(-50%);
                color: #511;
                font-family: sans-serif; font-weight: 900; font-size: 18px; letter-spacing: 5px;
                background: #100;
                padding: 10px 20px;
                border: 2px solid #300;
                border-radius: 8px;
                z-index: 5;
                transition: all 0.1s;
            }
            .on-air-lamp.lit {
                color: #fff;
                background: #a00;
                border-color: #f00;
                box-shadow: 0 0 50px #f00;
            }
        `,

        // 3. INIT
        init: (instance) => {
            instance.pivot = document.getElementById('eventPivot');
            instance.light = document.getElementById('eventLight');
            instance.smile = document.getElementById('demonSmile');
            instance.container = document.getElementById('meterContainer');
            
            instance.angle = -45; 
            instance.velocity = 0;
            instance.smoothedSignal = 0; 
        },

        // 4. UPDATE (TWEAKED PHYSICS)
        update: (instance, features) => {
            if (!instance.pivot) return;

            // --- 1. ЧУВСТВИТЕЛЬНОСТЬ (SENSITIVITY) ---
            // Множители: RMS 1.2 (для громкости) + Bass 0.35 (для ударов)
            let rawInput = (features.rms * 1.2) + (features.bassEnergy * 0.35);
            
            // Сглаживание входящего сигнала (Инерция)
            instance.smoothedSignal += (rawInput - instance.smoothedSignal) * 0.1;

            // --- 2. РАСЧЕТ УГЛА ---
            let targetAngle = -45 + (instance.smoothedSignal * 90);
            
            // Лимиты (Clamp)
            if (targetAngle < -46) targetAngle = -46;
            if (targetAngle > 48) targetAngle = 48; 

            // --- 3. ФИЗИКА ПРУЖИНЫ ---
            const springForce = 0.1; 
            const damping = 0.85; 

            const acceleration = (targetAngle - instance.angle) * springForce;
            instance.velocity += acceleration;
            instance.velocity *= damping;
            instance.angle += instance.velocity;

            // --- 4. ТРЯСКА (VIBRATION/SHIVER) ---
            // Дрожание лево-вправо пропорционально громкости
            const shiver = (Math.random() - 0.5) * (1 + features.rms * 5);
            const finalAngle = instance.angle + shiver;

            instance.pivot.style.transform = `rotate(${finalAngle}deg)`;

            // --- 5. РЕАКЦИЯ НА БИТ ---
            if (features.bassEnergy > 0.65) { 
                const shakeX = (Math.random() - 0.5) * 4;
                const shakeY = (Math.random() - 0.5) * 4;
                
                instance.container.style.transform = `scale(1.41) translate3d(${shakeX}px, ${80 + shakeY}px, 0)`;
                instance.light.classList.add('lit');
                instance.smile.style.opacity = (features.bassEnergy - 0.4) * 1.8;
                
            } else {
                instance.container.style.transform = `scale(1.4) translate3d(0, 80px, 0)`;
                instance.light.classList.remove('lit');
                
                let op = parseFloat(instance.smile.style.opacity) || 0;
                instance.smile.style.opacity = Math.max(0, op - 0.05);
            }
        }
    },

    // === ЭФФЕКТ 2: ВУДУ СКРИМЕР (1 СЕКУНДА) ===
    voodooFlash: {
        html: `
            <div class="voodoo-overlay">
                <!-- Фон с помехами -->
                <div class="static-bg"></div>
                
                <!-- Центральный символ (Глаз-микрофон) -->
                <div class="voodoo-symbol">
                    <svg viewBox="0 0 100 100">
                        <!-- Внешнее кольцо -->
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#39ff14" stroke-width="2" stroke-dasharray="5,5" />
                        <!-- Глаз -->
                        <path d="M10,50 Q50,10 90,50 Q50,90 10,50" fill="#000" stroke="#39ff14" stroke-width="3" />
                        <circle cx="50" cy="50" r="15" fill="#ff0000" />
                        <!-- Зрачок -->
                        <rect x="48" y="35" width="4" height="30" fill="#000" />
                        <!-- X символы -->
                        <text x="20" y="80" fill="#ff0000" font-family="monospace" font-size="20">X</text>
                        <text x="70" y="80" fill="#ff0000" font-family="monospace" font-size="20">X</text>
                    </svg>
                </div>
                
                <!-- Текст -->
                <div class="glitch-text">HAHAHA</div>
            </div>
        `,
        css: `
            .voodoo-overlay {
                position: absolute; inset: 0;
                background: #000;
                z-index: 100; /* Перекрывает всё */
                display: flex; justify-content: center; align-items: center;
                overflow: hidden;
                /* Эффект инверсии цветов для жути */
                mix-blend-mode: hard-light;
            }

            .static-bg {
                position: absolute; inset: -50%; width: 200%; height: 200%;
                background: url('data:image/svg+xml;utf8,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="n"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="1.5" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23n)" opacity="0.4"/%3E%3C/svg%3E');
                animation: staticMove 0.1s steps(4) infinite;
                opacity: 0.3;
            }
            @keyframes staticMove { 0% {transform:translate(0,0)} 100% {transform:translate(20px,-20px)} }

            .voodoo-symbol {
                position: relative; width: 300px; height: 300px;
                filter: drop-shadow(0 0 20px #39ff14);
                animation: symbolShake 0.1s infinite;
            }
            .voodoo-symbol svg { width: 100%; height: 100%; overflow: visible; }

            @keyframes symbolShake {
                0% { transform: scale(1) rotate(0deg); }
                25% { transform: scale(1.1) rotate(5deg); }
                50% { transform: scale(0.9) rotate(-5deg); }
                75% { transform: scale(1.05) rotate(2deg); }
                100% { transform: scale(1) rotate(0deg); }
            }

            .glitch-text {
                position: absolute;
                font-family: 'Courier New', monospace; font-weight: 900; font-size: 100px;
                color: rgba(255, 0, 0, 0.2);
                letter-spacing: 20px;
                animation: textFlash 0.15s infinite;
                pointer-events: none;
            }
            @keyframes textFlash {
                0% { opacity: 0; transform: scale(2); }
                50% { opacity: 1; transform: scale(1.5); }
                100% { opacity: 0; transform: scale(2); }
            }
        `,
        init: () => {}, // Логика не нужна, только CSS анимация
        update: () => {}
    }
};
