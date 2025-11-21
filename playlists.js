/* --- БАЗА ДАННЫХ ВСЕХ ТРЕКОВ (ИСТОЧНИК ИСТИНЫ) --- */
const library = [
    { 
        name: 'Tangled Up', 
        artist: 'Caro Emerald',
        path: 'audio/Caro_Emerald_Tangled_Up.mp3',
        colors: { primary: '#333b25', secondary: '#745c18', accent: '#efdc31' },
        cover: 'picture/TangledUp.jpg',
        visualizer: ['#efdc31', '#ead772', '#e4c51c', '#a0951a', '#817a44'],
        neonColor: '#efdc31'
    },
    { 
        name: 'Valhalla Calling', 
        artist: 'Miracle Of Sound',
        path: 'audio/VALHALLA_CALLING_Miracle_Of_Sound.mp3',
        colors: { primary: '#122a34', secondary: '#1b4c4b', accent: '#44bba8' },
        cover: 'picture/ValhallaCalling.jpeg',
        visualizer: ['#44bba8', '#d8e2e4', '#286869', '#2a5c6c', '#1e5258'],
        neonColor: '#44bba8'
    },
    { 
        name: 'Lust', 
        artist: 'Marino ft. Alexandria',
        path: 'audio/Marino_Lust.m4a',
        colors: { primary: '#230b10', secondary: '#5c1723', accent: '#e1212c' },
        cover: 'picture/Lust.jpeg',
        visualizer: ['#e1212c', '#e48494', '#ddadb0', '#7b212b', '#5c1723'],
        neonColor: '#e1212c'
    },
    { 
        name: 'Puttin On The Ritz', 
        artist: 'Taco',
        path: 'audio/Taco_Puttin_On_The_Ritz.m4a',
        colors: { primary: '#080708', secondary: '#3c345a', accent: '#86bbd6' },
        cover: 'picture/Puttin_On_The_Ritz.jpg',
        visualizer: ['#86bbd6', '#3d82a5', '#78afbc', '#92703f', '#b0ab8e'],
        neonColor: '#86bbd6'
    },
    { 
        name: 'The Cigarette Duet', 
        artist: 'Princess Chelsea',
        path: 'audio/Princess_Chelsea_Cigarette_Duet.m4a',
        colors: { primary: '#701d1e', secondary: '#821318', accent: '#e0a494' },
        cover: 'picture/Cigarette_Duet.jpg',
        visualizer: ['#e0a494', '#d98c8a', '#d39ca4', '#b66b74', '#a23d3d', '#821318'],
        neonColor: '#e0a494'
    },
    { 
        name: 'A Man Without Love', 
        artist: 'Engelbert Humperdinck',
        path: 'audio/Engelbert_Humperdinck_Man_Without_Love.m4a',
        colors: { primary: '#18101d', secondary: '#463138', accent: '#5fabba' },
        cover: 'picture/Man_Without_Love.jpg',
        visualizer: ['#5fabba', '#d1aba2', '#8a8295', '#994144'],
        neonColor: '#5fabba'
    },
    { 
        name: 'IRIS OUT', 
        artist: 'Kenshi Yonezu',
        path: 'audio/Kenshi_Yonezu_IRIS_OUT.m4a',
        colors: { primary: '#0b0405', secondary: '#3d255a', accent: '#e00705' },
        cover: 'picture/Kenshi_Yonezu_IRIS_OUT.jpg',
        visualizer: ['#e00705', '#10a3a9'],
        neonColor: '#e00705',
        neonColorRight: '#10a3a9'
    },
    { 
        name: 'God Rest Ye Merry Gentlemen', 
        artist: 'Pentatonix',
        path: 'audio/Pentatonix_God_Rest_Ye_Merry_Gentlemen.m4a',
        colors: { primary: '#231c15', secondary: '#79573f', accent: '#dad7cf' },
        cover: 'picture/Pentatonix_God_Rest_Ye_Merry_Gentlemen.jpg',
        visualizer: ['#dad7cf', '#bcaf9c', '#a59078', '#94794d', '#79573f'],
        neonColor: '#bcaf9c'
    },
    { 
        name: 'Песня смертника', 
        artist: '2rbina 2rista',
        path: 'audio/2rbina_2rista_Песня_смертника.m4a',
        colors: { primary: '#0d1313', secondary: '#3b3c3c', accent: '#c2312e' },
        cover: 'picture/Песня_смертника.jpg',
        visualizer: ['#c2312e', '#684241', '#94949c', '#83848c', '#44544c'],
        neonColor: '#c2312e'
    },
    { 
        name: '2 Phút Hơn - Electric Guitar Version', 
        artist: 'Pháo',
        path: 'audio/2_Phút_Hơn_Pháo_Electric_Guitar_Version.m4a',
        colors: { primary: '#171715', secondary: '#9f1310', accent: '#fb7b7c' },
        cover: 'picture/Pháo_Electric_Guitar_Version.jpeg',
        visualizer: ['#fb7b7c', '#f4b3eb', '#f4cac3', '#ec7469', '#e6958d'],
        neonColor: '#fb7b7c'
    },
    // ... Сюда можно добавить остальные треки из твоего старого файла ...
];

/* --- ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ --- */
const getTrack = (namePart) => {
    return library.find(t => t.name.toLowerCase().includes(namePart.toLowerCase()));
};

/* --- СБОРКА ПЛЕЙЛИСТОВ --- */
const playlists = {
    "Все треки": library,

    "Энергичные": [
        getTrack("Valhalla"),
        getTrack("Песня смертника"),
        getTrack("IRIS OUT"),
        getTrack("2 Phút Hơn")
    ].filter(Boolean), // filter(Boolean) удалит undefined, если трек не найден

    "Chill & Retro": [
        getTrack("Tangled Up"),
        getTrack("Puttin On The Ritz"),
        getTrack("Man Without Love"),
        getTrack("Cigarette Duet"),
        getTrack("God Rest Ye Merry Gentlemen")
    ].filter(Boolean)
};
