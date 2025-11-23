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
    
    // Устанавливаем дефолтную фавиконку
    UI.updateFavicon('#00d1ff');
    // Устанавливаем правильную иконку режима
    UI.updatePlaybackModeIcon(state.playbackMode);

    // Загрузка первого трека
    if (state.playbackList.length) {
        AudioCore.loadTrack(0);
    }
    
    UI.renderPlaylistSelector();
    UI.renderTrackList(state.viewedTracks);
    
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
    
    // Кнопка Next с учетом рандома
    document.getElementById('nextBtn').onclick = () => {
        if (state.playbackMode === PLAYBACK_MODES.SHUFFLE) {
            changePlaybackTrack('random');
        } else {
            changePlaybackTrack(1);
        }
    };
    
    // ОБРАБОТЧИК КНОПКИ РЕЖИМОВ ВОСПРОИЗВЕДЕНИЯ
    document.getElementById('playbackModeBtn').onclick = () => {
        // 0 -> 1 -> 2 -> 0
        state.playbackMode = (state.playbackMode + 1) % 3;
        UI.updatePlaybackModeIcon(state.playbackMode);
        
        const modes = ["Повтор плейлиста", "Повтор трека", "Рандом"];
        UI.showNotification(`Режим: ${modes[state.playbackMode]}`, 'info');
    };

    document.getElementById('progressBar').onclick = (e) => {
        const width = e.currentTarget.clientWidth;
        const duration = AudioCore.audio.duration;
        AudioCore.audio.currentTime = (e.offsetX / width) * duration;
    };

    AudioCore.audio.addEventListener('timeupdate', UI.updateProgress);
    
    // ЛОГИКА ОКОНЧАНИЯ ТРЕКА
    AudioCore.audio.addEventListener('ended', () => {
        if (state.playbackMode === PLAYBACK_MODES.LOOP_ONE) {
            // Повтор текущего
            AudioCore.loadTrack(state.playbackIndex, true);
        } else if (state.playbackMode === PLAYBACK_MODES.SHUFFLE) {
            // Рандом
            changePlaybackTrack('random');
        } else {
            // Следующий
            changePlaybackTrack(1);
        }
    });

    // --- СОРТИРОВКА ---
    const sortBtn = document.getElementById('sortBtn');
    const sortMenu = document.getElementById('sortMenu');

    sortBtn.onclick = (e) => {
        e.stopPropagation();
        const rect = sortBtn.getBoundingClientRect();
        sortMenu.style.top = `${rect.bottom + 10}px`;
        sortMenu.style.left = `${rect.right - 200}px`; 
        sortMenu.classList.toggle('active');
    };

    document.addEventListener('click', (e) => {
        if (!sortMenu.contains(e.target) && e.target !== sortBtn) {
            sortMenu.classList.remove('active');
        }
    });

    document.querySelectorAll('.sort-item').forEach(item => {
        item.onclick = () => {
            const type = item.dataset.type;
            handleSort(type, item);
        };
    });


    // --- ЗАГРУЗКА ТРЕКОВ (PRO ЛОГИКА) ---
    
    // Элементы UI
    const upTitleInput = document.getElementById('upTitle');
    const upArtistInput = document.getElementById('upArtist');
    const liveTitle = document.getElementById('livePreviewTitle');
    const liveArtist = document.getElementById('livePreviewArtist');
    const liveCard = document.getElementById('livePreviewCard');
    const liveCover = document.getElementById('livePreviewCover');
    
    // Элементы цвета
    const colorBgInput = document.getElementById('upColorBg');
    const colorAccentInput = document.getElementById('upColorAccent');
    
    // 1. ЖИВОЕ ОБНОВЛЕНИЕ ТЕКСТА
    upTitleInput.oninput = (e) => {
        liveTitle.textContent = e.target.value || "Название трека";
    };
    upArtistInput.oninput = (e) => {
        liveArtist.textContent = e.target.value || "Исполнитель";
    };

    // 2. ЖИВОЕ ОБНОВЛЕНИЕ ЦВЕТОВ
    colorBgInput.oninput = (e) => updateLiveColors(e.target.value, colorAccentInput.value);
    colorAccentInput.oninput = (e) => updateLiveColors(colorBgInput.value, e.target.value);


    // 3. ОТКРЫТИЕ МОДАЛКИ ПРИ ВЫБОРЕ АУДИО
    document.getElementById('uploadTrackBtn').onclick = () => document.getElementById('fileInput').click();
    
    document.getElementById('fileInput').onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        state.pendingUploadFile = file;
        
        // Заполняем данные
        const fileName = file.name.replace(/\.[^/.]+$/, "");
        document.getElementById('uploadFileName').textContent = file.name;
        upTitleInput.value = fileName;
        upArtistInput.value = "Unknown Artist";
        
        // Обновляем Live Preview
        liveTitle.textContent = fileName;
        liveArtist.textContent = "Unknown Artist";
        
        // Сброс обложки
        document.getElementById('upCoverUrl').value = "";
        document.getElementById('upCoverFile').value = "";
        liveCover.style.backgroundImage = 'none';
        liveCover.innerHTML = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>';
        
        // Сброс цветов
        document.getElementById('autoColorBadge').style.display = 'none';
        updateLiveColors('#1a1a2e', '#00d1ff');
        colorBgInput.value = '#1a1a2e';
        colorAccentInput.value = '#00d1ff';

        document.getElementById('uploadModal').classList.add('active');
        e.target.value = '';
    };

    // Кнопка смены файла внутри модалки
    document.getElementById('triggerFileChangeBtn').onclick = () => {
        document.getElementById('fileInput').click();
    };

    // 4. ЗАГРУЗКА ОБЛОЖКИ (Drap & Drop зона)
    const coverUploadArea = document.getElementById('coverUploadArea');
    const coverInput = document.getElementById('upCoverFile');

    coverUploadArea.onclick = () => coverInput.click();

    coverInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) processCoverImage(URL.createObjectURL(file));
    };
    
    // URL обложки
    document.getElementById('upCoverUrl').oninput = (e) => {
        if(e.target.value) processCoverImage(e.target.value);
    };

    function processCoverImage(src) {
        // Ставим в превью
        liveCover.style.backgroundImage = `url('${src}')`;
        liveCover.innerHTML = ''; 
        
        // Анализируем цвет
        analyzeImageColor(src);
    }

    // Случайные цвета
    document.getElementById('randomColorsBtn').onclick = () => {
        const hue = Math.floor(Math.random() * 360);
        const bg = hslToHex(hue, 60, 10);
        const accent = hslToHex(hue, 80, 60);
        
        colorBgInput.value = bg;
        colorAccentInput.value = accent;
        updateLiveColors(bg, accent);
        document.getElementById('autoColorBadge').style.display = 'none';
    };

    // Сохранение
    document.getElementById('saveUploadBtn').onclick = confirmUploadTrack;
    document.getElementById('cancelUploadBtn').onclick = () => document.getElementById('uploadModal').classList.remove('active');


    // --- КОНТЕКСТНОЕ МЕНЮ ---
    document.addEventListener('open-track-context', (e) => {
        const { originalEvent, index } = e.detail;
        
        state.contextTrackIndex = index;
        const menu = document.getElementById('contextMenu');
        const removeFromPlaylistBtn = document.getElementById('ctxRemoveFromPlaylist');
        const deleteFileBtn = document.getElementById('ctxDeleteFile');
        
        // Позиционирование
        const rect = originalEvent.target.getBoundingClientRect();
        let top = rect.bottom + window.scrollY;
        let left = rect.left + window.scrollX - 190; 
        
        if (left < 10) left = 10;
        if (window.innerHeight - rect.bottom < 150) top = rect.top - 140;
        
        menu.style.top = `${top}px`; 
        menu.style.left = `${left}px`;
        menu.classList.add('active');
        
        // Логика отображения кнопок
        const currentPlaylist = state.currentPlaylistName;
        const track = state.viewedTracks[index];

        // 1. Кнопка "Удалить из плейлиста" (только для пользовательских плейлистов)
        const isSystem = ["Все треки", "Энергичные", "Chill & Retro", "Мои загрузки"].includes(currentPlaylist);
        removeFromPlaylistBtn.style.display = isSystem ? 'none' : 'flex';

        // 2. Кнопка "Удалить файл" (только для загруженных треков)
        const isUploaded = state.uploadedTracks.some(t => t.path === track.path);
        deleteFileBtn.style.display = isUploaded ? 'flex' : 'none';
    });

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
    
    // НОВЫЙ ОБРАБОТЧИК: УДАЛЕНИЕ ФАЙЛА
    document.getElementById('ctxDeleteFile').onclick = () => {
        deleteUploadedFile();
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

function handleSort(type, domItem) {
    if (state.sort.type === type && type !== 'shuffle' && type !== 'default') {
        state.sort.direction = state.sort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        state.sort.type = type;
        state.sort.direction = 'asc';
    }

    updateSortMenuVisuals();
    applySortToViewedTracks();
    UI.renderTrackList(state.viewedTracks);
    
    const names = {
        'name': 'По названию',
        'artist': 'По исполнителю',
        'shuffle': 'Вперемешку',
        'default': 'По умолчанию'
    };
    UI.showNotification(`Сортировка: ${names[type] || type}`);
}

function updateSortMenuVisuals() {
    document.querySelectorAll('.sort-item').forEach(item => {
        item.classList.remove('active', 'desc');
        if (item.dataset.type === state.sort.type) {
            item.classList.add('active');
            if (state.sort.direction === 'desc') {
                item.classList.add('desc');
            }
        }
    });
}

function applySortToViewedTracks() {
    const allLists = getAllPlaylists(state.userPlaylists, state.uploadedTracks);
    const originalList = [...allLists[state.currentPlaylistName]];

    if (state.sort.type === 'default') {
        state.viewedTracks = originalList;
        return;
    }

    if (state.sort.type === 'shuffle') {
        let array = [...originalList];
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        state.viewedTracks = array;
        return;
    }

    state.viewedTracks.sort((a, b) => {
        let valA, valB;

        if (state.sort.type === 'name') {
            valA = a.name.toLowerCase();
            valB = b.name.toLowerCase();
        } else if (state.sort.type === 'artist') {
            valA = a.artist.toLowerCase();
            valB = b.artist.toLowerCase();
        } 
        
        if (valA < valB) return state.sort.direction === 'asc' ? -1 : 1;
        if (valA > valB) return state.sort.direction === 'asc' ? 1 : -1;
        return 0;
    });
}

function changePlaybackTrack(direction) {
    let newIndex;
    if (direction === 'random') {
        const max = state.playbackList.length;
        if (max <= 1) {
            newIndex = 0;
        } else {
            do {
                newIndex = Math.floor(Math.random() * max);
            } while (newIndex === state.playbackIndex);
        }
    } else {
        newIndex = state.playbackIndex + direction;
        if (newIndex >= state.playbackList.length) newIndex = 0;
        if (newIndex < 0) newIndex = state.playbackList.length - 1;
    }
    
    state.playbackIndex = newIndex;
    AudioCore.loadTrack(newIndex, true); 
    UI.renderTrackList(state.viewedTracks);
}

// 2. ЖИВОЕ ОБНОВЛЕНИЕ ЦВЕТОВ (Хелпер)
function updateLiveColors(bg, accent) {
    const swatchBg = document.getElementById('swatchBg');
    const swatchAccent = document.getElementById('swatchAccent');
    const liveCard = document.getElementById('livePreviewCard');
    const liveTitle = document.getElementById('livePreviewTitle');

    if(swatchBg) swatchBg.style.background = bg;
    if(swatchAccent) {
        swatchAccent.style.background = accent;
        swatchAccent.style.boxShadow = `0 0 10px ${accent}`;
    }
    
    // Обновляем CSS-переменную для живой карточки
    if(liveCard) liveCard.style.setProperty('--live-accent', accent);
    if(liveTitle) liveTitle.style.color = accent;
}

// ФУНКЦИЯ АНАЛИЗА ЦВЕТА (С ЗАЩИТОЙ ОТ CORS)
function analyzeImageColor(imageSrc) {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageSrc;
    
    img.onload = function() {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 1; canvas.height = 1;
            
            ctx.drawImage(img, 0, 0, 1, 1);
            
            const p = ctx.getImageData(0, 0, 1, 1).data;
            const hex = rgbToHex(p[0], p[1], p[2]);
            
            const bg = adjustBrightness(hex, -40);
            const accent = boostSaturation(hex);
            
            document.getElementById('upColorBg').value = bg;
            document.getElementById('upColorAccent').value = accent;
            
            updateLiveColors(bg, accent);
            document.getElementById('autoColorBadge').style.display = 'inline-block';
        } catch (e) {
            console.warn("CORS Protected Image. Auto-color disabled.", e);
            document.getElementById('autoColorBadge').style.display = 'none';
        }
    };

    img.onerror = function() {
        console.warn("Image load error");
        document.getElementById('autoColorBadge').style.display = 'none';
    };
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

    // Добавляем в массив загрузок
    state.uploadedTracks.push(newTrack);

    // Если текущий плейлист пользовательский, добавляем и туда
    const currentName = state.currentPlaylistName;
    if (state.userPlaylists[currentName]) {
        state.userPlaylists[currentName].push(newTrack);
        saveUserPlaylists();
    }

    // НОВОЕ: Обновляем выпадающий список (чтобы появился пункт "Мои загрузки")
    UI.renderPlaylistSelector();

    // Принудительное обновление списка независимо от плейлиста
    const allLists = getAllPlaylists(state.userPlaylists, state.uploadedTracks);
    state.viewedTracks = allLists[currentName];
    applySortToViewedTracks();
    UI.renderTrackList(state.viewedTracks);

    document.getElementById('uploadModal').classList.remove('active');
    UI.showNotification(`Трек "${title}" добавлен!`, 'success');
}

