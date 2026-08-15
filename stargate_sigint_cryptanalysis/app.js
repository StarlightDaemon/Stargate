/**
 * DSCR // STATION VORTEX-9 — CRYPTANALYSIS & KEY RECOVERY WORKSTATION
 * Core Application Engine & Synthesized Audio Subsystem
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. CONSTANTS & CONFIGURATION
  // =========================================================================

  const ROTOR_COUNT = 10;
  const REGISTER_COUNT = 8;
  const TOTAL_KEYSPACE = Math.pow(16, 8); // 4,294,967,296
  const MAX_ENTROPY = 32.000; // 8 * 4 bits

  const GLYPHS = [
    { symbol: 'Ω', label: 'OMEGA', hex: '0x0', val: 0 },
    { symbol: 'Ψ', label: 'PSI', hex: '0x1', val: 1 },
    { symbol: 'Δ', label: 'DELTA', hex: '0x2', val: 2 },
    { symbol: 'Ξ', label: 'XI', hex: '0x3', val: 3 },
    { symbol: 'Σ', label: 'SIGMA', hex: '0x4', val: 4 },
    { symbol: 'Φ', label: 'PHI', hex: '0x5', val: 5 },
    { symbol: 'Θ', label: 'THETA', hex: '0x6', val: 6 },
    { symbol: 'Λ', label: 'LAMBDA', hex: '0x7', val: 7 },
    { symbol: 'Γ', label: 'GAMMA', hex: '0x8', val: 8 },
    { symbol: 'Π', label: 'PI', hex: '0x9', val: 9 },
    { symbol: '⟁', label: 'PRISM', hex: '0xA', val: 10 },
    { symbol: '⨂', label: 'TENSOR', hex: '0xB', val: 11 },
    { symbol: '⬡', label: 'LATTICE', hex: '0xC', val: 12 },
    { symbol: '✦', label: 'VECTOR', hex: '0xD', val: 13 },
    { symbol: '∿', label: 'SINE', hex: '0xE', val: 14 },
    { symbol: '⧫', label: 'NIBBLE', hex: '0xF', val: 15 }
  ];

  const PRESETS = {
    p1: {
      callsign: 'ORION-ALPHA // RELAY 01',
      tier: 'verified',
      freq: '842.10 MHz',
      keys: ['Ω', 'Ψ', 'Δ', 'Ξ', 'Σ', 'Φ', 'Θ', 'Λ'],
      decoded: 'TRANSMISSION VERIFIED: ORION-ALPHA QUANTUM BEACON LINK SYNCHRONIZED. TELEMETRY STREAM STABLE.'
    },
    p2: {
      callsign: 'CYGNUS-DEEP // ARRAY 04',
      tier: 'verified',
      freq: '915.44 MHz',
      keys: ['Δ', 'Ω', 'Γ', 'Π', '⟁', '⨂', '⬡', '✦'],
      decoded: 'TRANSMISSION VERIFIED: CYGNUS DEEP-SPACE RELAY INTERCEPT SECURED. ENCRYPTION HANDSHAKE ACCEPTED.'
    },
    p3: {
      callsign: 'KEPLER-GRID // NODE 19',
      tier: 'verified',
      freq: '433.82 MHz',
      keys: ['Ψ', '∿', '⧫', 'Ω', 'Δ', 'Σ', 'Θ', 'Π'],
      decoded: 'TRANSMISSION VERIFIED: KEPLER SUB-LATTICE CARRIER RECOVERED. PACKET FLUX NOMINAL (14.4 Gb/s).'
    },
    p4: {
      callsign: 'SHADOW-VECTOR // UNK-09',
      tier: 'suspect',
      freq: '1204.6 MHz',
      keys: ['Ξ', '⬡', '✦', '∿', '⧫', 'Ω', 'Ψ', 'Δ'],
      decoded: 'SUSPECT INTERCEPT BROKEN: HOSTILE RECON NODE DETECTED. VECTOR LOGS EXTRACTED: SECTOR 08-ETA.'
    },
    p5: {
      callsign: 'PHANTOM-CASCADE // ECHO',
      tier: 'suspect',
      freq: '612.08 MHz',
      keys: ['Σ', '⟁', '⨂', '⬡', '✦', '∿', '⧫', 'Ω'],
      decoded: 'ANOMALY RESOLVED: HARMONIC SPECTRAL ECHO DECYPHERED. SOURCE: CLASSIFIED ORBITAL MIRROR.'
    },
    p6: {
      callsign: 'BLACK-SKY // VECTOR-X',
      tier: 'suspect',
      freq: '2488.9 MHz',
      keys: ['Φ', '⧫', '∿', '✦', '⬡', '⨂', '⟁', 'Π'],
      decoded: 'CRYPTIC STREAM CRACKED: EXOTIC HIGH-ENERGY RELAY BREACHED. DATA PAYLOAD ARCHIVED TO DSCR VAULT.'
    }
  };

  // =========================================================================
  // 2. WEB AUDIO SYNTHESIZER
  // =========================================================================

  class CryptAudioEngine {
    constructor() {
      this.ctx = null;
      this.droneOsc1 = null;
      this.droneOsc2 = null;
      this.droneGain = null;
      this.isAudioReady = false;
    }

    init() {
      if (this.isAudioReady && this.ctx) return;
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        this.isAudioReady = true;
      } catch (e) {
        console.warn('Web Audio not supported:', e);
      }
    }

    ensureContext() {
      this.init();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    // High-speed hypothesis tick
    playTick() {
      if (!this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200 + Math.random() * 600, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.03);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.03);
      } catch (e) {}
    }

    // Sub-key lock crystal chirp
    playKeyLock() {
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'triangle';
        osc2.type = 'sine';

        osc1.frequency.setValueAtTime(1760, now); // A6
        osc1.frequency.exponentialRampToValueAtTime(3520, now + 0.08); // A7

        osc2.frequency.setValueAtTime(880, now);
        osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.08);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.25);
        osc2.stop(now + 0.25);
      } catch (e) {}
    }

    // Warning Interlock Buzzer
    playInterlockAlarm() {
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.setValueAtTime(140, now + 0.1);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      } catch (e) {}
    }

    // Stage 1 Buildup Sound
    playBuildup(durationSeconds = 2.5) {
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        
        // Rising Sweep Oscillator
        const sweepOsc = this.ctx.createOscillator();
        const sweepGain = this.ctx.createGain();
        sweepOsc.type = 'sawtooth';
        sweepOsc.frequency.setValueAtTime(110, now);
        sweepOsc.frequency.exponentialRampToValueAtTime(1800, now + durationSeconds);

        // Filter
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, now);
        filter.frequency.exponentialRampToValueAtTime(4500, now + durationSeconds);

        sweepGain.gain.setValueAtTime(0.01, now);
        sweepGain.gain.linearRampToValueAtTime(0.15, now + durationSeconds);

        sweepOsc.connect(filter);
        filter.connect(sweepGain);
        sweepGain.connect(this.ctx.destination);

        sweepOsc.start(now);
        sweepOsc.stop(now + durationSeconds);
      } catch (e) {}
    }

    // Stage 2 Breakthrough Impact
    playBreakthrough() {
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;

        // Sub-bass heavy punch
        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(140, now);
        subOsc.frequency.exponentialRampToValueAtTime(35, now + 0.6);

        subGain.gain.setValueAtTime(0.4, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        subOsc.connect(subGain);
        subGain.connect(this.ctx.destination);
        subOsc.start(now);
        subOsc.stop(now + 1.2);

        // Resonant resolution chime chord (Major 9th high harmonic)
        const chordNotes = [523.25, 659.25, 783.99, 987.77, 1174.66]; // C5, E5, G5, B5, D6
        chordNotes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(0.05 / (idx + 1), now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 1.8);
        });
      } catch (e) {}
    }

    // Stage 3 Sustained Plasma Hum
    startSustainedHum() {
      if (!this.ctx) return;
      try {
        this.stopSustainedHum();
        const now = this.ctx.currentTime;
        this.droneOsc1 = this.ctx.createOscillator();
        this.droneOsc2 = this.ctx.createOscillator();
        this.droneGain = this.ctx.createGain();

        this.droneOsc1.type = 'sawtooth';
        this.droneOsc2.type = 'sine';

        this.droneOsc1.frequency.setValueAtTime(55, now); // A1
        this.droneOsc2.frequency.setValueAtTime(110.5, now); // slight detune

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(180, now);

        this.droneGain.gain.setValueAtTime(0.001, now);
        this.droneGain.gain.linearRampToValueAtTime(0.07, now + 1.0);

        this.droneOsc1.connect(filter);
        this.droneOsc2.connect(filter);
        filter.connect(this.droneGain);
        this.droneGain.connect(this.ctx.destination);

        this.droneOsc1.start(now);
        this.droneOsc2.start(now);
      } catch (e) {}
    }

    stopSustainedHum() {
      if (!this.ctx) return;
      try {
        if (this.droneGain) {
          this.droneGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.4);
          setTimeout(() => {
            if (this.droneOsc1) { this.droneOsc1.stop(); this.droneOsc1.disconnect(); this.droneOsc1 = null; }
            if (this.droneOsc2) { this.droneOsc2.stop(); this.droneOsc2.disconnect(); this.droneOsc2 = null; }
            if (this.droneGain) { this.droneGain.disconnect(); this.droneGain = null; }
          }, 450);
        }
      } catch (e) {}
    }

    // Disengage Sever Click
    playSever() {
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.3);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      } catch (e) {}
    }
  }

  // =========================================================================
  // 3. APPLICATION STATE
  // =========================================================================

  const audio = new CryptAudioEngine();

  const state = {
    systemState: 'IDLE', // 'IDLE', 'DIALING', 'READY', 'BUILDUP', 'BREAKTHROUGH', 'SUSTAINED_ACTIVE'
    interlockEngaged: false, // DEFAULT MUST BE RELEASED (FALSE)
    activeSlotIndex: 0,
    lockedKeys: new Array(REGISTER_COUNT).fill(null),
    currentPreset: null,
    isHypothesisCycling: false,
    activeTransmissionText: 'STREAM AWAITING APERTURE DECRYPTION',
    streamInterval: null,
    animationFrameId: null,
    buildupStartTime: 0,
    buildupDuration: 2500, // 2.5 seconds
    breakthroughStartTime: 0
  };

  // =========================================================================
  // 4. DOM ELEMENTS
  // =========================================================================

  const el = {
    viewportScaler: document.getElementById('viewport-scaler'),
    consoleRoot: document.getElementById('console-root'),
    clockDisplay: document.getElementById('clock-display'),
    carrierIndicator: document.getElementById('carrier-indicator'),
    statKeyspace: document.getElementById('stat-keyspace'),
    statEntropy: document.getElementById('stat-entropy'),
    statCoherence: document.getElementById('stat-coherence'),
    ringUncertainty: document.getElementById('ring-uncertainty-readout'),
    registerCountStatus: document.getElementById('register-count-status'),
    slotFocusIndicator: document.getElementById('slot-focus-indicator'),
    ciphertextFeed: document.getElementById('ciphertext-feed'),
    decryptedContent: document.getElementById('decrypted-content'),
    stateTextPrimary: document.getElementById('state-text-primary'),
    stateTextSecondary: document.getElementById('state-text-secondary'),
    safetyInterlockBtn: document.getElementById('safety-interlock'),
    interlockStatusText: document.getElementById('interlock-status-text'),
    interlockAlert: document.getElementById('interlock-alert'),
    btnActivate: document.getElementById('btn-activate'),
    btnActivateSub: document.getElementById('btn-activate-sub'),
    activationProgress: document.getElementById('activation-progress'),
    btnDisengage: document.getElementById('btn-disengage'),
    btnBackspace: document.getElementById('btn-backspace'),
    btnClearKeys: document.getElementById('btn-clear-keys'),
    systemReadinessBadge: document.getElementById('system-readiness-badge'),
    opLog: document.getElementById('op-log'),
    footerModeText: document.getElementById('footer-mode-text'),
    canvas: document.getElementById('aperture-canvas'),
    ctx: null,
    opRefBtn: document.getElementById('op-ref-btn'),
    refModal: document.getElementById('ref-modal'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
    modalDismissBtn: document.getElementById('modal-dismiss-btn'),
    glyphPad: document.getElementById('glyph-pad'),
    registerSlotsGrid: document.getElementById('register-slots-grid')
  };

  if (el.canvas) {
    el.ctx = el.canvas.getContext('2d');
  }

  // =========================================================================
  // 5. VIEWPORT SCALER (1920x1080 Base -> 4K Responsive)
  // =========================================================================

  function computeScale() {
    const targetWidth = 1920;
    const targetHeight = 1080;
    const currentWidth = window.innerWidth;
    const currentHeight = window.innerHeight;

    // Unitless bare number scaling factor
    const scale = Math.min(currentWidth / targetWidth, currentHeight / targetHeight);
    document.documentElement.style.setProperty('--ui-scale', scale.toString());
  }

  window.addEventListener('resize', computeScale);
  computeScale();

  // =========================================================================
  // 6. OPERATIONAL LOG & TELEMETRY
  // =========================================================================

  function getTimestamp() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
  }

  function addLog(message, type = 'sys') {
    if (!el.opLog) return;
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = `[${getTimestamp()}] ${message}`;
    el.opLog.appendChild(entry);
    el.opLog.scrollTop = el.opLog.scrollHeight;
  }

  function updateClock() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const ms = String(d.getUTCMilliseconds()).padStart(3, '0');
    if (el.clockDisplay) {
      el.clockDisplay.textContent = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}.${ms} UTC`;
    }
  }
  setInterval(updateClock, 33);

  // =========================================================================
  // 7. CIPHERTEXT STREAM CASCADE
  // =========================================================================

  function generateRandomHexLine() {
    const hexChars = '0123456789ABCDEF';
    let block1 = '';
    let block2 = '';
    let block3 = '';
    for (let i = 0; i < 8; i++) block1 += hexChars[Math.floor(Math.random() * 16)];
    for (let i = 0; i < 8; i++) block2 += hexChars[Math.floor(Math.random() * 16)];
    for (let i = 0; i < 8; i++) block3 += hexChars[Math.floor(Math.random() * 16)];
    return `${block1}  ${block2}  ${block3}`;
  }

  function initCipherStream() {
    if (!el.ciphertextFeed) return;
    el.ciphertextFeed.innerHTML = '';
    for (let i = 0; i < 7; i++) {
      const line = document.createElement('div');
      line.className = 'stream-line';
      line.textContent = generateRandomHexLine();
      el.ciphertextFeed.appendChild(line);
    }

    if (state.streamInterval) clearInterval(state.streamInterval);
    state.streamInterval = setInterval(() => {
      if (!el.ciphertextFeed) return;
      const first = el.ciphertextFeed.firstElementChild;
      if (first) el.ciphertextFeed.removeChild(first);
      const newLine = document.createElement('div');
      newLine.className = 'stream-line';
      if (state.systemState === 'SUSTAINED_ACTIVE') {
        newLine.className = 'stream-line highlight-stream';
        newLine.textContent = `DECODED: 0x${Math.floor(Math.random()*0xFFFFFFFF).toString(16).toUpperCase()} [CARRIER LOCK]`;
      } else if (state.systemState === 'BUILDUP') {
        newLine.className = 'stream-line highlight-stream';
        newLine.textContent = `CRACKING >> 0x${Math.floor(Math.random()*0xFFFFFFFF).toString(16).toUpperCase()} ...`;
      } else {
        newLine.textContent = generateRandomHexLine();
      }
      el.ciphertextFeed.appendChild(newLine);
    }, 120);
  }
  initCipherStream();

  // =========================================================================
  // 8. METRICS & ENTROPY COLLAPSE CALCULATOR
  // =========================================================================

  function updateKeySpaceMetrics() {
    const lockedCount = state.lockedKeys.filter(k => k !== null).length;
    const remainingPower = 8 - lockedCount;
    const remainingKeys = Math.pow(16, remainingPower);
    const entropy = (remainingPower * 4).toFixed(3);
    const coherence = ((lockedCount / 8) * 100).toFixed(2);
    const uncertaintyPct = ((remainingKeys / TOTAL_KEYSPACE) * 100);

    let uncertaintyStr = uncertaintyPct > 0.01 
      ? uncertaintyPct.toFixed(2) + '% UNKNOWN' 
      : (lockedCount === 8 ? '0.00% [ZERO ENTROPY]' : '< 0.01% UNKNOWN');

    let keySpaceStr = remainingKeys > 1e6 
      ? (remainingKeys / 1e9).toFixed(3) + ' × 10⁹ KEYS'
      : (remainingKeys > 1 ? remainingKeys.toLocaleString() + ' KEYS' : '1 UNIQUE STATE');

    if (el.statKeyspace) el.statKeyspace.textContent = keySpaceStr;
    if (el.statEntropy) el.statEntropy.textContent = `${entropy} BITS`;
    if (el.statCoherence) el.statCoherence.textContent = `${coherence}%`;
    if (el.ringUncertainty) el.ringUncertainty.textContent = uncertaintyStr;
    if (el.registerCountStatus) el.registerCountStatus.textContent = `${lockedCount} OF 8 SUB-KEYS PINNED`;
    if (el.slotFocusIndicator) {
      el.slotFocusIndicator.textContent = state.activeSlotIndex < 8 
        ? `ACTIVE SLOT: ${state.activeSlotIndex + 1}` 
        : 'ALL 8 SLOTS PINNED';
    }

    // Update activation button arming state (STRICTLY NON-AUTO-FIRED)
    if (lockedCount === 8 && state.systemState !== 'BUILDUP' && state.systemState !== 'BREAKTHROUGH' && state.systemState !== 'SUSTAINED_ACTIVE') {
      state.systemState = 'READY';
      el.btnActivate.disabled = false;
      el.btnActivateSub.textContent = 'KEY-SPACE COLLAPSED // READY FOR FIRING';
      el.systemReadinessBadge.textContent = 'ARMED // READY';
      el.systemReadinessBadge.style.color = '#00ff9d';
      el.stateTextPrimary.textContent = 'KEY MATRIX RESOLVED';
      el.stateTextSecondary.textContent = 'EXECUTE APERTURE DECRYPTION';
    } else if (lockedCount < 8 && (state.systemState === 'READY' || state.systemState === 'DIALING')) {
      state.systemState = lockedCount > 0 ? 'DIALING' : 'IDLE';
      el.btnActivate.disabled = true;
      el.btnActivateSub.textContent = 'REQUIRES ALL 8 SUB-KEYS LOCKED';
      el.systemReadinessBadge.textContent = 'DISARMED';
      el.systemReadinessBadge.style.color = '#00f0ff';
      el.stateTextPrimary.textContent = lockedCount > 0 ? 'SEARCH MATRIX ACTIVE' : 'SEARCH MATRIX IDLE';
      el.stateTextSecondary.textContent = `${8 - lockedCount} SUB-KEYS REMAINING`;
    }
  }

  // =========================================================================
  // 9. HYPOTHESIS SAMPLING & KEY LOCKING MECHANISM
  // =========================================================================

  function updateSlotUI() {
    for (let i = 0; i < REGISTER_COUNT; i++) {
      const slotEl = document.getElementById(`slot-${i}`);
      const glyphEl = document.getElementById(`slot-glyph-${i}`);
      const hexEl = document.getElementById(`slot-hex-${i}`);
      const statusEl = document.getElementById(`slot-status-${i}`);

      if (!slotEl) continue;

      slotEl.classList.remove('active-slot', 'locked-slot', 'testing-slot');

      if (state.lockedKeys[i] !== null) {
        const glyphObj = GLYPHS.find(g => g.symbol === state.lockedKeys[i]);
        slotEl.classList.add('locked-slot');
        glyphEl.textContent = glyphObj.symbol;
        hexEl.textContent = glyphObj.hex;
        statusEl.textContent = 'PINNED';
      } else if (i === state.activeSlotIndex) {
        slotEl.classList.add('active-slot');
        glyphEl.textContent = '--';
        hexEl.textContent = '0x00';
        statusEl.textContent = 'SEEKING';
      } else {
        glyphEl.textContent = '--';
        hexEl.textContent = '0x00';
        statusEl.textContent = 'UNSET';
      }
    }
  }

  function pinKey(glyphSymbol) {
    if (state.isHypothesisCycling) return;
    if (state.activeSlotIndex >= REGISTER_COUNT) return;
    if (state.systemState === 'BUILDUP' || state.systemState === 'BREAKTHROUGH' || state.systemState === 'SUSTAINED_ACTIVE') return;

    audio.ensureContext();
    const targetSlotIndex = state.activeSlotIndex;
    const targetSlotEl = document.getElementById(`slot-${targetSlotIndex}`);
    const glyphEl = document.getElementById(`slot-glyph-${targetSlotIndex}`);
    const hexEl = document.getElementById(`slot-hex-${targetSlotIndex}`);
    const statusEl = document.getElementById(`slot-status-${targetSlotIndex}`);

    state.isHypothesisCycling = true;
    state.systemState = 'DIALING';
    if (targetSlotEl) targetSlotEl.classList.add('testing-slot');
    if (statusEl) statusEl.textContent = 'TESTING...';

    let tickCount = 0;
    const maxTicks = 6;
    const tickInterval = setInterval(() => {
      const randomGlyph = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      if (glyphEl) glyphEl.textContent = randomGlyph.symbol;
      if (hexEl) hexEl.textContent = randomGlyph.hex;
      audio.playTick();
      tickCount++;

      if (tickCount >= maxTicks) {
        clearInterval(tickInterval);
        state.lockedKeys[targetSlotIndex] = glyphSymbol;
        state.activeSlotIndex++;
        state.isHypothesisCycling = false;

        audio.playKeyLock();
        addLog(`ROTOR R-0${targetSlotIndex}: SUB-KEY PINNED [${glyphSymbol}]`, 'sys');

        updateSlotUI();
        updateKeySpaceMetrics();
      }
    }, 45);
  }

  function backspaceKey() {
    if (state.isHypothesisCycling) return;
    if (state.systemState === 'BUILDUP' || state.systemState === 'BREAKTHROUGH' || state.systemState === 'SUSTAINED_ACTIVE') return;
    
    audio.ensureContext();
    if (state.activeSlotIndex > 0) {
      state.activeSlotIndex--;
      state.lockedKeys[state.activeSlotIndex] = null;
      audio.playTick();
      updateSlotUI();
      updateKeySpaceMetrics();
      addLog(`REGISTER PURGED: R-0${state.activeSlotIndex} REVERTED`, 'warn');
    }
  }

  function clearAllKeys() {
    if (state.isHypothesisCycling) return;
    if (state.systemState === 'BUILDUP' || state.systemState === 'BREAKTHROUGH' || state.systemState === 'SUSTAINED_ACTIVE') {
      disengageSystem();
      return;
    }
    audio.ensureContext();
    state.activeSlotIndex = 0;
    state.lockedKeys = new Array(REGISTER_COUNT).fill(null);
    state.currentPreset = null;
    document.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active-preset'));
    audio.playTick();
    updateSlotUI();
    updateKeySpaceMetrics();
    addLog('KEY REGISTERS PURGED: SEARCH MATRIX RESET', 'warn');
  }

  function loadPreset(presetId) {
    const preset = PRESETS[presetId];
    if (!preset) return;
    if (state.isHypothesisCycling) return;
    if (state.systemState === 'BUILDUP' || state.systemState === 'BREAKTHROUGH' || state.systemState === 'SUSTAINED_ACTIVE') {
      disengageSystem();
    }

    audio.ensureContext();
    state.currentPreset = preset;
    state.activeSlotIndex = 0;
    state.lockedKeys = new Array(REGISTER_COUNT).fill(null);

    document.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active-preset'));
    const activeBtn = document.getElementById(`preset-btn-${presetId}`);
    if (activeBtn) activeBtn.classList.add('active-preset');

    addLog(`LOADING INTERCEPT: ${preset.callsign} [${preset.freq}]`, preset.tier === 'verified' ? 'sys' : 'warn');

    // Sequential rapid hypothesis locking
    let step = 0;
    function lockNext() {
      if (step < REGISTER_COUNT) {
        const keySym = preset.keys[step];
        pinKey(keySym);
        step++;
        setTimeout(lockNext, 320);
      }
    }
    lockNext();
  }

  // =========================================================================
  // 10. THREE-STAGE ACTIVATION CONTROLLER (STRICTLY MANUAL TRIGGER)
  // =========================================================================

  function triggerActivation() {
    audio.ensureContext();

    // 1. Safety Interlock Check
    if (state.interlockEngaged) {
      audio.playInterlockAlarm();
      el.interlockAlert.style.display = 'flex';
      addLog('OPSEC INHIBIT: ACTIVATION BLOCKED BY SAFETY INTERLOCK', 'alert');
      setTimeout(() => {
        if (el.interlockAlert) el.interlockAlert.style.display = 'none';
      }, 3000);
      return;
    }

    // 2. Validate all 8 keys locked
    const lockedCount = state.lockedKeys.filter(k => k !== null).length;
    if (lockedCount < 8) {
      addLog('EXECUTION REJECTED: INSUFFICIENT KEY-SPACE RESOLUTION', 'alert');
      return;
    }

    // 3. Initiate Three-Stage Activation
    startThreeStageActivation();
  }

  function startThreeStageActivation() {
    // STAGE 1: BUILDUP
    state.systemState = 'BUILDUP';
    state.buildupStartTime = performance.now();
    el.btnActivate.disabled = true;
    el.btnActivateSub.textContent = 'STAGE 1: QUANTUM BUILDUP & SPECTRAL CASCADE';
    el.carrierIndicator.textContent = 'CARRIER: BUILDUP PHASE';
    el.carrierIndicator.className = 'tag tag-class';
    el.stateTextPrimary.textContent = 'QUANTUM BUILDUP';
    el.stateTextSecondary.textContent = 'COLLAPSING PHASE BOUNDARIES';
    el.footerModeText.textContent = 'MODE: STAGE 1 // RELATIVISTIC FLUX SURGE';

    addLog('APERTURE DECRYPTION INITIATED: STAGE 1 BUILDUP ACTIVE', 'sys');
    audio.playBuildup(state.buildupDuration / 1000);

    // Progress bar animation
    const progressInterval = setInterval(() => {
      if (state.systemState !== 'BUILDUP') {
        clearInterval(progressInterval);
        el.activationProgress.style.width = '0%';
        return;
      }
      const elapsed = performance.now() - state.buildupStartTime;
      const pct = Math.min(100, (elapsed / state.buildupDuration) * 100);
      el.activationProgress.style.width = `${pct}%`;
    }, 30);

    // Transition to STAGE 2 (BREAKTHROUGH) at 2.5s
    setTimeout(() => {
      if (state.systemState !== 'BUILDUP') return;
      clearInterval(progressInterval);
      el.activationProgress.style.width = '100%';
      executeBreakthrough();
    }, state.buildupDuration);
  }

  function executeBreakthrough() {
    // STAGE 2: BREAKTHROUGH INSTANT
    state.systemState = 'BREAKTHROUGH';
    state.breakthroughStartTime = performance.now();
    el.btnActivateSub.textContent = 'STAGE 2: BREAKTHROUGH // SIGNAL LOCK ACHIEVED';
    el.carrierIndicator.textContent = 'CARRIER: BREAKTHROUGH LOCK';
    el.carrierIndicator.className = 'tag tag-carrier';
    el.stateTextPrimary.textContent = 'BREAKTHROUGH';
    el.stateTextSecondary.textContent = 'QUANTUM APERTURE OPENED';
    el.footerModeText.textContent = 'MODE: STAGE 2 // BREAKTHROUGH RESOLUTION';

    audio.playBreakthrough();
    addLog('DECRYPTION BREAKTHROUGH: CIPHERTEXT RESOLVED INTO PLAINTEXT', 'success');

    // Decrypt content display
    if (state.currentPreset) {
      el.decryptedContent.textContent = state.currentPreset.decoded;
    } else {
      el.decryptedContent.textContent = 'MANUAL CIPHER BROKEN: TRANSMISSION LINK ESTABLISHED. CARRIER 14.4 Gb/s STABLE.';
    }

    // Transition to STAGE 3 (SUSTAINED ACTIVE) after 600ms punch
    setTimeout(() => {
      if (state.systemState !== 'BREAKTHROUGH') return;
      enterSustainedActive();
    }, 600);
  }

  function enterSustainedActive() {
    // STAGE 3: SUSTAINED ACTIVE STATE
    state.systemState = 'SUSTAINED_ACTIVE';
    el.btnActivateSub.textContent = 'STAGE 3: SUSTAINED APERTURE TUNNEL ACTIVE';
    el.carrierIndicator.textContent = 'CARRIER: 100% LOCK (14.4 Gb/s)';
    el.carrierIndicator.className = 'tag tag-carrier';
    el.stateTextPrimary.textContent = 'APERTURE ACTIVE';
    el.stateTextSecondary.textContent = 'CONTINUOUS DATA TRANSPORT';
    el.footerModeText.textContent = 'MODE: STAGE 3 // SUSTAINED TRANSMISSION';

    audio.startSustainedHum();
    addLog('SUSTAINED LINK ACTIVE: QUANTUM TUNNELING FLUX COHERENT', 'success');
  }

  // =========================================================================
  // 11. EMERGENCY DISENGAGE (KILL-SWITCH)
  // =========================================================================

  function disengageSystem() {
    audio.ensureContext();
    audio.stopSustainedHum();
    audio.playSever();

    state.systemState = 'IDLE';
    state.activeSlotIndex = 0;
    state.lockedKeys = new Array(REGISTER_COUNT).fill(null);
    state.currentPreset = null;
    state.isHypothesisCycling = false;

    document.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active-preset'));

    el.btnActivate.disabled = true;
    el.btnActivateSub.textContent = 'REQUIRES ALL 8 SUB-KEYS LOCKED';
    el.activationProgress.style.width = '0%';
    el.systemReadinessBadge.textContent = 'DISARMED';
    el.systemReadinessBadge.style.color = '#00f0ff';
    el.carrierIndicator.textContent = 'CARRIER: IDLE SCAN';
    el.carrierIndicator.className = 'tag tag-carrier';
    el.stateTextPrimary.textContent = 'SEARCH MATRIX IDLE';
    el.stateTextSecondary.textContent = 'INPUT KEY SEQUENCE';
    el.decryptedContent.textContent = '[ AWAITING APERTURE DECRYPTION ]';
    el.footerModeText.textContent = 'MODE: AMBIENT KEY-SPACE SCAN';

    updateSlotUI();
    updateKeySpaceMetrics();
    addLog('EMERGENCY DISENGAGE: CARRIER SEVERED // KEYSTREAM PURGED', 'alert');
  }

  // =========================================================================
  // 12. CANVAS RENDERING ENGINE (THE KEY-SPACE APERTURE RING)
  // =========================================================================

  const particles = [];
  for (let i = 0; i < 120; i++) {
    particles.push({
      x: (Math.random() - 0.5) * 600,
      y: (Math.random() - 0.5) * 600,
      z: Math.random() * 600,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      radius: Math.random() * 2 + 1,
      color: Math.random() > 0.3 ? '#00f0ff' : '#00ff9d'
    });
  }

  let canvasAngle = 0;

  function renderApertureCanvas(time) {
    if (!el.ctx) return;
    const ctx = el.ctx;
    const width = el.canvas.width;
    const height = el.canvas.height;
    const cx = width / 2;
    const cy = height / 2;

    ctx.clearRect(0, 0, width, height);
    canvasAngle += 0.005;

    // 1. Background Grid & Radar Sweep
    ctx.save();
    ctx.translate(cx, cy);

    // Ambient radial rings
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
    ctx.lineWidth = 1;
    [80, 140, 200, 260, 300].forEach(r => {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Crosshair axis
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
    ctx.beginPath();
    ctx.moveTo(-310, 0); ctx.lineTo(310, 0);
    ctx.moveTo(0, -310); ctx.lineTo(0, 310);
    ctx.stroke();

    // 2. Rotor Stations (10 Sectors R-00 to R-09)
    const rotorRadius = 280;
    const lockedCount = state.lockedKeys.filter(k => k !== null).length;

    for (let i = 0; i < ROTOR_COUNT; i++) {
      const angle = (i / ROTOR_COUNT) * Math.PI * 2 - Math.PI / 2;
      const rx = Math.cos(angle) * rotorRadius;
      const ry = Math.sin(angle) * rotorRadius;
      const isLockedSector = i < lockedCount;

      // Rotor Outer Notch
      ctx.fillStyle = isLockedSector ? '#00ff9d' : 'rgba(0, 240, 255, 0.25)';
      ctx.beginPath();
      ctx.arc(rx, ry, isLockedSector ? 7 : 4, 0, Math.PI * 2);
      ctx.fill();

      // Rotor Label
      ctx.font = '9px JetBrains Mono';
      ctx.fillStyle = isLockedSector ? '#00ff9d' : 'rgba(0, 240, 255, 0.4)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const labelDist = rotorRadius + 18;
      ctx.fillText(`R-0${i}`, Math.cos(angle) * labelDist, Math.sin(angle) * labelDist);
    }

    // 3. Collapsing Shannon Entropy & Probability Arc
    const entropyFraction = Math.max(0, 1 - (lockedCount / 8));
    const arcRadius = 250;
    const arcSpan = entropyFraction * Math.PI * 2;

    if (entropyFraction > 0.001) {
      // Dynamic Probability Heatmap Arc (Shrinks as keys lock)
      ctx.save();
      ctx.rotate(canvasAngle * 0.4);
      ctx.lineWidth = 10;
      
      const grad = ctx.createLinearGradient(-arcRadius, 0, arcRadius, 0);
      if (lockedCount === 0) {
        grad.addColorStop(0, '#ff3366');
        grad.addColorStop(0.5, '#ffb300');
        grad.addColorStop(1, '#ff3366');
      } else {
        grad.addColorStop(0, '#00f0ff');
        grad.addColorStop(0.5, '#00ff9d');
        grad.addColorStop(1, '#00f0ff');
      }

      ctx.strokeStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, arcRadius, -arcSpan / 2, arcSpan / 2);
      ctx.stroke();

      // Glowing probability particles on arc
      const pCount = Math.floor(entropyFraction * 30) + 4;
      for (let p = 0; p < pCount; p++) {
        const pAngle = -arcSpan / 2 + (p / pCount) * arcSpan + Math.sin(time * 0.003 + p) * 0.1;
        const px = Math.cos(pAngle) * arcRadius;
        const py = Math.sin(pAngle) * arcRadius;
        ctx.fillStyle = lockedCount === 0 ? '#ffb300' : '#00f0ff';
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    } else {
      // 100% Coherent Laser Ring at 8 keys
      ctx.strokeStyle = '#00ff9d';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#00ff9d';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(0, 0, arcRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // 4. Center Aperture Core Visuals by System State
    if (state.systemState === 'IDLE' || state.systemState === 'DIALING' || state.systemState === 'READY') {
      // Idle Rotating Coordinate Reticle
      ctx.save();
      ctx.rotate(-canvasAngle * 0.8);
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-60, -60, 120, 120);

      ctx.rotate(canvasAngle * 1.5);
      ctx.strokeStyle = state.systemState === 'READY' ? 'rgba(0, 255, 157, 0.6)' : 'rgba(0, 240, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(0, 0, 90, 0, Math.PI * 1.5);
      ctx.stroke();
      ctx.restore();

      // Faint ambient particle drift
      particles.slice(0, 30).forEach(p => {
        p.z -= 0.5;
        if (p.z <= 0) p.z = 600;
        const k = 200 / p.z;
        const sx = p.x * k;
        const sy = p.y * k;
        if (Math.abs(sx) < 160 && Math.abs(sy) < 160) {
          ctx.fillStyle = 'rgba(0, 240, 255, 0.3)';
          ctx.beginPath();
          ctx.arc(sx, sy, p.radius * k * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
      });

    } else if (state.systemState === 'BUILDUP') {
      // STAGE 1: BUILDUP — Converging Relativistic Influx & Surging Light Rays
      const elapsed = performance.now() - state.buildupStartTime;
      const progress = Math.min(1.0, elapsed / state.buildupDuration);

      // Surging vortex rays
      ctx.save();
      ctx.rotate(canvasAngle * (3 + progress * 8));
      const rayCount = 16;
      for (let r = 0; r < rayCount; r++) {
        const ang = (r / rayCount) * Math.PI * 2;
        ctx.strokeStyle = r % 2 === 0 ? 'rgba(0, 240, 255, 0.4)' : 'rgba(255, 179, 0, 0.5)';
        ctx.lineWidth = 1.5 + progress * 3;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang) * (60 + (1 - progress) * 140), Math.sin(ang) * (60 + (1 - progress) * 140));
        ctx.lineTo(Math.cos(ang) * 230, Math.sin(ang) * 230);
        ctx.stroke();
      }
      ctx.restore();

      // Inward accelerating particle storm
      particles.forEach(p => {
        p.z -= 4 + progress * 16;
        if (p.z <= 0) p.z = 600;
        const k = 220 / p.z;
        const sx = p.x * k;
        const sy = p.y * k;
        ctx.fillStyle = progress > 0.7 ? '#ffb300' : '#00f0ff';
        ctx.beginPath();
        ctx.arc(sx, sy, (p.radius * k * (1 + progress * 2)), 0, Math.PI * 2);
        ctx.fill();
      });

      // Expanding core heat glow
      ctx.fillStyle = `rgba(0, 240, 255, ${0.1 + progress * 0.4})`;
      ctx.beginPath();
      ctx.arc(0, 0, 40 + progress * 80, 0, Math.PI * 2);
      ctx.fill();

    } else if (state.systemState === 'BREAKTHROUGH') {
      // STAGE 2: BREAKTHROUGH — Massive Photon Shockwave & Quantum Expansion Burst
      const elapsed = performance.now() - state.breakthroughStartTime;
      const shockwaveRadius = Math.min(300, (elapsed / 600) * 300);

      // Expanding shockwave ring
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 8;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 30;
      ctx.beginPath();
      ctx.arc(0, 0, shockwaveRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Photon burst bloom
      const flashAlpha = Math.max(0, 1 - (elapsed / 600));
      ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha * 0.8})`;
      ctx.beginPath();
      ctx.arc(0, 0, 200, 0, Math.PI * 2);
      ctx.fill();

    } else if (state.systemState === 'SUSTAINED_ACTIVE') {
      // STAGE 3: SUSTAINED ACTIVE — Hyper-dimensional Plasma Wormhole & Coherent Beam Lattice
      
      // Plasma vortex field
      ctx.save();
      ctx.rotate(canvasAngle * 2.2);
      for (let i = 0; i < 8; i++) {
        const rad = 40 + i * 22;
        ctx.strokeStyle = i % 2 === 0 ? 'rgba(0, 255, 157, 0.45)' : 'rgba(0, 240, 255, 0.4)';
        ctx.lineWidth = 2 + Math.sin(time * 0.005 + i) * 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, rad, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // Relativistic particle stream tunnel (flowing through wormhole)
      particles.forEach(p => {
        p.z -= 12;
        if (p.z <= 0) {
          p.z = 600;
          p.x = (Math.random() - 0.5) * 300;
          p.y = (Math.random() - 0.5) * 300;
        }
        const k = 260 / p.z;
        const sx = p.x * k;
        const sy = p.y * k;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(sx, sy, p.radius * k * 1.8, 0, Math.PI * 2);
        ctx.fill();
      });

      // Core plasma singularity
      const pulseGlow = Math.sin(time * 0.008) * 12 + 65;
      const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, pulseGlow);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      grad.addColorStop(0.3, 'rgba(0, 255, 157, 0.7)');
      grad.addColorStop(0.7, 'rgba(0, 240, 255, 0.3)');
      grad.addColorStop(1, 'transparent');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, pulseGlow, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    state.animationFrameId = requestAnimationFrame(renderApertureCanvas);
  }

  // Start Canvas Engine Loop
  requestAnimationFrame(renderApertureCanvas);

  // =========================================================================
  // 13. SAFETY INTERLOCK TOGGLE CONTROLLER
  // =========================================================================

  function toggleSafetyInterlock() {
    audio.ensureContext();
    state.interlockEngaged = !state.interlockEngaged;

    if (state.interlockEngaged) {
      el.safetyInterlockBtn.classList.remove('released');
      el.safetyInterlockBtn.classList.add('engaged');
      el.safetyInterlockBtn.setAttribute('aria-pressed', 'true');
      el.interlockStatusText.textContent = 'ENGAGED [LOCKED]';
      addLog('OPSEC INTERLOCK: ENGAGED // APERTURE TRANSMISSION INHIBITED', 'alert');
      audio.playInterlockAlarm();
    } else {
      el.safetyInterlockBtn.classList.remove('engaged');
      el.safetyInterlockBtn.classList.add('released');
      el.safetyInterlockBtn.setAttribute('aria-pressed', 'false');
      el.interlockStatusText.textContent = 'RELEASED [DISARMED]';
      el.interlockAlert.style.display = 'none';
      addLog('OPSEC INTERLOCK: RELEASED // APERTURE TRANSMISSION ARMED', 'sys');
      audio.playTick();
    }
  }

  // =========================================================================
  // 14. OPERATOR REFERENCE MODAL CONTROLLER
  // =========================================================================

  function openOperatorRef() {
    audio.ensureContext();
    audio.playTick();
    el.refModal.style.display = 'flex';
    el.refModal.setAttribute('aria-hidden', 'false');
  }

  function closeOperatorRef() {
    audio.ensureContext();
    audio.playTick();
    el.refModal.style.display = 'none';
    el.refModal.setAttribute('aria-hidden', 'true');
  }

  // =========================================================================
  // 15. EVENT LISTENERS SETUP
  // =========================================================================

  function initEventListeners() {
    // 1. Commutator Glyph Pad Buttons
    document.querySelectorAll('.glyph-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const glyph = btn.getAttribute('data-glyph');
        if (glyph) pinKey(glyph);
      });
    });

    // 2. Aux Pad Controls
    if (el.btnBackspace) el.btnBackspace.addEventListener('click', backspaceKey);
    if (el.btnClearKeys) el.btnClearKeys.addEventListener('click', clearAllKeys);

    // 3. Intercept Preset Buttons
    document.querySelectorAll('.preset-card').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const presetId = btn.getAttribute('data-preset-id');
        if (presetId) loadPreset(presetId);
      });
    });

    // 4. Primary Execution (Decryption) Trigger (STRICTLY MANUAL)
    if (el.btnActivate) el.btnActivate.addEventListener('click', triggerActivation);

    // 5. Emergency Disengage Kill Switch (ALWAYS ACTIVE)
    if (el.btnDisengage) el.btnDisengage.addEventListener('click', disengageSystem);

    // 6. Safety Interlock Toggle
    if (el.safetyInterlockBtn) el.safetyInterlockBtn.addEventListener('click', toggleSafetyInterlock);

    // 7. Operator Reference Modal
    if (el.opRefBtn) el.opRefBtn.addEventListener('click', openOperatorRef);
    if (el.modalCloseBtn) el.modalCloseBtn.addEventListener('click', closeOperatorRef);
    if (el.modalDismissBtn) el.modalDismissBtn.addEventListener('click', closeOperatorRef);

    // Modal background click & ESC key
    if (el.refModal) {
      el.refModal.addEventListener('click', (e) => {
        if (e.target === el.refModal) closeOperatorRef();
      });
    }
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && el.refModal.style.display === 'flex') {
        closeOperatorRef();
      }
    });

    // 8. Register Slot manual click focus
    document.querySelectorAll('.reg-slot').forEach(slot => {
      slot.addEventListener('click', () => {
        const idx = parseInt(slot.getAttribute('data-slot'), 10);
        if (!isNaN(idx) && idx < REGISTER_COUNT) {
          audio.ensureContext();
          state.activeSlotIndex = idx;
          audio.playTick();
          updateSlotUI();
          updateKeySpaceMetrics();
        }
      });
    });
  }

  // Initialize UI & Listeners
  initEventListeners();
  updateSlotUI();
  updateKeySpaceMetrics();

  // Export for testing / inspection if needed
  window.__DSCR_STATE__ = state;
  window.__DSCR_AUDIO__ = audio;

})();
