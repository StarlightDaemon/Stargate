/**
 * CelestialNavigation - Astrometric Position Fix Engine & Almanac
 * Hyperion Astronavigation Institute // Series IX Digital Astrolabe
 * Resolves vessel coordinates via Marcq Saint-Hilaire intercept method.
 */

const NAV_STARS = [
  {
    id: 'nav-1',
    index: 0,
    name: 'Alpha Hydrae',
    bayer: 'α Hya',
    designation: 'HYP-0927',
    spectral: 'K3 II-III',
    mag: 1.98,
    ra: '09h 27m 35s',
    dec: "-08° 39' 30\"",
    raDeg: 141.896,
    decDeg: -8.658,
    targetAlt: 34.2,
    targetAz: 124.6,
    color: '#ffb366',
    desc: 'Solitary orange giant serving as prime equatorial reference meridian.',
    reteAngle: (0 * 30), // fixed angular position on Rete wheel
    reteRadiusFactor: 0.72
  },
  {
    id: 'nav-2',
    index: 1,
    name: 'Arcturus-Major',
    bayer: 'α Boo',
    designation: 'HYP-1415',
    spectral: 'K0 III',
    mag: -0.05,
    ra: '14h 15m 39s',
    dec: "+19° 10' 56\"",
    raDeg: 213.915,
    decDeg: 19.182,
    targetAlt: 58.7,
    targetAz: 212.4,
    color: '#ffcc88',
    desc: 'High proper-motion benchmark star for hyper-meridian velocity calibration.',
    reteAngle: (1 * 30),
    reteRadiusFactor: 0.55
  },
  {
    id: 'nav-3',
    index: 2,
    name: 'Vega-Septentrion',
    bayer: 'α Lyr',
    designation: 'HYP-1836',
    spectral: 'A0 Va',
    mag: 0.03,
    ra: '18h 36m 56s',
    dec: "+38° 47' 01\"",
    raDeg: 279.234,
    decDeg: 38.783,
    targetAlt: 72.4,
    targetAz: 342.1,
    color: '#d0f0ff',
    desc: 'Photometric baseline standard for deep-space zenith alignment.',
    reteAngle: (2 * 30),
    reteRadiusFactor: 0.42
  },
  {
    id: 'nav-4',
    index: 3,
    name: 'Canopus-Australis',
    bayer: 'α Car',
    designation: 'HYP-0623',
    spectral: 'F0 II',
    mag: -0.74,
    ra: '06h 23m 57s',
    dec: "-52° 41' 44\"",
    raDeg: 95.987,
    decDeg: -52.695,
    targetAlt: 21.8,
    targetAz: 178.5,
    color: '#f8f8ff',
    desc: 'Ultra-luminous supergiant anchoring southern quadrant navigation planes.',
    reteAngle: (3 * 30),
    reteRadiusFactor: 0.88
  },
  {
    id: 'nav-5',
    index: 4,
    name: 'Rigel-Prime',
    bayer: 'β Ori',
    designation: 'HYP-0514',
    spectral: 'B8 Ia',
    mag: 0.13,
    ra: '05h 14m 32s',
    dec: "-08° 12' 06\"",
    raDeg: 78.634,
    decDeg: -8.201,
    targetAlt: 46.1,
    targetAz: 88.3,
    color: '#aae0ff',
    desc: 'Blue-white supergiant with intense optical luminosity along Orion arm.',
    reteAngle: (4 * 30),
    reteRadiusFactor: 0.64
  },
  {
    id: 'nav-6',
    index: 5,
    name: 'Deneb-Cygnus',
    bayer: 'α Cyg',
    designation: 'HYP-2041',
    spectral: 'A2 Ia',
    mag: 1.25,
    ra: '20h 41m 25s',
    dec: "+45° 16' 49\"",
    raDeg: 310.358,
    decDeg: 45.280,
    targetAlt: 65.9,
    targetAz: 24.7,
    color: '#e6f4ff',
    desc: 'Galactic plane orientation beacon located at the head of the Cygnus Rift.',
    reteAngle: (5 * 30),
    reteRadiusFactor: 0.48
  },
  {
    id: 'nav-7',
    index: 6,
    name: 'Spica-Virginis',
    bayer: 'α Vir',
    designation: 'HYP-1325',
    spectral: 'B1 III-IV',
    mag: 0.97,
    ra: '13h 25m 11s',
    dec: "-11° 09' 40\"",
    raDeg: 201.298,
    decDeg: -11.161,
    targetAlt: 28.5,
    targetAz: 265.4,
    color: '#cce6ff',
    desc: 'Spectroscopic binary system used for relativistic Doppler verification.',
    reteAngle: (6 * 30),
    reteRadiusFactor: 0.78
  },
  {
    id: 'nav-8',
    index: 7,
    name: 'Sirius-Major',
    bayer: 'α CMa',
    designation: 'HYP-0645',
    spectral: 'A1 V',
    mag: -1.46,
    ra: '06h 45m 08s',
    dec: "-16° 42' 58\"",
    raDeg: 101.287,
    decDeg: -16.716,
    targetAlt: 39.4,
    targetAz: 146.2,
    color: '#ffffff',
    desc: 'Prime celestial lighthouse offering highest optical signal-to-noise ratio.',
    reteAngle: (7 * 30),
    reteRadiusFactor: 0.69
  },
  {
    id: 'nav-9',
    index: 8,
    name: 'Altair-Aquilae',
    bayer: 'α Aql',
    designation: 'HYP-1950',
    spectral: 'A7 V',
    mag: 0.77,
    ra: '19h 50m 46s',
    dec: "+08° 52' 06\"",
    raDeg: 297.695,
    decDeg: 8.868,
    targetAlt: 51.3,
    targetAz: 308.9,
    color: '#f0f5ff',
    desc: 'Rapidly rotating oblate star providing angular parallax cross-checks.',
    reteAngle: (8 * 30),
    reteRadiusFactor: 0.58
  },
  {
    id: 'nav-10',
    index: 9,
    name: 'Antares-Scorpii',
    bayer: 'α Sco',
    designation: 'HYP-1629',
    spectral: 'M1.5 Iab',
    mag: 1.06,
    ra: '16h 29m 24s',
    dec: "-26° 25' 55\"",
    raDeg: 247.351,
    decDeg: -26.432,
    targetAlt: 18.2,
    targetAz: 238.1,
    color: '#ff7755',
    desc: 'Deep infrared red supergiant demarcating the coreward galactic sector.',
    reteAngle: (9 * 30),
    reteRadiusFactor: 0.83
  },
  {
    id: 'nav-11',
    index: 10,
    name: 'Capella-Aurigae',
    bayer: 'α Aur',
    designation: 'HYP-0516',
    spectral: 'G3 III',
    mag: 0.08,
    ra: '05h 16m 41s',
    dec: "+45° 59' 53\"",
    raDeg: 79.172,
    decDeg: 45.998,
    targetAlt: 62.0,
    targetAz: 52.8,
    color: '#fff0a0',
    desc: 'Quadruple star system establishing northern circumpolar ephemeris locks.',
    reteAngle: (10 * 30),
    reteRadiusFactor: 0.50
  },
  {
    id: 'nav-12',
    index: 11,
    name: 'Fomalhaut-Piscis',
    bayer: 'α PsA',
    designation: 'HYP-2257',
    spectral: 'A3 V',
    mag: 1.17,
    ra: '22h 57m 39s',
    dec: "-29° 37' 20\"",
    raDeg: 344.412,
    decDeg: -29.622,
    targetAlt: 24.6,
    targetAz: 198.4,
    color: '#e2edff',
    desc: 'Debris disk progenitor star used for interstellar dust extinction offsets.',
    reteAngle: (11 * 30),
    reteRadiusFactor: 0.80
  }
];

