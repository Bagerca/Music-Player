import { state, saveUserPlaylists } from './state.js';
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

// --- СИСТЕМА УВЕДОМЛЕНИЙ ---
export function showNotification(text, icon = 'info') {
    const el = document.createElement('div');
    el.className = 'toast';
    let svg = '';
    if (icon === 'success') svg = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
    else if (icon === 'info') svg = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>';
    else if (icon === 'error') svg = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/></svg>';
    el.innerHTML = `${svg} <span>${text}</span>`;
    DOM.notificationContainer.appendChild(el);
    requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; });
    setTimeout(() => { el.classList.add('hide'); setTimeout(() => el.remove(), 300); }, 3000);
}

// --- РЕНДЕР СПИСКА ТРЕКОВ ---
export function renderTrackList(tracks = state.viewedTracks) {
    DOM.trackList.innerHTML = '';
    
    // Условия Drag & Drop
    const isSystemPlaylist = ["Все треки", "Энергичные", "Chill & Retro", "Мои загрузки"].includes(state.currentPlaylistName);
    const isDefaultSort = state.sort.type === 'default';
    const enableDrag = !isSystemPlaylist && isDefaultSort;

    if (enableDrag) DOM.trackList.classList.add('sortable');
    else DOM.trackList.classList.remove('sortable');

    if (!tracks.length) {
        DOM.trackList.innerHTML = '<div class="track-item-title" style="text-align:center; padding:20px; opacity: 0.5;">Здесь пока пусто...</div>';
        return;
    }
    const currentPlayingTrack = state.playbackList[state.playbackIndex];
    
    tracks.forEach((track, index) => {
        const isPlayingThis = currentPlayingTrack && track.path === currentPlayingTrack.path;
        const el = document.createElement('div');
        el.className = `track-item ${isPlayingThis ? 'active' : ''}`;
        
        // Для логики перетаскивания нам нужен ID или индекс в dataset
        el.dataset.index = index;

        if (enableDrag) {
            el.setAttribute('draggable', 'true');
        }

        el.innerHTML = `
            ${enableDrag ? `
            <div class="drag-handle" title="Перетащить">
                <svg viewBox="0 0 24 24"><path fill="currentColor" d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
            </div>` : ''}
            <div class="track-item-cover" style="background-image: url('${escapeHtml(track.cover || 'picture/default_cover.jpg')}')"></div>
            <div class="track-item-info">
                <div class="track-item-title">${escapeHtml(track.name)}</div>
                <div class="track-item-artist">${escapeHtml(track.artist)}</div>
            </div>
            ${isPlayingThis ? '<div class="now-playing-icon">▶</div>' : ''}
            <button class="track-menu-btn" title="Опции"><svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg></button>
        `;
        
        el.onclick = (e) => {
             if (!e.target.closest('.track-menu-btn') && !e.target.closest('.drag-handle')) {
                 state.playbackList = [...state.viewedTracks]; 
                 state.playbackIndex = index;
                 loadTrack(index, true);
                 renderTrackList(state.viewedTracks);
             }
        };

        el.querySelector('.track-menu-btn').onclick = (e) => {
             e.stopPropagation();
             const event = new CustomEvent('open-track-context', { 
                 detail: { originalEvent: e, index: index } 
             });
             document.dispatchEvent(event);
        };

        if (enableDrag) addDragListeners(el);
        DOM.trackList.appendChild(el);
    });
}

// --- ПРОФЕССИОНАЛЬНАЯ ЛОГИКА DRAG & DROP ---

// Элемент-заполнитель (призрак)
const placeholder = document.createElement('div');
placeholder.className = 'track-placeholder';

function addDragListeners(el) {
    el.addEventListener('dragstart', (e) => {
        // Указываем браузеру, что мы переносим
        e.dataTransfer.effectAllowed = 'move';
        
        // Добавляем класс элементу (он станет прозрачным и absolute)
        // Делаем это с небольшой задержкой, чтобы браузер успел создать "картинку" перетаскивания
        setTimeout(() => {
            el.classList.add('dragging');
            // Вставляем плейсхолдер сразу на место элемента, который начали тащить
            el.parentNode.insertBefore(placeholder, el.nextSibling); 
        }, 0);
    });

    el.addEventListener('dragend', () => {
        el.classList.remove('dragging');
        // Удаляем плейсхолдер из DOM
        if (placeholder.parentNode) {
            placeholder.parentNode.removeChild(placeholder);
        }
    });
}

