/**
 * Axiom Mastering Console - Main Application Controller
 * Handles state transitions, patching logic, activation safety, quick-dial presets,
 * responsive scaling, and operator documentation.
 */

const ConsoleState = {
  IDLE_STANDBY: 'IDLE_STANDBY',
  PATCHING: 'PATCHING',
  ARMED_READY: 'ARMED_READY',
  MASTER_SUMMING_ACTIVE: 'MASTER_SUMMING_ACTIVE',
  LIMITER_BLOCKED: 'LIMITER_BLOCKED'
};

class AxiomApp {
  constructor() {
    this.state = ConsoleState.IDLE_STANDBY;
    this.patchedChannels = []; // array of channel indices [0..9] in dialed order
    this.maxChannels = 7;
    
    // Safety Limiter Interlock - MUST DEFAULT TO RELEASED (false)
    this.limiterEngaged = false;

    // Pending servo-recall timers for an in-flight preset patch sequence
    this.presetRecallTimers = [];

    // Presets (2 distinct tiers, 6 total)
    this.presets = [
      // Tier 1: Calibrated Broadcast Stems (Clean Mastered Arrays)
      { id: 'p1', tier: 'tier1', name: 'Axiom Broadcast Standard', channels: [0, 2, 4, 5, 7, 8, 9], desc: 'Nominal 96kHz / 32-bit Float Reference Master' },
      { id: 'p2', tier: 'tier1', name: 'Sub-Harmonic Deep Core', channels: [0, 1, 3, 4, 6, 7, 8], desc: 'Sub-Octave Resonance Alignment' },
      { id: 'p3', tier: 'tier1', name: 'Crystal Air Spatial Print', channels: [2, 3, 5, 6, 7, 8, 9], desc: 'Ultra-High Frequency Aperture Dispersion' },
      
      // Tier 2: Experimental & Overdriven Routing (Rough / Uncalibrated)
      { id: 'p4', tier: 'tier2', name: 'Overdriven Sidechain Vortex', channels: [1, 2, 4, 6, 7, 8, 0], desc: 'High-Saturation Non-Linear Summing' },
      { id: 'p5', tier: 'tier2', name: 'Phase-Inverted Dark Matrix', channels: [3, 4, 5, 0, 2, 8, 9], desc: 'Harmonic Phase Cancellation Singularity' },
      { id: 'p6', tier: 'tier2', name: 'Quantum Glitch Harmonic', channels: [9, 8, 6, 5, 3, 1, 0], desc: 'Polyrhythmic Formant Cascade' }
    ];
  }

  init() {
    this.applyResponsiveScaling();
    window.addEventListener('resize', () => {
      this.applyResponsiveScaling();
      if (window.AxiomBay) window.AxiomBay.updateAllCablePaths();
    });

    if (window.AxiomVisuals) window.AxiomVisuals.init();
    if (window.AxiomBay) window.AxiomBay.init();

    this.bindEvents();
    this.renderBusSlots();
    this.updateUI();

    console.log('Axiom Mastering Console initialized. Limiter Safety Interlock is RELEASED by default.');
  }

