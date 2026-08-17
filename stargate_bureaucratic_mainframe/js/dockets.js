/**
 * D.S.T.C.L. TERMINAL OS/88-V - MUNICIPAL DOCKETS & SECTORS DATABASE
 * Contains 36 radial commutator sector definitions, registered municipal destinations,
 * procedural ticket generators, and cargo tariff compliance rules.
 */

const SECTOR_DEFINITIONS = [
  { id: 1,  code: '0x01', glyph: 'α-01', name: 'TERRA CENTRAL' },
  { id: 2,  code: '0x02', glyph: 'β-02', name: 'LUNA ORBITAL' },
  { id: 3,  code: '0x03', glyph: 'γ-03', name: 'MARS BASIN' },
  { id: 4,  code: '0x04', glyph: 'δ-04', name: 'PHOBOS CARGO' },
  { id: 5,  code: '0x05', glyph: 'ε-05', name: 'CERES MINING' },
  { id: 6,  code: '0x06', glyph: 'ζ-06', name: 'JUPITER BUOY' },
  { id: 7,  code: '0x07', glyph: 'η-07', name: 'KEPLER-186 DEPOT' },
  { id: 8,  code: '0x08', glyph: 'θ-08', name: 'EUROPA STATION' },
  { id: 9,  code: '0x09', glyph: 'ι-09', name: 'GANYMEDE COMM' },
  { id: 10, code: '0x0A', glyph: 'κ-10', name: 'CALLISTO DOCK' },
  { id: 11, code: '0x0B', glyph: 'λ-11', name: 'SATURN RING-9' },
  { id: 12, code: '0x0C', glyph: 'μ-12', name: 'TITAN HYDRO' },
  { id: 13, code: '0x0D', glyph: 'ν-13', name: 'ENCELADUS LAB' },
  { id: 14, code: '0x0E', glyph: 'ξ-14', name: 'PROXIMA POSTAL' },
  { id: 15, code: '0x0F', glyph: 'ο-15', name: 'ALPHA CENT A' },
  { id: 16, code: '0x10', glyph: 'π-16', name: 'ALPHA CENT B' },
  { id: 17, code: '0x11', glyph: 'ρ-17', name: 'TAU CETI OUT' },
  { id: 18, code: '0x12', glyph: 'σ-18', name: 'EATON BELT' },
  { id: 19, code: '0x13', glyph: 'τ-19', name: 'BARNARD QUAR' },
  { id: 20, code: '0x14', glyph: 'υ-20', name: 'ROSS 128 GRID' },
  { id: 21, code: '0x15', glyph: 'φ-21', name: 'WOLF 359 BEACON' },
  { id: 22, code: '0x16', glyph: 'χ-22', name: 'LALANDE 2118' },
  { id: 23, code: '0x17', glyph: 'ψ-23', name: 'LUYTEN ARCH' },
  { id: 24, code: '0x18', glyph: 'ω-24', name: 'KAPTEYN DOCK' },
  { id: 25, code: '0x19', glyph: 'Γ-25', name: 'VEGA COMMERCE' },
  { id: 26, code: '0x1A', glyph: 'Δ-26', name: 'ALTAIR COMM' },
  { id: 27, code: '0x1B', glyph: 'Θ-27', name: 'FOMALHAUT RING' },
  { id: 28, code: '0x1C', glyph: 'Λ-28', name: 'DENEB TRANSIT' },
  { id: 29, code: '0x1D', glyph: 'Ξ-29', name: 'ARCTURUS JET' },
  { id: 30, code: '0x1E', glyph: 'Π-30', name: 'POLLUX REFINERY' },
  { id: 31, code: '0x1F', glyph: 'Σ-31', name: 'CASTOR JUNCT' },
  { id: 32, code: '0x20', glyph: 'Φ-32', name: 'SIRIUS FOUNDRY' },
  { id: 33, code: '0x21', glyph: 'Ψ-33', name: 'BETELGEUSE RIM' },
  { id: 34, code: '0x22', glyph: 'Ω-34', name: 'RIGEL DEEP-7' },
  { id: 35, code: '0x23', glyph: 'ℵ-35', name: 'ANTARES NEXUS' },
  { id: 36, code: '0x24', glyph: 'ℶ-36', name: 'OUTER RIM SILT' }
];

