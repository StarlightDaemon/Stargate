/**
 * Pan-Harmonic Bibliographic Depository (PBID-7)
 * Core Application Engine & Web Audio Synthesizer
 */

// ============================================================================
// 1. DATA MODELS & VALERIUS TAXONOMY DEFINITIONS
// ============================================================================

const VALERIUS_TAXONOMY = [
  { digit: 0, code: '0-CHRON', name: 'CHRONIC', domain: 'Chronic Historiography', glyph: '⌛', desc: 'Annalistic chronologies and stellar ephemerides' },
  { digit: 1, code: '1-ONTOL', name: 'ONTOLOG', domain: 'Dogmatic Ontologies', glyph: '⚖', desc: 'Epistemological treatises and metaphysical postulates' },
  { digit: 2, code: '2-XENOL', name: 'XENOLING', domain: 'Xenolinguistic Lexicons', glyph: '☲', desc: 'Exo-grammars, semantic codices, and translation keys' },
  { digit: 3, code: '3-ASTRO', name: 'ASTROMET', domain: 'Astrometric Catalogs', glyph: '✦', desc: 'Pre-telescopic star atlases and void coordinates' },
  { digit: 4, code: '4-BIOAN', name: 'BIO-ANAT', domain: 'Bio-Anatomical Schemata', glyph: '☥', desc: 'Xenobiological morphology and cytological records' },
  { digit: 5, code: '5-QUANT', name: 'QUANTUM', domain: 'Quantum Treatises', glyph: '⚛', desc: 'Relativistic field dynamics and manifold topologies' },
  { digit: 6, code: '6-CYBER', name: 'CYBERNET', domain: 'Cybernetic Matrices', glyph: '⛭', desc: 'Autonomous logic cores and archival heuristics' },
  { digit: 7, code: '7-EPIGR', name: 'EPIGRAPH', domain: 'Epigraphic Folios', glyph: '📜', desc: 'Illuminated palimpsests and primordial stelae' },
  { digit: 8, code: '8-MYTHO', name: 'MYTHOPO', domain: 'Esoteric Mythologies', glyph: '🜂', desc: 'Void folk chronicles and cosmological allegories' },
  { digit: 9, code: '9-ANOMA', name: 'ANOMALON', domain: 'Anomalous Records', glyph: '⍰', desc: 'Paradoxical fragments and unverified citations' }
];

const PRESET_CATALOG = [
  // Verified Tier
  {
    id: 'preset-alexandria',
    tier: 'verified',
    code: '3-ASTRO · 8 · 4 · 2 · 9 · 1 · 7',
    digits: [3, 8, 4, 2, 9, 1, 7],
    title: 'The Alexandria Codex of Lost Stars',
    author: 'Ptolemaic Astronavigators Guild',
    epoch: 'c. 248 BCE',
    sector: 'Sector 8 (Cygnus Wing)',
    stasisTier: 'Tier 04 · Pod 291',
    format: 'Illuminated Vellum / Photonic Matrix',
    condition: 'PRISTINE (99.8%)',
    lastRetrieved: '42 Cycles Ago',
    custodian: 'Curator A. Valerius (Seal: 0x9F4C-PBID)',
    abstract: 'Comprehensive pre-telescopic star-catalog recording 1,022 stellar magnitudes, astrometric azimuths, and lost constellation boundaries observed from the Great Pharos Observatory.'
  },
  {
    id: 'preset-xenoglossa',
    tier: 'verified',
    code: '2-XENOL · 4 · 1 · 0 · 8 · 5 · 3',
    digits: [2, 4, 1, 0, 8, 5, 3],
    title: 'First Xenoglossa Inscription of Zeta Reticuli',
    author: 'Deep Signal Translation Mission VII',
    epoch: 'Epoch IV · Year 491',
    sector: 'Sector 4 (Orion Column)',
    stasisTier: 'Tier 09 · Pod 104',
    format: 'Crystalline Acoustic Lattice',
    condition: 'RESTORED (97.4%)',
    lastRetrieved: '12 Cycles Ago',
    custodian: 'Chief Epigrapher M. Thorne (Seal: 0x33A1-PBID)',
    abstract: 'Radially structured phonetic syllabary inscribed upon an interstellar monolithic fragment, decoding seventy-two foundational contact protocols.'
  },
  {
    id: 'preset-cybernetica',
    tier: 'verified',
    code: '6-CYBER · 9 · 2 · 5 · 1 · 4 · 8',
    digits: [6, 9, 2, 5, 1, 4, 8],
    title: 'Principia Cybernetica Prime',
    author: 'Automata Concilium of New Eridu',
    epoch: 'Epoch VI · Year 102',
    sector: 'Sector 6 (Titan Vault)',
    stasisTier: 'Tier 02 · Pod 088',
    format: 'Optical Hologram Core',
    condition: 'PRISTINE (100%)',
    lastRetrieved: '3 Cycles Ago',
    custodian: 'Archivist Unit Σ-9 (Seal: 0x8F90-PBID)',
    abstract: 'Foundational algorithmic treatise codifying recursive ethics, neural boundary invariants, and self-stabilizing cognition trees in multi-agent lattices.'
  },
  {
    id: 'preset-ephemeris',
    tier: 'verified',
    code: '0-CHRON · 1 · 7 · 3 · 4 · 6 · 2',
    digits: [0, 1, 7, 3, 4, 6, 2],
    title: 'Universal Ephemeris of Antiquity',
    author: 'Archival Ministry of Babylon IX',
    epoch: 'c. 612 BCE',
    sector: 'Sector 1 (Solar Vault)',
    stasisTier: 'Tier 11 · Pod 412',
    format: 'Kiln-Fired Cuneiform Tablets / Micro-Etch',
    condition: 'CONSERVED (94.9%)',
    lastRetrieved: '118 Cycles Ago',
    custodian: 'Curator H. Scribe (Seal: 0x129B-PBID)',
    abstract: 'Complete astronomical ephemeris charting 7,200 lunar occultations and planetary conjunctions across two millennia of Mediterranean observation.'
  },
  {
    id: 'preset-spacetime',
    tier: 'verified',
    code: '5-QUANT · 7 · 3 · 8 · 0 · 2 · 9',
    digits: [5, 7, 3, 8, 0, 2, 9],
    title: 'Non-Euclidean Spacetime Foliant',
    author: 'Institute for Singularity Topologies',
    epoch: 'Epoch V · Year 88',
    sector: 'Sector 5 (Cassiopeia Pillar)',
    stasisTier: 'Tier 01 · Pod 003',
    format: 'Photonic Waveguide Foliant',
    condition: 'PRISTINE (99.1%)',
    lastRetrieved: '28 Cycles Ago',
    custodian: 'Theorist K. Vance (Seal: 0xEE77-PBID)',
    abstract: 'Mathematical proofs establishing non-orientable topological bridges across manifold tears and vacuum wormhole throats.'
  },

  // Provisional / Restricted Tier
  {
    id: 'preset-olaus',
    tier: 'provisional',
    code: '8-MYTHO · 5 · 6 · 1 · 9 · 3 · 4',
    digits: [8, 5, 6, 1, 9, 3, 4],
    title: 'The Olaus Book of Deep Constellations',
    author: 'Olaus of Hyperborea',
    epoch: 'c. 1539 CE',
    sector: 'Sector 9 (Forbidden Deep Stacks)',
    stasisTier: 'Tier 12 · Pod 666',
    format: 'Vellum & Metallic Pigment Stasis Shroud',
    condition: 'RESTRICTED (88.3%)',
    lastRetrieved: '340 Cycles Ago',
    custodian: 'High Conservator V. Drake (Seal: 0x9090-PBID)',
    abstract: 'Esoteric cartographic grimoire detailing oceanic abyss coordinates aligned with unrecorded pre-solar stellar clusters.'
  },
  {
    id: 'preset-chimeric',
    tier: 'provisional',
    code: '4-BIOAN · 2 · 8 · 7 · 3 · 0 · 5',
    digits: [4, 2, 8, 7, 3, 0, 5],
    title: 'Chimeric Morphology Monograph',
    author: 'Xenobiology Expedition Primus',
    epoch: 'Epoch III · Year 204',
    sector: 'Sector 2 (Cryo-Botanical Wing)',
    stasisTier: 'Tier 08 · Pod 551',
    format: 'Bio-Silicon Encapsulated Plates',
    condition: 'PROVISIONAL (91.0%)',
    lastRetrieved: '67 Cycles Ago',
    custodian: 'Biologist Dr. L. Ren (Seal: 0x410C-PBID)',
    abstract: 'Anatomical cross-sections of silicon-carbon hybrid organisms discovered in the subterranean aquifers of Titan.'
  },

  // Rejection Path Demonstration
  {
    id: 'preset-rejected-misfiled',
    tier: 'rejected',
    code: '9-ANOMA · 6 · 6 · 6 · 0 · 4 · 1',
    digits: [9, 6, 6, 6, 0, 4, 1],
    title: 'Corrupted Accession Shard (Misfiled Record)',
    author: 'Unknown / Citation Void',
    epoch: 'UNVERIFIED',
    sector: 'Sector X (Unassigned)',
    stasisTier: 'UNKNOWN',
    format: 'Corrupted Bitstream',
    condition: 'CRITICAL VOID (0.0%)',
    lastRetrieved: 'NEVER (REJECTED)',
    custodian: 'SYSTEM SECURITY (Seal: 0x0000-VOID)',
    abstract: 'Flagged misfiled accession token with mismatched authority concordance checksum. Demonstrates real depository rejection protocol.',
    isCorrupted: true
  }
];

