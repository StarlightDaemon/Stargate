/**
 * HM Imperial Aetheric Telegraph & Pneumatic Dispatch Registry
 * Original Vector Patent Schematics & Meridian Glyphs
 */

export const MERIDIAN_GLYPHS = [
  {
    id: "glyph-sol-01",
    index: 0,
    code: "SOL-01",
    name: "Sol-Governor",
    title: "Centrifugal Sol-Governor",
    patent: "GB-1888-0419A",
    sector: "Zenith Primary",
    description: "Quad-counterweight centrifugal speed governor with solar crown escapement.",
    svg: `<svg viewBox="0 0 100 100" class="glyph-svg">
      <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 4"/>
      <circle cx="50" cy="50" r="28" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="50" cy="50" r="10" fill="none" stroke="currentColor" stroke-width="2.5"/>
      <path d="M50 8 L50 22 M50 78 L50 92 M8 50 L22 50 M78 50 L92 50" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M20 20 L30 30 M70 70 L80 80 M20 80 L30 70 M70 30 L80 20" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="50" cy="50" r="4" fill="currentColor"/>
      <circle cx="20" cy="20" r="3.5" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="80" cy="80" r="3.5" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="20" cy="80" r="3.5" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="80" cy="20" r="3.5" fill="none" stroke="currentColor" stroke-width="1.5"/>
    </svg>`
  },
  {
    id: "glyph-hex-02",
    index: 1,
    code: "HEX-02",
    name: "Hex-Manifold",
    title: "Six-Port Pneumatic Manifold",
    patent: "GB-1889-1102B",
    sector: "Pneumatic Core",
    description: "Hexagonal pressurized transit capsule distributor with balanced slide valves.",
    svg: `<svg viewBox="0 0 100 100" class="glyph-svg">
      <polygon points="50,12 83,31 83,69 50,88 17,69 17,31" fill="none" stroke="currentColor" stroke-width="2"/>
      <polygon points="50,26 71,38 71,62 50,74 29,62 29,38" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3"/>
      <circle cx="50" cy="50" r="9" fill="none" stroke="currentColor" stroke-width="2"/>
      <line x1="50" y1="12" x2="50" y2="41" stroke="currentColor" stroke-width="2"/>
      <line x1="50" y1="59" x2="50" y2="88" stroke="currentColor" stroke-width="2"/>
      <line x1="17" y1="31" x2="42" y2="45" stroke="currentColor" stroke-width="2"/>
      <line x1="83" y1="69" x2="58" y2="55" stroke="currentColor" stroke-width="2"/>
      <line x1="17" y1="69" x2="42" y2="55" stroke="currentColor" stroke-width="2"/>
      <line x1="83" y1="31" x2="58" y2="45" stroke="currentColor" stroke-width="2"/>
      <circle cx="50" cy="50" r="3" fill="currentColor"/>
    </svg>`
  },
  {
    id: "glyph-gim-03",
    index: 2,
    code: "GIM-03",
    name: "Chrono-Gimbal",
    title: "Triaxial Chronometric Gimbal",
    patent: "GB-1887-3490C",
    sector: "Temporal Flux",
    description: "Cardan-suspended chronometer balance with micrometer hairspring compensator.",
    svg: `<svg viewBox="0 0 100 100" class="glyph-svg">
      <ellipse cx="50" cy="50" rx="42" ry="20" fill="none" stroke="currentColor" stroke-width="2"/>
      <ellipse cx="50" cy="50" rx="20" ry="42" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="50" cy="50" r="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 2"/>
      <line x1="8" y1="50" x2="92" y2="50" stroke="currentColor" stroke-width="1.5"/>
      <line x1="50" y1="8" x2="50" y2="92" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="50" cy="50" r="6" fill="currentColor"/>
      <rect x="46" y="6" width="8" height="4" fill="currentColor"/>
      <rect x="46" y="90" width="8" height="4" fill="currentColor"/>
      <rect x="6" y="46" width="4" height="8" fill="currentColor"/>
      <rect x="90" y="46" width="4" height="8" fill="currentColor"/>
    </svg>`
  },
  {
    id: "glyph-arc-04",
    index: 3,
    code: "ARC-04",
    name: "Galvanic-Arc",
    title: "Bipolar Galvanic Arc Discharge",
    patent: "GB-1890-5521A",
    sector: "Galvanic Tension",
    description: "High-potential carbon electrode spark array with magnetic blowout yoke.",
    svg: `<svg viewBox="0 0 100 100" class="glyph-svg">
      <path d="M50 10 L50 35 M50 65 L50 90" stroke="currentColor" stroke-width="3" stroke-linecap="square"/>
      <path d="M42 35 L58 35 M42 65 L58 65" stroke="currentColor" stroke-width="2"/>
      <path d="M50 35 L40 45 L60 52 L38 60 L50 65" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="50" cy="50" r="32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 5"/>
      <path d="M22 30 Q35 50 22 70 M78 30 Q65 50 78 70" fill="none" stroke="currentColor" stroke-width="1.8"/>
      <circle cx="38" cy="60" r="2.5" fill="currentColor"/>
      <circle cx="60" cy="52" r="2.5" fill="currentColor"/>
    </svg>`
  },
  {
    id: "glyph-mec-05",
    index: 4,
    code: "MEC-05",
    name: "Mercury-Column",
    title: "Torricellian Barometric Column",
    patent: "GB-1886-0922M",
    sector: "Barometric Density",
    description: "Hermetic Torricelli vacuum tube with graduated vernier scale and cistern float.",
    svg: `<svg viewBox="0 0 100 100" class="glyph-svg">
      <rect x="42" y="10" width="16" height="70" rx="8" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M30 80 L70 80 L75 92 L25 92 Z" fill="none" stroke="currentColor" stroke-width="2"/>
      <rect x="46" y="38" width="8" height="42" fill="currentColor" opacity="0.85"/>
      <line x1="60" y1="24" x2="68" y2="24" stroke="currentColor" stroke-width="1.5"/>
      <line x1="60" y1="36" x2="72" y2="36" stroke="currentColor" stroke-width="2"/>
      <line x1="60" y1="48" x2="68" y2="48" stroke="currentColor" stroke-width="1.5"/>
      <line x1="60" y1="60" x2="72" y2="60" stroke="currentColor" stroke-width="2"/>
      <line x1="60" y1="72" x2="68" y2="72" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="50" cy="86" r="3" fill="currentColor"/>
    </svg>`
  },
  {
    id: "glyph-pis-06",
    index: 5,
    code: "PIS-06",
    name: "Boiler-Piston",
    title: "Opposed Dual-Stroke Piston",
    patent: "GB-1888-7811P",
    sector: "Steam Pressure",
    description: "Double-acting steam expansion cylinder with Corliss trip gear linkages.",
    svg: `<svg viewBox="0 0 100 100" class="glyph-svg">
      <rect x="20" y="25" width="60" height="50" rx="3" fill="none" stroke="currentColor" stroke-width="2"/>
      <line x1="50" y1="8" x2="50" y2="92" stroke="currentColor" stroke-width="3"/>
      <rect x="25" y="44" width="50" height="12" fill="currentColor" opacity="0.8"/>
      <path d="M10 35 L20 35 M10 65 L20 65 M80 35 L90 35 M80 65 L90 65" stroke="currentColor" stroke-width="2.5"/>
      <circle cx="50" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="50" cy="92" r="4" fill="none" stroke="currentColor" stroke-width="2"/>
      <line x1="28" y1="30" x2="40" y2="42" stroke="currentColor" stroke-width="1" stroke-dasharray="2 2"/>
      <line x1="72" y1="58" x2="60" y2="70" stroke="currentColor" stroke-width="1" stroke-dasharray="2 2"/>
    </svg>`
  },
  {
    id: "glyph-spk-07",
    index: 6,
    code: "SPK-07",
    name: "Spark-Gap",
    title: "Rotary Spark Exciter",
    patent: "GB-1891-2309S",
    sector: "Resonant Ignition",
    description: "Multipolar rotary spark disc for high-frequency aetheric resonance excitation.",
    svg: `<svg viewBox="0 0 100 100" class="glyph-svg">
      <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="50" cy="50" r="16" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="50" cy="50" r="5" fill="currentColor"/>
      <circle cx="50" cy="20" r="4" fill="currentColor"/>
      <circle cx="76" cy="35" r="4" fill="currentColor"/>
      <circle cx="76" cy="65" r="4" fill="currentColor"/>
      <circle cx="50" cy="80" r="4" fill="currentColor"/>
      <circle cx="24" cy="65" r="4" fill="currentColor"/>
      <circle cx="24" cy="35" r="4" fill="currentColor"/>
      <line x1="50" y1="20" x2="50" y2="34" stroke="currentColor" stroke-width="2"/>
      <line x1="50" y1="66" x2="50" y2="80" stroke="currentColor" stroke-width="2"/>
      <line x1="76" y1="35" x2="64" y2="42" stroke="currentColor" stroke-width="2"/>
      <line x1="24" y1="65" x2="36" y2="58" stroke="currentColor" stroke-width="2"/>
      <line x1="76" y1="65" x2="64" y2="58" stroke="currentColor" stroke-width="2"/>
      <line x1="24" y1="35" x2="36" y2="42" stroke="currentColor" stroke-width="2"/>
    </svg>`
  },
  {
    id: "glyph-ley-08",
    index: 7,
    code: "LEY-08",
    name: "Leyden-Capacitor",
    title: "Multi-Plate Leyden Condenser",
    patent: "GB-1885-6674L",
    sector: "Electro-Static Store",
    description: "Glass dielectric jar battery with tin foil laminates and brass ball discharge terminal.",
    svg: `<svg viewBox="0 0 100 100" class="glyph-svg">
      <path d="M30 35 L70 35 L70 85 Q70 92 50 92 Q30 92 30 85 Z" fill="none" stroke="currentColor" stroke-width="2"/>
      <line x1="50" y1="8" x2="50" y2="60" stroke="currentColor" stroke-width="3"/>
      <circle cx="50" cy="8" r="6" fill="currentColor"/>
      <path d="M36 45 L64 45 M36 55 L64 55 M36 65 L64 65 M36 75 L64 75" stroke="currentColor" stroke-width="2" stroke-dasharray="4 2"/>
      <line x1="20" y1="85" x2="30" y2="85" stroke="currentColor" stroke-width="2"/>
      <line x1="70" y1="85" x2="80" y2="85" stroke="currentColor" stroke-width="2"/>
      <path d="M26 25 C35 30 65 30 74 25" fill="none" stroke="currentColor" stroke-width="1.5"/>
    </svg>`
  },
  {
    id: "glyph-tor-09",
    index: 8,
    code: "TOR-09",
    name: "Toroid-Coil",
    title: "Helical Toroidal Induction Choke",
    patent: "GB-1889-8819T",
    sector: "Magnetic Choke",
    description: "Closed soft-iron ring core wrapped in insulated copper wire winding coils.",
    svg: `<svg viewBox="0 0 100 100" class="glyph-svg">
      <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="50" cy="50" r="18" fill="none" stroke="currentColor" stroke-width="2"/>
      <ellipse cx="50" cy="21" rx="6" ry="11" fill="none" stroke="currentColor" stroke-width="1.8"/>
      <ellipse cx="50" cy="79" rx="6" ry="11" fill="none" stroke="currentColor" stroke-width="1.8"/>
      <ellipse cx="21" cy="50" rx="11" ry="6" fill="none" stroke="currentColor" stroke-width="1.8"/>
      <ellipse cx="79" cy="50" rx="11" ry="6" fill="none" stroke="currentColor" stroke-width="1.8"/>
      <ellipse cx="30" cy="30" rx="8" ry="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <ellipse cx="70" cy="70" rx="8" ry="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <ellipse cx="30" cy="70" rx="8" ry="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <ellipse cx="70" cy="30" rx="8" ry="8" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="50" cy="50" r="4" fill="currentColor"/>
    </svg>`
  },
  {
    id: "glyph-pri-10",
    index: 9,
    code: "PRI-10",
    name: "Aether-Prism",
    title: "Refractive Quartz Aether Prism",
    patent: "GB-1887-4401Q",
    sector: "Spectral Dispersion",
    description: "Trigonal quartz crystal prism for refracting high-frequency luminiferous aether waves.",
    svg: `<svg viewBox="0 0 100 100" class="glyph-svg">
      <polygon points="50,15 85,80 15,80" fill="none" stroke="currentColor" stroke-width="2.5"/>
      <polygon points="50,32 72,72 28,72" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 2"/>
      <line x1="8" y1="42" x2="38" y2="48" stroke="currentColor" stroke-width="2.5"/>
      <line x1="38" y1="48" x2="62" y2="52" stroke="currentColor" stroke-width="2"/>
      <line x1="62" y1="52" x2="92" y2="35" stroke="currentColor" stroke-width="1.8"/>
      <line x1="62" y1="52" x2="94" y2="52" stroke="currentColor" stroke-width="1.8"/>
      <line x1="62" y1="52" x2="90" y2="68" stroke="currentColor" stroke-width="1.8"/>
      <circle cx="50" cy="52" r="3" fill="currentColor"/>
    </svg>`
  },
  {
    id: "glyph-tri-11",
    index: 10,
    code: "TRI-11",
    name: "Vacuum-Triode",
    title: "Thermionic Valve Amplifier",
    patent: "GB-1892-0199V",
    sector: "Thermionic Relay",
    description: "Evacuated glass bulb containing heated filament cathode, control grid, and plate anode.",
    svg: `<svg viewBox="0 0 100 100" class="glyph-svg">
      <rect x="28" y="15" width="44" height="68" rx="22" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M38 72 L50 48 L62 72" fill="none" stroke="currentColor" stroke-width="2.5"/>
      <line x1="36" y1="40" x2="64" y2="40" stroke="currentColor" stroke-width="2" stroke-dasharray="4 3"/>
      <path d="M40 26 L60 26 M50 26 L50 10" stroke="currentColor" stroke-width="2.5"/>
      <circle cx="50" cy="10" r="3" fill="currentColor"/>
      <circle cx="38" cy="85" r="3" fill="currentColor"/>
      <circle cx="62" cy="85" r="3" fill="currentColor"/>
      <line x1="38" y1="72" x2="38" y2="85" stroke="currentColor" stroke-width="2"/>
      <line x1="62" y1="72" x2="62" y2="85" stroke="currentColor" stroke-width="2"/>
    </svg>`
  },
  {
    id: "glyph-dyn-12",
    index: 11,
    code: "DYN-12",
    name: "Dynamo-Stator",
    title: "Bipolar Gramme Dynamo Stator",
    patent: "GB-1886-5510D",
    sector: "Electro-Motive Force",
    description: "Salient magnetic pole shoes with Gramme ring armature and copper brush commutator.",
    svg: `<svg viewBox="0 0 100 100" class="glyph-svg">
      <circle cx="50" cy="50" r="22" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="50" cy="50" r="8" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M12 25 C25 25 30 35 30 50 C30 65 25 75 12 75" fill="none" stroke="currentColor" stroke-width="3"/>
      <path d="M88 25 C75 25 70 35 70 50 C70 65 75 75 88 75" fill="none" stroke="currentColor" stroke-width="3"/>
      <line x1="12" y1="50" x2="28" y2="50" stroke="currentColor" stroke-width="2.5"/>
      <line x1="72" y1="50" x2="88" y2="50" stroke="currentColor" stroke-width="2.5"/>
      <line x1="50" y1="8" x2="50" y2="28" stroke="currentColor" stroke-width="2"/>
      <line x1="50" y1="72" x2="50" y2="92" stroke="currentColor" stroke-width="2"/>
      <circle cx="50" cy="50" r="3" fill="currentColor"/>
    </svg>`
  },
  {
    id: "glyph-tur-13",
    index: 12,
    code: "TUR-13",
    name: "Steam-Turbine",
    title: "Parsons Reaction Steam Turbine",
    patent: "GB-1884-6735R",
    sector: "Kinetic Expansion",
    description: "Multi-stage expansion rotor with annular aerodynamic nozzle guide vanes.",
    svg: `<svg viewBox="0 0 100 100" class="glyph-svg">
      <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" stroke-width="1.8"/>
      <circle cx="50" cy="50" r="26" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3"/>
      <circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M50 12 C55 24 55 36 50 38" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M88 50 C76 55 64 55 62 50" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M50 88 C45 76 45 64 50 62" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M12 50 C24 45 36 45 38 50" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M77 23 C70 33 62 38 58 35" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M77 77 C67 70 62 62 65 58" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M23 77 C30 67 38 62 42 65" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M23 23 C33 30 38 38 35 42" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="50" cy="50" r="4" fill="currentColor"/>
    </svg>`
  },
  {
    id: "glyph-ver-14",
    index: 13,
    code: "VER-14",
    name: "Vernier-Scale",
    title: "Dual Micrometric Vernier Caliper",
    patent: "GB-1889-3211V",
    sector: "Precision Datum",
    description: "Machined sliding vernier scale with fractional sub-arc reading calipers.",
    svg: `<svg viewBox="0 0 100 100" class="glyph-svg">
      <rect x="15" y="32" width="70" height="36" fill="none" stroke="currentColor" stroke-width="2"/>
      <line x1="15" y1="50" x2="85" y2="50" stroke="currentColor" stroke-width="1.5"/>
      <line x1="22" y1="32" x2="22" y2="44" stroke="currentColor" stroke-width="2"/>
      <line x1="32" y1="32" x2="32" y2="40" stroke="currentColor" stroke-width="1.5"/>
      <line x1="42" y1="32" x2="42" y2="44" stroke="currentColor" stroke-width="2"/>
      <line x1="52" y1="32" x2="52" y2="40" stroke="currentColor" stroke-width="1.5"/>
      <line x1="62" y1="32" x2="62" y2="44" stroke="currentColor" stroke-width="2"/>
      <line x1="72" y1="32" x2="72" y2="40" stroke="currentColor" stroke-width="1.5"/>
      <line x1="22" y1="56" x2="22" y2="68" stroke="currentColor" stroke-width="2"/>
      <line x1="31" y1="60" x2="31" y2="68" stroke="currentColor" stroke-width="1.5"/>
      <line x1="40" y1="56" x2="40" y2="68" stroke="currentColor" stroke-width="2"/>
      <line x1="49" y1="60" x2="49" y2="68" stroke="currentColor" stroke-width="1.5"/>
      <line x1="58" y1="56" x2="58" y2="68" stroke="currentColor" stroke-width="2"/>
      <line x1="67" y1="60" x2="67" y2="68" stroke="currentColor" stroke-width="1.5"/>
      <line x1="76" y1="56" x2="76" y2="68" stroke="currentColor" stroke-width="2"/>
      <circle cx="50" cy="18" r="4" fill="none" stroke="currentColor" stroke-width="2"/>
      <line x1="50" y1="22" x2="50" y2="32" stroke="currentColor" stroke-width="2"/>
    </svg>`
  },
  {
    id: "glyph-pne-15",
    index: 14,
    code: "PNE-15",
    name: "Pneumatic-Shunt",
    title: "Twin-Bore Pneumatic Diverter",
    patent: "GB-1891-9044N",
    sector: "Pneumatic Routing",
    description: "Two-way pneumatic tube diverter switch with quick-release pneumatic lock.",
    svg: `<svg viewBox="0 0 100 100" class="glyph-svg">
      <path d="M15 50 L40 50 L75 22 M40 50 L75 78" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
      <circle cx="40" cy="50" r="10" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="75" cy="22" r="5" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="75" cy="78" r="5" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="15" cy="50" r="5" fill="none" stroke="currentColor" stroke-width="2"/>
      <line x1="40" y1="25" x2="40" y2="75" stroke="currentColor" stroke-width="1.5" stroke-dasharray="2 3"/>
      <circle cx="40" cy="50" r="3.5" fill="currentColor"/>
    </svg>`
  },
  {
    id: "glyph-anc-16",
    index: 15,
    code: "ANC-16",
    name: "Meridian-Anchor",
    title: "Primary Datum Meridian Anchor",
    patent: "GB-1883-0001Z",
    sector: "Greenwich Datum",
    description: "Heavy forged iron datum anchor and zero-meridian plumb line reference.",
    svg: `<svg viewBox="0 0 100 100" class="glyph-svg">
      <circle cx="50" cy="20" r="8" fill="none" stroke="currentColor" stroke-width="2.5"/>
      <line x1="50" y1="28" x2="50" y2="85" stroke="currentColor" stroke-width="3"/>
      <line x1="25" y1="40" x2="75" y2="40" stroke="currentColor" stroke-width="2.5"/>
      <path d="M20 58 C25 82 75 82 80 58" fill="none" stroke="currentColor" stroke-width="3"/>
      <path d="M15 58 L25 58 L20 50 Z M85 58 L75 58 L80 50 Z" fill="currentColor"/>
      <circle cx="50" cy="85" r="4" fill="currentColor"/>
      <circle cx="50" cy="40" r="3" fill="none" stroke="currentColor" stroke-width="2"/>
    </svg>`
  }
];

