/**
 * VXD-9000 Celestial Ephemeris Catalog & Preset Archives
 * Mount Tycho Zenith Fulldome Observatory & Public Sky Theatre
 */

const VXD_SECTORS = [
  {
    id: 0,
    code: 'APX',
    name: 'Apex Cygnis',
    azimuth: 0.0,
    declination: '+45° 16\' 49"',
    epoch: 'CYG-001',
    description: 'Zenith apex coordinate of the Cygnus optical arm',
    glyphSvg: '<path d="M14 4 L14 24 M4 14 L24 14 M7 7 L21 21 M7 21 L21 7" />'
  },
  {
    id: 1,
    code: 'CRN',
    name: 'Corona Borealis',
    azimuth: 30.0,
    declination: '+26° 42\' 50"',
    epoch: 'CRN-002',
    description: 'Northern crown radiant with hyper-bright Gemma node',
    glyphSvg: '<path d="M5 19 Q14 24 23 19 L21 9 L14 15 L7 9 Z" />'
  },
  {
    id: 2,
    code: 'VEL',
    name: 'Vela Australis',
    azimuth: 60.0,
    declination: '-47° 10\' 01"',
    epoch: 'VEL-003',
    description: 'Southern sail false cross & gum nebula ionization front',
    glyphSvg: '<path d="M6 22 L22 22 L22 6 L6 22 M14 6 L14 22" />'
  },
  {
    id: 3,
    code: 'VTX',
    name: 'Vortex Nebula',
    azimuth: 90.0,
    declination: '+13° 05\' 32"',
    epoch: 'VTX-004',
    description: 'Relativistic spiral dust lane with infrared collimation',
    glyphSvg: '<circle cx="14" cy="14" r="9" stroke-dasharray="3 3"/><circle cx="14" cy="14" r="4"/><path d="M14 5 L14 1 M14 27 L14 23 M5 14 L1 14 M27 14 L23 14"/>'
  },
  {
    id: 4,
    code: 'PLH',
    name: 'Pleiades Hyperion',
    azimuth: 120.0,
    declination: '+24° 07\' 00"',
    epoch: 'PLH-005',
    description: 'Seven sisters open cluster with blue reflection veil',
    glyphSvg: '<circle cx="8" cy="8" r="2"/><circle cx="15" cy="7" r="2"/><circle cx="21" cy="10" r="2"/><circle cx="10" cy="15" r="2"/><circle cx="17" cy="16" r="2"/><circle cx="13" cy="22" r="2"/><path d="M8 8 L15 7 L21 10 L17 16 L10 15 Z"/>'
  },
  {
    id: 5,
    code: 'ERI',
    name: 'Eridanus Alpha',
    azimuth: 150.0,
    declination: '-57° 14\' 12"',
    epoch: 'ERI-006',
    description: 'Celestial river terminus & high-rotational Achernar axis',
    glyphSvg: '<path d="M6 7 Q14 2 20 8 T16 20 T8 22" />'
  },
  {
    id: 6,
    code: 'LYR',
    name: 'Lyra Chronos',
    azimuth: 180.0,
    declination: '+38° 47\' 01"',
    epoch: 'LYR-007',
    description: 'Vega celestial chronometer anchor & ring nebula lens',
    glyphSvg: '<polygon points="14,4 22,11 19,23 9,23 6,11" /><circle cx="14" cy="14" r="3"/>'
  },
  {
    id: 7,
    code: 'ORI',
    name: 'Orion Vectis',
    azimuth: 210.0,
    declination: '-05° 23\' 28"',
    epoch: 'ORI-008',
    description: 'Belt trifecta and Trapezium stellar nursery cluster',
    glyphSvg: '<path d="M7 6 L21 6 L14 14 L22 22 L6 22 L14 14 Z M10 14 L18 14" />'
  },
  {
    id: 8,
    code: 'HYD',
    name: 'Hydra Prime',
    azimuth: 240.0,
    declination: '-08° 39\' 30"',
    epoch: 'HYD-009',
    description: 'Serpentine meridian chain stretching over 100 degrees',
    glyphSvg: '<path d="M5 14 Q10 7 14 14 T23 14 M9 10 L9 18 M19 10 L19 18" />'
  },
  {
    id: 9,
    code: 'CAS',
    name: 'Cassiopeia Lux',
    azimuth: 270.0,
    declination: '+60° 43\' 00"',
    epoch: 'CAS-010',
    description: 'Circumpolar queen W-formation with supernova remnant A',
    glyphSvg: '<polyline points="5,9 9,19 14,10 19,19 23,9" />'
  },
  {
    id: 10,
    code: 'TAU',
    name: 'Taurus Radiata',
    azimuth: 300.0,
    declination: '+16° 30\' 33"',
    epoch: 'TAU-011',
    description: 'Aldebaran red giant eye with Hyades convergent cluster',
    glyphSvg: '<circle cx="14" cy="17" r="6"/><path d="M7 7 C8 12 11 12 14 12 C17 12 20 12 21 7" />'
  },
  {
    id: 11,
    code: 'SGR',
    name: 'Sagittarius Arc',
    azimuth: 330.0,
    declination: '-29° 00\' 28"',
    epoch: 'SGR-012',
    description: 'Galactic center stellar arm vector and teapot asterism',
    glyphSvg: '<path d="M5 23 L23 5 M13 5 L23 5 L23 15 M7 13 L15 21" />'
  }
];

