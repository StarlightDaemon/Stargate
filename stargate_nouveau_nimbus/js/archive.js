/**
 * STARGATE: LE NIMBUS FLORIÉ
 * In-Universe Cross-Referenced Archive & Codex
 * 22 Richly Relational Entries with Bidirectional Hyperlinks
 */

const ARCHIVE_ENTRIES = [
  // --- STATIONS & PAVILIONS ---
  {
    id: "station-paris-auteuil",
    category: "stations",
    categoryLabel: "Stations & Pavilions",
    title: "Pavillon Métropolitain de Paris-Auteuil",
    subtitle: "Central Terminus of the Seine Botanical Transit",
    date: "Inaugurated 14 April 1900",
    tags: ["Terminus", "Guimard Cast Iron", "Tier I"],
    summary: "The crown jewel of the Parisian aetheric metro, engineered by Hector Guimard with cast-iron whiplash arches framing the Great Iris Nimbus.",
    bodyHtml: `
      <p>Constructed for the <a href="#" class="codex-link" data-target="event-grande-exposition-1900">Exposition Universelle de 1900</a>, the <strong>Pavillon de Paris-Auteuil</strong> serves as the primary municipal transit gateway connecting the French capital to remote astral conservatories.</p>
      <p>Designed under the aesthetic direction of Master Architect <a href="#" class="codex-link" data-target="figure-guimard-aether">Hector Guimard</a>, the portal aperture is framed by undulating bronze-green cast iron resembling intertwined shoots of <a href="#" class="codex-link" data-target="flora-passiflora-resonans">Passiflora Caerulea</a>.</p>
      <p>The gate's nine-fold halo utilizes Bavarian limestone plates treated under <a href="#" class="codex-link" data-target="patent-pierre-baviere-resonante">Patent № 441-B</a> to withstand the 432&nbsp;Hz vibrational shock of <a href="#" class="codex-link" data-target="flora-iris-florentina-aetheria">Iris Florentina</a> during morning commuter transits.</p>
      <div class="codex-meta-box">
        <strong>Harmonic Address:</strong> Iris &bull; Ginkgo &bull; Dragonfly &bull; Waterlily &bull; Passiflora &bull; Ivy &bull; Chrysanthemum<br>
        <strong>Registry Stone:</strong> Mineral Ultramarine & Sèvres Glaze
      </div>
    `,
    relatedIds: ["event-grande-exposition-1900", "figure-guimard-aether", "flora-passiflora-resonans", "patent-pierre-baviere-resonante"]
  },
  {
    id: "station-laeken",
    category: "stations",
    categoryLabel: "Stations & Pavilions",
    title: "Serres Royales de Laeken",
    subtitle: "The Glass & Iron Conservatory Sanctuary of Brussels",
    date: "Commissioned 1898",
    tags: ["Sanctuary", "Horta Ironwork", "Tier I"],
    summary: "A monumental glass palace housing rare hybridized flora that power Belgium's trans-equatorial portal corridors.",
    bodyHtml: `
      <p>Supervised by <a href="#" class="codex-link" data-target="figure-horta-botanique">Victor Horta</a>, the <strong>Serres Royales de Laeken</strong> pavilion integrates soaring curvilinear glass vaults with subterranean <a href="#" class="codex-link" data-target="patent-encres-aetheriques-minerales">mineral ink vats</a>.</p>
      <p>The gateway aperture is submerged within an aquatic basin cultivating <a href="#" class="codex-link" data-target="flora-nymphaea-limpidia">Nymphaea Alba Aetheria</a>, which cools the lithographic press stones during continuous transit to <a href="#" class="codex-link" data-target="station-paris-auteuil">Paris-Auteuil</a> and the <a href="#" class="codex-link" data-target="station-tuileries">Jardin des Tuileries</a>.</p>
      <p>The station was critical in establishing the historic <a href="#" class="codex-link" data-target="event-pacte-nancy-1899">Pacte Botanique de Nancy</a>.</p>
    `,
    relatedIds: ["figure-horta-botanique", "flora-nymphaea-limpidia", "station-tuileries", "event-pacte-nancy-1899"]
  },
  {
    id: "station-tuileries",
    category: "stations",
    categoryLabel: "Stations & Pavilions",
    title: "Jardin des Tuileries: Pavillon de Flore",
    subtitle: "Subterranean Botanical Aether-Hub of Central Paris",
    date: "Expanded May 1899",
    tags: ["Subterranean", "Civic Corridor", "Tier I"],
    summary: "Built into the vaulted masonry beneath the Tuileries gardens, providing direct botanical transit beneath the historic palace grounds.",
    bodyHtml: `
      <p>Deep within the foundations of the Pavillon de Flore, this gateway maintains a constant low-frequency chime at 396&nbsp;Hz. Its lithographic rings are calibrated with <a href="#" class="codex-link" data-target="patent-alignement-septenaire">Septenary Registration Pins</a>.</p>
      <p>It regularly coordinates with <a href="#" class="codex-link" data-target="station-paris-auteuil">Pavillon de Paris-Auteuil</a> to balance commuter pressure during festive seasons, using <a href="#" class="codex-link" data-target="figure-charlotte-ginkgo">Charlotte Vane's</a> stabilization equations.</p>
    `,
    relatedIds: ["station-paris-auteuil", "patent-alignement-septenaire", "figure-charlotte-ginkgo"]
  },
  {
    id: "station-pic-diris",
    category: "stations",
    categoryLabel: "Stations & Pavilions",
    title: "L'Observatoire du Pic d'Iris",
    subtitle: "High-Altitude Pyrenean Aetheric Spire",
    date: "Established September 1901",
    tags: ["Deep Sanctuary", "High Altitude", "Tier II"],
    summary: "Perched 2,870 meters above sea level, harnessing untainted mountain aether to dial interstellar botanical chords.",
    bodyHtml: `
      <p>Constructed atop a crystalline granite peak, the <strong>Observatoire du Pic d'Iris</strong> was established following the celestial observations of the <a href="#" class="codex-link" data-target="event-conjonction-equinoxe-1898">Conjonction de l'Équinoxe de 1898</a>.</p>
      <p>Its nimbus ring operates at elevated harmonic pressures, capturing rarefied aether through rotating copper dragonflies designed by <a href="#" class="codex-link" data-target="figure-edouard-grasset-nimbus">Eugène Grasset</a>. Dialing this station requires the <a href="#" class="codex-link" data-target="flora-iris-florentina-aetheria">Iris</a> and <a href="#" class="codex-link" data-target="flora-ginkgo-chronos">Ginkgo</a> root harmonics.</p>
    `,
    relatedIds: ["event-conjonction-equinoxe-1898", "figure-edouard-grasset-nimbus", "flora-iris-florentina-aetheria", "station-val-libellules"]
  },
  {
    id: "station-val-libellules",
    category: "stations",
    categoryLabel: "Stations & Pavilions",
    title: "Le Val des Libellules",
    subtitle: "Diaphanous Wetland Sanctuary of the Vosges",
    date: "Sanctified June 1902",
    tags: ["Wetland", "Dragonfly Breeding", "Tier II"],
    summary: "A mist-veiled sanctuary dedicated to cultivating iridescent entomological fauna that stabilize high-frequency portal resonances.",
    bodyHtml: `
      <p>Surrounded by water-lily ponds and ancient weeping willows, <strong>Le Val des Libellules</strong> produces the organic luminescent oils utilized in <a href="#" class="codex-link" data-target="patent-encres-aetheriques-minerales">Patent № 512-C</a>.</p>
      <p>The gateway here features double-fluted bronze uprights modeled after dragonfly wings. It was the departure terminus for the daring <a href="#" class="codex-link" data-target="event-traversee-abyssale-1902">Traversée Abyssale de 1902</a>.</p>
    `,
    relatedIds: ["patent-encres-aetheriques-minerales", "event-traversee-abyssale-1902", "station-pic-diris"]
  },
  {
    id: "station-oasis-chrysantheme",
    category: "stations",
    categoryLabel: "Stations & Pavilions",
    title: "L'Oasis du Chrysanthème Doré",
    subtitle: "Solar Sanctuary in the Southern Desert Verge",
    date: "Erected October 1903",
    tags: ["Solar", "Desert Bloom", "Tier II"],
    summary: "An isolated gold-domed pavilion channeling radiant solar energy into the highest harmonic frequency (588 Hz) of the botanical ennead.",
    bodyHtml: `
      <p>Positioned where sun-drenched dunes meet subterranean mineral springs, the <strong>Oasis du Chrysanthème Doré</strong> represents the apex of thermodynamic litho-printing.</p>
      <p>Its gate is adorned with beaten brass sun-bursts designed by <a href="#" class="codex-link" data-target="figure-mucha-astral">Alphonse Mucha's</a> studio, resonating in sympathetic unison with <a href="#" class="codex-link" data-target="station-aube-boreale">Sanctuaire de l'Aube Boréale</a>.</p>
    `,
    relatedIds: ["figure-mucha-astral", "station-aube-boreale", "patent-presse-hydraulique-nimbus"]
  },
  {
    id: "station-aube-boreale",
    category: "stations",
    categoryLabel: "Stations & Pavilions",
    title: "Sanctuaire de l'Aube Boréale",
    subtitle: "Sub-Arctic Glacial Nimbus of Lapland",
    date: "Anchored December 1904",
    tags: ["Glacial", "Aurora Chamber", "Tier II"],
    summary: "The northernmost anchor of the guild's transit network, carved into living glacial ice and illuminated by natural aurora borealis.",
    bodyHtml: `
      <p>This remote pavilion uses cryogenic mineral inks that solidify into glowing crystals during transit. It was constructed under the supervision of <a href="#" class="codex-link" data-target="figure-charlotte-ginkgo">Madame Charlotte Vane</a>.</p>
      <p>The gate coordinates are attuned to cold-adapted <a href="#" class="codex-link" data-target="flora-poppy-somniferum-aether">Papaver Somniferum</a>, enabling rapid transit across the polar circle.</p>
    `,
    relatedIds: ["figure-charlotte-ginkgo", "station-oasis-chrysantheme", "event-conjonction-equinoxe-1898"]
  },

  // --- FOUNDERS & MASTER ARTISANS ---
  {
    id: "figure-guimard-aether",
    category: "founders",
    categoryLabel: "Founders & Master Artisans",
    title: "Hector Guimard (Aetheric Architect)",
    subtitle: "Grand Master of Curvilinear Cast-Iron Metallurgy",
    date: "1867 – 1942",
    tags: ["Architect", "Métropolitain", "Cast Iron"],
    summary: "Visionary creator of the Paris Métro entrances, who secretly infused cast bronze and iron with sympathetic aetheric channels.",
    bodyHtml: `
      <p>While celebrated in mundane history as the foremost French architect of Art Nouveau, <strong>Hector Guimard</strong> was also the chief architectural engineer for the <em>Société des Nimbus Floriés</em>.</p>
      <p>He invented the hollow cast-iron whiplash stanchion, which conceals copper harmonic conduits carrying 432&nbsp;Hz signals directly to the gate ring of <a href="#" class="codex-link" data-target="station-paris-auteuil">Paris-Auteuil</a>. He collaborated closely with <a href="#" class="codex-link" data-target="figure-mucha-astral">Alphonse Mucha</a> and <a href="#" class="codex-link" data-target="figure-horta-botanique">Victor Horta</a>.</p>
    `,
    relatedIds: ["station-paris-auteuil", "figure-mucha-astral", "figure-horta-botanique", "event-grande-exposition-1900"]
  },
  {
    id: "figure-mucha-astral",
    category: "founders",
    categoryLabel: "Founders & Master Artisans",
    title: "Alphonse Mucha (Master of the Astral Halo)",
    subtitle: "Chief Lithographer and Iconographer of the Ennead",
    date: "1860 – 1939",
    tags: ["Lithographer", "Halo Composition", "Iconography"],
    summary: "The legendary Moravian master whose decorative halo compositions established the mathematical geometry of the portal ring.",
    bodyHtml: `
      <p><strong>Alphonse Mucha</strong> revolutionized portal mechanics by proving that the circular nimbus halo framing idealized feminine muses in his posters was not merely decorative, but a literal mathematical projection of a 9-phase planar gateway.</p>
      <p>Mucha personally drew the master stones for the <a href="#" class="codex-link" data-target="patent-pierre-baviere-resonante">Bavarian Limestone Matrix</a>, standardizing the 7-stone registration sequence used by every operator in the network.</p>
      <p>His aesthetic treatise, <em>Documents Décoratifs Aethériques</em> (1902), remains the canonical textbook for transit apprentices.</p>
    `,
    relatedIds: ["patent-pierre-baviere-resonante", "patent-alignement-septenaire", "figure-guimard-aether", "figure-edouard-grasset-nimbus"]
  },
  {
    id: "figure-horta-botanique",
    category: "founders",
    categoryLabel: "Founders & Master Artisans",
    title: "Victor Horta (Botanical Structuralist)",
    subtitle: "Pioneer of Whiplash Force Conduits in Brussels",
    date: "1861 – 1947",
    tags: ["Architect", "Belgium", "Glass Vaults"],
    summary: "Belgian master who unlocked the structural harmony between vegetative stems and spatial compression arches.",
    bodyHtml: `
      <p>Victor Horta's seminal work at the Hôtel Tassel demonstrated that decorative stem motifs could distribute mechanical torsion across non-Euclidean folds.</p>
      <p>He applied this breakthrough at the <a href="#" class="codex-link" data-target="station-laeken">Serres Royales de Laeken</a>, creating self-stabilizing glass domes that flex dynamically when a breakthrough vortex opens.</p>
      <p>Signatory to the <a href="#" class="codex-link" data-target="event-pacte-nancy-1899">Pacte Botanique de Nancy</a>.</p>
    `,
    relatedIds: ["station-laeken", "event-pacte-nancy-1899", "figure-guimard-aether"]
  },
  {
    id: "figure-charlotte-ginkgo",
    category: "founders",
    categoryLabel: "Founders & Master Artisans",
    title: "Madame Charlotte Vane",
    subtitle: "Grand Alchemist of Mineral Pigments & Chrono-Flora",
    date: "1872 – 1951",
    tags: ["Alchemist", "Pigments", "Chrono-Flora"],
    summary: "Master chemist who formulated the aether-reactive mineral washes that allow lithographic registration stones to bridge spatial gaps.",
    bodyHtml: `
      <p>A graduate of the Sorbonne who studied under Henri Moissan, <strong>Madame Charlotte Vane</strong> isolated the resonant properties of crushed lapis lazuli and malachite suspended in distilled poppy oil.</p>
      <p>Her invention, <a href="#" class="codex-link" data-target="patent-encres-aetheriques-minerales">Patent № 512-C (Encres Minérales Aethériques)</a>, enabled the instantaneous color wash that locks dial addresses. She later led the establishment of the <a href="#" class="codex-link" data-target="station-aube-boreale">Sanctuaire de l'Aube Boréale</a>.</p>
    `,
    relatedIds: ["patent-encres-aetheriques-minerales", "station-aube-boreale", "flora-ginkgo-chronos", "event-traversee-abyssale-1902"]
  },
  {
    id: "figure-edouard-grasset-nimbus",
    category: "founders",
    categoryLabel: "Founders & Master Artisans",
    title: "Eugène Grasset",
    subtitle: "Pioneer of Ornamental Glyphs & Entomological Resonances",
    date: "1845 – 1917",
    tags: ["Illustrator", "Entomology", "Graphic Master"],
    summary: "Swiss-French decorative master whose seminal studies of insect wings and medieval flora laid the foundation for the Ennead glyph set.",
    bodyHtml: `
      <p>Eugène Grasset's 1897 folio <em>La Plante et ses Applications Ornementales</em> codified the nine fundamental plant archetypes of the portal system.</p>
      <p>He demonstrated that dragonfly wing venation acts as a natural diffraction grating for aetheric frequencies, leading directly to the instrumentation at <a href="#" class="codex-link" data-target="station-pic-diris">L'Observatoire du Pic d'Iris</a> and <a href="#" class="codex-link" data-target="station-val-libellules">Le Val des Libellules</a>.</p>
    `,
    relatedIds: ["station-pic-diris", "station-val-libellules", "figure-mucha-astral"]
  },

  // --- BOTANICAL CURIOSITIES & FLORA ---
  {
    id: "flora-iris-florentina-aetheria",
    category: "flora",
    categoryLabel: "Botanical Curiosities",
    title: "Iris Florentina Aetheria",
    subtitle: "The Silver-Veined Iris of the First Stone",
    date: "Discovered 1894",
    tags: ["Phase I", "432 Hz", "Root Flora"],
    summary: "A luminescence-yielding flower whose delicate petals align naturally along magnetic ley-lines.",
    bodyHtml: `
      <p>Harvested at dawn on the slopes of the Vosges mountains, <em>Iris Florentina Aetheria</em> yields a powdery silver pollen that vibrates sympathetically at exactly 432&nbsp;Hz.</p>
      <p>When mixed with powdered lapis lazuli in <a href="#" class="codex-link" data-target="patent-encres-aetheriques-minerales">Vane's Mineral Inks</a>, it forms the foundation of the first registration pass at <a href="#" class="codex-link" data-target="station-paris-auteuil">Paris-Auteuil</a>.</p>
    `,
    relatedIds: ["station-paris-auteuil", "patent-encres-aetheriques-minerales", "figure-charlotte-ginkgo"]
  },
  {
    id: "flora-passiflora-resonans",
    category: "flora",
    categoryLabel: "Botanical Curiosities",
    title: "Passiflora Caerulea Resonans",
    subtitle: "The Tenfold Radial Vine of Spatial Cohesion",
    date: "Cataloged 1897",
    tags: ["Phase VI", "963 Hz", "Whiplash Tendril"],
    summary: "A climbing vine whose intricate tenfold corona forms an impenetrable geometric lattice, preventing aperture collapse.",
    bodyHtml: `
      <p>Studied by <a href="#" class="codex-link" data-target="figure-horta-botanique">Victor Horta</a> during the construction of the Brussels glass pavilions, this extraordinary vine binds spatial tearing during sudden power shifts.</p>
      <p>Its whiplash tendrils curl at precisely the golden ratio (1.618), providing the structural basis for <a href="#" class="codex-link" data-target="figure-guimard-aether">Guimard's</a> portal spandrels.</p>
    `,
    relatedIds: ["figure-horta-botanique", "figure-guimard-aether", "station-paris-auteuil"]
  },
  {
    id: "flora-ginkgo-chronos",
    category: "flora",
    categoryLabel: "Botanical Curiosities",
    title: "Ginkgo Chronos",
    subtitle: "The Bifurcated Fan of Temporal Anchor",
    date: "Preserved 1895",
    tags: ["Phase III", "639 Hz", "Living Fossil"],
    summary: "An ancient living relic whose golden fan-shaped leaves retain spatial coordinates across centuries without drift.",
    bodyHtml: `
      <p>Derived from sacred specimens in the Far East, the bifurcated leaf of <em>Ginkgo Chronos</em> splits harmonic waves into twin balanced frequencies. This prevents chronometric distortion during long-distance transit to <a href="#" class="codex-link" data-target="station-pic-diris">Pic d'Iris</a>.</p>
    `,
    relatedIds: ["station-pic-diris", "figure-charlotte-ginkgo", "event-conjonction-equinoxe-1898"]
  },
  {
    id: "flora-nymphaea-limpidia",
    category: "flora",
    categoryLabel: "Botanical Curiosities",
    title: "Nymphaea Alba Limpidia",
    subtitle: "The Phosphorescent Water-Lily of the Quiet Pond",
    date: "Cultivated 1898",
    tags: ["Phase V", "852 Hz", "Aquatic Buffer"],
    summary: "A radiant water lily that floats on aetheric surface tension, dampening turbulence during breakthrough.",
    bodyHtml: `
      <p>Cultivated in the grand aquatic tanks of the <a href="#" class="codex-link" data-target="station-laeken">Serres Royales de Laeken</a>, its translucent petals emit a calm pearl-pink radiance when energized by 852&nbsp;Hz acoustic vibrations.</p>
    `,
    relatedIds: ["station-laeken", "station-val-libellules", "patent-presse-hydraulique-nimbus"]
  },

  // --- HISTORICAL TRANSITS & CHRONICLES ---
  {
    id: "event-grande-exposition-1900",
    category: "events",
    categoryLabel: "Historical Transits & Chronicles",
    title: "L'Exposition Universelle de Paris 1900",
    subtitle: "The Triumphant Public Unveiling of Botanical Transit",
    date: "April – November 1900",
    tags: ["Exposition", "Public Milestone", "Paris"],
    summary: "Fifty million visitors walked through Hector Guimard's gilded gates, witnessing the seamless union of Art Nouveau illustration and instantaneous transit.",
    bodyHtml: `
      <p>At the height of the Belle Époque, the Guild unveiled the <a href="#" class="codex-link" data-target="station-paris-auteuil">Pavillon de Paris-Auteuil</a> to an astonished international public. Disguised as a municipal railway terminus, it conducted over 14,000 covert long-range transits to botanical sanatoria across Europe.</p>
      <p>Master posters designed by <a href="#" class="codex-link" data-target="figure-mucha-astral">Alphonse Mucha</a> were distributed to millions, embedding secret harmonic sequences into popular culture.</p>
    `,
    relatedIds: ["station-paris-auteuil", "figure-guimard-aether", "figure-mucha-astral", "event-pacte-nancy-1899"]
  },
  {
    id: "event-conjonction-equinoxe-1898",
    category: "events",
    categoryLabel: "Historical Transits & Chronicles",
    title: "La Grande Conjonction de l'Équinoxe 1898",
    subtitle: "The Alignment of the Nine Flora Phases",
    date: "23 September 1898",
    tags: ["Astronomical", "Breakthrough", "Harmonic"],
    summary: "A once-in-a-century planetary alignment that allowed the first sustained aperture to hold open without water cooling.",
    bodyHtml: `
      <p>During the autumn equinox of 1898, astronomers and alchemists at the nascent <a href="#" class="codex-link" data-target="station-pic-diris">Observatoire du Pic d'Iris</a> detected a harmonic surge across all nine botanical frequencies.</p>
      <p>The resulting breakthrough confirmed <a href="#" class="codex-link" data-target="figure-charlotte-ginkgo">Madame Vane's</a> hypothesis on mineral resonance and led directly to the creation of the <a href="#" class="codex-link" data-target="station-aube-boreale">Sanctuaire de l'Aube Boréale</a>.</p>
    `,
    relatedIds: ["station-pic-diris", "figure-charlotte-ginkgo", "station-aube-boreale"]
  },
  {
    id: "event-traversee-abyssale-1902",
    category: "events",
    categoryLabel: "Historical Transits & Chronicles",
    title: "La Traversée Abyssale de 1902",
    subtitle: "The First Trans-Oceanic Botanical Aperture",
    date: "12 August 1902",
    tags: ["Exploration", "Trans-Oceanic", "Milestone"],
    summary: "An expedition linking the Vosges wetland sanctuary to the South Atlantic, proving that organic whiplash conduits withstand abyssal pressure.",
    bodyHtml: `
      <p>Departing from <a href="#" class="codex-link" data-target="station-val-libellules">Le Val des Libellules</a>, four intrepid guild cartographers traversed an unstable 3-minute aperture across 6,000 kilometers of open ocean.</p>
      <p>Their safe return confirmed the reliability of <a href="#" class="codex-link" data-target="patent-presse-hydraulique-nimbus">Hydraulic Litho-Press Patent № 774</a>.</p>
    `,
    relatedIds: ["station-val-libellules", "patent-presse-hydraulique-nimbus", "figure-charlotte-ginkgo"]
  },
  {
    id: "event-pacte-nancy-1899",
    category: "events",
    categoryLabel: "Historical Transits & Chronicles",
    title: "Le Pacte Botanique de Nancy",
    subtitle: "Unification of the French and Belgian Guild Chapters",
    date: "17 November 1899",
    tags: ["Treaty", "École de Nancy", "Guild Charter"],
    summary: "The formal unification of artisans from Nancy, Paris, and Brussels, establishing standardized lithographic plates and safety interlocks.",
    bodyHtml: `
      <p>Gathered in the atelier of Émile Gallé in Nancy, delegates including <a href="#" class="codex-link" data-target="figure-guimard-aether">Guimard</a>, <a href="#" class="codex-link" data-target="figure-horta-botanique">Horta</a>, and <a href="#" class="codex-link" data-target="figure-mucha-astral">Mucha</a> ratified the universal 7-glyph sequence format.</p>
      <p>The treaty mandated that all portal gateways must include a default-released <a href="#" class="codex-link" data-target="patent-alignement-septenaire">Botanical Safety Latch</a> to prevent inadvertent locking during dial preparation.</p>
    `,
    relatedIds: ["figure-guimard-aether", "figure-horta-botanique", "figure-mucha-astral", "station-laeken", "event-grande-exposition-1900"]
  },

  // --- LITHOGRAPHIC SCIENCE & PATENTS ---
  {
    id: "patent-pierre-baviere-resonante",
    category: "patents",
    categoryLabel: "Lithographic Science & Patents",
    title: "Brevet № 441-B: Pierre Calcaire de Bavière Résonante",
    subtitle: "High-Density Solnhofen Limestone Matrix for Aperture Rings",
    date: "Granted 8 March 1898",
    tags: ["Patent", "Solnhofen", "Limestone Matrix"],
    summary: "Micro-porous Jurassic limestone from Bavaria, etched with nitric acid and gum arabic to store high-density dimensional glyph patterns.",
    bodyHtml: `
      <p>Invented in collaboration with <a href="#" class="codex-link" data-target="figure-mucha-astral">Alphonse Mucha</a>, this patent specifies the precise grinding and polishing of Solnhofen limestone blocks using carborundum grit.</p>
      <p>When drawn upon with greasy lithographic crayon, the stone binds fatty aether-salts that attract <a href="#" class="codex-link" data-target="patent-encres-aetheriques-minerales">mineral inks</a> while repelling water, creating the physical foundation for every locked dial segment in the <a href="#" class="codex-link" data-target="station-paris-auteuil">Metropolitan Network</a>.</p>
    `,
    relatedIds: ["figure-mucha-astral", "patent-encres-aetheriques-minerales", "station-paris-auteuil"]
  },
  {
    id: "patent-encres-aetheriques-minerales",
    category: "patents",
    categoryLabel: "Lithographic Science & Patents",
    title: "Brevet № 512-C: Encres Minérales Aethériques",
    subtitle: "Colloidal Suspensions of Lapis Lazuli, Malachite & Cinnabar",
    date: "Granted 22 June 1899",
    tags: ["Patent", "Pigments", "Alchemical Ink"],
    summary: "Formulated by Madame Charlotte Vane, these pigments solidify into conductive crystal ribbons upon application to the gate ring.",
    bodyHtml: `
      <p>Formulated in Paris by <a href="#" class="codex-link" data-target="figure-charlotte-ginkgo">Madame Charlotte Vane</a>, this patent details the chemical emulsification of rare mineral pigments with poppyseed oil and distilled aether.</p>
      <p>When the second registration pass settles over the crayon contour lines, the ink instantly bonds with the <a href="#" class="codex-link" data-target="patent-pierre-baviere-resonante">Solnhofen stone</a>, releasing a resonant crystal chime at the harmonic pitch of the designated flora.</p>
    `,
    relatedIds: ["figure-charlotte-ginkgo", "patent-pierre-baviere-resonante", "station-val-libellules"]
  },
  {
    id: "patent-presse-hydraulique-nimbus",
    category: "patents",
    categoryLabel: "Lithographic Science & Patents",
    title: "Brevet № 774: Presse Hydraulique à Nimbus Rotatif",
    subtitle: "Multi-Ton Balanced Bed Press for Trans-Spatial Alignment",
    date: "Granted 14 January 1901",
    tags: ["Patent", "Hydraulics", "Torsion Bed"],
    summary: "A heavy cast-iron press bed using hydraulic counter-weights to press nine circular lithographic stones against the portal halo simultaneously.",
    bodyHtml: `
      <p>Designed for high-throughput gateway stations like <a href="#" class="codex-link" data-target="station-paris-auteuil">Paris-Auteuil</a> and <a href="#" class="codex-link" data-target="station-oasis-chrysantheme">L'Oasis du Chrysanthème</a>, this mammoth machine produces the distinct, satisfying low-frequency settling thud when a stone registers into position.</p>
      <p>It was crucial to surviving the rigors of the <a href="#" class="codex-link" data-target="event-traversee-abyssale-1902">Traversée Abyssale de 1902</a>.</p>
    `,
    relatedIds: ["station-paris-auteuil", "station-oasis-chrysantheme", "event-traversee-abyssale-1902"]
  },
  {
    id: "patent-alignement-septenaire",
    category: "patents",
    categoryLabel: "Lithographic Science & Patents",
    title: "Brevet № 890: Goupilles d'Alignement Septenaire",
    subtitle: "Precision Gold-Plated Registration Pins & Interlock Safety",
    date: "Granted 5 November 1901",
    tags: ["Patent", "Registration", "Safety Mechanism"],
    summary: "Micro-machined gold-plated pins that guarantee 0.01 mm registration accuracy across seven consecutive stone passes, housing the manual safety latch.",
    bodyHtml: `
      <p>To prevent chromatic blur and dangerous aperture shearing, this patent introduces self-centering conical pins fabricated from hardened beryllium bronze.</p>
      <p>It incorporates the mandatory <a href="#" class="codex-link" data-target="event-pacte-nancy-1899">Pacte de Nancy</a> safety interlock, ensuring that dialing sequences remain strictly pending until deliberate operator activation occurs at the <a href="#" class="codex-link" data-target="station-tuileries">Tuileries</a> and beyond.</p>
    `,
    relatedIds: ["event-pacte-nancy-1899", "station-tuileries", "patent-pierre-baviere-resonante"]
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ARCHIVE_ENTRIES };
}
