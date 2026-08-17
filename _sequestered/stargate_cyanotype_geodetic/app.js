/**
 * Vance & Sterling Geodetic Survey Bureau — Plate No. IV-B
 * Resonant Toroid Apparatus (Azimuth Transit Conduit)
 * Core Application Engine & Synthesized Drafting Audio
 */

(function () {
  'use strict';

  // --- 1. Master Configuration & Lore Constants ---
  const TOTAL_GLYPHS = 24;
  const TOTAL_NODES = 9;
  const REQUIRED_ADDRESS_LENGTH = 7;
  const NODE_ANGLE_STEP = 360 / TOTAL_NODES; // 40 degrees
  const GLYPH_ANGLE_STEP = 360 / TOTAL_GLYPHS; // 15 degrees

  // 24 Original Cartographic & Celestial Glyphs
  const GLYPH_CATALOG = [
    { id: 0, key: 'astrolabe', name: 'THE ASTROLABE (DATUM)', symbol: '✦', desc: 'Master Cartographic Datum' },
    { id: 1, key: 'lodestone', name: 'THE LODESTONE', symbol: '🧲', desc: 'Magnetic Telluric Node' },
    { id: 2, key: 'sextant', name: 'THE SEXTANT', symbol: '📐', desc: 'Angular Horizon Index' },
    { id: 3, key: 'zenith_meridian', name: 'THE ZENITH MERIDIAN', symbol: '☵', desc: 'Apex Celestial Vector' },
    { id: 4, key: 'auroral_arc', name: 'THE AURORAL ARC', symbol: '⌒', desc: 'Ionized Stratum Horizon' },
    { id: 5, key: 'boreas_vector', name: 'THE BOREAS VECTOR', symbol: '↑', desc: 'Polar Meridian Vector' },
    { id: 6, key: 'horizon_wedge', name: 'THE HORIZON WEDGE', symbol: '⊿', desc: 'Geodetic Baseline Offset' },
    { id: 7, key: 'caldera', name: 'THE CALDERA', symbol: '◎', desc: 'Sub-Volcanic Pressure Cell' },
    { id: 8, key: 'solstice_needle', name: 'THE SOLSTICE NEEDLE', symbol: '⌖', desc: 'Ecliptic Alignment Axis' },
    { id: 9, key: 'abyssal_spiral', name: 'THE ABYSSAL SPIRAL', symbol: '୭', desc: 'Bathymetric Gradient' },
    { id: 10, key: 'equinox_pylon', name: 'THE EQUINOX PYLON', symbol: '☲', desc: 'Equatorial Balance Datum' },
    { id: 11, key: 'gyroscope', name: 'THE GYROSCOPE', symbol: '⊕', desc: 'Inertial Torque Stator' },
    { id: 12, key: 'obsidian_prism', name: 'THE OBSIDIAN PRISM', symbol: '▲', desc: 'Refractive Flux Splitter' },
    { id: 13, key: 'tide_marker', name: 'THE TIDE MARKER', symbol: '♒', desc: 'Oceanic Harmonic Marker' },
    { id: 14, key: 'ley_compass', name: 'THE LEY COMPASS', symbol: '✧', desc: 'Sub-Lithic Flow Index' },
    { id: 15, key: 'geodetic_triad', name: 'THE GEODETIC TRIAD', symbol: '△', desc: 'Triangulation Base Arch' },
    { id: 16, key: 'chrono_pendulum', name: 'THE CHRONO-PENDULUM', symbol: '☍', desc: 'Isochronous Pulse Node' },
    { id: 17, key: 'polaris_index', name: 'THE POLARIS INDEX', symbol: '✵', desc: 'Axial True-North Anchor' },
    { id: 18, key: 'telluric_node', name: 'THE TELLURIC NODE', symbol: '☶', desc: 'Ground Resonance Tap' },
    { id: 19, key: 'vortex_caliper', name: 'THE VORTEX CALIPER', symbol: '⌘', desc: 'Curvature Metric Gauge' },
    { id: 20, key: 'quicksilver_basin', name: 'THE QUICKSILVER BASIN', symbol: '☿', desc: 'Hydrostatic Plane Level' },
    { id: 21, key: 'solar_plumb', name: 'THE SOLAR PLUMB', symbol: '☉', desc: 'Zenith Gravimetric Line' },
    { id: 22, key: 'aether_strut', name: 'THE AETHER STRUT', symbol: '☱', desc: 'Atmospheric Tension Rod' },
    { id: 23, key: 'meridian_ring', name: 'THE MERIDIAN RING', symbol: '◯', desc: 'Closure & Coordinate Seal' }
  ];

  // 9 Geodetic Node Names & Descriptions
  const NODE_NAMES = [
    'NODE α (0° APEX)',
    'NODE β (40° EAST)',
    'NODE γ (80° EAST-BY-SOUTH)',
    'NODE δ (120° SOUTH-EAST)',
    'NODE ε (160° SOUTH-BY-EAST)',
    'NODE ζ (200° SOUTH-BY-WEST)',
    'NODE η (240° SOUTH-WEST)',
    'NODE θ (280° WEST-BY-SOUTH)',
    'NODE ι (320° NORTH-WEST)'
  ];

  // 6 Pre-Approved Site Plan Archives (across 2 visual tiers)
  const SITE_PLANS = [
    {
      code: 'SITE 01-A',
      name: 'Gibraltar Sub-Oceanic Trench',
      tier: 'approved',
      sequence: [1, 0, 13, 7, 20, 5, 23]
    },
    {
      code: 'SITE 04-B',
      name: 'Ben Nevis Telluric Station',
      tier: 'approved',
      sequence: [17, 3, 8, 22, 10, 14, 23]
    },
    {
      code: 'SITE 07-C',
      name: 'Ceylon Equinoctial Baseline',
      tier: 'approved',
      sequence: [21, 6, 18, 16, 4, 11, 23]
    },
    {
      code: 'SITE 11-X',
      name: 'Mariana Abyssal Fracture',
      tier: 'restricted',
      sequence: [9, 12, 19, 7, 13, 20, 23]
    },
    {
      code: 'SITE 15-K',
      name: 'Atacama Sub-Lithic Vault',
      tier: 'restricted',
      sequence: [18, 8, 14, 6, 0, 5, 23]
    },
    {
      code: 'SITE 19-Z',
      name: 'Novaya Zemlya Static Node',
      tier: 'restricted',
      sequence: [4, 17, 11, 12, 22, 16, 23]
    }
  ];

  // --- 2. Application State ---
  const state = {
    currentGlyphIndex: 0,
    currentRingAngle: 0,
    lockedGlyphs: [], // Array of glyph objects currently scribed (up to 7)
    isHoldActive: false, // Review / Safety hold toggle
    isActive: false, // Whether the toroid conduit aperture is currently open
    isDialingSequence: false, // Quick-dial animation lock
    ambientTimer: null
  };

  // --- 3. Synthesized Web Audio API Sound Generator ---
  class DraftingAudioEngine {
    constructor() {
      this.ctx = null;
      this.isMuted = false;
    }

    init() {
      if (!this.ctx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          this.ctx = new AudioContextClass();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    // Realistic Graphite Lead Friction on Paper Tooth
    playPencilScribe() {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.25;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);

      // Generate pink/granular friction noise
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        output[i] = (b0 + b1 + b2 + white * 0.2) * (Math.sin((i / bufferSize) * Math.PI));
      }

      const noiseNode = this.ctx.createBufferSource();
      noiseNode.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2400, now);
      filter.frequency.linearRampToValueAtTime(1600, now + 0.25);
      filter.Q.setValueAtTime(3.5, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      noiseNode.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noiseNode.start(now);
      noiseNode.stop(now + 0.25);
    }

    // Heavy Rubber Platen & Turned-Wood Stamp Impact
    playStampThud() {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // Layer 1: Low frequency platen thud
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.18);

      const oscGain = this.ctx.createGain();
      oscGain.gain.setValueAtTime(0.7, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);

      // Layer 2: Wooden slap & mechanical spring clack
      const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.08, this.ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.015));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.Q.setValueAtTime(1.5, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.5, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(now);
      noise.stop(now + 0.08);
    }

    // Metallic Vernier Ratchet Click
    playVernierClick() {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(2800 + Math.random() * 400, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.03);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.03);
    }

    // Heavy Brass Caliper Node Clamp Lock
    playClampLock() {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      osc1.type = 'square';
      osc1.frequency.setValueAtTime(440, now);
      osc1.frequency.exponentialRampToValueAtTime(120, now + 0.12);

      const osc2 = this.ctx.createOscillator();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(880, now);
      osc2.frequency.exponentialRampToValueAtTime(220, now + 0.08);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.15);
      osc2.stop(now + 0.15);
    }

    // Parchment / Blueprint Paper Rustle
    playPaperRustle() {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.3;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(900, now);
      filter.frequency.linearRampToValueAtTime(1400, now + 0.15);
      filter.Q.setValueAtTime(1.8, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(now);
      noise.stop(now + 0.3);
    }
  }

  const audio = new DraftingAudioEngine();

  // --- 4. DOM Elements Cache ---
  const DOM = {
    stage: document.getElementById('drafting-table-stage'),
    cyanotypeSheet: document.getElementById('cyanotype-sheet'),
    rotatingArmature: document.getElementById('rotating-azimuth-armature'),
    azimuthGlyphsGroup: document.getElementById('azimuth-glyphs-group'),
    geodeticNodesLayer: document.getElementById('geodetic-nodes-layer'),
    redlineScribesLayer: document.getElementById('redline-scribes-layer'),
    irisBladesGroup: document.getElementById('iris-blades-group'),
    statorBolts: document.getElementById('stator-bolts'),
    
    // Cluster 1 Controls
    btnStepPrev: document.getElementById('btn-step-prev'),
    btnStepNext: document.getElementById('btn-step-next'),
    azimuthAngleReadout: document.getElementById('azimuth-angle-readout'),
    activeGlyphIcon: document.getElementById('active-glyph-icon'),
    activeGlyphName: document.getElementById('active-glyph-name'),
    
    // Cluster 2 Controls
    btnScribeLock: document.getElementById('btn-scribe-lock'),
    btnCertifyActivate: document.getElementById('btn-certify-activate'),
    certifyBtnSublabel: document.getElementById('certify-btn-sublabel'),
    btnDisengage: document.getElementById('btn-disengage'),
    btnPermitHold: document.getElementById('btn-permit-hold'),
    holdStatusIndicator: document.getElementById('hold-status-indicator'),
    btnToggleArchives: document.getElementById('btn-toggle-archives'),
    archivesPanel: document.getElementById('archives-panel'),
    sitePlanButtons: document.querySelectorAll('.site-plan-item'),
    
    // Monitoring & Status Displays
    nodeProgressCounter: document.getElementById('node-progress-counter'),
    addressSlotsContainer: document.getElementById('address-slots-container'),
    addressSlots: document.querySelectorAll('.address-slot'),
    titleBlockStatus: document.getElementById('title-block-status'),
    
    // Stamps & Canvas
    holdStampSeal: document.getElementById('hold-stamp-seal'),
    validatedStampSeal: document.getElementById('validated-stamp-seal'),
    conduitCanvas: document.getElementById('conduit-ink-canvas'),
    
    // Operator Reference Guide Modal
    btnOperatorManual: document.getElementById('btn-operator-manual'),
    operatorModal: document.getElementById('operator-modal'),
    btnCloseModal: document.getElementById('btn-close-modal')
  };

  // --- 5. Responsive Viewport Scaling Engine ---
  function updateViewportScale() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const scale = Math.min(vw / 1920, vh / 1080);
    document.documentElement.style.setProperty('--viewport-scale', scale.toFixed(4));
  }

  window.addEventListener('resize', updateViewportScale);
  updateViewportScale();

  // --- 6. SVG Technical Linework Generators ---
  
  // Render 36 Outer Stator Flange Assembly Bolts
  function renderStatorBolts() {
    if (!DOM.statorBolts) return;
    let boltsHtml = '';
    const cx = 350, cy = 350, r = 308;
    for (let i = 0; i < 36; i++) {
      const rad = (i * 10 * Math.PI) / 180;
      const bx = cx + r * Math.cos(rad);
      const by = cy + r * Math.sin(rad);
      boltsHtml += `
        <circle cx="${bx.toFixed(2)}" cy="${by.toFixed(2)}" r="3" />
        <line x1="${(bx - 2).toFixed(2)}" y1="${by.toFixed(2)}" x2="${(bx + 2).toFixed(2)}" y2="${by.toFixed(2)}" stroke-width="0.6"/>
      `;
    }
    DOM.statorBolts.innerHTML = boltsHtml;
  }

  // Render 12 Mechanical Aperture Iris Diaphragm Blades
  function renderIrisBlades() {
    if (!DOM.irisBladesGroup) return;
    let bladesHtml = '';
    const cx = 350, cy = 350;
    for (let i = 0; i < 12; i++) {
      const angle = i * 30;
      bladesHtml += `
        <path d="M 350,155 A 195 195 0 0 1 475,225 L 350,350 Z" 
              transform="rotate(${angle} ${cx} ${cy})" 
              fill="rgba(14, 40, 70, 0.45)" />
        <line x1="350" y1="155" x2="350" y2="350" 
              transform="rotate(${angle} ${cx} ${cy})" />
      `;
    }
    DOM.irisBladesGroup.innerHTML = bladesHtml;
  }

  // Render 9 Geodetic Node Pins on the Stator (Nonagonal Placement)
  function renderGeodeticNodes() {
    if (!DOM.geodeticNodesLayer) return;
    let nodesHtml = '';
    const cx = 350, cy = 350, r = 260;

    for (let i = 0; i < TOTAL_NODES; i++) {
      const deg = i * NODE_ANGLE_STEP;
      const rad = ((deg - 90) * Math.PI) / 180;
      const nx = cx + r * Math.cos(rad);
      const ny = cy + r * Math.sin(rad);

      // Greek numeral labels
      const greekLetter = ['α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'ι'][i];

      nodesHtml += `
        <g id="node-marker-${i}" class="geodetic-node-marker" data-node-idx="${i}">
          <!-- Radial Stator Anchor Leader -->
          <line x1="${cx}" y1="${cy}" x2="${nx.toFixed(2)}" y2="${ny.toFixed(2)}" stroke="rgba(165, 216, 247, 0.25)" stroke-width="0.75" stroke-dasharray="3 3"/>
          
          <!-- Outer Anchor Pad -->
          <circle cx="${nx.toFixed(2)}" cy="${ny.toFixed(2)}" r="14" fill="rgba(8, 22, 38, 0.9)" stroke="rgba(215, 240, 255, 0.8)" stroke-width="1.2"/>
          <circle cx="${nx.toFixed(2)}" cy="${ny.toFixed(2)}" r="9" fill="rgba(14, 38, 66, 0.9)" stroke="rgba(215, 240, 255, 0.5)" stroke-width="0.8"/>
          <circle cx="${nx.toFixed(2)}" cy="${ny.toFixed(2)}" r="4.5" class="node-core" fill="rgba(215, 240, 255, 0.4)" stroke="rgba(215, 240, 255, 0.9)" stroke-width="1"/>
          
          <!-- Node Label -->
          <text x="${nx.toFixed(2)}" y="${(ny + 3).toFixed(2)}" class="node-label" font-family="'Space Mono', monospace" font-size="7.5" fill="rgba(215, 240, 255, 0.8)" text-anchor="middle">${greekLetter}</text>
        </g>
      `;
    }
    DOM.geodeticNodesLayer.innerHTML = nodesHtml;
  }

  // Render 24 Astrometric Glyphs around the Rotating Azimuth Ring
  function renderAzimuthGlyphs() {
    if (!DOM.azimuthGlyphsGroup) return;
    let glyphsHtml = '';
    const cx = 350, cy = 350, r = 218;

    for (let i = 0; i < TOTAL_GLYPHS; i++) {
      const glyph = GLYPH_CATALOG[i];
      const deg = i * GLYPH_ANGLE_STEP;
      const rad = ((deg - 90) * Math.PI) / 180;
      const gx = cx + r * Math.cos(rad);
      const gy = cy + r * Math.sin(rad);

      glyphsHtml += `
        <g class="glyph-node-item ${i === 0 ? 'active-indexed' : ''}" 
           id="glyph-node-${i}" 
           data-glyph-index="${i}"
           transform="rotate(${deg} ${cx} ${cy})">
          
          <!-- Radial Index Tick -->
          <line x1="350" y1="115" x2="350" y2="128" stroke="rgba(215, 240, 255, 0.9)" stroke-width="1"/>
          <line x1="350" y1="128" x2="350" y2="140" stroke="rgba(215, 240, 255, 0.4)" stroke-width="0.5" stroke-dasharray="2 2"/>
          
          <!-- Glyph Station Circle -->
          <circle cx="350" cy="148" r="10" fill="rgba(8, 22, 38, 0.85)" stroke="rgba(215, 240, 255, 0.7)" stroke-width="1"/>
          <text x="350" y="152" font-family="'Cinzel', serif" font-size="9" fill="rgba(240, 250, 255, 0.95)" text-anchor="middle" font-weight="bold">${glyph.symbol}</text>
          
          <!-- Degree Marker -->
          <text x="350" y="165" font-family="'Space Mono', monospace" font-size="5.5" fill="rgba(165, 216, 247, 0.7)" text-anchor="middle">${deg}°</text>
        </g>
      `;
    }
    DOM.azimuthGlyphsGroup.innerHTML = glyphsHtml;

    // Attach click listeners to glyph nodes for direct azimuth rotation
    const glyphNodes = DOM.azimuthGlyphsGroup.querySelectorAll('.glyph-node-item');
    glyphNodes.forEach(node => {
      node.addEventListener('click', (e) => {
        const index = parseInt(node.getAttribute('data-glyph-index'), 10);
        rotateToGlyphIndex(index);
      });
    });
  }

  // --- 7. Azimuth Ring Rotation & Index Alignment ---
  function rotateToGlyphIndex(targetIndex, force = false) {
    if (state.isDialingSequence && !force) return;
    
    // Normalize target index within 0..23
    targetIndex = (targetIndex + TOTAL_GLYPHS) % TOTAL_GLYPHS;
    state.currentGlyphIndex = targetIndex;

    // Calculate rotation angle to align target glyph with 0° apex vernier datum
    // Glyph i is at angle i * 15°. To bring it to apex (0°), ring must rotate by - (i * 15°)
    const targetAngle = -targetIndex * GLYPH_ANGLE_STEP;
    state.currentRingAngle = targetAngle;

    DOM.rotatingArmature.style.transform = `rotate(${targetAngle}deg)`;

    // Update active class on glyph elements
    const allGlyphs = DOM.azimuthGlyphsGroup.querySelectorAll('.glyph-node-item');
    allGlyphs.forEach((el, idx) => {
      if (idx === targetIndex) {
        el.classList.add('active-indexed');
      } else {
        el.classList.remove('active-indexed');
      }
    });

    // Update readout display
    const glyph = GLYPH_CATALOG[targetIndex];
    const degStr = String(targetIndex * 15).padStart(3, '0');
    DOM.azimuthAngleReadout.textContent = `${degStr}° 00' 00"`;
    DOM.activeGlyphIcon.textContent = glyph.symbol;
    DOM.activeGlyphName.textContent = glyph.name;

    audio.playVernierClick();
  }

  // Step Controls (◄ / ►)
  DOM.btnStepPrev.addEventListener('click', () => {
    rotateToGlyphIndex(state.currentGlyphIndex - 1);
  });

  DOM.btnStepNext.addEventListener('click', () => {
    rotateToGlyphIndex(state.currentGlyphIndex + 1);
  });

  // --- 8. Locking Mechanism (Scribe & Lock Action) ---
  function scribeCurrentGlyph(force = false) {
    if (state.isDialingSequence && !force) return;
    if (state.lockedGlyphs.length >= REQUIRED_ADDRESS_LENGTH) {
      // Already fully locked
      return;
    }

    const currentGlyph = GLYPH_CATALOG[state.currentGlyphIndex];
    const lockSlotIndex = state.lockedGlyphs.length;
    state.lockedGlyphs.push(currentGlyph);

    // Audio Feedback: Graphite lead scratch + metal clamp click
    audio.playPencilScribe();
    setTimeout(() => audio.playClampLock(), 120);

    // Update Geodetic Node on SVG (Node lockSlotIndex)
    const nodeEl = document.getElementById(`node-marker-${lockSlotIndex}`);
    if (nodeEl) {
      nodeEl.classList.add('node-locked');
    }

    // Scribe Redline Annotation on Blueprint
    drawRedlineScribe(lockSlotIndex, currentGlyph);

    // Update Address Monitor Tape Slot & Certify Button state (DO NOT auto-activate!)
    updateAddressSlots();
  }

  // Draw authentic redline grease-pencil checkmarks & dimension arcs onto the blueprint
  function drawRedlineScribe(nodeIndex, glyph) {
    if (!DOM.redlineScribesLayer) return;

    const cx = 350, cy = 350, r = 260;
    const deg = nodeIndex * NODE_ANGLE_STEP;
    const rad = ((deg - 90) * Math.PI) / 180;
    const nx = cx + r * Math.cos(rad);
    const ny = cy + r * Math.sin(rad);

    // Checkmark offset coordinates
    const p1x = nx - 8, p1y = ny - 2;
    const p2x = nx - 2, p2y = ny + 7;
    const p3x = nx + 10, p3y = ny - 9;

    const scribeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    scribeGroup.id = `redline-scribe-${nodeIndex}`;

    // Grease-pencil checkmark path
    const checkPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    checkPath.setAttribute('d', `M ${p1x.toFixed(1)},${p1y.toFixed(1)} L ${p2x.toFixed(1)},${p2y.toFixed(1)} L ${p3x.toFixed(1)},${p3y.toFixed(1)}`);
    checkPath.setAttribute('class', 'redline-scribe-path');

    // Dimension leader arc to center aperture
    const arcPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const midX = (cx + nx) / 2 + (Math.random() * 10 - 5);
    const midY = (cy + ny) / 2 + (Math.random() * 10 - 5);
    arcPath.setAttribute('d', `M ${nx.toFixed(1)},${ny.toFixed(1)} Q ${midX.toFixed(1)},${midY.toFixed(1)} ${cx},${cy}`);
    arcPath.setAttribute('fill', 'none');
    arcPath.setAttribute('stroke', 'rgba(220, 38, 38, 0.45)');
    arcPath.setAttribute('stroke-width', '0.8');
    arcPath.setAttribute('stroke-dasharray', '4 3');

    // Redline stamped text callout
    const calloutText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    const textOffsetRad = rad + 0.12;
    const tx = cx + (r + 28) * Math.cos(textOffsetRad);
    const ty = cy + (r + 28) * Math.sin(textOffsetRad);
    calloutText.setAttribute('x', tx.toFixed(1));
    calloutText.setAttribute('y', ty.toFixed(1));
    calloutText.setAttribute('class', 'redline-scribe-text');
    calloutText.setAttribute('text-anchor', 'middle');
    calloutText.textContent = `[REV. LOCK: ${glyph.key.toUpperCase()}]`;

    scribeGroup.appendChild(arcPath);
    scribeGroup.appendChild(checkPath);
    scribeGroup.appendChild(calloutText);
    DOM.redlineScribesLayer.appendChild(scribeGroup);
  }

  // Update Address Monitor Tape UI & Activation Control Status
  function updateAddressSlots() {
    DOM.nodeProgressCounter.textContent = `${state.lockedGlyphs.length} / ${REQUIRED_ADDRESS_LENGTH} NODES LOCKED`;

    DOM.addressSlots.forEach((slot, idx) => {
      const valEl = slot.querySelector('.slot-val');
      if (idx < state.lockedGlyphs.length) {
        slot.classList.add('locked');
        valEl.textContent = state.lockedGlyphs[idx].symbol;
        slot.title = `Node ${idx + 1}: ${state.lockedGlyphs[idx].name}`;
      } else {
        slot.classList.remove('locked');
        valEl.textContent = '---';
        slot.title = `Node ${idx + 1}: Unscribed`;
      }
    });

    // Update Certify & Commit Activation Button and Title Block Status
    if (state.lockedGlyphs.length === 0) {
      DOM.titleBlockStatus.textContent = 'IDLE · FIELD SURVEY PENDING';
      if (DOM.btnCertifyActivate) {
        DOM.btnCertifyActivate.disabled = true;
        DOM.certifyBtnSublabel.textContent = 'REQUIRES 7 SCRIBED NODES';
      }
    } else if (state.lockedGlyphs.length < REQUIRED_ADDRESS_LENGTH) {
      DOM.titleBlockStatus.textContent = `SCRIBING · NODE ${state.lockedGlyphs.length} OF 7 LOCKED`;
      if (DOM.btnCertifyActivate) {
        DOM.btnCertifyActivate.disabled = true;
        DOM.certifyBtnSublabel.textContent = `${state.lockedGlyphs.length} / 7 NODES LOCKED`;
      }
    } else if (state.lockedGlyphs.length === REQUIRED_ADDRESS_LENGTH) {
      if (!state.isActive) {
        DOM.titleBlockStatus.textContent = 'COORDINATES LOCKED · PENDING OPERATOR CERTIFICATION';
        if (DOM.btnCertifyActivate) {
          DOM.btnCertifyActivate.disabled = false;
          DOM.certifyBtnSublabel.textContent = 'READY · CLICK TO COMMIT CONDUIT';
        }
      } else {
        DOM.titleBlockStatus.textContent = 'CONDUIT ACTIVE · APERTURE RESONATING';
        if (DOM.btnCertifyActivate) {
          DOM.btnCertifyActivate.disabled = true;
          DOM.certifyBtnSublabel.textContent = 'CONDUIT ACTIVE';
        }
      }
    }
  }

  // --- 9. Final Activation & Technical Ink Vortex Canvas (TRIGGERED ONLY VIA CERTIFY BUTTON) ---
  function activateConduit() {
    if (state.lockedGlyphs.length !== REQUIRED_ADDRESS_LENGTH || state.isActive) {
      return;
    }

    if (state.isHoldActive) {
      // Activation inhibited by Field Permit Hold
      DOM.titleBlockStatus.textContent = 'ACTIVATION INHIBITED: STRUCTURAL HOLD ACTIVE';
      audio.playClampLock();
      return;
    }

    // Land Inspector Validation Stamp
    DOM.validatedStampSeal.classList.remove('hidden');
    audio.playStampThud();

    // Set Active State
    state.isActive = true;
    DOM.titleBlockStatus.textContent = 'CONDUIT ACTIVE · APERTURE RESONATING';

    if (DOM.btnCertifyActivate) {
      DOM.btnCertifyActivate.disabled = true;
      DOM.certifyBtnSublabel.textContent = 'CONDUIT ACTIVE';
    }

    // Start Pure Technical Cyanotype Canvas Animation
    startConduitAnimation();
  }

  // Dynamic Technical Cyanotype Gateway Animation (Pure Drafting Linework - Zero Digital Glow)
  let animFrameId = null;
  let animAngle = 0;
  let particles = [];

  function initParticles() {
    particles = [];
    for (let i = 0; i < 45; i++) {
      particles.push({
        r: Math.random() * 180 + 10,
        theta: Math.random() * Math.PI * 2,
        speed: (Math.random() * 0.02 + 0.008) * (Math.random() > 0.5 ? 1 : -1),
        radialSpeed: Math.random() * 0.4 + 0.2,
        length: Math.random() * 8 + 4,
        size: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.7 + 0.3
      });
    }
  }

  function startConduitAnimation() {
    if (!DOM.conduitCanvas) return;
    initParticles();
    const ctx = DOM.conduitCanvas.getContext('2d');
    const width = DOM.conduitCanvas.width;
    const height = DOM.conduitCanvas.height;
    const cx = width / 2;
    const cy = height / 2;

    function renderFrame() {
      if (!state.isActive) {
        ctx.clearRect(0, 0, width, height);
        return;
      }

      ctx.clearRect(0, 0, width, height);
      animAngle += 0.015;

      // 1. Draw 32-Point Rotating Compass Rose Linework (Pale Cyan & White Ink)
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(animAngle * 0.5);

      ctx.strokeStyle = 'rgba(165, 216, 247, 0.45)';
      ctx.lineWidth = 0.8;
      for (let i = 0; i < 32; i++) {
        const rad = (i * Math.PI) / 16;
        const len = (i % 4 === 0) ? 185 : (i % 2 === 0 ? 140 : 100);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(len * Math.cos(rad), len * Math.sin(rad));
        ctx.stroke();
      }
      ctx.restore();

      // 2. Draw Dynamic Counter-Rotating Logarithmic Drafting Spirals
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-animAngle * 0.8);
      ctx.strokeStyle = 'rgba(240, 249, 255, 0.75)';
      ctx.lineWidth = 1.2;

      for (let s = 0; s < 4; s++) {
        const offset = (s * Math.PI) / 2;
        ctx.beginPath();
        for (let t = 0; t < 120; t++) {
          const theta = t * 0.08 + offset;
          const r = Math.pow(1.035, t) * 2.5;
          if (r > 190) break;
          const x = r * Math.cos(theta);
          const y = r * Math.sin(theta);
          if (t === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.restore();

      // 3. Draw Concentric Harmonic Calibration Rings
      ctx.save();
      ctx.translate(cx, cy);
      for (let cr = 30; cr <= 180; cr += 30) {
        const pulse = Math.sin(animAngle * 3 + cr) * 2;
        ctx.beginPath();
        ctx.arc(0, 0, cr + pulse, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(165, 216, 247, 0.35)';
        ctx.lineWidth = 0.75;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();

      // 4. Draw Orbiting Cyanotype Drafting Pigment Particles
      ctx.save();
      ctx.translate(cx, cy);
      particles.forEach(p => {
        p.theta += p.speed;
        p.r += p.radialSpeed;
        if (p.r > 190) p.r = 15;

        const px = p.r * Math.cos(p.theta);
        const py = p.r * Math.sin(p.theta);
        const tx = (p.r - p.length) * Math.cos(p.theta - p.speed * 2);
        const ty = (p.r - p.length) * Math.sin(p.theta - p.speed * 2);

        ctx.strokeStyle = `rgba(240, 249, 255, ${p.opacity})`;
        ctx.lineWidth = p.size;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(px, py);
        ctx.stroke();
      });
      ctx.restore();

      animFrameId = requestAnimationFrame(renderFrame);
    }

    if (animFrameId) cancelAnimationFrame(animFrameId);
    animFrameId = requestAnimationFrame(renderFrame);
  }

  function stopConduitAnimation() {
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
    if (DOM.conduitCanvas) {
      const ctx = DOM.conduitCanvas.getContext('2d');
      ctx.clearRect(0, 0, DOM.conduitCanvas.width, DOM.conduitCanvas.height);
    }
  }

  // --- 10. Disengage / Expunge Draft Mechanism ---
  function disengageApparatus() {
    // Release all locks and reset states
    state.lockedGlyphs = [];
    state.isActive = false;
    state.isDialingSequence = false;

    // Clear dynamic redline scribes from SVG
    if (DOM.redlineScribesLayer) {
      DOM.redlineScribesLayer.innerHTML = '';
    }

    // Reset node marker visual classes
    const nodeMarkers = DOM.geodeticNodesLayer.querySelectorAll('.geodetic-node-marker');
    nodeMarkers.forEach(node => node.classList.remove('node-locked'));

    // Reset Address Monitor Slots
    updateAddressSlots();

    // Hide validation stamp
    DOM.validatedStampSeal.classList.add('hidden');

    // Stop canvas animation
    stopConduitAnimation();

    // Reset Azimuth Armature to 0° Datum
    rotateToGlyphIndex(0);

    // Audio Feedback
    audio.playPaperRustle();
    setTimeout(() => audio.playStampThud(), 100);

    // Update Status
    DOM.titleBlockStatus.textContent = 'IDLE · DRAFT EXPUNGED';
  }

  // --- 11. Safety Review / Field Permit Hold Toggle ---
  function togglePermitHold() {
    state.isHoldActive = !state.isHoldActive;
    DOM.btnPermitHold.setAttribute('aria-pressed', state.isHoldActive ? 'true' : 'false');

    if (state.isHoldActive) {
      DOM.holdStampSeal.classList.remove('hidden');
      DOM.holdStatusIndicator.textContent = 'PERMIT STATUS: STRUCTURAL HOLD ACTIVE';
      DOM.holdStatusIndicator.style.color = '#fca5a5';
      audio.playStampThud();

      if (state.isActive) {
        state.isActive = false;
        stopConduitAnimation();
        DOM.validatedStampSeal.classList.add('hidden');
        DOM.titleBlockStatus.textContent = 'CONDUIT SUSPENDED: REVIEW HOLD ACTIVE';
        if (DOM.btnCertifyActivate && state.lockedGlyphs.length === REQUIRED_ADDRESS_LENGTH) {
          DOM.btnCertifyActivate.disabled = false;
          DOM.certifyBtnSublabel.textContent = 'READY · CLICK TO COMMIT CONDUIT';
        }
      }
    } else {
      DOM.holdStampSeal.classList.add('hidden');
      DOM.holdStatusIndicator.textContent = 'PERMIT STATUS: UNRESTRICTED';
      DOM.holdStatusIndicator.style.color = '';
      audio.playPaperRustle();

      // DO NOT auto-activate when hold is released!
      // If all 7 nodes are already locked and inactive, simply ensure button is enabled for deliberate activation.
      if (state.lockedGlyphs.length === REQUIRED_ADDRESS_LENGTH && !state.isActive) {
        DOM.titleBlockStatus.textContent = 'COORDINATES LOCKED · PENDING OPERATOR CERTIFICATION';
        if (DOM.btnCertifyActivate) {
          DOM.btnCertifyActivate.disabled = false;
          DOM.certifyBtnSublabel.textContent = 'READY · CLICK TO COMMIT CONDUIT';
        }
      }
    }
  }

  // --- 12. Preloaded Site Plan Archives Dialing Sequence ---
  function dialSitePlan(siteIndex) {
    if (state.isDialingSequence) return;
    const plan = SITE_PLANS[siteIndex];
    if (!plan) return;

    // First disengage current draft cleanly
    disengageApparatus();
    state.isDialingSequence = true;

    // Close archive panel
    DOM.archivesPanel.classList.remove('open');
    DOM.btnToggleArchives.setAttribute('aria-expanded', 'false');

    DOM.titleBlockStatus.textContent = `LOADING ARCHIVE: ${plan.code} (${plan.name})`;

    // Sequence through each glyph in the plan
    let step = 0;
    function executeNextStep() {
      if (step >= plan.sequence.length) {
        state.isDialingSequence = false;
        // Update slots & enable Certify button (DO NOT auto-activate!)
        updateAddressSlots();
        return;
      }

      const glyphIndex = plan.sequence[step];
      rotateToGlyphIndex(glyphIndex, true);

      setTimeout(() => {
        scribeCurrentGlyph(true);
        step++;
        setTimeout(executeNextStep, 260);
      }, 180);
    }

    setTimeout(executeNextStep, 150);
  }

  // --- 13. Event Listeners Wiring ---

  // Scribe & Lock Button
  DOM.btnScribeLock.addEventListener('click', () => {
    scribeCurrentGlyph();
  });

  // Validate & Commit Button (Deliberate Final Activation Action)
  DOM.btnCertifyActivate.addEventListener('click', () => {
    activateConduit();
  });

  // Disengage Button (Hard Requirement: Always Accessible)
  DOM.btnDisengage.addEventListener('click', () => {
    disengageApparatus();
  });

  // Permit Hold Button
  DOM.btnPermitHold.addEventListener('click', () => {
    togglePermitHold();
  });

  // Toggle Archives Drawer
  DOM.btnToggleArchives.addEventListener('click', () => {
    const isOpen = DOM.archivesPanel.classList.toggle('open');
    DOM.btnToggleArchives.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    audio.playPaperRustle();
  });

  // Site Plan Buttons
  DOM.sitePlanButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-site-index'), 10);
      dialSitePlan(idx);
    });
  });

  // Operator Reference Manual Modal (?)
  DOM.btnOperatorManual.addEventListener('click', () => {
    DOM.operatorModal.classList.remove('hidden');
    audio.playPaperRustle();
  });

  DOM.btnCloseModal.addEventListener('click', () => {
    DOM.operatorModal.classList.add('hidden');
    audio.playPaperRustle();
  });

  DOM.operatorModal.addEventListener('click', (e) => {
    if (e.target === DOM.operatorModal) {
      DOM.operatorModal.classList.add('hidden');
      audio.playPaperRustle();
    }
  });

  // Keyboard Shortcuts for Rapid Drafting Testing
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      rotateToGlyphIndex(state.currentGlyphIndex - 1);
    } else if (e.key === 'ArrowRight') {
      rotateToGlyphIndex(state.currentGlyphIndex + 1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      if (document.activeElement === document.body || document.activeElement === DOM.stage) {
        e.preventDefault();
        scribeCurrentGlyph();
      }
    } else if (e.key === 'Escape') {
      if (!DOM.operatorModal.classList.contains('hidden')) {
        DOM.operatorModal.classList.add('hidden');
      } else {
        disengageApparatus();
      }
    }
  });

  // --- 14. Initialization ---
  function init() {
    renderStatorBolts();
    renderIrisBlades();
    renderGeodeticNodes();
    renderAzimuthGlyphs();
    updateAddressSlots();
    rotateToGlyphIndex(0);
    console.log('Vance & Sterling Geodetic Draughting Engine v1.0.0 initialized.');
  }

  // Run init on DOMContentLoaded or immediate if already ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
