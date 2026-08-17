/**
 * AERIS Vector Database & Coordinate Glyph Registry
 * 100% Original Vector Glyphs and Fictional Gate Destinations.
 */

// 20 Original Coordinate Glyphs with geometric vector SVG path representations
const VECTOR_GLYPHS = [
  {
    id: 0,
    name: 'ALPHA',
    code: 'ALP',
    meaning: 'Primordial Origin Vertex',
    // SVG geometric paths in a 100x100 viewport
    svg: '<polygon points="50,15 85,80 15,80" fill="none" stroke="currentColor" stroke-width="6" stroke-linejoin="round"/><circle cx="50" cy="55" r="10" fill="currentColor"/><line x1="50" y1="15" x2="50" y2="45" stroke="currentColor" stroke-width="5"/>'
  },
  {
    id: 1,
    name: 'HELIX',
    code: 'HLX',
    meaning: 'Harmonic Strand Cadence',
    svg: '<path d="M25,25 Q50,50 25,75 M75,25 Q50,50 75,75 M25,50 L75,50" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>'
  },
  {
    id: 2,
    name: 'PRISM',
    code: 'PSM',
    meaning: 'Subspace Dispersion Lattice',
    svg: '<polygon points="50,15 85,75 15,75" fill="none" stroke="currentColor" stroke-width="5"/><line x1="15" y1="75" x2="50" y2="50" stroke="currentColor" stroke-width="5"/><line x1="85" y1="75" x2="50" y2="50" stroke="currentColor" stroke-width="5"/><line x1="50" y1="15" x2="50" y2="50" stroke="currentColor" stroke-width="5"/>'
  },
  {
    id: 3,
    name: 'NOVA',
    code: 'NOV',
    meaning: 'Radiant Stellar Discharge',
    svg: '<circle cx="50" cy="50" r="16" fill="none" stroke="currentColor" stroke-width="6"/><line x1="50" y1="12" x2="50" y2="88" stroke="currentColor" stroke-width="5"/><line x1="12" y1="50" x2="88" y2="50" stroke="currentColor" stroke-width="5"/><line x1="23" y1="23" x2="77" y2="77" stroke="currentColor" stroke-width="4"/><line x1="77" y1="23" x2="23" y2="77" stroke="currentColor" stroke-width="4"/>'
  },
  {
    id: 4,
    name: 'ZENITH',
    code: 'ZNT',
    meaning: 'Ascendant Orthogonal Vector',
    svg: '<polyline points="20,60 50,20 80,60" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><line x1="50" y1="20" x2="50" y2="85" stroke="currentColor" stroke-width="6" stroke-linecap="round"/><line x1="25" y1="85" x2="75" y2="85" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>'
  },
  {
    id: 5,
    name: 'FLUX',
    code: 'FLX',
    meaning: 'Electromagnetic Wavefield',
    svg: '<path d="M15,50 Q32,15 50,50 T85,50" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/><path d="M15,30 Q32,65 50,30 T85,30" fill="none" stroke="currentColor" stroke-width="4" stroke-dasharray="8 4" stroke-linecap="round"/>'
  },
  {
    id: 6,
    name: 'HORIZON',
    code: 'HRZ',
    meaning: 'Planar Boundary Threshold',
    svg: '<line x1="15" y1="50" x2="85" y2="50" stroke="currentColor" stroke-width="6" stroke-linecap="round"/><path d="M25,50 A25,25 0 0,1 75,50" fill="none" stroke="currentColor" stroke-width="5"/><circle cx="50" cy="32" r="6" fill="currentColor"/>'
  },
  {
    id: 7,
    name: 'PULSAR',
    code: 'PLS',
    meaning: 'Coherent Strobe Radiation',
    svg: '<circle cx="50" cy="50" r="14" fill="currentColor"/><circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" stroke-width="4" stroke-dasharray="10 6"/><line x1="50" y1="10" x2="50" y2="20" stroke="currentColor" stroke-width="6"/><line x1="50" y1="80" x2="50" y2="90" stroke="currentColor" stroke-width="6"/>'
  },
  {
    id: 8,
    name: 'MERIDIAN',
    code: 'MRD',
    meaning: 'Bisected Great Circle',
    svg: '<circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" stroke-width="5"/><line x1="50" y1="15" x2="50" y2="85" stroke="currentColor" stroke-width="6"/><line x1="30" y1="50" x2="70" y2="50" stroke="currentColor" stroke-width="4"/>'
  },
  {
    id: 9,
    name: 'VERTEX',
    code: 'VTX',
    meaning: 'Polyhedral Intersection',
    svg: '<polygon points="50,15 85,45 85,75 50,90 15,75 15,45" fill="none" stroke="currentColor" stroke-width="5"/><circle cx="50" cy="52" r="8" fill="currentColor"/>'
  },
  {
    id: 10,
    name: 'ECLIPSE',
    code: 'ECL',
    meaning: 'Occulted Gravitational Disk',
    svg: '<circle cx="42" cy="50" r="28" fill="none" stroke="currentColor" stroke-width="5"/><path d="M58,23 A28,28 0 0,1 58,77" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>'
  },
  {
    id: 11,
    name: 'CHRONO',
    code: 'CHR',
    meaning: 'Recursive Time Spiral',
    svg: '<path d="M50,50 A8,8 0 0,1 58,50 A16,16 0 0,1 42,50 A24,24 0 0,1 66,50 A32,32 0 0,1 34,50" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>'
  },
  {
    id: 12,
    name: 'TENSOR',
    code: 'TNS',
    meaning: 'Orthogonal Stress Field',
    svg: '<rect x="25" y="25" width="50" height="50" fill="none" stroke="currentColor" stroke-width="5"/><line x1="25" y1="25" x2="75" y2="75" stroke="currentColor" stroke-width="4"/><line x1="75" y1="25" x2="25" y2="75" stroke="currentColor" stroke-width="4"/><circle cx="50" cy="50" r="6" fill="currentColor"/>'
  },
  {
    id: 13,
    name: 'ABYSS',
    code: 'ABY',
    meaning: 'Inverted Gravitational Well',
    svg: '<polyline points="15,25 50,85 85,25" fill="none" stroke="currentColor" stroke-width="6" stroke-linejoin="round"/><polyline points="28,25 50,68 72,25" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><circle cx="50" cy="30" r="5" fill="currentColor"/>'
  },
  {
    id: 14,
    name: 'SOLSTICE',
    code: 'SLS',
    meaning: 'Equatorial Transition Axis',
    svg: '<ellipse cx="50" cy="50" rx="36" ry="16" fill="none" stroke="currentColor" stroke-width="5" transform="rotate(-25 50 50)"/><line x1="50" y1="15" x2="50" y2="85" stroke="currentColor" stroke-width="5"/><circle cx="50" cy="50" r="6" fill="currentColor"/>'
  },
  {
    id: 15,
    name: 'MATRIX',
    code: 'MTX',
    meaning: 'Quantum Entanglement Lattice',
    svg: '<polygon points="50,20 78,35 78,65 50,80 22,65 22,35" fill="none" stroke="currentColor" stroke-width="5"/><line x1="50" y1="20" x2="50" y2="80" stroke="currentColor" stroke-width="3"/><line x1="22" y1="35" x2="78" y2="65" stroke="currentColor" stroke-width="3"/><line x1="22" y1="65" x2="78" y2="35" stroke="currentColor" stroke-width="3"/>'
  },
  {
    id: 16,
    name: 'VORTEX',
    code: 'VTX2',
    meaning: 'Hyperbolic Singularity Swirl',
    svg: '<path d="M50,15 C75,15 85,40 75,65 C65,85 35,85 25,65 C15,45 35,30 50,35 C60,40 60,55 50,55" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>'
  },
  {
    id: 17,
    name: 'QUASAR',
    code: 'QSR',
    meaning: 'Relativistic Collimated Beam',
    svg: '<line x1="15" y1="50" x2="85" y2="50" stroke="currentColor" stroke-width="8" stroke-linecap="round"/><polygon points="35,30 65,30 50,50" fill="currentColor"/><polygon points="35,70 65,70 50,50" fill="currentColor"/>'
  },
  {
    id: 18,
    name: 'ORBIT',
    code: 'ORB',
    meaning: 'Closed Geodesic Trajectory',
    svg: '<ellipse cx="50" cy="50" rx="38" ry="18" fill="none" stroke="currentColor" stroke-width="5" transform="rotate(35 50 50)"/><circle cx="50" cy="50" r="10" fill="currentColor"/>'
  },
  {
    id: 19,
    name: 'CIPHER',
    code: 'CPH',
    meaning: 'Topological Invariant Knot',
    svg: '<rect x="25" y="25" width="50" height="50" rx="10" fill="none" stroke="currentColor" stroke-width="5"/><circle cx="50" cy="50" r="14" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="50" cy="50" r="4" fill="currentColor"/>'
  }
];

