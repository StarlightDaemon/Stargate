/**
 * STARGATE: LE NIMBUS FLORIÉ
 * Quick-Dial Preset Stations Database (Tier I & Tier II)
 * Auto-Dial Sequencer with Staged Per-Segment Progression
 */

const QUICK_DIAL_PRESETS = [
  // --- TIER I: REGIONAL MÉTROPOLITAIN STATIONS ---
  {
    id: "preset-paris-auteuil",
    tier: 1,
    tierLabel: "Tier I: Réseau Métropolitain",
    name: "Paris-Auteuil (Terminus Central)",
    subtitle: "Seine Valley Botanical Corridor",
    archiveId: "station-paris-auteuil",
    address: ["iris", "ginkgo", "dragonfly", "waterlily", "passiflora", "ivy", "chrysanthemum"],
    description: "Hector Guimard's iconic cast-iron terminus connecting central Paris with regional greenhouses.",
    estimatedTransitSec: 3.2,
    baseHarmonic: 432
  },
  {
    id: "preset-laeken",
    tier: 1,
    tierLabel: "Tier I: Réseau Métropolitain",
    name: "Serres Royales de Laeken",
    subtitle: "Brussels Grand Conservatory",
    archiveId: "station-laeken",
    address: ["waterlily", "iris", "peacock", "passiflora", "ginkgo", "ivy", "poppy"],
    description: "Submerged aquatic portal nestled within Victor Horta's curvilinear glass pavilion.",
    estimatedTransitSec: 4.1,
    baseHarmonic: 852
  },
  {
    id: "preset-tuileries",
    tier: 1,
    tierLabel: "Tier I: Réseau Métropolitain",
    name: "Jardin des Tuileries (Flore)",
    subtitle: "Subterranean Civic Waystation",
    archiveId: "station-tuileries",
    address: ["ivy", "passiflora", "iris", "dragonfly", "peacock", "waterlily", "chrysanthemum"],
    description: "High-frequency urban relay station beneath the historic Tuileries gardens.",
    estimatedTransitSec: 2.8,
    baseHarmonic: 396
  },
  {
    id: "preset-nancy",
    tier: 1,
    tierLabel: "Tier I: Réseau Métropolitain",
    name: "Atelier de Nancy (Gallé)",
    subtitle: "Lorraine Glass & Ceramic Guild",
    archiveId: "event-pacte-nancy-1899",
    address: ["peacock", "ginkgo", "waterlily", "iris", "poppy", "passiflora", "ivy"],
    description: "The historical birthplace of the Pacte de Nancy, adjacent to Émile Gallé's glass kilns.",
    estimatedTransitSec: 3.6,
    baseHarmonic: 528
  },

  // --- TIER II: DEEP AETHERIC SANCTUARIES ---
  {
    id: "preset-pic-diris",
    tier: 2,
    tierLabel: "Tier II: Sanctuaires Aethériques",
    name: "Observatoire du Pic d'Iris",
    subtitle: "High Pyrenean Celestial Spire (2,870m)",
    archiveId: "station-pic-diris",
    address: ["iris", "dragonfly", "peacock", "ginkgo", "chrysanthemum", "passiflora", "waterlily"],
    description: "Rarefied mountain observatory channeling pure solar aether across continental boundaries.",
    estimatedTransitSec: 6.4,
    baseHarmonic: 741
  },
  {
    id: "preset-val-libellules",
    tier: 2,
    tierLabel: "Tier II: Sanctuaires Aethériques",
    name: "Le Val des Libellules",
    subtitle: "Vosges Diaphanous Wetland",
    archiveId: "station-val-libellules",
    address: ["dragonfly", "waterlily", "ivy", "peacock", "poppy", "iris", "ginkgo"],
    description: "Mist-covered sanctuary cultivating iridescent insect fauna for resonant oil distillation.",
    estimatedTransitSec: 5.8,
    baseHarmonic: 741
  },
  {
    id: "preset-oasis-chrysantheme",
    tier: 2,
    tierLabel: "Tier II: Sanctuaires Aethériques",
    name: "Oasis du Chrysanthème Doré",
    subtitle: "Southern Solar Verge Sanctuary",
    archiveId: "station-oasis-chrysantheme",
    address: ["chrysanthemum", "ginkgo", "peacock", "passiflora", "dragonfly", "iris", "poppy"],
    description: "Solar-aligned golden dome operating at the apex 588 Hz harmonic frequency.",
    estimatedTransitSec: 7.2,
    baseHarmonic: 588
  },
  {
    id: "preset-aube-boreale",
    tier: 2,
    tierLabel: "Tier II: Sanctuaires Aethériques",
    name: "Sanctuaire de l'Aube Boréale",
    subtitle: "Sub-Arctic Glacial Chamber (Lapland)",
    archiveId: "station-aube-boreale",
    address: ["poppy", "dragonfly", "waterlily", "ginkgo", "ivy", "peacock", "chrysanthemum"],
    description: "Extreme northern outpost carved into glacial blue ice and powered by aurora filaments.",
    estimatedTransitSec: 8.0,
    baseHarmonic: 417
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { QUICK_DIAL_PRESETS };
}