// EXTENDED DEEP ALMANAC CATALOG (40+ Objects)
const EXTENDED_ALMANAC = [
  ...NAV_STARS.map(s => ({ ...s, category: 'Navigational Primary', constellation: s.bayer.split(' ')[1] || 'Major' })),
  { id: 'ext-1', name: 'Betelgeuse', bayer: 'α Ori', designation: 'CAT-0555', spectral: 'M1-2 Ia-ab', mag: 0.50, ra: '05h 55m', dec: "+07° 24'", constellation: 'Ori', category: 'Supergiant', targetAlt: 42.1, targetAz: 95.3, color: '#ff6644' },
  { id: 'ext-2', name: 'Aldebaran', bayer: 'α Tau', designation: 'CAT-0435', spectral: 'K5 III', mag: 0.85, ra: '04h 35m', dec: "+16° 30'", constellation: 'Tau', category: 'Giant', targetAlt: 48.9, targetAz: 74.2, color: '#ffaa66' },
  { id: 'ext-3', name: 'Pollux', bayer: 'β Gem', designation: 'CAT-0745', spectral: 'K0 III', mag: 1.14, ra: '07h 45m', dec: "+28° 01'", constellation: 'Gem', category: 'Giant', targetAlt: 54.3, targetAz: 62.1, color: '#ffd088' },
  { id: 'ext-4', name: 'Regulus', bayer: 'α Leo', designation: 'CAT-1008', spectral: 'B7 V', mag: 1.36, ra: '10h 08m', dec: "+11° 58'", constellation: 'Leo', category: 'Subgiant', targetAlt: 38.6, targetAz: 152.9, color: '#c8e2ff' },
  { id: 'ext-5', name: 'Castor', bayer: 'α Gem', designation: 'CAT-0734', spectral: 'A1 V', mag: 1.58, ra: '07h 34m', dec: "+31° 53'", constellation: 'Gem', category: 'Multiple', targetAlt: 56.7, targetAz: 58.4, color: '#ffffff' },
  { id: 'ext-6', name: 'Bellatrix', bayer: 'γ Ori', designation: 'CAT-0525', spectral: 'B2 III', mag: 1.64, ra: '05h 25m', dec: "+06° 20'", constellation: 'Ori', category: 'Giant', targetAlt: 44.8, targetAz: 85.6, color: '#b8dcff' },
  { id: 'ext-7', name: 'Elnath', bayer: 'β Tau', designation: 'CAT-0526', spectral: 'B7 III', mag: 1.65, ra: '05h 26m', dec: "+28° 36'", constellation: 'Tau', category: 'Giant', targetAlt: 52.1, targetAz: 68.7, color: '#c0e0ff' },
  { id: 'ext-8', name: 'Alnilam', bayer: 'ε Ori', designation: 'CAT-0536', spectral: 'B0 Ia', mag: 1.69, ra: '05h 36m', dec: "-01° 12'", constellation: 'Ori', category: 'Supergiant', targetAlt: 41.5, targetAz: 89.4, color: '#a0d4ff' },
  { id: 'ext-9', name: 'Alkaid', bayer: 'η UMa', designation: 'CAT-1347', spectral: 'B3 V', mag: 1.85, ra: '13h 47m', dec: "+49° 18'", constellation: 'UMa', category: 'Main Sequence', targetAlt: 68.2, targetAz: 355.1, color: '#bce0ff' },
  { id: 'ext-10', name: 'Alioth', bayer: 'ε UMa', designation: 'CAT-1254', spectral: 'A0p', mag: 1.76, ra: '12h 54m', dec: "+55° 57'", constellation: 'UMa', category: 'Peculiar', targetAlt: 74.0, targetAz: 5.8, color: '#ffffff' },
  { id: 'ext-11', name: 'Dubhe', bayer: 'α UMa', designation: 'CAT-1103', spectral: 'K0 III', mag: 1.81, ra: '11h 03m', dec: "+61° 45'", constellation: 'UMa', category: 'Giant', targetAlt: 78.4, targetAz: 18.3, color: '#ffcc77' },
  { id: 'ext-12', name: 'Mirfak', bayer: 'α Per', designation: 'CAT-0324', spectral: 'F5 Ib', mag: 1.79, ra: '03h 24m', dec: "+49° 51'", constellation: 'Per', category: 'Supergiant', targetAlt: 61.9, targetAz: 41.5, color: '#fff5d0' },
  { id: 'ext-13', name: 'Wezen', bayer: 'δ CMa', designation: 'CAT-0708', spectral: 'F8 Ia', mag: 1.83, ra: '07h 08m', dec: "-26° 23'", constellation: 'CMa', category: 'Supergiant', targetAlt: 31.4, targetAz: 152.0, color: '#fff8d8' },
  { id: 'ext-14', name: 'Sargas', bayer: 'θ Sco', designation: 'CAT-1737', spectral: 'F1 II', mag: 1.86, ra: '17h 37m', dec: "-42° 59'", constellation: 'Sco', category: 'Bright Giant', targetAlt: 12.1, targetAz: 228.4, color: '#fff2cc' },
  { id: 'ext-15', name: 'Menkalinan', bayer: 'β Aur', designation: 'CAT-0559', spectral: 'A1m', mag: 1.90, ra: '05h 59m', dec: "+44° 56'", constellation: 'Aur', category: 'Subgiant', targetAlt: 60.5, targetAz: 54.2, color: '#ffffff' },
  { id: 'ext-16', name: 'Atria', bayer: 'α TrA', designation: 'CAT-1648', spectral: 'K2 Ib-II', mag: 1.91, ra: '16h 48m', dec: "-69° 01'", constellation: 'TrA', category: 'Bright Giant', targetAlt: 8.4, targetAz: 195.6, color: '#ffb866' },
  { id: 'ext-17', name: 'Alhena', bayer: 'γ Gem', designation: 'CAT-0637', spectral: 'A0 IV', mag: 1.93, ra: '06h 37m', dec: "+16° 23'", constellation: 'Gem', category: 'Subgiant', targetAlt: 49.3, targetAz: 72.9, color: '#ffffff' },
  { id: 'ext-18', name: 'Peacock', bayer: 'α Pav', designation: 'CAT-2025', spectral: 'B2.5 V', mag: 1.94, ra: '20h 25m', dec: "-56° 44'", constellation: 'Pav', category: 'Subgiant', targetAlt: 14.8, targetAz: 182.3, color: '#a8d8ff' },
  { id: 'ext-19', name: 'Polaris-Septentrio', bayer: 'α UMi', designation: 'HYP-0231', spectral: 'F7 Ib', mag: 1.97, ra: '02h 31m', dec: "+89° 15'", constellation: 'UMi', category: 'Cepheid', targetAlt: 89.2, targetAz: 0.1, color: '#fffbe0' },
  { id: 'ext-20', name: 'Murzim', bayer: 'β CMa', designation: 'CAT-0622', spectral: 'B1 II-III', mag: 1.98, ra: '06h 22m', dec: "-17° 57'", constellation: 'CMa', category: 'Giant', targetAlt: 37.1, targetAz: 142.6, color: '#b0dcff' },
  { id: 'ext-21', name: 'Alphard-Core', bayer: 'α Hya', designation: 'CAT-0927B', spectral: 'K3 II', mag: 2.00, ra: '09h 27m', dec: "-08° 39'", constellation: 'Hya', category: 'Giant', targetAlt: 34.1, targetAz: 125.0, color: '#ffaa55' },
  { id: 'ext-22', name: 'Hamal', bayer: 'α Ari', designation: 'CAT-0207', spectral: 'K2 III', mag: 2.01, ra: '02h 07m', dec: "+23° 27'", constellation: 'Ari', category: 'Giant', targetAlt: 50.8, targetAz: 32.4, color: '#ffb566' },
  { id: 'ext-23', name: 'Diphda', bayer: 'β Cet', designation: 'CAT-0043', spectral: 'K0 III', mag: 2.04, ra: '00h 43m', dec: "-17° 59'", constellation: 'Cet', category: 'Giant', targetAlt: 31.9, targetAz: 165.7, color: '#ffd588' },
  { id: 'ext-24', name: 'Nunki', bayer: 'σ Sgr', designation: 'CAT-1855', spectral: 'B2.5 V', mag: 2.05, ra: '18h 55m', dec: "-26° 17'", constellation: 'Sgr', category: 'Main Sequence', targetAlt: 22.4, targetAz: 248.9, color: '#b5d8ff' },
  { id: 'ext-25', name: 'Menkent', bayer: 'θ Cen', designation: 'CAT-1406', spectral: 'K0 III', mag: 2.06, ra: '14h 06m', dec: "-36° 22'", constellation: 'Cen', category: 'Giant', targetAlt: 16.5, targetAz: 215.3, color: '#ffc877' },
  { id: 'ext-26', name: 'Mirach', bayer: 'β And', designation: 'CAT-0109', spectral: 'M0 III', mag: 2.07, ra: '01h 09m', dec: "+35° 37'", constellation: 'And', category: 'Red Giant', targetAlt: 58.2, targetAz: 15.6, color: '#ff7755' },
  { id: 'ext-27', name: 'Alpheratz', bayer: 'α And', designation: 'CAT-0008', spectral: 'B8 IVp', mag: 2.07, ra: '00h 08m', dec: "+29° 05'", constellation: 'And', category: 'Subgiant', targetAlt: 53.6, targetAz: 8.2, color: '#c5e2ff' },
  { id: 'ext-28', name: 'Rasalhague', bayer: 'α Oph', designation: 'CAT-1734', spectral: 'A5 III', mag: 2.08, ra: '17h 34m', dec: "+12° 33'", constellation: 'Oph', category: 'Giant', targetAlt: 52.4, targetAz: 285.7, color: '#f0f5ff' },
  { id: 'ext-29', name: 'Kochab', bayer: 'β UMi', designation: 'CAT-1450', spectral: 'K4 III', mag: 2.07, ra: '14h 50m', dec: "+74° 09'", constellation: 'UMi', category: 'Giant', targetAlt: 82.1, targetAz: 350.2, color: '#ffaa55' },
  { id: 'ext-30', name: 'Saiph', bayer: 'κ Ori', designation: 'CAT-0547', spectral: 'B0.5 Ia', mag: 2.07, ra: '05h 47m', dec: "-09° 40'", constellation: 'Ori', category: 'Supergiant', targetAlt: 40.2, targetAz: 92.1, color: '#99d0ff' }
];


