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

    // 5. BENDY INK (Viscous Fluid & Sepia)
    bendyInk: {
        uniforms: { intensity: 0.4 },
        config: { duration: 1.4, ease: "power2.inOut" }, // Вязкий, плавный переход
        shader: `
            varying vec2 vUv;
            uniform sampler2D texture1;
            uniform sampler2D texture2;
            uniform sampler2D disp; // Карта шума для неравномерности стекания
            uniform float dispFactor;
            uniform float intensity;

            void main() {
                vec2 uv = vUv;
                
                // 1. Эффект стекания чернил (Melt)
                // Используем карту дисплейсмента (шум), чтобы чернила текли неравномерно
                float noiseVal = texture2D(disp, uv).r;
                
                // Рассчитываем сдвиг по Y (вниз)
                // Чернила текут вниз, поэтому искажаем координаты Y
                float flow = sin(dispFactor * 3.14) * (intensity * 1.5);
                float drip = flow * noiseVal; 
                
                vec2 uv1 = vec2(uv.x, uv.y + drip); // Старая картинка стекает
                vec2 uv2 = vec2(uv.x, uv.y - drip); // Новая стекает сверху

                vec4 t1 = texture2D(texture1, uv1);
                vec4 t2 = texture2D(texture2, uv2);

                // 2. Смешивание (через "порог" чернил)
                // Создаем эффект, будто чернила разъедают изображение
                vec4 color = mix(t1, t2, dispFactor);
                
                // 3. Фильтр "Старый мультфильм" (Sepia + High Contrast)
                // Работает максимально сильно в середине перехода
                float effectStrength = sin(dispFactor * 3.14);
                
                // Перевод в ЧБ
                float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
                
                // Применяем сепию (желтоватый оттенок)
                vec3 sepia = vec3(gray * 1.2, gray * 1.0, gray * 0.8);
                
                // Усиливаем контраст черного (чернильные пятна)
                if (gray < 0.3) {
                    sepia *= 0.5; // Делаем тени глубокими и черными
                }

                // Смешиваем оригинальный цвет с сепией
                color.rgb = mix(color.rgb, sepia, effectStrength * 0.9);
                
                // 4. Дрожание пленки (Old Film Shake)
                // Слегка сдвигаем кадр в момент перехода
                if (effectStrength > 0.1) {
                    float shake = (fract(sin(dot(uv, vec2(12.9898,78.233))) * 43758.5453) - 0.5) * 0.005;
                    color.rgb += shake;
                }

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
