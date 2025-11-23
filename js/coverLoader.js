// --- js/coverLoader.js ---

// Мы используем глобальный THREE и GSAP из index.html, но для модульности
// можно объявить фиктивные импорты, если линтер ругается. 
// Здесь мы полагаемся на window.THREE
import { vertexShader, transitions } from './shaders.js';

let scene, camera, renderer, material, mesh;
let isAnimating = false;

// Генератор шума для Liquid эффекта (чтобы не грузить картинку)
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
    
    // Начальная текстура
    const tex1 = loader.load(startImageUrl || 'picture/default_cover.jpg');
    const dispTex = createNoiseTexture();

    // Дефолтный материал (Liquid)
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
    
    // Адаптив
    window.addEventListener('resize', () => {
        const nw = container.offsetWidth;
        const nh = container.offsetHeight;
        renderer.setSize(nw, nh);
        camera.left = nw/-2; camera.right = nw/2; camera.top = nh/2; camera.bottom = nh/-2;
        camera.updateProjectionMatrix();
        mesh.geometry.dispose();
        mesh.geometry = new THREE.PlaneBufferGeometry(nw, nh, 1);
    });
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

// ГЛАВНАЯ ФУНКЦИЯ СМЕНЫ ОБЛОЖКИ
export function changeCover(newImageUrl, effectName = 'liquid') {
    if (isAnimating) return;
    
    // Если переданного эффекта нет, берем liquid
    const effectData = transitions[effectName] || transitions.liquid;
    
    const loader = new THREE.TextureLoader();
    
    // Загружаем новую картинку
    loader.load(newImageUrl, (newTex) => {
        isAnimating = true;
        
        // 1. Подставляем новую текстуру во второй слот
        material.uniforms.texture2.value = newTex;
        
        // 2. Меняем шейдер и параметры "на лету"
        material.fragmentShader = effectData.shader;
        if (effectData.uniforms.intensity !== undefined) {
            material.uniforms.intensity.value = effectData.uniforms.intensity;
        }
        material.needsUpdate = true;
        
        // 3. Анимируем переход
        gsap.to(material.uniforms.dispFactor, {
            value: 1,
            duration: effectData.config.duration,
            ease: effectData.config.ease,
            onComplete: () => {
                // Фиксируем результат
                material.uniforms.texture1.value = newTex;
                material.uniforms.dispFactor.value = 0;
                isAnimating = false;
            }
        });
    }, 
    // Если ошибка загрузки (например, битая ссылка), ничего не делаем или логируем
    undefined, 
    (err) => {
        console.warn('Texture load error', err);
        isAnimating = false;
    });
}