// PRELOADED QUICK-DIAL LOG ARCHIVES (6 PRESETS across 2 TIERS)
const QUICK_DIAL_PRESETS = [
  // TIER 1: VERIFIED & LOGGED FIXES (Archived Standard Waypoints)
  {
    id: 'preset-sol',
    tier: 1,
    tierName: 'Tier 1: Verified Fix',
    name: 'Sol-Station Earth Zenith Orbit',
    destination: 'Sol Prime System [G2V]',
    sector: 'Galactic Sector 001 // Core Transit',
    distanceLy: '0.000 LY (Origin Datum)',
    epoch: 'J2026.85-CALIBRATED',
    fixAddress: [0, 2, 4, 7, 8, 10, 1], // Exactly 7 star indices
    coordinates: { lat: "+00° 00' 00.000\"", lon: "000° 00' 00.000\"", heading: "000.0°", confidence: "99.98%" },
    verifiedBy: 'Archival Navigational Logbook #774-Alpha'
  },
  {
    id: 'preset-proxima',
    tier: 1,
    tierName: 'Tier 1: Verified Fix',
    name: 'Proxima-Centauri Transit Node',
    destination: 'Alpha Centauri Multi-Star Gate',
    sector: 'Centauri Local Void Subsector',
    distanceLy: '4.246 LY',
    epoch: 'J2026.72-VERIFIED',
    fixAddress: [3, 4, 7, 9, 6, 1, 0],
    coordinates: { lat: "-60° 50' 02.124\"", lon: "135° 44' 18.992\"", heading: "182.4°", confidence: "99.95%" },
    verifiedBy: 'R/V Tethys-V Waypoint Fix Log #1092'
  },
  {
    id: 'preset-kepler',
    tier: 1,
    tierName: 'Tier 1: Verified Fix',
    name: 'Kepler-62 Hyper-Relay Nexus',
    destination: 'Cygnus Habitation Ring',
    sector: 'Outer Arm Cygnus-Lyra Corridor',
    distanceLy: '990.2 LY',
    epoch: 'J2026.40-VERIFIED',
    fixAddress: [2, 5, 8, 10, 1, 6, 11],
    coordinates: { lat: "+45° 20' 55.401\"", lon: "284° 15' 33.109\"", heading: "042.8°", confidence: "99.91%" },
    verifiedBy: 'Deep Astrometric Cartographic Survey #41'
  },

  // TIER 2: PROVISIONAL SIGHTINGS (Unconfirmed / Deep Exploration Logs)
  {
    id: 'preset-eridani',
    tier: 2,
    tierName: 'Tier 2: Provisional Sighting',
    name: 'Eridani-Sigma Voidway Sighting',
    destination: 'Epsilon Eridani Outpost V',
    sector: 'Eridanus Abyss Perimeter',
    distanceLy: '10.50 LY',
    epoch: 'J2026.11-PROVISIONAL',
    fixAddress: [4, 7, 0, 9, 3, 11, 8],
    coordinates: { lat: "-09° 27' 29.880\"", lon: "050° 30' 11.230\"", heading: "235.1°", confidence: "98.74%" },
    verifiedBy: 'Long-Range Optical Interferometry Beacon'
  },
  {
    id: 'preset-cygnus-x1',
    tier: 2,
    tierName: 'Tier 2: Provisional Sighting',
    name: 'Cygnus-X1 Gravitational Meridian Slip',
    destination: 'Cygnus High-Energy Research Perimeter',
    sector: 'Relativistic Singularity Buffer',
    distanceLy: '6,070 LY',
    epoch: 'J2025.99-PROVISIONAL',
    fixAddress: [5, 2, 8, 10, 0, 7, 4],
    coordinates: { lat: "+35° 12' 05.772\"", lon: "312° 58' 44.020\"", heading: "319.6°", confidence: "97.90%" },
    verifiedBy: 'Gravitational Wave Zenith Array Fix'
  },
  {
    id: 'preset-thalassa',
    tier: 2,
    tierName: 'Tier 2: Provisional Sighting',
    name: 'Thalassa-Prime Zenith Outpost',
    destination: 'Ocean World Zenith Observatory',
    sector: 'Fomalhaut Southern Basin',
    distanceLy: '25.13 LY',
    epoch: 'J2026.04-PROVISIONAL',
    fixAddress: [11, 3, 9, 7, 1, 4, 8],
    coordinates: { lat: "-29° 37' 20.040\"", lon: "344° 24' 49.110\"", heading: "198.4°", confidence: "99.12%" },
    verifiedBy: 'Outpost Deep Sighting Log #338'
  }
];

