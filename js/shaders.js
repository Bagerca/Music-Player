// --- js/shaders.js ---

// ВАЖНО: Код внутри `...` должен быть в обратных кавычках!

export const vertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

export const transitions = {
    // 1. LIQUID (УСКОРЕННЫЙ ВАРИАНТ)
    liquid: {
        uniforms: { intensity: 0.3 },
        // Было 1.4, сделал 0.7 для динамики
        config: { duration: 0.7, ease: "power2.inOut" },
        shader: `
            varying vec2 vUv;
            uniform sampler2D texture1;
            uniform sampler2D texture2;
            uniform sampler2D disp;
            uniform float dispFactor;
            uniform float intensity;
            void main() {
                vec2 uv = vUv;
                vec4 disp = texture2D(disp, uv);
                vec2 distortedPosition1 = vec2(uv.x + dispFactor * (disp.r * intensity), uv.y);
                vec2 distortedPosition2 = vec2(uv.x - (1.0 - dispFactor) * (disp.r * intensity), uv.y);
                vec4 _texture1 = texture2D(texture1, distortedPosition1);
                vec4 _texture2 = texture2D(texture2, distortedPosition2);
                gl_FragColor = mix(_texture1, _texture2, dispFactor);
            }
        `
    },

    // 4. RADIO / CRT (Для Alastor's Game и ретро треков)
    radio: {
        uniforms: { intensity: 0.2 }, 
        config: { duration: 1.2, ease: "power2.inOut" },
        shader: `
            varying vec2 vUv;
            uniform sampler2D texture1;
            uniform sampler2D texture2;
            uniform float dispFactor;
            uniform float intensity;

            // Генератор случайного шума
            float random(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
            }

            void main() {
                vec2 uv = vUv;
                
                // 1. Волны (искажение частоты)
                float waveStrength = sin(dispFactor * 3.14) * intensity;
                float wave = sin(uv.y * 30.0 + dispFactor * 20.0) * waveStrength;
                vec2 distortedUV = vec2(uv.x + wave, uv.y);
                
                // 2. Сканлайны (полоски)
                float scanline = sin(uv.y * 400.0) * 0.02 * sin(dispFactor * 3.14);
                distortedUV.x -= scanline;

                vec4 t1 = texture2D(texture1, distortedUV);
                vec4 t2 = texture2D(texture2, distortedUV);

                // 3. Резкий переход (Hard Cut)
                float mixVal = step(0.5, dispFactor);
                vec4 color = mix(t1, t2, mixVal);
                
                // 4. Шум (Static Noise)
                float noise = random(uv * (dispFactor * 100.0)) * 0.4 * sin(dispFactor * 3.14);
                
                // Подмешиваем шум (чуть красного для стиля)
                color.r += noise * 0.8; 
                color.g += noise * 0.5;
                color.b += noise * 0.5;
                
                // 5. Обесцвечивание в момент помех
                float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
                color.rgb = mix(color.rgb, vec3(gray), sin(dispFactor * 3.14) * 0.7);

                gl_FragColor = color;
            }
        `
    },

    // 4. NOT HUMAN (Analog Horror / CCTV Style)
    notHuman: {
        uniforms: { intensity: 0.3 },
        config: { duration: 1.6, ease: "power2.inOut" }, // Медленный, тягучий переход
        shader: `
            varying vec2 vUv;
            uniform sampler2D texture1;
            uniform sampler2D texture2;
            uniform float dispFactor;
            uniform float intensity;

            float random(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
            }

            void main() {
                vec2 uv = vUv;
                
                // 1. Эффект "Зловещей долины" (Искажение/Bulge в центре)
                // Картинка будет "дышать" и искажаться в центре
                vec2 center = vec2(0.5);
                float dist = distance(uv, center);
                float bulge = sin(dispFactor * 3.14) * intensity * (1.0 - dist);
                vec2 dUV = uv - (uv - center) * bulge;

                // 2. Хроматическая аберрация (RGB Split)
                // Сильный сдвиг каналов, имитирующий сбой камеры
                float shift = intensity * 0.05 * sin(dispFactor * 10.0);
                
                // 3. VHS Сканлайны (Дрожание по Y)
                float vhsWobble = sin(uv.y * 200.0 + dispFactor * 20.0) * 0.005;
                dUV.x += vhsWobble;

                // Сэмплируем цвета со сдвигом
                vec4 r = mix(texture2D(texture1, dUV + vec2(shift, 0.0)), texture2D(texture2, dUV + vec2(shift, 0.0)), dispFactor);
                vec4 g = mix(texture2D(texture1, dUV), texture2D(texture2, dUV), dispFactor);
                vec4 b = mix(texture2D(texture1, dUV - vec2(shift, 0.0)), texture2D(texture2, dUV - vec2(shift, 0.0)), dispFactor);
                
                vec4 color = vec4(r.r, g.g, b.b, 1.0);

                // 4. Эффект камеры наблюдения (Шум + Затемнение)
                float noise = random(uv * (dispFactor + 1.0)) * 0.3 * sin(dispFactor * 3.14);
                color.rgb += noise;
                
                // Десатурация (делаем цвета более мертвыми/серыми в момент перехода)
                float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
                float desatAmount = sin(dispFactor * 3.14) * 0.8; // На пике почти ЧБ
                color.rgb = mix(color.rgb, vec3(gray), desatAmount);

                // Виньетка (затемнение углов)
                color.rgb *= 1.0 - (dist * 0.8 * sin(dispFactor * 3.14));

                gl_FragColor = color;
            }
        `
    },

    // 5. INK BRUSH (Мазки кистью / Рисованный стиль)
    inkBrush: {
        uniforms: { intensity: 0.5 }, // Сила размазывания
        config: { duration: 1.5, ease: "power2.inOut" },
        shader: `
            varying vec2 vUv;
            uniform sampler2D texture1;
            uniform sampler2D texture2;
            uniform sampler2D disp; // Текстура шума для "ворсинок" кисти
            uniform float dispFactor;
            uniform float intensity;

            void main() {
                vec2 uv = vUv;
                
                // Получаем значение шума для текстуры мазка
                float noise = texture2D(disp, uv * 0.5).r; 

                // 1. Имитация движения кисти (Smear)
                // Смещаем пиксели по диагонали в зависимости от прогресса и шума
                // Это создает эффект, будто краску тянут по холсту
                float swipe = dispFactor;
                
                // Направление мазка (диагональ) + рваные края от шума
                vec2 brushDir = vec2(1.0, -1.0); 
                float distortion = sin(swipe * 3.14) * intensity * (noise * 2.0 - 1.0);
                
                vec2 uv1 = uv + brushDir * distortion;
                vec2 uv2 = uv - brushDir * distortion;

                vec4 t1 = texture2D(texture1, uv1);
                vec4 t2 = texture2D(texture2, uv2);

                // 2. Рваный переход (Brush Reveal)
                // Вместо плавного mix, используем noise для создания "пятен" проявления
                // Картинка появляется кусками, как будто закрашивают холст
                float mask = smoothstep(dispFactor - 0.3, dispFactor + 0.3, noise);
                
                // Инвертируем маску, чтобы transition шел правильно
                vec4 color = mix(t2, t1, mask);

                // 3. Эффект "Рисунка" (Ink Style)
                // В середине перехода делаем цвета более контрастными и "грязными"
                float midCycle = sin(dispFactor * 3.14);
                
                if (midCycle > 0.1) {
                    // Перевод в ЧБ (Gayscale)
                    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
                    
                    // Подкрашиваем в сепию/чернила (желтовато-черный)
                    vec3 inkColor = vec3(gray * 1.1, gray * 0.9, gray * 0.6);
                    
                    // Постеризация (упрощение цветов до нескольких уровней), как в мультике
                    inkColor = floor(inkColor * 4.0) / 4.0;
                    
                    // Усиливаем черный (чернильные пятна)
                    inkColor *= 1.0 - (midCycle * 0.4); 

                    // Смешиваем оригинальный цвет с "рисованным"
                    color.rgb = mix(color.rgb, inkColor, midCycle);
                }

                gl_FragColor = color;
            }
        `
    },

// 8. CLOCKWORK WALTZ (Механический Вальс — Исправленный)
    hypnoticVortex: {
        // intensity: Сколько ПОЛНЫХ оборотов сделают кольца.
        // 1.0 = 1 оборот (360 градусов). 2.0 = 2 оборота (720 градусов).
        uniforms: { intensity: 1.0 }, 
        config: { duration: 2.0, ease: "power2.inOut" },
        shader: `
            varying vec2 vUv;
            uniform sampler2D texture1;
            uniform sampler2D texture2;
            uniform float dispFactor;
            uniform float intensity;

            #define PI 3.14159265359

            void main() {
                vec2 uv = vUv;
                vec2 center = vec2(0.5);
                vec2 rel = uv - center;
                
                // Переходим в полярные координаты
                float angle = atan(rel.y, rel.x);
                float dist = length(rel);

                // --- 1. ГЕОМЕТРИЯ КОЛЕЦ ---
                // Разбиваем радиус на 10 четких колец
                float ringID = floor(dist * 10.0);

                // --- 2. НАПРАВЛЕНИЕ ВРАЩЕНИЯ ---
                // Четные кольца = 1, Нечетные = -1
                // Это заставляет их крутиться в разные стороны
                float dir = mod(ringID, 2.0) * 2.0 - 1.0;

                // --- 3. ПОЛНЫЙ ОБОРОТ (ВАЖНО!) ---
                // Мы умножаем прогресс (0..1) на 2*PI (360 градусов).
                // В конце анимации dispFactor = 1.0, значит угол будет ровно 360 (или -360).
                // Это гарантирует, что картинка встанет ИДЕАЛЬНО ровно.
                float rotation = dispFactor * (2.0 * PI) * intensity * dir;
                
                // Добавляем небольшое "отставание" внешних колец для динамики,
                // но кратное PI, чтобы тоже сошлось (опционально, сейчас убрал для точности)
                
                float finalAngle = angle + rotation;

                // Возвращаемся в обычные координаты
                vec2 twistedUV = center + vec2(cos(finalAngle), sin(finalAngle)) * dist;

                // --- 4. ЗУМ И БЕЗУМИЕ ---
                // Добавляем тот самый зум в бездну, чтобы скрыть края при вращении
                float zoom = 1.0 - (sin(dispFactor * PI) * 0.3);
                vec2 scaledUV = center + (twistedUV - center) * zoom;

                // --- 5. RGB СДВИГ (Эффект сломанного механизма) ---
                // Сдвигаем цвета по кругу
                float rgbSplit = 0.02 * sin(dispFactor * PI);
                
                vec4 t1, t2;
                
                // R канал крутим чуть быстрее
                vec2 uvR = center + (vec2(cos(finalAngle + rgbSplit), sin(finalAngle + rgbSplit)) * dist - center) * zoom;
                t1.r = texture2D(texture1, uvR).r;
                t2.r = texture2D(texture2, uvR).r;

                // G канал как есть
                t1.g = texture2D(texture1, scaledUV).g;
                t2.g = texture2D(texture2, scaledUV).g;

                // B канал крутим чуть медленнее
                vec2 uvB = center + (vec2(cos(finalAngle - rgbSplit), sin(finalAngle - rgbSplit)) * dist - center) * zoom;
                t1.b = texture2D(texture1, uvB).b;
                t2.b = texture2D(texture2, uvB).b;
                
                t1.a = 1.0; t2.a = 1.0;

                // --- 6. ВИНЬЕТКА И БЛЕСК ---
                // Металлический блеск на стыках колец
                float ringEdge = smoothstep(0.4, 0.5, abs(fract(dist * 10.0) - 0.5));
                float shine = ringEdge * sin(dispFactor * PI) * 0.3;

                // Виньетка
                float darkness = smoothstep(0.7, 0.2, dist * zoom);

                vec4 color = mix(t1, t2, dispFactor);
                
                color.rgb += shine;    // Добавляем блеск колец
                color.rgb *= darkness; // Затеняем края

                gl_FragColor = color;
            }
        `
    },
    
    // 2. GLITCH
    glitch: {
        uniforms: { intensity: 0.05 },
        config: { duration: 0.6, ease: "elastic.inOut(1, 0.5)" }, 
        shader: `
            varying vec2 vUv;
            uniform sampler2D texture1;
            uniform sampler2D texture2;
            uniform float dispFactor;
            uniform float intensity;
            void main() {
                vec2 uv = vUv;
                float split = (sin(dispFactor * 3.14) * intensity); 
                vec4 t1;
                t1.r = texture2D(texture1, vec2(uv.x - split, uv.y)).r;
                t1.g = texture2D(texture1, vec2(uv.x, uv.y)).g;
                t1.b = texture2D(texture1, vec2(uv.x + split, uv.y)).b;
                t1.a = 1.0;
                vec4 t2;
                t2.r = texture2D(texture2, vec2(uv.x - split, uv.y)).r;
                t2.g = texture2D(texture2, vec2(uv.x, uv.y)).g;
                t2.b = texture2D(texture2, vec2(uv.x + split, uv.y)).b;
                t2.a = 1.0;
                float mixVal = step(0.5, dispFactor);
                gl_FragColor = mix(t1, t2, mixVal);
            }
        `
    },

    // 3. WIND
    wind: {
        uniforms: { intensity: 0.0 },
        config: { duration: 0.8, ease: "power1.inOut" },
        shader: `
            varying vec2 vUv;
            uniform sampler2D texture1;
            uniform sampler2D texture2;
            uniform float dispFactor;
            void main() {
                vec2 uv = vUv;
                float distortion = sin(uv.y * 10.0 + dispFactor * 10.0) * 0.05 * sin(dispFactor * 3.14);
                vec2 uv1 = vec2(uv.x + dispFactor + distortion, uv.y);
                vec2 uv2 = vec2(uv.x - (1.0 - dispFactor) + distortion, uv.y);
                vec4 t1 = texture2D(texture1, uv1);
                vec4 t2 = texture2D(texture2, uv2);
                float fade = smoothstep(0.0, 1.0, dispFactor);
                gl_FragColor = mix(t1, t2, fade);
            }
        `
    }
};
