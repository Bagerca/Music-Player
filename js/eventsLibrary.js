export const stageEffects = {
    
    // === ЭФФЕКТ 1: ALASTOR RADIO ===
    radioDial: {
        // 1. HTML ШАБЛОН
        html: `
            <div class="alastor-overlay"></div>
            <div class="radio-meter-container active">
                <div class="meter-body">
                    <div class="meter-grid"></div>
                    <div class="meter-arc"><div class="danger-zone"></div></div>
                    <div class="meter-ticks">
                        <span style="--i:1"></span><span style="--i:2"></span><span style="--i:3"></span>
                        <span style="--i:4"></span><span style="--i:5"></span><span style="--i:6"></span>
                        <span style="--i:7"></span><span style="--i:8"></span><span style="--i:9"></span>
                        <span style="--i:10"></span><span style="--i:11"></span>
                    </div>
                    <div class="meter-needle-pivot">
                        <div class="meter-needle" id="eventNeedle"></div>
                    </div>
                    <div class="overload-light" id="eventLight"></div>
                </div>
            </div>
        `,

        // 2. CSS СТИЛИ
        css: `
            .alastor-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle, transparent 40%, #000 100%); animation: fadeIn 1s ease; }
            .radio-meter-container { position: absolute; bottom: -50px; left: 50%; transform: translateX(-50%); width: 120%; max-width: 1400px; height: 600px; perspective: 1000px; animation: slideUp 1s cubic-bezier(0.2, 1, 0.3, 1); }
            .meter-body { width: 100%; height: 100%; background: radial-gradient(circle at 50% 100%, rgba(40, 0, 0, 0.9), rgba(10, 0, 0, 0) 70%); border-radius: 50% 50% 0 0 / 100% 100% 0 0; box-shadow: inset 0 50px 100px rgba(0,0,0,0.8); border-top: 2px solid rgba(255,0,0,0.1); }
            .meter-grid { position: absolute; top:0; left:0; width:100%; height:100%; background-image: linear-gradient(rgba(255,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,0,0,0.05) 1px, transparent 1px); background-size: 40px 40px; mask-image: radial-gradient(circle at 50% 100%, black 40%, transparent 80%); -webkit-mask-image: radial-gradient(circle at 50% 100%, black 40%, transparent 80%); }
            .meter-arc { position: absolute; bottom: 20px; left: 10%; width: 80%; height: 100%; border-radius: 50% 50% 0 0 / 100% 100% 0 0; border-top: 6px solid rgba(255, 50, 50, 0.2); }
            .danger-zone { position: absolute; right: 0; top: -6px; width: 30%; height: 100%; border-top: 6px solid #ff0000; border-radius: 0 100% 0 0; opacity: 0.6; box-shadow: 0 0 15px red; }
            .meter-ticks { position: absolute; bottom: 0; left: 50%; width: 100%; height: 100%; transform: translateX(-50%); }
            .meter-ticks span { position: absolute; bottom: 0; left: 50%; width: 4px; height: 550px; transform-origin: bottom center; transform: rotate(calc((var(--i) - 6) * 12deg)); }
            .meter-ticks span::after { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 30px; background: rgba(255,255,255,0.5); box-shadow: 0 0 10px rgba(255,255,255,0.3); }
            .meter-needle-pivot { position: absolute; bottom: -20px; left: 50%; transform: translateX(-50%); width: 20px; height: 20px; z-index: 10; }
            .meter-needle { position: absolute; bottom: 0; left: 50%; width: 6px; height: 520px; background: linear-gradient(to top, #880000, #ff3333); transform-origin: bottom center; transform: rotate(-60deg) translateX(-50%); border-radius: 50% 50% 0 0; box-shadow: 0 0 20px rgba(255, 0, 0, 0.8); will-change: transform; }
            .overload-light { position: absolute; bottom: 50px; left: 50%; transform: translateX(-50%); width: 150px; height: 150px; border-radius: 50%; background: radial-gradient(circle, red 0%, transparent 70%); opacity: 0; mix-blend-mode: screen; transition: opacity 0.1s; }
            
            @keyframes slideUp { from { transform: translateY(100px) rotateX(20deg); opacity: 0; } to { transform: translateY(0) rotateX(0deg); opacity: 1; } }
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        `,

        // 3. ИНИЦИАЛИЗАЦИЯ
        init: (instance) => {
            instance.needle = document.getElementById('eventNeedle');
            instance.light = document.getElementById('eventLight');
            instance.angle = -60;
        },

        // 4. ОБНОВЛЕНИЕ
        update: (instance, features) => {
            if (!instance.needle) return;

            // Логика физики стрелки
            let signal = (features.bassEnergy * 0.8 + features.rms * 0.4) * 3.5; 
            if (signal > 1.2) signal = 1.2 + (Math.random() * 0.1);
            
            let targetAngle = -60 + (signal * 120);
            if (targetAngle < -60) targetAngle = -60;
            if (targetAngle > 65) targetAngle = 65;

            const smoothFactor = targetAngle > instance.angle ? 0.4 : 0.08;
            instance.angle += (targetAngle - instance.angle) * smoothFactor;

            const jitter = (Math.random() - 0.5) * 1.5;
            instance.needle.style.transform = `rotate(${instance.angle + jitter}deg)`;

            if (instance.light) {
                instance.light.style.opacity = instance.angle > 40 ? (instance.angle - 40) / 25 : 0;
            }
        }
    }
};