class NavigationEngine {
  constructor() {
    this.selectedSights = []; // Array of NAV_STARS
    this.fixLength = 7; // Required number of sights for complete 7-parameter fix
    this.ephemerisHold = false; // Safety Interlock: Ephemeris Verification Hold (DEFAULTS TO RELEASED)
    
    // Live Dynamic Telemetry
    this.currentSiderealTime = '18:42:19.4 CST';
    this.baseLatitude = 41.8781;
    this.baseLongitude = -87.6298;
    this.vesselHeading = 284.6;
    this.subWarpVelocity = 0.42; // in c
    this.interceptResidual = 4.82; // arcseconds (drops as sights are added)
    this.dop = 5.2; // Dilution of precision
    this.fixConfidence = 0; // 0 to 100%

    // Dead-Reckoning State
    this.drLatitude = this.baseLatitude;
    this.drLongitude = this.baseLongitude;
    this.drDriftVector = { x: 0.012, y: -0.008 };
    this.drTrackPoints = [];
    this.lastFixTime = Date.now();

    this.initDeadReckoning();
  }

  initDeadReckoning() {
    // Generate initial track history
    const now = Date.now();
    for (let i = 20; i >= 0; i--) {
      const t = now - (i * 30000);
      const lat = this.baseLatitude + (Math.sin(i * 0.3) * 0.08) - (i * 0.005);
      const lon = this.baseLongitude + (Math.cos(i * 0.25) * 0.09) + (i * 0.006);
      this.drTrackPoints.push({ time: t, lat, lon, isFix: i % 7 === 0 });
    }
  }

