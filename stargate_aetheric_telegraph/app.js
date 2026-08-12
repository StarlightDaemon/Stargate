/**
 * HM Imperial Aetheric Telegraph & Pneumatic Dispatch Registry
 * Core Application Controller & Interactive Schematic Engine
 */

import { MERIDIAN_GLYPHS, ESCAPEMENT_NODES, QUICK_DIAL_ENTRIES } from './glyphs.js';
import { soundEngine } from './audio.js';

// Application State Machine
const AppState = {
  IDLE: 'IDLE',
  DIALING: 'DIALING',
  STAGED: 'STAGED',
  IGNITING: 'IGNITING',
  ACTIVE: 'ACTIVE'
};

class StargateAethericTerminal {
  constructor() {
    this.state = AppState.IDLE;
    this.stagedGlyphs = [];
    this.lockedEscapements = new Set();
    this.isSafetyHoldEngaged = true; // Review/Safety Hold default engaged
    this.ringRotationAngle = 0;
    this.activeConduit = null;
    this.currentTierFilter = 'all';

    // Telemetry Gauges Values
    this.currentPressure = 29.92;
    this.targetPressure = 29.92;
    this.currentVoltage = 2400;
    this.targetVoltage = 2400;
    this.currentHertz = 60.00;

    // Animation & Canvas properties
    this.vortexCanvas = null;
    this.vortexCtx = null;
    this.vortexParticles = [];
    this.streamlines = [];
    this.flyballAngle = 0;
    this.flyballSpeed = 0.02;
    this.animFrameId = null;

    this.init();
  }

  init() {
    this.cacheDomElements();
    this.initScaling();
    this.buildOuterRingDegreeTicks();
    this.buildDifferentialGlyphStations();
    this.buildMeridianEscapements();
    this.buildGlyphMatrix();
    this.renderQuickDialList();
    this.populateManualCodex();
    this.bindEvents();
    this.initVortexCanvas();
    this.startMainAnimationLoop();
    this.startTelemetryClock();

    this.logTelemetry("Meridian Escapements ready. Operator clearance confirmed at Terminal VIII-B.");
  }

  cacheDomElements() {
    this.appScaler = document.getElementById('app-scaler');
    this.clockEl = document.getElementById('telemetry-clock');
    this.pressureEl = document.getElementById('telemetry-pressure');
    this.voltageEl = document.getElementById('telemetry-voltage');
    this.fluxEl = document.getElementById('telemetry-flux');
    this.muteToggleBtn = document.getElementById('audio-mute-toggle');
    this.muteStatusText = document.getElementById('mute-status-text');

    this.manualOpenBtn = document.getElementById('manual-modal-open-btn');
    this.manualCloseBtn = document.getElementById('manual-modal-close-btn');
    this.manualModalBackdrop = document.getElementById('manual-modal-backdrop');

    this.quickDialListEl = document.getElementById('quick-dial-list');
    this.tabFilterAll = document.getElementById('tab-filter-all');
    this.tabFilterTier1 = document.getElementById('tab-filter-tier1');
    this.tabFilterTier2 = document.getElementById('tab-filter-tier2');

    this.mercuryBarEl = document.getElementById('mercury-bar-level');
    this.galvanicNeedleEl = document.getElementById('galvanic-needle');
    this.galvanicReadoutEl = document.getElementById('galvanic-readout-text');
    this.hertzDisplayEl = document.getElementById('hertz-display');

    this.sequenceSlotsContainer = document.getElementById('sequence-slots-container');
    this.sequenceSlotEls = document.querySelectorAll('.sequence-slot');
    this.rotatingRingEl = document.getElementById('rotating-differential-ring');
    this.ringStatusDot = document.getElementById('ring-status-dot');
    this.ringStatusText = document.getElementById('ring-status-text');
    this.ringActiveLockCount = document.getElementById('ring-active-lock-count');

    this.glyphMatrixContainer = document.getElementById('glyph-matrix-container');
    this.safetyHoldToggleBtn = document.getElementById('safety-hold-toggle-btn');
    this.interlockStatusDesc = document.getElementById('interlock-status-desc');
    this.dispatchThrottleBtn = document.getElementById('dispatch-throttle-btn');
    this.throttleBtnLabel = document.getElementById('throttle-btn-label');
    this.emergencyVentBtn = document.getElementById('emergency-vent-btn');
    this.clearStagedBtn = document.getElementById('clear-staged-btn');
    this.tickerLogBox = document.getElementById('ticker-log-box');
  }

  // =========================================================================
  // VIEWPORT RESIZING & CSS SCALE FIX
  // =========================================================================
  initScaling() {
    const updateScale = () => {
      const scaleX = window.innerWidth / 1920;
      const scaleY = window.innerHeight / 1080;
      const scale = Math.min(scaleX, scaleY);
      // Assign unitless number to CSS custom property
      document.documentElement.style.setProperty('--ui-scale', scale);
    };

    window.addEventListener('resize', updateScale);
    updateScale();
  }

