import { state } from './state.js';
import { audio, loadTrack } from './audio.js';
import { escapeHtml, formatTime, adjustColorOpacity } from './utils.js';

const DOM = {
    trackList: document.getElementById('trackList'),
    lyricsDisplay: document.getElementById('lyricsDisplay'),
    playPauseBtn: document.getElementById('playPauseBtn'),
    progressBar: document.getElementById('progressBar'),
    progress: document.getElementById('progress'),
    currentTime: document.getElementById('currentTime'),
    duration: document.getElementById('duration'),
    currentTrack: document.getElementById('currentTrack'),
    currentArtist: document.getElementById('currentArtist'),
    albumImage: document.getElementById('albumImage'),
    albumArt: document.getElementById('albumArt'),
};

let currentLyricsData = [];
let nextLyricIndex = 0;
let trackBaseStyle = 'default'; // Базовый стиль трека

export function renderTrackList(tracks = state.currentTracks) {
    DOM.trackList.innerHTML = '';
    if (!tracks.length) {
        DOM.trackList.innerHTML = '<div class="track-item-title" style="text-align:center; padding:20px;">Плейлист пуст</div>';
        return;
    }

    tracks.forEach((track, index) => {
        const originalIndex = state.currentTracks.findIndex(t => t === track);
        const isActive = originalIndex === state.currentTrackIndex;
        
        const el = document.createElement('div');
        el.className = `track-item ${isActive ? 'active' : ''}`;
        el.onclick = (e) => {
             if (!e.target.closest('.track-menu-btn')) loadTrack(originalIndex, true);
        };
        
        el.innerHTML = `
            <div class="track-item-cover" style="background-image: url('${escapeHtml(track.cover || 'picture/default_cover.jpg')}')"></div>
            <div class="track-item-info">
                <div class="track-item-title">${escapeHtml(track.name)}</div>
                <div class="track-item-artist">${escapeHtml(track.artist)}</div>
            </div>
            ${isActive ? '<div class="now-playing-icon">▶</div>' : ''}
        `;
        
        DOM.trackList.appendChild(el);
    });
}

export function updatePlayPauseIcon(isPlaying) {
    const path = isPlaying 
        ? '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>' 
        : '<path d="M8 5v14l11-7z"/>';
    DOM.playPauseBtn.querySelector('svg').innerHTML = path;
}

export function updateTrackInfo(track) {
    DOM.currentTrack.textContent = track.name;
    DOM.currentArtist.textContent = track.artist;
    DOM.albumImage.style.backgroundImage = `url('${track.cover}')`;
    document.title = `${track.name} - ${track.artist}`;
    renderTrackList(); 
}

export function updateTheme(track) {
    const colors = track.colors;
    document.body.style.setProperty('--bg-image', `url('${track.cover}')`);
    document.body.style.setProperty('--panel-bg-color', adjustColorOpacity(colors.primary, 0.85));
    document.body.style.setProperty('--panel-border-color', colors.accent);
    document.documentElement.style.setProperty('--accent-color', colors.accent);
    document.documentElement.style.setProperty('--neon-color', track.neonColor);
    
    DOM.playPauseBtn.style.background = `linear-gradient(135deg, ${colors.accent}, ${colors.primary})`;
    DOM.progress.style.background = `linear-gradient(90deg, ${colors.accent}, ${colors.primary})`;
    
    // createParticles удалено по запросу
}

// --- СУБТИТРЫ (ОБНОВЛЕННАЯ ЛОГИКА СТИЛЕЙ) ---

export function loadLyrics(track) {
    DOM.lyricsDisplay.textContent = '';
    DOM.lyricsDisplay.className = 'lyrics-container'; // Сброс классов анимации
    
    currentLyricsData = [];
    nextLyricIndex = 0;
    
    // Запоминаем стиль всего трека (если есть), иначе default
    trackBaseStyle = track.lyricsStyle || 'default';

    if (track.lyrics) {
        currentLyricsData = track.lyrics;
    } else if (track.lyricsSource) {
        fetch(track.lyricsSource)
            .then(res => res.json())
            .then(data => {
                if (track === state.currentTracks[state.currentTrackIndex]) {
                    currentLyricsData = data;
                    track.lyrics = data; 
                }
            })
            .catch(() => console.log('Lyrics not found'));
    }
}

export function checkLyrics(time) {
    if (!currentLyricsData.length) return;

    // Смотрим чуть вперед (0.2с) для синхронности
    const lookAheadTime = time + 0.2;

    // Если перемотали назад
    if (nextLyricIndex > 0 && currentLyricsData[nextLyricIndex - 1].time > lookAheadTime) {
        nextLyricIndex = 0;
        DOM.lyricsDisplay.textContent = '';
        DOM.lyricsDisplay.classList.remove('visible');
    }

    // Ищем строки
    while (currentLyricsData[nextLyricIndex] && currentLyricsData[nextLyricIndex].time <= lookAheadTime) {
        const line = currentLyricsData[nextLyricIndex];
        
        if (line.text) {
            DOM.lyricsDisplay.textContent = line.text;
            
            // 1. Определяем стиль: Специфичный для строки -> Или базовый для трека -> Или default
            const currentStyle = line.style || trackBaseStyle || 'default';
            
            // 2. Полный сброс анимации для перезапуска
            DOM.lyricsDisplay.className = 'lyrics-container';
            void DOM.lyricsDisplay.offsetWidth; // Trigger reflow (перезапуск CSS анимации)
            
            // 3. Добавляем нужные классы
            DOM.lyricsDisplay.classList.add('visible');
            DOM.lyricsDisplay.classList.add(`lyrics-anim-${currentStyle}`); // напр. lyrics-anim-rage
            
        } else {
            // Если текст пустой - скрываем
            DOM.lyricsDisplay.classList.remove('visible');
        }
        nextLyricIndex++;
    }
}

// --- Прогресс бар ---
export function updateProgress() {
    const percent = (audio.currentTime / audio.duration) * 100 || 0;
    DOM.progress.style.width = `${percent}%`;
    DOM.currentTime.textContent = formatTime(audio.currentTime);
    DOM.duration.textContent = formatTime(audio.duration);
}
