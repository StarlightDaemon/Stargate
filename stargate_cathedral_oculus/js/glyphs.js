/**
 * The 12 Celestial Glyphs of the Vitrarium of Lumisfer
 * Original iconographic definitions for Gothic Stained Glass Oculus.
 */
const GLYPHS = [
  {
    id: 1,
    name: "Lumen Solis",
    latin: "Apex Radians",
    color: "#E69C24", // Amber Gold
    glowColor: "rgba(230, 156, 36, 0.7)",
    lightColor: "#FFD275",
    description: "The Solar Apex - Sovereign light piercing the celestial equator.",
    path: "M 50 15 L 56 38 L 80 28 L 62 48 L 85 62 L 60 65 L 70 88 L 48 72 L 32 90 L 38 66 L 15 65 L 36 48 L 20 28 L 44 38 Z"
  },
  {
    id: 2,
    name: "Chorda Stellae",
    latin: "Harmonia Astralium",
    color: "#1E58A8", // Cobalt Sapphire
    glowColor: "rgba(30, 88, 168, 0.7)",
    lightColor: "#5B96E8",
    description: "The Interlocking Chord - Triune celestial harmonic web.",
    path: "M 50 18 L 82 72 L 18 72 Z M 50 82 L 18 28 L 82 28 Z"
  },
  {
    id: 3,
    name: "Aquila Ventus",
    latin: "Ala Firmamenti",
    color: "#1E8A84", // Tourmaline Teal
    glowColor: "rgba(30, 138, 132, 0.7)",
    lightColor: "#4AD8CF",
    description: "The Windward Crest - Winged ascent through the upper spheres.",
    path: "M 50 20 C 65 35 85 40 85 58 C 85 75 68 80 50 85 C 32 80 15 75 15 58 C 15 40 35 35 50 20 Z M 50 38 C 42 48 30 55 30 65 C 30 72 38 75 50 78 C 62 75 70 72 70 65 C 70 55 58 48 50 38 Z"
  },
  {
    id: 4,
    name: "Rosa Mystica",
    latin: "Flos Consecratus",
    color: "#B81D39", // Deep Ruby Crimson
    glowColor: "rgba(184, 29, 57, 0.7)",
    lightColor: "#FA5575",
    description: "The Sacred Hexagonal Petal - Unfolding geometry of the chantry.",
    path: "M 50 15 C 60 15 68 25 68 35 C 78 35 85 45 85 55 C 85 65 75 75 65 75 C 65 85 55 88 50 88 C 45 88 35 85 35 75 C 25 75 15 65 15 55 C 15 45 22 35 32 35 C 32 25 40 15 50 15 Z M 50 40 A 10 10 0 1 0 50 60 A 10 10 0 1 0 50 40 Z"
  },
  {
    id: 5,
    name: "Navis Aethelis",
    latin: "Cymba Aethetica",
    color: "#6B2B8E", // Imperial Amethyst
    glowColor: "rgba(107, 43, 142, 0.7)",
    lightColor: "#AA60D6",
    description: "The Firmament Vessel - Ark navigating the stellar currents.",
    path: "M 15 52 C 25 78 75 78 85 52 L 80 46 C 70 68 30 68 20 46 Z M 50 18 L 50 50 M 35 28 L 50 18 L 65 28"
  },
  {
    id: 6,
    name: "Flamma Sancta",
    latin: "Ignis Perpetuus",
    color: "#D65A16", // Topaz Flame
    glowColor: "rgba(214, 90, 22, 0.7)",
    lightColor: "#FF8E4D",
    description: "The Vigil Flame - Undying ember of the dawn watch.",
    path: "M 50 15 C 50 15 75 40 75 62 C 75 78 64 88 50 88 C 36 88 25 78 25 62 C 25 40 50 15 50 15 Z M 50 38 C 50 38 62 52 62 65 C 62 72 56 78 50 78 C 44 78 38 72 38 65 C 38 52 50 38 50 38 Z"
  },
  {
    id: 7,
    name: "Corona Borealis",
    latin: "Diadema Septentrionis",
    color: "#167D45", // Emerald Viridian
    glowColor: "rgba(22, 125, 69, 0.7)",
    lightColor: "#4BE38E",
    description: "The Northern Diadem - Sevenfold crown of astral alignment.",
    path: "M 20 72 L 18 35 L 34 50 L 50 25 L 66 50 L 82 35 L 80 72 Z M 25 65 L 75 65 L 73 55 L 27 55 Z"
  },
  {
    id: 8,
    name: "Fons Vitae",
    latin: "Scaturigo Aeterna",
    color: "#156FA3", // Mediterranean Cerulean
    glowColor: "rgba(21, 111, 163, 0.7)",
    lightColor: "#58B8F2",
    description: "The Living Wellspring - Crystalline source of ethereal flow.",
    path: "M 50 18 C 38 32 30 45 30 60 C 30 75 39 85 50 85 C 61 85 70 75 70 60 C 70 45 62 32 50 18 Z M 20 62 C 20 62 32 68 50 68 C 68 68 80 62 80 62 M 25 74 C 25 74 35 80 50 80 C 65 80 75 74 75 74"
  },
  {
    id: 9,
    name: "Turris Eburnea",
    latin: "Pila Fundamentalis",
    color: "#C2A649", // Opaline Brass / Ashlar Gold
    glowColor: "rgba(194, 166, 73, 0.7)",
    lightColor: "#F5DF8C",
    description: "The Keystone Pillar - Load-bearing foundation of the firmament.",
    path: "M 50 15 L 62 32 L 62 75 L 72 85 L 28 85 L 38 75 L 38 32 Z M 44 40 L 56 40 L 56 55 L 44 55 Z M 44 62 L 56 62 L 56 75 L 44 75 Z"
  },
  {
    id: 10,
    name: "Vesper Umbra",
    latin: "Thuribulum Crepusculi",
    color: "#46307B", // Deep Indigo Violet
    glowColor: "rgba(70, 48, 123, 0.7)",
    lightColor: "#8D72D6",
    description: "The Twilight Censer - Sacred smoke veiling the night watch.",
    path: "M 50 15 L 50 35 M 30 45 C 30 35 70 35 70 45 L 65 72 C 65 82 35 82 35 72 Z M 25 45 L 75 45 M 40 55 A 4 4 0 1 0 40 63 A 4 4 0 1 0 40 55 Z M 60 55 A 4 4 0 1 0 60 63 A 4 4 0 1 0 60 55 Z"
  },
  {
    id: 11,
    name: "Oculus Vigilans",
    latin: "Fenestra Divina",
    color: "#BF8216", // Saffron Ochre
    glowColor: "rgba(191, 130, 22, 0.7)",
    lightColor: "#F7B84F",
    description: "The All-Seeing Arch - The watchful lens overlooking creation.",
    path: "M 15 50 C 15 50 32 25 50 25 C 68 25 85 50 85 50 C 85 50 68 75 50 75 C 32 75 15 50 15 50 Z M 50 36 A 14 14 0 1 0 50 64 A 14 14 0 1 0 50 36 Z M 50 44 A 6 6 0 1 0 50 56 A 6 6 0 1 0 50 44 Z"
  },
  {
    id: 12,
    name: "Manus Vitrarii",
    latin: "Circinus Artificis",
    color: "#9C224B", // Garnet Madder
    glowColor: "rgba(156, 34, 75, 0.7)",
    lightColor: "#E65E8A",
    description: "The Artificer's Compass - Diamond cutting the cosmic crystal.",
    path: "M 50 15 L 80 50 L 50 85 L 20 50 Z M 50 30 L 70 50 L 50 70 L 30 50 Z M 46 22 L 54 22 L 54 78 L 46 78 Z M 22 46 L 78 46 L 78 54 L 22 54 Z"
  }
];

