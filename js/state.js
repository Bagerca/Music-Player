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
    userPlaylists: JSON.parse(localStorage.getItem('myUserPlaylists')) || {},
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
