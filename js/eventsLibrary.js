export const stageEffects = {
    
    // === ЭФФЕКТ: ALASTOR RADIO (TUNED & FADE READY) ===
    radioDial: {
        // 1. HTML
        html: `
            <div class="alastor-overlay-container">
                <!-- Виньетка -->
                <div class="alastor-vignette"></div>
                <!-- Шум -->
                <div class="radio-noise"></div>
                
                <!-- Корпус (с Блюром) -->
                <div class="vu-meter-casing" id="meterContainer">
                    <div class="vu-face">
                        <div class="vu-grid"></div>
                        <!-- Улыбка -->
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
                        <!-- Стрелка -->
                        <div class="vu-needle-pivot" id="eventPivot">
                            <div class="vu-needle"></div>
                        </div>
                        <div class="vu-cap"></div>
                    </div>
                    <!-- Лампа -->
                    <div class="on-air-lamp" id="eventLight"><span>ON AIR</span></div>
                </div>
            </div>
        `,

        // 2. CSS
        css: `
            .alastor-overlay-container {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                display: flex; justify-content: center; align-items: flex-end;
                pointer-events: none; overflow: hidden;
                opacity: 0; 
                animation: fadeInEvent 2s ease forwards; /* Плавное появление */
            }
            
            /* Анимации входа и выхода */
            @keyframes fadeInEvent { to { opacity: 1; } }
            
            /* Класс для плавного исчезновения (добавляется JS-ом) */
            .alastor-overlay-container.fade-out-event {
                opacity: 1;
                animation: fadeOutEvent 1.5s ease forwards !important;
            }
            @keyframes fadeOutEvent { to { opacity: 0; transform: scale(0.95); } }

            .alastor-vignette {
                position: absolute; inset: 0;
                background: radial-gradient(circle, transparent 30%, #000 95%);
                z-index: 10;
            }

            .radio-noise {
                position: absolute; inset: -50%; width: 200%; height: 200%;
                background: url('data:image/svg+xml;utf8,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="n"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="1.5" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23n)" opacity="0.1"/%3E%3C/svg%3E');
                animation: noiseAnim 0.2s steps(4) infinite;
                z-index: 1; opacity: 0.1;
            }
            @keyframes noiseAnim { 0% {transform:translate(0,0)} 100% {transform:translate(10px,10px)} }

            .vu-meter-casing {
                position: relative; z-index: 2;
                width: 700px; height: 400px;
                transform: scale(1.4) translateY(80px); 
                background: #080202;
                border: 6px solid #2a0a0a;
                border-radius: 300px 300px 0 0;
                box-shadow: 0 0 100px rgba(0,0,0,0.9);
                display: flex; justify-content: center;
                filter: blur(5px) brightness(0.6); /* БЛЮР ЗДЕСЬ */
                transition: transform 0.1s cubic-bezier(0.1, 0.9, 0.2, 1);
            }

            .vu-face {
                position: relative; top: 20px;
                width: 600px; height: 350px;
                background: radial-gradient(circle at 50% 100%, #300 0%, #050000 80%);
                border-radius: 280px 280px 0 0; overflow: hidden;
            }

            .vu-grid {
                position: absolute; inset: 0;
                background-image: linear-gradient(rgba(50, 0, 0, 0.2) 2px, transparent 2px), linear-gradient(90deg, rgba(50, 0, 0, 0.2) 2px, transparent 2px);
                background-size: 30px 30px; opacity: 0.3;
            }

            .alastor-smile-wrapper {
                position: absolute; top: 50%; left: 50%; transform: translate(-50%, -20%);
                width: 350px; height: 180px; opacity: 0; transition: opacity 0.2s;
                filter: drop-shadow(0 0 15px #ff0000);
            }
            .smile-svg { width: 100%; height: 100%; overflow: visible; }

            .vu-scale { position: absolute; bottom: 0; left: 0; width: 100%; height: 100%; }
            .scale-svg { position: absolute; bottom: 20px; left: 10%; width: 80%; overflow: visible; }
            .vu-ticks span {
                position: absolute; bottom: 0; left: 50%; width: 4px; height: 310px;
                background: linear-gradient(to bottom, rgba(255, 255, 255, 0.6) 5%, transparent 12%);
                transform-origin: bottom center; transform: rotate(calc(var(--r) * 1deg));
            }
            .vu-ticks span.danger { background: linear-gradient(to bottom, #ff0000 15%, transparent 20%); width: 6px; }

            .vu-needle-pivot {
                position: absolute; bottom: 30px; left: 50%; width: 0; height: 0;
                z-index: 20; transform: rotate(-45deg);
            }
            .vu-needle {
                position: absolute; bottom: 0; left: -3px; width: 6px; height: 330px;
                background: #ff0000; box-shadow: 0 0 20px #ff0000; border-radius: 4px;
            }
            .vu-cap {
                position: absolute; bottom: -20px; left: 50%; transform: translateX(-50%);
                width: 120px; height: 70px; background: #000; border-radius: 50%; z-index: 30;
            }
            .on-air-lamp {
                position: absolute; bottom: 50px; left: 50%; transform: translateX(-50%);
                color: #511; font-family: sans-serif; font-weight: 900; font-size: 18px; letter-spacing: 5px;
                background: #100; padding: 10px 20px; border: 2px solid #300; border-radius: 8px; z-index: 5;
                transition: all 0.1s;
            }
            .on-air-lamp.lit { color: #fff; background: #a00; border-color: #f00; box-shadow: 0 0 50px #f00; }
        `,

        // 3. INIT
        init: (instance) => {
            instance.pivot = document.getElementById('eventPivot');
            instance.light = document.getElementById('eventLight');
            instance.smile = document.getElementById('demonSmile');
            instance.container = document.getElementById('meterContainer');
            instance.wrapper = document.querySelector('.alastor-overlay-container'); // Ссылка для анимации выхода
            
            instance.angle = -45; 
            instance.velocity = 0;
            instance.smoothedSignal = 0; 
        },

        // 4. UPDATE
        update: (instance, features) => {
            if (!instance.pivot) return;

            // --- ЧУВСТВИТЕЛЬНОСТЬ (FIXED) ---
            // Повысил множители: RMS 1.2 (для громкости) + Bass 0.35 (для ударов)
            // Это позволит доходить до максимума, но не залипать там.
            let rawInput = (features.rms * 1.2) + (features.bassEnergy * 0.35);
            
            // Сглаживание (Инерция прибора)
            instance.smoothedSignal += (rawInput - instance.smoothedSignal) * 0.1;

            // Расчет угла
            let targetAngle = -45 + (instance.smoothedSignal * 90);
            
            // Clamp (Ограничители)
            if (targetAngle < -46) targetAngle = -46;
            if (targetAngle > 48) targetAngle = 48; // Почти 50, но с запасом

            // --- ФИЗИКА ---
            // Пружина чуть жестче (0.1), чтобы реагировала быстрее
            const springForce = 0.1; 
            const damping = 0.85; 

            const acceleration = (targetAngle - instance.angle) * springForce;
            instance.velocity += acceleration;
            instance.velocity *= damping;
            instance.angle += instance.velocity;

            // --- ТРЯСКА (SHIVER) ---
            // Дрожание лево-вправо
            const shiver = (Math.random() - 0.5) * (1 + features.rms * 5);
            const finalAngle = instance.angle + shiver;

            instance.pivot.style.transform = `rotate(${finalAngle}deg)`;

            // --- РЕАКЦИЯ НА УДАР ---
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
    }
};
