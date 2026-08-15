/**
 * Aethel-Ring Collider (ARC) Collision Target Registry
 * Calibrated destination nodes with relativistic lattice coordinates.
 */

const COLLISION_REGISTRY = [
  // --- TIER 1: VALIDATED LEPTONIC CHANNELS (High Stability / Standard Calibration) ---
  {
    id: "T1-ARC-01",
    designation: "ALPHA CENTAURI RESONANCE NODE",
    tier: "Tier 1: Validated Leptonic",
    tierClass: "tier-1",
    coordinates: [3, 7, 11, 2, 14, 8],
    beamEnergyTeV: 3.85,
    magneticFieldTesla: 8.42,
    luminosity: 1.25e34,
    stabilityRating: 99.4,
    vacuumMargin: "1.1e-10 mbar",
    lastCollision: "2026-08-14 18:42:10 UTC",
    notes: "Primary calibration benchmark. Stable 3.85 TeV electron-positron leptonic inversion vertex."
  },
  {
    id: "T1-ARC-02",
    designation: "PROXIMA D BIPOLAR FOCUS",
    tier: "Tier 1: Validated Leptonic",
    tierClass: "tier-1",
    coordinates: [1, 5, 9, 13, 4, 16],
    beamEnergyTeV: 4.10,
    magneticFieldTesla: 8.95,
    luminosity: 1.48e34,
    stabilityRating: 98.7,
    vacuumMargin: "1.0e-10 mbar",
    lastCollision: "2026-08-13 11:05:32 UTC",
    notes: "High-luminosity orbital waypoint. Standard quadrupole doublet steering vector."
  },
  {
    id: "T1-ARC-03",
    designation: "BARNARD APERTURE ZERO",
    tier: "Tier 1: Validated Leptonic",
    tierClass: "tier-1",
    coordinates: [2, 6, 10, 14, 1, 9],
    beamEnergyTeV: 4.50,
    magneticFieldTesla: 9.30,
    luminosity: 1.82e34,
    stabilityRating: 97.9,
    vacuumMargin: "1.3e-10 mbar",
    lastCollision: "2026-08-12 04:19:44 UTC",
    notes: "Low betatron tune spread. Ideal for prolonged micro-wormhole topological transport."
  },
  {
    id: "T1-ARC-04",
    designation: "SIRIUS-A LUMINOSITY CORRIDOR",
    tier: "Tier 1: Validated Leptonic",
    tierClass: "tier-1",
    coordinates: [4, 8, 12, 16, 5, 11],
    beamEnergyTeV: 5.20,
    magneticFieldTesla: 9.85,
    luminosity: 2.10e34,
    stabilityRating: 96.5,
    vacuumMargin: "1.2e-10 mbar",
    lastCollision: "2026-08-10 22:50:18 UTC",
    notes: "Direct high-flux lepton transit conduit. Superconducting dipole field ramp required."
  },
  {
    id: "T1-ARC-05",
    designation: "EPSILON ERIDANI HARMONIC BEACON",
    tier: "Tier 1: Validated Leptonic",
    tierClass: "tier-1",
    coordinates: [6, 12, 2, 8, 14, 4],
    beamEnergyTeV: 5.80,
    magneticFieldTesla: 10.15,
    luminosity: 2.45e34,
    stabilityRating: 95.8,
    vacuumMargin: "1.4e-10 mbar",
    lastCollision: "2026-08-09 15:33:07 UTC",
    notes: "Hexagonal symmetric dipole excitation pattern. High coherent synchrotron radiation yield."
  },

  // --- TIER 2: HEAVY HADRONIC RESONANCES (Medium-High Energy / Multi-TeV) ---
  {
    id: "T2-ARC-06",
    designation: "TRAPPIST-1E ISOCHRONOUS GATE",
    tier: "Tier 2: Heavy Hadronic",
    tierClass: "tier-2",
    coordinates: [5, 10, 15, 3, 8, 13],
    beamEnergyTeV: 7.25,
    magneticFieldTesla: 11.40,
    luminosity: 3.80e34,
    stabilityRating: 92.3,
    vacuumMargin: "9.2e-11 mbar",
    lastCollision: "2026-08-07 09:12:51 UTC",
    notes: "Heavy proton-antiproton resonance. Requires sextupole chromaticity correction."
  },
  {
    id: "T2-ARC-07",
    designation: "KEPLER-442B TOPOLOGICAL INVERSION",
    tier: "Tier 2: Heavy Hadronic",
    tierClass: "tier-2",
    coordinates: [7, 14, 4, 11, 1, 8],
    beamEnergyTeV: 8.50,
    magneticFieldTesla: 12.10,
    luminosity: 4.50e34,
    stabilityRating: 89.6,
    vacuumMargin: "8.8e-11 mbar",
    lastCollision: "2026-08-05 20:41:09 UTC",
    notes: "High transverse momentum quark-gluon plasma vertex. Strong Cherenkov halo."
  },
  {
    id: "T2-ARC-08",
    designation: "GLIESE-667C HELICITY SINGLET",
    tier: "Tier 2: Heavy Hadronic",
    tierClass: "tier-2",
    coordinates: [9, 3, 13, 7, 2, 12],
    beamEnergyTeV: 9.10,
    magneticFieldTesla: 12.65,
    luminosity: 5.15e34,
    stabilityRating: 88.1,
    vacuumMargin: "8.5e-11 mbar",
    lastCollision: "2026-08-03 14:02:37 UTC",
    notes: "Polarized ion beam collision topology with spin-rotation quadrupole insertion."
  },
  {
    id: "T2-ARC-09",
    designation: "HD-40307G ASYMPTOTIC CAVITY",
    tier: "Tier 2: Heavy Hadronic",
    tierClass: "tier-2",
    coordinates: [11, 6, 1, 12, 7, 15],
    beamEnergyTeV: 9.80,
    magneticFieldTesla: 13.05,
    luminosity: 5.90e34,
    stabilityRating: 86.4,
    vacuumMargin: "7.9e-11 mbar",
    lastCollision: "2026-07-31 01:25:40 UTC",
    notes: "Deep relativistic gluon shower vertex. RF cavity accelerating gradient at 32 MV/m."
  },

  // --- TIER 3: EXOTIC SINGULARITY VECTORS (Extreme Relativistic / Inversion Horizons) ---
  {
    id: "T3-ARC-10",
    designation: "CYGNUS X-1 INVERSION HORIZON",
    tier: "Tier 3: Exotic Singularity",
    tierClass: "tier-3",
    coordinates: [13, 1, 6, 11, 16, 8],
    beamEnergyTeV: 13.60,
    magneticFieldTesla: 15.20,
    luminosity: 8.70e34,
    stabilityRating: 78.2,
    vacuumMargin: "6.2e-11 mbar",
    lastCollision: "2026-07-28 17:10:05 UTC",
    notes: "Extreme micro-black hole creation threshold. Strong gravitational frame-dragging curvature."
  },
  {
    id: "T3-ARC-11",
    designation: "SAGITTARIUS A* SUB-SPATIAL ANCHOR",
    tier: "Tier 3: Exotic Singularity",
    tierClass: "tier-3",
    coordinates: [15, 8, 2, 9, 14, 5],
    beamEnergyTeV: 14.80,
    magneticFieldTesla: 16.00,
    luminosity: 9.95e34,
    stabilityRating: 74.5,
    vacuumMargin: "5.5e-11 mbar",
    lastCollision: "2026-07-22 08:33:19 UTC",
    notes: "Galactic center harmonic singularity link. Quench protection limiters operating near threshold."
  },
  {
    id: "T3-ARC-12",
    designation: "PULSAR J1748 RELATIVISTIC JET",
    tier: "Tier 3: Exotic Singularity",
    tierClass: "tier-3",
    coordinates: [16, 4, 12, 3, 10, 7],
    beamEnergyTeV: 15.50,
    magneticFieldTesla: 16.45,
    luminosity: 1.15e35,
    stabilityRating: 71.8,
    vacuumMargin: "5.1e-11 mbar",
    lastCollision: "2026-07-15 12:44:00 UTC",
    notes: "Millisecond pulsar polar alignment. Extreme coherent synchrotron radiation emission."
  }
];

