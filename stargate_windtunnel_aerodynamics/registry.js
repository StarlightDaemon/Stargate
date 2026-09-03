// ============================================================================
// Aeolos Stagnation Plenum (ASP-9) — Aerodynamic Symbol & Target Registry
// Single Source of Truth for Vane Sectors, Symbols, and Test Run Profiles
// ============================================================================

export const AERODYNAMIC_SECTORS = [
  {
    id: 1,
    code: "LAM-01",
    name: "Laminar Core",
    symbol: "LAM-α0",
    angleDeg: 0,
    vanePitch: "+0.0°",
    vanePitchVal: 0.0,
    pitotRef: 101.3,
    profileType: "Parabolic Falkner-Skan",
    desc: "Zero-pressure-gradient laminar boundary layer; initial flow conditioning baseline.",
    glyphSvg: `<path d="M 6 25 Q 25 15, 44 25 M 6 18 Q 25 8, 44 18 M 6 32 Q 25 22, 44 32" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>`
  },
  {
    id: 2,
    code: "PRN-02",
    name: "Prandtl-Glauert",
    symbol: "PRN-M1",
    angleDeg: 30,
    vanePitch: "+2.4°",
    vanePitchVal: 2.4,
    pitotRef: 104.8,
    profileType: "Singularity Transformation",
    desc: "Compressibility scaling regime approaching sonic velocity throat condition.",
    glyphSvg: `<path d="M 8 38 L 25 10 L 42 38 Z M 25 10 L 25 38 M 16 26 L 34 26" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>`
  },
  {
    id: 3,
    code: "KRM-03",
    name: "Kármán-Trefftz",
    symbol: "KRM-θ",
    angleDeg: 60,
    vanePitch: "+4.8°",
    vanePitchVal: 4.8,
    pitotRef: 108.2,
    profileType: "Finite Angle Trailing-Edge",
    desc: "Conformal cusp profile with controlled circulation and smooth vortex release.",
    glyphSvg: `<circle cx="25" cy="25" r="16" fill="none" stroke="currentColor" stroke-width="2"/><path d="M 9 25 L 41 25 M 25 9 L 25 41 M 36 14 L 14 36" stroke="currentColor" stroke-width="1.8"/>`
  },
  {
    id: 4,
    code: "MCH-04",
    name: "Mach Diamond",
    symbol: "MCH-◆",
    angleDeg: 90,
    vanePitch: "+7.2°",
    vanePitchVal: 7.2,
    pitotRef: 112.6,
    profileType: "Periodic Shock Cell",
    desc: "Under-expanded supersonic jet shock intersection; symmetric reflection cell.",
    glyphSvg: `<polygon points="25,8 42,25 25,42 8,25" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="25" cy="25" r="5" fill="none" stroke="currentColor" stroke-width="2"/>`
  },
  {
    id: 5,
    code: "CND-05",
    name: "Coandă Shear",
    symbol: "CND-∇",
    angleDeg: 120,
    vanePitch: "+9.6°",
    vanePitchVal: 9.6,
    pitotRef: 117.1,
    profileType: "Curved Wall Entrainment",
    desc: "Boundary layer wall adhesion along convex guide nozzle curvatures.",
    glyphSvg: `<path d="M 10 38 C 12 18, 32 12, 42 12 M 10 32 C 16 16, 32 16, 40 24 M 10 24 C 18 18, 28 20, 36 30" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`
  },
  {
    id: 6,
    code: "EUL-06",
    name: "Euler Stagnation",
    symbol: "EUL-Ω",
    angleDeg: 150,
    vanePitch: "+12.0°",
    vanePitchVal: 12.0,
    pitotRef: 122.4,
    profileType: "Inviscid Conservation",
    desc: "Total enthalpy conservation across inviscid stagnation streamline core.",
    glyphSvg: `<circle cx="25" cy="25" r="17" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="4 2"/><circle cx="25" cy="25" r="8" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="25" cy="25" r="2" fill="currentColor"/>`
  },
  {
    id: 7,
    code: "SPC-07",
    name: "Supercritical Camber",
    symbol: "SPC-δ",
    angleDeg: 180,
    vanePitch: "-12.0°",
    vanePitchVal: -12.0,
    pitotRef: 121.8,
    profileType: "Shock-Free Expansion",
    desc: "Flattened upper suction surface delaying wave drag onset at transonic speeds.",
    glyphSvg: `<path d="M 8 32 C 16 14, 34 14, 42 32 Z" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M 14 26 L 36 26" stroke="currentColor" stroke-width="1.8"/>`
  },
  {
    id: 8,
    code: "RYN-08",
    name: "Reynolds Critical",
    symbol: "RYN-Re",
    angleDeg: 210,
    vanePitch: "-9.6°",
    vanePitchVal: -9.6,
    pitotRef: 116.5,
    profileType: "Tollmien-Schlichting Wave",
    desc: "Incipient laminar-turbulent transition packet; acoustic damping vector.",
    glyphSvg: `<path d="M 6 25 Q 15 12, 25 25 T 44 25 M 6 30 Q 15 20, 25 30 T 44 30" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`
  },
  {
    id: 9,
    code: "PTT-09",
    name: "Pitot Rake Total",
    symbol: "PTT-P0",
    angleDeg: 240,
    vanePitch: "-7.2°",
    vanePitchVal: -7.2,
    pitotRef: 111.9,
    profileType: "Multi-Port Stagnation",
    desc: "Dynamic head integration across 24-point transverse total pressure rake.",
    glyphSvg: `<path d="M 12 10 L 12 40 M 12 15 L 38 15 M 12 25 L 38 25 M 12 35 L 38 35 M 38 10 L 38 40" fill="none" stroke="currentColor" stroke-width="2"/>`
  },
  {
    id: 10,
    code: "SCH-10",
    name: "Schlieren Knife-Edge",
    symbol: "SCH-λ",
    angleDeg: 270,
    vanePitch: "-4.8°",
    vanePitchVal: -4.8,
    pitotRef: 107.5,
    profileType: "Refractive Density Gradient",
    desc: "Toepler optical knife-edge alignment along fluid density first-derivative axes.",
    glyphSvg: `<circle cx="25" cy="25" r="16" fill="none" stroke="currentColor" stroke-width="2"/><line x1="25" y1="5" x2="25" y2="45" stroke="currentColor" stroke-width="2.5"/><path d="M 25 15 L 38 25 L 25 35 Z" fill="currentColor" fill-opacity="0.3" stroke="currentColor" stroke-width="1.5"/>`
  },
  {
    id: 11,
    code: "SHK-11",
    name: "Bow Shockwave",
    symbol: "SHK-β",
    angleDeg: 300,
    vanePitch: "-2.4°",
    vanePitchVal: -2.4,
    pitotRef: 104.1,
    profileType: "Detached Normal Hugoniot",
    desc: "Blunt-body standoff shock discontinuity; high entropy temperature jump.",
    glyphSvg: `<path d="M 38 8 C 16 14, 16 36, 38 42 M 34 14 C 22 18, 22 32, 34 36" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="32" cy="25" r="4" fill="currentColor"/>`
  },
  {
    id: 12,
    code: "VRT-12",
    name: "Vortex Stagnation",
    symbol: "VRT-Γ",
    angleDeg: 330,
    vanePitch: "-0.5°",
    vanePitchVal: -0.5,
    pitotRef: 102.0,
    profileType: "Rankine Combined Swirl",
    desc: "Bound core vorticity decay with zero radial velocity divergence.",
    glyphSvg: `<path d="M 25 25 m -16 0 a 16 16 0 1 0 32 0 a 12 12 0 1 0 -24 0 a 8 8 0 1 0 16 0 a 4 4 0 1 0 -8 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`
  }
];

