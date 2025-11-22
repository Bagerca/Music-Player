import { state, saveUserPlaylists, PLAYBACK_MODES } from './state.js';
import { getAllPlaylists } from './data.js';
import * as AudioCore from './audio.js';
import * as UI from './ui.js';
import * as Vis from './visualizer.js';

document.addEventListener('DOMContentLoaded', () => {
    // Инициализация
    const allPlaylists = getAllPlaylists(state.userPlaylists, state.uploadedTracks);
    
    // Изначально viewed и playback совпадают (Все треки)
    state.viewedTracks = allPlaylists["Все треки"];
    state.playbackList = [...state.viewedTracks];
    state.currentPlaylistName = "Все треки";

    Vis.initVisualizerDOM();
    
    // Загружаем первый трек в плеер (но не играем)
    if (state.playbackList.length) {
        AudioCore.loadTrack(0);
    }
    
    UI.renderPlaylistSelector();
    UI.renderTrackList(state.viewedTracks);
    
    // Инициализация статичной фавиконки
    UI.updateFavicon(false);
    
    setupEventListeners();
    
    // Скрываем прелоадер
    setTimeout(() => {
        const pre = document.getElementById('preloader');
        pre.classList.add('hide');
        setTimeout(() => pre.remove(), 500);
    }, 500);
});

function setupEventListeners() {
    // --- АУДИО КОНТРОЛЬ ---
    document.getElementById('playPauseBtn').onclick = AudioCore.togglePlay;
    
    // Кнопки Prev/Next меняют трек в playbackList
    document.getElementById('prevBtn').onclick = () => changePlaybackTrack(-1);
    document.getElementById('nextBtn').onclick = () => changePlaybackTrack(1);
    
    document.getElementById('progressBar').onclick = (e) => {
        const width = e.currentTarget.clientWidth;
        const duration = AudioCore.audio.duration;
        AudioCore.audio.currentTime = (e.offsetX / width) * duration;
    };

    AudioCore.audio.addEventListener('timeupdate', UI.updateProgress);
    AudioCore.audio.addEventListener('ended', () => {
        if (state.playbackMode === PLAYBACK_MODES.ONCE) return;
        changePlaybackTrack(1);
    });

    // --- ЗАГРУЗКА ТРЕКОВ (ЛОГИКА МОДАЛКИ) ---
    document.getElementById('uploadTrackBtn').onclick = () => document.getElementById('fileInput').click();
    
    document.getElementById('fileInput').onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        state.pendingUploadFile = file;
        
        // Заполняем форму дефолтными данными
        document.getElementById('uploadFileName').textContent = file.name;
        document.getElementById('upTitle').value = file.name.replace(/\.[^/.]+$/, ""); // Убрать расширение
        document.getElementById('upArtist').value = "Unknown Artist";
        document.getElementById('upCoverUrl').value = "";
        document.getElementById('upCoverFile').value = "";
        
        // Открываем модалку
        document.getElementById('uploadModal').classList.add('active');
        
        // Сброс инпута, чтобы можно было выбрать тот же файл снова
        e.target.value = '';
    };

    // Кнопка "Рандом цвета"
    document.getElementById('randomColorsBtn').onclick = () => {
        const hue = Math.floor(Math.random() * 360);
        document.getElementById('upColorBg').value = hslToHex(hue, 60, 10);
        document.getElementById('upColorAccent').value = hslToHex(hue, 80, 60);
    };

    // Кнопка "Сохранить" в модалке загрузки
    document.getElementById('saveUploadBtn').onclick = confirmUploadTrack;
    document.getElementById('cancelUploadBtn').onclick = () => document.getElementById('uploadModal').classList.remove('active');


    // --- КОНТЕКСТНОЕ МЕНЮ ---
    document.addEventListener('click', (e) => {
        const menu = document.getElementById('contextMenu');
        if (!menu.contains(e.target)) {
            menu.classList.remove('active');
        }
    });

    document.getElementById('ctxAddToPlaylist').onclick = () => {
        showAddToPlaylistModal();
        document.getElementById('contextMenu').classList.remove('active');
    };
    document.getElementById('ctxDownload').onclick = () => {
        downloadCurrentContextTrack();
        document.getElementById('contextMenu').classList.remove('active');
    };
    document.getElementById('ctxRemoveFromPlaylist').onclick = () => {
        removeTrackFromCurrentPlaylist();
        document.getElementById('contextMenu').classList.remove('active');
    };

    // --- МОДАЛКА ПОДТВЕРЖДЕНИЯ (УДАЛЕНИЕ) ---
    const confirmModal = document.getElementById('confirmationModal');
    document.getElementById('cancelConfirmBtn').onclick = () => {
        confirmModal.classList.remove('active');
        state.pendingAction = null;
    };
    document.getElementById('actionConfirmBtn').onclick = () => {
        if (state.pendingAction) {
            state.pendingAction();
            state.pendingAction = null;
        }
        confirmModal.classList.remove('active');
    };


    // --- ОСТАЛЬНОЕ ---
    const volSlider = document.getElementById('volumeSlider');
    const updateVolume = (val) => {
        volSlider.style.backgroundSize = `${val}% 100%`;
        AudioCore.audio.volume = val / 100;
    };
    volSlider.oninput = (e) => updateVolume(e.target.value);
    document.getElementById('muteBtn').onclick = () => {
        if (AudioCore.audio.volume > 0) {
            volSlider.dataset.prev = volSlider.value;
            volSlider.value = 0;
        } else {
            volSlider.value = volSlider.dataset.prev || 70;
        }
        updateVolume(volSlider.value);
    };
    
    document.getElementById('trackListBtn').onclick = () => document.getElementById('trackListPanel').classList.toggle('active');
    document.getElementById('playlistTrigger').onclick = UI.togglePlaylistSelect;
    
    const modalOverlay = document.getElementById('modalOverlay');
    document.getElementById('createPlaylistBtn').onclick = () => {
        modalOverlay.classList.add('active');
        document.getElementById('newPlaylistName').focus();
    };
    document.getElementById('closeModalBtn').onclick = () => modalOverlay.classList.remove('active');
    document.getElementById('confirmPlaylistBtn').onclick = createNewPlaylist;
    document.getElementById('deletePlaylistBtn').onclick = deleteCurrentPlaylist;
    
    document.getElementById('closeAddToPlaylistBtn').onclick = () => document.getElementById('addToPlaylistModal').classList.remove('active');

    document.getElementById('trackSearch').oninput = (e) => {
        const val = e.target.value.toLowerCase();
        const filtered = state.viewedTracks.filter(t => 
            t.name.toLowerCase().includes(val) || t.artist.toLowerCase().includes(val)
        );
        UI.renderTrackList(filtered);
    };

    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT') return;
        if (e.code === 'Space') { e.preventDefault(); AudioCore.togglePlay(); }
        if (e.code === 'KeyL') toggleLiteMode();
    });
}