// Слушатель на самом контейнере списка (один общий для всех)
DOM.trackList.addEventListener('dragover', (e) => {
    e.preventDefault(); // Разрешаем drop
    
    // Если список не в режиме sortable, выходим
    if (!DOM.trackList.classList.contains('sortable')) return;

    // Находим ближайший элемент ПОСЛЕ курсора мыши
    const afterElement = getDragAfterElement(DOM.trackList, e.clientY);
    
    // Элемент, который мы тащим
    const draggingEl = document.querySelector('.dragging');
    if (!draggingEl) return;

    // Магия перемещения плейсхолдера:
    // Если afterElement нет (мы в конце списка), вставляем плейсхолдер в конец.
    // Если есть, вставляем ПЕРЕД ним.
    if (afterElement == null) {
        DOM.trackList.appendChild(placeholder);
    } else {
        DOM.trackList.insertBefore(placeholder, afterElement);
    }
});

DOM.trackList.addEventListener('drop', (e) => {
    e.preventDefault();
    if (!DOM.trackList.classList.contains('sortable')) return;

    const draggingEl = document.querySelector('.dragging');
    if (!draggingEl) return;

    // --- ФИНАЛИЗАЦИЯ ПЕРЕМЕЩЕНИЯ ---
    
    // 1. Получаем индекс элемента, который тащили (из его dataset)
    const oldIndex = parseInt(draggingEl.dataset.index);
    
    // 2. Определяем новый индекс.
    // Для этого смотрим, где сейчас находится placeholder среди своих соседей (.track-item)
    // Важно: placeholder - это div, но не .track-item.
    // Собираем всех детей контейнера в массив
    const allChildren = [...DOM.trackList.children];
    // Индекс плейсхолдера в DOM
    const placeholderIndex = allChildren.indexOf(placeholder);
    
    // Так как original draggingEl имеет position:absolute/hidden, он может не влиять на индекс визуально, 
    // но он всё ещё в DOM. Нам нужно посчитать "чистый" индекс.
    // Проще всего: считаем количество .track-item ПЕРЕД placeholder-ом.
    let newIndex = 0;
    for (let i = 0; i < placeholderIndex; i++) {
        if (allChildren[i].classList.contains('track-item') && !allChildren[i].classList.contains('dragging')) {
            newIndex++;
        }
    }

    // Если мы тащим элемент вниз, индекс может сместиться, но логика "сколько перед ним" работает надежно,
    // так как сам dragging элемент исключен из подсчета выше.
    
    if (oldIndex !== newIndex) {
        reorderTracks(oldIndex, newIndex);
    }
});

