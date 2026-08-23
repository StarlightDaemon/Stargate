/**
 * Ukiyo-e Woodblock Printing Engine
 * Renders layered multi-block prints using authentic historical techniques:
 * 1. Omohan (主版) - Keyblock black sumi ink outlines & carving marks
 * 2. Jizuri (地摺り) - Earth tone base washes (ochre, straw, warm tea)
 * 3. Aizuri (藍摺り) - Prussian blue & indigo blocks for mountains and waters
 * 4. Shuzuri (朱摺り) - Vermillion / cinnabar accents for torii, bridges, lanterns
 * 5. Bokashi & Inkan (ぼかし・印鑑) - Gradient feathering and red official approval seal
 *
 * In addition, powers the 3-stage elemental portal breakthrough & sustained active vortex.
 */

const STATIONS_DATA = [
    {
        id: 'AKATSUKI',
        index: 0,
        kanji: '暁橋',
        name: 'Dawn Mist Bridge',
        romaji: 'Akatsuki-kyō',
        element: 'Mist & Aurora',
        province: 'Eastern Seaboard (東海道)',
        desc: 'A steep vermillion drum bridge emerging from glowing morning vapors over quiet tidal marshes.',
        layers: {
            bg: '#fbf4dc',
            jizuri: '#f3e5b8',
            aizuri: '#28485e',
            shuzuri: '#c73d2a',
            gold: '#d9a74a'
        },
        svgPaths: {
            keyblock: `
                <path d="M 30,220 C 70,170 120,130 180,120 C 240,130 290,170 330,220" stroke="#1a1818" stroke-width="4" fill="none"/>
                <path d="M 50,220 C 85,185 125,150 180,140 C 235,150 275,185 310,220" stroke="#1a1818" stroke-width="2.5" fill="none"/>
                <line x1="100" y1="170" x2="100" y2="230" stroke="#1a1818" stroke-width="2"/>
                <line x1="180" y1="140" x2="180" y2="230" stroke="#1a1818" stroke-width="2.5"/>
                <line x1="260" y1="170" x2="260" y2="230" stroke="#1a1818" stroke-width="2"/>
                <path d="M 10,130 Q 60,110 110,130 T 210,130 T 310,120" stroke="#1a1818" stroke-width="1.8" fill="none"/>
                <circle cx="180" cy="80" r="32" stroke="#1a1818" stroke-width="3" fill="none"/>
            `,
            jizuri: `
                <rect x="10" y="10" width="340" height="240" fill="#f4e7c3"/>
                <path d="M 10,160 Q 90,140 180,160 T 350,150 L 350,250 L 10,250 Z" fill="#ebd9a4"/>
            `,
            aizuri: `
                <path d="M 10,200 C 60,190 120,210 180,195 C 240,180 300,200 350,190 L 350,250 L 10,250 Z" fill="#203d52"/>
                <path d="M 20,90 Q 70,80 120,90 T 220,85 L 220,110 Q 120,110 20,110 Z" fill="#36607e" opacity="0.7"/>
            `,
            shuzuri: `
                <circle cx="180" cy="80" r="30" fill="#c73d2a"/>
                <path d="M 50,220 C 85,185 125,150 180,140 C 235,150 275,185 310,220 L 330,220 C 290,170 240,130 180,120 C 120,130 70,170 30,220 Z" fill="#b93322"/>
            `,
            bokashi: `
                <path d="M 10,10 L 350,10 L 350,60 Q 180,90 10,60 Z" fill="url(#dawnGrad)" opacity="0.6"/>
            `
        }
    },
    {
        id: 'MATSUKAZE',
        index: 1,
        kanji: '松風関',
        name: 'Pine Wind Barrier',
        romaji: 'Matsukaze-seki',
        element: 'Wind & Timber',
        province: 'Coastal Cliffs (相模湾)',
        desc: 'Ancient gnarled black pine leaning dramatically against gale-force coastal gusts over jagged sea cliffs.',
        layers: {
            bg: '#f7f1dd',
            jizuri: '#e6d8b0',
            aizuri: '#1a3344',
            shuzuri: '#bc422a',
            gold: '#caa245'
        },
        svgPaths: {
            keyblock: `
                <path d="M 200,240 Q 190,170 160,130 Q 130,90 110,80" stroke="#1a1818" stroke-width="5" fill="none"/>
                <path d="M 160,130 Q 210,110 250,120" stroke="#1a1818" stroke-width="3" fill="none"/>
                <circle cx="100" cy="75" r="28" stroke="#1a1818" stroke-width="2" fill="none"/>
                <circle cx="140" cy="65" r="22" stroke="#1a1818" stroke-width="2" fill="none"/>
                <circle cx="250" cy="115" r="25" stroke="#1a1818" stroke-width="2" fill="none"/>
                <circle cx="280" cy="135" r="20" stroke="#1a1818" stroke-width="2" fill="none"/>
                <path d="M 20,40 C 90,20 180,60 270,30 T 340,40" stroke="#1a1818" stroke-width="1.8" stroke-dasharray="8 4" fill="none"/>
                <path d="M 10,70 C 80,50 160,80 250,60 T 350,65" stroke="#1a1818" stroke-width="1.8" stroke-dasharray="8 4" fill="none"/>
            `,
            jizuri: `
                <rect x="10" y="10" width="340" height="240" fill="#ede0be"/>
                <path d="M 10,180 L 120,160 L 220,190 L 350,170 L 350,250 L 10,250 Z" fill="#dbc89c"/>
            `,
            aizuri: `
                <circle cx="100" cy="75" r="27" fill="#1b4d3e"/>
                <circle cx="140" cy="65" r="21" fill="#1e5645"/>
                <circle cx="250" cy="115" r="24" fill="#1b4d3e"/>
                <circle cx="280" cy="135" r="19" fill="#1e5645"/>
                <path d="M 10,210 Q 180,180 350,210 L 350,250 L 10,250 Z" fill="#1e3444"/>
            `,
            shuzuri: `
                <rect x="40" y="160" width="12" height="70" fill="#bc422a" stroke="#1a1818" stroke-width="2"/>
                <rect x="85" y="160" width="12" height="70" fill="#bc422a" stroke="#1a1818" stroke-width="2"/>
                <polygon points="30,160 105,160 100,150 35,150" fill="#bc422a" stroke="#1a1818" stroke-width="2"/>
            `,
            bokashi: `
                <path d="M 10,10 L 350,10 L 350,80 C 250,50 150,90 10,60 Z" fill="url(#pineGrad)" opacity="0.5"/>
            `
        }
    },
    {
        id: 'TSUKIMI',
        index: 2,
        kanji: '月見峠',
        name: 'Moon-Viewing Ridge',
        romaji: 'Tsukimi-tōge',
        element: 'Celestial Void & Moon',
        province: 'Central Highlands (木曽路)',
        desc: 'A steep mountain trail under a brilliant golden crescent moon overlooking layered indigo peaks.',
        layers: {
            bg: '#f4ecd4',
            jizuri: '#e8dcbc',
            aizuri: '#16283b',
            shuzuri: '#c94a2e',
            gold: '#e2b33c'
        },
        svgPaths: {
            keyblock: `
                <path d="M 10,210 L 80,130 L 150,170 L 230,110 L 310,180 L 350,150" stroke="#1a1818" stroke-width="3.5" fill="none"/>
                <path d="M 60,250 L 160,180 L 260,250" stroke="#1a1818" stroke-width="2.5" fill="none"/>
                <path d="M 270,40 A 28,28 0 1,0 295,85 A 24,24 0 1,1 270,40" stroke="#1a1818" stroke-width="2.5" fill="none"/>
                <circle cx="160" cy="170" r="6" stroke="#1a1818" stroke-width="1.8" fill="none"/>
                <path d="M 160,176 L 160,195 L 153,210 M 160,195 L 167,210" stroke="#1a1818" stroke-width="2" fill="none"/>
            `,
            jizuri: `
                <rect x="10" y="10" width="340" height="240" fill="#e9debe"/>
                <path d="M 10,10 L 350,10 L 350,120 L 10,120 Z" fill="#203048"/>
            `,
            aizuri: `
                <path d="M 10,210 L 80,130 L 150,170 L 230,110 L 310,180 L 350,150 L 350,250 L 10,250 Z" fill="#132235"/>
                <path d="M 60,250 L 160,180 L 260,250 L 350,250 L 10,250 Z" fill="#0c1622"/>
            `,
            shuzuri: `
                <circle cx="170" cy="188" r="4.5" fill="#c94a2e" stroke="#1a1818" stroke-width="1"/>
            `,
            bokashi: `
                <path d="M 270,40 A 28,28 0 1,0 295,85 A 24,24 0 1,1 270,40" fill="#e5b83b"/>
            `
        }
    },
    {
        id: 'NAMINOMON',
        index: 3,
        kanji: '波之門',
        name: 'Gate of Cresting Waves',
        romaji: 'Nami-no-mon',
        element: 'Water & Great Tide',
        province: 'Outer Straits (駿河湾)',
        desc: 'A magnificent stylized curling wave crowned with clawed white foam frames the cosmic portal threshold.',
        layers: {
            bg: '#f8f2dc',
            jizuri: '#ebdcb8',
            aizuri: '#193c5c',
            shuzuri: '#c93822',
            gold: '#dab04c'
        },
        svgPaths: {
            keyblock: `
                <path d="M 10,240 C 60,220 110,190 140,140 C 160,100 180,60 230,50 C 270,40 285,75 270,95 C 255,110 230,105 220,125 C 210,145 230,165 260,160 C 290,155 320,180 350,220" stroke="#1a1818" stroke-width="4" fill="none"/>
                <path d="M 230,50 Q 238,40 248,46 M 225,55 Q 235,48 240,58 M 215,62 Q 225,58 228,68" stroke="#1a1818" stroke-width="2.5" fill="none"/>
                <path d="M 10,210 C 60,180 120,190 160,230" stroke="#1a1818" stroke-width="2.8" fill="none"/>
                <polygon points="175,100 160,120 190,120" stroke="#1a1818" stroke-width="2" fill="none"/>
            `,
            jizuri: `
                <rect x="10" y="10" width="340" height="240" fill="#ede0bf"/>
                <polygon points="175,100 155,130 195,130" fill="#fdfbf5"/>
            `,
            aizuri: `
                <path d="M 10,240 C 60,220 110,190 140,140 C 160,100 180,60 230,50 C 270,40 285,75 270,95 C 255,110 230,105 220,125 C 210,145 230,165 260,160 C 290,155 320,180 350,220 L 350,250 L 10,250 Z" fill="#1c476e"/>
                <path d="M 30,240 C 80,210 130,170 170,145 C 195,130 215,110 225,90 L 210,100 C 170,130 110,180 30,240 Z" fill="#0f2b45"/>
            `,
            shuzuri: `
                <path d="M 90,205 Q 115,200 140,210 L 135,215 Q 115,208 85,213 Z" fill="#c93822" stroke="#1a1818" stroke-width="1.5"/>
            `,
            bokashi: `
                <path d="M 230,50 C 270,40 285,75 270,95 C 255,110 230,105 220,125 C 215,120 220,100 225,85 C 228,70 215,65 230,50 Z" fill="#fffdf5" stroke="#1a1818" stroke-width="1.5"/>
            `
        }
    },
    {
        id: 'KAGERO',
        index: 4,
        kanji: '陽炎宿',
        name: 'Shimmering Haze Post',
        romaji: 'Kagerō-shuku',
        element: 'Flame & Twilight',
        province: 'Gravel Plains (武蔵野)',
        desc: 'Stone road lantern casting vermillion flame glow through dancing heat shimmer on wide moonlit plains.',
        layers: {
            bg: '#fbf3dc',
            jizuri: '#f0e0b6',
            aizuri: '#24374c',
            shuzuri: '#d44322',
            gold: '#e0a936'
        },
        svgPaths: {
            keyblock: `
                <polygon points="180,60 160,80 200,80" stroke="#1a1818" stroke-width="3" fill="none"/>
                <rect x="165" y="80" width="30" height="30" stroke="#1a1818" stroke-width="2.5" fill="none"/>
                <polygon points="155,110 205,110 195,125 165,125" stroke="#1a1818" stroke-width="2.5" fill="none"/>
                <rect x="172" y="125" width="16" height="70" stroke="#1a1818" stroke-width="2.5" fill="none"/>
                <polygon points="150,195 210,195 220,225 140,225" stroke="#1a1818" stroke-width="3" fill="none"/>
                <path d="M 40,140 Q 60,120 80,140 T 120,140" stroke="#1a1818" stroke-width="1.8" fill="none"/>
                <path d="M 240,130 Q 260,110 280,130 T 320,130" stroke="#1a1818" stroke-width="1.8" fill="none"/>
            `,
            jizuri: `
                <rect x="10" y="10" width="340" height="240" fill="#f0e2be"/>
                <path d="M 10,180 L 350,180 L 350,250 L 10,250 Z" fill="#dfcca0"/>
            `,
            aizuri: `
                <polygon points="180,60 160,80 200,80" fill="#586776"/>
                <polygon points="155,110 205,110 195,125 165,125" fill="#4d5c6b"/>
                <rect x="172" y="125" width="16" height="70" fill="#3f4e5c"/>
                <polygon points="150,195 210,195 220,225 140,225" fill="#344350"/>
            `,
            shuzuri: `
                <rect x="167" y="82" width="26" height="26" fill="#d44322"/>
                <circle cx="180" cy="95" r="8" fill="#fce484"/>
            `,
            bokashi: `
                <circle cx="180" cy="95" r="35" fill="url(#lanternGlow)" opacity="0.45"/>
            `
        }
    },
    {
        id: 'YUKINOTAKI',
        index: 5,
        kanji: '雪之滝',
        name: 'Snow Pavilion Falls',
        romaji: 'Yuki-no-taki',
        element: 'Ice & Cataract',
        province: 'Northern Gorges (奥羽)',
        desc: 'A roaring alpine waterfall frozen in crystalline ice ribbons flanked by heavy snow-laden bamboo groves.',
        layers: {
            bg: '#fbf8ee',
            jizuri: '#e8e6dc',
            aizuri: '#28465d',
            shuzuri: '#c43e26',
            gold: '#c4a654'
        },
        svgPaths: {
            keyblock: `
                <path d="M 10,20 L 120,40 L 130,220 L 10,240" stroke="#1a1818" stroke-width="3" fill="none"/>
                <path d="M 350,20 L 240,40 L 230,220 L 350,240" stroke="#1a1818" stroke-width="3" fill="none"/>
                <line x1="155" y1="40" x2="150" y2="230" stroke="#1a1818" stroke-width="2.2"/>
                <line x1="170" y1="40" x2="170" y2="230" stroke="#1a1818" stroke-width="2.5"/>
                <line x1="185" y1="40" x2="185" y2="230" stroke="#1a1818" stroke-width="2.5"/>
                <line x1="205" y1="40" x2="210" y2="230" stroke="#1a1818" stroke-width="2.2"/>
                <path d="M 60,110 Q 70,80 90,60 M 70,80 Q 50,75 40,90" stroke="#1a1818" stroke-width="2" fill="none"/>
                <path d="M 290,110 Q 280,80 260,60 M 280,80 Q 300,75 310,90" stroke="#1a1818" stroke-width="2" fill="none"/>
            `,
            jizuri: `
                <rect x="10" y="10" width="340" height="240" fill="#f2efe4"/>
                <path d="M 10,20 L 120,40 L 130,220 L 10,240 Z" fill="#dcd7c7"/>
                <path d="M 350,20 L 240,40 L 230,220 L 350,240 Z" fill="#dcd7c7"/>
            `,
            aizuri: `
                <rect x="140" y="40" width="80" height="190" fill="#2d5b7e"/>
                <path d="M 10,200 L 130,220 L 230,220 L 350,200 L 350,250 L 10,250 Z" fill="#1b394f"/>
            `,
            shuzuri: `
                <rect x="130" y="70" width="100" height="8" fill="#c43e26" stroke="#1a1818" stroke-width="1.8"/>
            `,
            bokashi: `
                <path d="M 140,40 L 220,40 L 210,60 L 150,60 Z" fill="#ffffff"/>
                <path d="M 130,210 Q 180,195 230,210 L 225,230 Q 180,220 135,230 Z" fill="#ffffff" opacity="0.85"/>
            `
        }
    },
    {
        id: 'ASAGIRI',
        index: 6,
        kanji: '朝霧村',
        name: 'Morning Mist Hamlet',
        romaji: 'Asagiri-mura',
        element: 'Mist & Earth',
        province: 'Inland Valley (甲斐国)',
        desc: 'Steep thatched farmhouse roofs appearing and vanishing through shifting purple mountain fog.',
        layers: {
            bg: '#fcf6e5',
            jizuri: '#ece0c0',
            aizuri: '#3b3d5b',
            shuzuri: '#c9452b',
            gold: '#cca542'
        },
        svgPaths: {
            keyblock: `
                <polygon points="120,130 60,180 180,180" stroke="#1a1818" stroke-width="3" fill="none"/>
                <polygon points="230,110 180,160 280,160" stroke="#1a1818" stroke-width="3" fill="none"/>
                <rect x="75" y="180" width="90" height="40" stroke="#1a1818" stroke-width="2" fill="none"/>
                <rect x="195" y="160" width="70" height="45" stroke="#1a1818" stroke-width="2" fill="none"/>
                <path d="M 10,80 Q 90,60 180,80 T 350,70 L 350,95 Q 260,110 180,95 T 10,105 Z" stroke="#1a1818" stroke-width="1.5" fill="none"/>
                <path d="M 10,140 Q 100,120 190,140 T 350,130 L 350,155 Q 270,170 190,155 T 10,165 Z" stroke="#1a1818" stroke-width="1.5" fill="none"/>
            `,
            jizuri: `
                <rect x="10" y="10" width="340" height="240" fill="#eee2c4"/>
                <polygon points="120,130 60,180 180,180" fill="#cbb382"/>
                <polygon points="230,110 180,160 280,160" fill="#cbb382"/>
            `,
            aizuri: `
                <path d="M 10,60 Q 90,40 180,60 T 350,50 L 350,110 Q 260,130 180,110 T 10,125 Z" fill="#4d4c6c" opacity="0.6"/>
                <path d="M 10,190 L 350,190 L 350,250 L 10,250 Z" fill="#2d3345"/>
            `,
            shuzuri: `
                <rect x="105" y="188" width="24" height="24" fill="#c9452b"/>
                <rect x="220" y="168" width="20" height="25" fill="#c9452b"/>
            `,
            bokashi: `
                <path d="M 10,135 Q 100,115 190,135 T 350,125 L 350,155 Q 270,170 190,155 T 10,165 Z" fill="#e2d6ed" opacity="0.8"/>
            `
        }
    },
    {
        id: 'RINDO',
        index: 7,
        kanji: '竜胆館',
        name: 'Bellflower Inn',
        romaji: 'Rindō-kan',
        element: 'Flora & Refuge',
        province: 'Mountain Crossroads (中山道)',
        desc: 'Hanging deep indigo noren shop curtains adorned with five-petaled bellflower mon crests.',
        layers: {
            bg: '#faf3dd',
            jizuri: '#eddcb4',
            aizuri: '#1a2e4f',
            shuzuri: '#c73a25',
            gold: '#d9a842'
        },
        svgPaths: {
            keyblock: `
                <rect x="20" y="50" width="320" height="20" stroke="#1a1818" stroke-width="3" fill="none"/>
                <rect x="40" y="70" width="80" height="120" stroke="#1a1818" stroke-width="2.5" fill="none"/>
                <rect x="140" y="70" width="80" height="120" stroke="#1a1818" stroke-width="2.5" fill="none"/>
                <rect x="240" y="70" width="80" height="120" stroke="#1a1818" stroke-width="2.5" fill="none"/>
                <circle cx="80" cy="120" r="22" stroke="#1a1818" stroke-width="2" fill="none"/>
                <circle cx="180" cy="120" r="22" stroke="#1a1818" stroke-width="2" fill="none"/>
                <circle cx="280" cy="120" r="22" stroke="#1a1818" stroke-width="2" fill="none"/>
            `,
            jizuri: `
                <rect x="10" y="10" width="340" height="240" fill="#efe0bc"/>
                <rect x="20" y="50" width="320" height="20" fill="#9e7b51"/>
            `,
            aizuri: `
                <rect x="40" y="70" width="80" height="120" fill="#1b3052"/>
                <rect x="140" y="70" width="80" height="120" fill="#1b3052"/>
                <rect x="240" y="70" width="80" height="120" fill="#1b3052"/>
            `,
            shuzuri: `
                <circle cx="80" cy="120" r="16" fill="#c73a25"/>
                <circle cx="180" cy="120" r="16" fill="#c73a25"/>
                <circle cx="280" cy="120" r="16" fill="#c73a25"/>
            `,
            bokashi: `
                <polygon points="80,108 84,118 94,120 86,126 88,136 80,130 72,136 74,126 66,120 76,118" fill="#faf5e8"/>
                <polygon points="180,108 184,118 194,120 186,126 188,136 180,130 172,136 174,126 166,120 176,118" fill="#faf5e8"/>
                <polygon points="280,108 284,118 294,120 286,126 288,136 280,130 272,136 274,126 266,120 276,118" fill="#faf5e8"/>
            `
        }
    },
    {
        id: 'HOSHIAI',
        index: 8,
        kanji: '星合之浜',
        name: 'Star-Conjunction Shore',
        romaji: 'Hoshiai-no-hama',
        element: 'Stars & Tide',
        province: 'Stellar Estuary (伊勢路)',
        desc: 'Tidal sand flats reflecting the Milky Way ribbon and celestial constellations under indigo skies.',
        layers: {
            bg: '#f6eed6',
            jizuri: '#e8dcbe',
            aizuri: '#102238',
            shuzuri: '#cc482b',
            gold: '#e2ba44'
        },
        svgPaths: {
            keyblock: `
                <path d="M 10,150 C 90,135 180,165 270,140 T 350,150" stroke="#1a1818" stroke-width="2" fill="none"/>
                <path d="M 10,180 C 100,165 190,195 280,170 T 350,180" stroke="#1a1818" stroke-width="2.5" fill="none"/>
                <path d="M 10,210 C 80,200 170,225 260,205 T 350,215" stroke="#1a1818" stroke-width="3" fill="none"/>
                <line x1="140" y1="120" x2="140" y2="175" stroke="#1a1818" stroke-width="3.5"/>
                <line x1="190" y1="120" x2="190" y2="175" stroke="#1a1818" stroke-width="3.5"/>
                <line x1="125" y1="125" x2="205" y2="125" stroke="#1a1818" stroke-width="4"/>
                <line x1="130" y1="138" x2="200" y2="138" stroke="#1a1818" stroke-width="3"/>
            `,
            jizuri: `
                <rect x="10" y="10" width="340" height="240" fill="#0d1827"/>
            `,
            aizuri: `
                <path d="M 10,140 C 90,125 180,155 270,130 T 350,140 L 350,250 L 10,250 Z" fill="#13263e"/>
            `,
            shuzuri: `
                <line x1="140" y1="120" x2="140" y2="175" stroke="#cc482b" stroke-width="3"/>
                <line x1="190" y1="120" x2="190" y2="175" stroke="#cc482b" stroke-width="3"/>
                <line x1="125" y1="125" x2="205" y2="125" stroke="#cc482b" stroke-width="3.5"/>
                <line x1="130" y1="138" x2="200" y2="138" stroke="#cc482b" stroke-width="2.5"/>
            `,
            bokashi: `
                <circle cx="60" cy="50" r="2.5" fill="#e8c34f"/>
                <circle cx="100" cy="35" r="3" fill="#e8c34f"/>
                <circle cx="140" cy="65" r="2" fill="#e8c34f"/>
                <circle cx="220" cy="40" r="3.5" fill="#e8c34f"/>
                <circle cx="260" cy="70" r="2.5" fill="#e8c34f"/>
                <circle cx="300" cy="45" r="3" fill="#e8c34f"/>
                <line x1="60" y1="50" x2="100" y2="35" stroke="#e8c34f" stroke-width="0.8" opacity="0.6"/>
                <line x1="100" y1="35" x2="140" y2="65" stroke="#e8c34f" stroke-width="0.8" opacity="0.6"/>
                <line x1="220" y1="40" x2="260" y2="70" stroke="#e8c34f" stroke-width="0.8" opacity="0.6"/>
                <line x1="260" y1="70" x2="300" y2="45" stroke="#e8c34f" stroke-width="0.8" opacity="0.6"/>
            `
        }
    },
    {
        id: 'KAMINARI',
        index: 9,
        kanji: '雷平',
        name: 'Thunderclap Plateau',
        romaji: 'Kaminari-daira',
        element: 'Lightning & Crags',
        province: 'Highland Volcanics (信濃国)',
        desc: 'Jagged golden lightning bolts striking down upon stark indigo basalt pillars beneath dark storm clouds.',
        layers: {
            bg: '#f8f1db',
            jizuri: '#ead9b6',
            aizuri: '#161e2a',
            shuzuri: '#ca3e23',
            gold: '#e4b632'
        },
        svgPaths: {
            keyblock: `
                <path d="M 10,40 Q 60,10 120,35 Q 180,5 240,30 Q 300,10 350,45" stroke="#1a1818" stroke-width="4" fill="none"/>
                <polygon points="180,40 160,100 175,100 145,170 190,95 172,95" stroke="#1a1818" stroke-width="2" fill="none"/>
                <polygon points="60,240 70,160 110,150 120,240" stroke="#1a1818" stroke-width="3" fill="none"/>
                <polygon points="220,240 230,140 270,130 285,240" stroke="#1a1818" stroke-width="3" fill="none"/>
            `,
            jizuri: `
                <rect x="10" y="10" width="340" height="240" fill="#202530"/>
            `,
            aizuri: `
                <polygon points="60,240 70,160 110,150 120,240" fill="#131924"/>
                <polygon points="220,240 230,140 270,130 285,240" fill="#131924"/>
                <path d="M 10,40 Q 60,10 120,35 Q 180,5 240,30 Q 300,10 350,45 L 350,10 L 10,10 Z" fill="#0f141d"/>
            `,
            shuzuri: `
                <circle cx="70" cy="165" r="5" fill="#ca3e23"/>
                <circle cx="230" cy="145" r="5" fill="#ca3e23"/>
            `,
            bokashi: `
                <polygon points="180,40 160,100 175,100 145,170 190,95 172,95" fill="#f2c83b"/>
            `
        }
    }
];