export const TEST_RUN_PROFILES = [
  {
    id: "preset-naca0012",
    name: "NACA-0012 Transonic Calibration",
    class: "Standard Validation",
    targetMach: "M 0.82",
    targetRe: "3.4 × 10⁶",
    sequence: [1, 4, 2, 8, 10, 6],
    summary: "Baseline symmetric airfoil polar validation across the transonic drag-divergence crest."
  },
  {
    id: "preset-supercritical",
    name: "Supercritical SC-W04 Polar",
    class: "Advanced Commercial",
    targetMach: "M 0.88",
    targetRe: "4.8 × 10⁶",
    sequence: [7, 2, 4, 10, 3, 9],
    summary: "Upper-surface shock deceleration matrix for cruise speed drag reduction."
  },
  {
    id: "preset-waverider",
    name: "Waverider Hypersonic Shock Ramp",
    class: "Supersonic High-L/D",
    targetMach: "M 1.45",
    targetRe: "6.2 × 10⁶",
    sequence: [11, 4, 9, 1, 10, 5],
    summary: "Attached compression wedge wave-riding configuration under full nozzle expansion."
  },
  {
    id: "preset-lfc",
    name: "Laminar Flow Suction Matrix",
    class: "Boundary Layer Control",
    targetMach: "M 0.76",
    targetRe: "2.9 × 10⁶",
    sequence: [1, 8, 9, 10, 7, 2],
    summary: "Micro-perforated boundary suction sequence suppressing Tollmien-Schlichting transition."
  }
];
