/* NIGHTGLASS — Vesper Ryn's loom records.
   A cross-referenced archive of the Lume Lattice: nodes, routes, personas,
   phenomena, and recovered fragments. Every entry is fiction. */
'use strict';

const ARCHIVE = [

  /* ———— NODES ———— */
  { id: 'prism-orchard', kind: 'node', name: 'The Prism Orchard', tier: 'anchored',
    body: 'Rows of refracting trees grown from seed-light, each trunk splitting one carrier into a hundred colored strands. Vesper keeps a standing thread here and harvests spectra for the loom. The Collector claims the orchard predates the Lattice itself; the Sable Cartographer refuses to chart its far rows, which drift.',
    refs: ['route-orchard-standing', 'the-collector', 'sable-cartographer', 'glass-rain'] },

  { id: 'halcyon-reef', kind: 'node', name: 'Halcyon Reef', tier: 'anchored',
    body: 'A shallow of slow data where dormant carriers accrete into coral-like spires. The reef sings at dawn-cycle — the Moth Choir nests in its towers and answers any clean tone in kind. The first census of its lightforms was taken by the Tidewright and is preserved as a fragment.',
    refs: ['moth-choir', 'tidewright', 'fragment-reef-census', 'route-reef-run'] },

  { id: 'quiet-loom', kind: 'node', name: 'The Quiet Loom', tier: 'anchored',
    body: 'The oldest weaving-hall in reach: a vault of still air where threads can be tied without drift. Vesper apprenticed here, and the Loom Song fragment is a transcription of its idle harmonics. During the Hush, the Quiet Loom is said to be the only node that stays lit.',
    refs: ['vesper-ryn', 'fragment-loom-song', 'the-hush', 'route-first-thread'] },

  { id: 'meridian-well', kind: 'node', name: 'Meridian Well', tier: 'anchored',
    body: 'A vertical shaft of falling light at the Lattice\'s balance line. Wayfarers drop marker-motes down the well to time the drift tides; the Ferryman keeps the tally and takes a toll of one remembered name. Its depth has never been sounded — the motes simply stop reporting, unafraid.',
    refs: ['ferryman-null', 'drift-tide', 'the-roost'] },

  { id: 'murmur-vault', kind: 'node', name: 'The Murmur Vault', tier: 'frayed',
    body: 'A sealed rotunda that repeats, very quietly, everything ever said inside it — out of order and in other voices. The Collector trades here for echoes of the first weavers. Vesper\'s route in survives only as the Vault Descent record; the return leg was never written down, on purpose.',
    refs: ['the-collector', 'route-vault-descent', 'chorus-echo'] },

  { id: 'static-garden', kind: 'node', name: 'Static Garden', tier: 'frayed',
    body: 'An unweeded field of self-seeding noise, beautiful and useless: hedges of grey bloom that flower into brief, perfect images before dissolving. Static blooms harvested at the hedge-line are what Vesper feeds the deck\'s resolving animation. Do not linger past three tides.',
    refs: ['static-bloom', 'drift-tide', 'sable-cartographer'] },

  { id: 'untuned-spire', kind: 'node', name: 'The Untuned Spire', tier: 'frayed',
    body: 'A tower like NIGHTGLASS, but abandoned before it was ever tuned to a keeper. Its veil ring turns forever at idle, showing no glyphs. The Moth Choir will not fly there. The Cartographer marks it with a margin-note instead of a symbol: "listens back."',
    refs: ['moth-choir', 'sable-cartographer', 'fragment-map-margins', 'veilshear'] },

  { id: 'glass-estuary', kind: 'node', name: 'Glass Estuary', tier: 'anchored',
    body: 'Where three carrier-rivers braid and slow into a mirror-flat delta. The Tidewright was born here, if born is the word, and still returns to re-set the channel markers after every veilshear. Glass rain falling upstream arrives here as fog made of tiny lenses.',
    refs: ['tidewright', 'veilshear', 'glass-rain'] },

  { id: 'cinder-archive', kind: 'node', name: 'The Cinder Archive', tier: 'frayed',
    body: 'A library that burned in some forgotten cycle and now archives only the burning: shelves of ember-script that rewrite themselves a little dimmer each read. The Lightscript Primer was copied out of here by the Collector, twelve reads before it faded past recovery.',
    refs: ['the-collector', 'fragment-lightscript', 'chorus-echo'] },

  { id: 'pale-observatory', kind: 'node', name: 'The Pale Observatory', tier: 'anchored',
    body: 'A dome of frosted light at the Lattice\'s cold edge, pointed not outward but inward — it watches the Lattice watch itself. Its keepers left one standing instrument running: a slow drum that records the Hush\'s approach. Vesper checks the drum every long-cycle.',
    refs: ['the-hush', 'vesper-ryn', 'fragment-ward-notes'] },

  { id: 'the-roost', kind: 'node', name: 'The Roost', tier: 'anchored',
    body: 'A hanging market of perch-platforms strung on old thread-lines above Meridian Well, lit by lantern-motes. Wayfarers trade small kindnesses: a tuned chime, a spare hour of light. The Moth Choir winters here, and the Ferryman is owed a name by half the stalls.',
    refs: ['meridian-well', 'moth-choir', 'ferryman-null'] },

  { id: 'saffron-shallows', kind: 'node', name: 'Saffron Shallows', tier: 'frayed',
    body: 'A warm, amber-lit flat where the Lattice runs thin and dreams leak through from somewhere adjacent. Everything found here is slightly wrong in a pleasant way: left-handed spirals, clocks that agree. The Cartographer\'s only unfinished chart is of this place.',
    refs: ['sable-cartographer', 'fragment-map-margins', 'drift-tide'] },

  /* ———— PERSONAS ———— */
  { id: 'vesper-ryn', kind: 'persona', name: 'Vesper Ryn', tier: 'anchored',
    body: 'Keeper of NIGHTGLASS and lightwright of the seventh order: one who ties places together with woven light. Trained at the Quiet Loom, censused at the Reef, owed nothing by the Ferryman — a point of some pride. The spire, its ward, and every saved thread in the deck are their work.',
    refs: ['quiet-loom', 'ferryman-null', 'fragment-ward-notes', 'route-first-thread'] },

  { id: 'the-collector', kind: 'persona', name: 'The Collector', tier: 'frayed',
    body: 'A patient presence that gathers endings: last words, final reads, closing chords. Keeps stalls in the Murmur Vault and the Cinder Archive, and pays fairly, which is what worries people. The Collector has asked Vesper for the sound the link makes when it closes. Vesper has not sold it.',
    refs: ['murmur-vault', 'cinder-archive', 'prism-orchard'] },

  { id: 'moth-choir', kind: 'persona', name: 'The Moth Choir', tier: 'anchored',
    body: 'A migratory cloud of singing lightforms, each no bigger than a struck spark. They harmonize with any clean carrier and flee discord — their absence is the Lattice\'s oldest warning sign. They nest at Halcyon Reef, winter at the Roost, and will not approach the Untuned Spire.',
    refs: ['halcyon-reef', 'the-roost', 'untuned-spire', 'chorus-echo'] },

  { id: 'ferryman-null', kind: 'persona', name: 'The Ferryman of the Well', tier: 'frayed',
    body: 'Keeps the tally at Meridian Well and poles a flat skiff of shadow across its mouth. The toll is one remembered name, paid by forgetting it. Nobody knows what the Ferryman does with the names, but the Well has never once let a mote fall on a wayfarer\'s head, so the fare seems fair.',
    refs: ['meridian-well', 'the-roost', 'vesper-ryn'] },

  { id: 'sable-cartographer', kind: 'persona', name: 'The Sable Cartographer', tier: 'anchored',
    body: 'Draws the only charts of the Lattice anyone trusts, in ink made of settled night. Refuses to chart three things: the Orchard\'s far rows, the Shallows past the amber line, and anything the Untuned Spire can see. The margins of their charts hold more truth than most atlases.',
    refs: ['prism-orchard', 'saffron-shallows', 'untuned-spire', 'fragment-map-margins'] },

  { id: 'tidewright', kind: 'persona', name: 'The Tidewright', tier: 'anchored',
    body: 'Part surveyor, part weather, the Tidewright walks the drift tides the way others walk shorelines, planting channel-markers of pinned light. Born (or begun) at Glass Estuary. Their reef census is still the reference copy, and their tide-tables hang beside every honest deck.',
    refs: ['glass-estuary', 'drift-tide', 'fragment-reef-census', 'halcyon-reef'] },

  /* ———— PHENOMENA ———— */
  { id: 'drift-tide', kind: 'phenomenon', name: 'Drift Tides', tier: 'anchored',
    body: 'The Lattice breathes: twice a cycle its geometry loosens and every unanchored thing slides a little sideways. Threads tied during slack water hold true; threads tied against the tide come loose in interesting places. The Drift Ward on a spire exists to hold the link closed through the worst of it.',
    refs: ['tidewright', 'meridian-well', 'fragment-ward-notes', 'saffron-shallows'] },

  { id: 'static-bloom', kind: 'phenomenon', name: 'Static Blooms', tier: 'frayed',
    body: 'Where noise pools long enough, it flowers — a grey bud that opens into one brief, perfect picture of something that never happened, then powders away. Harvested blooms keep their almost-image for a while; the deck\'s glyphs borrow that look as each one resolves from static into clarity.',
    refs: ['static-garden', 'chorus-echo'] },

  { id: 'glass-rain', kind: 'phenomenon', name: 'Glass Rain', tier: 'anchored',
    body: 'Spent light condenses at altitude and falls as slow, harmless lenses that ring faintly on landing. In the Orchard it refracts the rows into cathedral color; by the time it reaches the Estuary it has softened into a fog of tiny magnifications. Wayfarers save a lens or two for luck.',
    refs: ['prism-orchard', 'glass-estuary'] },

  { id: 'the-hush', kind: 'phenomenon', name: 'The Hush', tier: 'frayed',
    body: 'Rarely — no one has found the period — the whole Lattice goes quiet at once: every carrier flat, every chime swallowed. It lasts between a breath and a day. The Pale Observatory\'s drum has recorded eleven approaches and no arrivals; the Quiet Loom alone stays lit through it.',
    refs: ['pale-observatory', 'quiet-loom'] },

  { id: 'veilshear', kind: 'phenomenon', name: 'Veilshear', tier: 'frayed',
    body: 'When two drift tides cross, the boundary layers of the Lattice slide against each other and any veil caught between is sheared thin. Rings turn milky; charts blur at the affected edge. The Estuary\'s channel markers must be re-set after every event, and the Untuned Spire is always, somehow, untouched.',
    refs: ['drift-tide', 'glass-estuary', 'untuned-spire'] },

  { id: 'chorus-echo', kind: 'phenomenon', name: 'Chorus Echoes', tier: 'anchored',
    body: 'A tone sung with intent leaves a shadow of itself in the local weave, and shadows harmonize. Old rooms hum with layered agreement. The Murmur Vault is a chorus echo grown monstrous; the Moth Choir grooms echoes down to silence as they travel, which is half of why they are welcome everywhere.',
    refs: ['murmur-vault', 'moth-choir', 'static-bloom', 'cinder-archive'] },

  /* ———— ROUTES ———— */
  { id: 'route-first-thread', kind: 'route', name: 'The First Thread', tier: 'anchored',
    body: 'Vesper\'s graduation weave: NIGHTGLASS to the Quiet Loom, tied at slack water with a borrowed deck and closed clean on the first try. The route is kept in the deck\'s anchored tier unchanged — not because it is fast, but because it was first.',
    refs: ['quiet-loom', 'vesper-ryn', 'drift-tide'] },

  { id: 'route-reef-run', kind: 'route', name: 'The Reef Run', tier: 'anchored',
    body: 'A dawn-cycle circuit out to Halcyon Reef timed so the link opens exactly as the reef begins to sing. The Moth Choir treats the opening bloom as a downbeat and joins in. Widely considered the prettiest thirty seconds available to anyone with a deck.',
    refs: ['halcyon-reef', 'moth-choir', 'fragment-reef-census'] },

  { id: 'route-vault-descent', kind: 'route', name: 'The Vault Descent', tier: 'frayed',
    body: 'The inbound half of Vesper\'s one visit to the Murmur Vault, preserved exactly as woven, hesitations included. The outbound half was deliberately never recorded, so the Vault cannot repeat it back to anyone in Vesper\'s voice. The Collector considers this route half a masterpiece.',
    refs: ['murmur-vault', 'the-collector', 'vesper-ryn'] },

  { id: 'route-long-way-round', kind: 'route', name: 'The Long Way Round', tier: 'anchored',
    body: 'Estuary, Well, Roost, home — a slow errand-loop that touches every friendly lantern on the near Lattice. Vesper walks it when the near sky is restless; the Ferryman waves the toll for regulars on the last leg. Its glyph order is taught to apprentices as good, boring form.',
    refs: ['glass-estuary', 'meridian-well', 'the-roost', 'ferryman-null'] },

  { id: 'route-orchard-standing', kind: 'route', name: 'The Orchard Standing Thread', tier: 'anchored',
    body: 'A maintenance weave to the Prism Orchard, re-tied every long-cycle to keep the spectra harvest coming. The far rows have drifted twice since it was first set; the route\'s last two glyphs have been re-chosen each time, and the old orders are kept in the margin of the Cartographer\'s chart.',
    refs: ['prism-orchard', 'sable-cartographer', 'fragment-map-margins'] },

  /* ———— FRAGMENTS ———— */
  { id: 'fragment-lightscript', kind: 'fragment', name: 'Lightscript Primer, Twelfth Read', tier: 'frayed',
    body: 'A child\'s introduction to writing with light, copied from the Cinder Archive at its twelfth read and therefore missing every fourth word. What survives is still the clearest explanation of why glyphs must resolve rather than simply appear: "a mark you did not watch become itself will not hold."',
    refs: ['cinder-archive', 'the-collector'] },

  { id: 'fragment-loom-song', kind: 'fragment', name: 'The Loom Song', tier: 'anchored',
    body: 'A transcription of the Quiet Loom\'s idle harmonics, notated as five rising tones and a settling breath. Every honest deck\'s weave chime is a variation on it — NIGHTGLASS\'s pentatonic ladder included. Sung slowly, it is a lullaby; sung quickly, it is a departure.',
    refs: ['quiet-loom', 'vesper-ryn'] },

  { id: 'fragment-reef-census', kind: 'fragment', name: 'Reef Census, First Tally', tier: 'anchored',
    body: 'The Tidewright\'s original count of Halcyon Reef\'s lightforms: 4,081 dormant carriers, 312 singing towers, one moth choir ("uncountable, counted as one"). The margin holds the first written use of the word "anchored" in its modern sense.',
    refs: ['tidewright', 'halcyon-reef', 'moth-choir'] },

  { id: 'fragment-ward-notes', kind: 'fragment', name: 'Notes on the Drift Ward', tier: 'anchored',
    body: 'Vesper\'s working notes from fitting NIGHTGLASS\'s ward: "It is a hand laid on the loom, not a lock on the door. Engaged, it holds the link closed and the spire steady through the tide. Released is its resting state — a spire that grips its own thread all day weaves nothing."',
    refs: ['vesper-ryn', 'drift-tide', 'pale-observatory'] },

  { id: 'fragment-map-margins', kind: 'fragment', name: 'Margins, Collected', tier: 'frayed',
    body: 'A pamphlet of everything the Sable Cartographer wrote in the margins instead of the map: "far rows walk at night" (the Orchard), "amber line moves when tired" (the Shallows), "listens back" (the Untuned Spire), and, beside a route since re-woven twice, "old orders kept here, in case the trees remember."',
    refs: ['sable-cartographer', 'saffron-shallows', 'untuned-spire', 'route-orchard-standing'] }
];

