import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
import { vertexShader, transitions } from './shaders.js';

let scene, camera, renderer, material, mesh;
let currentTween = null; 

// Генератор шума
function createNoiseTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(128, 128);
    for (let i = 0; i < imgData.data.length; i += 4) {
        const val = Math.random() * 255;
        imgData.data[i] = val; imgData.data[i+1] = val; imgData.data[i+2] = val; imgData.data[i+3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);
    const t = new THREE.CanvasTexture(canvas);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
}

export function initCoverLoader(containerId, startImageUrl) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    const w = container.offsetWidth;
    const h = container.offsetHeight;

    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(w/-2, w/2, h/2, h/-2, 1, 1000);
    camera.position.z = 1;

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const loader = new THREE.TextureLoader();
    
    // Фолбэк для стартовой картинки
    const validUrl = startImageUrl || 'picture/default_cover.jpg';
    
    loader.load(
        validUrl, 
        (tex) => setupMaterial(tex),
        undefined,
        () => loader.load('picture/default_cover.jpg', (tex) => setupMaterial(tex))
    );

    function setupMaterial(tex1) {
        const dispTex = createNoiseTexture();
        const def = transitions.liquid; 
        
        material = new THREE.ShaderMaterial({
            uniforms: {
                dispFactor: { value: 0.0 },
                intensity: { value: def.uniforms.intensity },
                texture1: { value: tex1 },
                texture2: { value: tex1 }, 
                disp: { value: dispTex }
            },
            vertexShader: vertexShader,
            fragmentShader: def.shader,
            transparent: true
        });

        const geo = new THREE.PlaneBufferGeometry(w, h, 1);
        mesh = new THREE.Mesh(geo, material);
        scene.add(mesh);
        
        animate();
    }
    
    window.addEventListener('resize', () => {
        if (!container || !renderer || !camera) return;
        const nw = container.offsetWidth;
        const nh = container.offsetHeight;
        renderer.setSize(nw, nh);
        camera.left = nw/-2; camera.right = nw/2; camera.top = nh/2; camera.bottom = nh/-2;
        camera.updateProjectionMatrix();
        if (mesh) {
            mesh.geometry.dispose();
            mesh.geometry = new THREE.PlaneBufferGeometry(nw, nh, 1);
        }
    });
}

function animate() {
    requestAnimationFrame(animate);
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

// === ИСПРАВЛЕННАЯ ФУНКЦИЯ ПЕРЕХОДА ===
export function changeCover(newImageUrl, effectName = 'liquid') {
    if (!material) return;

    const targetUrl = newImageUrl || 'picture/default_cover.jpg';
    const effectData = transitions[effectName] || transitions.liquid;

    const loader = new THREE.TextureLoader();

    loader.load(
        targetUrl, 
        (newTex) => {
            // ЛОГИКА ПРЕРЫВАНИЯ:
            if (currentTween) {
                currentTween.kill();
                
                // КЛЮЧЕВОЙ МОМЕНТ:
                // Если мы прерываем анимацию, мы берем то изображение, на которое 
                // мы ПЫТАЛИСЬ перейти (texture2), и делаем его БАЗОВЫМ (texture1).
                // Это предотвращает "отскок" к старой картинке.
                material.uniforms.texture1.value = material.uniforms.texture2.value;
                
                // Сбрасываем прогресс, так как теперь texture1 == то, что мы хотели видеть
                material.uniforms.dispFactor.value = 0;
            }

            // Обновляем шейдер (если сменился стиль)
            material.fragmentShader = effectData.shader;
            if (effectData.uniforms.intensity !== undefined) {
                material.uniforms.intensity.value = effectData.uniforms.intensity;
            }
            material.needsUpdate = true;

            // Готовим новый переход
            material.uniforms.texture2.value = newTex;
            
            // На всякий случай убеждаемся, что мы в нуле
            // (видна texture1, которая теперь является актуальной предыдущей картинкой)
            material.uniforms.dispFactor.value = 0;

            // Запускаем GSAP
            currentTween = gsap.to(material.uniforms.dispFactor, {
                value: 1, // Едем к texture2
                duration: effectData.config.duration,
                ease: effectData.config.ease,
                onComplete: () => {
                    // Фиксация: новая картинка становится базовой
                    material.uniforms.texture1.value = newTex;
                    material.uniforms.dispFactor.value = 0;
                    currentTween = null;
                }
            });
        },
        undefined, 
        (err) => {
            console.warn('Ошибка загрузки обложки:', targetUrl);
            if (targetUrl !== 'picture/default_cover.jpg') {
                changeCover('picture/default_cover.jpg', effectName);
            }
        }
    );
}
