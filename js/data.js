/* --- БАЗА ДАННЫХ ВСЕХ ТРЕКОВ --- */
export const library = [
    { 
        name: 'Katana', 
        artist: 'Lead Horizon', 
        path: 'audio/Lead_Horizon_Katana.mp3', 
        cover: 'picture/Lead_Horizon_Katana.jpg', 
        // Агрессивный глич для фонка/метала
        effect: 'glitch',
        colors: { primary: '#000000', secondary: '#1a0000', accent: '#ff0000' }, 
        visualizer: ['#ff0000', '#ff4d4d', '#ffffff', '#800000', '#000000'], 
        neonColor: '#ff0000', 
        lyricsSource: 'lyrics/katana.json' 
    },
    { 
        name: 'Tangled Up', 
        artist: 'Caro Emerald', 
        path: 'audio/Caro_Emerald_Tangled_Up.mp3', 
        colors: { primary: '#333b25', secondary: '#745c18', accent: '#efdc31' }, 
        cover: 'picture/TangledUp.jpg', 
        // Плавная жидкость для джаза/попа
        effect: 'liquid',
        visualizer: ['#efdc31', '#ead772', '#e4c51c', '#a0951a', '#817a44'], 
        neonColor: '#efdc31' 
    },
    { 
        name: 'Valhalla Calling', 
        artist: 'Miracle Of Sound', 
        path: 'audio/VALHALLA_CALLING_Miracle_Of_Sound.mp3', 
        colors: { primary: '#122a34', secondary: '#1b4c4b', accent: '#44bba8' }, 
        cover: 'picture/ValhallaCalling.jpeg', 
        // Эффект ветра для эпика
        effect: 'wind',
        visualizer: ['#44bba8', '#d8e2e4', '#286869', '#2a5c6c', '#1e5258'], 
        neonColor: '#44bba8' 
    },
    { 
        name: 'Lust', 
        artist: 'Marino ft. Alexandria', 
        path: 'audio/Marino_Lust.m4a', 
        colors: { primary: '#230b10', secondary: '#5c1723', accent: '#e1212c' }, 
        cover: 'picture/Lust.jpeg', 
        effect: 'liquid',
        visualizer: ['#e1212c', '#e48494', '#ddadb0', '#7b212b', '#5c1723'], 
        neonColor: '#e1212c' 
    },
    { 
        name: 'Puttin On The Ritz', 
        artist: 'Taco', 
        path: 'audio/Taco_Puttin_On_The_Ritz.m4a', 
        colors: { primary: '#080708', secondary: '#3c345a', accent: '#86bbd6' }, 
        cover: 'picture/Puttin_On_The_Ritz.jpg', 
        // Ретро эффект
        effect: 'liquid',
        visualizer: ['#86bbd6', '#3d82a5', '#78afbc', '#92703f', '#b0ab8e'], 
        neonColor: '#86bbd6' 
    },
    { 
        name: 'The Cigarette Duet', 
        artist: 'Princess Chelsea', 
        path: 'audio/Princess_Chelsea_Cigarette_Duet.m4a', 
        colors: { primary: '#701d1e', secondary: '#821318', accent: '#e0a494' }, 
        cover: 'picture/Cigarette_Duet.jpg', 
        effect: 'liquid',
        visualizer: ['#e0a494', '#d98c8a', '#d39ca4', '#b66b74', '#a23d3d', '#821318'], 
        neonColor: '#e0a494' 
    },
    { 
        name: 'A Man Without Love', 
        artist: 'Engelbert Humperdinck', 
        path: 'audio/Engelbert_Humperdinck_Man_Without_Love.m4a', 
        colors: { primary: '#18101d', secondary: '#463138', accent: '#5fabba' }, 
        cover: 'picture/Man_Without_Love.jpg', 
        effect: 'liquid',
        visualizer: ['#5fabba', '#d1aba2', '#8a8295', '#994144'], 
        neonColor: '#5fabba' 
    },
    { 
        name: 'IRIS OUT', 
        artist: 'Kenshi Yonezu', 
        path: 'audio/Kenshi_Yonezu_IRIS_OUT.m4a', 
        colors: { primary: '#0b0405', secondary: '#3d255a', accent: '#e00705' }, 
        cover: 'picture/Kenshi_Yonezu_IRIS_OUT.jpg', 
        effect: 'glitch',
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
        effect: 'liquid',
        visualizer: ['#dad7cf', '#bcaf9c', '#a59078', '#94794d', '#79573f'], 
        neonColor: '#bcaf9c' 
    },
    { 
        name: 'Песня смертника', 
        artist: '2rbina 2rista', 
        path: 'audio/2rbina_2rista_Песня_смертника.m4a', 
        colors: { primary: '#0d1313', secondary: '#3b3c3c', accent: '#c2312e' }, 
        cover: 'picture/Песня_смертника.jpg', 
        effect: 'glitch',
        visualizer: ['#c2312e', '#684241', '#94949c', '#83848c', '#44544c'], 
        neonColor: '#c2312e' 
    },
    { 
        name: '2 Phút Hơn - Electric Guitar Version', 
        artist: 'Pháo', 
        path: 'audio/2_Phút_Hơn_Pháo_Electric_Guitar_Version.m4a', 
        colors: { primary: '#171715', secondary: '#9f1310', accent: '#fb7b7c' }, 
        cover: 'picture/Pháo_Electric_Guitar_Version.jpeg', 
        effect: 'glitch',
        visualizer: ['#fb7b7c', '#f4b3eb', '#f4cac3', '#ec7469', '#e6958d'], 
        neonColor: '#fb7b7c' 
    },
    { 
        name: 'Goo Goo Muck', 
        artist: 'The Cramps', 
        path: 'audio/The_Cramps_Goo_Goo_Muck.mp3', 
        cover: 'picture/Goo_Goo_Muck.jpg', 
        effect: 'liquid',
        colors: { primary: '#10100a', secondary: '#2a2a20', accent: '#f0ff00' }, 
        visualizer: ['#f0ff00', '#b8c200', '#f5f5f5', '#2a2a20'], 
        neonColor: '#f0ff00' 
    },
    { 
        name: 'Ghostbusters', 
        artist: 'Ray Parker, Jr.', 
        path: 'audio/Ray_Parker_Jr_Ghostbusters.mp3', 
        cover: 'picture/Ghostbusters.jpg', 
        effect: 'liquid',
        colors: { primary: '#080808', secondary: '#1f1f1f', accent: '#d91e2a' }, 
        visualizer: ['#d91e2a', '#ffffff', '#b0b0b0', '#7a7a7a', '#1f1f1f'], 
        neonColor: '#d91e2a' 
    },
    { 
        name: 'Ramalama (Bang Bang)', 
        artist: 'Róisín Murphy', 
        path: 'audio/Roisin_Murphy_Ramalama_Bang_Bang.mp3', 
        cover: 'picture/Ramalama_Bang_Bang.jpg', 
        effect: 'glitch',
        colors: { primary: '#101014', secondary: '#241f22', accent: '#c45d3c' }, 
        visualizer: ['#c45d3c', '#f0f0f0', '#a0a0a0', '#4a4a4a'], 
        neonColor: '#c45d3c' 
    },
    { 
        name: 'Exploration', 
        artist: 'Bruno Coulais', 
        path: 'audio/Bruno_Coulais_Exploration.mp3', 
        colors: { primary: '#0f0f2d', secondary: '#3c2a4d', accent: '#8978d6' }, 
        cover: 'picture/Exploration.jpg', 
        effect: 'liquid',
        visualizer: ['#8978d6', '#a99de0', '#695aab', '#3c2a4d', '#281c34'], 
        neonColor: '#8978d6' 
    },
    { 
        name: 'Шкатулка 8D Remix', 
        artist: 'MiatriSs', 
        path: 'audio/MiatriSs_Шкатулка_8D_Remix.mp3', 
        colors: { primary: '#1a1829', secondary: '#3c305c', accent: '#8a4fff' }, 
        cover: 'picture/Шкатулка_8D_Remix.jpg', 
        effect: 'glitch',
        visualizer: ['#8a4fff', '#a782ff', '#3c305c', '#d1c4d9', '#1a1829'], 
        neonColor: '#8a4fff',
        lyricsSource: 'lyrics/shkatulka.json'
    },
    { 
        name: 'Spend The Night Alone', 
        artist: 'Callie Mae & longestsoloever', 
        path: 'audio/Callie_Mae_and_longestsoloever_Spend_The_Night_Alone.mp3', 
        colors: { primary: '#050608', secondary: '#1a1d2b', accent: '#a8b4c7' }, 
        cover: 'picture/Spend_The_Night_Alone.jpg', 
        effect: 'notHuman',
        visualizer: ['#a8b4c7', '#8e9aaf', '#748097', '#5a667f', '#3e4a61'], 
        neonColor: '#a8b4c7' 
    },
    { 
        name: 'My Ordinary Life', 
        artist: 'The Living Tombstone', 
        path: 'audio/The_Living_Tombstone_My_Ordinary_Life.mp3', 
        colors: { primary: '#4d3163', secondary: '#d46a45', accent: '#30d5c8' }, 
        cover: 'picture/My_Ordinary_Life.jpg', 
        effect: 'glitch',
        visualizer: ['#30d5c8', '#e62e5c', '#ffdd57', '#d46a45', '#4d3163'], 
        neonColor: '#30d5c8' 
    },
    { 
        name: 'Alastor\'s Game', 
        artist: 'The Living Tombstone', 
        path: 'audio/The_Living_Tombstone_Alastors_Game.mp3', 
        colors: { primary: '#1c0000', secondary: '#4a0000', accent: '#ff1f1f' }, 
        cover: 'picture/Alastors_Game.jpg', 
        effect: 'radio',
        visualizer: ['#ff1f1f', '#ff4d4d', '#cc0000', '#990000', '#6b0000'], 
        neonColor: '#ff1f1f' 
    },
    { 
        name: 'Discord (Remix/Cover)', 
        artist: 'CG5 feat. DAGames & RichaadEB', 
        path: 'audio/CG5_Discord_Remix_Cover.mp3', 
        colors: { primary: '#1a3b2a', secondary: '#4f2e2a', accent: '#66ff33' }, 
        cover: 'picture/Discord_Remix_Cover.jpg', 
        effect: 'glitch',
        visualizer: ['#66ff33', '#d9363e', '#f0c420', '#4f2e2a', '#1a3b2a'], 
        neonColor: '#66ff33' 
    },
    { 
        name: 'Rest in Ink', 
        artist: 'JT Music', 
        path: 'audio/JT_Music_Rest_in_Ink.mp3', 
        cover: 'picture/JT_Music_Rest_in_Ink.jpg', 
        effect: 'inkBrush',
        colors: { primary: '#120e1a', secondary: '#3a2e2c', accent: '#e8a848' }, 
        visualizer: ['#e8a848', '#b57d38', '#8a5c29', '#5c3d1a', '#3a2e2c'], 
        neonColor: '#e8a848' 
    },
    { 
        name: 'Waiting so long (TV Size)', 
        artist: 'Berserk OST', 
        path: 'audio/Berserk_OST_Waiting_so_long_TV_Size.mp3', 
        cover: 'picture/Berserk_OST_Waiting_so_long.jpg', 
        effect: 'liquid',
        colors: { primary: '#100c0d', secondary: '#381a1d', accent: '#c91f28' }, 
        visualizer: ['#c91f28', '#e66b3d', '#aab2c4', '#5c3a3d', '#100c0d'], 
        neonColor: '#c91f28' 
    },
    { 
        name: 'Enemy', 
        artist: 'Imagine Dragons, JID', 
        path: 'audio/Imagine_Dragons_JID_Enemy.mp3', 
        cover: 'picture/Imagine_Dragons_JID_Enemy.jpg', 
        effect: 'glitch',
        colors: { primary: '#1a2e2a', secondary: '#2c1f4a', accent: '#ff2828' }, 
        visualizer: ['#ff2828', '#2d75f0', '#b5935a', '#2c1f4a', '#1a2e2a'], 
        neonColor: '#ff2828' 
    },
    { 
        name: 'To Ashes and Blood', 
        artist: 'Woodkid', 
        path: 'audio/Woodkid_To_Ashes_and_Blood.mp3', 
        cover: 'picture/Woodkid_To_Ashes_and_Blood.jpg', 
        effect: 'wind',
        colors: { primary: '#020a1c', secondary: '#0a2d6b', accent: '#c4d6f0' }, 
        visualizer: ['#c4d6f0', '#e0e9f5', '#3a69b3', '#0a2d6b', '#020a1c'], 
        neonColor: '#c4d6f0' 
    },
    { 
        name: "Epoch (The Living Tombstone's Remix)", 
        artist: 'Savlonic', 
        path: 'audio/Savlonic_Epoch_The_Living_Tombstone_Remix.mp3', 
        cover: 'picture/Savlonic_Epoch_The_Living_Tombstone_Remix.jpg', 
        effect: 'glitch',
        colors: { primary: '#1e5ca3', secondary: '#54a3e8', accent: '#ffd800' }, 
        visualizer: ['#ffd800', '#a6683a', '#54a3e8', '#ffffff', '#1e5ca3'], 
        neonColor: '#ffd800' 
    },
    { 
        name: 'My Guest (Azar ENGLISH COVER)', 
        artist: 'MaeFaeBe', 
        path: 'audio/MaeFaeBe_My_Guest_Azar_English_Cover.mp3', 
        cover: 'picture/MaeFaeBe_My_Guest_Azar_English_Cover.jpg', 
        effect: 'glitch',
        colors: { primary: '#110a14', secondary: '#5c1723', accent: '#ff1111' }, 
        visualizer: ['#ff1111', '#1e25ff', '#c4c8de', '#5c1723', '#110a14'], 
        neonColor: '#ff1111' 
    },
    { 
        name: 'The Existential Threat', 
        artist: 'Sparks', 
        path: 'audio/Sparks_The_Existential_Threat.mp3', 
        cover: 'picture/Sparks_The_Existential_Threat.jpg', 
        effect: 'wind',
        colors: { primary: '#1f1d1b', secondary: '#4f2620', accent: '#95d6b4' }, 
        visualizer: ['#95d6b4', '#d4c4b8', '#8a8295', '#4f2620', '#1f1d1b'], 
        neonColor: '#95d6b4' 
    },
    { 
        name: 'Ma Meilleure Ennemie', 
        artist: 'Stromae, Pomme', 
        path: 'audio/Stromae_Pomme_Ma_Meilleure_Ennemie.mp3', 
        cover: 'picture/Stromae_Pomme_Ma_Meilleure_Ennemie.jpg', 
        effect: 'liquid',
        colors: { primary: '#0a1438', secondary: '#0b4a91', accent: '#d4a24f' }, 
        visualizer: ['#d4a24f', '#3b89f0', '#5e6e48', '#6a4ea8', '#0b4a91'], 
        neonColor: '#d4a24f' 
    },
    { 
        name: 'Rapture Rising', 
        artist: 'JT Music', 
        path: 'audio/JT_Music_Rapture_Rising.mp3', 
        cover: 'picture/JT_Music_Rapture_Rising.jpg', 
        effect: 'glitch',
        colors: { primary: '#0b0c1f', secondary: '#1a294a', accent: '#44d5e3' }, 
        visualizer: ['#44d5e3', '#f0e594', '#6094b8', '#345c8c', '#1a294a'], 
        neonColor: '#44d5e3' 
    },
    { 
        name: 'Open The Door', 
        artist: 'longestsoloever feat. DayumDahlia', 
        path: 'audio/longestsoloever_feat_DayumDahlia_Open_The_Door.mp3', 
        cover: 'picture/longestsoloever_feat_DayumDahlia_Open_The_Door.jpg', 
        effect: 'wind',
        colors: { primary: '#1a1d2b', secondary: '#3e4a61', accent: '#a8b4c7' }, 
        visualizer: ['#a8b4c7', '#8e9aaf', '#748097', '#5a667f', '#3e4a61'], 
        neonColor: '#a8b4c7' 
    },
    { 
        name: 'This is the Last Night', 
        artist: 'JT Music', 
        path: 'audio/JT_Music_This_is_the_Last_Night.mp3', 
        cover: 'picture/JT_Music_This_is_the_Last_Night.jpg', 
        effect: 'glitch',
        colors: { primary: '#1c0000', secondary: '#6b0000', accent: '#ff3333' }, 
        visualizer: ['#ff3333', '#ff6666', '#cc0000', '#990000', '#6b0000'], 
        neonColor: '#ff3333' 
    },
    { 
        name: 'Hai Yorokonde (English Ver.)', 
        artist: 'Kocchi no Kento', 
        path: 'audio/Kocchi_no_Kento_Hai_Yorokonde_English_Ver.mp3', 
        cover: 'picture/Kocchi_no_Kento_Hai_Yorokonde_English_Ver.jpg', 
        effect: 'liquid',
        colors: { primary: '#5c1723', secondary: '#821318', accent: '#e0a494' }, 
        visualizer: ['#e0a494', '#d98c8a', '#d39ca4', '#b66b74', '#a23d3d', '#821318'], 
        neonColor: '#e0a494' 
    },
    { 
        name: 'Soldat', 
        artist: 'Sturmmann', 
        path: 'audio/Sturmmann_Soldat.mp3', 
        cover: 'picture/Sturmmann_Soldat.jpg', 
        effect: 'glitch',
        colors: { primary: '#101418', secondary: '#434c4f', accent: '#f0f0f0' }, 
        visualizer: ['#f0f0f0', '#aaff88', '#ffffff', '#a8b3b6', '#434c4f'], 
        neonColor: '#f0f0f0' 
    },
    { 
        name: 'Make Me Pretty', 
        artist: 'JT Music feat. Andrea Storm Kaden', 
        path: 'audio/JT_Music_feat_Andrea_Storm_Kaden_Make_Me_Pretty.mp3', 
        cover: 'picture/JT_Music_feat_Andrea_Storm_Kaden_Make_Me_Pretty.jpg', 
        effect: 'liquid',
        colors: { primary: '#0b1a1f', secondary: '#1a3b3a', accent: '#d4c4b8' }, 
        visualizer: ['#d4c4b8', '#cc0000'], 
        neonColor: '#d4c4b8' 
    },
    { 
        name: 'Call on the Undertaker', 
        artist: 'JT Music', 
        path: 'audio/JT_Music_Call_on_the_Undertaker.mp3', 
        cover: 'picture/JT_Music_Call_on_the_Undertaker.jpg', 
        effect: 'wind',
        colors: { primary: '#0f0f2d', secondary: '#3c2a4d', accent: '#8978d6' }, 
        visualizer: ['#8978d6', '#a99de0', '#695aab', '#3c2a4d', '#281c34'], 
        neonColor: '#8978d6' 
    },
    { 
        name: 'BOY: God of War Battle Rap', 
        artist: 'mashed, Shao Dow', 
        path: 'audio/mashed_and_Shao_Dow_BOY_God_of_War_Battle_Rap.mp3', 
        cover: 'picture/mashed_and_Shao_Dow_BOY_God_of_War_Battle_Rap.jpg', 
        effect: 'glitch',
        colors: { primary: '#171715', secondary: '#9f1310', accent: '#fb7b7c' }, 
        visualizer: ['#fb7b7c', '#f4b3eb', '#f4cac3', '#ec7469', '#e6958d'], 
        neonColor: '#fb7b7c' 
    },
    { 
        name: 'Love Me, Love Me, Love Me', 
        artist: 'Nerissa Ravencroft', 
        path: 'audio/Nerissa_Ravencroft_Love_Me_Love_Me_Love_Me_English_Cover.mp3', 
        cover: 'picture/Nerissa_Ravencroft_Love_Me_Love_Me_Love_Me_English_Cover.jpg', 
        effect: 'liquid',
        colors: { primary: '#230b10', secondary: '#5c1723', accent: '#e1212c' }, 
        visualizer: ['#e1212c', '#e48494', '#ddadb0', '#7b212b', '#5c1723'], 
        neonColor: '#e1212c' 
    },
    { 
        name: "Somebody's Watching Me", 
        artist: 'Rockwell', 
        path: "audio/Rockwell_Somebodys_Watching_Me.mp3", 
        cover: "picture/Rockwell_Somebodys_Watching_Me.jpg", 
        effect: 'liquid',
        colors: { primary: '#080808', secondary: '#1f1f1f', accent: '#d91e2a' }, 
        visualizer: ['#d91e2a', '#ffffff', '#b0b0b0', '#7a7a7a', '#1f1f1f'], 
        neonColor: '#d91e2a' 
    },
    { 
        name: 'Should I Stay or Should I Go', 
        artist: 'The Clash', 
        path: 'audio/The_Clash_Should_I_Stay_or_Should_I_Go.mp3', 
        cover: 'picture/The_Clash_Should_I_Stay_or_Should_I_Go.jpg', 
        effect: 'liquid',
        colors: { primary: '#122a34', secondary: '#1b4c4b', accent: '#44bba8' }, 
        visualizer: ['#44bba8', '#d8e2e4', '#286869', '#2a5c6c', '#1e5258'], 
        neonColor: '#44bba8' 
    },
    { 
        name: 'Feeling Good', 
        artist: 'Michael Bublé', 
        path: 'audio/Michael_Buble_Feeling_Good.mp3', 
        cover: 'picture/Michael_Buble_Feeling_Good.jpg', 
        effect: 'liquid',
        colors: { primary: '#333b25', secondary: '#745c18', accent: '#efdc31' }, 
        visualizer: ['#efdc31', '#ead772', '#e4c51c', '#a0951a', '#817a44'], 
        neonColor: '#efdc31' 
    },
    { 
        name: 'Be Mine', 
        artist: 'OR3O ft. royale5band', 
        path: 'audio/OR3O_ft_royale5band_Be_Mine.mp3', 
        cover: 'picture/OR3O_ft_royale5band_Be_Mine.jpg', 
        effect: 'liquid',
        colors: { primary: '#200a3d', secondary: '#4d2d80', accent: '#00d1ff' }, 
        visualizer: ['#00d1ff', '#5ce0ff', '#8f5ce6', '#4d2d80', '#200a3d'], 
        neonColor: '#00d1ff' 
    },
    { 
        name: 'The Night', 
        artist: 'The Lair of Voltaire', 
        path: 'audio/The_Lair_of_Voltaire_The_Night.mp3', 
        cover: 'picture/The_Lair_of_Voltaire_The_Night.jpg', 
        effect: 'glitch',
        colors: { primary: '#0a0a0a', secondary: '#5a0f1e', accent: '#f0f0f0' }, 
        visualizer: ['#f0f0f0', '#d3d3d3', '#a0a0a0', '#7b212b', '#5c1723'], 
        neonColor: '#f0f0f0' 
    },
    { 
        name: 'IRIS OUT (Epic Orchestra Cover)', 
        artist: 'Multiverse Orchestra', 
        path: 'audio/Multiverse_Orchestra_IRIS_OUT_Kenshi_Yonezu_Cover.mp3', 
        cover: 'picture/Multiverse_Orchestra_IRIS_OUT_Kenshi_Yonezu_Cover.jpg', 
        effect: 'wind',
        colors: { primary: '#0b0405', secondary: '#3d255a', accent: '#e00705' }, 
        visualizer: ['#e00705', '#10a3a9'], 
        neonColor: '#e00705', 
        neonColorRight: '#10a3a9' 
    },
    { 
        name: 'HOLLOW HUNGER', 
        artist: 'OxT', 
        path: 'audio/OxT_HOLLOW_HUNGER.mp3', 
        cover: 'picture/OxT_HOLLOW_HUNGER.jpg', 
        effect: 'glitch',
        colors: { primary: '#231c15', secondary: '#79573f', accent: '#dad7cf' }, 
        visualizer: ['#dad7cf', '#bcaf9c', '#a59078', '#94794d', '#79573f'], 
        neonColor: '#bcaf9c' 
    },
    { 
        name: 'Hoist the Colours', 
        artist: 'Bobby Bass', 
        path: 'audio/Bobby_Bass_Hoist_the_Colours.mp3', 
        cover: 'picture/Bobby_Bass_Hoist_the_Colours.jpg', 
        effect: 'wind',
        colors: { primary: '#1c0000', secondary: '#6b0000', accent: '#ff3333' }, 
        visualizer: ['#ff3333', '#ff6666', '#cc0000', '#990000', '#6b0000'], 
        neonColor: '#ff3333' 
    },
    { 
        name: 'You Will Believe (Remix/Cover)', 
        artist: 'CG5 ft. DAGames', 
        path: 'audio/CG5_ft_DAGames_You_Will_Believe_Remix_Cover.mp3', 
        cover: 'picture/CG5_ft_DAGames_You_Will_Believe_Remix_Cover.jpg', 
        effect: 'glitch',
        colors: { primary: '#1a1d2b', secondary: '#3e4a61', accent: '#a8b4c7' }, 
        visualizer: ['#a8b4c7', '#8e9aaf', '#748097', '#5a667f', '#3e4a61'], 
        neonColor: '#a8b4c7' 
    },
    { 
        name: 'Your Reality (Remix)', 
        artist: 'CG5 ft. Chloe DAGames', 
        path: 'audio/CG5_ft_Chloe_DAGames_Your_Reality_Remix.mp3', 
        cover: 'picture/CG5_ft_Chloe_DAGames_Your_Reality_Remix.jpg', 
        effect: 'liquid',
        colors: { primary: '#2b1d1a', secondary: '#5a3d34', accent: '#d4af37' }, 
        visualizer: ['#d4af37', '#b89a30', '#9c8529', '#807022', '#645b1b'], 
        neonColor: '#d4af37' 
    }
];