const PRESETS = [
  // Tier I: Inner Sanctum Sanctorum (Prime Meridians)
  {
    id: "preset-1",
    name: "Basilica of the Dawn Spire",
    latin: "Basilica Spirae Aurorae",
    tier: 1,
    tierName: "Tier I: Inner Sanctum Sanctorum",
    sequence: [1, 4, 6, 2, 8, 11, 5],
    note: "Prime Solar Meridian - Continuous Harmonic Convergence"
  },
  {
    id: "preset-2",
    name: "Abbey of the Cobalt Vaults",
    latin: "Abbatia Fornicis Cobalti",
    tier: 1,
    tierName: "Tier I: Inner Sanctum Sanctorum",
    sequence: [3, 7, 1, 9, 4, 2, 10],
    note: "Sanctuary of the Abyssal Blue Liturgies"
  },
  {
    id: "preset-3",
    name: "Chantry of the Golden Meridian",
    latin: "Cantoria Meridiei Aureae",
    tier: 1,
    tierName: "Tier I: Inner Sanctum Sanctorum",
    sequence: [2, 5, 8, 11, 1, 6, 12],
    note: "Great Solstitial Equilibrium Axis"
  },
  {
    id: "preset-4",
    name: "Crypt of the Obsidian Altar",
    latin: "Crypta Altaris Obsidiani",
    tier: 1,
    tierName: "Tier I: Inner Sanctum Sanctorum",
    sequence: [6, 9, 12, 3, 7, 10, 4],
    note: "Deep Foundation Keystone & Nocturnal Watch"
  },

  // Tier II: Outer Pilgrim Voids (Trans-Aetheric Sanctuaries)
  {
    id: "preset-5",
    name: "Hermitage of the Northern Apex",
    latin: "Eremus Apicis Borealis",
    tier: 2,
    tierName: "Tier II: Outer Pilgrim Voids",
    sequence: [7, 2, 11, 5, 9, 1, 8],
    note: "Hyperborean Horizon - Cold Light Spires"
  },
  {
    id: "preset-6",
    name: "Citadel of the Astral Cloister",
    latin: "Arx Claustri Astralis",
    tier: 2,
    tierName: "Tier II: Outer Pilgrim Voids",
    sequence: [4, 8, 12, 3, 6, 10, 2],
    note: "Orbital Vitrarium in the High Ether"
  },
  {
    id: "preset-7",
    name: "Watchtower of the Solstice Sea",
    latin: "Specula Maris Solstitialis",
    tier: 2,
    tierName: "Tier II: Outer Pilgrim Voids",
    sequence: [5, 1, 10, 3, 8, 12, 7],
    note: "Tidal Resonator on the Glass Coast"
  },
  {
    id: "preset-8",
    name: "Sanctuary of the Seven Weavers",
    latin: "Sanctuarium Septem Textorum",
    tier: 2,
    tierName: "Tier II: Outer Pilgrim Voids",
    sequence: [9, 3, 7, 12, 2, 6, 11],
    note: "Trans-Cosmic Prism Loom Coordinate"
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GLYPHS, PRESETS };
}
