document.addEventListener('DOMContentLoaded', function() {
    // ==========================================
    // 1. ПЕРЕМЕННЫЕ И ЭЛЕМЕНТЫ DOM
    // ==========================================
    const audio = document.getElementById('audioPlayer');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const trackListBtn = document.getElementById('trackListBtn');
    const playbackModeBtn = document.getElementById('playbackModeBtn');
    const liteModeBtn = document.getElementById('liteModeBtn');
    const volumeSlider = document.getElementById('volumeSlider');
    const currentTrack = document.getElementById('currentTrack');
    const currentArtist = document.getElementById('currentArtist');
    const progressBar = document.getElementById('progressBar');
    const progress = document.getElementById('progress');
    const currentTime = document.getElementById('currentTime');
    const duration = document.getElementById('duration');
    const visualizer = document.getElementById('visualizer');
    const albumArt = document.getElementById('albumArt');
    const albumImage = document.getElementById('albumImage');
    const particles = document.getElementById('particles');
    const leftGlow = document.getElementById('leftGlow');
    const rightGlow = document.getElementById('rightGlow');
    const playerContainer = document.getElementById('playerContainer');
    const trackListPanel = document.getElementById('trackListPanel');
    const trackList = document.getElementById('trackList');
    const trackSearch = document.getElementById('trackSearch');
    const deletePlaylistBtn = document.getElementById('deletePlaylistBtn');
    const lyricsDisplay = document.getElementById('lyricsDisplay');

    // Кастомный селект
    const playlistTrigger = document.getElementById('playlistTrigger');
    const playlistOptions = document.getElementById('playlistOptions');
    const currentPlaylistText = document.getElementById('currentPlaylistText');
    const customSelectContainer = document.querySelector('.custom-select');

    // Управление плейлистами и модалки
    const createPlaylistBtn = document.getElementById('createPlaylistBtn');
    const uploadTrackBtn = document.getElementById('uploadTrackBtn');
    const fileInput = document.getElementById('fileInput');
    const modalOverlay = document.getElementById('modalOverlay');
    const newPlaylistName = document.getElementById('newPlaylistName');
    const confirmPlaylistBtn = document.getElementById('confirmPlaylistBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');

    const trackEditModalOverlay = document.getElementById('trackEditModalOverlay');
    const editTrackTitle = document.getElementById('editTrackTitle');
    const editTrackArtist = document.getElementById('editTrackArtist');
    const editTrackCoverInput = document.getElementById('editTrackCoverInput');
    const editTrackCoverBtn = document.getElementById('editTrackCoverBtn');
    const coverPreview = document.getElementById('coverPreview');
    const editColorPrimary = document.getElementById('editColorPrimary');
    const editColorAccent = document.getElementById('editColorAccent');
    const confirmTrackEditBtn = document.getElementById('confirmTrackEditBtn');
    const closeTrackEditBtn = document.getElementById('closeTrackEditBtn');

    // Глобальные переменные состояния
    let userPlaylists = JSON.parse(localStorage.getItem('myUserPlaylists')) || {};
    let uploadedTracks = []; 
    let pendingUploadFile = null;
    let draggedItemIndex = null;
    let activeMenuId = null;
    
    let currentPlaylistName = "Все треки";
    let currentTracks = []; // Будет заполнено при инициализации
    let currentTrackIndex = 0;
    let isPlaying = false;
    let isTrackListOpen = false;
    let isLiteMode = localStorage.getItem('isLiteMode') === 'true';

    const PLAYBACK_MODES = { PLAYLIST: 0, SINGLE: 1, ONCE: 2 };
    let playbackMode = PLAYBACK_MODES.PLAYLIST;
    let audioContext, analyser, dataArray, bufferLength, audioSource;
    let visualizerBars = [];
    let animationId = null;

    // Переменные визуализатора
    let beatDetected = false, lastBeatTime = 0, currentPulseIntensity = 0;
    let particlesData = [], isParticlesTransitioning = false, particleTransitionProgress = 0;
    let energyHistory = [], energyAverage = 0, spectralCentroid = 0, isBeat = false, beatCooldown = 0;
    let sparkParticles = [], sparkCooldown = 0;
    let energySurgeActive = false, energySurgeIntensity = 0, currentSurgeDecay = 0.1; 
    let edgeGlowElements = {}, edgeGlowIntensity = 0;
    const FREQ_RANGES = { BASS: { start: 0, end: 10 }, MID: { start: 10, end: 20 }, HIGH: { start: 20, end: 30 } };
    let audioFeatures = { rms: 0, bassEnergy: 0, midEnergy: 0, highEnergy: 0, spectralCentroid: 0, isBeat: false };

    // ==========================================
    // 2. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
    // ==========================================
    
    function getAllPlaylists() {
        const combined = { ...playlists, ...userPlaylists };
        if (uploadedTracks.length > 0) {
            combined["Мои загрузки"] = uploadedTracks;
        }
        return combined;
    }

    function adjustColorOpacity(hex, opacity) {
        let r=0, g=0, b=0;
        if (!hex) return `rgba(255, 255, 255, ${opacity})`;
        if (hex.length == 4) {
            r = "0x" + hex[1] + hex[1]; g = "0x" + hex[2] + hex[2]; b = "0x" + hex[3] + hex[3];
        } else if (hex.length == 7) {
            r = "0x" + hex[1] + hex[2]; g = "0x" + hex[3] + hex[4]; b = "0x" + hex[5] + hex[6];
        }
        return "rgba("+ +r + "," + +g + "," + +b + "," + opacity + ")";
    }

    function adjustColorBrightness(col, amt) {
        var usePound = false; 
        if (col[0] == "#") { col = col.slice(1); usePound = true; }
        var num = parseInt(col,16);
        var r = (num >> 16) + amt; if (r > 255) r = 255; else if  (r < 0) r = 0;
        var b = ((num >> 8) & 0x00FF) + amt; if (b > 255) b = 255; else if  (b < 0) b = 0;
        var g = (num & 0x0000FF) + amt; if (g > 255) g = 255; else if (g < 0) g = 0;
        return (usePound?"#":"") + (g | (b << 8) | (r << 16)).toString(16);
    }

    function formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    // ==========================================
    // 3. ВИЗУАЛИЗАЦИЯ И ЭФФЕКТЫ (ОПРЕДЕЛЕНИЯ)
    // ==========================================

    function createVisualizer() { 
        visualizer.innerHTML = ''; 
        visualizerBars = []; 
        for (let i = 0; i < 30; i++) { 
            const bar = document.createElement('div'); 
            bar.className = 'visualizer-bar'; 
            bar.style.height = '5px'; 
            bar.style.alignSelf = 'flex-end'; 
            visualizer.appendChild(bar); 
            visualizerBars.push(bar); 
        } 
    }

    function createParticles() { 
        if (currentTracks.length === 0) return; 
        particles.innerHTML = ''; 
        particlesData = []; 
        const particleCount = 15; 
        const currentColors = currentTracks[currentTrackIndex].colors; 
        
        for (let i = 0; i < particleCount; i++) { 
            const particle = document.createElement('div'); 
            particle.className = 'particle'; 
            const startLeft = Math.random() * 100; 
            const startTop = Math.random() * 100; 
            const startSize = Math.random() * 15 + 5; 
            const startOpacity = Math.random() * 0.3 + 0.1; 
            const endLeft = (Math.random() * 80 + 10) + (i % 3 - 1) * 20; 
            const endTop = (Math.random() * 80 + 10) + (i % 2 - 0.5) * 30; 
            const endSize = Math.random() * 15 + 5; 
            const endOpacity = Math.random() * 0.3 + 0.1; 
            
            particle.style.left = `${startLeft}vw`; 
            particle.style.top = `${startTop}vh`; 
            particle.style.width = `${startSize}px`; 
            particle.style.height = `${startSize}px`; 
            particle.style.opacity = startOpacity; 
            particle.style.background = currentColors.accent; 
            particle.style.transition = 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)'; 
            particle.style.position = 'absolute'; 
            particle.style.borderRadius = '50%'; 
            particle.style.pointerEvents = 'none'; 
            
            particles.appendChild(particle); 
            
            particlesData.push({ 
                element: particle, 
                startLeft: startLeft, startTop: startTop, startSize: startSize, startOpacity: startOpacity, 
                endLeft: endLeft, endTop: endTop, endSize: endSize, endOpacity: endOpacity, 
                baseLeft: endLeft, baseTop: endTop, baseSize: endSize, baseOpacity: endOpacity, 
                velocityX: 0, velocityY: 0, movementIntensity: Math.random() * 0.5 + 0.5 
            }); 
        } 
        startParticleTransition(); 
    }

    function startParticleTransition() { 
        isParticlesTransitioning = true; 
        particleTransitionProgress = 0; 
        const transitionDuration = 800; 
        particlesData.forEach(particleData => { 
            const particle = particleData.element; 
            setTimeout(() => { 
                particle.style.left = `${particleData.endLeft}vw`; 
                particle.style.top = `${particleData.endTop}vh`; 
                particle.style.width = `${particleData.endSize}px`; 
                particle.style.height = `${particleData.endSize}px`; 
                particle.style.opacity = particleData.endOpacity; 
                particle.style.transition = 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)'; 
                particleData.baseLeft = particleData.endLeft; 
                particleData.baseTop = particleData.endTop; 
                particleData.baseSize = particleData.endSize; 
                particleData.baseOpacity = particleData.endOpacity; 
            }, 50); 
        }); 
        setTimeout(() => { isParticlesTransitioning = false; }, transitionDuration); 
    }

    function updateParticles() { 
        if (currentTracks.length === 0) return; 
        const currentColors = currentTracks[currentTrackIndex].colors; 
        particlesData.forEach(particleData => { 
            const particle = particleData.element; 
            particleData.startLeft = parseFloat(particle.style.left); 
            particleData.startTop = parseFloat(particle.style.top); 
            particleData.startSize = parseFloat(particle.style.width); 
            particleData.startOpacity = parseFloat(particle.style.opacity); 
            particleData.endLeft = (Math.random() * 80 + 10) + (Math.random() * 40 - 20); 
            particleData.endTop = (Math.random() * 80 + 10) + (Math.random() * 40 - 20); 
            particleData.endSize = Math.random() * 15 + 5; 
            particleData.endOpacity = Math.random() * 0.3 + 0.1; 
            particle.style.background = currentColors.accent; 
        }); 
        startParticleTransition(); 
    }

    function createEdgeGlow() { 
        const edges = ['top', 'right', 'bottom', 'left']; 
        const edgeGlowContainer = document.getElementById('edgeGlow'); 
        edges.forEach(edge => { 
            const glow = document.createElement('div'); 
            glow.className = `edge-glow ${edge}-glow`; 
            edgeGlowContainer.appendChild(glow); 
            edgeGlowElements[edge] = glow; 
        }); 
    }

    function initAudioAnalyzer() { 
        try { 
            if (audioContext) { 
                if (audioContext.state === 'suspended') { audioContext.resume(); } 
                return; 
            } 
            audioContext = new (window.AudioContext || window.webkitAudioContext)(); 
            analyser = audioContext.createAnalyser(); 
            if (!audioSource) { 
                audioSource = audioContext.createMediaElementSource(audio); 
                audioSource.connect(analyser); 
                analyser.connect(audioContext.destination); 
            } 
            analyser.fftSize = 256; 
            bufferLength = analyser.frequencyBinCount; 
            dataArray = new Uint8Array(bufferLength); 
        } catch (error) { console.error('Audio analyzer initialization failed:', error); } 
    }

    function getFrequencyEnergy(range) { 
        let sum = 0; const count = range.end - range.start; 
        for (let i = range.start; i < range.end; i++) { sum += dataArray[i]; } 
        return sum / count / 255; 
    }

    function analyzeSpectralFeatures() { 
        if (!analyser || !dataArray) return; 
        const bassEnergy = getFrequencyEnergy(FREQ_RANGES.BASS); 
        const midEnergy = getFrequencyEnergy(FREQ_RANGES.MID); 
        const highEnergy = getFrequencyEnergy(FREQ_RANGES.HIGH); 
        let sum = 0; 
        for (let i = 0; i < bufferLength; i++) { sum += dataArray[i] * dataArray[i]; } 
        const rms = Math.sqrt(sum / bufferLength) / 255; 
        energyHistory.push(rms); 
        if (energyHistory.length > 30) { energyHistory.shift(); } 
        energyAverage = energyHistory.reduce((a, b) => a + b) / energyHistory.length; 
        let weightedSum = 0; let energySum = 0; 
        for (let i = 0; i < bufferLength; i++) { weightedSum += i * dataArray[i]; energySum += dataArray[i]; } 
        spectralCentroid = energySum > 0 ? weightedSum / energySum : 0; 
        const currentTime = Date.now(); 
        isBeat = false; 
        if (beatCooldown <= 0) { 
            const threshold = energyAverage * 1.4 + 0.15; 
            if (bassEnergy > threshold && (currentTime - lastBeatTime) > 200) { 
                isBeat = true; lastBeatTime = currentTime; currentPulseIntensity = 1.0; beatCooldown = 8; 
            } 
        } else { beatCooldown--; } 
        audioFeatures.rms = rms; audioFeatures.bassEnergy = bassEnergy; audioFeatures.midEnergy = midEnergy; 
        audioFeatures.highEnergy = highEnergy; audioFeatures.spectralCentroid = spectralCentroid; audioFeatures.isBeat = isBeat; 
    }

    function updatePulseIntensity() { 
        if (currentPulseIntensity > 0) { currentPulseIntensity -= 0.08; if (currentPulseIntensity < 0) currentPulseIntensity = 0; } 
        beatDetected = false; 
    }

    function updateSparkParticles() { 
        sparkParticles.forEach((spark, index) => { 
            spark.life -= 0.02; 
            if (spark.life <= 0) { 
                if (spark.element.parentNode) { spark.element.parentNode.removeChild(spark.element); } 
                sparkParticles.splice(index, 1); return; 
            } 
            const newX = parseFloat(spark.element.style.left) + spark.velocityX; 
            const newY = parseFloat(spark.element.style.top) + spark.velocityY; 
            spark.element.style.left = `${newX}px`; 
            spark.element.style.top = `${newY}px`; 
            spark.element.style.opacity = (spark.life * 0.8).toString(); 
            const scale = spark.life * 0.7 + 0.3; 
            spark.element.style.transform = `scale(${scale})`; 
        }); 
    }

    function createSparkParticle(corner, intensity) { 
        const spark = document.createElement('div'); spark.className = 'spark'; 
        const corners = { 'top-left': { x: 0, y: 0 }, 'top-right': { x: window.innerWidth, y: 0 }, 'bottom-left': { x: 0, y: window.innerHeight }, 'bottom-right': { x: window.innerWidth, y: window.innerHeight } }; 
        const startPos = corners[corner]; 
        const angle = Math.random() * Math.PI / 2 + (Math.PI / 4 * ['top-left', 'top-right', 'bottom-right', 'bottom-left'].indexOf(corner)); 
        const speed = 2 + Math.random() * 3; const size = 2 + Math.random() * 4 * intensity; 
        const currentColors = currentTracks[currentTrackIndex].colors; 
        spark.style.width = `${size}px`; spark.style.height = `${size}px`; 
        spark.style.background = currentColors.accent; 
        spark.style.boxShadow = `0 0 ${size * 2}px ${currentColors.accent}`; 
        spark.style.left = `${startPos.x}px`; spark.style.top = `${startPos.y}px`; 
        spark.style.opacity = '0.8'; 
        document.getElementById('sparkParticles').appendChild(spark); 
        const sparkData = { element: spark, startX: startPos.x, startY: startPos.y, velocityX: Math.cos(angle) * speed, velocityY: Math.sin(angle) * speed, life: 1.0, maxLife: 1.0 }; 
        sparkParticles.push(sparkData); 
        setTimeout(() => { if (spark.parentNode) { spark.parentNode.removeChild(spark); } sparkParticles = sparkParticles.filter(s => s.element !== spark); }, 1000); 
    }

    function activateEnergySurge(intensity, type = 'normal') { 
        energySurgeActive = true; energySurgeIntensity = intensity; 
        if (type === 'fast') currentSurgeDecay = 0.15; else if (type === 'slow') currentSurgeDecay = 0.02; else currentSurgeDecay = 0.08; 
        const waves = [ document.getElementById('energyTop'), document.getElementById('energyRight'), document.getElementById('energyBottom'), document.getElementById('energyLeft') ]; 
        const currentColors = currentTracks[currentTrackIndex].colors; 
        waves.forEach(wave => { 
            wave.style.opacity = intensity.toString(); 
            const shadowSize = 10 + (intensity * 40); 
            wave.style.background = `linear-gradient(${ wave.classList.contains('top') || wave.classList.contains('bottom') ? '90deg' : '180deg' }, transparent, ${currentColors.accent}, transparent)`; 
            wave.style.boxShadow = `0 0 ${shadowSize}px ${currentColors.accent}`; 
        }); 
    }

    function updateEnergySurge() { 
        if (energySurgeActive && energySurgeIntensity > 0) { 
            energySurgeIntensity -= currentSurgeDecay; 
            if (energySurgeIntensity < 0) { energySurgeIntensity = 0; energySurgeActive = false; } 
            const waves = [ document.getElementById('energyTop'), document.getElementById('energyRight'), document.getElementById('energyBottom'), document.getElementById('energyLeft') ]; 
            waves.forEach(wave => { wave.style.opacity = energySurgeIntensity.toString(); }); 
        } 
    }

    function updateEdgeGlow(features) { 
        if (currentTracks.length === 0) return; 
        const { rms, bassEnergy, isBeat } = features; 
        let baseIntensity = rms * 0.3; 
        if (isBeat) { baseIntensity += currentPulseIntensity * 0.4; } 
        baseIntensity += bassEnergy * 0.2; 
        edgeGlowIntensity = Math.min(1, baseIntensity); 
        const currentColors = currentTracks[currentTrackIndex].colors; 
        Object.values(edgeGlowElements).forEach(glow => { 
            glow.style.opacity = edgeGlowIntensity.toString(); 
            glow.style.boxShadow = `0 0 ${20 + edgeGlowIntensity * 30}px ${currentColors.accent}`; 
        }); 
    }

    function analyzeEdgeEffects(features) { 
        if (currentTracks.length === 0) return; 
        const { rms, bassEnergy, isBeat, highEnergy } = features; 
        if (rms < 0.15) { 
            if (!energySurgeActive) { const breatheIntensity = 0.1 + (highEnergy * 0.2); activateEnergySurge(breatheIntensity, 'slow'); } 
        } else { 
            if (isBeat) { 
                let surgePower = (bassEnergy * 0.6) + (rms * 0.6); if (surgePower > 1) surgePower = 1; 
                if (surgePower > 0.65) { spawnCornerShockwaves(surgePower); } 
                if (!energySurgeActive) { const decayType = highEnergy > 0.25 ? 'fast' : 'normal'; activateEnergySurge(surgePower, decayType); } 
            } 
        } 
    }

    function updateParticlesMovement(features) { 
        if (isParticlesTransitioning || particlesData.length === 0 || currentTracks.length === 0) return; 
        const { rms, bassEnergy, midEnergy, highEnergy, isBeat } = features; 
        particlesData.forEach((particleData, index) => { 
            const particle = particleData.element; const time = Date.now() * 0.001; const individualOffset = index * 0.1; let moveX, moveY; 
            if (index % 10 < 3) { moveX = Math.sin(time * 0.3 + individualOffset) * bassEnergy * 2.0; moveY = Math.cos(time * 0.2 + individualOffset) * bassEnergy * 1.8; } 
            else if (index % 10 < 7) { moveX = Math.sin(time * 0.7 + individualOffset) * midEnergy * 1.2; moveY = Math.cos(time * 0.5 + individualOffset) * midEnergy * 1.0; } 
            else if (index % 10 < 9) { moveX = Math.sin(time * 2.0 + individualOffset) * highEnergy * 0.8; moveY = Math.cos(time * 1.8 + individualOffset) * highEnergy * 0.6; } 
            else { moveX = isBeat ? (Math.random() - 0.5) * 12 * currentPulseIntensity : 0; moveY = isBeat ? (Math.random() - 0.5) * 10 * currentPulseIntensity : 0; } 
            let sizeVariation = 0; if (index % 10 < 3) { sizeVariation = bassEnergy * 6; } else if (index % 10 < 7) { sizeVariation = midEnergy * 4; } else { sizeVariation = highEnergy * 3; } 
            const newSize = particleData.baseSize + sizeVariation; const newOpacity = Math.min(1, particleData.baseOpacity + rms * 0.3); 
            const newLeft = particleData.baseLeft + moveX; const newTop = particleData.baseTop + moveY; 
            particle.style.left = `${newLeft}vw`; particle.style.top = `${newTop}vh`; particle.style.width = `${newSize}px`; particle.style.height = `${newSize}px`; 
            particle.style.opacity = newOpacity; const currentColors = currentTracks[currentTrackIndex].colors; particle.style.background = currentColors.accent; 
            const transitionTime = Math.max(0.05, 0.2 - rms * 0.15); particle.style.transition = `all ${transitionTime}s ease-out`; 
        }); 
    }

    function spawnCornerShockwaves(intensity = 1) { 
        if (isLiteMode) return; 
        const allCorners = ['top-left', 'top-right', 'bottom-left', 'bottom-right']; 
        let activeCorners = []; 
        if (intensity > 0.8) { activeCorners = allCorners; } else { activeCorners = allCorners.sort(() => 0.5 - Math.random()).slice(0, 2); } 
        activeCorners.forEach(corner => { 
            const emitter = document.querySelector(`.corner-emitter.${corner}`); 
            if (emitter) { 
                const wave = document.createElement('div'); wave.className = 'shockwave active'; 
                if (currentTracks.length > 0) { wave.style.borderColor = currentTracks[currentTrackIndex].colors.accent; } 
                wave.style.borderWidth = `${2 + (intensity * 6)}px`; wave.style.opacity = (intensity * 0.7).toString(); 
                emitter.appendChild(wave); setTimeout(() => { if (wave.parentNode) wave.parentNode.removeChild(wave); }, 800); 
            } 
        }); 
    }

    // ==========================================
    // 4. ОСНОВНЫЕ ФУНКЦИИ ПЛЕЕРА (ЛОГИКА)
    // ==========================================

    function visualize() {
        // --- ЛОГИКА СУБТИТРОВ ---
        if (currentTracks && currentTracks.length > 0) {
            const track = currentTracks[currentTrackIndex];
            if (track.lyrics && track.lyrics.length > 0) {
                const currentLine = track.lyrics.filter(l => l.time <= audio.currentTime).pop();
                if (currentLine) {
                    if (lyricsDisplay.textContent !== currentLine.text) {
                        lyricsDisplay.textContent = currentLine.text;
                        if (currentLine.text !== "") {
                            lyricsDisplay.classList.add('visible');
                            lyricsDisplay.classList.remove('lyrics-bounce');
                            void lyricsDisplay.offsetWidth; 
                            lyricsDisplay.classList.add('lyrics-bounce');
                        } else {
                            lyricsDisplay.classList.remove('visible');
                        }
                    }
                }
            } else {
                if(lyricsDisplay.textContent !== '') {
                    lyricsDisplay.textContent = '';
                    lyricsDisplay.classList.remove('visible');
                }
            }
        }

        if (!analyser || !isPlaying || currentTracks.length === 0) return;
        
        try {
            analyser.getByteFrequencyData(dataArray); 
            analyzeSpectralFeatures(); 
            
            for (let i = 0; i < visualizerBars.length; i++) { 
                const barIndex = Math.floor((i / visualizerBars.length) * bufferLength); 
                const value = dataArray[barIndex] / 255; 
                let baseHeight = Math.max(5, value * 110); 
                if (i < 10) { 
                    const bassBoost = audioFeatures.bassEnergy * 25; 
                    const beatBoost = audioFeatures.isBeat ? currentPulseIntensity * 40 : 0; 
                    baseHeight += bassBoost + beatBoost; 
                } else if (i < 20) { 
                    const midBoost = audioFeatures.midEnergy * 18; 
                    const energyBoost = audioFeatures.rms * 12; 
                    baseHeight += midBoost + energyBoost; 
                } else { 
                    const highBoost = audioFeatures.highEnergy * 20; 
                    baseHeight += highBoost; 
                } 
                visualizerBars[i].style.height = `${baseHeight}px`; 
                const currentColors = currentTracks[currentTrackIndex].colors; 
                visualizerBars[i].style.background = `linear-gradient(to top, ${currentColors.primary}, ${currentColors.accent})`; 
            }
            
            if (leftGlow && rightGlow) { 
                const minHeight = 15; 
                const lineHeight = minHeight + (audioFeatures.rms * 130); 
                leftGlow.style.height = `${lineHeight}%`; 
                rightGlow.style.height = `${lineHeight}%`; 
                const brightness = 0.7 + (audioFeatures.spectralCentroid / bufferLength) * 0.5; 
                leftGlow.style.opacity = brightness; 
                rightGlow.style.opacity = brightness; 
                const neonColor = currentTracks[currentTrackIndex].neonColor; 
                const baseBlur = 12; 
                const pulseBlur = currentPulseIntensity * 35; 
                leftGlow.style.background = neonColor; 
                leftGlow.style.boxShadow = `0 0 ${baseBlur + pulseBlur}px ${neonColor}, 0 0 ${(baseBlur + pulseBlur) * 1.8}px ${neonColor}, inset 0 0 10px rgba(255, 255, 255, 0.3)`; 
                rightGlow.style.background = neonColor; 
                rightGlow.style.boxShadow = `0 0 ${baseBlur + pulseBlur}px ${neonColor}, 0 0 ${(baseBlur + pulseBlur) * 1.8}px ${neonColor}, inset 0 0 10px rgba(255, 255, 255, 0.3)`; 
            }
            
            updateParticlesMovement(audioFeatures); 
            if (!isLiteMode) analyzeEdgeEffects(audioFeatures);
            updateSparkParticles(); 
            updateEnergySurge(); 
            updateEdgeGlow(audioFeatures); 
            updatePulseIntensity();
            animationId = requestAnimationFrame(visualize);
        } catch (error) { 
            if (animationId) cancelAnimationFrame(animationId); 
        }
    }

    function updatePlaybackModeButton() { 
        const icon = playbackModeBtn.querySelector('svg'); 
        switch(playbackMode) { 
            case PLAYBACK_MODES.PLAYLIST: icon.innerHTML = '<path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>'; break; 
            case PLAYBACK_MODES.SINGLE: icon.innerHTML = '<path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z"/>'; break; 
            case PLAYBACK_MODES.ONCE: icon.innerHTML = '<path d="M5.64 3.64l1.42-1.42L20.36 18.22l-1.42 1.42L5.64 3.64zM7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>'; break; 
        } 
    }

    function togglePlaybackMode() { playbackMode = (playbackMode + 1) % 3; updatePlaybackModeButton(); }

    function updateVolumeSlider() { 
        const volumeValue = volumeSlider.value; 
        const accentColor = (currentTracks && currentTracks.length > 0) ? currentTracks[currentTrackIndex].colors.accent : '#ffffff'; 
        volumeSlider.style.background = `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${volumeValue}%, rgba(255, 255, 255, 0.1) ${volumeValue}%, rgba(255, 255, 255, 0.1) 100%)`; 
    }

    function seek(seconds) { if (audio.duration) { audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds)); } }

    function toggleLiteMode() { 
        isLiteMode = !isLiteMode; 
        localStorage.setItem('isLiteMode', isLiteMode); 
        const sparkParticlesContainer = document.getElementById('sparkParticles'); 
        if (isLiteMode) { 
            sparkParticlesContainer.innerHTML = ''; 
            document.body.classList.add('lite-mode'); 
            liteModeBtn.classList.add('active'); 
        } else { 
            document.body.classList.remove('lite-mode'); 
            liteModeBtn.classList.remove('active'); 
        } 
    }

    function populatePlaylistSelector() {
        playlistOptions.innerHTML = '';
        currentPlaylistText.textContent = currentPlaylistName;
        const allPls = getAllPlaylists();
        for (const playlistName in allPls) {
            const option = document.createElement('div');
            option.className = 'custom-option';
            option.textContent = playlistName;
            if (playlistName === currentPlaylistName) option.classList.add('selected');
            option.addEventListener('click', () => {
                currentPlaylistName = playlistName;
                currentPlaylistText.textContent = playlistName;
                switchPlaylist(playlistName);
                customSelectContainer.classList.remove('open');
                populatePlaylistSelector();
            });
            playlistOptions.appendChild(option);
        }
    }

    function filterTracks(searchTerm) { 
        const filteredTracks = currentTracks.filter(track => track.name.toLowerCase().includes(searchTerm.toLowerCase()) || track.artist.toLowerCase().includes(searchTerm.toLowerCase()) ); 
        trackList.innerHTML = ''; 
        if (filteredTracks.length === 0) { trackList.innerHTML = '<div class="track-item-title" style="text-align: center; padding: 20px;">Ничего не найдено</div>'; return; } 
        filteredTracks.forEach((track) => { 
            const originalIndex = currentTracks.findIndex(t => t.path === track.path); 
            const isTrackActive = audio.src.includes(track.path) && !audio.paused; 
            const trackItem = document.createElement('div'); 
            trackItem.className = `track-item ${isTrackActive ? 'active' : ''}`; 
            const progressPercent = isTrackActive ? (audio.currentTime / audio.duration * 100) || 0 : 0; 
            trackItem.innerHTML = ` <div class="track-item-cover" style="background-image: url('${track.cover}')"></div> <div class="track-item-info"> <div class="track-item-title">${track.name}</div> <div class="track-item-artist">${track.artist}</div> <div class="track-item-progress"> <div class="track-item-progress-bar" style="width: ${progressPercent}%"></div> </div> </div> ${isTrackActive ? '<div class="now-playing-icon">▶</div>' : ''} `; 
            trackItem.addEventListener('click', () => { loadTrack(originalIndex, true); }); 
            trackList.appendChild(trackItem); 
        }); 
    }

    function toggleTrackList() { 
        isTrackListOpen = !isTrackListOpen; 
        if (isTrackListOpen) { playerContainer.classList.add('shifted'); trackListPanel.classList.add('active'); renderTrackList(); } 
        else { playerContainer.classList.remove('shifted'); trackListPanel.classList.remove('active'); } 
    }

    function saveTrackFromEditor() {
        if (!pendingUploadFile) return;
        const objectUrl = URL.createObjectURL(pendingUploadFile);
        let coverUrl = 'picture/default_cover.jpg';
        if (editTrackCoverInput.files && editTrackCoverInput.files[0]) { coverUrl = URL.createObjectURL(editTrackCoverInput.files[0]); }
        const newTrack = {
            name: editTrackTitle.value || "Без названия", artist: editTrackArtist.value || "Неизвестен",
            path: objectUrl, cover: coverUrl,
            colors: { primary: editColorPrimary.value, secondary: adjustColorBrightness(editColorPrimary.value, -20), accent: editColorAccent.value },
            visualizer: [editColorAccent.value, '#ffffff'], neonColor: editColorAccent.value
        };
        uploadedTracks.push(newTrack);
        closeTrackEditor();
        currentPlaylistName = "Мои загрузки";
        populatePlaylistSelector();
        switchPlaylist("Мои загрузки");
    }

    function openTrackEditor(file) {
        pendingUploadFile = file;
        editTrackTitle.value = file.name.replace(/\.[^/.]+$/, "");
        editTrackArtist.value = "Unknown Artist";
        coverPreview.style.backgroundImage = '';
        editTrackCoverInput.value = '';
        editColorPrimary.value = '#1a1a2e';
        editColorAccent.value = '#00d1ff';
        trackEditModalOverlay.classList.add('active');
    }
    function closeTrackEditor() { trackEditModalOverlay.classList.remove('active'); pendingUploadFile = null; }
    
    function deleteUserPlaylist() {
        if (confirm(`Удалить плейлист "${currentPlaylistName}"?`)) {
            delete userPlaylists[currentPlaylistName];
            saveUserPlaylists();
            currentPlaylistName = "Все треки";
            populatePlaylistSelector();
            switchPlaylist("Все треки");
        }
    }

    function addTrackToPlaylist(track, targetPlaylistName) {
        if (!userPlaylists[targetPlaylistName]) return;
        const exists = userPlaylists[targetPlaylistName].some(t => t.name === track.name && t.artist === track.artist);
        if (exists) { alert('Трек уже есть в этом плейлисте!'); return; }
        userPlaylists[targetPlaylistName].push(track);
        saveUserPlaylists();
        if (currentPlaylistName === targetPlaylistName) {
            currentTracks = userPlaylists[targetPlaylistName];
            renderTrackList();
        }
        alert(`Трек добавлен в "${targetPlaylistName}"`);
    }

    function removeTrack(index) {
        if (!userPlaylists[currentPlaylistName]) return;
        if (confirm('Убрать этот трек из плейлиста?')) {
            currentTracks.splice(index, 1);
            saveUserPlaylists();
            renderTrackList();
        }
    }

    function createNewPlaylist(name) {
        if (!name) return;
        const allPls = getAllPlaylists();
        if (allPls[name]) { alert('Плейлист с таким именем уже существует!'); return; }
        userPlaylists[name] = [];
        saveUserPlaylists();
        currentPlaylistName = name;
        populatePlaylistSelector();
        switchPlaylist(name);
        closeModal();
    }
    function saveUserPlaylists() { localStorage.setItem('myUserPlaylists', JSON.stringify(userPlaylists)); }
    function closeModal() { modalOverlay.classList.remove('active'); newPlaylistName.value = ''; }
    function closeAllMenus() { document.querySelectorAll('.context-menu').forEach(el => el.classList.remove('show')); document.querySelectorAll('.track-menu-btn').forEach(el => el.classList.remove('active')); activeMenuId = null; }
    function toggleContextMenu(index) { const menu = document.getElementById(`menu-${index}`); const btn = document.getElementById(`menu-btn-${index}`); if (activeMenuId === index) { closeAllMenus(); return; } closeAllMenus(); menu.classList.add('show'); btn.classList.add('active'); activeMenuId = index; }
    function addToPlaylistAction(track) { const playlistNames = Object.keys(userPlaylists); if (playlistNames.length === 0) { alert("Сначала создайте хотя бы один плейлист!"); return; } let promptText = "Выберите плейлист (введите номер):\n"; playlistNames.forEach((name, i) => promptText += `${i + 1}. ${name}\n`); const choice = prompt(promptText); const choiceIndex = parseInt(choice) - 1; if (choiceIndex >= 0 && choiceIndex < playlistNames.length) { addTrackToPlaylist(track, playlistNames[choiceIndex]); } }
    function downloadTrackAction(track) { const a = document.createElement('a'); a.href = track.path; a.download = `${track.artist} - ${track.name}.mp3`; document.body.appendChild(a); a.click(); document.body.removeChild(a); }
    function addDragEvents(item, index) {
        item.addEventListener('dragstart', (e) => { if (!e.target.closest('.drag-handle')) { e.preventDefault(); return; } draggedItemIndex = index; item.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/html', item.innerHTML); });
        item.addEventListener('dragend', () => { item.classList.remove('dragging'); draggedItemIndex = null; document.querySelectorAll('.track-item').forEach(el => { el.classList.remove('drag-over-top'); el.classList.remove('drag-over-bottom'); }); });
        item.addEventListener('dragover', (e) => { if (draggedItemIndex === null) return; e.preventDefault(); e.dataTransfer.dropEffect = 'move'; const rect = item.getBoundingClientRect(); const offset = e.clientY - rect.top; item.classList.remove('drag-over-top'); item.classList.remove('drag-over-bottom'); if (offset < rect.height / 2) { item.classList.add('drag-over-top'); } else { item.classList.add('drag-over-bottom'); } });
        item.addEventListener('dragleave', () => { item.classList.remove('drag-over-top'); item.classList.remove('drag-over-bottom'); });
        item.addEventListener('drop', (e) => { e.preventDefault(); if (draggedItemIndex === null || draggedItemIndex === index) return; const rect = item.getBoundingClientRect(); const offset = e.clientY - rect.top; const isAfter = offset >= (rect.height / 2); let targetIndex = index; if (isAfter) targetIndex++; const [draggedTrack] = currentTracks.splice(draggedItemIndex, 1); if (draggedItemIndex < targetIndex) { targetIndex--; } currentTracks.splice(targetIndex, 0, draggedTrack); saveUserPlaylists(); renderTrackList(); if (currentTrackIndex === draggedItemIndex) { currentTrackIndex = targetIndex; } });
    }

    function switchPlaylist(playlistName) { 
        const allPls = getAllPlaylists();
        if (allPls[playlistName]) { 
            currentPlaylistName = playlistName; 
            currentTracks = allPls[playlistName]; 
            if (userPlaylists[playlistName]) { deletePlaylistBtn.style.display = 'flex'; } else { deletePlaylistBtn.style.display = 'none'; }
            
            const isCurrentTrackInNewPlaylist = currentTracks.some(track => audio.src.includes(track.path)); 
            if (!isCurrentTrackInNewPlaylist) { 
                audio.pause(); isPlaying = false; playPauseBtn.querySelector('svg').innerHTML = '<path d="M8 5v14l11-7z"/>'; 
                if (animationId) cancelAnimationFrame(animationId); 
                if (currentTracks.length === 0) { progress.style.width = '0%'; currentTime.textContent = '0:00'; } 
                loadTrack(0); 
            } 
            renderTrackList(); 
        } 
    }

    function renderTrackList() {
        trackList.innerHTML = '';
        if (!currentTracks || currentTracks.length === 0) { 
            trackList.innerHTML = `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 200px; opacity: 0.5;"><svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor" style="margin-bottom: 10px;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"/></svg><div>Плейлист пуст</div></div>`; 
            return; 
        }
        const isUserPlaylist = !!userPlaylists[currentPlaylistName];
        currentTracks.forEach((track, index) => {
            const trackItem = document.createElement('div');
            const isTrackActive = audio.src.includes(track.path) && !audio.paused;
            trackItem.className = `track-item ${isTrackActive ? 'active' : ''}`;
            trackItem.dataset.index = index;
            const progressPercent = isTrackActive ? (audio.currentTime / audio.duration * 100) || 0 : 0;
            let dragHandleHTML = isUserPlaylist ? `<div class="drag-handle" title="Переместить"><svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg></div>` : `<div style="width: 10px;"></div>`;
            if (isUserPlaylist) { trackItem.draggable = true; addDragEvents(trackItem, index); }
            
            trackItem.innerHTML = `
                ${dragHandleHTML}
                <div class="track-item-cover" style="background-image: url('${track.cover || 'picture/default_cover.jpg'}')"></div>
                <div class="track-item-info">
                    <div class="track-item-title">${track.name}</div>
                    <div class="track-item-artist">${track.artist}</div>
                    <div class="track-item-progress">
                        <div class="track-item-progress-bar" style="width: ${progressPercent}%"></div>
                    </div>
                </div>
                ${isTrackActive ? `<div class="now-playing-icon"><svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 20c4.42 0 8-3.58 8-8s-3.58-8-8-8-8 3.58-8 8 3.58 8 8 8zM10 9.65l6 2.35-6 2.35V9.65z"/></svg></div>` : ''}
                <button class="track-menu-btn" id="menu-btn-${index}"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg></button>
                <div class="context-menu" id="menu-${index}">
                    <div class="context-menu-item add-to-pl" data-index="${index}"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 10H2v2h12v-2zm0-4H2v2h12V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM2 16h8v-2H2v2z"/></svg>Добавить в плейлист</div>
                    <div class="context-menu-item download-track" data-index="${index}"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>Скачать файл</div>
                    ${isUserPlaylist ? `<div class="menu-divider"></div><div class="context-menu-item delete-item remove-track" data-index="${index}"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>Удалить из плейлиста</div>` : ''}
                </div>
            `;
            
            trackItem.addEventListener('click', (e) => { 
                if (e.target.closest('.track-menu-btn') || e.target.closest('.context-menu') || e.target.closest('.drag-handle')) return; 
                loadTrack(index, true); 
            });
            
            const menuBtn = trackItem.querySelector(`#menu-btn-${index}`);
            menuBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleContextMenu(index); });
            trackItem.querySelector('.add-to-pl').addEventListener('click', (e) => { e.stopPropagation(); addToPlaylistAction(track); closeAllMenus(); });
            trackItem.querySelector('.download-track').addEventListener('click', (e) => { e.stopPropagation(); downloadTrackAction(track); closeAllMenus(); });
            if (isUserPlaylist) { trackItem.querySelector('.remove-track').addEventListener('click', (e) => { e.stopPropagation(); removeTrack(index); closeAllMenus(); }); }
            trackList.appendChild(trackItem);
        });
    }

    // ==========================================
    // 5. ИНИЦИАЛИЗАЦИЯ СЛУШАТЕЛЕЙ
    // ==========================================
    
    playlistTrigger.addEventListener('click', (e) => { e.stopPropagation(); customSelectContainer.classList.toggle('open'); });
    document.addEventListener('click', (e) => { if (!customSelectContainer.contains(e.target)) customSelectContainer.classList.remove('open'); });
    
    createPlaylistBtn.addEventListener('click', () => { modalOverlay.classList.add('active'); newPlaylistName.focus(); });
    closeModalBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });
    confirmPlaylistBtn.addEventListener('click', () => { createNewPlaylist(newPlaylistName.value); });
    
    uploadTrackBtn.addEventListener('click', () => { fileInput.click(); });
    fileInput.addEventListener('change', (e) => { if(e.target.files.length) openTrackEditor(e.target.files[0]); fileInput.value=''; });
    editTrackCoverBtn.addEventListener('click', () => editTrackCoverInput.click());
    editTrackCoverInput.addEventListener('change', (e) => { if (e.target.files && e.target.files[0]) { coverPreview.style.backgroundImage = `url('${URL.createObjectURL(e.target.files[0])}')`; } });
    closeTrackEditBtn.addEventListener('click', closeTrackEditor);
    confirmTrackEditBtn.addEventListener('click', saveTrackFromEditor);
    deletePlaylistBtn.addEventListener('click', deleteUserPlaylist);
    liteModeBtn.addEventListener('click', toggleLiteMode);
    
    document.addEventListener('keydown', (e) => { if (e.target.tagName === 'INPUT') return; switch(e.key.toLowerCase()) { case 'arrowleft': seek(-5); break; case 'arrowright': seek(5); break; case ' ': e.preventDefault(); playPauseBtn.click(); break; case 'l': toggleLiteMode(); break; } });
    
    playPauseBtn.addEventListener('click', () => { if (isPlaying) { audio.pause(); isPlaying = false; playPauseBtn.querySelector('svg').innerHTML = '<path d="M8 5v14l11-7z"/>'; if (animationId) { cancelAnimationFrame(animationId); animationId = null; } } else { playTrack(); } });
    prevBtn.addEventListener('click', () => { if (!currentTracks || currentTracks.length === 0) return; let newIndex = currentTrackIndex - 1; if (newIndex < 0) newIndex = currentTracks.length - 1; loadTrack(newIndex, true); });
    nextBtn.addEventListener('click', () => { if (!currentTracks || currentTracks.length === 0) return; let newIndex = currentTrackIndex + 1; if (newIndex >= currentTracks.length) newIndex = 0; loadTrack(newIndex, true); });
    
    playbackModeBtn.addEventListener('click', togglePlaybackMode);
    trackListBtn.addEventListener('click', toggleTrackList);
    trackSearch.addEventListener('input', (e) => { filterTracks(e.target.value); });
    volumeSlider.addEventListener('input', () => { audio.volume = volumeSlider.value / 100; updateVolumeSlider(); });
    progressBar.addEventListener('click', (e) => { if (audio.duration) { const clickX = e.offsetX; const width = progressBar.offsetWidth; const clickTime = (clickX / width) * audio.duration; audio.currentTime = clickTime; } });
    
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', () => { if (!currentTracks || currentTracks.length === 0) return; switch(playbackMode) { case PLAYBACK_MODES.PLAYLIST: let newIndex = currentTrackIndex + 1; if (newIndex >= currentTracks.length) newIndex = 0; loadTrack(newIndex, true); break; case PLAYBACK_MODES.SINGLE: loadTrack(currentTrackIndex, true); break; case PLAYBACK_MODES.ONCE: audio.pause(); isPlaying = false; playPauseBtn.querySelector('svg').innerHTML = '<path d="M8 5v14l11-7z"/>'; if (animationId) { cancelAnimationFrame(animationId); animationId = null; } break; } });
    audio.addEventListener('error', (e) => console.error('Audio element error:', e));
    document.addEventListener('click', (e) => { if (!e.target.closest('.track-menu-btn') && !e.target.closest('.context-menu')) { closeAllMenus(); } });

    // ==========================================
    // 6. ЗАПУСК
    // ==========================================
    
    // 1. Заполняем селектор плейлистов
    populatePlaylistSelector();
    
    // 2. Устанавливаем текущий плейлист (здесь заполнится массив currentTracks)
    switchPlaylist(currentPlaylistName);
    
    // 3. Создаем визуальные элементы
    createVisualizer();
    createParticles();
    createEdgeGlow();
    
    // 4. Обновляем UI кнопок
    updatePlaybackModeButton();
    updateVolumeSlider();
    
    if (isLiteMode) {
        document.body.classList.add('lite-mode');
        liteModeBtn.classList.add('active');
    }
    
    // 5. Загружаем первый трек (если есть)
    if(currentTracks && currentTracks.length > 0) {
        loadTrack(0, false);
    }
});

window.addEventListener('load', function() { 
    const preloader = document.getElementById('preloader'); 
    setTimeout(() => { 
        preloader.classList.add('hide'); 
        setTimeout(() => { preloader.remove(); }, 500); 
    }, 800); 
});
