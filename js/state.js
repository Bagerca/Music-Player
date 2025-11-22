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
    playbackMode: 0, // 0: PLAYLIST, 1: SINGLE, 2: ONCE
    
    // ДАННЫЕ
    userPlaylists: JSON.parse(localStorage.getItem('myUserPlaylists')) || {},
    uploadedTracks: [],
    
    // ВРЕМЕННЫЕ
    contextTrackIndex: null, // Индекс трека (в viewedTracks) для контекстного меню
    pendingUploadFile: null, // Файл, который выбран, но еще не сохранен
};

export const PLAYBACK_MODES = { PLAYLIST: 0, SINGLE: 1, ONCE: 2 };

export function saveUserPlaylists() {
    localStorage.setItem('myUserPlaylists', JSON.stringify(state.userPlaylists));
}
