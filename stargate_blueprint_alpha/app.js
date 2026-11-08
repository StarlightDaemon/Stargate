/**
 * VOSSEN-KLEIN TOPOLOGICAL DRAFTING STATION // MAIN CAD CONTROLLER
 * Full implementation of 8-node structural drafting portal, 16-vector matrix,
 * procedural topological flux renderer, Review Hold subsystem, and quick-dials.
 */

(function () {
  'use strict';

  // State Management
  const state = {
    stagedGlyphs: [],       // Array of up to 6 selected glyph indices
    lockedNodes: [],        // Array of locked node indices (0-7)
    reviewHoldActive: false,// Structural Peer Review Hold status
    isEngaging: false,      // Animation in progress
    isConnected: false,     // Manifold locked and transmitting
    audioEnabled: true,
    currentSitePlan: null,
    isPlottingPlan: false,
    activationStage: 'IDLE'
  };

  // Every deferred UI operation belongs to the current draft generation.
  const pendingDraftTimers = new Set();
  let draftGeneration = 0;
  function cancelDraftWork() {
    draftGeneration++;
    pendingDraftTimers.forEach(timer => clearTimeout(timer));
    pendingDraftTimers.clear();
    state.isPlottingPlan = false;
    window.blueprintAudio.cancelTransientWork();
  }
  function laterInDraft(callback, delay) {
    const generation = draftGeneration;
    const timer = setTimeout(() => {
      pendingDraftTimers.delete(timer);
      if (generation !== draftGeneration) return;
      callback();
    }, delay);
    pendingDraftTimers.add(timer);
  }

  // 16 Vector Glyph Definitions
  const GLYPHS = [
    { index: 0, char: '⌖', code: 'ALPHA-AXIS', angle: 0 },
    { index: 1, char: '⌬', code: 'HEXA-CELL', angle: 22.5 },
    { index: 2, char: '⟐', code: 'DIAMOND-CHORD', angle: 45 },
    { index: 3, char: '⨁', code: 'FLUX-SUM', angle: 67.5 },
    { index: 4, char: '◬', code: 'PRISM-VECTOR', angle: 90 },
    { index: 5, char: '⎔', code: 'CURV-REFLECT', angle: 112.5 },
    { index: 6, char: '⊞', code: 'QUAD-TENSOR', angle: 135 },
    { index: 7, char: '⊛', code: 'ASTRA-DATUM', angle: 157.5 },
    { index: 8, char: '⨀', code: 'SINGULARITY-N', angle: 180 },
    { index: 9, char: '⋈', code: 'SHEAR-LINK', angle: 202.5 },
    { index: 10, char: '⎊', code: 'PHASE-DELTA', angle: 225 },
    { index: 11, char: '⏣', code: 'METRIC-RING', angle: 247.5 },
    { index: 12, char: '⍟', code: 'POLAR-VEX', angle: 270 },
    { index: 13, char: '⏚', code: 'NULL-DATUM', angle: 292.5 },
    { index: 14, char: '⏛', code: 'EXP-CHAMBER', angle: 315 },
    { index: 15, char: '⧉', code: 'TENSOR-TWIN', angle: 337.5 }
  ];

  // DOM Elements
  const DOM = {
    frame: document.getElementById('drafting-station-frame'),
    cursorCoords: document.getElementById('cursor-coords'),
    systemStatus: document.getElementById('system-status-indicator'),
    promptLog: document.getElementById('system-prompt-log'),
    slotsContainer: document.getElementById('address-slots-container'),
    btnEngage: document.getElementById('btn-engage-draft'),
    btnDisengage: document.getElementById('btn-disengage-draft'),
    btnReviewHold: document.getElementById('btn-review-hold-toggle'),
    btnClearBuffer: document.getElementById('btn-clear-buffer'),
    btnSoundToggle: document.getElementById('sound-toggle-btn'),
    soundIcon: document.getElementById('sound-icon'),
    btnHelp: document.getElementById('operator-help-btn'),
    modal: document.getElementById('operator-modal'),
    modalCloseX: document.getElementById('modal-close-btn'),
    modalDismissBtn: document.getElementById('modal-dismiss-btn'),
    approvalStamp: document.getElementById('approval-stamp-group'),
    apertureStatus: document.getElementById('aperture-status-text'),
    stampSignature: document.querySelector('.stamp-sig'),
    reviewHoldStamp: document.getElementById('review-hold-stamp-group'),
    holdLed: document.getElementById('hold-led'),
    holdBtnText: document.getElementById('hold-btn-text'),
    sidebarHoldVal: document.getElementById('sidebar-hold-val'),
    tbPermitStatus: document.getElementById('tb-permit-status'),
    tbClock: document.getElementById('tb-clock-date'),
    apertureCanvas: document.getElementById('aperture-flux-canvas'),
    caliperArm: document.getElementById('plotter-caliper-arm'),
    fastenerBoltsGroup: document.getElementById('fastener-bolts'),
    compassGradGroup: document.getElementById('compass-graduations'),
    telemetryFlux: document.getElementById('telemetry-flux'),
    telemetryTension: document.getElementById('telemetry-tension'),
    telemetryDrift: document.getElementById('telemetry-drift'),
    telemetryActiveVector: document.getElementById('telemetry-active-vector'),
    glyphButtons: document.querySelectorAll('.glyph-btn'),
    sitePlanCards: document.querySelectorAll('.site-plan-card'),
    lockNodes: document.querySelectorAll('.datum-lock-node')
  };

  // Canvas Flux Animation Variables
  let fluxCtx = null;
  let fluxAnimId = null;
  let fluxPhase = 0;

  // Initialize Station
  function initStation() {
    setupResponsiveScaling();
    renderDrawingElements();
    setupEventListeners();
    setupCanvas();
    updateClock();
    setActivationStage('IDLE');
    setInterval(updateClock, 1000);
    updateControls();
    logMessage('DRAFTING STATION ONLINE — SELECT 6 COORDINATE GLYPHS OR LOAD ARCHIVED SITE PLAN.');
  }

  // Viewport Scaling Helper - Guarantees scale() uses unitless ratio and applies correctly
  function setupResponsiveScaling() {
    function applyScaling() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const targetWidth = 1920;
      const targetHeight = 1080;

      const scale = Math.min(vw / targetWidth, vh / targetHeight);
      DOM.frame.style.transform = `scale(${scale})`;
      DOM.frame.style.transformOrigin = 'center center';
    }

    applyScaling();
    window.addEventListener('resize', applyScaling);
  }

  // Render SVG Fastener Studs & Graduation Compass Marks
  function renderDrawingElements() {
    // 48 Fastener Bolts along outer flange
    if (DOM.fastenerBoltsGroup) {
      let boltsSvg = '';
      for (let i = 0; i < 48; i++) {
        const angle = (i * 360) / 48;
        const rad = (angle * Math.PI) / 180;
        const cx = 500 + 387 * Math.sin(rad);
        const cy = 500 - 387 * Math.cos(rad);
        boltsSvg += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="3" class="fastener-stud" />`;
      }
      DOM.fastenerBoltsGroup.innerHTML = boltsSvg;
    }

    // Compass graduations every 5 degrees
    if (DOM.compassGradGroup) {
      let gradSvg = '';
      for (let i = 0; i < 72; i++) {
        const deg = i * 5;
        const rad = (deg * Math.PI) / 180;
        const isMajor = deg % 45 === 0;
        const isSemiMajor = deg % 15 === 0;
        const r1 = isMajor ? 350 : (isSemiMajor ? 355 : 360);
        const r2 = 368;

        const x1 = 500 + r1 * Math.sin(rad);
        const y1 = 500 - r1 * Math.cos(rad);
        const x2 = 500 + r2 * Math.sin(rad);
        const y2 = 500 - r2 * Math.cos(rad);

        gradSvg += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" class="graduation-tick ${isMajor ? 'major' : ''}" />`;

        if (isMajor) {
          const textR = 340;
          const tx = 500 + textR * Math.sin(rad);
          const ty = 500 - textR * Math.cos(rad) + 2.5;
          gradSvg += `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" class="graduation-text">${deg}°</text>`;
        }
      }
      DOM.compassGradGroup.innerHTML = gradSvg;
    }
  }

  // Setup Event Listeners
  function setupEventListeners() {
    // 16 Glyph Buttons
    DOM.glyphButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(btn.dataset.glyphIndex, 10);
        handleGlyphSelect(index);
      });
    });

    // Action Buttons
    DOM.btnEngage.addEventListener('click', () => {
      handleEngageManifold();
    });

    // DISENGAGE CONTROL: Hard Requirement - Always clickable, disengages connection smoothly
    DOM.btnDisengage.addEventListener('click', () => {
      handleDisengageManifold();
    });

    // Review Hold Toggle
    DOM.btnReviewHold.addEventListener('click', () => {
      toggleReviewHold();
    });

    // Clear Buffer
    DOM.btnClearBuffer.addEventListener('click', () => {
      clearStagedBuffer();
    });

    // Preloaded Site Plans (Quick Dials)
    DOM.sitePlanCards.forEach(card => {
      card.addEventListener('click', () => {
        const symbolsStr = card.dataset.symbols;
        const planId = card.dataset.planId;
        const symbols = symbolsStr.split(',').map(s => parseInt(s.trim(), 10));
        loadSitePlan(planId, symbols, card);
      });
    });

    // Operator Help Modal
    DOM.btnHelp.addEventListener('click', () => {
      openHelpModal();
    });
    DOM.modalCloseX.addEventListener('click', () => {
      closeHelpModal();
    });
    DOM.modalDismissBtn.addEventListener('click', () => {
      closeHelpModal();
    });
    DOM.modal.addEventListener('click', (e) => {
      if (e.target === DOM.modal) closeHelpModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !DOM.modal.classList.contains('hidden')) {
        closeHelpModal();
      }
    });

    // Sound Toggle
    DOM.btnSoundToggle.addEventListener('click', () => {
      const enabled = window.blueprintAudio.toggleAudio();
      state.audioEnabled = enabled;
      DOM.soundIcon.textContent = enabled ? '🔊' : '🔇';
      DOM.btnSoundToggle.innerHTML = `<span id="sound-icon">${enabled ? '🔊' : '🔇'}</span> AUDIO: ${enabled ? 'ON' : 'OFF'}`;
    });

    // CAD Cursor Coordinate Tracker
    DOM.frame.addEventListener('mousemove', (e) => {
      const rect = DOM.frame.getBoundingClientRect();
      const scale = rect.width / 1920;
      const xPx = (e.clientX - rect.left) / scale;
      const yPx = (e.clientY - rect.top) / scale;

      // Center is at (500, 500) inside viewport SVG
      const relX = (xPx - 960) * 3.75; // Scale to mm
      const relY = -(yPx - 540) * 3.75;
      let angleDeg = Math.atan2(relX, relY) * (180 / Math.PI);
      if (angleDeg < 0) angleDeg += 360;

      const signX = relX >= 0 ? '+' : '';
      const signY = relY >= 0 ? '+' : '';
      DOM.cursorCoords.textContent = `X: ${signX}${relX.toFixed(2)} Y: ${signY}${relY.toFixed(2)} θ: ${angleDeg.toFixed(1)}°`;
    });
  }

  // Handle Glyph Selection (Core Loop Action)
  function handleGlyphSelect(glyphIndex, fromPlan = false) {
    if (state.isConnected || state.isEngaging) {
      logMessage('APPROVAL OR CONNECTION ACTIVE — DISENGAGE OR VOID DRAFT BEFORE RE-PLOTTING.');
      return;
    }
    if (state.stagedGlyphs.length >= 6) {
      logMessage('MAXIMUM 6-DOF COORDINATE VECTORS REACHED. READY FOR APPROVAL.');
      return;
    }

    const glyph = GLYPHS[glyphIndex];
    if (!glyph) return;
    if (!fromPlan && state.isPlottingPlan) {
      cancelDraftWork();
      state.currentSitePlan = null;
      DOM.sitePlanCards.forEach(card => card.classList.remove('active-loaded'));
    }
    state.stagedGlyphs.push(glyphIndex);

    // Lock corresponding radial node (0 to 7)
    const nextNodeIndex = state.stagedGlyphs.length - 1;
    if (nextNodeIndex < 8) {
      lockRadialNode(nextNodeIndex, glyph);
    }

    // Move Plotter Caliper Arm
    rotateCaliperArm(glyph.angle);

    // Play Audio
    window.blueprintAudio.playPlotterStep();
    window.blueprintAudio.playCaliperSnap();

    // Update Staged Slots Display
    updateStagedSlots();
    updateControls();

    logMessage(`VECTOR [${glyph.char} ${glyph.code}] DRAFTED & INKED TO DATUM SEC-0${nextNodeIndex + 1}.`);
    DOM.telemetryActiveVector.textContent = `${glyph.char} ${glyph.code}`;
  }

  // Lock a Radial Datum Node with Inking Animation
  function lockRadialNode(nodeIndex, glyph) {
    const nodeEl = document.getElementById(`lock-node-${nodeIndex}`);
    if (nodeEl) {
      nodeEl.classList.add('locked');
      const statusText = document.getElementById(`node-stat-${nodeIndex}`);
      if (statusText) {
        statusText.textContent = `LOCKED: ${glyph.code.substring(0, 7)}`;
      }
      if (!state.lockedNodes.includes(nodeIndex)) {
        state.lockedNodes.push(nodeIndex);
      }
    }
    DOM.telemetryTension.textContent = `${(100 - (state.lockedNodes.length * 4.2)).toFixed(1)}% TENSION STRESS`;
    DOM.telemetryDrift.textContent = `±0.00${state.lockedNodes.length} mm`;
  }

  // Rotate Central Compass Caliper Arm
  function rotateCaliperArm(angleDeg) {
    if (DOM.caliperArm) {
      DOM.caliperArm.setAttribute('transform', `rotate(${angleDeg} 500 500)`);
    }
  }

  // Update Staged Sequence Slots
  function updateStagedSlots() {
    const slotEls = DOM.slotsContainer.querySelectorAll('.seq-slot');
    slotEls.forEach((slot, idx) => {
      const charEl = slot.querySelector('.slot-char');
      if (idx < state.stagedGlyphs.length) {
        const glyph = GLYPHS[state.stagedGlyphs[idx]];
        charEl.textContent = glyph.char;
        slot.classList.add('filled');
      } else {
        charEl.textContent = '_';
        slot.classList.remove('filled');
      }
    });

    // Update glyph buttons active state
    DOM.glyphButtons.forEach(btn => {
      const idx = parseInt(btn.dataset.glyphIndex, 10);
      if (state.stagedGlyphs.includes(idx)) {
        btn.classList.add('selected');
      } else {
        btn.classList.remove('selected');
      }
    });
  }

  function setActivationStage(stage) {
    state.activationStage = stage;
    DOM.frame.dataset.activationStage = stage;
    const labels = {
      IDLE: 'TOPOLOGY DORMANT // READY',
      BUILDUP: 'CALIPER CALIBRATION // BUILDUP',
      BREAKTHROUGH: 'DRAWING CERTIFIED // APERTURE FORMING',
      SUSTAINED_ACTIVE: 'TOPOLOGY ACTIVE // LOCKED'
    };
    if (DOM.apertureStatus) DOM.apertureStatus.textContent = labels[stage];
  }

  // Approve the staged drawing: calibrate, stamp the breakthrough, then sustain flux.
  function handleEngageManifold() {
    if (state.isConnected || state.isEngaging || state.isPlottingPlan) return;
    if (state.stagedGlyphs.length < 6) {
      logMessage('INCOMPLETE SPECIFICATION — 6 COORDINATE VECTORS REQUIRED.');
      return;
    }
    if (state.reviewHoldActive) { triggerReviewHoldRejection(); return; }

    state.isEngaging = true;
    setActivationStage('BUILDUP');
    updateControls();
    DOM.systemStatus.textContent = 'BUILDUP // CALIBRATING DRAFT';
    DOM.systemStatus.className = 'val status-indicator engaging';
    DOM.telemetryFlux.textContent = 'CALIBRATING // NOT CONNECTED';
    logMessage('CALIPER CALIBRATION: PLOTTER CADENCE RISING — APPROVAL PENDING.');
    // Accelerating mechanical plotter cadence builds tension without opening flux.
    [0, 300, 550, 750, 900, 1020, 1120, 1200, 1260, 1320].forEach(delay => {
      laterInDraft(() => {
        if (state.activationStage === 'BUILDUP') window.blueprintAudio.playPlotterStep();
      }, delay);
    });

    laterInDraft(() => {
      if (!state.isEngaging || state.activationStage !== 'BUILDUP') return;
      setActivationStage('BREAKTHROUGH');
      window.blueprintAudio.playApprovalAndActivation(false);
      if (DOM.stampSignature) DOM.stampSignature.textContent = 'DRAWING CERTIFIED // APERTURE FORMING';
      DOM.approvalStamp.classList.remove('hidden');
      DOM.systemStatus.textContent = 'BREAKTHROUGH // DRAWING CERTIFIED';
      DOM.systemStatus.className = 'val status-indicator engaging';
      DOM.telemetryFlux.textContent = 'APERTURE FORMING // NOT CONNECTED';
      logMessage('APPROVAL IMPACT CONFIRMED — METRIC APERTURE FORMING.');

      laterInDraft(() => {
        if (!state.isEngaging || state.activationStage !== 'BREAKTHROUGH') return;
        state.isEngaging = false;
        state.isConnected = true;
        setActivationStage('SUSTAINED_ACTIVE');
        if (DOM.stampSignature) DOM.stampSignature.textContent = 'METRIC EXPANSION MANIFOLD: ACTIVE';
        DOM.systemStatus.textContent = 'TOPOLOGY ACTIVE // LOCKED';
        DOM.systemStatus.className = 'val status-indicator active';
        DOM.telemetryFlux.textContent = '8,420.50 Å-RAD (STEADY)';
        logMessage('METRIC EXPANSION MANIFOLD RESOLVED — TOPOLOGICAL TRANSIT CHANNEL OPEN.');
        window.blueprintAudio.startAmbientHum();
        startFluxAnimation();
        updateControls();
      }, 600);
    }, 1600);
  }

  // Review Hold Rejection Routine
  function triggerReviewHoldRejection() {
    window.blueprintAudio.playReviewHoldAlert();
    DOM.reviewHoldStamp.classList.remove('hidden');
    DOM.systemStatus.textContent = 'PERMIT HOLD // TRANSMISSION REFUSED';
    DOM.systemStatus.className = 'val status-indicator hold';
    logMessage('⚠ HOLD REJECT: PENDING PEER ARCHITECTURAL REVIEW SIGN-OFF. TRANSMISSION BLOCKED.');

    laterInDraft(() => {
      if (!state.reviewHoldActive) return;
      DOM.reviewHoldStamp.classList.add('hidden');
      if (!state.isConnected) {
        DOM.systemStatus.textContent = 'HOLD ENGAGED // STAGED';
        DOM.systemStatus.className = 'val status-indicator hold';
      }
    }, 2800);
  }

  // DISENGAGE CONTROL (HARD REQUIREMENT: Always reachable, never disabled)
  function handleDisengageManifold() {
    cancelDraftWork();
    window.blueprintAudio.playDisengage();

    state.isConnected = false;
    state.isEngaging = false;
    setActivationStage('IDLE');
    state.currentSitePlan = null;

    // Reset stamps
    DOM.approvalStamp.classList.add('hidden');
    DOM.reviewHoldStamp.classList.add('hidden');

    // Stop Flux Animation
    stopFluxAnimation();

    // Revert linework to draft state
    DOM.lockNodes.forEach((node, idx) => {
      node.classList.remove('locked');
      const statEl = document.getElementById(`node-stat-${idx}`);
      if (statEl) statEl.textContent = 'UNLOCKED';
    });
    state.lockedNodes = [];

    // Clear staged sequence
    state.stagedGlyphs = [];
    updateStagedSlots();

    // Clear active card indicators
    DOM.sitePlanCards.forEach(c => c.classList.remove('active-loaded'));

    // Reset telemetry
    DOM.telemetryFlux.textContent = '0.0000 Å-RAD';
    DOM.telemetryTension.textContent = '100.0% EQUILIBRIUM';
    DOM.telemetryDrift.textContent = '±0.000 mm';
    DOM.telemetryActiveVector.textContent = 'NONE';
    rotateCaliperArm(0);

    // Reset status
    if (state.reviewHoldActive) {
      DOM.systemStatus.textContent = 'HOLD ENGAGED // READY';
      DOM.systemStatus.className = 'val status-indicator hold';
    } else {
      DOM.systemStatus.textContent = 'STANDBY / READY';
      DOM.systemStatus.className = 'val status-indicator';
    }

    updateControls();
    logMessage('DRAFT VOIDED & RESET — SCHEMATIC RETURNED TO CLEAN DRAFT SPECIFICATION.');
  }

  // Toggle Review Hold Subsystem
  function toggleReviewHold() {
    state.reviewHoldActive = !state.reviewHoldActive;
    if (state.reviewHoldActive && state.isEngaging) handleDisengageManifold();
    window.blueprintAudio.playPlotterStep();

    if (state.reviewHoldActive) {
      DOM.btnReviewHold.classList.add('active-hold');
      DOM.holdBtnText.textContent = 'REVIEW HOLD: [ENGAGED]';
      DOM.sidebarHoldVal.textContent = 'PERMIT REVIEW: ACTIVE HOLD (LOCKED)';
      DOM.sidebarHoldVal.className = 'hold-status-value hold-active';
      DOM.tbPermitStatus.textContent = 'PEER REVIEW HOLD [PENDING]';
      DOM.tbPermitStatus.className = 'tb-val status-held';
      logMessage('STRUCTURAL REVIEW HOLD ENGAGED — PEER ARCHITECTURAL PERMIT LOCKOUT ACTIVE.');
      if (!state.isConnected) {
        DOM.systemStatus.textContent = 'HOLD ENGAGED // READY';
        DOM.systemStatus.className = 'val status-indicator hold';
      }
    } else {
      DOM.btnReviewHold.classList.remove('active-hold');
      DOM.holdBtnText.textContent = 'REVIEW HOLD: [DISENGAGED]';
      DOM.sidebarHoldVal.textContent = 'PERMIT REVIEW: CLEAR (NOMINAL)';
      DOM.sidebarHoldVal.className = 'hold-status-value';
      DOM.tbPermitStatus.textContent = 'CLEAR / UNRESTRICTED';
      DOM.tbPermitStatus.className = 'tb-val status-ok';
      DOM.reviewHoldStamp.classList.add('hidden');
      logMessage('STRUCTURAL REVIEW HOLD DISENGAGED — PERMIT VALIDATION CLEAR.');
      if (!state.isConnected) {
        DOM.systemStatus.textContent = 'STANDBY / READY';
        DOM.systemStatus.className = 'val status-indicator';
      }
    }
    updateControls();
  }

  // Clear Staged Buffer without full disengage
  function clearStagedBuffer() {
    cancelDraftWork();
    state.currentSitePlan = null;
    if (state.isConnected || state.isEngaging) {
      handleDisengageManifold();
      return;
    }
    window.blueprintAudio.playPenScratch();
    DOM.reviewHoldStamp.classList.add('hidden');
    DOM.systemStatus.textContent = state.reviewHoldActive ? 'HOLD ENGAGED // READY' : 'STANDBY / READY';
    DOM.systemStatus.className = state.reviewHoldActive ? 'val status-indicator hold' : 'val status-indicator';
    state.stagedGlyphs = [];
    state.lockedNodes = [];
    DOM.lockNodes.forEach((node, idx) => {
      node.classList.remove('locked');
      const statEl = document.getElementById(`node-stat-${idx}`);
      if (statEl) statEl.textContent = 'UNLOCKED';
    });
    updateStagedSlots();
    rotateCaliperArm(0);
    DOM.sitePlanCards.forEach(c => c.classList.remove('active-loaded'));
    DOM.telemetryActiveVector.textContent = 'NONE';
    logMessage('COORDINATE BUFFER CLEARED.');
    updateControls();
  }

  // Archive plotter replays each coordinate through the manual inking path.
  // It stages a draft only; approval always requires a separate action.
  function loadSitePlan(planId, symbols, cardElement) {
    if (symbols.length !== 6 || symbols.some(index => !GLYPHS[index])) return;
    handleDisengageManifold();
    if (cardElement) cardElement.classList.add('active-loaded');
    state.currentSitePlan = planId;
    state.isPlottingPlan = true;
    const generation = draftGeneration;
    let cursor = 0;
    const plotNext = () => {
      if (generation !== draftGeneration || !state.isPlottingPlan || state.isConnected) return;
      handleGlyphSelect(symbols[cursor++], true);
      if (cursor < symbols.length) {
        logMessage(`ARCHIVE PLOTTER [${planId.toUpperCase()}]: INKING VECTOR ${cursor}/6...`);
        laterInDraft(plotNext, 120);
      } else {
        state.isPlottingPlan = false;
        DOM.systemStatus.textContent = 'PLAN STAGED // AWAITING APPROVAL';
        DOM.systemStatus.className = 'val status-indicator';
        logMessage(`SITE PLAN [${planId.toUpperCase()}] STAGED — PRESS ENGAGE TO APPROVE.`);
        updateControls();
      }
    };
    plotNext();
  }

  // Update UI Control States
  function updateControls() {
    // Engage button is active only when exactly 6 glyphs are staged
    if (state.stagedGlyphs.length === 6 && !state.isConnected && !state.isEngaging && !state.isPlottingPlan) {
      DOM.btnEngage.disabled = false;
    } else {
      DOM.btnEngage.disabled = true;
    }

    // DISENGAGE CONTROL IS NEVER DISABLED - Always clickable
    DOM.btnDisengage.disabled = false;
  }

  // Canvas Setup & Topological Ray-Traced Hyperbolic Flux Renderer
  function setupCanvas() {
    if (!DOM.apertureCanvas) return;
    fluxCtx = DOM.apertureCanvas.getContext('2d');
  }

  function startFluxAnimation() {
    if (!DOM.apertureCanvas || !fluxCtx) return;
    DOM.apertureCanvas.classList.add('active');
    if (!fluxAnimId) {
      renderFluxFrame();
    }
  }

  function stopFluxAnimation() {
    if (fluxAnimId) {
      cancelAnimationFrame(fluxAnimId);
      fluxAnimId = null;
    }
    if (DOM.apertureCanvas && fluxCtx) {
      DOM.apertureCanvas.classList.remove('active');
      fluxCtx.clearRect(0, 0, 600, 600);
    }
  }

  function renderFluxFrame() {
    if (!state.isConnected) return;
    fluxPhase += 0.035;

    const ctx = fluxCtx;
    ctx.clearRect(0, 0, 600, 600);

    const cx = 300;
    const cy = 300;
    const maxR = 215;

    // Dark radial gradient background
    const bgGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, maxR);
    bgGrad.addColorStop(0, 'rgba(0, 245, 212, 0.45)');
    bgGrad.addColorStop(0.4, 'rgba(6, 40, 80, 0.6)');
    bgGrad.addColorStop(1, 'rgba(2, 12, 24, 0.9)');
    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
    ctx.fill();

    // Hyperbolic wireframe concentric rings
    ctx.strokeStyle = '#00f5d4';
    for (let r = 20; r < maxR; r += 22) {
      const wave = Math.sin(fluxPhase * 2 - r * 0.05) * 4;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx, cy, r + wave, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Swirling topological vector streamlines
    const streamCount = 12;
    for (let i = 0; i < streamCount; i++) {
      const baseAngle = (i * Math.PI * 2) / streamCount + fluxPhase;
      ctx.beginPath();
      ctx.strokeStyle = i % 2 === 0 ? '#40e0d0' : '#ffffff';
      ctx.lineWidth = i % 2 === 0 ? 1.5 : 0.8;

      for (let step = 0; step < 40; step++) {
        const radius = (step / 40) * maxR;
        const spiralAngle = baseAngle + (step * 0.08);
        const x = cx + radius * Math.cos(spiralAngle);
        const y = cy + radius * Math.sin(spiralAngle);
        if (step === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Center Singularity Core
    const corePulse = 18 + Math.sin(fluxPhase * 3) * 5;
    const coreGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, corePulse);
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.5, '#00f5d4');
    coreGrad.addColorStop(1, 'rgba(0, 245, 212, 0)');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, corePulse, 0, Math.PI * 2);
    ctx.fill();

    fluxAnimId = requestAnimationFrame(renderFluxFrame);
  }

  // Operator Reference Modal Handlers
  function openHelpModal() {
    DOM.modal.classList.remove('hidden');
    window.blueprintAudio.playPlotterStep();
  }

  function closeHelpModal() {
    DOM.modal.classList.add('hidden');
    window.blueprintAudio.playPlotterStep();
  }

  // Title Block Dynamic Date / Clock
  function updateClock() {
    const now = new Date();
    const isoDate = now.toISOString().slice(0, 10);
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const mins = String(now.getUTCMinutes()).padStart(2, '0');
    const secs = String(now.getUTCSeconds()).padStart(2, '0');
    DOM.tbClock.textContent = `${isoDate} // ${hours}:${mins}:${secs}Z`;
  }

  // Prompt Log Notification
  function logMessage(msg) {
    if (DOM.promptLog) {
      DOM.promptLog.textContent = msg;
    }
  }

  // Expose state and methods for testing
  window.__BLUEPRINT_CAD_API__ = {
    getState: () => ({ ...state }),
    selectGlyph: handleGlyphSelect,
    engage: handleEngageManifold,
    disengage: handleDisengageManifold,
    toggleHold: toggleReviewHold,
    clearBuffer: clearStagedBuffer,
    loadPlan: (id) => {
      const card = document.querySelector(`.site-plan-card[data-plan-id="${id}"]`);
      if (card) {
        const symbols = card.dataset.symbols.split(',').map(s => parseInt(s.trim(), 10));
        loadSitePlan(id, symbols, card);
      }
    }
  };

  // Bootstrap on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStation);
  } else {
    initStation();
  }

})();
