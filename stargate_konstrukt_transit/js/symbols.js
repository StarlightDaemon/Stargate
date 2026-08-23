/**
 * KONSTRUKT TRANSIT BUREAU
 * Geometric Symbol Registry & Presets
 */

const GLYPHS = [
  {
    id: 'V-01',
    code: '01',
    name: 'ORTHO-AXIS',
    subtitle: 'Perpendicular Orthogonal Grid',
    color: '#D82B27', // Cadmium Red
    innerSvg: `
      <rect x="42" y="10" width="16" height="80" fill="currentColor" />
      <rect x="10" y="42" width="80" height="16" fill="currentColor" />
      <rect x="36" y="36" width="28" height="28" fill="#F4F0E8" />
      <rect x="44" y="44" width="12" height="12" fill="currentColor" />
    `,
    get svg() {
      return `<svg viewBox="0 0 100 100" class="glyph-svg">${this.innerSvg}</svg>`;
    }
  },
  {
    id: 'V-02',
    code: '02',
    name: 'DELTA-PRISM',
    subtitle: 'Equilateral Triad Vector',
    color: '#15448C', // Cobalt Blue
    innerSvg: `
      <polygon points="50,12 88,82 12,82" fill="currentColor" />
      <polygon points="50,38 72,74 28,74" fill="#F4F0E8" />
      <circle cx="50" cy="58" r="8" fill="currentColor" />
    `,
    get svg() {
      return `<svg viewBox="0 0 100 100" class="glyph-svg">${this.innerSvg}</svg>`;
    }
  },
  {
    id: 'V-03',
    code: '03',
    name: 'KINETIC-ARC',
    subtitle: 'Concentric Quadrant Radials',
    color: '#F4B810', // Ochre Yellow
    innerSvg: `
      <path d="M 20 80 A 60 60 0 0 1 80 20 L 64 20 A 44 44 0 0 0 20 64 Z" fill="currentColor" />
      <path d="M 20 80 A 32 32 0 0 1 52 48 L 40 48 A 20 20 0 0 0 20 68 Z" fill="currentColor" />
      <circle cx="20" cy="80" r="10" fill="currentColor" />
      <rect x="76" y="12" width="12" height="16" fill="currentColor" />
    `,
    get svg() {
      return `<svg viewBox="0 0 100 100" class="glyph-svg">${this.innerSvg}</svg>`;
    }
  },
  {
    id: 'V-04',
    code: '04',
    name: 'TETRA-BLOCK',
    subtitle: 'Rotated Planar Rhombus',
    color: '#181716', // Charcoal Black
    innerSvg: `
      <polygon points="50,14 86,50 50,86 14,50" fill="currentColor" />
      <polygon points="50,28 72,50 50,72 28,50" fill="#F4F0E8" />
      <rect x="42" y="42" width="16" height="16" fill="currentColor" />
    `,
    get svg() {
      return `<svg viewBox="0 0 100 100" class="glyph-svg">${this.innerSvg}</svg>`;
    }
  },
  {
    id: 'V-05',
    code: '05',
    name: 'DUAL-CHEVRON',
    subtitle: 'Opposed Kinetic Vectors',
    color: '#D82B27', // Cadmium Red
    innerSvg: `
      <path d="M 16 38 L 50 16 L 84 38 L 84 56 L 50 34 L 16 56 Z" fill="currentColor" />
      <path d="M 16 68 L 50 46 L 84 68 L 84 86 L 50 64 L 16 86 Z" fill="currentColor" />
    `,
    get svg() {
      return `<svg viewBox="0 0 100 100" class="glyph-svg">${this.innerSvg}</svg>`;
    }
  },
  {
    id: 'V-06',
    code: '06',
    name: 'STEP-CANTILEVER',
    subtitle: 'Stepped Geometric Ziggurat',
    color: '#15448C', // Cobalt Blue
    innerSvg: `
      <path d="M 16 84 L 16 66 L 36 66 L 36 48 L 56 48 L 56 30 L 84 30 L 84 84 Z" fill="currentColor" />
      <rect x="24" y="72" width="8" height="6" fill="#F4F0E8" />
      <rect x="44" y="54" width="8" height="6" fill="#F4F0E8" />
      <rect x="64" y="36" width="8" height="6" fill="#F4F0E8" />
    `,
    get svg() {
      return `<svg viewBox="0 0 100 100" class="glyph-svg">${this.innerSvg}</svg>`;
    }
  },
  {
    id: 'V-07',
    code: '07',
    name: 'POLAR-SECTOR',
    subtitle: 'Divided Semicircular Horizon',
    color: '#F4B810', // Ochre Yellow
    innerSvg: `
      <path d="M 15 50 A 35 35 0 0 1 85 50 Z" fill="currentColor" />
      <rect x="46" y="15" width="8" height="70" fill="currentColor" />
      <circle cx="50" cy="74" r="12" fill="currentColor" />
      <circle cx="50" cy="74" r="5" fill="#F4F0E8" />
    `,
    get svg() {
      return `<svg viewBox="0 0 100 100" class="glyph-svg">${this.innerSvg}</svg>`;
    }
  },
  {
    id: 'V-08',
    code: '08',
    name: 'ANNULAR-CORE',
    subtitle: 'Slotted Concentric Bezel',
    color: '#181716', // Charcoal Black
    innerSvg: `
      <circle cx="50" cy="50" r="38" fill="currentColor" />
      <circle cx="50" cy="50" r="26" fill="#F4F0E8" />
      <circle cx="50" cy="50" r="14" fill="currentColor" />
      <rect x="45" y="6" width="10" height="88" fill="#F4F0E8" />
      <rect x="6" y="45" width="88" height="10" fill="#F4F0E8" />
      <circle cx="50" cy="50" r="8" fill="#F4F0E8" />
    `,
    get svg() {
      return `<svg viewBox="0 0 100 100" class="glyph-svg">${this.innerSvg}</svg>`;
    }
  }
];

