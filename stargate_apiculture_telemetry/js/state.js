/**
 * IPATC APICULTURE TELEMETRY NETWORK — STATE & REFERENCE DEFINITIONS
 * Defines the 10 Colony Telemetry Nodes, 6 Preloaded Quick-Dial Routes (2 Tiers),
 * and the 24 Monitored Hive Station Health Matrix.
 */

const COLONY_DEFINITIONS = [
  {
    id: 1,
    code: 'COL-01',
    name: 'APIS-MEL-CORE',
    glyphSvg: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8">
      <circle cx="16" cy="16" r="12" stroke-dasharray="3 2"/>
      <path d="M16 6v20M8 12h16M11 20h10"/>
      <circle cx="16" cy="16" r="3" fill="currentColor"/>
    </svg>`,
    freq: 240,
    classCode: 'Q-RSS',
    className: 'Queen-Right Steady State',
    description: 'Harmonic 240Hz queen-right baseline acoustic hum.'
  },
  {
    id: 2,
    code: 'COL-02',
    name: 'VESP-DELTA-06',
    glyphSvg: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8">
      <polygon points="16,5 27,11 27,23 16,29 5,23 5,11"/>
      <circle cx="16" cy="17" r="5"/>
      <path d="M16 12v10M11 17h10"/>
    </svg>`,
    freq: 310,
    classCode: 'B-ITL',
    className: 'Brood Incubation Thermo-Lock',
    description: '35.0°C thermal homeostasis brood-frame sensor array.'
  },
  {
    id: 3,
    code: 'COL-03',
    name: 'HYLA-ALPHA-02',
    glyphSvg: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M6 26L16 6L26 26"/>
      <line x1="10" y1="20" x2="22" y2="20"/>
      <circle cx="16" cy="13" r="2" fill="currentColor"/>
      <path d="M16 20v6"/>
    </svg>`,
    freq: 195,
    classCode: 'F-NP',
    className: 'Foraging Nectar Peak',
    description: 'High-volume optical entrance lidar traffic telemetry.'
  },
  {
    id: 4,
    code: 'COL-04',
    name: 'BOMBUS-RES-07',
    glyphSvg: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M7 23C7 16 11 9 16 9C21 9 25 16 25 23"/>
      <path d="M4 23h24M12 23v-5M20 23v-5M16 9v-4"/>
      <circle cx="16" cy="16" r="2" fill="currentColor"/>
    </svg>`,
    freq: 180,
    classCode: 'N-CS',
    className: 'Nocturnal Clumping Stasis',
    description: 'Low-frequency winter cluster metabolic stasis hum.'
  },
  {
    id: 5,
    code: 'COL-05',
    name: 'CERANA-OMEGA',
    glyphSvg: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M16 6v20M7 11c6 3 12 3 18 0M7 21c6-3 12-3 18 0"/>
      <circle cx="16" cy="16" r="3"/>
    </svg>`,
    freq: 285,
    classCode: 'Q-RSS',
    className: 'Steady Baseline',
    description: 'Precision strain load-cell differential weight monitoring.'
  },
  {
    id: 6,
    code: 'COL-06',
    name: 'OSMIA-NORTH-08',
    glyphSvg: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M8 8l16 16M24 8L8 24"/>
      <circle cx="16" cy="16" r="6"/>
      <path d="M16 4v4M16 24v4M4 16h4M24 16h4"/>
    </svg>`,
    freq: 360,
    classCode: 'V-MI',
    className: 'Varroa Mite Load Signature',
    description: 'High-frequency grooming vibration acoustic signature.'
  },
  {
    id: 7,
    code: 'COL-07',
    name: 'ANTHO-VECT-04',
    glyphSvg: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8">
      <circle cx="16" cy="16" r="10"/>
      <polygon points="16,8 21,19 16,16 11,19" fill="currentColor"/>
    </svg>`,
    freq: 225,
    classCode: 'F-NP',
    className: 'Forager Radial Vector',
    description: 'Polarized forager directional flight corridor tracking.'
  },
  {
    id: 8,
    code: 'COL-08',
    name: 'MEGAL-SWARM-09',
    glyphSvg: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M6 16c3-6 7-6 10 0s7 6 10 0M6 10c3-6 7-6 10 0s7 6 10 0M6 22c3-6 7-6 10 0s7 6 10 0"/>
      <circle cx="16" cy="16" r="2" fill="currentColor"/>
    </svg>`,
    freq: 450,
    classCode: 'S-PP',
    className: 'Swarm Precursor Piping',
    description: '450Hz queen piping cascade prior to reproductive swarming.'
  },
  {
    id: 9,
    code: 'COL-09',
    name: 'MELIP-DISTRESS',
    glyphSvg: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M16 4L28 26H4L16 4Z"/>
      <path d="M16 12v7M16 22v1"/>
      <circle cx="16" cy="22.5" r="1" fill="currentColor"/>
    </svg>`,
    freq: 520,
    classCode: 'Q-DR',
    className: 'Queenless Distress Roar',
    description: 'High-amplitude discordant roar indicating lost queen.'
  },
  {
    id: 10,
    code: 'COL-10',
    name: 'TRIGONA-QUAR',
    glyphSvg: `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8">
      <rect x="7" y="7" width="18" height="18" rx="3"/>
      <circle cx="16" cy="16" r="5"/>
      <path d="M16 7v4M16 21v4M7 16h4M21 16h4"/>
    </svg>`,
    freq: 410,
    classCode: 'D-APA',
    className: 'Propolis Shield Defense',
    description: 'Alarm pheromone coupled acoustic buzzing spike.'
  }
];

const QUICK_DIAL_PRESETS = [
  // Tier 1: Verified Research Apiaries (Healthy Baseline)
  {
    id: 'preset-alpha-01',
    tier: 1,
    tierName: 'Tier 1: Verified Healthy Apiaries',
    name: 'Alpha-01 Melitta Baseline',
    address: [1, 2, 3, 5, 7, 4, 10],
    description: 'Standard Queen-Right Baseline Reference Array (Verified 99.8% Coherence)'
  },
  {
    id: 'preset-vespula-06',
    tier: 1,
    tierName: 'Tier 1: Verified Healthy Apiaries',
    name: 'Vespula-Delta Agriscan',
    address: [2, 3, 7, 5, 1, 4, 2],
    description: 'Peak Forage Inbound Traffic Stream (Lidar Traffic > 300 bees/min)'
  },
  {
    id: 'preset-cerana-thermal',
    tier: 1,
    tierName: 'Tier 1: Verified Healthy Apiaries',
    name: 'Cerana-Omega Thermal Standard',
    address: [5, 2, 1, 7, 4, 10, 3],
    description: 'High-Fidelity Brood Core Incubation (35.0°C Core Stabilization)'
  },

  // Tier 2: Flagged / Under Observation Apiaries (Anomalies / Research Alerts)
  {
    id: 'preset-gamma-swarm',
    tier: 2,
    tierName: 'Tier 2: Flagged / Under Observation',
    name: 'Gamma-04 Swarm Precursor',
    address: [8, 1, 3, 9, 2, 8, 6],
    description: 'Acoustic 450Hz Piping Cascade (Swarm Probability 88%)'
  },
  {
    id: 'preset-epsilon-queenless',
    tier: 2,
    tierName: 'Tier 2: Flagged / Under Observation',
    name: 'Epsilon-09 Queenless Distress',
    address: [9, 8, 6, 2, 9, 10, 1],
    description: 'Queenless Roar Harmonic Anomaly (Loss of 240Hz fundamental)'
  },
  {
    id: 'preset-zeta-mite-quarantine',
    tier: 2,
    tierName: 'Tier 2: Flagged / Under Observation',
    name: 'Zeta-03 Mite Load Quarantine',
    address: [6, 10, 9, 8, 6, 2, 4],
    description: 'Varroa Mite Load Investigation (VMI > 3.2 / 100 bees)'
  }
];

const COLONY_HEALTH_STATIONS = [
  { id: 'HIVE-N01', name: 'North Apiary Core Alpha', region: 'Northern Cluster', pop: '52,000', vmi: '0.3', queen: 'Marked Red (99%)', weight: '+2.1 kg/wk', temp: '34.9°C', acoustic: 'Q-RSS', traffic: '320 in / 315 out', status: 'HEALTHY' },
  { id: 'HIVE-N02', name: 'North Apiary Forage Beta', region: 'Northern Cluster', pop: '48,500', vmi: '0.4', queen: 'Marked Red (96%)', weight: '+1.8 kg/wk', temp: '34.8°C', acoustic: 'Q-RSS', traffic: '290 in / 295 out', status: 'HEALTHY' },
  { id: 'HIVE-N03', name: 'North Apiary Thermal Gamma', region: 'Northern Cluster', pop: '44,200', vmi: '0.5', queen: 'Marked Yellow (94%)', weight: '+1.4 kg/wk', temp: '35.0°C', acoustic: 'B-ITL', traffic: '270 in / 272 out', status: 'HEALTHY' },
  { id: 'HIVE-N04', name: 'North Apiary Sentinel Delta', region: 'Northern Cluster', pop: '51,100', vmi: '0.2', queen: 'Marked Red (98%)', weight: '+2.4 kg/wk', temp: '34.9°C', acoustic: 'Q-RSS', traffic: '335 in / 330 out', status: 'HEALTHY' },
  { id: 'HIVE-N05', name: 'North Apiary Lidar Epsilon', region: 'Northern Cluster', pop: '46,000', vmi: '0.6', queen: 'Marked Red (92%)', weight: '+1.5 kg/wk', temp: '34.7°C', acoustic: 'F-NP', traffic: '310 in / 308 out', status: 'HEALTHY' },
  { id: 'HIVE-N06', name: 'North Swarm Alert Zeta', region: 'Northern Cluster', pop: '58,000', vmi: '0.4', queen: 'Marked Blue (88%)', weight: '-0.8 kg/wk', temp: '35.4°C', acoustic: 'S-PP', traffic: '420 in / 410 out', status: 'WARNING' },

  { id: 'HIVE-C01', name: 'Coastal Forage Array 01', region: 'Coastal Grid', pop: '49,000', vmi: '0.5', queen: 'Marked Red (97%)', weight: '+2.8 kg/wk', temp: '34.8°C', acoustic: 'F-NP', traffic: '340 in / 335 out', status: 'HEALTHY' },
  { id: 'HIVE-C02', name: 'Coastal Forage Array 02', region: 'Coastal Grid', pop: '50,200', vmi: '0.4', queen: 'Marked Red (98%)', weight: '+3.1 kg/wk', temp: '34.9°C', acoustic: 'F-NP', traffic: '360 in / 355 out', status: 'HEALTHY' },
  { id: 'HIVE-C03', name: 'Coastal Nectar Flow 03', region: 'Coastal Grid', pop: '47,800', vmi: '0.8', queen: 'Marked Yellow (91%)', weight: '+2.5 kg/wk', temp: '34.7°C', acoustic: 'Q-RSS', traffic: '305 in / 300 out', status: 'HEALTHY' },
  { id: 'HIVE-C04', name: 'Coastal Thermal Pod 04', region: 'Coastal Grid', pop: '43,000', vmi: '1.1', queen: 'Marked Red (89%)', weight: '+1.2 kg/wk', temp: '34.6°C', acoustic: 'B-ITL', traffic: '260 in / 258 out', status: 'HEALTHY' },
  { id: 'HIVE-C05', name: 'Coastal Queenless Anomaly 05', region: 'Coastal Grid', pop: '36,000', vmi: '1.4', queen: 'MISSING (0%)', weight: '-1.2 kg/wk', temp: '33.2°C', acoustic: 'Q-DR', traffic: '110 in / 115 out', status: 'CRITICAL' },
  { id: 'HIVE-C06', name: 'Coastal Reserve Unit 06', region: 'Coastal Grid', pop: '45,600', vmi: '0.7', queen: 'Marked Red (95%)', weight: '+1.9 kg/wk', temp: '34.8°C', acoustic: 'Q-RSS', traffic: '280 in / 282 out', status: 'HEALTHY' },

  { id: 'HIVE-A01', name: 'Alpine High-Altitude 01', region: 'Alpine Array', pop: '41,000', vmi: '0.1', queen: 'Marked Red (99%)', weight: '+0.9 kg/wk', temp: '34.9°C', acoustic: 'N-CS', traffic: '210 in / 208 out', status: 'HEALTHY' },
  { id: 'HIVE-A02', name: 'Alpine High-Altitude 02', region: 'Alpine Array', pop: '39,500', vmi: '0.2', queen: 'Marked Red (98%)', weight: '+0.8 kg/wk', temp: '34.8°C', acoustic: 'N-CS', traffic: '195 in / 192 out', status: 'HEALTHY' },
  { id: 'HIVE-A03', name: 'Alpine Thermal Cluster 03', region: 'Alpine Array', pop: '42,400', vmi: '0.3', queen: 'Marked Red (97%)', weight: '+1.1 kg/wk', temp: '35.0°C', acoustic: 'B-ITL', traffic: '225 in / 220 out', status: 'HEALTHY' },
  { id: 'HIVE-A04', name: 'Alpine Sentinel Pod 04', region: 'Alpine Array', pop: '38,000', vmi: '0.2', queen: 'Marked Yellow (94%)', weight: '+0.7 kg/wk', temp: '34.7°C', acoustic: 'Q-RSS', traffic: '180 in / 185 out', status: 'HEALTHY' },
  { id: 'HIVE-A05', name: 'Alpine Swarm Detection 05', region: 'Alpine Array', pop: '46,500', vmi: '0.4', queen: 'Marked Red (87%)', weight: '-0.4 kg/wk', temp: '35.3°C', acoustic: 'S-PP', traffic: '290 in / 285 out', status: 'WARNING' },
  { id: 'HIVE-A06', name: 'Alpine Bio-Telemetry 06', region: 'Alpine Array', pop: '44,000', vmi: '0.3', queen: 'Marked Red (96%)', weight: '+1.0 kg/wk', temp: '34.8°C', acoustic: 'Q-RSS', traffic: '230 in / 228 out', status: 'HEALTHY' },

  { id: 'HIVE-Q01', name: 'Quarantine Chamber Alpha', region: 'Quarantine Enclosure', pop: '32,000', vmi: '3.8', queen: 'Marked White (82%)', weight: '-1.5 kg/wk', temp: '34.1°C', acoustic: 'V-MI', traffic: '140 in / 145 out', status: 'CRITICAL' },
  { id: 'HIVE-Q02', name: 'Quarantine Foulbrood Pod B', region: 'Quarantine Enclosure', pop: '28,000', vmi: '4.2', queen: 'Failing (45%)', weight: '-2.1 kg/wk', temp: '33.5°C', acoustic: 'Q-DR', traffic: '95 in / 100 out', status: 'CRITICAL' },
  { id: 'HIVE-Q03', name: 'Quarantine Varroa Study C', region: 'Quarantine Enclosure', pop: '34,500', vmi: '3.1', queen: 'Marked Red (85%)', weight: '-0.6 kg/wk', temp: '34.3°C', acoustic: 'V-MI', traffic: '160 in / 165 out', status: 'WARNING' },
  { id: 'HIVE-Q04', name: 'Quarantine Defensive Array D', region: 'Quarantine Enclosure', pop: '37,000', vmi: '1.9', queen: 'Marked Green (89%)', weight: '+0.2 kg/wk', temp: '34.5°C', acoustic: 'D-APA', traffic: '210 in / 205 out', status: 'WARNING' },
  { id: 'HIVE-Q05', name: 'Quarantine Post-Treatment E', region: 'Quarantine Enclosure', pop: '39,000', vmi: '1.2', queen: 'Marked Red (93%)', weight: '+0.8 kg/wk', temp: '34.7°C', acoustic: 'Q-RSS', traffic: '240 in / 238 out', status: 'HEALTHY' },
  { id: 'HIVE-Q06', name: 'Quarantine Baseline Unit F', region: 'Quarantine Enclosure', pop: '40,500', vmi: '0.9', queen: 'Marked Red (94%)', weight: '+1.1 kg/wk', temp: '34.8°C', acoustic: 'Q-RSS', traffic: '255 in / 250 out', status: 'HEALTHY' }
];

window.COLONY_DEFINITIONS = COLONY_DEFINITIONS;
window.QUICK_DIAL_PRESETS = QUICK_DIAL_PRESETS;
window.COLONY_HEALTH_STATIONS = COLONY_HEALTH_STATIONS;
