// Вспомогательная функция для очистки "мертвых" ссылок при загрузке
function loadSanitizedPlaylists() {
    const raw = localStorage.getItem('myUserPlaylists');
    if (!raw) return {};

    try {
        const playlists = JSON.parse(raw);
        const sanitized = {};

        // Проходим по всем плейлистам
        Object.keys(playlists).forEach(key => {
            // Оставляем только те треки, которые НЕ начинаются на 'blob:'
            // blob: - это временные ссылки загруженных файлов
            sanitized[key] = playlists[key].filter(track => !track.path.startsWith('blob:'));
        });

        return sanitized;
    } catch (e) {
        console.error("Ошибка чтения плейлистов", e);
        return {};
    }
}

// Центральное хранилище состояния
export const state = {
    // ВОСПРОИЗВЕДЕНИЕ (То, что реально играет в наушниках)
    playbackList: [],       
    playbackIndex: 0,       
    isPlaying: false,
    
    // ИНТЕРФЕЙС (То, что мы видим в боковой панели)
    currentPlaylistName: "Все треки",
    viewedTracks: [],       

    // НАСТРОЙКИ
    isLiteMode: localStorage.getItem('isLiteMode') === 'true',
    // 0: LOOP_PLAYLIST, 1: LOOP_ONE, 2: SHUFFLE
    playbackMode: 0, 
    
    // СОРТИРОВКА
    sort: {
        type: 'default', // 'name', 'artist', 'shuffle', 'default'
        direction: 'asc' // 'asc' или 'desc'
    },
    
    // ДАННЫЕ
    // Теперь загружаем через функцию очистки
    userPlaylists: loadSanitizedPlaylists(),
    
    // Загруженные треки всегда пустые при старте, так как файлы не сохраняются между сессиями
    uploadedTracks: [],
    
    // ВРЕМЕННЫЕ
    contextTrackIndex: null, // Индекс трека (в viewedTracks) для контекстного меню
    pendingUploadFile: null, // Файл, который выбран, но еще не сохранен
    pendingAction: null, // Функция для модалки подтверждения
};

export const PLAYBACK_MODES = { 
    LOOP_PLAYLIST: 0, 
    LOOP_ONE: 1, 
    SHUFFLE: 2 
};

export function saveUserPlaylists() {
    localStorage.setItem('myUserPlaylists', JSON.stringify(state.userPlaylists));
}
