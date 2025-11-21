document.addEventListener('DOMContentLoaded', () => {

    // === 1. ГЛОБАЛЬНОЕ СОСТОЯНИЕ ===
    const state = {
        playlist: [...tracksData], // Копия данных из data.js
        currentTrackIndex: 0,
        isPlaying: false,
        isLiteMode: localStorage.getItem('liteMode') === 'true'
    };

    // === 2. АНАЛИЗАТОР ЗВУКА (ДЕТЕКЦИЯ БИТА) ===
    class AudioAnalyzer {
        constructor(audioElement) {
            this.audio = audioElement;
            this.context = null;
            this.analyser = null;
            this.dataArray = null;
            this.features = { bass: 0, mid: 0, high: 0, isBeat: false };
            this.beatThreshold = 150; // Порог срабатывания бита (0-255)
            this.beatCooldown = 0;    // Задержка между битами
        }

        init() {
            if (this.context) return;
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.context = new AudioContext();
            this.analyser = this.context.createAnalyser();
            this.analyser.fftSize = 256;
            const source = this.context.createMediaElementSource(this.audio);
            source.connect(this.analyser);
            this.analyser.connect(this.context.destination);
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        }

        update() {
            if (!this.context) return this.features;
            this.analyser.getByteFrequencyData(this.dataArray);

            // Расчет энергий по диапазонам
            let bass = 0, mid = 0, high = 0;
            for(let i=0; i<this.dataArray.length; i++) {
                if (i < 10) bass += this.dataArray[i];
                else if (i < 20) mid += this.dataArray[i];
                else high += this.dataArray[i];
            }
            
            this.features.bass = bass / 10;
            this.features.mid = mid / 10;
            this.features.high = high / (this.dataArray.length - 20);

            // Детекция бита
            this.features.isBeat = false;
            if (this.beatCooldown > 0) this.beatCooldown--;
            if (this.features.bass > this.beatThreshold && this.beatCooldown <= 0) {
                this.features.isBeat = true;
                this.beatCooldown = 10; // Пауза в кадрах (60fps / 10 = ~6 раз в сек макс)
            }

            return this.features;
        }
    }

    // === 3. СИСТЕМА ЧАСТИЦ (С РЕАКЦИЕЙ НА ЗВУК) ===
    class ParticleSystem {
        constructor(containerId) {
            this.container = document.getElementById(containerId);
            this.particles = [];
            this.maxParticles = 20;
        }

        createParticles() {
            this.container.innerHTML = '';
            this.particles = [];
            for (let i = 0; i < this.maxParticles; i++) {
                const p = document.createElement('div');
                p.className = 'particle';
                this.resetParticle(p);
                this.container.appendChild(p);
                this.particles.push({
                    el: p,
                    x: Math.random() * 100,
                    y: Math.random() * 100,
                    vx: (Math.random() - 0.5) * 0.1,
                    vy: (Math.random() - 0.5) * 0.1,
                    size: Math.random() * 10 + 5
                });
            }
        }

        resetParticle(el) {
            const size = Math.random() * 10 + 5;
            el.style.width = `${size}px`;
            el.style.height = `${size}px`;
            el.style.opacity = Math.random() * 0.5 + 0.1;
        }

        update(audioFeatures, isLiteMode) {
            if (isLiteMode) return;

            this.particles.forEach(p => {
                // Движение
                p.x += p.vx;
                p.y += p.vy;

                // Реакция на бас (дрожание)
                let bassOffset = 0;
                if (audioFeatures.bass > 100) {
                    bassOffset = (Math.random() - 0.5) * (audioFeatures.bass / 30);
                }

                // Границы экрана (отскок)
                if (p.x < 0 || p.x > 100) p.vx *= -1;
                if (p.y < 0 || p.y > 100) p.vy *= -1;

                p.el.style.left = `${p.x + bassOffset}%`;
                p.el.style.top = `${p.y + bassOffset}%`;
                
                // Пульсация размера от бита
                if (audioFeatures.isBeat) {
                    p.el.style.transform = `scale(1.5)`;
                } else {
                    p.el.style.transform = `scale(1)`;
                }
            });
        }
    }

    // === 4. МЕНЕДЖЕР СУБТИТРОВ ===
    class LyricsManager {
        constructor() {
            this.container = document.getElementById('lyricsContainer');
            this.currentData = [];
        }
        async load(src) {
            this.currentData = [];
            this.container.textContent = '';
            this.container.classList.remove('visible');
            if (!src) return;
            try {
                const res = await fetch(src);
                if (res.ok) this.currentData = await res.json();
            } catch (e) {}
        }
        update(currentTime) {
            if (!this.currentData.length) return;
            const offset = 0.2; // Опережение
            const line = this.currentData.filter(l => l.time <= currentTime + offset).pop();
            if (line && this.container.textContent !== line.text) {
                this.container.textContent = line.text;
                if (line.text) {
                    this.container.classList.add('visible');
                    this.container.classList.remove('lyrics-bounce');
                    void this.container.offsetWidth;
                    this.container.classList.add('lyrics-bounce');
                } else {
                    this.container.classList.remove('visible');
                }
            }
        }
    }

    // === 5. ПЛЕЙЛИСТ (DRAG & DROP + UPLOAD) ===
    class PlaylistManager {
        constructor(app) {
            this.app = app;
            this.container = document.getElementById('playlistContainer');
            this.searchInput = document.getElementById('searchParams');
            this.fileInput = document.getElementById('fileUpload');
            this.draggedIndex = null;
            
            this.setupUpload();
        }

        setupUpload() {
            document.getElementById('btnAddTrack').addEventListener('click', () => {
                this.fileInput.click();
            });
            
            this.fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                const url = URL.createObjectURL(file);
                const newTrack = {
                    name: file.name.replace(/\.[^/.]+$/, ""),
                    artist: 'Local File',
                    path: url,
                    cover: 'picture/default.jpg', // Заглушка
                    colors: { accent: '#00ffcc' },
                    lyricsSource: null
                };
                
                state.playlist.push(newTrack);
                this.render(state.playlist);
                // Сразу включаем загруженный трек
                this.app.loadTrack(state.playlist.length - 1);
                this.app.togglePlay();
            });
        }

        render(list) {
            this.container.innerHTML = '';
            list.forEach((track, i) => {
                const realIndex = state.playlist.indexOf(track);
                const el = document.createElement('div');
                
                el.className = `track-item ${realIndex === state.currentTrackIndex ? 'active' : ''}`;
                el.draggable = true;
                el.dataset.index = realIndex;
                
                el.innerHTML = `
                    <div class="drag-handle">::</div>
                    <img src="${track.cover}" onerror="this.src='picture/default.jpg'">
                    <div class="t-info">
                        <span class="t-title">${track.name}</span>
                        <span class="t-artist">${track.artist}</span>
                    </div>
                    <button class="btn-ctx">⋮</button>
                    <div class="context-menu" id="ctx-${realIndex}">
                        <div class="ctx-item" onclick="removeTrack(${realIndex})">Удалить</div>
                    </div>
                `;

                // События клика
                el.addEventListener('click', (e) => {
                    if (e.target.classList.contains('btn-ctx')) {
                        this.toggleCtx(realIndex);
                    } else if (e.target.classList.contains('ctx-item')) {
                        // обработка удаления через глобальную функцию (костыль для простоты)
                    } else {
                        this.app.loadTrack(realIndex);
                        if (!state.isPlaying) this.app.togglePlay();
                    }
                });

                // Drag & Drop события
                this.addDragEvents(el, realIndex);

                this.container.appendChild(el);
            });
            
            // Костыль для удаления (чтобы класс видел scope)
            window.removeTrack = (index) => {
                if (confirm('Удалить трек?')) {
                    state.playlist.splice(index, 1);
                    this.render(state.playlist);
                }
            };
        }

        toggleCtx(index) {
            document.querySelectorAll('.context-menu').forEach(m => m.classList.remove('show'));
            const menu = document.getElementById(`ctx-${index}`);
            if (menu) menu.classList.add('show');
        }

        addDragEvents(el, index) {
            el.addEventListener('dragstart', (e) => {
                this.draggedIndex = index;
                el.classList.add('dragging');
            });
            el.addEventListener('dragend', () => {
                el.classList.remove('dragging');
                document.querySelectorAll('.track-item').forEach(i => i.classList.remove('drag-over'));
            });
            el.addEventListener('dragover', (e) => {
                e.preventDefault();
                el.classList.add('drag-over');
            });
            el.addEventListener('dragleave', () => el.classList.remove('drag-over'));
            el.addEventListener('drop', (e) => {
                e.preventDefault();
                const targetIndex = index;
                if (this.draggedIndex === null || this.draggedIndex === targetIndex) return;

                // Перестановка в массиве
                const item = state.playlist.splice(this.draggedIndex, 1)[0];
                state.playlist.splice(targetIndex, 0, item);
                
                // Обновляем индекс текущего трека, если он сместился
                if (state.currentTrackIndex === this.draggedIndex) state.currentTrackIndex = targetIndex;
                else if (state.currentTrackIndex === targetIndex && this.draggedIndex > targetIndex) state.currentTrackIndex++;
                
                this.render(state.playlist);
            });
        }
    }

    // === 6. ОСНОВНОЕ ПРИЛОЖЕНИЕ ===
    class App {
        constructor() {
            this.audio = document.getElementById('audioEl');
            this.analyzer = new AudioAnalyzer(this.audio);
            this.lyrics = new LyricsManager();
            this.particles = new ParticleSystem('particles');
            this.playlistMgr = new PlaylistManager(this);
            
            // UI References
            this.ui = {
                playBtn: document.getElementById('btnPlay'),
                prevBtn: document.getElementById('btnPrev'),
                nextBtn: document.getElementById('btnNext'),
                playlistBtn: document.getElementById('btnPlaylist'),
                panel: document.getElementById('playlistPanel'),
                card: document.getElementById('playerCard'),
                art: document.getElementById('albumArt'),
                bg: document.getElementById('bg-layer'),
                name: document.getElementById('trackName'),
                artist: document.getElementById('trackArtist'),
                progress: document.getElementById('progressFill'),
                bar: document.getElementById('progressBar'),
                currTime: document.getElementById('currentTime'),
                durTime: document.getElementById('totalDuration'),
                liteBtn: document.getElementById('btnLiteMode'),
                glowLeft: document.getElementById('neon-glow-left'),
                glowRight: document.getElementById('neon-glow-right'),
                visualizer: document.getElementById('visualizerBox')
            };

            this.vizBars = [];
            this.createVizBars();
            this.particles.createParticles();
            this.setupEvents();
            
            // Старт
            this.playlistMgr.render(state.playlist);
            this.loadTrack(state.currentTrackIndex);
            
            if (state.isLiteMode) document.body.classList.add('lite-mode');
            this.animationLoop();
        }

        createVizBars() {
            this.ui.visualizer.innerHTML = '';
            this.vizBars = [];
            for(let i=0; i<20; i++) {
                const d = document.createElement('div');
                d.className = 'bar';
                this.ui.visualizer.appendChild(d);
                this.vizBars.push(d);
            }
        }

        setupEvents() {
            this.ui.playBtn.onclick = () => this.togglePlay();
            this.ui.prevBtn.onclick = () => this.changeTrack(-1);
            this.ui.nextBtn.onclick = () => this.changeTrack(1);
            
            this.ui.playlistBtn.onclick = () => {
                this.ui.panel.classList.toggle('active');
                this.ui.card.classList.toggle('shifted');
            };

            this.ui.bar.onclick = (e) => {
                const w = this.ui.bar.clientWidth;
                const x = e.offsetX;
                this.audio.currentTime = (x / w) * this.audio.duration;
            };

            document.getElementById('volumeSlider').oninput = (e) => this.audio.volume = e.target.value;
            
            document.getElementById('searchParams').oninput = (e) => {
                const val = e.target.value.toLowerCase();
                const filtered = state.playlist.filter(t => 
                    t.name.toLowerCase().includes(val) || t.artist.toLowerCase().includes(val)
                );
                // При поиске drag&drop может глючить, но отображение работает
                this.playlistMgr.render(filtered);
            };

            this.ui.liteBtn.onclick = () => {
                state.isLiteMode = !state.isLiteMode;
                localStorage.setItem('liteMode', state.isLiteMode);
                document.body.classList.toggle('lite-mode', state.isLiteMode);
            };

            this.audio.ontimeupdate = () => {
                const p = (this.audio.currentTime / this.audio.duration) * 100;
                this.ui.progress.style.width = `${p}%`;
                this.ui.currTime.textContent = this.formatTime(this.audio.currentTime);
            };
            this.audio.onended = () => this.changeTrack(1);
            this.audio.onloadedmetadata = () => this.ui.durTime.textContent = this.formatTime(this.audio.duration);
        }

        loadTrack(index) {
            if (index < 0) index = state.playlist.length - 1;
            if (index >= state.playlist.length) index = 0;
            state.currentTrackIndex = index;
            
            const track = state.playlist[index];
            this.audio.src = track.path;
            this.ui.name.textContent = track.name;
            this.ui.artist.textContent = track.artist;
            this.ui.art.style.backgroundImage = `url('${track.cover}')`;
            this.ui.bg.style.backgroundImage = `url('${track.cover}')`;
            
            document.documentElement.style.setProperty('--accent', track.colors.accent);
            
            this.lyrics.load(track.lyricsSource);
            this.playlistMgr.render(state.playlist); // Обновить подсветку

            if (state.isPlaying) this.audio.play();
        }

        togglePlay() {
            this.analyzer.init();
            if (this.audio.paused) {
                this.audio.play();
                state.isPlaying = true;
                this.ui.playBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="currentColor"/></svg>';
            } else {
                this.audio.pause();
                state.isPlaying = false;
                this.ui.playBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>';
            }
        }

        changeTrack(dir) {
            this.loadTrack(state.currentTrackIndex + dir);
            if (!state.isPlaying) this.togglePlay();
        }

        formatTime(s) {
            if(isNaN(s)) return '0:00';
            const m = Math.floor(s/60);
            const sc = Math.floor(s%60);
            return `${m}:${sc<10?'0'+sc:sc}`;
        }

        // ГЛАВНЫЙ ЦИКЛ ОТРИСОВКИ (60 FPS)
        animationLoop() {
            requestAnimationFrame(() => this.animationLoop());
            
            if (state.isPlaying) {
                // 1. Получаем данные звука
                const features = this.analyzer.update();
                
                // 2. Рисуем полоски визуалайзера
                const data = this.analyzer.dataArray; 
                if (data) {
                    const step = Math.floor(data.length / 20);
                    this.vizBars.forEach((bar, i) => {
                        const h = Math.max(4, (data[i*step]/255)*100);
                        bar.style.height = `${h}%`;
                        // Удар бита красит полоски в белый
                        bar.style.background = features.isBeat ? '#fff' : `linear-gradient(to top, var(--accent), white)`;
                    });
                }

                // 3. Обновляем частицы и эффекты (если не Lite Mode)
                if (!state.isLiteMode) {
                    this.particles.update(features, state.isLiteMode);
                    
                    // Пульсация обложки
                    if (features.isBeat) {
                        this.ui.art.style.transform = 'scale(1.05)';
                        this.ui.glowLeft.style.height = '80%';
                        this.ui.glowRight.style.height = '80%';
                    } else {
                        this.ui.art.style.transform = 'scale(1)';
                        const glowH = (features.bass / 255) * 50;
                        this.ui.glowLeft.style.height = `${glowH}%`;
                        this.ui.glowRight.style.height = `${glowH}%`;
                    }
                }

                // 4. Проверка субтитров
                this.lyrics.update(this.audio.currentTime);
            }
        }
    }

    const app = new App();
});