// Математика: находим элемент, центр которого находится сразу за курсором мыши
function getDragAfterElement(container, y) {
    // Берем все элементы, которые НЕ тащим (и не плейсхолдер)
    const draggableElements = [...container.querySelectorAll('.track-item:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        // offset - расстояние от курсора до центра элемента
        const offset = y - box.top - box.height / 2;
        
        // Нам нужны только те, где offset < 0 (курсор ВЫШЕ центра элемента)
        // И из них ищем тот, у которого offset ближе всего к 0 (самый близкий снизу)
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}


function reorderTracks(fromIndex, toIndex) {
    const playlistName = state.currentPlaylistName;
    const playlist = state.userPlaylists[playlistName];
    if (!playlist) return;

    // Переставляем элементы в массиве
    const [movedTrack] = playlist.splice(fromIndex, 1);
    playlist.splice(toIndex, 0, movedTrack);

    // Сохраняем
    saveUserPlaylists();
    state.viewedTracks = playlist;

    // Синхронизация плеера
    if (state.playbackList.length === playlist.length && state.playbackList.every((t, i) => t.path === state.viewedTracks[i].path)) {
       state.playbackList = [...playlist];
    }
    // Если играл перемещенный трек, обновляем его индекс в памяти плеера
    if (state.isPlaying || state.playbackIndex >= 0) {
        const currentlyPlayingPath = state.playbackList[state.playbackIndex]?.path;
        if(currentlyPlayingPath) {
             // Ищем новый индекс играющего трека (он мог сдвинуться)
             const newIndex = playlist.findIndex(t => t.path === currentlyPlayingPath);
             if (newIndex !== -1) state.playbackIndex = newIndex;
        }
    }

    renderTrackList(state.viewedTracks);
}

// --- МЕНЮ И ПЛЕЙЛИСТЫ ---
export function switchPlaylist(name) {
    const playlistSelect = document.getElementById('playlistSelect');
    state.currentPlaylistName = name;
    // При переключении плейлиста сбрасываем сортировку на дефолт
    state.sort.type = 'default';
    state.sort.direction = 'asc';
    
    state.viewedTracks = getAllPlaylists(state.userPlaylists, state.uploadedTracks)[name];
    renderPlaylistSelector();
    renderTrackList(state.viewedTracks);
    playlistSelect.classList.remove('open');
    
    // Обновляем визуал сортировки
    document.querySelectorAll('.sort-item').forEach(i => i.classList.remove('active', 'desc'));
    document.querySelector('.sort-item[data-type="default"]').classList.add('active');
}

export function renderPlaylistSelector() {
    const optionsContainer = document.getElementById('playlistOptions');
    const currentText = document.getElementById('currentPlaylistText');
    const deleteBtn = document.getElementById('deletePlaylistBtn');
    optionsContainer.innerHTML = '';
    const playlists = getAllPlaylists(state.userPlaylists, state.uploadedTracks);
    currentText.textContent = state.currentPlaylistName;
    const isSystemPlaylist = ["Все треки", "Энергичные", "Chill & Retro", "Мои загрузки"].includes(state.currentPlaylistName);
    deleteBtn.style.display = isSystemPlaylist ? 'none' : 'flex';
    Object.keys(playlists).forEach(name => {
        const option = document.createElement('div');
        option.className = `custom-option ${name === state.currentPlaylistName ? 'selected' : ''}`;
        option.textContent = name;
        option.onclick = () => switchPlaylist(name);
        optionsContainer.appendChild(option);
    });
}

export function togglePlaylistSelect() { document.getElementById('playlistSelect').classList.toggle('open'); }
document.addEventListener('click', (e) => {
    const select = document.getElementById('playlistSelect');
    const trigger = document.getElementById('playlistTrigger');
    if (select.classList.contains('open') && !select.contains(e.target) && !trigger.contains(e.target)) {
        select.classList.remove('open');
    }
});

// --- ОБНОВЛЕНИЕ ПЛЕЕРА И ТЕМЫ ---
export function updateTrackInfo(track) {
    DOM.currentTrack.textContent = track.name;
    DOM.currentArtist.textContent = track.artist;
    DOM.albumImage.style.backgroundImage = `url('${track.cover}')`;
    document.title = `${track.name} - ${track.artist}`;
    renderTrackList(state.viewedTracks);
}

export function updatePlayPauseIcon(isPlaying) {
    const path = isPlaying ? '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>' : '<path d="M8 5v14l11-7z"/>';
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
    updateFavicon(colors.accent);
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
            .then(data => { if (track === state.playbackList[state.playbackIndex]) { currentLyricsData = data; track.lyrics = data; } })
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
        } else { DOM.lyricsDisplay.classList.remove('visible'); }
        nextLyricIndex++;
    }
}

// --- ИКОНКА РЕЖИМА ВОСПРОИЗВЕДЕНИЯ ---
export function updatePlaybackModeIcon(mode) {
    const btn = document.getElementById('playbackModeBtn');
    let svg = '';
    let title = '';
    if (mode === 0) {
        title = 'Повтор плейлиста';
        svg = '<path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>';
    } else if (mode === 1) {
        title = 'Повтор одного трека';
        svg = '<path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/><text x="10" y="16" font-size="10" fill="currentColor" font-weight="bold">1</text>';
    } else if (mode === 2) {
        title = 'Случайный порядок';
        svg = '<path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>';
    }
    btn.innerHTML = `<svg viewBox="0 0 24 24">${svg}</svg>`;
    btn.title = title;
    if (mode !== 0) { btn.style.color = 'var(--accent-color)'; btn.style.opacity = '1'; } 
    else { btn.style.color = 'white'; btn.style.opacity = ''; }
}

export function updateFavicon(accentColor) {
    const oldLink = document.getElementById('dynamic-favicon');
    const newLink = document.createElement('link');
    newLink.id = 'dynamic-favicon';
    newLink.rel = 'icon';
    newLink.type = 'image/svg+xml';
    const svgString = `
    <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" rx="20" fill="#1a1a2e"/>
      <path d="M46 14H22V43C20.5 42.3 18.8 42 17 42C12.6 42 9 45.6 9 50C9 54.4 12.6 58 17 58C21.4 58 25 54.4 25 50V23H43V43C41.5 42.3 39.8 42 38 42C33.6 42 30 45.6 30 50C30 54.4 33.6 58 38 58C42.4 58 46 54.4 46 50V14Z" fill="${accentColor}"/>
    </svg>`.trim();
    newLink.href = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
    if (oldLink) document.head.removeChild(oldLink);
    document.head.appendChild(newLink);
}