  // =========================================================================
  // SCHEMATIC SVG RING GENERATION
  // =========================================================================
  buildOuterRingDegreeTicks() {
    const ticksGroup = document.getElementById('outer-degree-ticks');
    if (!ticksGroup) return;

    let html = '';
    const cx = 320, cy = 320;

    for (let deg = 0; deg < 360; deg += 2) {
      const rad = (deg * Math.PI) / 180;
      const isMajor = deg % 10 === 0;
      const isCardinal = deg % 90 === 0;
      const rInner = isCardinal ? 276 : (isMajor ? 282 : 288);
      const rOuter = 296;

      const x1 = cx + rInner * Math.sin(rad);
      const y1 = cy - rInner * Math.cos(rad);
      const x2 = cx + rOuter * Math.sin(rad);
      const y2 = cy - rOuter * Math.cos(rad);

      const strokeColor = isCardinal ? '#ffc107' : (isMajor ? '#e28743' : '#3b4e6b');
      const strokeWidth = isCardinal ? 2 : (isMajor ? 1.5 : 0.75);

      html += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>`;

      if (isMajor && deg % 30 === 0) {
        const textR = 304;
        const tx = cx + textR * Math.sin(rad);
        const ty = cy - textR * Math.cos(rad);
        html += `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" fill="#9c8e76" font-family="'JetBrains Mono'" font-size="7" text-anchor="middle" dominant-baseline="middle">${deg}°</text>`;
      }
    }
    ticksGroup.innerHTML = html;
  }

  buildDifferentialGlyphStations() {
    const stationsGroup = document.getElementById('differential-glyph-stations');
    if (!stationsGroup) return;

    const cx = 320, cy = 320;
    const rRadius = 205; // Placed inside the differential ring
    let html = '';

    MERIDIAN_GLYPHS.forEach((glyph, idx) => {
      const angleDeg = (idx * 360) / 16;
      const rad = (angleDeg * Math.PI) / 180;
      const gx = cx + rRadius * Math.sin(rad);
      const gy = cy - rRadius * Math.cos(rad);

      // Station frame with radial sector lines
      html += `
        <g class="differential-station-node" transform="translate(${gx}, ${gy}) rotate(${angleDeg})">
          <circle cx="0" cy="0" r="16" fill="rgba(16, 21, 31, 0.9)" stroke="#3b4e6b" stroke-width="1.2"/>
          <circle cx="0" cy="0" r="18" fill="none" stroke="#243042" stroke-width="1" stroke-dasharray="2 2"/>
          <g transform="translate(-11, -11) scale(0.22)" color="#e8d8b8">
            ${glyph.svg}
          </g>
          <text x="0" y="24" fill="#9c8e76" font-family="'JetBrains Mono'" font-size="5.5" text-anchor="middle">${glyph.code}</text>
        </g>
      `;
    });

    stationsGroup.innerHTML = html;
  }

  buildMeridianEscapements() {
    const escapementGroup = document.getElementById('meridian-escapements-group');
    if (!escapementGroup) return;

    const cx = 320, cy = 320;
    let html = '';

    ESCAPEMENT_NODES.forEach((node) => {
      const angleDeg = node.angle;
      const rad = (angleDeg * Math.PI) / 180;

      const rNode = 250;
      const nx = cx + rNode * Math.sin(rad);
      const ny = cy - rNode * Math.cos(rad);

      const rNeedleTip = 160;
      const ntx = cx + rNeedleTip * Math.sin(rad);
      const nty = cy - rNeedleTip * Math.cos(rad);

      html += `
        <g id="escapement-node-${node.id}" class="escapement-node-group" data-node-id="${node.id}">
          <!-- Escapement Radial Guideline -->
          <line x1="${cx}" y1="${cy}" x2="${nx}" y2="${ny}" stroke="#243042" stroke-width="1" stroke-dasharray="3 3"/>
          
          <!-- Escapement Outer Bracket -->
          <circle cx="${nx}" cy="${ny}" r="11" fill="rgba(7, 9, 14, 0.9)" stroke="#3b4e6b" stroke-width="1.5"/>
          <circle id="escapement-lamp-${node.id}" class="escapement-lamp" cx="${nx}" cy="${ny}" r="5" fill="#5e5443"/>
          
          <!-- Escapement Needle Indicator -->
          <line id="escapement-needle-${node.id}" class="escapement-needle" x1="${nx}" y1="${ny}" x2="${ntx}" y2="${nty}" stroke="#79441c" stroke-width="2" stroke-linecap="round"/>
          
          <!-- Escapement Roman Numeral Label -->
          <text x="${nx}" y="${ny + (angleDeg > 90 && angleDeg < 270 ? -14 : 16)}" fill="#e8d8b8" font-family="'Cinzel'" font-size="8" font-weight="700" text-anchor="middle">${['I','II','III','IV','V','VI','VII','VIII','IX'][node.id - 1]}</text>
        </g>
      `;
    });

    escapementGroup.innerHTML = html;
  }

  buildGlyphMatrix() {
    let html = '';
    MERIDIAN_GLYPHS.forEach((glyph) => {
      html += `
        <button class="glyph-button" data-glyph-id="${glyph.id}" id="btn-${glyph.id}" title="${glyph.title} [${glyph.patent}]">
          ${glyph.svg}
          <span class="glyph-code-tag">${glyph.code}</span>
          <span class="glyph-name-label">${glyph.name}</span>
        </button>
      `;
    });
    this.glyphMatrixContainer.innerHTML = html;
  }

  // =========================================================================
  // QUICK-DIAL & TIER FILTERING
  // =========================================================================
  renderQuickDialList() {
    let entries = QUICK_DIAL_ENTRIES;
    if (this.currentTierFilter === '1') {
      entries = entries.filter(e => e.tier === 1);
    } else if (this.currentTierFilter === '2') {
      entries = entries.filter(e => e.tier === 2);
    }

    let html = '';
    entries.forEach((entry) => {
      const badgeClass = entry.tier === 1 ? 'badge-tier-1' : 'badge-tier-2';
      const pills = entry.sequence.map(gId => {
        const g = MERIDIAN_GLYPHS.find(item => item.id === gId);
        return `<span class="mini-glyph-pill">${g ? g.code : gId}</span>`;
      }).join('');

      html += `
        <div class="quick-dial-card" data-entry-id="${entry.id}" id="qd-card-${entry.id}">
          <div class="card-top">
            <span class="card-name">${entry.name}</span>
            <span class="route-badge ${badgeClass}">${entry.tierName}</span>
          </div>
          <div class="card-jurisdiction">${entry.jurisdiction} • ${entry.fluxRating}</div>
          <div class="card-specs">
            <span>PRESS: ${entry.pressure}</span>
            <span>TENS: ${entry.voltage}</span>
          </div>
          <div class="card-glyphs-preview">
            ${pills}
          </div>
          <button class="inject-btn" data-inject-id="${entry.id}">Inject Coordinates ➔</button>
        </div>
      `;
    });

    this.quickDialListEl.innerHTML = html;
  }

  populateManualCodex() {
    const codexGrid = document.getElementById('patent-codex-grid');
    if (!codexGrid) return;

    let html = '';
    MERIDIAN_GLYPHS.forEach((glyph) => {
      html += `
        <div class="patent-glyph-item">
          ${glyph.svg}
          <div class="patent-details">
            <div class="patent-name">${glyph.name}</div>
            <div class="patent-code">${glyph.code} • ${glyph.patent} • ${glyph.sector}</div>
            <div class="patent-desc">${glyph.description}</div>
          </div>
        </div>
      `;
    });
    codexGrid.innerHTML = html;
  }

  // =========================================================================
  // EVENT BINDINGS
  // =========================================================================
  bindEvents() {
    // Audio Mute Toggle
    this.muteToggleBtn.addEventListener('click', () => {
      const isMuted = soundEngine.toggleMute();
      this.muteStatusText.textContent = isMuted ? 'AUDIO: MUTED' : 'AUDIO: ON';
      this.muteToggleBtn.style.borderColor = isMuted ? 'var(--warning-crimson)' : 'var(--copper-dim)';
    });

    // Manual Modal Events
    this.manualOpenBtn.addEventListener('click', () => {
      soundEngine.playTelegraphClick(1.2);
      this.manualModalBackdrop.classList.add('open');
    });

    this.manualCloseBtn.addEventListener('click', () => {
      soundEngine.playTelegraphClick(0.9);
      this.manualModalBackdrop.classList.remove('open');
    });

    this.manualModalBackdrop.addEventListener('click', (e) => {
      if (e.target === this.manualModalBackdrop) {
        soundEngine.playTelegraphClick(0.9);
        this.manualModalBackdrop.classList.remove('open');
      }
    });

    // Modal Tabs
    document.querySelectorAll('.modal-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        soundEngine.playTelegraphClick(1.1);
        document.querySelectorAll('.modal-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.manual-section').forEach(s => s.classList.remove('active'));
        btn.classList.add('active');
        const tabTarget = btn.getAttribute('data-tab');
        const section = document.getElementById(tabTarget);
        if (section) section.classList.add('active');
      });
    });

    // Tier Filter Tabs
    this.tabFilterAll.addEventListener('click', () => this.setTierFilter('all'));
    this.tabFilterTier1.addEventListener('click', () => this.setTierFilter('1'));
    this.tabFilterTier2.addEventListener('click', () => this.setTierFilter('2'));

    // Quick Dial Injection
    this.quickDialListEl.addEventListener('click', (e) => {
      const injectBtn = e.target.closest('.inject-btn');
      const card = e.target.closest('.quick-dial-card');
      if (injectBtn || card) {
        const entryId = injectBtn ? injectBtn.getAttribute('data-inject-id') : card.getAttribute('data-entry-id');
        this.injectQuickDialSequence(entryId);
      }
    });

    // Glyph Matrix Keys (Cluster 1)
    this.glyphMatrixContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.glyph-button');
      if (btn && !btn.classList.contains('disabled')) {
        const glyphId = btn.getAttribute('data-glyph-id');
        this.handleManualGlyphClick(glyphId);
      }
    });

    // Safety Hold Switch (Cluster 2)
    this.safetyHoldToggleBtn.addEventListener('click', () => {
      this.toggleSafetyHold();
    });

    // Primary Dispatch Throttle (Cluster 2)
    this.dispatchThrottleBtn.addEventListener('click', () => {
      this.handleThrottleClick();
    });

    // Disengage / Vent Steam Button
    this.emergencyVentBtn.addEventListener('click', () => {
      this.disengageAndVentSteam();
    });

    // Purge Staged Button
    this.clearStagedBtn.addEventListener('click', () => {
      this.purgeStagedSequence();
    });

    // Keyboard Shortcuts (ESC = Disengage, Space = Throttle)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.disengageAndVentSteam();
      }
    });
  }

  setTierFilter(tier) {
    soundEngine.playTelegraphClick(1.0);
    this.currentTierFilter = tier;
    this.tabFilterAll.classList.toggle('active', tier === 'all');
    this.tabFilterTier1.classList.toggle('active', tier === '1');
    this.tabFilterTier2.classList.toggle('active', tier === '2');
    this.renderQuickDialList();
  }

  // =========================================================================
  // CORE DIALING & LOCKING LOGIC
  // =========================================================================
  handleManualGlyphClick(glyphId) {
    if (this.state === AppState.ACTIVE || this.state === AppState.IGNITING) return;
    if (this.stagedGlyphs.length >= 7) return;

    const glyph = MERIDIAN_GLYPHS.find(g => g.id === glyphId);
    if (!glyph) return;

    this.dialSingleGlyph(glyph);
  }

  dialSingleGlyph(glyph) {
    const slotIdx = this.stagedGlyphs.length;
    this.stagedGlyphs.push(glyph);
    const escapementId = slotIdx + 1;
    this.lockedEscapements.add(escapementId);

    // Audio synthesis
    soundEngine.playTelegraphClick(1.0 + slotIdx * 0.1);
    setTimeout(() => {
      soundEngine.playEscapementLock(escapementId);
    }, 120);

    // Differential Ring Rotation
    const targetDeg = (glyph.index * (360 / 16));
    this.ringRotationAngle = targetDeg;
    this.rotatingRingEl.style.transform = `rotate(${this.ringRotationAngle}deg)`;

    // Update Visual Slot
    const slotEl = this.sequenceSlotEls[slotIdx];
    if (slotEl) {
      slotEl.classList.add('locked');
      slotEl.innerHTML = `${glyph.svg}<span class="slot-idx" style="position:absolute; bottom:1px; right:2px; font-size:7px;">${glyph.code}</span>`;
    }

    // Lock Escapement Node Visuals
    this.updateEscapementNodeVisual(escapementId, true);

    // Boost Galvanic Pressure & Voltage
    this.targetPressure = 29.92 + (slotIdx + 1) * 0.85;
    this.targetVoltage = 2400 + (slotIdx + 1) * 450;

    // Log to Telegraph Ticker
    this.logTelemetry(`Escapement [${escapementId}] locked to ${glyph.code} (${glyph.name}). Sector alignment confirmed.`);

    if (this.stagedGlyphs.length === 7) {
      this.state = AppState.STAGED;
      this.ringStatusDot.className = 'status-indicator-dot ' + (this.isSafetyHoldEngaged ? 'locked-hold' : 'dialing');
      this.ringStatusText.textContent = this.isSafetyHoldEngaged 
        ? 'STAGED: 7/7 MERIDIANS LOCKED • BOILER SAFETY INTERLOCK ACTIVE'
        : 'STAGED: 7/7 MERIDIANS LOCKED • READY FOR CONDUIT IGNITION';
      this.logTelemetry('Full 7-glyph meridian coordinate staged. Standing by for manifold ignition.', 'highlight');
    } else {
      this.state = AppState.DIALING;
      this.ringStatusDot.className = 'status-indicator-dot dialing';
      this.ringStatusText.textContent = `DIALING MERIDIAN [${slotIdx + 1}/7]: ${glyph.code} ENGAGED`;
    }

    this.ringActiveLockCount.textContent = `ESCAPEMENTS LOCKED: ${this.stagedGlyphs.length} / 7`;
    this.updateControlsState();
  }

  injectQuickDialSequence(entryId) {
    if (this.state === AppState.ACTIVE || this.state === AppState.IGNITING) return;

    const entry = QUICK_DIAL_ENTRIES.find(e => e.id === entryId);
    if (!entry) return;

    this.purgeStagedSequence(false);
    this.activeConduit = entry;
    this.logTelemetry(`Injecting calibrated telegraph ledger: [${entry.name}] (${entry.jurisdiction})...`, 'highlight');

    // Parse target pressure and voltage
    const pressMatch = parseFloat(entry.pressure);
    if (!isNaN(pressMatch)) this.targetPressure = pressMatch;
    const voltMatch = parseFloat(entry.voltage.replace(/[^0-9]/g, ''));
    if (!isNaN(voltMatch)) this.targetVoltage = voltMatch;

    // Rapid sequential coordinate lock
    entry.sequence.forEach((glyphId, i) => {
      setTimeout(() => {
        const glyph = MERIDIAN_GLYPHS.find(g => g.id === glyphId);
        if (glyph) {
          this.dialSingleGlyph(glyph);
        }
      }, i * 180);
    });
  }

  updateEscapementNodeVisual(escapementId, isLocked) {
    const lamp = document.getElementById(`escapement-lamp-${escapementId}`);
    const needle = document.getElementById(`escapement-needle-${escapementId}`);
    if (lamp) {
      lamp.setAttribute('class', isLocked ? 'escapement-lamp locked-lamp' : 'escapement-lamp');
    }
    if (needle) {
      needle.setAttribute('stroke', isLocked ? '#ffc107' : '#79441c');
      needle.setAttribute('stroke-width', isLocked ? '3' : '2');
    }
  }

  // =========================================================================
  // REVIEW / BOILER SAFETY INTERLOCK
  // =========================================================================
  toggleSafetyHold() {
    this.isSafetyHoldEngaged = !this.isSafetyHoldEngaged;
    soundEngine.playInterlockSwitch(this.isSafetyHoldEngaged);

    if (this.isSafetyHoldEngaged) {
      this.safetyHoldToggleBtn.className = 'safety-switch-btn';
      this.safetyHoldToggleBtn.textContent = 'HOLD: ENGAGED';
      this.interlockStatusDesc.textContent = "CHIEF DISPATCHER'S HOLD [ENGAGED]";
      this.logTelemetry("Boiler Safety Interlock ENGAGED. Conduit manifold locked against ignition.", "warning");
    } else {
      this.safetyHoldToggleBtn.className = 'safety-switch-btn disengaged';
      this.safetyHoldToggleBtn.textContent = 'HOLD: CLEAR';
      this.interlockStatusDesc.textContent = "MANIFOLD UNLOCKED [CLEARED FOR DISPATCH]";
      this.logTelemetry("Boiler Safety Interlock CLEARED. Manifold primed for dispatch throttle.", "success");
    }

    if (this.state === AppState.STAGED) {
      this.ringStatusDot.className = 'status-indicator-dot ' + (this.isSafetyHoldEngaged ? 'locked-hold' : 'dialing');
      this.ringStatusText.textContent = this.isSafetyHoldEngaged 
        ? 'STAGED: 7/7 MERIDIANS LOCKED • BOILER SAFETY INTERLOCK ACTIVE'
        : 'STAGED: 7/7 MERIDIANS LOCKED • READY FOR CONDUIT IGNITION';
    }

    this.updateControlsState();
  }

  // =========================================================================
  // THROTTLE & CONDUIT IGNITION
  // =========================================================================
  handleThrottleClick() {
    if (this.state === AppState.ACTIVE) {
      // Disengage
      this.disengageAndVentSteam();
      return;
    }

    if (this.state === AppState.STAGED) {
      if (this.isSafetyHoldEngaged) {
        soundEngine.playInterlockSwitch(true);
        this.logTelemetry("IGNITION BLOCKED: Boiler Safety Interlock is ENGAGED. Toggle switch to CLEAR to fire.", "warning");
        
        // Prominently highlight & shake the Safety Hold Switch to guide operator
        this.safetyHoldToggleBtn.classList.add('flash-warning');
        setTimeout(() => {
          this.safetyHoldToggleBtn.classList.remove('flash-warning');
        }, 1200);
        return;
      }

      this.igniteConduitVortex();
    }
  }

  igniteConduitVortex() {
    this.state = AppState.IGNITING;
    this.updateControlsState();
    this.ringStatusDot.className = 'status-indicator-dot active';
    this.ringStatusText.textContent = 'CONDUIT IGNITION: HIGH-TENSION GALVANIC ARC BREAKDOWN IN PROGRESS...';
    this.logTelemetry("Primary Throttle engaged. High-tension galvanic spark breakdown occurring!", "highlight");

    soundEngine.startConduitVortex();

    // Render active SVG lightning energy beams from all locked escapements
    this.renderActiveConduitEnergyBeams(true);

    // Spawn high-energy ignition particles
    for (let i = 0; i < 60; i++) {
      this.vortexParticles.push(this.createVortexParticle(true));
    }

    setTimeout(() => {
      this.state = AppState.ACTIVE;
      this.ringStatusDot.className = 'status-indicator-dot active';
      this.ringStatusText.textContent = 'CONDUIT ESTABLISHED: LUMINIFEROUS AETHER TRANSIT OPEN';
      this.logTelemetry("HARMONIC SINGULARITY ESTABLISHED. Aetheric waveguide locked at 60.00 Hz.", "success");
      this.updateControlsState();
    }, 800);
  }

  renderActiveConduitEnergyBeams(isActive) {
    const beamsGroup = document.getElementById('active-conduit-energy-beams');
    if (!beamsGroup) return;

    if (!isActive) {
      beamsGroup.innerHTML = '';
      beamsGroup.setAttribute('opacity', '0');
      return;
    }

    beamsGroup.setAttribute('opacity', '1');
    const cx = 320, cy = 320;
    let html = '';

    // Draw radiant energy beams from each locked escapement node into aperture center
    this.lockedEscapements.forEach(nodeId => {
      const node = ESCAPEMENT_NODES.find(n => n.id === nodeId);
      if (!node) return;

      const angleDeg = node.angle;
      const rad = (angleDeg * Math.PI) / 180;
      const nx = cx + 250 * Math.sin(rad);
      const ny = cy - 250 * Math.cos(rad);

      // Jagged dynamic electric lightning arc path
      const midX1 = cx + 180 * Math.sin(rad) + (Math.random() - 0.5) * 15;
      const midY1 = cy - 180 * Math.cos(rad) + (Math.random() - 0.5) * 15;
      const midX2 = cx + 90 * Math.sin(rad) + (Math.random() - 0.5) * 20;
      const midY2 = cy - 90 * Math.cos(rad) + (Math.random() - 0.5) * 20;

      html += `
        <path d="M${nx.toFixed(1)} ${ny.toFixed(1)} L${midX1.toFixed(1)} ${midY1.toFixed(1)} L${midX2.toFixed(1)} ${midY2.toFixed(1)} L${cx} ${cy}" 
              stroke="#4ecdc4" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <line x1="${nx.toFixed(1)}" y1="${ny.toFixed(1)}" x2="${cx}" y2="${cy}" stroke="#ffffff" stroke-width="1.2" opacity="0.85"/>
      `;
    });

    beamsGroup.innerHTML = html;
  }

  // =========================================================================
  // DISENGAGE / EMERGENCY VENT STEAM
  // =========================================================================
  disengageAndVentSteam() {
    if (this.state === AppState.IDLE && this.stagedGlyphs.length === 0) {
      soundEngine.playEmergencyVent();
      this.logTelemetry("Emergency steam vent bypass purged (system idle).");
      return;
    }

    soundEngine.playEmergencyVent();
    this.logTelemetry("MANIFOLD PURGED: High-pressure steam vented. Conduit extinguished.", "warning");

    this.state = AppState.IDLE;
    this.stagedGlyphs = [];
    this.activeConduit = null;
    this.renderActiveConduitEnergyBeams(false);

    // Reset Escapements
    for (let i = 1; i <= 9; i++) {
      this.updateEscapementNodeVisual(i, false);
    }
    this.lockedEscapements.clear();

    // Reset Slots
    this.sequenceSlotEls.forEach((slot, idx) => {
      slot.className = 'sequence-slot';
      slot.innerHTML = `<span class="slot-idx">${['I','II','III','IV','V','VI','VII'][idx]}</span>`;
    });

    // Reset Pressures & Gauges
    this.targetPressure = 29.92;
    this.targetVoltage = 2400;

    // Reset Status Readout
    this.ringStatusDot.className = 'status-indicator-dot idle';
    this.ringStatusText.textContent = 'MERIDIAN STATUS: IDLE - AWAITING COORDINATE INPUT';
    this.ringActiveLockCount.textContent = 'ESCAPEMENTS LOCKED: 0 / 7';

    this.updateControlsState();
  }

  purgeStagedSequence(logAction = true) {
    if (this.state === AppState.ACTIVE || this.state === AppState.IGNITING) return;

    soundEngine.playSteamPuff(0.25, 0.2);
    this.state = AppState.IDLE;
    this.stagedGlyphs = [];
    this.activeConduit = null;

    for (let i = 1; i <= 9; i++) {
      this.updateEscapementNodeVisual(i, false);
    }
    this.lockedEscapements.clear();

    this.sequenceSlotEls.forEach((slot, idx) => {
      slot.className = 'sequence-slot';
      slot.innerHTML = `<span class="slot-idx">${['I','II','III','IV','V','VI','VII'][idx]}</span>`;
    });

    this.targetPressure = 29.92;
    this.targetVoltage = 2400;

    this.ringStatusDot.className = 'status-indicator-dot idle';
    this.ringStatusText.textContent = 'MERIDIAN STATUS: IDLE - AWAITING COORDINATE INPUT';
    this.ringActiveLockCount.textContent = 'ESCAPEMENTS LOCKED: 0 / 7';

    if (logAction) {
      this.logTelemetry("Staged coordinate sequence purged.");
    }
    this.updateControlsState();
  }

  // =========================================================================
  // CONTROLS & THROTTLE STATE EVALUATION
  // =========================================================================
  updateControlsState() {
    // 1. Glyph Buttons Matrix
    const isLockedOrMax = (this.stagedGlyphs.length >= 7) || (this.state === AppState.ACTIVE) || (this.state === AppState.IGNITING);
    document.querySelectorAll('.glyph-button').forEach(btn => {
      btn.classList.toggle('disabled', isLockedOrMax);
    });

    // 2. Dispatch Throttle Button
    if (this.state === AppState.ACTIVE) {
      this.dispatchThrottleBtn.disabled = false;
      this.dispatchThrottleBtn.className = 'conduit-active';
      this.throttleBtnLabel.textContent = 'CONDUIT OPEN [DISENGAGE]';
    } else if (this.state === AppState.IGNITING) {
      this.dispatchThrottleBtn.disabled = true;
      this.dispatchThrottleBtn.className = 'conduit-active';
      this.throttleBtnLabel.textContent = 'IGNITING MANIFOLD...';
    } else if (this.state === AppState.STAGED) {
      this.dispatchThrottleBtn.disabled = false;
      if (this.isSafetyHoldEngaged) {
        this.dispatchThrottleBtn.className = 'blocked-hold';
        this.throttleBtnLabel.textContent = 'HOLD: INTERLOCK ENGAGED';
      } else {
        this.dispatchThrottleBtn.className = '';
        this.throttleBtnLabel.textContent = 'ENGAGE DISPATCH THROTTLE';
      }
    } else {
      // IDLE or DIALING (< 7)
      this.dispatchThrottleBtn.disabled = true;
      this.dispatchThrottleBtn.className = '';
      this.throttleBtnLabel.textContent = 'ENGAGE DISPATCH THROTTLE';
    }
  }

  // =========================================================================
  // DYNAMIC AETHERIC VORTEX CANVAS & GOVERNOR SIMULATION
  // =========================================================================
  initVortexCanvas() {
    this.vortexCanvas = document.getElementById('vortex-canvas');
    if (!this.vortexCanvas) return;
    this.vortexCtx = this.vortexCanvas.getContext('2d');

    // Create persistent vector streamlines
    for (let i = 0; i < 24; i++) {
      this.streamlines.push({
        radius: 20 + Math.random() * 110,
        angle: Math.random() * Math.PI * 2,
        speed: (0.01 + Math.random() * 0.03) * (Math.random() > 0.5 ? 1 : -1),
        length: 0.3 + Math.random() * 1.2,
        color: Math.random() > 0.3 ? 'rgba(226, 135, 67, ' : 'rgba(78, 205, 196, '
      });
    }
  }

  createVortexParticle(isIgnition = false) {
    const angle = Math.random() * Math.PI * 2;
    const dist = isIgnition ? Math.random() * 120 : (80 + Math.random() * 50);
    return {
      x: 140 + Math.cos(angle) * dist,
      y: 140 + Math.sin(angle) * dist,
      vx: (Math.random() - 0.5) * (isIgnition ? 6 : 1.5),
      vy: (Math.random() - 0.5) * (isIgnition ? 6 : 1.5),
      life: 1.0,
      decay: 0.015 + Math.random() * 0.03,
      size: 1 + Math.random() * (isIgnition ? 3.5 : 2),
      isCyan: Math.random() > 0.6
    };
  }

  startMainAnimationLoop() {
    const render = () => {
      this.renderVortexCanvas();
      this.updateGaugesAnimation();
      this.animFrameId = requestAnimationFrame(render);
    };
    this.animFrameId = requestAnimationFrame(render);
  }

  renderVortexCanvas() {
    if (!this.vortexCtx) return;
    const ctx = this.vortexCtx;
    const cx = 140, cy = 140;

    ctx.clearRect(0, 0, 280, 280);

    const isActive = this.state === AppState.ACTIVE || this.state === AppState.IGNITING;
    const isDialing = this.state === AppState.DIALING || this.state === AppState.STAGED;

    // 1. Background Aperture Singularity Glow & Horizon
    if (isActive) {
      // Powerful radiant cyan & solar horizon
      const glowRad = ctx.createRadialGradient(cx, cy, 5, cx, cy, 138);
      glowRad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      glowRad.addColorStop(0.2, 'rgba(78, 205, 196, 0.9)');
      glowRad.addColorStop(0.5, 'rgba(226, 135, 67, 0.7)');
      glowRad.addColorStop(0.85, 'rgba(23, 42, 69, 0.9)');
      glowRad.addColorStop(1, 'rgba(10, 13, 19, 0.98)');
      ctx.fillStyle = glowRad;
      ctx.beginPath();
      ctx.arc(cx, cy, 138, 0, Math.PI * 2);
      ctx.fill();

      // High-energy pulsating concentric shockwave rings
      const pulseT = Date.now() / 300;
      for (let r = 0; r < 3; r++) {
        const ringR = ((pulseT + r * 35) % 110) + 15;
        ctx.strokeStyle = `rgba(78, 205, 196, ${(1 - ringR / 125).toFixed(2)})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Galvanic lightning arc discharges inside portal throat
      if (Math.random() < 0.85) {
        ctx.strokeStyle = '#ffffff';
        ctx.shadowColor = '#4ecdc4';
        ctx.shadowBlur = 12;
        ctx.lineWidth = 2;
        ctx.beginPath();
        const arcTheta = Math.random() * Math.PI * 2;
        const xStart = cx + Math.cos(arcTheta) * (15 + Math.random() * 20);
        const yStart = cy + Math.sin(arcTheta) * (15 + Math.random() * 20);
        ctx.moveTo(xStart, yStart);
        let curX = xStart, curY = yStart;
        for (let seg = 0; seg < 4; seg++) {
          curX += (Math.random() - 0.5) * 45 + Math.cos(arcTheta) * 25;
          curY += (Math.random() - 0.5) * 45 + Math.sin(arcTheta) * 25;
          ctx.lineTo(curX, curY);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    } else if (isDialing) {
      const glowRad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 138);
      glowRad.addColorStop(0, 'rgba(255, 193, 7, 0.35)');
      glowRad.addColorStop(0.5, 'rgba(226, 135, 67, 0.2)');
      glowRad.addColorStop(1, 'rgba(10, 13, 19, 0.9)');
      ctx.fillStyle = glowRad;
      ctx.beginPath();
      ctx.arc(cx, cy, 138, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const glowRad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 138);
      glowRad.addColorStop(0, 'rgba(226, 135, 67, 0.08)');
      glowRad.addColorStop(1, 'rgba(10, 13, 19, 0.95)');
      ctx.fillStyle = glowRad;
      ctx.beginPath();
      ctx.arc(cx, cy, 138, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Render High-Velocity Streamlines
    const speedMult = isActive ? 5.5 : (isDialing ? 1.8 : 0.6);
    this.streamlines.forEach(line => {
      line.angle += line.speed * speedMult;
      ctx.strokeStyle = line.color + (isActive ? '0.95)' : '0.45)');
      ctx.lineWidth = isActive ? 2.5 : 1;
      ctx.beginPath();
      ctx.arc(cx, cy, line.radius, line.angle, line.angle + line.length);
      ctx.stroke();
    });

    // 3. Particle Emitter
    if (isActive) {
      for (let k = 0; k < 3; k++) {
        this.vortexParticles.push(this.createVortexParticle(true));
      }
    } else if (isDialing || Math.random() < 0.2) {
      this.vortexParticles.push(this.createVortexParticle(false));
    }

    for (let i = this.vortexParticles.length - 1; i >= 0; i--) {
      const p = this.vortexParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;

      if (p.life <= 0) {
        this.vortexParticles.splice(i, 1);
        continue;
      }

      ctx.fillStyle = p.isCyan 
        ? `rgba(78, 205, 196, ${p.life.toFixed(2)})` 
        : `rgba(255, 224, 130, ${p.life.toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (isActive ? 1.5 : 1), 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Centrifugal Sol-Governor Flyball Rendering in Central Spindle
    const govSpeed = isActive ? 0.14 : (isDialing ? 0.04 : 0.015);
    this.flyballAngle += govSpeed;
    const armSpread = isActive ? 55 : (isDialing ? 30 : 18);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.flyballAngle);

    // Spindle Hub
    ctx.strokeStyle = isActive ? '#4ecdc4' : '#e28743';
    ctx.lineWidth = 2.5;
    ctx.fillStyle = '#10151f';
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Dual Flyball Governor Arms with High-Velocity Deflection
    for (let side = -1; side <= 1; side += 2) {
      const bx = side * armSpread;
      const by = 0;
      ctx.strokeStyle = isActive ? '#ffffff' : '#e28743';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(bx, by);
      ctx.stroke();

      ctx.fillStyle = isActive ? '#4ecdc4' : '#ffc107';
      ctx.beginPath();
      ctx.arc(bx, by, isActive ? 6.5 : 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  // =========================================================================
  // GAUGES & TELEMETRY CLOCK
  // =========================================================================
  updateGaugesAnimation() {
    // Mercury height smooth interpolation
    this.currentPressure += (this.targetPressure - this.currentPressure) * 0.08;
    const mercuryPct = Math.min(100, Math.max(15, ((this.currentPressure - 20) / 25) * 100));
    this.mercuryBarEl.style.height = `${mercuryPct.toFixed(1)}%`;
    this.pressureEl.textContent = `${this.currentPressure.toFixed(2)} inHg`;

    // Galvanic Voltage interpolation
    this.currentVoltage += (this.targetVoltage - this.currentVoltage) * 0.08;
    const noise = (Math.random() - 0.5) * (this.state === AppState.ACTIVE ? 120 : 15);
    const liveVolt = Math.round(this.currentVoltage + noise);
    this.voltageEl.textContent = `${liveVolt.toLocaleString()} V`;
    this.galvanicReadoutEl.textContent = `${liveVolt.toLocaleString()} V`;

    // Galvanometer needle angle
    const voltPct = Math.min(1, Math.max(0, (liveVolt - 2000) / 7000));
    const needleAngle = -45 + voltPct * 90;
    const nx = 50 + 35 * Math.sin((needleAngle * Math.PI) / 180);
    const ny = 65 - 35 * Math.cos((needleAngle * Math.PI) / 180);
    this.galvanicNeedleEl.setAttribute('x2', nx.toFixed(1));
    this.galvanicNeedleEl.setAttribute('y2', ny.toFixed(1));

    // Aether flux readout
    if (this.state === AppState.ACTIVE) {
      const fluxVal = 8.45 + Math.sin(Date.now() / 200) * 0.35;
      this.fluxEl.textContent = `${fluxVal.toFixed(2)} μTorr`;
    } else if (this.state === AppState.DIALING || this.state === AppState.STAGED) {
      const fluxVal = (this.stagedGlyphs.length * 0.72) + (Math.random() * 0.1);
      this.fluxEl.textContent = `${fluxVal.toFixed(2)} μTorr`;
    } else {
      this.fluxEl.textContent = '0.00 μTorr';
    }

    // Escapement Hertz Sync
    const hertzNoise = (Math.random() - 0.5) * (this.state === AppState.ACTIVE ? 0.04 : 0.01);
    this.currentHertz = 60.00 + hertzNoise;
    this.hertzDisplayEl.textContent = this.currentHertz.toFixed(2);
  }

  startTelemetryClock() {
    const updateTime = () => {
      const d = new Date();
      const h = String(d.getUTCHours()).padStart(2, '0');
      const m = String(d.getUTCMinutes()).padStart(2, '0');
      const s = String(d.getUTCSeconds()).padStart(2, '0');
      this.clockEl.textContent = `${h}:${m}:${s} GMT`;
    };
    setInterval(updateTime, 1000);
    updateTime();
  }

  logTelemetry(msg, type = 'normal') {
    const d = new Date();
    const ts = `[${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}:${String(d.getUTCSeconds()).padStart(2, '0')}]`;
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `<span class="log-time">${ts}</span><span class="log-msg ${type}">${msg}</span>`;
    this.tickerLogBox.appendChild(entry);
    this.tickerLogBox.scrollTop = this.tickerLogBox.scrollHeight;
  }
}

// Instantiate on DOM Load
window.addEventListener('DOMContentLoaded', () => {
  window.terminalInstance = new StargateAethericTerminal();
});
