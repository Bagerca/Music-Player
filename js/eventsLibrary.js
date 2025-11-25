export const stageEffects = {
    
    // === ЭФФЕКТ 1: ALASTOR RADIO ===
    radioDial: {
        html: `
            <div class="alastor-overlay-container">
                <div class="alastor-vignette"></div>
                <div class="radio-noise"></div>
                <div class="vu-meter-casing" id="meterContainer">
                    <div class="vu-face">
                        <div class="vu-grid"></div>
                        <div class="alastor-smile-wrapper" id="demonSmile">
                            <svg viewBox="0 0 100 60" class="smile-svg">
                                <path d="M10,10 Q50,60 90,10" fill="none" stroke="#500" stroke-width="5" stroke-linecap="round" />
                                <path d="M15,15 L18,35 M25,20 L28,45 M38,25 L40,50 M50,25 L50,52 M62,25 L60,50 M75,20 L72,45 M85,15 L82,35" stroke="#500" stroke-width="3" stroke-linecap="round" />
                            </svg>
                        </div>
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
                        <div class="vu-needle-pivot" id="eventPivot">
                            <div class="vu-needle"></div>
                        </div>
                        <div class="vu-cap"></div>
                    </div>
                    <div class="on-air-lamp" id="eventLight">
                        <span>ON AIR</span>
                    </div>
                </div>
            </div>
        `,
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
            .alastor-overlay-container.fade-out-event {
                opacity: 1;
                animation: fadeOutEvent 1.5s ease forwards !important;
            }
            @keyframes fadeOutEvent { to { opacity: 0; transform: scale(0.95); } }
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
            .vu-meter-casing {
                position: relative; z-index: 2; width: 700px; height: 400px;
                transform: scale(1.4) translateY(80px); 
                background: #080202; border: 6px solid #2a0a0a;
                border-radius: 300px 300px 0 0; box-shadow: 0 0 100px rgba(0,0,0,0.9);
                display: flex; justify-content: center;
                filter: blur(5px) brightness(0.6); 
                transition: transform 0.2s cubic-bezier(0.1, 0.9, 0.2, 1), filter 0.5s;
            }
            .vu-face {
                position: relative; top: 20px; width: 600px; height: 350px;
                background: radial-gradient(circle at 50% 100%, #300 0%, #050000 80%);
                border-radius: 280px 280px 0 0; overflow: hidden;
            }
            .vu-grid {
                position: absolute; inset: 0;
                background-image: linear-gradient(rgba(50, 0, 0, 0.2) 2px, transparent 2px), linear-gradient(90deg, rgba(50, 0, 0, 0.2) 2px, transparent 2px);
                background-size: 30px 30px; opacity: 0.3;
            }
            .alastor-smile-wrapper {
                position: absolute; top: 50%; left: 50%;
                transform: translate(-50%, -20%); width: 350px; height: 180px;
                opacity: 0; transition: opacity 0.2s; filter: drop-shadow(0 0 15px #ff0000);
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
                background: #100; padding: 10px 20px; border: 2px solid #300; border-radius: 8px;
                z-index: 5; transition: all 0.1s;
            }
            .on-air-lamp.lit { color: #fff; background: #a00; border-color: #f00; box-shadow: 0 0 50px #f00; }
        `,
        init: (instance) => {
            instance.pivot = document.getElementById('eventPivot');
            instance.light = document.getElementById('eventLight');
            instance.smile = document.getElementById('demonSmile');
            instance.container = document.getElementById('meterContainer');
            instance.angle = -45; instance.velocity = 0; instance.smoothedSignal = 0; 
        },
        update: (instance, features) => {
            if (!instance.pivot) return;
            let rawInput = (features.rms * 1.2) + (features.bassEnergy * 0.35);
            instance.smoothedSignal += (rawInput - instance.smoothedSignal) * 0.1;
            let targetAngle = -45 + (instance.smoothedSignal * 90);
            if (targetAngle < -46) targetAngle = -46;
            if (targetAngle > 48) targetAngle = 48; 
            const springForce = 0.1; const damping = 0.85; 
            const acceleration = (targetAngle - instance.angle) * springForce;
            instance.velocity += acceleration;
            instance.velocity *= damping;
            instance.angle += instance.velocity;
            const shiver = (Math.random() - 0.5) * (1 + features.rms * 5);
            const finalAngle = instance.angle + shiver;
            instance.pivot.style.transform = `rotate(${finalAngle}deg)`;
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

    // === ЭФФЕКТ 2: DEMONIC GLARE ===
    demonicGlare: {
        html: `
            <div class="glare-overlay">
                <div class="blackout-bg"></div>
                <div class="radio-eye-container">
                    <svg viewBox="0 0 100 100" class="eye-svg">
                        <defs>
                            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
                                <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                            </filter>
                        </defs>
                        <path d="M10,50 Q50,10 90,50 Q50,90 10,50" fill="#200" stroke="#ff0000" stroke-width="2" filter="url(#glow)" />
                        <circle cx="50" cy="50" r="20" fill="#ff0000" opacity="0.8" />
                        <path d="M50,70 L48,30 L52,30 Z" fill="#000" />
                        <path d="M30,50 L35,50 M70,50 L65,50 M50,30 L50,35" stroke="#000" stroke-width="2" />
                    </svg>
                </div>
                <div class="voodoo-rune left">†</div>
                <div class="voodoo-rune right">†</div>
            </div>
        `,
        css: `
            .glare-overlay {
                position: absolute; inset: 0; z-index: 9999; pointer-events: none;
                display: flex; justify-content: center; align-items: center; overflow: hidden;
            }
            .blackout-bg {
                position: absolute; inset: 0; background: #000; opacity: 0; animation: hardFlash 0.9s forwards;
            }
            @keyframes hardFlash { 0% { opacity: 1; } 80% { opacity: 1; } 100% { opacity: 0; } }
            .radio-eye-container {
                position: relative; width: 400px; height: 400px; transform: scale(0);
                animation: eyePop 0.8s cubic-bezier(0.1, 0.9, 0.2, 1) forwards; filter: drop-shadow(0 0 30px #ff0000);
            }
            @keyframes eyePop {
                0% { transform: scale(0) rotate(-10deg); opacity: 0; }
                10% { transform: scale(1.2) rotate(0deg); opacity: 1; }
                20% { transform: scale(1) rotate(0deg); opacity: 1; }
                100% { transform: scale(1.5); opacity: 0; filter: blur(10px); }
            }
            .voodoo-rune {
                position: absolute; font-family: serif; font-weight: bold; font-size: 150px;
                color: #ff0000; opacity: 0; animation: runeFlicker 0.6s forwards; text-shadow: 0 0 20px #ff0000;
            }
            .voodoo-rune.left { left: 10%; transform: rotate(-15deg); }
            .voodoo-rune.right { right: 10%; transform: rotate(15deg); }
            @keyframes runeFlicker {
                0% { opacity: 0; transform: scale(2); } 20% { opacity: 1; transform: scale(1); }
                40% { opacity: 0; } 60% { opacity: 1; } 100% { opacity: 0; }
            }
        `,
        init: () => {},
        update: () => {}
    },

    // === ЭФФЕКТ 3: TEETH ===
    overlayTeeth: {
        html: `
            <div class="horror-img-container">
                <img src="picture/Teeth_no i'm not a human.gif" class="horror-img zoom-anim" alt="teeth">
                <div class="vignette-overlay"></div>
            </div>
        `,
        css: `
            .horror-img-container {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                display: flex; justify-content: center; align-items: center;
                pointer-events: none;
                z-index: 5;
                animation: fadeInHorror 1s ease-out forwards;
            }
            .horror-img {
                width: 100%; height: 100%;
                object-fit: cover;
                opacity: 0.8;
                filter: contrast(1.2) brightness(0.8);
                mix-blend-mode: lighten;
            }
            .zoom-anim {
                animation: slowZoom 15s linear forwards;
            }
            .vignette-overlay {
                position: absolute; inset: 0;
                background: radial-gradient(circle, transparent 40%, #000 95%);
            }
            @keyframes fadeInHorror { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slowZoom { from { transform: scale(1); } to { transform: scale(1.3); } }
        `,
        update: (instance, features) => {
            if(instance.img) {
                const opacity = 0.6 + (features.bassEnergy * 0.4);
                instance.img.style.opacity = opacity;
            }
        },
        init: (instance) => {
            instance.img = document.querySelector('.horror-img');
        }
    },

    // === ЭФФЕКТ 4: WALKING 1 ===
    overlayWalking: {
        html: `
            <div class="horror-img-container">
                <img src="picture/walking_no i'm not a human (1).gif" class="horror-img walking-anim" alt="walking">
                <div class="vignette-overlay"></div>
            </div>
        `,
        css: `
            .horror-img-container {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                display: flex; justify-content: center; align-items: center;
                pointer-events: none;
                z-index: 5;
                animation: fadeInHorror 1s ease-out forwards;
            }
            .horror-img {
                width: 100%; height: 100%;
                object-fit: cover;
            }
            .walking-anim {
                opacity: 0.6;
                filter: sepia(0.5) contrast(1.1);
                animation: panLeft 20s linear forwards;
            }
            .vignette-overlay {
                position: absolute; inset: 0;
                background: radial-gradient(circle, transparent 40%, #000 95%);
            }
            @keyframes fadeInHorror { from { opacity: 0; } to { opacity: 1; } }
            @keyframes panLeft { 
                from { transform: scale(1.1) translateX(10px); } 
                to { transform: scale(1.2) translateX(-10px); } 
            }
        `,
        update: (instance, features) => {
            if(instance.img) {
                const flicker = 0.6 + (features.bassEnergy * 0.2);
                instance.img.style.opacity = flicker;
            }
        },
        init: (instance) => {
            instance.img = document.querySelector('.walking-anim');
        }
    },

    // === ЭФФЕКТ 5: WALKING 2 ===
    overlayWalking2: {
        html: `
            <div class="horror-img-container">
                <img src="picture/Walking2_to I'm not a human.gif" class="horror-img walking-anim" alt="walking">
                <div class="vignette-overlay"></div>
            </div>
        `,
        css: `
            .horror-img-container {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                display: flex; justify-content: center; align-items: center;
                pointer-events: none;
                z-index: 5;
                animation: fadeInHorror 1s ease-out forwards;
            }
            .horror-img {
                width: 100%; height: 100%;
                object-fit: cover;
            }
            .walking-anim {
                opacity: 0.6;
                filter: sepia(0.5) contrast(1.1);
                animation: panLeft 20s linear forwards;
            }
            .vignette-overlay {
                position: absolute; inset: 0;
                background: radial-gradient(circle, transparent 40%, #000 95%);
            }
            @keyframes fadeInHorror { from { opacity: 0; } to { opacity: 1; } }
            @keyframes panLeft { 
                from { transform: scale(1.1) translateX(10px); } 
                to { transform: scale(1.2) translateX(-10px); } 
            }
        `,
        update: (instance, features) => {
            if(instance.img) {
                const flicker = 0.6 + (features.bassEnergy * 0.2);
                instance.img.style.opacity = flicker;
            }
        },
        init: (instance) => {
            instance.img = document.querySelector('.walking-anim');
        }
    },

    // === ЭФФЕКТ 6: WALKING 3 ===
    overlayWalking3: {
        html: `
            <div class="horror-img-container">
                <img src="picture/Walking3_to I'm not a human.gif" class="horror-img walking-anim" alt="walking">
                <div class="vignette-overlay"></div>
            </div>
        `,
        css: `
            .horror-img-container {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                display: flex; justify-content: center; align-items: center;
                pointer-events: none;
                z-index: 5;
                animation: fadeInHorror 1s ease-out forwards;
            }
            .horror-img {
                width: 100%; height: 100%;
                object-fit: cover;
            }
            .walking-anim {
                opacity: 0.6;
                filter: sepia(0.5) contrast(1.1);
                animation: panLeft 20s linear forwards;
            }
            .vignette-overlay {
                position: absolute; inset: 0;
                background: radial-gradient(circle, transparent 40%, #000 95%);
            }
            @keyframes fadeInHorror { from { opacity: 0; } to { opacity: 1; } }
            @keyframes panLeft { 
                from { transform: scale(1.1) translateX(10px); } 
                to { transform: scale(1.2) translateX(-10px); } 
            }
        `,
        update: (instance, features) => {
            if(instance.img) {
                const flicker = 0.6 + (features.bassEnergy * 0.2);
                instance.img.style.opacity = flicker;
            }
        },
        init: (instance) => {
            instance.img = document.querySelector('.walking-anim');
        }
    },
    
    // === ЭФФЕКТ 7: EYES ===
    overlayEyes: {
        html: `
            <div class="horror-img-container">
                <img src="picture/Eyes_no i'm not a human.gif" class="horror-img zoom-anim" alt="eyes">
                <div class="vignette-overlay"></div>
            </div>
        `,
        css: `
            .horror-img-container {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                display: flex; justify-content: center; align-items: center;
                pointer-events: none;
                z-index: 5;
                animation: fadeInHorror 0.5s ease-out forwards;
            }
            .horror-img {
                width: 100%; height: 100%; object-fit: cover;
                opacity: 0.7; mix-blend-mode: normal;
            }
            .zoom-anim { animation: slowZoom 15s linear forwards; }
            .vignette-overlay { position: absolute; inset: 0; background: radial-gradient(circle, transparent 30%, #000 90%); }
            @keyframes fadeInHorror { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slowZoom { from { transform: scale(1); } to { transform: scale(1.2) rotate(2deg); } }
        `,
        update: (instance, features) => {
            if(instance.img) {
                const shake = (features.highEnergy * 10) - 2;
                if (shake > 0) {
                     instance.img.style.transform = `scale(1.1) translate(${Math.random()*5}px, ${Math.random()*5}px)`;
                }
            }
        },
        init: (instance) => { instance.img = document.querySelector('.horror-img'); }
    },

    // === ЭФФЕКТ 8: CHECK ===
    overlayCheck: {
        html: `
            <div class="horror-img-container">
                <img src="picture/Check.webp" class="horror-img pulse-anim" alt="check">
            </div>
        `,
        css: `
            .horror-img-container {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                display: flex; justify-content: center; align-items: center;
                pointer-events: none;
                z-index: 6;
                animation: fadeInHorror 2s ease-in forwards;
                background: rgba(0,0,0,0.5);
            }
            .horror-img {
                max-width: 90%; max-height: 90%;
                object-fit: contain;
                box-shadow: 0 0 50px rgba(0,0,0,0.8);
            }
            @keyframes fadeInHorror { from { opacity: 0; } to { opacity: 1; } }
        `,
        update: (instance, features) => {
            if(instance.img) {
                const scale = 1 + (features.bassEnergy * 0.1);
                instance.img.style.transform = `scale(${scale})`;
            }
        },
        init: (instance) => { instance.img = document.querySelector('.horror-img'); }
    },

    // === ЭФФЕКТ 9: CHAINSAW TRANSFORMATION (NEW) ===
    chainsawTransformation: {
        html: `
            <div class="cs-event-wrapper">
                <!-- ГИФКА-ПЕРЕХОД (Появляется, играет, исчезает) -->
                <div class="cs-transition-gif-container">
                    <img src="picture/Chainsaw_conversion.gif" class="cs-gif-content" alt="transformation">
                </div>

                <!-- ВИЗУАЛИЗАТОР И ЭФФЕКТЫ (На фоне) -->
                <div class="cs-stage-bg">
                    <div class="cs-overlay-grain"></div>
                    <div class="cs-scanlines"></div>
                    <div class="cs-overlay-vignette"></div>
                    
                    <canvas id="cs-canvas-realtime"></canvas>

                    <div class="cs-logo-wrapper">
                        <div class="cs-logo-text">CHAINSAW<br>MAN</div>
                    </div>
                </div>
            </div>
        `,
        css: `
            .cs-event-wrapper {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                overflow: hidden; background: #000;
                z-index: 10; 
            }

            /* --- АНИМАЦИЯ ИСЧЕЗНОВЕНИЯ (CRT TV OFF) --- */
            .cs-event-wrapper.dying {
                animation: csDeath 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards;
            }

            @keyframes csDeath {
                0% { 
                    transform: scale(1, 1); 
                    filter: brightness(1) contrast(1);
                    opacity: 1;
                }
                20% {
                    /* Вспышка и искажение */
                    transform: scale(1.02, 1.02) skewX(5deg);
                    filter: brightness(3) contrast(2) hue-rotate(90deg);
                    opacity: 1;
                }
                40% {
                    /* Сплющивание в линию */
                    transform: scale(1.1, 0.005);
                    filter: brightness(5);
                    opacity: 1;
                }
                60% {
                    /* Линия еще видна */
                    transform: scale(0.8, 0.002);
                    opacity: 1;
                }
                100% {
                    /* Исчезновение в точку */
                    transform: scale(0, 0);
                    opacity: 0;
                }
            }

            /* --- ГИФКА ПЕРЕХОДА --- */
            .cs-transition-gif-container {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                z-index: 50; 
                display: flex; justify-content: center; align-items: center;
                background: #000;
                animation: gifFadeOut 0.5s ease-in forwards;
                animation-delay: 2.3s; /* Синхронизация с длиной гифки */
                pointer-events: none;
            }
            .cs-gif-content { width: 100%; height: 100%; object-fit: cover; }
            @keyframes gifFadeOut { to { opacity: 0; visibility: hidden; } }

            /* --- ФОН И ЭФФЕКТЫ --- */
            .cs-stage-bg {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                background: radial-gradient(circle at center, #4a0000 0%, #000000 90%);
                transition: transform 0.1s;
            }
            .cs-stage-bg.shake-hard {
                animation: shakeHard 0.1s cubic-bezier(.36,.07,.19,.97) both;
            }

            .cs-overlay-grain {
                position: absolute; inset: -50%; width: 200%; height: 200%;
                background: url('data:image/svg+xml;utf8,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="n"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23n)" opacity="0.15"/%3E%3C/svg%3E');
                animation: grainMove 0.2s steps(4) infinite;
                pointer-events: none; z-index: 10; mix-blend-mode: overlay;
            }
            .cs-scanlines {
                position: absolute; inset: 0;
                background: repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, rgba(0, 0, 0, 0.3) 3px);
                z-index: 12; pointer-events: none;
            }
            .cs-overlay-vignette {
                position: absolute; inset: 0;
                background: radial-gradient(circle, transparent 40%, #000000 95%);
                z-index: 11;
            }
            @keyframes grainMove { 0% { transform: translate(0,0); } 100% { transform: translate(-10px, -10px); } }

            #cs-canvas-realtime {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                z-index: 5; opacity: 0.8; filter: drop-shadow(0 0 10px #ff0000);
            }

            .cs-logo-wrapper {
                position: absolute; top: 50%; left: 50%; 
                transform: translate(-50%, -50%) skewX(-10deg) rotate(-2deg);
                z-index: 4; margin-top: -20px;
            }
            .cs-logo-text {
                font-family: 'Anton', 'Impact', sans-serif;
                font-size: 80px; text-transform: uppercase; color: #ffbc00;
                letter-spacing: -2px; line-height: 0.9;
                text-shadow: 4px 4px 0px #000, -2px -2px 0px #ff0000;
                white-space: nowrap; text-align: center;
            }
            @keyframes shakeHard {
                10%, 90% { transform: translate3d(-5px, 0, 0); filter: hue-rotate(-10deg); }
                20%, 80% { transform: translate3d(5px, 0, 0); filter: hue-rotate(10deg); }
                30%, 50%, 70% { transform: translate3d(-5px, 0, 0); }
                40%, 60% { transform: translate3d(5px, 0, 0); }
            }
        `,
        init: (instance) => {
            instance.canvas = document.getElementById('cs-canvas-realtime');
            instance.bg = document.querySelector('.cs-stage-bg');
            if (instance.canvas) {
                instance.ctx = instance.canvas.getContext('2d');
                const resize = () => {
                    instance.width = instance.canvas.width = window.innerWidth;
                    instance.height = instance.canvas.height = window.innerHeight;
                };
                window.addEventListener('resize', resize);
                resize();
            }
        },
        update: (instance, features) => {
            if (!instance.ctx) return;
            const { width, height, ctx } = instance;
            const time = Date.now();

            // Очистка
            ctx.clearRect(0, 0, width, height);

            // Функция рисования волны
            const drawWave = (color, amplitude, frequency, speed, yOffset, thickness) => {
                ctx.beginPath();
                ctx.strokeStyle = color;
                ctx.lineWidth = thickness;
                ctx.lineJoin = 'round';
                ctx.moveTo(0, height / 2 + yOffset);

                for (let x = 0; x < width; x += 10) {
                    const y = Math.sin(x * frequency + time * speed) * amplitude 
                            + Math.cos(x * (frequency * 2.5) - time * speed) * (amplitude * 0.5)
                            + (Math.random() - 0.5) * (amplitude * 0.2); // Шум
                    ctx.lineTo(x, height / 2 + yOffset + y);
                }
                ctx.stroke();
            };

            // 1. Высокие (Белая, тонкая, нервная)
            drawWave(
                'rgba(255, 255, 255, 0.5)', 
                10 + features.highEnergy * 150, 
                0.01, 0.005, -80, 2
            );

            // 2. Средние (Пунктирная)
            ctx.setLineDash([5, 5]); 
            drawWave(
                'rgba(255, 188, 0, 0.8)', // Желтый оттенок
                20 + features.midEnergy * 200, 
                0.02, 0.003, 0, 4
            );
            ctx.setLineDash([]);

            // 3. Бас (Красная/Белая, жирная)
            drawWave(
                'rgba(255, 255, 255, 0.7)', 
                30 + features.bassEnergy * 300, 
                0.005, 0.002, 80, 8
            );

            // Реакция на удар (Beat)
            if (features.isBeat) {
                instance.bg.classList.remove('shake-hard');
                void instance.bg.offsetWidth; // Trigger reflow
                instance.bg.classList.add('shake-hard');
                
                // Вспышка логотипа
                const logo = document.querySelector('.cs-logo-text');
                if(logo) logo.style.textShadow = `0 0 30px #ff0000, 4px 4px 0 #000`;
                setTimeout(() => {
                   if(logo) logo.style.textShadow = `4px 4px 0px #000, -2px -2px 0px #ff0000`;
                }, 100);
            }
        }
    }
};