/* ———— THREADS — saved routes for the deck's quick-weave list ————
   addr entries are glyph indices into GLYPHS. */
const THREADS = [
  { id: 'thread-orchard', name: 'Prism Orchard', tier: 'anchored', addr: [0, 4, 2, 7, 5, 9, 3],
    note: 'standing harvest thread', ref: 'prism-orchard' },
  { id: 'thread-reef', name: 'Halcyon Reef', tier: 'anchored', addr: [8, 1, 5, 0, 6, 3, 2],
    note: 'the reef run — time it for dawn-cycle', ref: 'halcyon-reef' },
  { id: 'thread-loom', name: 'The Quiet Loom', tier: 'anchored', addr: [3, 0, 9, 4, 1, 8, 6],
    note: 'the first thread, kept unchanged', ref: 'quiet-loom' },
  { id: 'thread-well', name: 'Meridian Well', tier: 'anchored', addr: [6, 2, 8, 5, 0, 7, 1],
    note: 'ferryman waves the toll for regulars', ref: 'meridian-well' },
  { id: 'thread-vault', name: 'The Murmur Vault', tier: 'frayed', addr: [9, 7, 3, 1, 4, 6, 0],
    note: 'inbound half only. do not record the return', ref: 'murmur-vault' },
  { id: 'thread-garden', name: 'Static Garden', tier: 'frayed', addr: [5, 8, 0, 2, 7, 4, 9],
    note: 'three tides, then home', ref: 'static-garden' },
  { id: 'thread-spire', name: 'The Untuned Spire', tier: 'frayed', addr: [2, 6, 4, 9, 3, 0, 8],
    note: 'chart says: listens back', ref: 'untuned-spire' }
];