  updateDR(dtSeconds = 1) {
    // Simulate real-time dead-reckoning drift between fixes
    const driftSpeed = 0.00004 * (this.subWarpVelocity / 0.42);
    const rad = (this.vesselHeading * Math.PI) / 180;
    this.drLatitude += Math.cos(rad) * driftSpeed * dtSeconds;
    this.drLongitude += Math.sin(rad) * driftSpeed * dtSeconds;

    // Slowly increase residual if not fixing
    if (this.selectedSights.length < this.fixLength) {
      this.interceptResidual = Math.min(12.0, this.interceptResidual + (dtSeconds * 0.02));
    }
  }

  toggleSight(star) {
    const existingIndex = this.selectedSights.findIndex(s => s.id === star.id);
    if (existingIndex >= 0) {
      this.selectedSights.splice(existingIndex, 1);
    } else {
      if (this.selectedSights.length < this.fixLength) {
        this.selectedSights.push(star);
      }
    }
    this.recomputeFix();
    return this.selectedSights;
  }

  isSightSelected(starId) {
    return this.selectedSights.some(s => s.id === starId);
  }

  clearSights() {
    this.selectedSights = [];
    this.recomputeFix();
  }

  setSights(stars) {
    this.selectedSights = stars.slice(0, this.fixLength);
    this.recomputeFix();
  }