class WoodblockEngine {
    constructor() {
        this.currentStation = null;
        this.lockedStations = [];
        this.maxAddressLength = 7;
        this.container = null;
        this.canvasElem = null;
        this.fudaSlotsElem = null;
    }

    init(containerId = 'woodblock-stage') {
        this.container = document.getElementById(containerId);
        this.fudaSlotsElem = document.getElementById('fuda-slots');
        this.renderFudaSlots();
        this.renderEmptyStage();
    }

    renderFudaSlots() {
        if (!this.fudaSlotsElem) return;
        let html = '';
        for (let i = 0; i < this.maxAddressLength; i++) {
            html += `
                <div class="fuda-slot" id="fuda-slot-${i}" data-index="${i}">
                    <div class="fuda-tag">
                        <div class="fuda-hole"></div>
                        <div class="fuda-num">${i + 1}</div>
                        <div class="fuda-kanji">-</div>
                        <div class="fuda-seal"></div>
                    </div>
                </div>
            `;
        }
        this.fudaSlotsElem.innerHTML = html;
    }

    renderEmptyStage() {
        if (!this.container) return;
        this.container.innerHTML = `
            <div class="woodblock-frame">
                <!-- Registration Kento notches -->
                <div class="kento-notch top-left"></div>
                <div class="kento-notch bottom-right"></div>
                
                <!-- Main print plate -->
                <div class="print-plate" id="print-plate">
                    <svg viewBox="0 0 360 260" class="print-svg" id="stage-svg">
                        <defs>
                            <linearGradient id="dawnGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stop-color="#c73d2a" stop-opacity="0.8"/>
                                <stop offset="100%" stop-color="#f4e7c3" stop-opacity="0"/>
                            </linearGradient>
                            <linearGradient id="pineGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stop-color="#1b4d3e" stop-opacity="0.7"/>
                                <stop offset="100%" stop-color="#ede0be" stop-opacity="0"/>
                            </linearGradient>
                            <radialGradient id="lanternGlow" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stop-color="#f8a436" stop-opacity="0.9"/>
                                <stop offset="100%" stop-color="#f0e0b6" stop-opacity="0"/>
                            </radialGradient>
                        </defs>
                        
                        <!-- Empty Washi Ground -->
                        <rect x="0" y="0" width="360" height="260" fill="#f8f2dc" class="base-washi"/>
                        <g id="layer-jizuri" class="woodblock-layer"></g>
                        <g id="layer-aizuri" class="woodblock-layer"></g>
                        <g id="layer-shuzuri" class="woodblock-layer"></g>
                        <g id="layer-bokashi" class="woodblock-layer"></g>
                        <g id="layer-keyblock" class="woodblock-layer"></g>
                    </svg>

                    <!-- Aperture Vortex Container (for activation stages) -->
                    <div class="aperture-overlay" id="aperture-overlay">
                        <div class="vortex-rings" id="vortex-rings">
                            <div class="wave-ring ring-1"></div>
                            <div class="wave-ring ring-2"></div>
                            <div class="wave-ring ring-3"></div>
                            <div class="wave-crest-burst" id="wave-burst"></div>
                        </div>
                    </div>

                    <!-- Seal Stamp overlay (Inkan) -->
                    <div class="official-seal" id="official-seal">
                        <span>関所<br>認可</span>
                    </div>

                    <!-- Station Cartouche overlay -->
                    <div class="print-cartouche" id="print-cartouche">
                        <div class="tanzaku-title" id="cartouche-kanji">雲路関所</div>
                        <div class="tanzaku-sub" id="cartouche-name">Select Station</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Staged Woodblock Stamping sequence for a newly locked station
     * Builds up the station print layer by layer:
     * 1. Keyblock (Omohan)
     * 2. Earth Wash (Jizuri)
     * 3. Indigo/Prussian Blue (Aizuri)
     * 4. Vermillion Cinnabar (Shuzuri)
     * 5. Bokashi & Hanko Seal
     */
    stampStation(station, lockIndex, onComplete = null, isFast = false) {
        this.currentStation = station;
        const stageSvg = document.getElementById('stage-svg');
        const gKey = document.getElementById('layer-keyblock');
        const gJi = document.getElementById('layer-jizuri');
        const gAi = document.getElementById('layer-aizuri');
        const gShu = document.getElementById('layer-shuzuri');
        const gBok = document.getElementById('layer-bokashi');
        const cartKanji = document.getElementById('cartouche-kanji');
        const cartName = document.getElementById('cartouche-name');
        const officialSeal = document.getElementById('official-seal');

        if (!stageSvg || !gKey) return;

        // Update Cartouche info
        cartKanji.textContent = station.kanji;
        cartName.textContent = station.name;

        // Reset layers
        gKey.innerHTML = '';
        gJi.innerHTML = '';
        gAi.innerHTML = '';
        gShu.innerHTML = '';
        gBok.innerHTML = '';
        officialSeal.classList.remove('stamped');

        // Play initial woodblock sound
        window.UkiyoeAudio.playWoodblockStamp(1);

        // Step 1: Stamp Keyblock Outline (Omohan)
        gKey.innerHTML = station.svgPaths.keyblock;
        gKey.classList.add('stamping-drop');

        // Update Fuda Slot tag
        this.updateFudaTag(lockIndex, station);

        const stepTime = isFast ? 40 : 80;

        // Step 2: Stamp Jizuri (Earth Base Wash)
        setTimeout(() => {
            gJi.innerHTML = station.svgPaths.jizuri;
            gJi.classList.add('stamping-drop');
            window.UkiyoeAudio.playWoodblockStamp(2);
        }, stepTime);

        // Step 3: Stamp Aizuri (Prussian Blue Indigo)
        setTimeout(() => {
            gAi.innerHTML = station.svgPaths.aizuri;
            gAi.classList.add('stamping-drop');
            window.UkiyoeAudio.playWoodblockStamp(3);
        }, stepTime * 2);

        // Step 4: Stamp Shuzuri (Vermillion Accent)
        setTimeout(() => {
            gShu.innerHTML = station.svgPaths.shuzuri;
            gShu.classList.add('stamping-drop');
            window.UkiyoeAudio.playWoodblockStamp(4);
        }, stepTime * 3);

        // Step 5: Bokashi Gradient & Official Seal
        setTimeout(() => {
            gBok.innerHTML = station.svgPaths.bokashi;
            gBok.classList.add('stamping-drop');
            officialSeal.classList.add('stamped');
            window.UkiyoeAudio.playWoodblockStamp(5);
            if (onComplete) onComplete();
        }, stepTime * 4);
    }

    updateFudaTag(index, station) {
        const slot = document.getElementById(`fuda-slot-${index}`);
        if (!slot) return;
        slot.classList.add('locked');
        const kanjiElem = slot.querySelector('.fuda-kanji');
        const sealElem = slot.querySelector('.fuda-seal');
        if (kanjiElem) kanjiElem.textContent = station.kanji;
        if (sealElem) sealElem.textContent = '印';
    }

    clearFudaSlots() {
        for (let i = 0; i < this.maxAddressLength; i++) {
            const slot = document.getElementById(`fuda-slot-${i}`);
            if (slot) {
                slot.classList.remove('locked');
                const kanjiElem = slot.querySelector('.fuda-kanji');
                if (kanjiElem) kanjiElem.textContent = '-';
            }
        }
    }

    resetStage() {
        this.renderEmptyStage();
        this.clearFudaSlots();
        this.currentStation = null;
    }
}

// Global instance
window.WoodblockEngine = new WoodblockEngine();