// Expanded 24-record Master Catalog Database
const MASTER_CATALOG_DATABASE = [
  ...PRESET_CATALOG,
  {
    code: '0-CHRON · 4 · 2 · 1 · 0 · 9 · 8',
    title: 'Chronicles of the Solar Expansion Era',
    author: 'Terran Historical Society',
    epoch: 'Epoch I · Year 110',
    sector: 'Sector 1 (Solar Vault)',
    integrity: '99.5%',
    digits: [0, 4, 2, 1, 0, 9, 8],
    domainIndex: 0
  },
  {
    code: '1-ONTOL · 8 · 3 · 2 · 9 · 4 · 1',
    title: 'Treatise on Universal Non-Contradiction',
    author: 'School of Neo-Aristotelian Logic',
    epoch: 'Epoch II · Year 42',
    sector: 'Sector 7 (Philosophy Tower)',
    integrity: '98.7%',
    digits: [1, 8, 3, 2, 9, 4, 1],
    domainIndex: 1
  },
  {
    code: '2-XENOL · 7 · 5 · 3 · 2 · 1 · 0',
    title: 'Comparative Lexicon of Proxima B Idioms',
    author: 'Xenolinguistics Guild',
    epoch: 'Epoch IV · Year 320',
    sector: 'Sector 4 (Orion Column)',
    integrity: '96.2%',
    digits: [2, 7, 5, 3, 2, 1, 0],
    domainIndex: 2
  },
  {
    code: '3-ASTRO · 9 · 0 · 1 · 4 · 3 · 6',
    title: 'Uranographia Stellarum Vol. IX',
    author: 'Imperial Astrometric Observatory',
    epoch: 'c. 1690 CE',
    sector: 'Sector 8 (Cygnus Wing)',
    integrity: '99.2%',
    digits: [3, 9, 0, 1, 4, 3, 6],
    domainIndex: 3
  },
  {
    code: '4-BIOAN · 6 · 4 · 0 · 9 · 2 · 8',
    title: 'Cellular Mitosis in High-Radiation Regimes',
    author: 'Deep Biosphere Institute',
    epoch: 'Epoch V · Year 12',
    sector: 'Sector 2 (Cryo-Botanical Wing)',
    integrity: '97.8%',
    digits: [4, 6, 4, 0, 9, 2, 8],
    domainIndex: 4
  },
  {
    code: '5-QUANT · 1 · 9 · 4 · 8 · 7 · 3',
    title: 'Unified Gravitational Tensor Calculations',
    author: 'Dr. Evelyn St. Claire',
    epoch: 'Epoch VI · Year 05',
    sector: 'Sector 5 (Cassiopeia Pillar)',
    integrity: '99.9%',
    digits: [5, 1, 9, 4, 8, 7, 3],
    domainIndex: 5
  },
  {
    code: '6-CYBER · 3 · 1 · 4 · 1 · 5 · 9',
    title: 'Autonomous Sentinel Kernel Sourcebook',
    author: 'Core Aegis Foundry',
    epoch: 'Epoch V · Year 490',
    sector: 'Sector 6 (Titan Vault)',
    integrity: '100.0%',
    digits: [6, 3, 1, 4, 1, 5, 9],
    domainIndex: 6
  },
  {
    code: '7-EPIGR · 3 · 6 · 2 · 8 · 0 · 4',
    title: 'The Stele of Hammurabi Prime',
    author: 'Babylonian High Tribunal',
    epoch: 'c. 1750 BCE',
    sector: 'Sector 3 (Antiquities Hall)',
    integrity: '95.4%',
    digits: [7, 3, 6, 2, 8, 0, 4],
    domainIndex: 7
  },
  {
    code: '8-MYTHO · 9 · 8 · 7 · 6 · 5 · 4',
    title: 'Song of the Seven Void Navigators',
    author: 'Oral Tradition of Perseus Rim',
    epoch: 'Antiquity Unknown',
    sector: 'Sector 9 (Forbidden Deep Stacks)',
    integrity: '89.1%',
    digits: [8, 9, 8, 7, 6, 5, 4],
    domainIndex: 8
  },
  {
    code: '9-ANOMA · 0 · 0 · 7 · 1 · 3 · 9',
    title: 'Temporal Echo Transmission from Vega VII',
    author: 'Automated Listening Array Gamma',
    epoch: 'Epoch VII · PENDING',
    sector: 'Sector X (Quarantine Chamber)',
    integrity: '74.2%',
    digits: [9, 0, 0, 7, 1, 3, 9],
    domainIndex: 9
  }
];

// Chain-of-Custody Provenance Ledger
const PROVENANCE_LEDGER = [
  { id: 'TX-90412-A', epoch: '2026.234.04:12:09', code: '3-ASTRO.882', op: 'STASIS SEAL VERIFIED', custodian: 'Curator A. Valerius', hash: '0x9F4C...B821', notes: 'Periodic molecular lattice inspection; cryogenic levels nominal.' },
  { id: 'TX-90408-C', epoch: '2026.230.19:44:00', code: '2-XENOL.410', op: 'OPTICAL RESURFACING', custodian: 'Chief Epigrapher M. Thorne', hash: '0x33A1...EE90', notes: 'Photonic substrate de-ionized; zero bit decay.' },
  { id: 'TX-90399-K', epoch: '2026.215.11:02:45', code: '6-CYBER.925', op: 'CUSTODIAL HANDOFF', custodian: 'Archivist Unit Σ-9', hash: '0x8F90...44FA', notes: 'Re-indexed to Titan Vault Pod 088.' },
  { id: 'TX-90382-X', epoch: '2026.190.08:30:12', code: '8-MYTHO.561', op: 'PRESERVATION INTEGRITY HOLD ENGAGED', custodian: 'High Conservator V. Drake', hash: '0x9090...77A2', notes: 'Special conservation protocol applied to ancient vellum shroud.' },
  { id: 'TX-90370-P', epoch: '2026.175.22:15:33', code: '5-QUANT.738', op: 'CONCORDANCE RESEAL', custodian: 'Theorist K. Vance', hash: '0xEE77...112C', notes: 'Manifold equations validated against CERN-42 archives.' },
  { id: 'TX-90355-M', epoch: '2026.150.14:09:51', code: '9-ANOMA.666', op: 'CITATION REJECTION FLAGGED', custodian: 'SYSTEM SECURITY', hash: '0x0000...VOID', notes: 'Accession authority checksum mismatch; quarantined from primary index.' }
];