const PRESETS = [
  // Tier 1: Intra-Metropolitan Arteries
  {
    id: 'P-01',
    tier: 1,
    tierName: 'TIER I · INTRA-METROPOLITAN ARTERIES',
    code: 'ARTERY-01',
    name: 'NEXUS-PRIME',
    destination: 'Central Bureau Administration Complex',
    transitTime: '0.4s',
    sequence: ['V-01', 'V-03', 'V-05', 'V-02', 'V-07', 'V-04']
  },
  {
    id: 'P-02',
    tier: 1,
    tierName: 'TIER I · INTRA-METROPOLITAN ARTERIES',
    code: 'ARTERY-02',
    name: 'WERK-SECTOR-4',
    destination: 'Heavy Mechanical Fabricators & Foundry',
    transitTime: '0.6s',
    sequence: ['V-02', 'V-06', 'V-01', 'V-04', 'V-08', 'V-03']
  },
  {
    id: 'P-03',
    tier: 1,
    tierName: 'TIER I · INTRA-METROPOLITAN ARTERIES',
    code: 'ARTERY-03',
    name: 'NORTH-TERMINAL',
    destination: 'Regional Freight & Material Logistics Depot',
    transitTime: '0.5s',
    sequence: ['V-04', 'V-05', 'V-02', 'V-08', 'V-01', 'V-06']
  },
  // Tier 2: Deep Kinetic Corridors
  {
    id: 'P-04',
    tier: 2,
    tierName: 'TIER II · DEEP KINETIC CORRIDORS',
    code: 'CORRIDOR-08',
    name: 'AERODROME-VECTOR',
    destination: 'High-Altitude Atmospheric Launch Pylon',
    transitTime: '1.2s',
    sequence: ['V-07', 'V-02', 'V-03', 'V-06', 'V-05', 'V-08']
  },
  {
    id: 'P-05',
    tier: 2,
    tierName: 'TIER II · DEEP KINETIC CORRIDORS',
    code: 'CORRIDOR-14',
    name: 'SUB-STRATUM-VAULT',
    destination: 'Geodetic Baseline Calibration Station',
    transitTime: '1.8s',
    sequence: ['V-08', 'V-01', 'V-06', 'V-03', 'V-04', 'V-02']
  },
  {
    id: 'P-06',
    tier: 2,
    tierName: 'TIER II · DEEP KINETIC CORRIDORS',
    code: 'CORRIDOR-22',
    name: 'TRANS-PLANAR-RELAY',
    destination: 'Outer Boundary Optical Vector Beacon',
    transitTime: '2.4s',
    sequence: ['V-03', 'V-07', 'V-08', 'V-05', 'V-02', 'V-01']
  }
];

if (typeof window !== 'undefined') {
  window.GLYPHS = GLYPHS;
  window.PRESETS = PRESETS;
}