export const ESCAPEMENT_NODES = [
  { id: 1, angle: 0, name: "Escapement I: Zenith Sol-Governor", code: "ESC-Z01", role: "Primary Datum Anchor" },
  { id: 2, angle: 40, name: "Escapement II: Aetheric Flux Gland", code: "ESC-F02", role: "Aetheric Flux Vector" },
  { id: 3, angle: 80, name: "Escapement III: Harmonic Waveguide", code: "ESC-W03", role: "Resonant Frequency Guide" },
  { id: 4, angle: 120, name: "Escapement IV: Galvanic Stator", code: "ESC-G04", role: "Galvanic Tension Phase" },
  { id: 5, angle: 160, name: "Escapement V: Torricellian Column", code: "ESC-T05", role: "Barometric Density Plane" },
  { id: 6, angle: 200, name: "Escapement VI: Pneumatic Gate", code: "ESC-P06", role: "Carrier Shunt Routing" },
  { id: 7, angle: 240, name: "Escapement VII: Leyden Resonator", code: "ESC-L07", role: "Electrostatic Hold Phase" },
  { id: 8, angle: 280, name: "Escapement VIII: Spark-Gap Exciter", code: "ESC-S08", role: "Arc Discharge Ignition" },
  { id: 9, angle: 320, name: "Escapement IX: Meridian Gimbal", code: "ESC-M09", role: "Triaxial Datum Stabilizer" }
];