  applyResponsiveScaling() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // Calculate plain unitless scale ratio
    const scale = Math.min(vw / 1920, vh / 1080);
    window.appScale = scale;
    document.documentElement.style.setProperty('--app-scale', scale);
  }

  bindEvents() {
    // 1. Channel Patchbay Jacks (Cluster 1)
    document.querySelectorAll('.patch-jack').forEach(jack => {
      jack.addEventListener('click', (e) => {
        const chIdx = parseInt(jack.getAttribute('data-channel'), 10);
        this.toggleChannelPatch(chIdx);
      });
      // Keyboard: Enter/Space on a focused jack does exactly what a click does.
      jack.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        jack.click();
      });
    });

    // Ring perimeter channel buttons
    document.querySelectorAll('.ring-channel-node').forEach(node => {
      node.addEventListener('click', (e) => {
        const chIdx = parseInt(node.getAttribute('data-channel'), 10);
        this.toggleChannelPatch(chIdx);
      });
    });

    // 2. Master Transport & Summing Deck (Cluster 2)
    const printBtn = document.getElementById('btn-print-master');
    if (printBtn) {
      printBtn.addEventListener('click', () => this.engageMasterPrint());
    }

    const cutBtn = document.getElementById('btn-feed-cut');
    if (cutBtn) {
      cutBtn.addEventListener('click', () => this.disengageMasterFeed());
    }

    // Safety Interlock Toggle
    const limiterToggle = document.getElementById('limiter-safety-toggle');
    if (limiterToggle) {
      limiterToggle.checked = false; // MUST default to released (false)
      limiterToggle.addEventListener('change', (e) => {
        this.limiterEngaged = e.target.checked;
        this.updateLimiterUI();
      });
    }

    // Preset Selector
    const presetSelect = document.getElementById('preset-selector');
    if (presetSelect) {
      presetSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val) this.loadPreset(val);
      });
    }

    // Preset Quick Buttons
    document.querySelectorAll('.btn-quick-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        const presetId = btn.getAttribute('data-preset');
        if (presetId) this.loadPreset(presetId);
      });
    });

    // Audio Mute Toggle
    const muteBtn = document.getElementById('btn-audio-mute');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        const isMuted = !window.AxiomAudio.isMuted;
        window.AxiomAudio.setMute(isMuted);
        muteBtn.classList.toggle('muted', isMuted);
        muteBtn.setAttribute('title', isMuted ? 'Unmute Audio' : 'Mute Audio');
      });
    }

    // Operator Reference (?) Modal
    const helpBtn = document.getElementById('btn-operator-help');
    const helpModal = document.getElementById('operator-help-modal');
    const closeHelpBtn = document.getElementById('btn-close-modal');

    if (helpBtn && helpModal) {
      helpBtn.addEventListener('click', () => {
        helpModal.classList.add('open');
      });
    }

    if (closeHelpBtn && helpModal) {
      closeHelpBtn.addEventListener('click', () => {
        helpModal.classList.remove('open');
      });
    }

    if (helpModal) {
      helpModal.addEventListener('click', (e) => {
        if (e.target === helpModal) helpModal.classList.remove('open');
      });
    }
  }

  renderBusSlots() {
    const busContainer = document.getElementById('master-bus-sequence');
    if (!busContainer) return;

    busContainer.innerHTML = '';
    const busNames = [
      '01: PHASE-ALIGN',
      '02: SUB-CARRIER',
      '03: MODULATOR',
      '04: RESONATOR',
      '05: SPATIAL-BUS',
      '06: SIDECHAIN',
      '07: MASTER-GATE'
    ];

    for (let i = 0; i < this.maxChannels; i++) {
      const slot = document.createElement('div');
      slot.className = 'bus-channel-slot';
      slot.id = `bus-slot-${i}`;
      slot.innerHTML = `
        <div class="bus-slot-header">${busNames[i]}</div>
        <div class="bus-jack" data-bus="${i}">
          <div class="jack-metal-ring"></div>
          <div class="jack-core"></div>
        </div>
        <div class="bus-glyph-display" id="bus-glyph-${i}">--</div>
        <div class="bus-channel-meter">
          <div class="bus-meter-bar" id="bus-bar-${i}"></div>
        </div>
      `;
      busContainer.appendChild(slot);
    }
  }

  toggleChannelPatch(chIdx) {
    if (this.state === ConsoleState.MASTER_SUMMING_ACTIVE) {
      // During active master feed, channels are locked
      return;
    }

    // If channel is already in bus sequence, remove it or ignore
    const existingIndex = this.patchedChannels.indexOf(chIdx);
    if (existingIndex !== -1) {
      // Channel already patched - do nothing or play click
      if (window.AxiomAudio) window.AxiomAudio.playPatchSnap(1.2);
      return;
    }

    // If bus is already full (7/7)
    if (this.patchedChannels.length >= this.maxChannels) {
      if (window.AxiomAudio) window.AxiomAudio.playLimiterWarning();
      return;
    }

    // Add channel to bus
    const nextBusSlot = this.patchedChannels.length;
    this.patchedChannels.push(chIdx);

    // Audio tone + relay sound
    if (window.AxiomAudio) {
      window.AxiomAudio.playChannelLock(chIdx, nextBusSlot);
    }

    // Connect SVG Patch Cable
    if (window.AxiomBay) {
      window.AxiomBay.addCable(chIdx, nextBusSlot);
    }

    // Update state machine
    if (this.patchedChannels.length === this.maxChannels) {
      // STRICT REQUIREMENT: DO NOT AUTO-FIRE!
      this.state = ConsoleState.ARMED_READY;
    } else {
      this.state = ConsoleState.PATCHING;
    }

    this.updateUI();
  }

  /**
   * SERVO PATCHBAY RECALL: presets replay a stored routing snapshot through
   * the motorized patchbay — each cable is re-seated by the same per-channel
   * lock path as a manual patch (toggleChannelPatch: relay audio, SVG cable,
   * state machine), at servo speed rather than hand speed. The 7th cable
   * leaves the console in ARMED_READY; it NEVER auto-prints.
   */
  loadPreset(presetId) {
    const preset = this.presets.find(p => p.id === presetId);
    if (!preset) return;

    this.disengageMasterFeed(); // also cancels any in-flight recall

    const RECALL_STEP_MS = 280; // servo speed: faster than hands, one jack at a time
    preset.channels.forEach((chIdx, i) => {
      const timer = setTimeout(() => {
        this.toggleChannelPatch(chIdx);
      }, RECALL_STEP_MS * (i + 1));
      this.presetRecallTimers.push(timer);
    });
  }

  cancelPresetRecall() {
    this.presetRecallTimers.forEach(t => clearTimeout(t));
    this.presetRecallTimers = [];
  }

  engageMasterPrint() {
    if (this.patchedChannels.length < this.maxChannels) {
      this.setStatusTelemetry('INSUFFICIENT HARMONIC BUSES: 7/7 REQUIRED', 'warn');
      if (window.AxiomAudio) window.AxiomAudio.playLimiterWarning();
      return;
    }

    // Check Safety Interlock (Limiter Ceiling)
    if (this.limiterEngaged) {
      this.state = ConsoleState.LIMITER_BLOCKED;
      this.setStatusTelemetry('ALERT: MASTER LIMITER ENGAGED - SIGNAL CEILING CLAMPED. RELEASE LIMITER TO PRINT', 'error');
      if (window.AxiomAudio) window.AxiomAudio.playLimiterWarning();
      this.updateUI();
      return;
    }

    // ENGAGE MASTER SUMMING CONVERGENCE (Active Portal!)
    this.state = ConsoleState.MASTER_SUMMING_ACTIVE;
    
    if (window.AxiomAudio) {
      window.AxiomAudio.startMasterSumming(this.patchedChannels);
    }
    if (window.AxiomVisuals) {
      window.AxiomVisuals.setPortalActive(true);
    }

    this.setStatusTelemetry('MASTER SUM ACTIVE // PORTAL APERTURE STABLE // 96kHz 32-BIT FLOAT', 'active');
    this.updateUI();
  }

  disengageMasterFeed() {
    // Full disengage & reset — abort any in-flight preset servo recall first
    this.cancelPresetRecall();
    this.state = ConsoleState.IDLE_STANDBY;
    this.patchedChannels = [];

    if (window.AxiomAudio) {
      window.AxiomAudio.playDisengageSound();
    }
    if (window.AxiomBay) {
      window.AxiomBay.clearAllCables();
    }
    if (window.AxiomVisuals) {
      window.AxiomVisuals.setPortalActive(false);
      window.AxiomVisuals.setActiveChannels([]);
    }

    // Reset preset dropdown
    const presetSelect = document.getElementById('preset-selector');
    if (presetSelect) presetSelect.value = '';

    this.setStatusTelemetry('CONSOLE STANDBY // 60Hz IDLE BUS // READY FOR HARMONIC ROUTING', 'idle');
    this.updateUI();
  }

  updateLimiterUI() {
    const limiterStatus = document.getElementById('limiter-status-indicator');
    const limiterLed = document.getElementById('limiter-led');
    
    if (this.limiterEngaged) {
      if (limiterStatus) limiterStatus.textContent = 'LIMITER ENGAGED (HOLD)';
      if (limiterLed) limiterLed.className = 'led-dot led-warn';
      if (this.state === ConsoleState.MASTER_SUMMING_ACTIVE) {
        this.disengageMasterFeed();
      }
    } else {
      if (limiterStatus) limiterStatus.textContent = 'LIMITER RELEASED (ARMED)';
      if (limiterLed) limiterLed.className = 'led-dot led-good';
      if (this.state === ConsoleState.LIMITER_BLOCKED) {
        this.state = ConsoleState.ARMED_READY;
        this.setStatusTelemetry('MASTER BUS ARMED // 7/7 HARMONICS SUMMED - READY TO PRINT', 'ready');
      }
    }
    this.updateUI();
  }

  setStatusTelemetry(msg, mode = 'idle') {
    const el = document.getElementById('master-status-telemetry');
    if (!el) return;
    el.textContent = msg;
    el.className = `status-display status-${mode}`;
  }

  updateUI() {
    // 1. Update Visualizers active channels
    if (window.AxiomVisuals) {
      window.AxiomVisuals.setActiveChannels(this.patchedChannels);
    }

    // 2. Update Ring Nodes and Patchbay Jacks highlighted state
    const channelSet = new Set(this.patchedChannels);
    document.querySelectorAll('.patch-jack').forEach(jack => {
      const ch = parseInt(jack.getAttribute('data-channel'), 10);
      jack.classList.toggle('active-patched', channelSet.has(ch));
    });

    document.querySelectorAll('.ring-channel-node').forEach(node => {
      const ch = parseInt(node.getAttribute('data-channel'), 10);
      node.classList.toggle('active-patched', channelSet.has(ch));
    });

    // 3. Update Master Bus Slots
    for (let i = 0; i < this.maxChannels; i++) {
      const glyphEl = document.getElementById(`bus-glyph-${i}`);
      const barEl = document.getElementById(`bus-bar-${i}`);
      const slotEl = document.getElementById(`bus-slot-${i}`);
      
      if (i < this.patchedChannels.length) {
        const ch = this.patchedChannels[i];
        const chData = window.AxiomBay ? window.AxiomBay.channels[ch] : { glyph: '•' };
        if (glyphEl) glyphEl.textContent = `${chData.glyph} ${chData.freq || ''}`;
        if (barEl) barEl.style.height = this.state === ConsoleState.MASTER_SUMMING_ACTIVE ? '85%' : '45%';
        if (slotEl) slotEl.classList.add('slot-patched');
      } else {
        if (glyphEl) glyphEl.textContent = '--';
        if (barEl) barEl.style.height = '0%';
        if (slotEl) slotEl.classList.remove('slot-patched');
      }
    }

    // 4. Update Main Transport Buttons
    const printBtn = document.getElementById('btn-print-master');
    const cutBtn = document.getElementById('btn-feed-cut');

    if (printBtn) {
      if (this.state === ConsoleState.ARMED_READY) {
        printBtn.classList.add('armed-pulse');
        printBtn.classList.remove('active-printing');
      } else if (this.state === ConsoleState.MASTER_SUMMING_ACTIVE) {
        printBtn.classList.remove('armed-pulse');
        printBtn.classList.add('active-printing');
      } else {
        printBtn.classList.remove('armed-pulse', 'active-printing');
      }
    }

    // 5. Update Status Telemetry Banner based on state
    if (this.state === ConsoleState.IDLE_STANDBY) {
      this.setStatusTelemetry('CONSOLE STANDBY // 60Hz IDLE BUS // READY FOR HARMONIC ROUTING', 'idle');
    } else if (this.state === ConsoleState.PATCHING) {
      this.setStatusTelemetry(`HARMONIC BUSES PATCHED: [${this.patchedChannels.length}/7] // SUMMING CHAIN IN PROGRESS`, 'patching');
    } else if (this.state === ConsoleState.ARMED_READY) {
      this.setStatusTelemetry('MASTER BUS ARMED // 7/7 HARMONICS SUMMED - READY TO PRINT', 'ready');
    } else if (this.state === ConsoleState.MASTER_SUMMING_ACTIVE) {
      this.setStatusTelemetry('MASTER SUM ACTIVE // PORTAL APERTURE STABLE // STREAM: 96kHz 32-BIT FLOAT', 'active');
    } else if (this.state === ConsoleState.LIMITER_BLOCKED) {
      this.setStatusTelemetry('ALERT: MASTER LIMITER ENGAGED - SIGNAL CEILING CLAMPED. RELEASE LIMITER TO PRINT', 'error');
    }

    // 6. Update Address Telemetry Badge
    const addressBadge = document.getElementById('address-sequence-badge');
    if (addressBadge) {
      if (this.patchedChannels.length === 0) {
        addressBadge.textContent = 'ROUTING SEQUENCE: [NONE]';
      } else {
        const glyphs = this.patchedChannels.map(c => window.AxiomBay.channels[c]?.glyph || c).join(' ➔ ');
        addressBadge.textContent = `ROUTING SEQUENCE: [ ${glyphs} ]`;
      }
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.AxiomApp = new AxiomApp();
  window.AxiomApp.init();
});