  recomputeFix() {
    const n = this.selectedSights.length;
    if (n === 0) {
      this.fixConfidence = 0;
      this.interceptResidual = 8.45;
      this.dop = 7.8;
      return;
    }

    // Mathematical progression based on Marcq Saint-Hilaire intercept resolution
    // With 7 sights, confidence reaches 99.85% and residual collapses to <0.004 arcsec
    const progress = n / this.fixLength;
    this.fixConfidence = Math.min(99.9, Math.round((1 - Math.exp(-3.2 * progress)) * 104.5 * 10) / 10);
    this.interceptResidual = Math.max(0.002, (8.45 * Math.pow(0.28, n))).toFixed(3);
    this.dop = Math.max(0.82, (7.8 * Math.pow(0.72, n))).toFixed(2);

    if (n === this.fixLength) {
      this.fixConfidence = 99.9;
      this.interceptResidual = '0.002';
      this.dop = '0.82';
      
      // Update Dead-Reckoning track with confirmed fix point
      this.drTrackPoints.push({
        time: Date.now(),
        lat: this.drLatitude,
        lon: this.drLongitude,
        isFix: true
      });
      if (this.drTrackPoints.length > 50) this.drTrackPoints.shift();
    }
  }

  isReadyForActuation() {
    return this.selectedSights.length === this.fixLength;
  }

