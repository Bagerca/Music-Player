// Центральное хранилище состояния
export const state = {
    currentTrackIndex: 0,
    currentPlaylistName: "Все треки",
    currentTracks: [],
    isPlaying: false,
    isLiteMode: localStorage.getItem('isLiteMode') === 'true',
    playbackMode: 0, // 0: PLAYLIST, 1: SINGLE, 2: ONCE
    
    // Данные
    userPlaylists: JSON.parse(localStorage.getItem('myUserPlaylists')) || {},
    uploadedTracks: [],
    
    // Временные
    pendingUploadFile: null,
    draggedItemIndex: null,
    activeMenuId: null,
};

export const PLAYBACK_MODES = { PLAYLIST: 0, SINGLE: 1, ONCE: 2 };

export function saveUserPlaylists() {
    localStorage.setItem('myUserPlaylists', JSON.stringify(state.userPlaylists));
}