const REGISTERED_DESTINATIONS = [
  {
    id: 'terra-01',
    name: 'Old Terra Municipal Hub (Orbit 1.0 AU)',
    jurisdiction: 'Sol Municipal Transit Council',
    code: 'SEC-0x01',
    coords: [1, 8, 15, 22, 29, 33, 1],
    tariffClass: 'CLASS_B_PASSENGER',
    fee: '4.50 CREDITS',
    desc: 'Class-1 Commuter Terminus. Standard passenger transport and light commercial courier.'
  },
  {
    id: 'kepler-07',
    name: 'Kepler-186 Freight & Ore Depot (Sector 7)',
    jurisdiction: 'Inter-System Heavy Haul Directorate',
    code: 'SEC-0x07',
    coords: [7, 14, 21, 28, 3, 10, 7],
    tariffClass: 'CLASS_A_HEAVY_FREIGHT',
    fee: '12.80 CREDITS',
    desc: 'High-density mineral transport. Heavy slag certified under Municipal Code § 44-D.'
  },
  {
    id: 'proxima-14',
    name: 'Proxima Centauri Postal Exchange',
    jurisdiction: 'Centauri Commonwealth Postal Board',
    code: 'SEC-0x0E',
    coords: [14, 2, 19, 26, 31, 8, 14],
    tariffClass: 'CLASS_C_PRIORITY_COURIER',
    fee: '8.20 CREDITS',
    desc: 'Sub-Aetheric packet exchange and diplomatic mail sorting facility.'
  },
  {
    id: 'barnard-19',
    name: 'Barnard\'s Star Quarantine Docks (Bio-Station)',
    jurisdiction: 'Sub-Aetheric Bio-Containment Bureau',
    code: 'SEC-0x13',
    coords: [19, 27, 4, 11, 18, 25, 19],
    tariffClass: 'CLASS_E_LIVESTOCK',
    fee: '22.00 CREDITS',
    desc: 'Strict quarantine compliance required. Thermal sterilization active on aperture.'
  },
  {
    id: 'vega-25',
    name: 'Vega Prime Commerce & Transit Core',
    jurisdiction: 'Vega Sector Trade Harmonization Commission',
    code: 'SEC-0x19',
    coords: [25, 32, 9, 16, 23, 30, 25],
    tariffClass: 'CLASS_B_PASSENGER',
    fee: '15.00 CREDITS',
    desc: 'High-volume passenger terminal. Luxury shuttles and corporate couriers.'
  },
  {
    id: 'sirius-32',
    name: 'Sirius-B Heavy Metals Foundry #4',
    jurisdiction: 'Sirius Automated Fabrication Authority',
    code: 'SEC-0x20',
    coords: [32, 6, 13, 20, 27, 34, 32],
    tariffClass: 'CLASS_D_HAZMAT',
    fee: '35.50 CREDITS',
    desc: 'Automated drone transit only. High radiation environment; biological transit forbidden.'
  },
  {
    id: 'outerrim-36',
    name: 'Outer Rim Hazardous Silt Siphon (Waste Vector)',
    jurisdiction: 'Municipal Waste & Slag Disposal Dept.',
    code: 'SEC-0x24',
    coords: [36, 5, 12, 19, 26, 33, 36],
    tariffClass: 'CLASS_D_HAZMAT',
    fee: '1.50 CREDITS',
    desc: 'Deep void expulsion conduit. One-way transit only; return vector uncalibrated.'
  }
];

const INITIAL_QUEUE_DOCKETS = [
  {
    id: 'DKT-8821',
    dest: 'Kepler-186 Freight & Ore',
    coords: [7, 14, 21, 28, 3, 10, 7],
    cargo: 'CLASS_A_HEAVY_FREIGHT',
    status: 'cleared',
    statusLabel: 'CLEARED [TX-OK]',
    timestamp: '08:14:02'
  },
  {
    id: 'DKT-8822',
    dest: 'Barnard\'s Star Quarantine',
    coords: [19, 27, 4, 11, 18, 25, 19],
    cargo: 'CLASS_E_LIVESTOCK',
    status: 'delayed',
    statusLabel: 'DELAYED [FORM 7-C]',
    timestamp: '08:19:44'
  },
  {
    id: 'DKT-8823',
    dest: 'Proxima Centauri Postal',
    coords: [14, 2, 19, 26, 31, 8, 14],
    cargo: 'CLASS_C_PRIORITY_COURIER',
    status: 'pending',
    statusLabel: 'STANDBY [QUEUE 2]',
    timestamp: '08:21:10'
  },
  {
    id: 'DKT-8824',
    dest: 'Old Terra Municipal Hub',
    coords: [1, 8, 15, 22, 29, 33, 1],
    cargo: 'CLASS_B_PASSENGER',
    status: 'pending',
    statusLabel: 'READY [FORM 44-A]',
    timestamp: '08:22:05'
  }
];

window.SECTOR_DEFINITIONS = SECTOR_DEFINITIONS;
window.REGISTERED_DESTINATIONS = REGISTERED_DESTINATIONS;
window.INITIAL_QUEUE_DOCKETS = INITIAL_QUEUE_DOCKETS;
