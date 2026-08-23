/**
 * STARGATE: LE NIMBUS FLORIÉ (Art Nouveau Botanical Portal)
 * Glyph & Iconography Registry
 * The Ennead of Botanical Phases (9 Motifs) & Septet of Harmony (7-Glyph Address Length)
 */

const GLYPHS = [
  {
    id: "iris",
    index: 1,
    name: "Iris Florentina",
    commonName: "The Iris of Vigilance",
    frenchTitle: "L'Iris de Vigilance",
    phase: "Phase I: Vernal Dawn",
    harmonicFreq: 432,
    pigment: "Bleu d'Outremer & Or",
    pigmentHex: "#1a4b6e",
    accentHex: "#d4af37",
    meaning: "Perception across the dimensional veil; botanical vigilance and gateway orientation.",
    svgPath: "M50,15 C45,28 32,38 25,50 C38,52 45,62 50,85 C55,62 62,52 75,50 C68,38 55,28 50,15 Z M50,35 C48,45 42,50 38,55 C45,55 48,60 50,70 C52,60 55,55 62,55 C58,50 52,45 50,35 Z M50,20 Q50,5 50,2 M50,85 Q50,95 50,98 M25,50 Q10,50 2,50 M75,50 Q90,50 98,50",
    iconDetails: `<g class="glyph-art iris-art">
      <path d="M50,12 C40,28 26,40 18,52 C32,54 42,65 50,88 C58,65 68,54 82,52 C74,40 60,28 50,12 Z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M50,25 C45,38 35,46 28,54 C38,56 46,65 50,78 C54,65 62,56 72,54 C65,46 55,38 50,25 Z" fill="currentColor" fill-opacity="0.25" stroke="currentColor" stroke-width="1.5"/>
      <path d="M50,38 C47,46 44,52 38,56 C44,57 48,64 50,70 C52,64 56,57 62,56 C56,52 53,46 50,38 Z" fill="currentColor" stroke="currentColor" stroke-width="1"/>
      <circle cx="50" cy="50" r="3" fill="#d4af37"/>
      <path d="M50,12 Q50,2 50,0 M50,88 Q50,98 50,100 M18,52 Q5,52 0,52 M82,52 Q95,52 100,52" stroke="currentColor" stroke-width="1" stroke-dasharray="2,2"/>
    </g>`
  },
  {
    id: "peacock",
    index: 2,
    name: "Pavonis Oculus",
    commonName: "The Peacock's Ocellus",
    frenchTitle: "L'Œil de Paon Iridescent",
    phase: "Phase II: Folial Expansion",
    harmonicFreq: 528,
    pigment: "Émeraude & Cuivre Doré",
    pigmentHex: "#1b4d3e",
    accentHex: "#c59b27",
    meaning: "Chromatic iridescence and prismatic alignment; refraction of trans-aetheric rays.",
    svgPath: "M50,10 C30,30 20,55 50,90 C80,55 70,30 50,10 Z M50,30 C38,45 35,60 50,78 C65,60 62,45 50,30 Z M50,45 C44,52 42,60 50,68 C58,60 56,52 50,45 Z",
    iconDetails: `<g class="glyph-art peacock-art">
      <path d="M50,8 C28,32 18,58 50,92 C82,58 72,32 50,8 Z" fill="none" stroke="currentColor" stroke-width="2.5"/>
      <path d="M50,25 C36,42 30,60 50,80 C70,60 64,42 50,25 Z" fill="currentColor" fill-opacity="0.3" stroke="currentColor" stroke-width="1.8"/>
      <ellipse cx="50" cy="54" rx="14" ry="18" fill="currentColor" fill-opacity="0.4" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="50" cy="54" r="7" fill="#c59b27" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="50" cy="54" r="3" fill="#1a4b6e"/>
      <path d="M50,92 C48,96 45,99 40,100 M50,92 C52,96 55,99 60,100" stroke="currentColor" stroke-width="1.5"/>
    </g>`
  },
  {
    id: "ginkgo",
    index: 3,
    name: "Ginkgo Biloba",
    commonName: "The Twin-Lobed Fan",
    frenchTitle: "La Feuille de Ginkgo Ancestrale",
    phase: "Phase III: Floral Zenith",
    harmonicFreq: 639,
    pigment: "Ocre Ambré & Vermillon",
    pigmentHex: "#8c581e",
    accentHex: "#d9822b",
    meaning: "Temporal endurance and botanical memory; bifurcation of paths into harmonic equilibrium.",
    svgPath: "M50,90 Q48,70 50,60 C30,60 10,45 15,25 C25,12 45,20 50,35 C55,20 75,12 85,25 C90,45 70,60 50,60 Z",
    iconDetails: `<g class="glyph-art ginkgo-art">
      <path d="M50,92 Q48,68 50,58 C25,58 8,42 14,22 C24,10 44,18 50,34 C56,18 76,10 86,22 C92,42 75,58 50,58 Z" fill="currentColor" fill-opacity="0.25" stroke="currentColor" stroke-width="2.5"/>
      <path d="M50,58 Q35,40 28,26 M50,58 Q40,35 40,20 M50,58 Q50,40 50,34 M50,58 Q60,35 60,20 M50,58 Q65,40 72,26" stroke="currentColor" stroke-width="1.2" fill="none"/>
      <path d="M50,58 Q48,78 50,92" stroke="#d4af37" stroke-width="2" fill="none"/>
    </g>`
  },
  {
    id: "dragonfly",
    index: 4,
    name: "Libellula Alata",
    commonName: "The Dragonfly Wing",
    frenchTitle: "L'Aile de Libellule Diaphane",
    phase: "Phase IV: Solstitial Aether",
    harmonicFreq: 741,
    pigment: "Azur Céleste & Nacre",
    pigmentHex: "#1c6168",
    accentHex: "#7cd3d9",
    meaning: "Aetheric levitation and diaphanous veil piercing; swift celestial resonance.",
    svgPath: "M50,15 L50,85 M50,35 C20,15 5,30 25,45 C40,50 48,42 50,38 M50,35 C80,15 95,30 75,45 C60,50 52,42 50,38 M50,45 C25,35 15,55 30,65 C42,68 48,55 50,48 M50,45 C75,35 85,55 70,65 C58,68 52,55 50,48",
    iconDetails: `<g class="glyph-art dragonfly-art">
      <path d="M50,10 L50,90" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
      <ellipse cx="50" cy="20" rx="4" ry="7" fill="currentColor"/>
      <path d="M50,28 C20,10 6,24 24,40 C38,46 48,36 50,32 Z" fill="currentColor" fill-opacity="0.3" stroke="currentColor" stroke-width="1.5"/>
      <path d="M50,28 C80,10 94,24 76,40 C62,46 52,36 50,32 Z" fill="currentColor" fill-opacity="0.3" stroke="currentColor" stroke-width="1.5"/>
      <path d="M50,40 C28,30 16,48 30,58 C42,62 48,50 50,44 Z" fill="currentColor" fill-opacity="0.25" stroke="currentColor" stroke-width="1.5"/>
      <path d="M50,40 C72,30 84,48 70,58 C58,62 52,50 50,44 Z" fill="currentColor" fill-opacity="0.25" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="50" cy="15" r="2.5" fill="#7cd3d9"/>
    </g>`
  },
  {
    id: "waterlily",
    index: 5,
    name: "Nymphaea Alba",
    commonName: "The Water Lily of Serenity",
    frenchTitle: "Le Nénuphar des Eaux Calmes",
    phase: "Phase V: Fructal Equinox",
    harmonicFreq: 852,
    pigment: "Rose Poudré & Jade",
    pigmentHex: "#5c3342",
    accentHex: "#d998a6",
    meaning: "Surface-tension transcendence and reflective serenity; unbroken passage across voids.",
    svgPath: "M50,85 C20,85 10,65 20,55 C30,45 45,55 50,30 C55,55 70,45 80,55 C90,65 80,85 50,85 Z M50,30 C45,45 35,50 35,65 C45,70 50,60 50,60 C50,60 55,70 65,65 C65,50 55,45 50,30 Z",
    iconDetails: `<g class="glyph-art waterlily-art">
      <path d="M15,75 C25,85 75,85 85,75 C70,70 30,70 15,75 Z" fill="#1b4d3e" fill-opacity="0.4" stroke="currentColor" stroke-width="1.5"/>
      <path d="M50,22 C44,40 30,50 22,65 C34,68 45,62 50,75 C55,62 66,68 78,65 C70,50 56,40 50,22 Z" fill="currentColor" fill-opacity="0.3" stroke="currentColor" stroke-width="2"/>
      <path d="M50,32 C46,45 38,54 32,64 C40,66 46,60 50,70 C54,60 60,66 68,64 C62,54 54,45 50,32 Z" fill="currentColor" fill-opacity="0.4" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="50" cy="55" r="4" fill="#d998a6"/>
    </g>`
  },
  {
    id: "passiflora",
    index: 6,
    name: "Passiflora Caerulea",
    commonName: "The Passion-Vine",
    frenchTitle: "La Passiflore Stellaire",
    phase: "Phase VI: Aureal Dusk",
    harmonicFreq: 963,
    pigment: "Violet Impérial & Argent",
    pigmentHex: "#3e244d",
    accentHex: "#aa7ec4",
    meaning: "Tenfold radial geometry and structural fortitude; tenaciously binding distant stations.",
    svgPath: "M50,15 L50,85 M15,50 L85,50 M25,25 L75,75 M25,75 L75,25 M50,50 m-20,0 a20,20 0 1,0 40,0 a20,20 0 1,0 -40,0",
    iconDetails: `<g class="glyph-art passiflora-art">
      <circle cx="50" cy="50" r="36" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4,3"/>
      <circle cx="50" cy="50" r="22" fill="currentColor" fill-opacity="0.3" stroke="currentColor" stroke-width="2"/>
      <path d="M50,12 L50,88 M12,50 L88,50 M23,23 L77,77 M23,77 L77,23" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="50" cy="50" r="10" fill="#3e244d" stroke="#aa7ec4" stroke-width="1.5"/>
      <circle cx="50" cy="50" r="4" fill="#d4af37"/>
    </g>`
  },
  {
    id: "ivy",
    index: 7,
    name: "Hedera Helix",
    commonName: "The Whiplash Tendril",
    frenchTitle: "Le Lierre en Coup de Fouet",
    phase: "Phase VII: Autumnal Decrescendo",
    harmonicFreq: 396,
    pigment: "Vert Malachite & Bronze",
    pigmentHex: "#22472b",
    accentHex: "#689c66",
    meaning: "Whiplash curves of binding aether; organic continuity wrapping dimensional apertures.",
    svgPath: "M30,85 C15,65 25,45 40,45 C55,45 60,30 45,15 C65,15 75,35 60,55 C45,75 55,85 70,85",
    iconDetails: `<g class="glyph-art ivy-art">
      <path d="M28,88 C10,65 22,42 42,42 C62,42 66,22 48,12 C72,12 84,36 66,60 C48,82 62,88 78,88" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
      <path d="M38,40 C30,30 20,32 18,44 C26,48 34,44 38,40 Z" fill="currentColor" fill-opacity="0.4" stroke="currentColor" stroke-width="1.2"/>
      <path d="M62,56 C70,48 80,50 82,62 C74,66 66,62 62,56 Z" fill="currentColor" fill-opacity="0.4" stroke="currentColor" stroke-width="1.2"/>
      <circle cx="48" cy="12" r="3" fill="#689c66"/>
      <circle cx="78" cy="88" r="3" fill="#d4af37"/>
    </g>`
  },
  {
    id: "poppy",
    index: 8,
    name: "Papaver Somniferum",
    commonName: "The Opium Bloom",
    frenchTitle: "Le Pavot des Songes Aethériques",
    phase: "Phase VIII: Hibernal Stillness",
    harmonicFreq: 417,
    pigment: "Pourpre Carmin & Cendre",
    pigmentHex: "#541926",
    accentHex: "#c94d62",
    meaning: "Liminal transition and trans-dimensional sleep; quiet crossing of great distances.",
    svgPath: "M50,85 L50,55 M50,55 C30,55 20,40 30,25 C40,15 50,30 50,30 C50,30 60,15 70,25 C80,40 70,55 50,55 Z",
    iconDetails: `<g class="glyph-art poppy-art">
      <path d="M50,92 L50,55" stroke="currentColor" stroke-width="2.5"/>
      <path d="M50,55 C22,55 12,38 24,20 C38,10 50,28 50,28 C50,28 62,10 76,20 C88,38 78,55 50,55 Z" fill="currentColor" fill-opacity="0.35" stroke="currentColor" stroke-width="2"/>
      <circle cx="50" cy="38" r="8" fill="#541926" stroke="#c94d62" stroke-width="1.5"/>
      <line x1="50" y1="30" x2="50" y2="46" stroke="#d4af37" stroke-width="1.5"/>
      <line x1="42" y1="38" x2="58" y2="38" stroke="#d4af37" stroke-width="1.5"/>
    </g>`
  },
  {
    id: "chrysanthemum",
    index: 9,
    name: "Chrysanthemum Aureum",
    commonName: "The Imperial Apex Bloom",
    frenchTitle: "Le Chrysanthème d'Or Impérial",
    phase: "Phase IX: Astral Conjunction",
    harmonicFreq: 588,
    pigment: "Vermeil Solaire & Topaze",
    pigmentHex: "#6e4b14",
    accentHex: "#f0c242",
    meaning: "Total aperture radiance and solar apex; crowning unison of all nine botanical harmonics.",
    svgPath: "M50,50 m-12,0 a12,12 0 1,0 24,0 a12,12 0 1,0 -24,0 M50,10 C48,25 45,35 50,40 C55,35 52,25 50,10 Z M50,90 C48,75 45,65 50,60 C55,65 52,75 50,90 Z M10,50 C25,48 35,45 40,50 C35,55 25,52 10,50 Z M90,50 C75,48 65,45 60,50 C65,55 75,52 90,50 Z",
    iconDetails: `<g class="glyph-art chrysanthemum-art">
      <circle cx="50" cy="50" r="14" fill="#6e4b14" stroke="#f0c242" stroke-width="2"/>
      <circle cx="50" cy="50" r="6" fill="#f0c242"/>
      <!-- Radiating petals -->
      <path d="M50,10 C46,26 44,36 50,40 C56,36 54,26 50,10 Z" fill="currentColor" fill-opacity="0.4" stroke="currentColor" stroke-width="1.2"/>
      <path d="M50,90 C46,74 44,64 50,60 C56,64 54,74 50,90 Z" fill="currentColor" fill-opacity="0.4" stroke="currentColor" stroke-width="1.2"/>
      <path d="M10,50 C26,46 36,44 40,50 C36,56 26,54 10,50 Z" fill="currentColor" fill-opacity="0.4" stroke="currentColor" stroke-width="1.2"/>
      <path d="M90,50 C74,46 64,44 60,50 C64,56 74,54 90,50 Z" fill="currentColor" fill-opacity="0.4" stroke="currentColor" stroke-width="1.2"/>
      <path d="M22,22 C34,32 40,38 43,43 C38,40 32,34 22,22 Z" fill="currentColor" fill-opacity="0.3" stroke="currentColor" stroke-width="1"/>
      <path d="M78,22 C66,32 60,38 57,43 C62,40 68,34 78,22 Z" fill="currentColor" fill-opacity="0.3" stroke="currentColor" stroke-width="1"/>
      <path d="M22,78 C34,68 40,62 43,57 C38,60 32,66 22,78 Z" fill="currentColor" fill-opacity="0.3" stroke="currentColor" stroke-width="1"/>
      <path d="M78,78 C66,68 60,62 57,57 C62,60 68,66 78,78 Z" fill="currentColor" fill-opacity="0.3" stroke="currentColor" stroke-width="1"/>
    </g>`
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GLYPHS };
}