/* --- ФУНКЦИИ ЛОГИКИ --- */

function changePlaybackTrack(direction) {
    let newIndex = state.playbackIndex + direction;
    if (newIndex >= state.playbackList.length) newIndex = 0;
    if (newIndex < 0) newIndex = state.playbackList.length - 1;
    
    state.playbackIndex = newIndex;
    AudioCore.loadTrack(newIndex, true); 
    // Обновляем подсветку списка, если трек виден
    UI.renderTrackList(state.viewedTracks);
}

async function confirmUploadTrack() {
    const file = state.pendingUploadFile;
    if (!file) return;

    const title = document.getElementById('upTitle').value.trim() || "Unknown Title";
    const artist = document.getElementById('upArtist').value.trim() || "Unknown Artist";
    const colorBg = document.getElementById('upColorBg').value;
    const colorAccent = document.getElementById('upColorAccent').value;
    const coverUrlInput = document.getElementById('upCoverUrl').value.trim();
    const coverFileInput = document.getElementById('upCoverFile').files[0];

    let coverFinal = 'picture/default_cover.jpg';

    if (coverFileInput) {
        coverFinal = URL.createObjectURL(coverFileInput);
    } else if (coverUrlInput) {
        coverFinal = coverUrlInput;
    }

    const objectUrl = URL.createObjectURL(file);

    const newTrack = {
        name: title,
        artist: artist,
        path: objectUrl,
        cover: coverFinal,
        colors: { primary: '#000', secondary: colorBg, accent: colorAccent },
        neonColor: colorAccent,
        visualizer: [colorAccent, '#ffffff', colorBg]
    };

    state.uploadedTracks.push(newTrack);

    const currentName = state.currentPlaylistName;
    const isSystem = ["Все треки", "Энергичные", "Chill & Retro"].includes(currentName);
    
    if (currentName === "Мои загрузки" || (!isSystem && state.userPlaylists[currentName])) {
        if (state.userPlaylists[currentName]) {
            state.userPlaylists[currentName].push(newTrack);
            saveUserPlaylists();
        }
        state.viewedTracks = getAllPlaylists(state.userPlaylists, state.uploadedTracks)[currentName];
        UI.renderTrackList(state.viewedTracks);
    }

    document.getElementById('uploadModal').classList.remove('active');
    UI.showNotification(`Трек "${title}" добавлен!`, 'success');
}

