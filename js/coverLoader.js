import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
// Используем глобальный GSAP
import { vertexShader, transitions } from './shaders.js';

let scene, camera, renderer, material, mesh;
// Храним текущую анимацию, чтобы можно было её убить при быстром переключении
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

    // Очищаем контейнер на случай повторной инициализации
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
    
    // Загрузка стартовой картинки с фоллбеком
    const validUrl = startImageUrl || 'picture/default_cover.jpg';
    
    loader.load(
        validUrl, 
        (tex) => setupMaterial(tex),
        undefined,
        () => {
            // Если стартовая картинка не грузится, грузим дефолтную
            loader.load('picture/default_cover.jpg', (tex) => setupMaterial(tex));
        }
    );

    function setupMaterial(tex1) {
        const dispTex = createNoiseTexture();
        const def = transitions.liquid; // Дефолтный эффект
        
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

// ГЛАВНАЯ ФУНКЦИЯ СМЕНЫ ОБЛОЖКИ (ИСПРАВЛЕННАЯ)
export function changeCover(newImageUrl, effectName = 'liquid') {
    // 1. Проверка на существование сцены
    if (!material) return;

    // 2. Фолбэк, если URL пустой
    const targetUrl = newImageUrl || 'picture/default_cover.jpg';

    // 3. Получаем данные эффекта
    const effectData = transitions[effectName] || transitions.liquid;

    const loader = new THREE.TextureLoader();

    // 4. Загружаем новую текстуру
    loader.load(
        targetUrl, 
        (newTex) => {
            // ЕСЛИ ПРЕДЫДУЩАЯ АНИМАЦИЯ ЕЩЕ ИДЕТ:
            if (currentTween) {
                // Убиваем её
                currentTween.kill();
                // Мгновенно завершаем состояние: то, что было texture2 (цель), становится texture1 (старт)
                // Но так как мы не знаем, насколько далеко зашла анимация, 
                // безопаснее просто оставить texture1 как есть, если dispFactor был мал,
                // или переключить, если велик. 
                // УПРОЩЕНИЕ: Мы просто сбрасываем фактор.
            }

            // 5. Обновляем шейдер под новый эффект (если он сменился)
            material.fragmentShader = effectData.shader;
            if (effectData.uniforms.intensity !== undefined) {
                material.uniforms.intensity.value = effectData.uniforms.intensity;
            }
            material.needsUpdate = true;

            // 6. Подготовка к переходу
            // Текущая видимая картинка (texture1) остается на месте.
            // Новую картинку кладем в texture2.
            material.uniforms.texture2.value = newTex;
            
            // Сбрасываем прогресс искажения в 0 (видна texture1)
            material.uniforms.dispFactor.value = 0;

            // 7. Запуск анимации (сохраняем ссылку в currentTween)
            currentTween = gsap.to(material.uniforms.dispFactor, {
                value: 1, // Анимируем к 1 (будет видна texture2)
                duration: effectData.config.duration,
                ease: effectData.config.ease,
                onComplete: () => {
                    // КОГДА ВСЕ ЗАКОНЧИЛОСЬ:
                    // Новая картинка становится "основной" (texture1)
                    material.uniforms.texture1.value = newTex;
                    // Сбрасываем фактор в 0, но визуально ничего не меняется, т.к. texture1 == texture2
                    material.uniforms.dispFactor.value = 0;
                    currentTween = null;
                }
            });
        },
        undefined, // onProgress
        (err) => {
            console.warn('Ошибка загрузки обложки:', targetUrl);
            // Если ошибка, пробуем загрузить дефолт, чтобы не было черного экрана
            if (targetUrl !== 'picture/default_cover.jpg') {
                changeCover('picture/default_cover.jpg', effectName);
            }
        }
    );
}