  isActuationBlockedByInterlock() {
    return this.ephemerisHold;
  }

  setEphemerisHold(hold) {
    this.ephemerisHold = hold;
  }

  formatCoordinates() {
    const latSign = this.drLatitude >= 0 ? '+' : '-';
    const latAbs = Math.abs(this.drLatitude);
    const latDeg = Math.floor(latAbs).toString().padStart(2, '0');
    const latMin = Math.floor((latAbs % 1) * 60).toString().padStart(2, '0');
    const latSec = (((latAbs % 1) * 60 % 1) * 60).toFixed(3).padStart(6, '0');

    const lonSign = this.drLongitude >= 0 ? '+' : '-';
    const lonAbs = Math.abs(this.drLongitude);
    const lonDeg = Math.floor(lonAbs).toString().padStart(3, '0');
    const lonMin = Math.floor((lonAbs % 1) * 60).toString().padStart(2, '0');
    const lonSec = (((lonAbs % 1) * 60 % 1) * 60).toFixed(3).padStart(6, '0');

    return {
      latStr: `${latSign}${latDeg}° ${latMin}' ${latSec}"`,
      lonStr: `${lonSign}${lonDeg}° ${lonMin}' ${lonSec}"`,
      headingStr: `${this.vesselHeading.toFixed(1)}° GYRO`,
      residualStr: `±${this.interceptResidual}"`,
      confidenceStr: `${this.fixConfidence.toFixed(1)}%`,
      dopStr: `${this.dop}`
    };
  }
}

window.NAV_STARS = NAV_STARS;
window.EXTENDED_ALMANAC = EXTENDED_ALMANAC;
window.QUICK_DIAL_PRESETS = QUICK_DIAL_PRESETS;
window.NavigationEngine = NavigationEngine;