export const QUICK_DIAL_ENTRIES = [
  // Tier 1: Imperial Mainline Conduits (High Priority / Calibrated Conduits)
  {
    id: "qd-greenwich",
    tier: 1,
    tierName: "Imperial Mainline",
    name: "Greenwich Sub-Aetheric Vault",
    jurisdiction: "HM Board of Ordnance (London)",
    pressure: "29.92 inHg",
    voltage: "2,400 V Galv.",
    fluxRating: "Calibrated AAA",
    sequence: ["glyph-sol-01", "glyph-gim-03", "glyph-arc-04", "glyph-mec-05", "glyph-tri-11", "glyph-ver-14", "glyph-anc-16"],
    notes: "Prime meridian transit conduit to Royal Observatory central subterranean aetheric manifold."
  },
  {
    id: "qd-calcutta",
    tier: 1,
    tierName: "Imperial Mainline",
    name: "Calcutta Grand Manifold",
    jurisdiction: "Imperial Indian Telegraph Dept.",
    pressure: "31.05 inHg",
    voltage: "3,150 V Galv.",
    fluxRating: "High Volume Primary",
    sequence: ["glyph-hex-02", "glyph-pis-06", "glyph-tor-09", "glyph-dyn-12", "glyph-tur-13", "glyph-pne-15", "glyph-anc-16"],
    notes: "Direct high-throughput pneumatic passenger capsule relay via Indian Ocean submarine waveguide."
  },
  {
    id: "qd-alexandria",
    tier: 1,
    tierName: "Imperial Mainline",
    name: "New Alexandria Aerostat Exchange",
    jurisdiction: "Levant Aerial Routing Authority",
    pressure: "24.18 inHg",
    voltage: "2,800 V Galv.",
    fluxRating: "Stratospheric Calibrated",
    sequence: ["glyph-pri-10", "glyph-sol-01", "glyph-spk-07", "glyph-ley-08", "glyph-gim-03", "glyph-hex-02", "glyph-anc-16"],
    notes: "Mooring mast conduit for high-altitude transatlantic steam dirigible dispatch."
  },

  // Tier 2: Colonial & Deep Research Bore Outposts (High Flux / Experimental)
  {
    id: "qd-erebus",
    tier: 2,
    tierName: "Deep Bore Outpost",
    name: "Mt. Erebus Geothermal Dynamo",
    jurisdiction: "Antarctic Magnetic Survey",
    pressure: "34.80 inHg",
    voltage: "5,600 V Galv.",
    fluxRating: "Volcanic Overpressure",
    sequence: ["glyph-pis-06", "glyph-arc-04", "glyph-dyn-12", "glyph-tur-13", "glyph-spk-07", "glyph-ley-08", "glyph-anc-16"],
    notes: "South polar geothermal deep-bore station tapping volcanic thermal gradients for dynamo excitation."
  },
  {
    id: "qd-lunar",
    tier: 2,
    tierName: "Deep Bore Outpost",
    name: "Lunar Farside Analytical Engine",
    jurisdiction: "Imperial Selenographic Corps",
    pressure: "0.00 inHg (Torr Vac.)",
    voltage: "8,900 V Galv.",
    fluxRating: "Vacuum Luminescence",
    sequence: ["glyph-tri-11", "glyph-mec-05", "glyph-pri-10", "glyph-tor-09", "glyph-sol-01", "glyph-gim-03", "glyph-anc-16"],
    notes: "Vacuum-sealed difference engine redoubt on Mare Crisium rim calculating planetary orbital ephemerides."
  },
  {
    id: "qd-mariana",
    tier: 2,
    tierName: "Deep Bore Outpost",
    name: "Mariana Abyssal Hydropneumatic",
    jurisdiction: "Admiralty Submarine Station",
    pressure: "1,120.0 inHg",
    voltage: "4,400 V Galv.",
    fluxRating: "Hydraulic Supercritical",
    sequence: ["glyph-pne-15", "glyph-hex-02", "glyph-mec-05", "glyph-pis-06", "glyph-ver-14", "glyph-dyn-12", "glyph-anc-16"],
    notes: "Sub-sea hydrostatic research laboratory encased in 6-inch cold-rolled steel pressure sphere."
  },
  {
    id: "qd-krakatoa",
    tier: 2,
    tierName: "Deep Bore Outpost",
    name: "Krakatoa Resonant Vulcan Station",
    jurisdiction: "East Indies Volcanology Post",
    pressure: "38.20 inHg",
    voltage: "6,200 V Galv.",
    fluxRating: "Magmatic Seismic",
    sequence: ["glyph-spk-07", "glyph-arc-04", "glyph-tur-13", "glyph-ley-08", "glyph-tor-09", "glyph-pri-10", "glyph-anc-16"],
    notes: "Caldera edge acoustic resonance outpost monitoring subterranean aether harmonics."
  }
];