function deleteUploadedFile() {
    const trackToDelete = state.viewedTracks[state.contextTrackIndex];
    if (!trackToDelete) return;

    const msg = document.getElementById('confirmationMessage');
    msg.textContent = `Удалить трек "${trackToDelete.name}"? Он исчезнет из всех плейлистов.`;

    state.pendingAction = () => {
        // 1. Удаляем из массива загрузок
        state.uploadedTracks = state.uploadedTracks.filter(t => t.path !== trackToDelete.path);

        // 2. Удаляем из ВСЕХ пользовательских плейлистов
        Object.keys(state.userPlaylists).forEach(plistName => {
            state.userPlaylists[plistName] = state.userPlaylists[plistName].filter(t => t.path !== trackToDelete.path);
        });
        saveUserPlaylists();

        // 3. Обновляем текущий вид
        const allLists = getAllPlaylists(state.userPlaylists, state.uploadedTracks);
        
        // Если мы были в "Мои загрузки" и удалили последний трек -> переключаем на "Все треки"
        // или если текущий плейлист пуст - просто обновляем
        state.viewedTracks = allLists[state.currentPlaylistName] || [];
        
        if (!state.viewedTracks.length && state.currentPlaylistName === "Мои загрузки") {
            UI.switchPlaylist("Все треки");
        } else {
            applySortToViewedTracks();
            UI.renderTrackList(state.viewedTracks);
        }

        UI.renderPlaylistSelector();
        UI.showNotification('Трек удален', 'info');
    };

    document.getElementById('confirmationModal').classList.add('active');
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

function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function adjustBrightness(hex, percent) {
    let num = parseInt(hex.replace("#",""), 16),
    amt = Math.round(2.55 * percent),
    R = (num >> 16) + amt,
    G = (num >> 8 & 0x00FF) + amt,
    B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
}

function boostSaturation(hex) {
    let num = parseInt(hex.replace("#",""), 16);
    if (num < 0x222222) return "#00d1ff"; 
    return hex; 
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
    applySortToViewedTracks(); 
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
