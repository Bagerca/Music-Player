import { state } from './state.js';
import { audio, loadTrack } from './audio.js';
import { getAllPlaylists } from './data.js';
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
    notificationContainer: document.getElementById('notificationContainer')
};

let currentLyricsData = [];
let nextLyricIndex = 0;
let trackBaseStyle = 'default'; 

// --- СИСТЕМА УВЕДОМЛЕНИЙ (TOASTS) ---
export function showNotification(text, icon = 'info') {
    const el = document.createElement('div');
    el.className = 'toast';
    
    let svg = '';
    if (icon === 'success') svg = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
    else if (icon === 'info') svg = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>';
    else if (icon === 'error') svg = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/></svg>';

    el.innerHTML = `${svg} <span>${text}</span>`;
    DOM.notificationContainer.appendChild(el);

    // Анимация появления
    requestAnimationFrame(() => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
    });

    // Автоудаление
    setTimeout(() => {
        el.classList.add('hide');
        setTimeout(() => el.remove(), 300);
    }, 3000);
}

// --- РЕНДЕР СПИСКА ТРЕКОВ ---
export function renderTrackList(tracks = state.viewedTracks) {
    DOM.trackList.innerHTML = '';
    if (!tracks.length) {
        DOM.trackList.innerHTML = '<div class="track-item-title" style="text-align:center; padding:20px; opacity: 0.5;">Здесь пока пусто...</div>';
        return;
    }

    // Определяем, какой трек сейчас играет
    const currentPlayingTrack = state.playbackList[state.playbackIndex];

    tracks.forEach((track, index) => {
        // Подсвечиваем трек, только если пути совпадают
        const isPlayingThis = currentPlayingTrack && track.path === currentPlayingTrack.path;
        
        const el = document.createElement('div');
        el.className = `track-item ${isPlayingThis ? 'active' : ''}`;
        
        // Клик по телу трека
        el.onclick = (e) => {
             if (!e.target.closest('.track-menu-btn')) {
                 // ВАЖНО: Обновляем очередь воспроизведения на то, что сейчас видим
                 state.playbackList = [...state.viewedTracks]; 
                 state.playbackIndex = index;
                 loadTrack(index, true);
                 // Перерисовываем список, чтобы обновить активный класс
                 renderTrackList(state.viewedTracks);
             }
        };
        
        el.innerHTML = `
            <div class="track-item-cover" style="background-image: url('${escapeHtml(track.cover || 'picture/default_cover.jpg')}')"></div>
            <div class="track-item-info">
                <div class="track-item-title">${escapeHtml(track.name)}</div>
                <div class="track-item-artist">${escapeHtml(track.artist)}</div>
            </div>
            ${isPlayingThis ? '<div class="now-playing-icon">▶</div>' : ''}
            <button class="track-menu-btn" title="Опции">
                <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
            </button>
        `;

        // Клик по кнопке меню
        const menuBtn = el.querySelector('.track-menu-btn');
        menuBtn.onclick = (e) => {
            e.stopPropagation(); 
            openContextMenu(e, index);
        };
        
        DOM.trackList.appendChild(el);
    });
}

// --- КОНТЕКСТНОЕ МЕНЮ ---
function openContextMenu(e, index) {
    state.contextTrackIndex = index; // Индекс в viewedTracks
    const menu = document.getElementById('contextMenu');
    const removeBtn = document.getElementById('ctxRemoveFromPlaylist');

    const rect = e.target.getBoundingClientRect();
    let top = rect.bottom + window.scrollY;
    let left = rect.left + window.scrollX - 190; // Сдвиг влево
    
    if (left < 10) left = 10;
    // Если меню вылезает за низ экрана, поднимаем его
    if (window.innerHeight - rect.bottom < 150) top = rect.top - 140;

    menu.style.top = `${top}px`;
    menu.style.left = `${left}px`;
    menu.classList.add('active');

    const currentPlaylist = state.currentPlaylistName;
    const isSystem = ["Все треки", "Энергичные", "Chill & Retro", "Мои загрузки"].includes(currentPlaylist);
    removeBtn.style.display = isSystem ? 'none' : 'flex';
}

// --- ПЕРЕКЛЮЧЕНИЕ ПЛЕЙЛИСТА ---
export function switchPlaylist(name) {
    const playlistSelect = document.getElementById('playlistSelect');
    state.currentPlaylistName = name;
    
    // Меняем только ВИДИМЫЙ список. Музыка продолжает играть из playbackList.
    state.viewedTracks = getAllPlaylists(state.userPlaylists, state.uploadedTracks)[name];
    
    renderPlaylistSelector();
    renderTrackList(state.viewedTracks);
    
    playlistSelect.classList.remove('open');
}

export function renderPlaylistSelector() {
    const optionsContainer = document.getElementById('playlistOptions');
    const currentText = document.getElementById('currentPlaylistText');
    const deleteBtn = document.getElementById('deletePlaylistBtn');
    
    optionsContainer.innerHTML = '';
    const playlists = getAllPlaylists(state.userPlaylists, state.uploadedTracks);
    const playlistNames = Object.keys(playlists);

    currentText.textContent = state.currentPlaylistName;
    const isSystemPlaylist = ["Все треки", "Энергичные", "Chill & Retro", "Мои загрузки"].includes(state.currentPlaylistName);
    deleteBtn.style.display = isSystemPlaylist ? 'none' : 'flex';

    playlistNames.forEach(name => {
        const option = document.createElement('div');
        option.className = `custom-option ${name === state.currentPlaylistName ? 'selected' : ''}`;
        option.textContent = name;
        option.onclick = () => switchPlaylist(name);
        optionsContainer.appendChild(option);
    });
}