class CollisionRegistryController {
  constructor() {
    this.targets = COLLISION_REGISTRY;
    this.activeFilter = 'all';
    this.searchQuery = '';
  }

  getFilteredTargets() {
    return this.targets.filter(t => {
      const matchTier = this.activeFilter === 'all' || 
        (this.activeFilter === 'tier-1' && t.tierClass === 'tier-1') ||
        (this.activeFilter === 'tier-2' && t.tierClass === 'tier-2') ||
        (this.activeFilter === 'tier-3' && t.tierClass === 'tier-3');
      
      const q = this.searchQuery.toLowerCase().trim();
      const matchQuery = !q || 
        t.designation.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.notes.toLowerCase().includes(q) ||
        t.tier.toLowerCase().includes(q);

      return matchTier && matchQuery;
    });
  }

  getQuickDialTargets() {
    // Return standard curated quick-dial list (distributed across tiers)
    return [
      this.targets[0], // Alpha Centauri (Tier 1)
      this.targets[1], // Proxima D (Tier 1)
      this.targets[2], // Barnard Aperture (Tier 1)
      this.targets[5], // Trappist-1e (Tier 2)
      this.targets[6], // Kepler-442b (Tier 2)
      this.targets[9]  // Cygnus X-1 (Tier 3)
    ];
  }

  findById(id) {
    return this.targets.find(t => t.id === id);
  }
}

window.collisionRegistry = new CollisionRegistryController();