const VXD_PRESETS = [
  // Tier 1: Public Educational Sky Shows
  {
    id: 0,
    tier: 1,
    slug: 'solstice-apex',
    name: 'Solstice Midnight Apex',
    epoch: 'SUMMER // 2088',
    description: 'Zenith hyperion cluster & northern crown meridian transit.',
    sequence: ['APX', 'CRN', 'PLH', 'LYR', 'CAS']
  },
  {
    id: 1,
    tier: 1,
    slug: 'perseid-radiant',
    name: 'Perseid Meteor Zenith',
    epoch: 'ANNUAL // PEAK',
    description: 'High-radiant annual meteor shower with atmospheric ionized trails.',
    sequence: ['CAS', 'TAU', 'VTX', 'ORI', 'APX']
  },
  {
    id: 2,
    tier: 1,
    slug: 'boreal-aurora',
    name: 'Boreal Aurora Veil',
    epoch: 'IONOSPHERE // G5',
    description: 'Geomagnetic curtain emission overlaid upon equatorial field stars.',
    sequence: ['CRN', 'VEL', 'ERI', 'HYD', 'SGR']
  },

  // Tier 2: Deep-Sky Archaeo-Astrophysics
  {
    id: 3,
    tier: 2,
    slug: 'pleiades-void',
    name: 'Pleiades Void Horizon',
    epoch: 'TAU-0441 // INFRA',
    description: 'Relativistic blue reflection nebula analysis with dust veil collimation.',
    sequence: ['PLH', 'ERI', 'VTX', 'ORI', 'HYD']
  },
  {
    id: 4,
    tier: 2,
    slug: 'galactic-core',
    name: 'Galactic Core Sagittarius-A*',
    epoch: 'SUPERMASSIVE // S2',
    description: 'Gravitational accretion boundary & dense galactic center stellar orbits.',
    sequence: ['SGR', 'APX', 'TAU', 'LYR', 'VEL']
  },
  {
    id: 5,
    tier: 2,
    slug: 'carina-nursery',
    name: 'Carina Nebula Micro-Lensing',
    epoch: 'PROTO-STELLAR // 8K',
    description: 'Deep infrared stellar nursery collimation with high-density proto-stars.',
    sequence: ['VTX', 'HYD', 'CAS', 'CRN', 'PLH']
  }
];

window.VXD_SECTORS = VXD_SECTORS;
window.VXD_PRESETS = VXD_PRESETS;
