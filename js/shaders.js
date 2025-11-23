// --- js/shaders.js ---

// ВАЖНО: Код внутри `...` должен быть в обратных кавычках!

// Общий Vertex Shader
export const vertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

// Коллекция эффектов
export const transitions = {
    // 1. LIQUID
    liquid: {
        uniforms: { intensity: 0.3 },
        config: { duration: 1.4, ease: "power2.inOut" },
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

    // 2. GLITCH
    glitch: {
        uniforms: { intensity: 0.05 },
        config: { duration: 0.8, ease: "elastic.inOut(1, 0.5)" }, 
        shader: `
            varying vec2 vUv;
            uniform sampler2D texture1;
            uniform sampler2D texture2;
            uniform float dispFactor;
            uniform float intensity;
            void main() {
                vec2 uv = vUv;
                // Сдвиг RGB каналов
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
        config: { duration: 1.0, ease: "power1.inOut" },
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