/* --- ВНУТРЕННИЕ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ --- */
const getTrack = (namePart) => {
    return library.find(t => t.name.toLowerCase().includes(namePart.toLowerCase()));
};

/* --- ОПРЕДЕЛЕНИЕ СТАНДАРТНЫХ ПЛЕЙЛИСТОВ --- */
const defaultPlaylists = {
    "Все треки": library,
    "Энергичные": [
        getTrack("Katana"), 
        getTrack("Valhalla"), 
        getTrack("Песня смертника"), 
        getTrack("IRIS OUT"), 
        getTrack("2 Phút Hơn"), 
        getTrack("Enemy"), 
        getTrack("Soldat"), 
        getTrack("Rapture Rising")
    ].filter(Boolean),
    "Chill & Retro": [
        getTrack("Tangled Up"), 
        getTrack("Puttin On The Ritz"), 
        getTrack("Man Without Love"), 
        getTrack("Cigarette Duet"), 
        getTrack("God Rest Ye Merry Gentlemen"), 
        getTrack("Feeling Good")
    ].filter(Boolean),
    "Для Ксю": [
        getTrack("Spend The Night Alone"), 
        getTrack("Rest in Ink"), 
        getTrack("Katana"), 
        getTrack("Alastor's Game")
    ].filter(Boolean),
    "От Кирика": [
    ].filter(Boolean),
};