export function togglePlaylistSelect() {
    const select = document.getElementById('playlistSelect');
    select.classList.toggle('open');
}

// Закрытие селекта при клике вне
document.addEventListener('click', (e) => {
    const select = document.getElementById('playlistSelect');
    const trigger = document.getElementById('playlistTrigger');
    if (select.classList.contains('open') && !select.contains(e.target) && !trigger.contains(e.target)) {
        select.classList.remove('open');
    }
});

// --- ОБНОВЛЕНИЕ ИНФО В ПЛЕЕРЕ ---
export function updateTrackInfo(track) {
    DOM.currentTrack.textContent = track.name;
    DOM.currentArtist.textContent = track.artist;
    DOM.albumImage.style.backgroundImage = `url('${track.cover}')`;
    document.title = `${track.name} - ${track.artist}`;
    // Обновляем список, чтобы переключить активный класс (если трек виден)
    renderTrackList(state.viewedTracks);
}

export function updatePlayPauseIcon(isPlaying) {
    const path = isPlaying 
        ? '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>' 
        : '<path d="M8 5v14l11-7z"/>';
    DOM.playPauseBtn.querySelector('svg').innerHTML = path;
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
}

export function updateProgress() {
    const percent = (audio.currentTime / audio.duration) * 100 || 0;
    DOM.progress.style.width = `${percent}%`;
    DOM.currentTime.textContent = formatTime(audio.currentTime);
    DOM.duration.textContent = formatTime(audio.duration);
}

// --- СУБТИТРЫ ---
export function loadLyrics(track) {
    DOM.lyricsDisplay.textContent = '';
    DOM.lyricsDisplay.className = 'lyrics-container'; 
    currentLyricsData = [];
    nextLyricIndex = 0;
    trackBaseStyle = track.lyricsStyle || 'default';

    if (track.lyrics) {
        currentLyricsData = track.lyrics;
    } else if (track.lyricsSource) {
        fetch(track.lyricsSource)
            .then(res => res.json())
            .then(data => {
                // Проверяем, тот ли трек все еще играет
                if (track === state.playbackList[state.playbackIndex]) {
                    currentLyricsData = data;
                    track.lyrics = data; 
                }
            })
            .catch(() => console.log('Lyrics not found'));
    }
}

export function checkLyrics(time) {
    if (!currentLyricsData.length) return;
    const lookAheadTime = time + 0.2;
    
    if (nextLyricIndex > 0 && currentLyricsData[nextLyricIndex - 1].time > lookAheadTime) {
        nextLyricIndex = 0;
        DOM.lyricsDisplay.textContent = '';
        DOM.lyricsDisplay.classList.remove('visible');
    }
    
    while (currentLyricsData[nextLyricIndex] && currentLyricsData[nextLyricIndex].time <= lookAheadTime) {
        const line = currentLyricsData[nextLyricIndex];
        if (line.text) {
            DOM.lyricsDisplay.textContent = line.text;
            const currentStyle = line.style || trackBaseStyle || 'default';
            DOM.lyricsDisplay.className = 'lyrics-container';
            void DOM.lyricsDisplay.offsetWidth; 
            DOM.lyricsDisplay.classList.add('visible');
            DOM.lyricsDisplay.classList.add(`lyrics-anim-${currentStyle}`);
        } else {
            DOM.lyricsDisplay.classList.remove('visible');
        }
        nextLyricIndex++;
    }
}

// --- УПРАВЛЕНИЕ ФАВИКОНКОЙ (ДИНАМИЧЕСКАЯ) ---
export function updateFavicon(isPlaying) {
    const link = document.getElementById('dynamic-favicon');
    if (!link) return;

    // Цвета для иконки
    const colorBg = '#1a1a2e';
    const colorBar = '#00d1ff';

    // CSS для анимации (активен только если музыка играет)
    const animationCSS = isPlaying ? `
        .bar:nth-child(2) { animation: dance 0.8s ease-in-out infinite; }
        .bar:nth-child(3) { animation: dance 1.2s ease-in-out infinite; animation-delay: 0.1s; }
        .bar:nth-child(4) { animation: dance 0.6s ease-in-out infinite; animation-delay: 0.2s; }
        @keyframes dance {
            0%, 100% { height: 10px; y: 42px; opacity: 0.6; }
            50% { height: 34px; y: 18px; opacity: 1; }
        }
    ` : '';

    // SVG код
    const svg = `
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>
        .bar { fill: ${colorBar}; rx: 3; transition: all 0.3s; }
        ${animationCSS}
      </style>
      <rect width="64" height="64" rx="20" fill="${colorBg}"/>
      <rect class="bar" x="14" y="30" width="8" height="20" />
      <rect class="bar" x="28" y="20" width="8" height="30" />
      <rect class="bar" x="42" y="25" width="8" height="25" />
    </svg>
    `.trim();

    // Кодируем и заменяем
    link.href = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
