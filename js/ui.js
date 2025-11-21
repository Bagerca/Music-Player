import { state } from './state.js';
import { audio, loadTrack } from './audio.js';
import { escapeHtml, formatTime, adjustColorOpacity } from './utils.js';
import { createParticles } from './visualizer.js';

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
let nextLyricIndex = 0; // Оптимизация поиска

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
        
        // Безопасная вставка HTML
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
        ? '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>' // Pause
        : '<path d="M8 5v14l11-7z"/>'; // Play
    DOM.playPauseBtn.querySelector('svg').innerHTML = path;
}

export function updateTrackInfo(track) {
    DOM.currentTrack.textContent = track.name;
    DOM.currentArtist.textContent = track.artist;
    DOM.albumImage.style.backgroundImage = `url('${track.cover}')`;
    document.title = `${track.name} - ${track.artist}`;
    renderTrackList(); // Обновить активный класс в списке
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
    
    // Обновление частиц
    createParticles();
}

// --- Субтитры ---

export function loadLyrics(track) {
    DOM.lyricsDisplay.textContent = '';
    DOM.lyricsDisplay.classList.remove('visible');
    currentLyricsData = [];
    nextLyricIndex = 0;

    if (track.lyrics) {
        currentLyricsData = track.lyrics;
    } else if (track.lyricsSource) {
        fetch(track.lyricsSource)
            .then(res => res.json())
            .then(data => {
                // Если трек не переключили пока грузилось
                if (track === state.currentTracks[state.currentTrackIndex]) {
                    currentLyricsData = data;
                    track.lyrics = data; // Кешируем
                }
            })
            .catch(() => console.log('Lyrics not found'));
    }
}

export function checkLyrics(time) {
    if (!currentLyricsData.length) return;

    // Оптимизация: проверяем только следующую строку, а не весь массив
    // Смещаем время на 0.2 сек вперед для компенсации реакции глаза
    const lookAheadTime = time + 0.2;

    // Если пользователь перемотал назад
    if (nextLyricIndex > 0 && currentLyricsData[nextLyricIndex - 1].time > lookAheadTime) {
        nextLyricIndex = 0;
        DOM.lyricsDisplay.textContent = '';
    }

    // Ищем актуальную строку
    while (currentLyricsData[nextLyricIndex] && currentLyricsData[nextLyricIndex].time <= lookAheadTime) {
        const line = currentLyricsData[nextLyricIndex];
        if (line.text) {
            DOM.lyricsDisplay.textContent = line.text;
            DOM.lyricsDisplay.classList.add('visible');
            DOM.lyricsDisplay.classList.remove('lyrics-bounce');
            void DOM.lyricsDisplay.offsetWidth; // Trigger reflow
            DOM.lyricsDisplay.classList.add('lyrics-bounce');
        } else {
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
