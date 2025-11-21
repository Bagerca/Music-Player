document.addEventListener('DOMContentLoaded', () => {
    
    // === 1. УПРАВЛЕНИЕ ДАННЫМИ И СОСТОЯНИЕМ ===
    const state = {
        playlist: tracksData, // Берем из data.js
        currentTrackIndex: 0,
        isPlaying: false,
        isLiteMode: false
    };

    // === 2. МОДУЛЬ СУБТИТРОВ (LYRICS) ===
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
            } catch (e) {
                console.warn('Lyrics not found');
            }
        }

        update(currentTime) {
            if (!this.currentData.length) return;
            
            // Опережение на 0.2 сек
            const offset = 0.2;
            const line = this.currentData.filter(l => l.time <= currentTime + offset).pop();

            if (line && this.container.textContent !== line.text) {
                this.container.textContent = line.text;
                if (line.text) {
                    this.container.classList.add('visible');
                    // Перезапуск анимации (удара)
                    this.container.classList.remove('lyrics-bounce');
                    void this.container.offsetWidth; 
                    this.container.classList.add('lyrics-bounce');
                } else {
                    this.container.classList.remove('visible');
                }
            }
        }
    }

    // === 3. МОДУЛЬ ВИЗУАЛИЗАЦИИ ===
    class Visualizer {
        constructor(audioEl) {
            this.audioEl = audioEl;
            this.context = null;
            this.analyser = null;
            this.dataArray = null;
            this.container = document.getElementById('visualizerBox');
            this.bars = [];
            this.leftGlow = document.getElementById('neon-glow-left');
            this.rightGlow = document.getElementById('neon-glow-right');
            
            this.createBars(20); // Создаем 20 полосок
        }

        init() {
            if (this.context) return;
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.context = new AudioContext();
            this.analyser = this.context.createAnalyser();
            this.analyser.fftSize = 256;
            
            const source = this.context.createMediaElementSource(this.audioEl);
            source.connect(this.analyser);
            this.analyser.connect(this.context.destination);
            
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        }

        createBars(count) {
            this.container.innerHTML = '';
            this.bars = [];
            for(let i=0; i<count; i++) {
                const div = document.createElement('div');
                div.className = 'bar';
                this.container.appendChild(div);
                this.bars.push(div);
            }
        }

        render(isLiteMode) {
            if (!this.context) return;
            
            this.analyser.getByteFrequencyData(this.dataArray);
            
            // 1. Рисуем полоски
            const step = Math.floor(this.dataArray.length / this.bars.length);
            let bassSum = 0;

            this.bars.forEach((bar, i) => {
                const value = this.dataArray[i * step];
                const height = Math.max(4, (value / 255) * 100); // % высоты
                bar.style.height = `${height}%`;
                
                if (i < 4) bassSum += value; // Собираем басы
            });

            // 2. Неоновое свечение по бокам (если не Lite Mode)
            if (!isLiteMode) {
                const avgBass = bassSum / 4;
                const glowHeight = Math.min(100, (avgBass / 255) * 150); // Усиливаем эффект
                this.leftGlow.style.height = `${glowHeight}%`;
                this.rightGlow.style.height = `${glowHeight}%`;
                this.leftGlow.style.opacity = avgBass > 100 ? 1 : 0.5;
                this.rightGlow.style.opacity = avgBass > 100 ? 1 : 0.5;
            }
        }
    }

    // === 4. ОСНОВНОЙ КЛАСС ПРИЛОЖЕНИЯ ===
    class App {
        constructor() {
            this.audio = document.getElementById('audioEl');
            this.lyrics = new LyricsManager();
            this.viz = new Visualizer(this.audio);
            
            // UI Элементы
            this.ui = {
                playBtn: document.getElementById('btnPlay'),
                prevBtn: document.getElementById('btnPrev'),
                nextBtn: document.getElementById('btnNext'),
                playlistBtn: document.getElementById('btnPlaylist'),
                panel: document.getElementById('playlistPanel'),
                card: document.getElementById('playerCard'),
                art: document.getElementById('albumArt'),
                bg: document.getElementById('bg-layer'),
                trackName: document.getElementById('trackName'),
                trackArtist: document.getElementById('trackArtist'),
                progressFill: document.getElementById('progressFill'),
                progressBar: document.getElementById('progressBar'),
                currTime: document.getElementById('currentTime'),
                durTime: document.getElementById('totalDuration'),
                playlistBox: document.getElementById('playlistContainer'),
                search: document.getElementById('searchParams'),
                liteBtn: document.getElementById('btnLiteMode')
            };

            this.setupEvents();
            this.renderPlaylist(state.playlist);
            this.loadTrack(state.currentTrackIndex);
            this.animationLoop();
        }

        setupEvents() {
            // Управление воспроизведением
            this.ui.playBtn.addEventListener('click', () => this.togglePlay());
            this.ui.prevBtn.addEventListener('click', () => this.changeTrack(-1));
            this.ui.nextBtn.addEventListener('click', () => this.changeTrack(1));
            
            // Плейлист панель
            this.ui.playlistBtn.addEventListener('click', () => {
                this.ui.panel.classList.toggle('active');
                this.ui.card.classList.toggle('shifted');
            });

            // Клик по прогресс бару
            this.ui.progressBar.addEventListener('click', (e) => {
                const width = this.ui.progressBar.clientWidth;
                const clickX = e.offsetX;
                const duration = this.audio.duration;
                this.audio.currentTime = (clickX / width) * duration;
            });

            // Громкость
            document.getElementById('volumeSlider').addEventListener('input', (e) => {
                this.audio.volume = e.target.value;
            });

            // Поиск
            this.ui.search.addEventListener('input', (e) => {
                const val = e.target.value.toLowerCase();
                const filtered = state.playlist.filter(t => 
                    t.name.toLowerCase().includes(val) || t.artist.toLowerCase().includes(val)
                );
                this.renderPlaylist(filtered);
            });

            // Аудио события
            this.audio.addEventListener('timeupdate', () => this.updateTime());
            this.audio.addEventListener('ended', () => this.changeTrack(1));
            this.audio.addEventListener('loadedmetadata', () => {
                this.ui.durTime.textContent = this.formatTime(this.audio.duration);
            });

            // Lite Mode
            this.ui.liteBtn.addEventListener('click', () => {
                state.isLiteMode = !state.isLiteMode;
                document.body.classList.toggle('lite-mode', state.isLiteMode);
            });
        }

        loadTrack(index) {
            if (index < 0) index = state.playlist.length - 1;
            if (index >= state.playlist.length) index = 0;
            
            state.currentTrackIndex = index;
            const track = state.playlist[index];

            this.audio.src = track.path;
            this.ui.trackName.textContent = track.name;
            this.ui.trackArtist.textContent = track.artist;
            this.ui.art.style.backgroundImage = `url('${track.cover}')`;
            this.ui.bg.style.backgroundImage = `url('${track.cover}')`;

            // Применение цветов
            document.documentElement.style.setProperty('--accent', track.colors.accent);
            
            // Загрузка субтитров
            this.lyrics.load(track.lyricsSource);

            // Обновление активного трека в списке
            this.highlightTrack(index);

            if (state.isPlaying) this.audio.play();
        }

        togglePlay() {
            if (!this.viz.context) this.viz.init(); // Запуск AudioContext по первому клику

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

        changeTrack(direction) {
            this.loadTrack(state.currentTrackIndex + direction);
            if (!state.isPlaying) this.togglePlay();
        }

        updateTime() {
            const { currentTime, duration } = this.audio;
            const percent = (currentTime / duration) * 100;
            this.ui.progressFill.style.width = `${percent}%`;
            this.ui.currTime.textContent = this.formatTime(currentTime);
        }

        formatTime(s) {
            if(isNaN(s)) return '0:00';
            const min = Math.floor(s / 60);
            const sec = Math.floor(s % 60);
            return `${min}:${sec < 10 ? '0'+sec : sec}`;
        }

        renderPlaylist(list) {
            this.ui.playlistBox.innerHTML = '';
            list.forEach((track, i) => {
                // Важно: ищем реальный индекс в общем массиве
                const realIndex = state.playlist.indexOf(track);
                
                const item = document.createElement('div');
                item.className = `track-item ${realIndex === state.currentTrackIndex ? 'active' : ''}`;
                item.innerHTML = `
                    <img src="${track.cover}" alt="cover">
                    <div class="t-info">
                        <span class="t-title">${track.name}</span>
                        <span class="t-artist">${track.artist}</span>
                    </div>
                `;
                item.onclick = () => {
                    this.loadTrack(realIndex);
                    if (!state.isPlaying) this.togglePlay();
                };
                this.ui.playlistBox.appendChild(item);
            });
        }

        highlightTrack(index) {
            const items = document.querySelectorAll('.track-item');
            items.forEach(el => el.classList.remove('active'));
            // При поиске индексы могут сбиться, поэтому простой вариант подсветки:
            // В идеале нужно перерисовывать плейлист, но для простоты оставим так.
            this.renderPlaylist(state.playlist); 
        }

        // ЕДИНЫЙ ЦИКЛ АНИМАЦИИ
        animationLoop() {
            requestAnimationFrame(() => this.animationLoop());
            
            if (state.isPlaying) {
                this.viz.render(state.isLiteMode);
                this.lyrics.update(this.audio.currentTime);
            }
        }
    }

    // Запуск
    const app = new App();
});