/* --- ГЛАВНАЯ ФУНКЦИЯ ЭКСПОРТА --- */
export function getAllPlaylists(userPlaylists = {}, uploadedTracks = []) {
    // 1. "Лечим" пользовательские плейлисты (Гидратация)
    // Это исправляет баг, когда старые сохраненные треки не имеют новых свойств (effect и т.д.)
    const hydratedUserPlaylists = {};
    
    Object.keys(userPlaylists).forEach(playlistName => {
        hydratedUserPlaylists[playlistName] = userPlaylists[playlistName].map(savedTrack => {
            // Ищем этот трек в главной библиотеке по пути к файлу
            const originalTrack = library.find(t => t.path === savedTrack.path);
            
            // Если нашли оригинал в базе, берем свежие данные (эффекты, цвета) из базы,
            // но сохраняем локальные свойства, если они есть.
            if (originalTrack) {
                return { ...savedTrack, ...originalTrack };
            }
            
            // Если это загруженный трек (которого нет в library), оставляем как есть
            return savedTrack;
        });
    });

    // 2. Объединяем стандарные и обновленные пользовательские
    const combined = { ...defaultPlaylists, ...hydratedUserPlaylists };
    
    // 3. Добавляем "Мои загрузки", если есть
    if (uploadedTracks && uploadedTracks.length > 0) {
        combined["Мои загрузки"] = uploadedTracks;
    }

    // 4. Автоматически добавляем новые загруженные треки в плейлист "Все треки",
    // чтобы они отображались в главном списке без переключения плейлиста
    if (uploadedTracks.length > 0) {
        // Создаем копию массива треков
        const allTracks = [...combined["Все треки"]]; 
        uploadedTracks.forEach(t => {
             // Простая проверка на дубликаты по пути
             if(!allTracks.find(x => x.path === t.path)) {
                 allTracks.push(t);
             }
        });
        combined["Все треки"] = allTracks;
    }

    return combined;
}