// Comprehensive Destination Registry (24 fictional worlds)
const DESTINATIONS = [
  {
    id: 'DST-01',
    designation: 'ADRL Alpha-Relay',
    name: 'Helios Prime Forward Station',
    sector: 'Inner Sol Boundary',
    coords: [0, 4, 8, 12, 16, 1], // [ALPHA, ZENITH, MERIDIAN, TENSOR, VORTEX, HELIX]
    distanceLY: 0.18,
    environment: 'Orbital Anchor Platform / Vacuum / 1.0G Artificial',
    threatLevel: 'Class-1 Minimal',
    threatColor: '#10b981',
    stability: '99.9%',
    carrierFreq: '1420.405 MHz',
    status: 'ACTIVE_RELAY',
    isPreset: true,
    presetSlot: 1,
    notes: 'Primary orbital relay station tethered to lunar Lagrangian point L2. Zero hostile vectors.'
  },
  {
    id: 'DST-02',
    designation: 'XEN-409',
    name: 'Aethelgard Reach',
    sector: 'Perseus Arm',
    coords: [1, 5, 9, 13, 17, 3], // [HELIX, FLUX, VERTEX, ABYSS, QUASAR, NOVA]
    distanceLY: 428.4,
    environment: 'Bioluminescent Canopy / 1.12 atm O2-N2 / Super-Arboreal',
    threatLevel: 'Class-1 Habitable',
    threatColor: '#10b981',
    stability: '98.7%',
    carrierFreq: '1612.028 MHz',
    status: 'SURVEYED',
    isPreset: false,
    notes: 'Exotic temperate biosphere with dense mega-flora. Harmonic resonance exceptionally clear.'
  },
  {
    id: 'DST-03',
    designation: 'FORGE-IX',
    name: 'Helios Forge Sub-Basin',
    sector: 'Perseus Arm',
    coords: [2, 6, 10, 14, 18, 4], // [PRISM, HORIZON, ECLIPSE, SOLSTICE, ORBIT, ZENITH]
    distanceLY: 894.1,
    environment: 'Superheated Silicate Basalt / Geothermal Steam Vents',
    threatLevel: 'Class-3 Hazardous',
    threatColor: '#f59e0b',
    stability: '96.2%',
    carrierFreq: '1667.359 MHz',
    status: 'MINING_OUTPOST',
    isPreset: true,
    presetSlot: 2,
    notes: 'Industrial heavy element extraction site. High ambient electromagnetic noise on carrier wave.'
  },
  {
    id: 'DST-04',
    designation: 'ARCH-09',
    name: 'Perseus Deep Archive',
    sector: 'Perseus Arm',
    coords: [3, 7, 11, 15, 19, 0], // [NOVA, PULSAR, CHRONO, MATRIX, CIPHER, ALPHA]
    distanceLY: 1240.0,
    environment: 'Crystalline Subterranean Vault / Cryogenic Nitrogen Gas',
    threatLevel: 'Class-2 Moderate',
    threatColor: '#38bdf8',
    stability: '99.4%',
    carrierFreq: '1720.530 MHz',
    status: 'DATA_VAULT',
    isPreset: true,
    presetSlot: 3,
    notes: 'Ancient resonant crystalline structure storing encoded subspace topological telemetry.'
  },
  {
    id: 'DST-05',
    designation: 'CYG-14',
    name: 'Cygnus Void Bastion',
    sector: 'Cygnus Rift',
    coords: [4, 8, 12, 16, 0, 7], // [ZENITH, MERIDIAN, TENSOR, VORTEX, ALPHA, PULSAR]
    distanceLY: 2150.6,
    environment: 'Deep Space Torus Habitat / Microgravity Void Station',
    threatLevel: 'Class-2 Moderate',
    threatColor: '#38bdf8',
    stability: '97.8%',
    carrierFreq: '1420.915 MHz',
    status: 'ACTIVE_RELAY',
    isPreset: true,
    presetSlot: 4,
    notes: 'Deep-field outpost monitoring gravitational micro-lensing along the Cygnus dust rift.'
  },
  {
    id: 'DST-06',
    designation: 'TAU-6',
    name: 'Nebula Vault Tau-6',
    sector: 'Cygnus Rift',
    coords: [5, 9, 13, 17, 1, 8],
    distanceLY: 3104.2,
    environment: 'Ionized Hydrogen Plasma Cloud / High Radiation',
    threatLevel: 'Class-4 Extreme',
    threatColor: '#f43f5e',
    stability: '91.3%',
    carrierFreq: '1850.110 MHz',
    status: 'QUARANTINE',
    isPreset: false,
    notes: 'Severe subspace turbulence. Harmonic stator clamp #4 experiences thermal strain upon transit.'
  },
  {
    id: 'DST-07',
    designation: 'VSP-812',
    name: 'Vespera Primus Ocean',
    sector: 'Perseus Arm',
    coords: [6, 10, 14, 18, 2, 9],
    distanceLY: 642.8,
    environment: 'Super-Oceanic / Floating Atmospheric Bio-Platforms',
    threatLevel: 'Class-1 Habitable',
    threatColor: '#10b981',
    stability: '99.1%',
    carrierFreq: '1420.405 MHz',
    status: 'SURVEYED',
    isPreset: false,
    notes: 'Calm saline ocean world with continuous planetary auroral displays. Stable carrier vector.'
  },
  {
    id: 'DST-08',
    designation: 'KLL-03',
    name: 'Kalliope Hydro-Arch',
    sector: 'Perseus Arm',
    coords: [7, 11, 15, 19, 3, 10],
    distanceLY: 775.3,
    environment: 'Glacial Ice-Shelf / Liquid Methane Sub-Crust',
    threatLevel: 'Class-2 Moderate',
    threatColor: '#38bdf8',
    stability: '98.0%',
    carrierFreq: '1504.882 MHz',
    status: 'SURVEYED',
    isPreset: false,
    notes: 'Natural glacial arch forming a harmonic subspace wave guide. Cryogenic equipment required.'
  },
  {
    id: 'DST-09',
    designation: 'CHR-91',
    name: 'Chrono-Fracture G-91',
    sector: 'Cygnus Rift',
    coords: [8, 12, 16, 0, 4, 11],
    distanceLY: 4200.0,
    environment: 'Localized Gravitational Shear / Relativistic Time Dilation',
    threatLevel: 'Class-5 Critical',
    threatColor: '#ff2d55',
    stability: '88.5%',
    carrierFreq: '2100.000 MHz',
    status: 'RESTRICTED',
    isPreset: false,
    notes: 'Temporal metric recursion zone. Gateway containment iris must remain sealed during alignment.'
  },
  {
    id: 'DST-10',
    designation: 'OBS-00',
    name: 'Obsidian Bastion Monolith',
    sector: 'Cygnus Rift',
    coords: [9, 13, 17, 1, 5, 12],
    distanceLY: 3880.5,
    environment: 'Airless Basalt Crust / Low Surface Albedo',
    threatLevel: 'Class-3 Hazardous',
    threatColor: '#f59e0b',
    stability: '95.4%',
    carrierFreq: '1420.405 MHz',
    status: 'UNEXPLORED',
    isPreset: false,
    notes: 'Subsurface seismic vibrations create 0.08 Hz carrier drift. Periodic clamp re-synchronization.'
  },
  {
    id: 'DST-11',
    designation: 'HDR-77',
    name: 'Hadron Drift Array',
    sector: 'Cygnus Rift',
    coords: [10, 14, 18, 2, 6, 13],
    distanceLY: 2990.0,
    environment: 'Dense Asteroid Field / Automated Particle Collider',
    threatLevel: 'Class-2 Moderate',
    threatColor: '#38bdf8',
    stability: '97.2%',
    carrierFreq: '1667.359 MHz',
    status: 'AUTOMATED',
    isPreset: false,
    notes: 'Unmanned telemetry station harvesting relativistic protons for Astraea power reserves.'
  },
  {
    id: 'DST-12',
    designation: 'HYP-04',
    name: 'Hyperion Deep Trench',
    sector: 'Cygnus Rift',
    coords: [11, 15, 19, 3, 7, 14],
    distanceLY: 3450.9,
    environment: 'Ultra-Dense Ammonia Fog / Crushing Atmospheric Pressure',
    threatLevel: 'Class-4 Extreme',
    threatColor: '#f43f5e',
    stability: '92.8%',
    carrierFreq: '1720.530 MHz',
    status: 'HAZARD_ZONE',
    isPreset: false,
    notes: 'Atmosphere conductive to electromagnetic arcs. Grounding shunts mandatory.'
  },
  {
    id: 'DST-13',
    designation: 'ZPH-18',
    name: 'Zephyr Fracture Station',
    sector: 'Perseus Arm',
    coords: [12, 16, 0, 4, 8, 15],
    distanceLY: 1105.4,
    environment: 'High Velocity Stratospheric Platform / Storm Winds',
    threatLevel: 'Class-3 Hazardous',
    threatColor: '#f59e0b',
    stability: '96.8%',
    carrierFreq: '1420.405 MHz',
    status: 'SURVEYED',
    isPreset: false,
    notes: 'Wind velocity averages 380 km/h. Portal terminus is located inside an aerodynamic anchor bay.'
  },
  {
    id: 'DST-14',
    designation: 'PHT-99',
    name: 'Phaeton Super-Earth',
    sector: 'Perseus Arm',
    coords: [13, 17, 1, 5, 9, 16],
    distanceLY: 830.2,
    environment: 'High Gravity (2.4G) / Dense Argon-CO2 Crust',
    threatLevel: 'Class-2 Moderate',
    threatColor: '#38bdf8',
    stability: '98.5%',
    carrierFreq: '1612.028 MHz',
    status: 'EXPLORED',
    isPreset: false,
    notes: 'Rich mineral crust with heavy actinide deposits. Gravitational tidal pull requires +4 MW bus bias.'
  },
  {
    id: 'DST-15',
    designation: 'VNG-01',
    name: 'Vanguard Horizon Outpost',
    sector: 'Outer Magellanic',
    coords: [14, 18, 2, 6, 10, 17],
    distanceLY: 15800.0,
    environment: 'Deep Intergalactic Void Anchor / Solitary Habitation Hub',
    threatLevel: 'Class-3 Hazardous',
    threatColor: '#f59e0b',
    stability: '94.0%',
    carrierFreq: '1940.880 MHz',
    status: 'DEEP_OUTPOST',
    isPreset: false,
    notes: 'Extragalactic listening post at the edge of the Large Magellanic Cloud. Extreme transit power draw.'
  },
  {
    id: 'DST-16',
    designation: 'ELY-77',
    name: 'Elysium Spire Relay',
    sector: 'Outer Magellanic',
    coords: [15, 19, 3, 7, 11, 18],
    distanceLY: 17200.5,
    environment: 'Metallic Spire Network / Inert Rare-Gas Atmosphere',
    threatLevel: 'Class-1 Habitable',
    threatColor: '#10b981',
    stability: '99.0%',
    carrierFreq: '1420.405 MHz',
    status: 'SURVEYED',
    isPreset: false,
    notes: 'Precursor resonant spires that passively amplify subspace wave propagation by 340%.'
  },
  {
    id: 'DST-17',
    designation: 'OMG-00',
    name: 'Omega Zenith Array',
    sector: 'Outer Magellanic',
    coords: [16, 0, 4, 8, 12, 19],
    distanceLY: 22400.0,
    environment: 'Supermassive Black Hole Event Horizon Ergosphere',
    threatLevel: 'Class-5 Critical',
    threatColor: '#ff2d55',
    stability: '86.1%',
    carrierFreq: '2400.120 MHz',
    status: 'RESTRICTED',
    isPreset: false,
    notes: 'Direct metric frame-dragging study node. Connection window strictly capped at 38 seconds.'
  },
  {
    id: 'DST-18',
    designation: 'TNT-55',
    name: 'Tantalus Subspace Well',
    sector: 'Outer Magellanic',
    coords: [17, 1, 5, 9, 13, 0],
    distanceLY: 19850.2,
    environment: 'Hyper-Dimensional Fault Line / Fluctuating Vacuum Energy',
    threatLevel: 'Class-4 Extreme',
    threatColor: '#f43f5e',
    stability: '90.2%',
    carrierFreq: '2020.330 MHz',
    status: 'RESEARCH_SITE',
    isPreset: false,
    notes: 'High spatial curvature gradients. Subspace capacitor bank #3 recommended at 100% pre-charge.'
  },
  {
    id: 'DST-19',
    designation: 'PRX-01',
    name: 'Proxima Centauri B-Station',
    sector: 'Inner Sol Boundary',
    coords: [18, 2, 6, 10, 14, 1],
    distanceLY: 4.24,
    environment: 'Tidally-Locked Terrestrial / Flare-Shielded Dome',
    threatLevel: 'Class-1 Habitable',
    threatColor: '#10b981',
    stability: '99.8%',
    carrierFreq: '1420.405 MHz',
    status: 'COLONY_PRIMARY',
    isPreset: false,
    notes: 'Closest interstellar civilian colony. Constant high-throughput packet and transit schedule.'
  },
  {
    id: 'DST-20',
    designation: 'BRN-08',
    name: 'Barnard Outpost Omicron',
    sector: 'Inner Sol Boundary',
    coords: [19, 3, 7, 11, 15, 2],
    distanceLY: 5.96,
    environment: 'Sub-Surface Ice Tunnels / Super-Cryo Nitrogen Lake',
    threatLevel: 'Class-2 Moderate',
    threatColor: '#38bdf8',
    stability: '99.2%',
    carrierFreq: '1420.405 MHz',
    status: 'RESEARCH_SITE',
    isPreset: false,
    notes: 'Under-ice astro-biology laboratory. Constant clean carrier lock.'
  },
  {
    id: 'DST-21',
    designation: 'SIR-44',
    name: 'Sirius Vector Buoy',
    sector: 'Inner Sol Boundary',
    coords: [0, 5, 10, 15, 1, 6],
    distanceLY: 8.60,
    environment: 'Binary Star Orbital Halo / High Ultraviolet Flux',
    threatLevel: 'Class-2 Moderate',
    threatColor: '#38bdf8',
    stability: '98.9%',
    carrierFreq: '1667.359 MHz',
    status: 'NAV_BEACON',
    isPreset: false,
    notes: 'Primary subspace navigation beacon for all Perseus-bound transit routes.'
  },
  {
    id: 'DST-22',
    designation: 'AST-00',
    name: 'Astraea Nexus Central Core',
    sector: 'Inner Sol Boundary',
    coords: [1, 6, 11, 16, 2, 7],
    distanceLY: 0.00,
    environment: 'Mount Erebus Deep Sub-Basement / Heavy Reinforced Vault',
    threatLevel: 'Class-1 Minimal',
    threatColor: '#10b981',
    stability: '100.0%',
    carrierFreq: '1420.405 MHz',
    status: 'LOCAL_ORIGIN',
    isPreset: false,
    notes: 'Current local origin node (ADRL-04). Harmonic loopback tests permitted for calibration.'
  },
  {
    id: 'DST-23',
    designation: 'CYG-99',
    name: 'Cygnus Dark Rift Siphon',
    sector: 'Cygnus Rift',
    coords: [2, 7, 12, 17, 3, 8],
    distanceLY: 3600.0,
    environment: 'Cold Molecular Cloud / Zero Visibility Carbon Dust',
    threatLevel: 'Class-3 Hazardous',
    threatColor: '#f59e0b',
    stability: '95.0%',
    carrierFreq: '1720.530 MHz',
    status: 'UNEXPLORED',
    isPreset: false,
    notes: 'Thick dust mantle attenuates standard radio. Only subspace resonance vectors penetrate.'
  },
  {
    id: 'DST-24',
    designation: 'MAG-77',
    name: 'Magellanic Bridge Anchor',
    sector: 'Outer Magellanic',
    coords: [3, 8, 13, 18, 4, 9],
    distanceLY: 21000.0,
    environment: 'Intergalactic Gas Filament / Cosmic Ray Web',
    threatLevel: 'Class-4 Extreme',
    threatColor: '#f43f5e',
    stability: '91.8%',
    carrierFreq: '2210.450 MHz',
    status: 'DEEP_OUTPOST',
    isPreset: false,
    notes: 'Longest sustained transit tunnel in active Astraea catalog. Requires high-voltage bus surge.'
  }
];