function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

function showAddToPlaylistModal() {
    const list = document.getElementById('addToPlaylistOptions');
    list.innerHTML = '';
    const userPlaylistNames = Object.keys(state.userPlaylists);
    
    if (userPlaylistNames.length === 0) {
        list.innerHTML = '<div style="color:#aaa; text-align:center;">У вас нет своих плейлистов</div>';
    } else {
        userPlaylistNames.forEach(name => {
            const btn = document.createElement('div');
            btn.className = 'playlist-option-btn';
            btn.textContent = name;
            btn.onclick = () => {
                addTrackToPlaylist(name);
                document.getElementById('addToPlaylistModal').classList.remove('active');
            };
            list.appendChild(btn);
        });
    }
    document.getElementById('addToPlaylistModal').classList.add('active');
}

function addTrackToPlaylist(playlistName) {
    const track = state.viewedTracks[state.contextTrackIndex];
    if (!state.userPlaylists[playlistName]) return;
    
    const exists = state.userPlaylists[playlistName].find(t => t.path === track.path);
    if (exists) {
        UI.showNotification('Трек уже есть в этом плейлисте', 'error');
        return;
    }
    
    state.userPlaylists[playlistName].push(track);
    saveUserPlaylists();
    UI.showNotification(`Добавлено в "${playlistName}"`, 'success');
}

function removeTrackFromCurrentPlaylist() {
    const playlistName = state.currentPlaylistName;
    state.userPlaylists[playlistName].splice(state.contextTrackIndex, 1);
    saveUserPlaylists();
    
    state.viewedTracks = state.userPlaylists[playlistName];
    UI.renderTrackList(state.viewedTracks);
    UI.showNotification('Трек удален из плейлиста', 'info');
}

function downloadCurrentContextTrack() {
    const track = state.viewedTracks[state.contextTrackIndex];
    const a = document.createElement('a');
    a.href = track.path;
    a.download = `${track.artist} - ${track.name}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    UI.showNotification('Загрузка началась...', 'info');
}

function createNewPlaylist() {
    const input = document.getElementById('newPlaylistName');
    const name = input.value.trim();
    if (!name) return;
    const allLists = getAllPlaylists(state.userPlaylists, state.uploadedTracks);
    if (allLists[name]) {
        UI.showNotification('Плейлист уже существует', 'error');
        return;
    }
    state.userPlaylists[name] = [];
    saveUserPlaylists();
    input.value = '';
    document.getElementById('modalOverlay').classList.remove('active');
    UI.switchPlaylist(name);
    UI.showNotification(`Плейлист "${name}" создан`, 'success');
}

function deleteCurrentPlaylist() {
    const name = state.currentPlaylistName;
    
    const msg = document.getElementById('confirmationMessage');
    msg.textContent = `Вы действительно хотите удалить плейлист "${name}"?`;
    
    state.pendingAction = () => {
        delete state.userPlaylists[name];
        saveUserPlaylists();
        UI.switchPlaylist("Все треки");
        UI.showNotification('Плейлист удален', 'info');
    };
    
    document.getElementById('confirmationModal').classList.add('active');
}

function toggleLiteMode() {
    state.isLiteMode = !state.isLiteMode;
    localStorage.setItem('isLiteMode', state.isLiteMode);
    document.body.classList.toggle('lite-mode', state.isLiteMode);
    document.getElementById('liteModeBtn').classList.toggle('active', state.isLiteMode);
    UI.showNotification(state.isLiteMode ? 'Lite Mode вкл.' : 'Lite Mode выкл.');
}