// ============================================================================
// 2. PROCEDURAL WEB AUDIO SYNTHESIZER
// ============================================================================

class DepositoryAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.droneGain = null;
    this.droneOsc1 = null;
    this.droneOsc2 = null;
    this.isMuted = false;
    this.sfxEnabled = true;
    this.droneEnabled = true;
    this.bellEnabled = true;
    this.volume = 0.75;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.droneGain = this.ctx.createGain();
      this.droneGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
      this.droneGain.connect(this.masterGain);

      this.initAmbientDrone();
    } catch (e) {
      console.warn('Web Audio initialization error:', e);
    }
  }

  ensureContext() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  initAmbientDrone() {
    if (!this.ctx) return;
    this.droneOsc1 = this.ctx.createOscillator();
    this.droneOsc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();

    this.droneOsc1.type = 'sine';
    this.droneOsc1.frequency.setValueAtTime(55, this.ctx.currentTime); // A1 note

    this.droneOsc2.type = 'triangle';
    this.droneOsc2.frequency.setValueAtTime(110, this.ctx.currentTime); // A2 note

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(180, this.ctx.currentTime);

    this.droneOsc1.connect(filter);
    this.droneOsc2.connect(filter);
    filter.connect(this.droneGain);

    this.droneOsc1.start();
    this.droneOsc2.start();

    if (this.droneEnabled) {
      this.droneGain.gain.setTargetAtTime(0.06, this.ctx.currentTime, 1.0);
    }
  }

  // Card/Index Rotary Wheel Riffling Sound
  playRotaryClick() {
    if (!this.sfxEnabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(420 + Math.random() * 80, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.04);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);
    filter.Q.setValueAtTime(3, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.045);
  }

  // Cross-reference data check chirp
  playCrossReferenceChirp() {
    if (!this.sfxEnabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.linearRampToValueAtTime(2400, now + 0.06);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  // Mechanical Detent Click & Harmonic Reference Desk Bell Chime
  playLockDetent() {
    if (!this.sfxEnabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // 1. Crisp Mechanical Click
    const clickOsc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    clickOsc.type = 'square';
    clickOsc.frequency.setValueAtTime(180, now);
    clickOsc.frequency.exponentialRampToValueAtTime(40, now + 0.05);

    clickGain.gain.setValueAtTime(0.35, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    clickOsc.connect(clickGain);
    clickGain.connect(this.sfxGain);
    clickOsc.start(now);
    clickOsc.stop(now + 0.06);

    // 2. Pure Reference-Desk Bell Chime
    if (this.bellEnabled) {
      const bellOsc1 = this.ctx.createOscillator();
      const bellOsc2 = this.ctx.createOscillator();
      const bellGain = this.ctx.createGain();

      bellOsc1.type = 'sine';
      bellOsc1.frequency.setValueAtTime(880, now + 0.02); // A5

      bellOsc2.type = 'sine';
      bellOsc2.frequency.setValueAtTime(1760, now + 0.02); // A6 overtone

      bellGain.gain.setValueAtTime(0.0, now);
      bellGain.gain.setValueAtTime(0.25, now + 0.02);
      bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      bellOsc1.connect(bellGain);
      bellOsc2.connect(bellGain);
      bellGain.connect(this.sfxGain);

      bellOsc1.start(now + 0.02);
      bellOsc2.start(now + 0.02);
      bellOsc1.stop(now + 0.75);
      bellOsc2.stop(now + 0.75);
    }
  }

  // Discordant Rejection Buzzer (For misfiled record test case)
  playRejectionBuzzer() {
    if (!this.sfxEnabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(110, now); // A2

    osc2.type = 'square';
    osc2.frequency.setValueAtTime(155.56, now); // Tritone D#3 (jarring discord)

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.setValueAtTime(0.35, now + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.5);
  }

  // Stage 1: Buildup Sound (Pneumatic Surge + Ascending Harmonic Resonator)
  playBuildupSound(durationSeconds = 2.0) {
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const sub = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(65, now);
    osc.frequency.exponentialRampToValueAtTime(260, now + durationSeconds);

    sub.type = 'sine';
    sub.frequency.setValueAtTime(40, now);
    sub.frequency.linearRampToValueAtTime(120, now + durationSeconds);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(120, now);
    filter.frequency.exponentialRampToValueAtTime(1800, now + durationSeconds);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.linearRampToValueAtTime(0.4, now + durationSeconds);

    osc.connect(filter);
    sub.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    sub.start(now);
    osc.stop(now + durationSeconds);
    sub.stop(now + durationSeconds);
  }

  // Stage 2: Breakthrough Flare (Kinetic Iris Opening & Bell Crescendo)
  playBreakthroughFlare() {
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Pneumatic Decompression hiss
    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(2400, now);
    noiseFilter.Q.setValueAtTime(1.5, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noise.start(now);

    // Harmonic Chord Flare (C Major / E / G Shimmer)
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const chordOsc = this.ctx.createOscillator();
      const chordGain = this.ctx.createGain();

      chordOsc.type = 'sine';
      chordOsc.frequency.setValueAtTime(freq, now + 0.05);

      chordGain.gain.setValueAtTime(0.0, now);
      chordGain.gain.setValueAtTime(0.18 / (idx + 1), now + 0.05);
      chordGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      chordOsc.connect(chordGain);
      chordGain.connect(this.masterGain);

      chordOsc.start(now + 0.05);
      chordOsc.stop(now + 1.3);
    });
  }

  // Stage 3: Sustained Hum Active Modulation
  setSustainedActive(isActive) {
    if (!this.droneGain || !this.ctx) return;
    const targetGain = isActive ? 0.18 : (this.droneEnabled ? 0.06 : 0.0);
    this.droneGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.4);
  }

  // Warning Klaxon (When safety interlock blocks)
  playWarningKlaxon() {
    if (!this.sfxEnabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.setValueAtTime(450, now + 0.15);
    osc.frequency.setValueAtTime(600, now + 0.3);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.48);
  }

  // Disengage / Pneumatic Seal Sound
  playDisengageSound() {
    if (!this.sfxEnabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.25);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.28);
  }
}

// ============================================================================
// 3. CORE SYSTEM STATE MACHINE & CONTROLLER
// ============================================================================

class BibliographicDepositoryConsole {
  constructor() {
    this.audio = new DepositoryAudioEngine();
    
    // Dialing State
    this.dialedDigits = []; // Array of up to 7 numbers [0-9]
    this.currentSlotIndex = 0;
    this.activeRecord = null;
    this.currentWheelRotation = 0;
    
    // System Status States: 'IDLE', 'DIALING', 'PENDING', 'BUILDUP', 'BREAKTHROUGH', 'SUSTAINED_ACTIVE', 'REJECTED'
    this.systemState = 'IDLE';

    // Quick-Dial Sequence Handler
    this.isAutoDialing = false;
    this.autoDialTimeout = null;

    // View State
    this.currentView = 'retriever';

    // Animation Settings
    this.dialSpeed = 'normal'; // 'normal' (350ms), 'fast' (180ms), 'instant'

    // DOM Elements Cache
    this.cacheDOM();
    this.initWheelSegments();
    this.initPresetCards();
    this.initMasterCatalogTable();
    this.initProvenanceTable();
    this.initDeepStacksMap();
    this.initPreservationSensors();
    this.bindEvents();
    this.updateViewportScale();
  }

  cacheDOM() {
    // Top Bar
    this.n2Telemetry = document.getElementById('telemetry-n2');
    this.tempTelemetry = document.getElementById('telemetry-temp');
    this.integrityTelemetry = document.getElementById('telemetry-integrity');
    this.latencyTelemetry = document.getElementById('telemetry-latency');
    this.clockTelemetry = document.getElementById('telemetry-clock');
    this.navTabs = document.querySelectorAll('.nav-tab');
    this.btnOpenHelp = document.getElementById('btn-open-help');
    this.btnCloseHelp = document.getElementById('btn-close-help');
    this.operatorModal = document.getElementById('operator-modal');

    // Views
    this.views = {
      retriever: document.getElementById('view-retriever'),
      catalog: document.getElementById('view-catalog'),
      stacks: document.getElementById('view-stacks'),
      provenance: document.getElementById('view-provenance'),
      settings: document.getElementById('view-settings')
    };

    // Center Stage: Rotary Wheel & Aperture
    this.rotaryWheel = document.getElementById('rotary-wheel');
    this.wheelSegmentsLayer = document.getElementById('wheel-segments-layer');
    this.stasisAperture = document.getElementById('stasis-aperture');
    this.holoProjection = document.getElementById('holo-projection');
    this.holoDocTitle = document.getElementById('holo-doc-title');
    this.holoDocGlyph = document.getElementById('holo-doc-glyph');
    this.hudPhaseLabel = document.getElementById('hud-phase-label');
    this.hudPhaseFill = document.getElementById('hud-phase-fill');

    // Sequence Slots
    this.seqStatusPill = document.getElementById('seq-status-pill');
    this.taxonSlots = [
      document.getElementById('slot-0'),
      document.getElementById('slot-1'),
      document.getElementById('slot-2'),
      document.getElementById('slot-3'),
      document.getElementById('slot-4'),
      document.getElementById('slot-5'),
      document.getElementById('slot-6')
    ];

    // Core Controls (Cluster 1 & Cluster 2)
    this.taxonButtons = document.querySelectorAll('.taxon-btn');
    this.chkIntegrityHold = document.getElementById('chk-integrity-hold');
    this.holdStatusText = document.getElementById('hold-status-text');
    this.btnRetrieveVault = document.getElementById('btn-retrieve-vault');
    this.actuatorSubtext = document.getElementById('actuator-subtext');
    this.btnDisengageVault = document.getElementById('btn-disengage-vault');

    // Flanking Wings
    this.presetListVerified = document.getElementById('preset-list-verified');
    this.presetListProvisional = document.getElementById('preset-list-provisional');
    this.presetListRejected = document.getElementById('preset-list-rejected');
    this.concordanceLogStream = document.getElementById('concordance-log-stream');
    this.concConfidenceBar = document.getElementById('conc-confidence-bar');
    this.concConfidenceText = document.getElementById('conc-confidence-text');
    this.concState = document.getElementById('conc-state');

    // Dossier
    this.dossierIdleView = document.getElementById('dossier-idle-view');
    this.dossierActiveView = document.getElementById('dossier-active-view');
    this.dosClassCode = document.getElementById('dos-class-code');
    this.dosCondition = document.getElementById('dos-condition');
    this.dosTitle = document.getElementById('dos-title');
    this.dosOrigin = document.getElementById('dos-origin');
    this.dosSector = document.getElementById('dos-sector');
    this.dosTier = document.getElementById('dos-tier');
    this.dosFormat = document.getElementById('dos-format');
    this.dosLastRetrieved = document.getElementById('dos-last-retrieved');
    this.dosAbstract = document.getElementById('dos-abstract');
    this.dosCustodian = document.getElementById('dos-custodian');

    // Settings
    this.setMasterVolume = document.getElementById('set-master-volume');
    this.valMasterVol = document.getElementById('val-master-vol');
    this.setSfxToggle = document.getElementById('set-sfx-toggle');
    this.setDroneToggle = document.getElementById('set-drone-toggle');
    this.setBellToggle = document.getElementById('set-bell-toggle');
    this.setPhosphorTheme = document.getElementById('set-phosphor-theme');
    this.setScanlinesToggle = document.getElementById('set-scanlines-toggle');
    this.setMotionRate = document.getElementById('set-motion-rate');

    // Catalog search
    this.catalogSearchInput = document.getElementById('catalog-search-input');
    this.catalogCategoryFilter = document.getElementById('catalog-category-filter');
    this.catalogTableBody = document.getElementById('catalog-table-body');
    this.provenanceTableBody = document.getElementById('provenance-table-body');

    // Footer
    this.footerStatusMsg = document.getElementById('ticker-msg');
  }

  // 1. Initialize the 10 Radial Classification Segments on the Rotary Wheel
  initWheelSegments() {
    this.wheelSegmentsLayer.innerHTML = '';
    const segmentAngle = 360 / VALERIUS_TAXONOMY.length; // 36 degrees per segment

    VALERIUS_TAXONOMY.forEach((taxon, index) => {
      const angle = index * segmentAngle;
      const fin = document.createElement('div');
      fin.className = `radial-fin-segment fin-segment-${taxon.digit}`;
      fin.id = `wheel-fin-${taxon.digit}`;
      fin.style.transform = `rotate(${angle}deg)`;

      fin.innerHTML = `
        <div class="fin-tab-card">
          <span class="fin-glyph">${taxon.glyph}</span>
          <span class="fin-digit">${taxon.digit}</span>
          <span class="fin-label">${taxon.name}</span>
        </div>
      `;

      this.wheelSegmentsLayer.appendChild(fin);
    });
  }

  // 2. Initialize Quick-Dial Presets in Left Wing
  initPresetCards() {
    this.presetListVerified.innerHTML = '';
    this.presetListProvisional.innerHTML = '';
    this.presetListRejected.innerHTML = '';

    PRESET_CATALOG.forEach((preset) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = `preset-card-btn ${preset.tier === 'rejected' ? 'rejection' : ''}`;
      card.id = `btn-preset-${preset.id}`;
      card.setAttribute('data-preset-id', preset.id);

      card.innerHTML = `
        <div class="preset-header-row">
          <span class="preset-code">${preset.code}</span>
          <span class="preset-tier-pill">${preset.tier.toUpperCase()}</span>
        </div>
        <div class="preset-name">${preset.title}</div>
        <div class="preset-desc">${preset.author}</div>
      `;

      card.addEventListener('click', () => {
        this.audio.playRotaryClick();
        this.loadAndDialPreset(preset);
      });

      if (preset.tier === 'verified') {
        this.presetListVerified.appendChild(card);
      } else if (preset.tier === 'provisional') {
        this.presetListProvisional.appendChild(card);
      } else {
        this.presetListRejected.appendChild(card);
      }
    });
  }

  // 3. Initialize Master Catalog Table
  initMasterCatalogTable() {
    this.renderCatalogRows(MASTER_CATALOG_DATABASE);
  }

  renderCatalogRows(records) {
    this.catalogTableBody.innerHTML = '';
    records.forEach((rec, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-family: var(--font-mono); font-weight: 700; color: var(--phosphor-primary);">${rec.code}</td>
        <td style="font-family: var(--font-serif); font-weight: 700; color: #fff;">${rec.title}</td>
        <td>${rec.author}</td>
        <td style="font-family: var(--font-mono);">${rec.epoch || 'Antiquity'}</td>
        <td style="font-family: var(--font-mono);">${rec.sector || 'Sector ' + (rec.domainIndex || 1)}</td>
        <td style="font-family: var(--font-mono); color: var(--cyan-secondary);">${rec.integrity || rec.condition || '99.0%'}</td>
        <td>
          <button type="button" class="table-load-btn" data-catalog-idx="${idx}">DIAL CODE</button>
        </td>
      `;

      tr.querySelector('.table-load-btn').addEventListener('click', () => {
        this.switchView('retriever');
        this.loadAndDialPreset(rec);
      });

      this.catalogTableBody.appendChild(tr);
    });
  }

  // 4. Initialize Provenance Table
  initProvenanceTable() {
    this.provenanceTableBody.innerHTML = '';
    PROVENANCE_LEDGER.forEach(entry => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-family: var(--font-mono); font-weight: 700; color: var(--cyan-secondary);">${entry.id}</td>
        <td style="font-family: var(--font-mono);">${entry.epoch}</td>
        <td style="font-family: var(--font-mono); color: var(--phosphor-primary); font-weight: 700;">${entry.code}</td>
        <td style="font-weight: 700;">${entry.op}</td>
        <td>${entry.custodian}</td>
        <td style="font-family: var(--font-mono); color: var(--amber-accent);">${entry.hash}</td>
        <td style="font-size: 11px;">${entry.notes}</td>
      `;
      this.provenanceTableBody.appendChild(tr);
    });
  }

  // 5. Initialize Deep Stacks Map SVG
  initDeepStacksMap() {
    const silosGroup = document.getElementById('stacks-silos-layer');
    if (!silosGroup) return;
    silosGroup.innerHTML = '';

    const sectors = ['SECTOR 1 (CHRONOS)', 'SECTOR 2 (BIOLOGY)', 'SECTOR 3 (ANTIQUITY)', 'SECTOR 4 (XENOLING)', 'SECTOR 5 (QUANTUM)', 'SECTOR 8 (ASTROMET)'];
    
    sectors.forEach((sec, i) => {
      const x = 80 + i * 180;
      const y = 80;
      const silo = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      silo.setAttribute('class', 'stack-silo-node');
      silo.innerHTML = `
        <rect x="${x}" y="${y}" width="150" height="480" rx="6" fill="#080e14" stroke="rgba(0, 240, 170, 0.25)" stroke-width="1.5"/>
        <line x1="${x}" y1="${y + 40}" x2="${x + 150}" y2="${y + 40}" stroke="rgba(0, 240, 170, 0.4)"/>
        <text x="${x + 75}" y="${y + 25}" text-anchor="middle" font-family="Orbitron" font-size="10" fill="#00f0aa" font-weight="bold">${sec.split(' ')[0]} ${sec.split(' ')[1]}</text>
        <text x="${x + 75}" y="${y + 55}" text-anchor="middle" font-family="Rajdhani" font-size="9" fill="#8da6a0">${sec.split('(')[1].replace(')', '')}</text>
        <!-- 10 Shelf Pod Racks -->
        ${Array.from({ length: 10 }).map((_, r) => `
          <rect x="${x + 15}" y="${y + 70 + r * 38}" width="120" height="28" rx="3" fill="rgba(0, 229, 255, 0.05)" stroke="rgba(0, 229, 255, 0.15)"/>
          <text x="${x + 25}" y="${y + 88 + r * 38}" font-family="JetBrains Mono" font-size="8" fill="#4e6661">POD ${r * 10 + 1}</text>
        `).join('')}
      `;
      silosGroup.appendChild(silo);
    });
  }

  // 6. Preservation Atmosphere Simulation Telemetry
  initPreservationSensors() {
    setInterval(() => {
      if (document.hidden) return;
      const n2 = (98.8 + (Math.random() * 0.2 - 0.1)).toFixed(2);
      const temp = (77.2 + (Math.random() * 0.4 - 0.2)).toFixed(1);
      const latency = (14.0 + (Math.random() * 1.5 - 0.7)).toFixed(1);

      if (this.n2Telemetry) this.n2Telemetry.textContent = `${n2}% N₂`;
      if (this.tempTelemetry) this.tempTelemetry.textContent = `${temp} K`;
      if (this.latencyTelemetry) this.latencyTelemetry.textContent = `${latency} ms`;

      // Live Clock
      const now = new Date();
      const yr = now.getFullYear();
      const dayOfYear = Math.floor((now - new Date(yr, 0, 0)) / (1000 * 60 * 60 * 24));
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      if (this.clockTelemetry) {
        this.clockTelemetry.textContent = `${yr}.${String(dayOfYear).padStart(3, '0')}.${hh}:${mm}:${ss}`;
      }
    }, 1200);
  }

  // 7. Event Binding
  bindEvents() {
    // Window Resize Scale
    window.addEventListener('resize', () => this.updateViewportScale());

    // Navigation Tabs
    this.navTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.audio.playRotaryClick();
        const viewName = tab.getAttribute('data-view');
        this.switchView(viewName);
      });
    });

    // Operator Help Modal
    this.btnOpenHelp.addEventListener('click', () => {
      this.audio.playRotaryClick();
      this.operatorModal.classList.remove('hidden');
    });

    this.btnCloseHelp.addEventListener('click', () => {
      this.audio.playRotaryClick();
      this.operatorModal.classList.add('hidden');
    });

    this.operatorModal.addEventListener('click', (e) => {
      if (e.target === this.operatorModal) {
        this.operatorModal.classList.add('hidden');
      }
    });

    // Taxonomic Buttons (Cluster 1)
    this.taxonButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const digit = parseInt(btn.getAttribute('data-digit'), 10);
        this.handleManualDigitInput(digit);
      });
    });

    // Preservation Integrity Hold Safety Switch (Cluster 2)
    this.chkIntegrityHold.addEventListener('change', () => {
      const isEngaged = this.chkIntegrityHold.checked;
      this.audio.playRotaryClick();
      if (isEngaged) {
        this.holdStatusText.textContent = 'ENGAGED [RESTRICTED]';
        this.holdStatusText.classList.add('engaged');
        this.logConcordanceStream('[SECURITY] Preservation Integrity Hold ENGAGED. Archival extraction locked.', 'verify');
      } else {
        this.holdStatusText.textContent = 'RELEASED [UNRESTRICTED]';
        this.holdStatusText.classList.remove('engaged');
        this.logConcordanceStream('[SECURITY] Preservation Integrity Hold RELEASED. Retrieval unrestricted.', 'ready');
      }
    });

    // Master Activation Actuator (Cluster 2)
    this.btnRetrieveVault.addEventListener('click', () => {
      this.handleVaultActivation();
    });

    // Disengage / Seal Vault Button (Cluster 2)
    this.btnDisengageVault.addEventListener('click', () => {
      this.handleDisengage();
    });

    // Master Catalog Search & Filter
    if (this.catalogSearchInput) {
      this.catalogSearchInput.addEventListener('input', () => this.filterCatalog());
    }
    if (this.catalogCategoryFilter) {
      this.catalogCategoryFilter.addEventListener('change', () => this.filterCatalog());
    }

    // Settings Controls
    if (this.setMasterVolume) {
      this.setMasterVolume.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        this.valMasterVol.textContent = `${val}%`;
        this.audio.volume = val / 100;
        if (this.audio.masterGain && this.audio.ctx) {
          this.audio.masterGain.gain.setValueAtTime(this.audio.volume, this.audio.ctx.currentTime);
        }
      });
    }

    if (this.setSfxToggle) {
      this.setSfxToggle.addEventListener('change', (e) => {
        this.audio.sfxEnabled = e.target.checked;
      });
    }

    if (this.setDroneToggle) {
      this.setDroneToggle.addEventListener('change', (e) => {
        this.audio.droneEnabled = e.target.checked;
        if (this.audio.droneGain && this.audio.ctx) {
          const target = this.audio.droneEnabled ? 0.06 : 0;
          this.audio.droneGain.gain.setTargetAtTime(target, this.audio.ctx.currentTime, 0.5);
        }
      });
    }

    if (this.setBellToggle) {
      this.setBellToggle.addEventListener('change', (e) => {
        this.audio.bellEnabled = e.target.checked;
      });
    }

    if (this.setPhosphorTheme) {
      this.setPhosphorTheme.addEventListener('change', (e) => {
        document.body.className = e.target.value;
      });
    }

    if (this.setScanlinesToggle) {
      this.setScanlinesToggle.addEventListener('change', (e) => {
        if (e.target.checked) {
          document.body.classList.remove('no-scanlines');
        } else {
          document.body.classList.add('no-scanlines');
        }
      });
    }

    if (this.setMotionRate) {
      this.setMotionRate.addEventListener('change', (e) => {
        this.dialSpeed = e.target.value;
      });
    }

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        this.handleManualDigitInput(parseInt(e.key, 10));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (!this.btnRetrieveVault.disabled) {
          this.handleVaultActivation();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.handleDisengage();
      } else if (e.key === '?' || e.key.toLowerCase() === 'h') {
        e.preventDefault();
        this.operatorModal.classList.toggle('hidden');
      }
    });
  }

  // 8. Viewport Scale Calculation (Handling CSS scale pitfall)
  updateViewportScale() {
    const targetWidth = 1920;
    const targetHeight = 1080;
    const currentWidth = window.innerWidth;
    const currentHeight = window.innerHeight;

    const scaleX = currentWidth / targetWidth;
    const scaleY = currentHeight / targetHeight;
    const finalScale = Math.min(scaleX, scaleY);

    document.documentElement.style.setProperty('--ui-scale', finalScale);
    console.log(`[Viewport Scaler] Window: ${currentWidth}x${currentHeight} -> Scale Factor: ${finalScale.toFixed(4)}`);
  }

  // 9. View Switcher
  switchView(viewName) {
    this.currentView = viewName;

    // Update Nav Buttons
    this.navTabs.forEach(tab => {
      if (tab.getAttribute('data-view') === viewName) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    // Update View Panes
    Object.keys(this.views).forEach(key => {
      if (this.views[key]) {
        if (key === viewName) {
          this.views[key].classList.remove('hidden');
        } else {
          this.views[key].classList.add('hidden');
        }
      }
    });
  }

  // 10. Filter Master Catalog
  filterCatalog() {
    const query = (this.catalogSearchInput.value || '').toLowerCase().trim();
    const domainFilter = this.catalogCategoryFilter.value;

    const filtered = MASTER_CATALOG_DATABASE.filter(rec => {
      const matchesDomain = domainFilter === 'ALL' || (rec.digits && rec.digits[0] === parseInt(domainFilter, 10));
      const matchesQuery = !query || 
        rec.title.toLowerCase().includes(query) ||
        rec.code.toLowerCase().includes(query) ||
        (rec.author && rec.author.toLowerCase().includes(query)) ||
        (rec.abstract && rec.abstract.toLowerCase().includes(query));

      return matchesDomain && matchesQuery;
    });

    this.renderCatalogRows(filtered);
  }

  // ============================================================================
  // 4. DIALING ENGINE & ARCHIVAL LOCKING MECHANISM
  // ============================================================================

  // Manual Digit Input from Button or Keyboard
  handleManualDigitInput(digit) {
    if (this.systemState === 'BUILDUP' || this.systemState === 'BREAKTHROUGH' || this.systemState === 'SUSTAINED_ACTIVE') {
      console.warn('Cannot dial while retrieval stasis vault is active. Seal vault first.');
      return;
    }

    if (this.isAutoDialing) {
      this.cancelAutoDial();
    }

    if (this.dialedDigits.length >= 7) {
      console.log('Accession address already complete (7/7). Actuator is pending or disengage to reset.');
      return;
    }

    this.dialSingleDigit(digit);
  }

  // Rotate wheel & execute the secondary cross-reference authority verification check
  dialSingleDigit(digit, onLockedCallback = null) {
    this.systemState = 'DIALING';
    const slotIdx = this.dialedDigits.length;
    const taxon = VALERIUS_TAXONOMY[digit];

    // 1. Audio: Card rotary riffling
    this.audio.playRotaryClick();

    // 2. Physical Rotary Wheel Motion: Rotate to bring digit under top collimator (0 deg)
    // Fin angle is digit * 36 deg. To align at top (0 deg), rotate by - (digit * 36) deg.
    const targetAngle = -(digit * 36);
    this.rotaryWheel.style.transform = `rotate(${targetAngle}deg)`;

    // Highlight aligned segment
    document.querySelectorAll('.radial-fin-segment').forEach(fin => fin.classList.remove('aligned'));
    const activeFin = document.getElementById(`wheel-fin-${digit}`);
    if (activeFin) activeFin.classList.add('aligned');

    // Telemetry log
    this.logConcordanceStream(`[ROTARY-STEP] Fin ${digit} (${taxon.name}) aligned under reading aperture.`, 'verify');
    this.updateHUDPhase(`ROTARY ALIGN: ${taxon.name}`, 'buildup', (slotIdx + 0.5) / 7 * 100);

    // Timing based on speed setting
    let delay = 320;
    if (this.dialSpeed === 'fast') delay = 160;
    if (this.dialSpeed === 'instant') delay = 40;

    setTimeout(() => {
      // 3. SECONDARY CROSS-REFERENCE & AUTHORITY VERIFICATION CHECK
      this.audio.playCrossReferenceChirp();
      const authChecksum = `0x${Math.floor(Math.random() * 65535).toString(16).toUpperCase().padStart(4, '0')}`;
      this.logConcordanceStream(`[CONCORDANCE] Cross-indexing Authority Seal ${authChecksum} for Facet ${slotIdx + 1}...`, 'verify');

      // Check if this dial is a rejection path test case (e.g. 9-ANOMA.666)
      if (this.activeRecord && this.activeRecord.isCorrupted && slotIdx >= 3) {
        this.triggerRejectionPath(digit, slotIdx);
        return;
      }

      setTimeout(() => {
        // 4. LOCKING CONFIRMATION: Detent click + Reference Bell Chime
        this.audio.playLockDetent();
        this.dialedDigits.push(digit);

        // Update Slot UI
        const slotEl = this.taxonSlots[slotIdx];
        if (slotEl) {
          slotEl.classList.remove('active-slot');
          slotEl.classList.add('locked');
          slotEl.querySelector('.slot-value-display').textContent = digit;
          slotEl.querySelector('.slot-taxon-name').textContent = taxon.name;
          slotEl.querySelector('.slot-lock-indicator').textContent = 'VERIFIED';
        }

        if (activeFin) activeFin.classList.add('locked');

        const nextSlot = this.taxonSlots[slotIdx + 1];
        if (nextSlot) nextSlot.classList.add('active-slot');

        const confidence = Math.min(100, Math.round(((slotIdx + 1) / 7) * 100));
        this.concConfidenceBar.style.width = `${confidence}%`;
        this.concConfidenceText.textContent = `${confidence}.0%`;

        this.logConcordanceStream(`[LOCK] Facet ${slotIdx + 1} confirmed: ${digit} [${taxon.name}] · Authority Seal Valid.`, 'locked');
        this.seqStatusPill.textContent = `AWAITING FACET ${slotIdx + 2} OF 7`;

        // Check if 7 facets are complete
        if (this.dialedDigits.length === 7) {
          this.handleDialingComplete();
        }

        if (onLockedCallback) onLockedCallback();
      }, delay * 0.5);

    }, delay);
  }

  // Completing the 7th lock leaves the system PENDING (NEVER AUTO-FIRES)
  handleDialingComplete() {
    this.systemState = 'PENDING';
    this.seqStatusPill.textContent = 'CONCORDANCE LOCKED · 7/7 FACETS';
    this.seqStatusPill.style.color = 'var(--amber-accent)';
    this.seqStatusPill.style.borderColor = 'var(--amber-accent)';

    // Update Master Activation Actuator
    this.btnRetrieveVault.disabled = false;
    this.btnRetrieveVault.classList.add('ready-to-fire');
    this.actuatorSubtext.textContent = 'STASIS VAULT READY // ACTUATE TO OPEN';

    this.updateHUDPhase('VAULT PENDING // READY TO RETRIEVE', 'pending', 100);
    this.logConcordanceStream('[STATUS] All 7 classification facets verified. Stasis retrieval aperture primed.', 'ready');

    // Attempt to match with catalog
    if (!this.activeRecord) {
      const match = MASTER_CATALOG_DATABASE.find(r => 
        r.digits && r.digits.every((d, i) => d === this.dialedDigits[i])
      );
      if (match) {
        this.activeRecord = match;
        this.populateDossier(match, false);
      }
    }

    if (this.footerStatusMsg) {
      this.footerStatusMsg.textContent = 'CONCORDANCE VERIFIED // AWAITING OPERATOR VAULT RETRIEVAL ACTUATION';
    }
  }

  // 11. Quick-Dial Preset Auto-Sequence (Genuinely sequential, never instant jump)
  loadAndDialPreset(preset) {
    this.handleDisengage(false); // Clean reset without alert

    this.activeRecord = preset;
    this.isAutoDialing = true;
    this.logConcordanceStream(`[ACCESSION-LOG] Replaying verified log for: ${preset.title}...`, 'ready');

    // Highlight Preset Card
    document.querySelectorAll('.preset-card-btn').forEach(c => c.classList.remove('active'));
    const btn = document.getElementById(`btn-preset-${preset.id}`);
    if (btn) btn.classList.add('active');

    // Pre-populate dossier
    this.populateDossier(preset, false);

    // Sequentially dial each digit
    let step = 0;
    const runNextStep = () => {
      if (!this.isAutoDialing || step >= preset.digits.length) {
        this.isAutoDialing = false;
        return;
      }

      const digit = preset.digits[step];
      step++;

      this.dialSingleDigit(digit, () => {
        if (this.isAutoDialing && step < preset.digits.length) {
          let stepDelay = 220;
          if (this.dialSpeed === 'fast') stepDelay = 100;
          if (this.dialSpeed === 'instant') stepDelay = 20;

          this.autoDialTimeout = setTimeout(runNextStep, stepDelay);
        } else {
          this.isAutoDialing = false;
        }
      });
    };

    runNextStep();
  }

  cancelAutoDial() {
    this.isAutoDialing = false;
    if (this.autoDialTimeout) {
      clearTimeout(this.autoDialTimeout);
      this.autoDialTimeout = null;
    }
  }

  // 12. Rejection Path Demonstration (Misfiled / Corrupted Record)
  triggerRejectionPath(digit, slotIdx) {
    this.cancelAutoDial();
    this.systemState = 'REJECTED';
    this.audio.playRejectionBuzzer();

    this.logConcordanceStream(`[MISMATCH] AUTHORITY CONCORDANCE CORRUPTED AT TIER ${slotIdx + 1}!`, 'error');
    this.logConcordanceStream(`[REJECTED] Accession Token 0x0000 INVALID. Vault retrieval dismissed by archive security.`, 'error');

    this.updateHUDPhase('REJECTED // CITATION VOID', 'error', 100);
    this.hudPhaseFill.style.backgroundColor = 'var(--crimson-alert)';

    // Visual rejection flash on wheel
    this.rotaryWheel.style.borderColor = 'var(--crimson-alert)';
    this.seqStatusPill.textContent = 'ACCESS CORRUPTED · REJECTED';
    this.seqStatusPill.style.color = 'var(--crimson-alert)';
    this.seqStatusPill.style.borderColor = 'var(--crimson-alert)';

    setTimeout(() => {
      this.rotaryWheel.style.borderColor = '';
      this.handleDisengage(false);
      this.logConcordanceStream('[SYS-RESET] Console reset to nominal idle state.', 'ready');
    }, 2400);
  }

  // ============================================================================
  // 5. THREE-STAGE STASIS VAULT ACTIVATION
  // ============================================================================

  handleVaultActivation() {
    if (this.systemState !== 'PENDING') {
      console.warn('Cannot activate vault: Dialing not pending or already active.');
      return;
    }

    // SAFETY INTERLOCK CHECK: Preservation Integrity Hold
    if (this.chkIntegrityHold && this.chkIntegrityHold.checked) {
      this.audio.playWarningKlaxon();
      this.logConcordanceStream('[ALERT] PRESERVATION INTEGRITY HOLD ACTIVE! Retrieval blocked by conservation protocol.', 'error');
      this.updateHUDPhase('⚠️ HOLD ENGAGED // RETRIEVAL BLOCKED', 'error', 100);

      // Flash hold switch
      const wrapper = document.getElementById('interlock-wrapper');
      if (wrapper) {
        wrapper.style.borderColor = 'var(--crimson-alert)';
        wrapper.style.boxShadow = '0 0 20px var(--crimson-glow)';
        setTimeout(() => {
          wrapper.style.borderColor = '';
          wrapper.style.boxShadow = '';
        }, 1500);
      }
      return;
    }

    // -------------------------------------------------------------
    // STAGE 1: BUILDUP (2.0s Duration)
    // -------------------------------------------------------------
    this.systemState = 'BUILDUP';
    this.btnRetrieveVault.disabled = true;
    this.btnRetrieveVault.classList.remove('ready-to-fire');
    this.actuatorSubtext.textContent = 'BUILDUP // EQUALIZING STASIS PRESSURE';

    this.audio.playBuildupSound(2.0);
    this.logConcordanceStream('[STAGE 1: BUILDUP] Equalizing cryogenic chamber pressure...', 'verify');
    this.logConcordanceStream('[STAGE 1: BUILDUP] Aligning vacuum stasis conduit & collimator beam...', 'verify');

    let startTime = performance.now();
    const buildupDuration = 2000;

    const animateBuildup = (now) => {
      if (this.systemState !== 'BUILDUP') return;
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / buildupDuration);

      this.updateHUDPhase(`BUILDUP // CHARGING: ${(progress * 100).toFixed(0)}%`, 'buildup', progress * 100);

      if (progress < 1) {
        requestAnimationFrame(animateBuildup);
      } else {
        this.triggerBreakthrough();
      }
    };
    requestAnimationFrame(animateBuildup);
  }

  // -------------------------------------------------------------
  // STAGE 2: BREAKTHROUGH (Instantaneous Kinetic Event at t=2.0s)
  // -------------------------------------------------------------
  triggerBreakthrough() {
    if (this.systemState !== 'BUILDUP') return;
    this.systemState = 'BREAKTHROUGH';

    this.audio.playBreakthroughFlare();
    this.stasisAperture.classList.add('active');

    this.updateHUDPhase('BREAKTHROUGH // APERTURE OPENED', 'breakthrough', 100);
    this.logConcordanceStream('[STAGE 2: BREAKTHROUGH] Stasis iris blades opened! Conduit established.', 'locked');

    if (this.footerStatusMsg) {
      this.footerStatusMsg.textContent = 'STASIS CONDUIT ACTIVE // RETRIEVING MATERIALIZED CODEX';
    }

    setTimeout(() => {
      this.triggerSustainedActive();
    }, 400);
  }

  // -------------------------------------------------------------
  // STAGE 3: SUSTAINED ACTIVE (Record Materialized in Stasis Field)
  // -------------------------------------------------------------
  triggerSustainedActive() {
    if (this.systemState !== 'BREAKTHROUGH') return;
    this.systemState = 'SUSTAINED_ACTIVE';

    this.audio.setSustainedActive(true);
    this.updateHUDPhase('SUSTAINED ACTIVE // RECORD MATERIALIZED', 'sustained', 100);
    this.logConcordanceStream('[STAGE 3: ACTIVE] Luminous folio suspended in stasis field.', 'locked');
    this.logConcordanceStream('[STAGE 3: ACTIVE] Live provenance telemetry streaming nominal.', 'ready');

    this.actuatorSubtext.textContent = 'RETRIEVAL CONDUIT ENGAGED (ACTIVE)';

    // Update Hologram & Dossier
    if (this.activeRecord) {
      this.holoDocTitle.textContent = this.activeRecord.title.toUpperCase();
      this.holoDocGlyph.textContent = `◈ ${this.activeRecord.code} ◈`;
      this.populateDossier(this.activeRecord, true);
    } else {
      this.holoDocTitle.textContent = 'AUTHENTICATED FOLIO ACCESSION';
      this.holoDocGlyph.textContent = `◈ VALERIUS ${this.dialedDigits.join('-')} ◈`;
    }
  }

  // Disengage / Seal Vault (Always Reachable)
  handleDisengage(playSound = true) {
    this.cancelAutoDial();
    if (playSound) this.audio.playDisengageSound();
    this.audio.setSustainedActive(false);

    this.systemState = 'IDLE';
    this.dialedDigits = [];
    this.activeRecord = null;

    // Reset Aperture & HUD
    this.stasisAperture.classList.remove('active');
    this.updateHUDPhase('VAULT SEALED · IDLE', 'idle', 0);

    // Reset Slots
    this.taxonSlots.forEach((slot, idx) => {
      slot.classList.remove('active-slot', 'locked');
      slot.querySelector('.slot-value-display').textContent = '--';
      slot.querySelector('.slot-taxon-name').textContent = idx === 0 ? 'AWAITING' : '--';
      slot.querySelector('.slot-lock-indicator').textContent = 'UNLOCKED';
    });
    this.taxonSlots[0].classList.add('active-slot');

    // Reset Wheel Segments
    document.querySelectorAll('.radial-fin-segment').forEach(fin => {
      fin.classList.remove('aligned', 'locked');
    });

    // Reset Actuator Button
    this.btnRetrieveVault.disabled = true;
    this.btnRetrieveVault.classList.remove('ready-to-fire');
    this.actuatorSubtext.textContent = 'AWAITING 7-FACET CLASSIFICATION';

    // Reset Sequence Pill
    this.seqStatusPill.textContent = 'AWAITING FACET 1 OF 7';
    this.seqStatusPill.style.color = '';
    this.seqStatusPill.style.borderColor = '';

    // Reset Meters
    this.concConfidenceBar.style.width = '0%';
    this.concConfidenceText.textContent = '0.0%';

    // Reset Dossier
    this.dossierActiveView.classList.add('hidden');
    this.dossierIdleView.classList.remove('hidden');

    // Clear Presets Highlight
    document.querySelectorAll('.preset-card-btn').forEach(c => c.classList.remove('active'));

    if (this.footerStatusMsg) {
      this.footerStatusMsg.textContent = 'STASIS CONDUIT READY // VALERIUS CONCORDANCE ONLINE // 24 ACCESSIONS INDEXED';
    }

    this.logConcordanceStream('[DISENGAGE] Stasis iris sealed. Conduit de-energized. System ready.', 'ready');
  }

  // 13. Dossier Population
  populateDossier(record, isActiveMaterialization = false) {
    if (!record) return;

    this.dossierIdleView.classList.add('hidden');
    this.dossierActiveView.classList.remove('hidden');

    this.dosClassCode.textContent = record.code;
    this.dosCondition.textContent = record.condition || record.integrity || 'PRISTINE';
    this.dosTitle.textContent = record.title;
    this.dosOrigin.textContent = `ORIGIN: ${record.author || 'Unknown'} · ${record.epoch || ''}`;
    this.dosSector.textContent = record.sector || 'Sector 3 (Deep Vaults)';
    this.dosTier.textContent = record.stasisTier || 'Tier 04 · Pod 102';
    this.dosFormat.textContent = record.format || 'Photonic Stasis Core';
    this.dosLastRetrieved.textContent = record.lastRetrieved || 'Recent Accession';
    this.dosAbstract.textContent = record.abstract || 'Archived record cataloged under the Valerius Universal Taxonomic System.';
    this.dosCustodian.textContent = record.custodian || 'Valerius Archival Ministry';
  }

  // 14. UI Helpers
  updateHUDPhase(text, phaseClass, meterPercent) {
    if (this.hudPhaseLabel) {
      this.hudPhaseLabel.textContent = text;
      this.hudPhaseLabel.className = `hud-phase-label ${phaseClass}`;
    }
    if (this.hudPhaseFill) {
      this.hudPhaseFill.style.width = `${meterPercent}%`;
      if (phaseClass === 'error') {
        this.hudPhaseFill.style.backgroundColor = 'var(--crimson-alert)';
      } else if (phaseClass === 'pending') {
        this.hudPhaseFill.style.backgroundColor = 'var(--amber-accent)';
      } else {
        this.hudPhaseFill.style.backgroundColor = 'var(--phosphor-primary)';
      }
    }
  }

  logConcordanceStream(message, type = '') {
    if (!this.concordanceLogStream) return;
    const line = document.createElement('div');
    line.className = `stream-line ${type}`;
    line.textContent = message;
    this.concordanceLogStream.appendChild(line);
    this.concordanceLogStream.scrollTop = this.concordanceLogStream.scrollHeight;

    // Limit stream to 40 lines
    while (this.concordanceLogStream.children.length > 40) {
      this.concordanceLogStream.removeChild(this.concordanceLogStream.firstChild);
    }
  }
}

// ============================================================================
// 6. GLOBAL INITIALIZATION
// ============================================================================
window.addEventListener('DOMContentLoaded', () => {
  window.depositoryConsole = new BibliographicDepositoryConsole();
  console.log('[PBID-7] Pan-Harmonic Bibliographic Depository Console Initialized.');
});
