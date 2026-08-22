/**
 * Stargate Orthographic CAD Terminal - Preloaded Vector Coordinate Presets
 * Bureau: Aethelgard-Voss Structural Telemetrics & CAD Engineering Bureau
 * Organized into 2 Distinct Visual Tiers:
 * Tier 1: Primary Orthogonal Vector Stations (Core Infrastructure)
 * Tier 2: Deep-Sector Extrapolated Relays (Frontier & Research Stations)
 */

export const PRESET_TIERS = {
  TIER_1: {
    id: "tier_1",
    name: "TIER 1: PRIMARY ORTHOGONAL STATIONS",
    description: "Core structural conduits with certified 3rd-angle baseline metrics.",
    badgeClass: "tier-core"
  },
  TIER_2: {
    id: "tier_2",
    name: "TIER 2: DEEP-SECTOR EXTRAPOLATED RELAYS",
    description: "High-curvature frontier nodes subject to Section 14-B telemetric review.",
    badgeClass: "tier-deep"
  }
};

export const QUICK_DIAL_PRESETS = [
  // Tier 1: Core Primary Stations
  {
    id: "helios_prime",
    tier: "tier_1",
    name: "HELIOS-PRIME ORBITAL",
    designation: "STG-ORB-014-A",
    sector: "SOL-MERIDIAN-01",
    energyReq: "3.84 TeV",
    desc: "Astrometric L1 Lagrange station, orbital drydock vector slipway.",
    address: [1, 8, 14, 3, 19, 22, 0], // Indices into 24-glyph set (0 = ORIGIN DATUM)
    hash: "0x8F94B2",
    status: "VALIDATED"
  },
  {
    id: "cygnus_epsilon",
    tier: "tier_1",
    name: "CYGNUS-EPSILON TERMINAL",
    designation: "STG-TRM-882-C",
    sector: "CYG-CYGNI-44",
    energyReq: "4.12 TeV",
    desc: "Deep-sky transit hub, high-density stellar telemetry nexus.",
    address: [4, 11, 9, 17, 2, 20, 0],
    hash: "0xC499D1",
    status: "VALIDATED"
  },
  {
    id: "vortex_datum",
    tier: "tier_1",
    name: "VORTEX-DATUM ALPHA",
    designation: "STG-DTM-001-V",
    sector: "ISO-NULL-00",
    energyReq: "4.45 TeV",
    desc: "Primary meridian benchmark station, geodetic baseline emitter.",
    address: [7, 15, 23, 6, 12, 18, 0],
    hash: "0xAA410E",
    status: "VALIDATED"
  },

  // Tier 2: Deep-Sector Extrapolated Relays
  {
    id: "khor_null",
    tier: "tier_2",
    name: "KHOR-NULL DEEP RELAY",
    designation: "STG-RLY-990-X",
    sector: "VOID-ABYSS-99",
    energyReq: "4.92 TeV",
    desc: "Extragalactic void monitoring relay, abyssal telemetric array.",
    address: [13, 5, 21, 10, 16, 24, 0],
    hash: "0xEE3310",
    status: "HIGH-CURVATURE"
  },
  {
    id: "hyperion_rift",
    tier: "tier_2",
    name: "HYPERION RIFT STATION",
    designation: "STG-RFT-512-H",
    sector: "GRAV-SHEAR-07",
    energyReq: "5.18 TeV",
    desc: "High-curvature gravitational shear research laboratory.",
    address: [2, 18, 5, 22, 11, 7, 0],
    hash: "0x91DC7A",
    status: "HIGH-CURVATURE"
  },
  {
    id: "perseus_frontier",
    tier: "tier_2",
    name: "PERSEUS FRONTIER VAULT",
    designation: "STG-VLT-304-P",
    sector: "PER-EXP-12",
    energyReq: "4.75 TeV",
    desc: "Astrometric archive facility, deep vector coordinate repository.",
    address: [16, 3, 12, 24, 8, 19, 0],
    hash: "0x7701FA",
    status: "ARCHIVE"
  }
];
