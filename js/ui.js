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
    albumArt: document.getElementById('albumArt'),
};

let currentLyricsData = [];
let nextLyricIndex = 0;
let trackBaseStyle = 'default'; 

export function renderTrackList(tracks = state.currentTracks) {
    DOM.trackList.innerHTML = '';
    if (!tracks.length) {
        DOM.trackList.innerHTML = '<div class="track-item-title" style="text-align:center; padding:20px; opacity: 0.5;">Здесь пока пусто...</div>';
        return;
    }

    tracks.forEach((track, index) => {
        const originalIndex = state.currentTracks.findIndex(t => t === track);
        const isActive = originalIndex === state.currentTrackIndex;
        
        const el = document.createElement('div');
        el.className = `track-item ${isActive ? 'active' : ''}`;
        el.onclick = (e) => {
             loadTrack(originalIndex, true);
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

// --- УПРАВЛЕНИЕ ПЛЕЙЛИСТАМИ ---

export function renderPlaylistSelector() {
    const optionsContainer = document.getElementById('playlistOptions');
    const currentText = document.getElementById('currentPlaylistText');
    const deleteBtn = document.getElementById('deletePlaylistBtn');
    
    optionsContainer.innerHTML = '';
    
    const playlists = getAllPlaylists(state.userPlaylists, state.uploadedTracks);
    const playlistNames = Object.keys(playlists);

    currentText.textContent = state.currentPlaylistName;

    // Кнопка удаления видна только для своих плейлистов
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

export function switchPlaylist(name) {
    const playlistSelect = document.getElementById('playlistSelect');
    state.currentPlaylistName = name;
    state.currentTracks = getAllPlaylists(state.userPlaylists, state.uploadedTracks)[name];
    state.currentTrackIndex = 0; 
    
    renderPlaylistSelector();
    renderTrackList(state.currentTracks);
    
    if (state.currentTracks.length > 0) {
        loadTrack(0, false);
    } else {
        // Сброс инфо если плейлист пуст
        DOM.currentTrack.textContent = "Плейлист пуст";
        DOM.currentArtist.textContent = "";
    }

    playlistSelect.classList.remove('open');
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
}

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

export function updateProgress() {
    const percent = (audio.currentTime / audio.duration) * 100 || 0;
    DOM.progress.style.width = `${percent}%`;
    DOM.currentTime.textContent = formatTime(audio.currentTime);
    DOM.duration.textContent = formatTime(audio.duration);
}
