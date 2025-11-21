export const library = [
    { 
        name: 'Katana', 
        artist: 'Lead Horizon', 
        path: 'audio/Lead_Horizon_Katana.mp3', 
        cover: 'picture/Lead_Horizon_Katana.jpg', 
        colors: { primary: '#000000', secondary: '#1a0000', accent: '#ff0000' }, 
        visualizer: ['#ff0000', '#ff4d4d', '#ffffff', '#800000', '#000000'], 
        neonColor: '#ff0000', 
        lyricsSource: 'lyrics/katana.json' 
    },
    // ... сюда скопируйте остальные треки из вашего старого playlists.js ...
    // Я сократил для примера, но код будет работать с полным списком
];

const defaultPlaylists = {
    "Все треки": library,
    "Энергичные": library.filter(t => ['Katana', 'Valhalla Calling'].some(k => t.name.includes(k))),
};

export function getAllPlaylists(userPlaylists, uploadedTracks) {
    const combined = { ...defaultPlaylists, ...userPlaylists };
    if (uploadedTracks.length > 0) {
        combined["Мои загрузки"] = uploadedTracks;
    }
    return combined;
}