class AerisDatabase {
  constructor() {
    this.glyphs = VECTOR_GLYPHS;
    this.destinations = DESTINATIONS;
  }

  getGlyph(id) {
    return this.glyphs.find(g => g.id === id) || null;
  }

  getGlyphByCode(code) {
    return this.glyphs.find(g => g.code.toUpperCase() === code.toUpperCase()) || null;
  }

  getDestinationByAddress(coords) {
    if (!coords || coords.length < 4) return null;
    return this.destinations.find(dest => {
      if (dest.coords.length !== coords.length) return false;
      return dest.coords.every((val, idx) => val === coords[idx]);
    }) || null;
  }

  getPresets() {
    return this.destinations.filter(d => d.isPreset).sort((a, b) => a.presetSlot - b.presetSlot);
  }

  searchDestinations(query = '', sector = 'ALL', threat = 'ALL') {
    return this.destinations.filter(dest => {
      // Sector filter
      if (sector !== 'ALL' && dest.sector !== sector) return false;
      // Threat filter
      if (threat !== 'ALL') {
        if (!dest.threatLevel.toLowerCase().includes(threat.toLowerCase())) return false;
      }
      // Text query
      if (query.trim()) {
        const q = query.toLowerCase();
        const matchName = dest.name.toLowerCase().includes(q);
        const matchDesig = dest.designation.toLowerCase().includes(q);
        const matchSector = dest.sector.toLowerCase().includes(q);
        const matchEnv = dest.environment.toLowerCase().includes(q);
        const matchNotes = dest.notes.toLowerCase().includes(q);
        const matchGlyphs = dest.coords.some(id => {
          const g = this.getGlyph(id);
          return g && (g.name.toLowerCase().includes(q) || g.code.toLowerCase().includes(q));
        });
        return matchName || matchDesig || matchSector || matchEnv || matchNotes || matchGlyphs;
      }
      return true;
    });
  }

  getRandomDestination() {
    const valid = this.destinations.filter(d => d.id !== 'DST-22'); // Exclude local loopback
    return valid[Math.floor(Math.random() * valid.length)];
  }
}

window.aerisDB = new AerisDatabase();
