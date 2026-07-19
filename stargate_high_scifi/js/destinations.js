// Surveyed routes. Every destination, coordinate and signature is fictional.
// A signature is 8 glyph indices (0..34); the 9th slot is always ERIDU (35),
// Meridian's local anchor. Signatures must be unique.

export const DESTINATIONS = [
  {
    id: 'tessera',
    name: 'TESSERA',
    epithet: 'the Garden of Right Angles',
    cls: 'CRYSTALLINE HABITAT',
    distanceLy: 412,
    signature: [3, 17, 8, 24, 1, 30, 12, 6],
    hazard: 'LOW — geometry is load-bearing; do not lean on the air',
    palette: { nebula: ['#123a4f', '#0e2a52', '#1c4a3e'], star: '#bfe9ff', glow: '#8fd8ff' },
    probe: [
      'atmosphere 0.81 bar, argon-rich, breathable with filter',
      'ambient light: refracted, source not located',
      'flora: cubic. fauna: none observed. paths: self-sweeping',
    ],
  },
  {
    id: 'khione',
    name: 'KHIONE DEEP',
    epithet: 'ocean under the ice of a rogue planet',
    cls: 'SUBGLACIAL OCEAN VAULT',
    distanceLy: 1088,
    signature: [22, 4, 29, 11, 33, 2, 19, 27],
    hazard: 'MODERATE — aperture opens 40 m below pack ice; pressure lock required',
    palette: { nebula: ['#062033', '#0a3548', '#03141f'], star: '#9fd4e8', glow: '#5fb8d8' },
    probe: [
      'water column 96 km, liquid, 2.1 °C at vault depth',
      'bioluminescent ring structures at 300 m — repeating primes',
      'probe hull singing at 12 Hz. cause unknown. recovering',
    ],
  },
  {
    id: 'spindle',
    name: 'THE SPINDLE',
    epithet: 'a habitat drawn out to a thread',
    cls: 'ROTATING FILAMENT STATION',
    distanceLy: 96,
    signature: [7, 31, 14, 0, 26, 9, 34, 18],
    hazard: 'LOW — spin gravity varies along the thread; mind the gradient',
    palette: { nebula: ['#3a2a10', '#4f3512', '#241a08'], star: '#ffe2b0', glow: '#ffc878' },
    probe: [
      'filament length 3,140 km, diameter 40 m at waist',
      'interior lit by a captive ribbon of plasma, dawn-coloured',
      'occupancy: 12,000 estimated. all asleep. shift change unknown',
    ],
  },
  {
    id: 'vantage',
    name: 'VANTAGE',
    epithet: 'observation deck above a slow nova',
    cls: 'STELLAR OBSERVATORY',
    distanceLy: 7211,
    signature: [15, 28, 5, 21, 10, 32, 25, 13],
    hazard: 'HIGH — shutter discipline mandatory; the light remembers being looked at',
    palette: { nebula: ['#4f1a2a', '#6a2a12', '#2a0e1f'], star: '#ffd0c0', glow: '#ff9a7a' },
    probe: [
      'nova shell expanding at 0.04 c, aestheticized by deck optics',
      'deck instruments already calibrated. by whom, unclear',
      'guest ledger: last entry 400,000 years ago. pen still warm',
    ],
  },
  {
    id: 'undercroft',
    name: 'THE UNDERCROFT',
    epithet: 'the builders’ archive, shelved in stone',
    cls: 'ARCHIVE INTERIOR',
    distanceLy: 15904,
    signature: [20, 6, 33, 16, 2, 23, 8, 29],
    hazard: 'MODERATE — index unshelved; do not answer the catalogue',
    palette: { nebula: ['#1a2a1a', '#243a20', '#0e1a10'], star: '#cfe8c0', glow: '#9fd88a' },
    probe: [
      'vault extends beyond ranging. shelving: basalt, dustless',
      'each shelf holds one object and one apology',
      'probe requested a lexicon. request acknowledged. queue position 10^9',
    ],
  },
  {
    id: 'halcyon',
    name: 'HALCYON SHOAL',
    epithet: 'a reef where gravity runs shallow',
    cls: 'EXOTIC-MATTER SHOAL',
    distanceLy: 233,
    signature: [12, 1, 27, 34, 19, 4, 30, 22],
    hazard: 'LOW — buoyant region; tether all instruments and all personnel',
    palette: { nebula: ['#0f3a3a', '#155a4a', '#0a2028'], star: '#b0ffe8', glow: '#6fe8c8' },
    probe: [
      'local g oscillates 0.02–0.4; the shoal breathes on a 9-minute swell',
      'condensate blooms drifting like kelp. taste reported: cold pewter',
      'probe is floating. probe is content. retrieval declined',
    ],
  },
  {
    id: 'aperture-prime',
    name: 'APERTURE PRIME',
    epithet: 'the builders’ origin hub',
    cls: 'ORIGIN HUB — RESTRICTED',
    distanceLy: 26041,
    signature: [35, 9, 35, 3, 35, 26, 35, 17],
    refuse: true,
    hazard: 'UNKNOWN — Meridian has declined this route 214 times',
    palette: { nebula: ['#222222', '#333333', '#111111'], star: '#ffffff', glow: '#ffffff' },
    probe: [],
  },
];

export function findBySignature(sig) {
  return DESTINATIONS.find(d =>
    d.signature.length === sig.length && d.signature.every((g, i) => g === sig[i]));
}

export function byId(id) {
  return DESTINATIONS.find(d => d.id === id);
}
