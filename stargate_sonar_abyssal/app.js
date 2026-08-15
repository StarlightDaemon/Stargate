/**
 * Abyssal Sonar Command Console (SGC-NAUT-01)
 * Quantum Bathymetric Transducer Array Dialing Logic
 */

(function() {
  'use strict';

  // --- AUDIO SYNTHESIZER SUBSYSTEM (Web Audio API) ---
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  const SoundFX = {
    ping(freq = 960, dur = 0.8) {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.95, ctx.currentTime + dur);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    },
    lockChime(stepIndex = 0) {
      const ctx = getAudioContext();
      if (!ctx) return;
      const freqs = [440, 523.25, 587.33, 659.25, 783.99, 880, 1046.5];
      const base = freqs[stepIndex % freqs.length];
      [base, base * 1.5].forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, ctx.currentTime);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
      });
    },
    alarm() {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.15);
      osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    },
    activationVortex() {
      const ctx = getAudioContext();
      if (!ctx) return;
      // Sub drone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(55, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(82.4, ctx.currentTime + 2.0);
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 1.0);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 4.0);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 4.0);
    },
    disengageWhoosh() {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    }
  };

  // --- HYDROPHONE LOCK POINT CONFIGURATION (8 Lock Points) ---
  const HYDROPHONES = [
    { bearing: 0, label: '000° N', id: 'hyd-0' },
    { bearing: 45, label: '045° NE', id: 'hyd-1' },
    { bearing: 90, label: '090° E', id: 'hyd-2' },
    { bearing: 135, label: '135° SE', id: 'hyd-3' },
    { bearing: 180, label: '180° S', id: 'hyd-4' },
    { bearing: 225, label: '225° SW', id: 'hyd-5' },
    { bearing: 270, label: '270° W', id: 'hyd-6' },
    { bearing: 315, label: '315° NW', id: 'hyd-7' }
  ];

  // --- PRELOADED DESTINATIONS (6 Entries across 2 Tiers) ---
  const PRESETS = {
    mariana: {
      name: 'MARIANA CHASM',
      depth: '10,994 M',
      glyphs: ['ALPHA-TRENCH', 'BATHY-RIDGE', 'PELAGIC-SURGE', 'BENTHIC-CHASM', 'HADAL-VORTEX', 'ABYSSAL-VENT']
    },
    challenger: {
      name: 'CHALLENGER DEEP',
      depth: '10,928 M',
      glyphs: ['HADAL-VORTEX', 'THERMOCLINE', 'BENTHIC-CHASM', 'OCEANIC-TRENCH', 'ALPHA-TRENCH', 'PELAGIC-SURGE']
    },
    'puerto-rico': {
      name: 'PUERTO RICO ABYSS',
      depth: '8,376 M',
      glyphs: ['BATHY-RIDGE', 'PELAGIC-SURGE', 'OCEANIC-TRENCH', 'ALPHA-TRENCH', 'THERMOCLINE', 'HADAL-VORTEX']
    },
    kermadec: {
      name: 'KERMADEC RIFT',
      depth: '10,047 M',
      glyphs: ['THERMOCLINE', 'BENTHIC-CHASM', 'ALPHA-TRENCH', 'BATHY-RIDGE', 'HADAL-VORTEX', 'OCEANIC-TRENCH']
    },
    kuril: {
      name: 'KURIL-KAMCHATKA',
      depth: '9,603 M',
      glyphs: ['PELAGIC-SURGE', 'ABYSSAL-VENT', 'HADAL-VORTEX', 'THERMOCLINE', 'BATHY-RIDGE', 'ALPHA-TRENCH']
    },
    java: {
      name: 'JAVA SUBDUCTION',
      depth: '7,290 M',
      glyphs: ['OCEANIC-TRENCH', 'ALPHA-TRENCH', 'THERMOCLINE', 'HADAL-VORTEX', 'BENTHIC-CHASM', 'ABYSSAL-VENT']
    }
  };

  // --- APPLICATION STATE ---
  const state = {
    mode: 'IDLE', // IDLE, DIALING, PENDING_READY, ACTIVE_CONDUIT
    lockedGlyphs: [], // Array of locked glyph identifiers (max 6)
    safetyHoldEngaged: false,
    activeSweepAngle: 0,
    sonarContacts: [
      { r: 160, theta: 0.6, type: 'TRENCH', strength: 0.8 },
      { r: 240, theta: 2.1, type: 'THERMAL_VENT', strength: 0.9 },
      { r: 190, theta: 3.9, type: 'SEAMOUNT', strength: 0.7 },
      { r: 270, theta: 5.2, type: 'ABYSSAL_ANOMALY', strength: 0.95 }
    ],
    vortexRadius: 0,
    vortexIntensity: 0
  };

  // --- DOM ELEMENTS ---
  const canvas = document.getElementById('sonar-canvas');
  const ctx = canvas.getContext('2d');
  const transducerRingEl = document.getElementById('transducer-ring');
  const glyphSlotsEl = document.getElementById('glyph-slots');
  const addressCounterEl = document.getElementById('address-counter');
  const btnActivate = document.getElementById('btn-activate');
  const btnDisengage = document.getElementById('btn-disengage');
  const safetyToggle = document.getElementById('safety-hold-toggle');
  const safetyStatusText = document.getElementById('safety-toggle-status');
  const interlockBanner = document.getElementById('interlock-banner');
  const bannerDismiss = document.getElementById('banner-dismiss');
  const btnHelp = document.getElementById('btn-help');
  const helpModal = document.getElementById('help-modal');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const teleStateEl = document.getElementById('tele-state');
  const teleDepthEl = document.getElementById('tele-depth');
  const apertureStatusEl = document.getElementById('aperture-status');
  const footerStatusText = document.getElementById('footer-status-text');

  // --- INITIALIZE HYDROPHONE CHEVRONS ON THE RING ---
  function initHydrophones() {
    transducerRingEl.innerHTML = '';
    const radius = 290; // Center is at 340, 340
    const centerX = 340;
    const centerY = 340;

    HYDROPHONES.forEach((hyd, idx) => {
      const el = document.createElement('div');
      el.className = 'transducer-chevron';
      el.id = hyd.id;
      el.dataset.index = idx;

      // Convert bearing degrees to radians (0 is top)
      const rad = (hyd.bearing - 90) * (Math.PI / 180);
      const x = centerX + radius * Math.cos(rad);
      const y = centerY + radius * Math.sin(rad);

      el.style.left = `${x}px`;
      el.style.top = `${y}px`;

      el.innerHTML = `
        <span class="bearing-text">${hyd.label}</span>
        <span class="lock-symbol">⎈</span>
      `;
      transducerRingEl.appendChild(el);
    });
  }

  // --- RENDER REAL-TIME CANVAS (SONAR SWEEP + CAVITATION VORTEX) ---
  function renderSonar(time) {
    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw Concentric Range Rings (Bathymetric isobars)
    const ranges = [60, 120, 180, 240, 300];
    ranges.forEach((r, idx) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = idx === ranges.length - 1 ? 'rgba(0, 229, 255, 0.4)' : 'rgba(0, 229, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash(idx % 2 === 0 ? [4, 4] : []);
      ctx.stroke();
      ctx.setLineDash([]);

      // Range text
      ctx.fillStyle = 'rgba(92, 153, 168, 0.5)';
      ctx.font = '10px "Share Tech Mono"';
      ctx.fillText(`${(idx + 1) * 2000}M`, cx + 6, cy - r + 12);
    });

    // 2. Draw Crosshairs & Radial Spokes
    for (let deg = 0; deg < 360; deg += 45) {
      const rad = deg * (Math.PI / 180);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(rad) * 310, cy + Math.sin(rad) * 310);
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // 3. Draw Active Rotating Sonar Sweep Beam
    state.activeSweepAngle = (time * 0.001) % (Math.PI * 2);
    const sweepAngle = state.activeSweepAngle;

    // Sweep gradient sector
    const sweepGradient = ctx.createRadialGradient(cx, cy, 10, cx, cy, 310);
    sweepGradient.addColorStop(0, 'rgba(0, 255, 157, 0.4)');
    sweepGradient.addColorStop(1, 'rgba(0, 229, 255, 0.0)');

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, 310, sweepAngle - 0.4, sweepAngle);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 229, 255, 0.08)';
    ctx.fill();

    // Primary Sweep Vector Line
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(sweepAngle) * 310, cy + Math.sin(sweepAngle) * 310);
    ctx.strokeStyle = '#00ff9d';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00ff9d';
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.restore();

    // 4. Draw Sonar Contact Echo Blips
    state.sonarContacts.forEach(contact => {
      const bx = cx + contact.r * Math.cos(contact.theta);
      const by = cy + contact.r * Math.sin(contact.theta);

      // Check angular proximity to sweep line for phosphor persistence
      let diff = sweepAngle - contact.theta;
      while (diff < 0) diff += Math.PI * 2;
      const alpha = Math.max(0, 1 - (diff / (Math.PI * 1.5)));

      if (alpha > 0.05) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(bx, by, 4 + alpha * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 157, ${alpha * 0.9})`;
        ctx.shadowColor = '#00ff9d';
        ctx.shadowBlur = 8;
        ctx.fill();

        ctx.font = '9px "Share Tech Mono"';
        ctx.fillStyle = `rgba(224, 248, 255, ${alpha * 0.7})`;
        ctx.fillText(contact.type, bx + 8, by + 3);
        ctx.restore();
      }
    });

    // 5. Draw Active Locking Vector Lines to locked Hydrophones
    state.lockedGlyphs.forEach((_, idx) => {
      const hyd = HYDROPHONES[idx];
      const rad = (hyd.bearing - 90) * (Math.PI / 180);
      const hx = cx + 290 * Math.cos(rad);
      const hy = cy + 290 * Math.sin(rad);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(hx, hy);
      ctx.strokeStyle = 'rgba(0, 255, 157, 0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.shadowColor = '#00ff9d';
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    });

    // 6. Draw Active Quantum Cavitation Vortex if Portal is ACTIVE
    if (state.mode === 'ACTIVE_CONDUIT') {
      state.vortexIntensity = Math.min(1.0, state.vortexIntensity + 0.02);
      const t = time * 0.005;

      ctx.save();
      // Outer ripple shockwaves
      for (let w = 1; w <= 4; w++) {
        const rWave = ((time * 0.08 * w) % 260) + 20;
        ctx.beginPath();
        ctx.arc(cx, cy, rWave, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 229, 255, ${Math.max(0, 0.8 - rWave / 260)})`;
        ctx.lineWidth = 3;
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 15;
        ctx.stroke();
      }

      // Rotating central vortex singularity
      const vortexGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 120);
      vortexGrad.addColorStop(0, '#ffffff');
      vortexGrad.addColorStop(0.3, '#00ff9d');
      vortexGrad.addColorStop(0.7, '#00e5ff');
      vortexGrad.addColorStop(1, 'transparent');

      ctx.beginPath();
      ctx.arc(cx, cy, 110, 0, Math.PI * 2);
      ctx.fillStyle = vortexGrad;
      ctx.fill();

      // Spiral arms
      for (let a = 0; a < 6; a++) {
        const offset = a * (Math.PI / 3);
        ctx.beginPath();
        for (let rad = 10; rad < 120; rad += 5) {
          const theta = offset + rad * 0.08 + t;
          const px = cx + rad * Math.cos(theta);
          const py = cy + rad * Math.sin(theta);
          if (rad === 10) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.restore();
    } else {
      state.vortexIntensity = 0;
    }

    requestAnimationFrame(renderSonar);
  }

  // --- DIALING & LOCKING LOGIC ---
  function lockGlyph(glyphId, symbolLabel) {
    if (state.mode === 'ACTIVE_CONDUIT') return;
    if (state.lockedGlyphs.length >= 6) return;

    // Check Safety Hold
    if (state.safetyHoldEngaged) {
      triggerInterlockAlert();
      return;
    }

    const stepIdx = state.lockedGlyphs.length;
    state.lockedGlyphs.push({ id: glyphId, symbol: symbolLabel });
    state.mode = state.lockedGlyphs.length === 6 ? 'PENDING_READY' : 'DIALING';

    // Acoustic sound
    SoundFX.ping(1200 + stepIdx * 150);
    SoundFX.lockChime(stepIdx);

    // Update Chevron UI
    const hydEl = document.getElementById(`hyd-${stepIdx}`);
    if (hydEl) {
      hydEl.classList.add('locked');
      hydEl.querySelector('.lock-symbol').textContent = symbolLabel.split('-')[0] || '⎈';
    }

    // Update Address Slots
    updateAddressSlots();

    // Update System Telemetry
    updateTelemetry();

    // NEGATIVE CHECK: If 6 locked, it goes to PENDING_READY, NOT ACTIVE_CONDUIT!
    if (state.lockedGlyphs.length === 6) {
      state.mode = 'PENDING_READY';
      btnActivate.removeAttribute('disabled');
      apertureStatusEl.textContent = 'CONDUIT SYNCHRONIZED // READY FOR EMISSION';
      apertureStatusEl.style.color = '#00ff9d';
      teleStateEl.textContent = 'PENDING EMISSION';
      teleStateEl.className = 'telem-val';
      teleStateEl.style.color = '#00ff9d';
    }
  }

  function updateAddressSlots() {
    const slots = glyphSlotsEl.querySelectorAll('.slot');
    slots.forEach((slot, idx) => {
      if (idx < state.lockedGlyphs.length) {
        slot.classList.add('locked');
        slot.querySelector('.slot-val').textContent = state.lockedGlyphs[idx].id;
      } else {
        slot.classList.remove('locked');
        slot.querySelector('.slot-val').textContent = '---';
      }
    });

    addressCounterEl.textContent = `${state.lockedGlyphs.length} / 6 LOCKED`;
  }

  function updateTelemetry() {
    if (state.mode === 'IDLE') {
      teleStateEl.textContent = 'PASSIVE SWEEP';
      teleStateEl.style.color = '#00ff9d';
      teleDepthEl.textContent = '10,928 M';
      apertureStatusEl.textContent = 'TRANSDUCER IDLE';
      apertureStatusEl.style.color = '#00e5ff';
      footerStatusText.textContent = 'HYDROPHONE ARRAY ONLINE // SENSORS NOMINAL';
    } else if (state.mode === 'DIALING') {
      teleStateEl.textContent = `TUNING HYDROPHONE [0${state.lockedGlyphs.length}]`;
      teleStateEl.style.color = '#00e5ff';
      teleDepthEl.textContent = `${10928 + state.lockedGlyphs.length * 120} M`;
      apertureStatusEl.textContent = `ACOUSTIC BEARING LOCK ${state.lockedGlyphs.length}/6`;
      apertureStatusEl.style.color = '#00e5ff';
      footerStatusText.textContent = `TRANSDUCER PHASE LOCK IN PROGRESS (${state.lockedGlyphs.length}/6)`;
    } else if (state.mode === 'PENDING_READY') {
      teleStateEl.textContent = 'PENDING EMISSION';
      teleStateEl.style.color = '#00ff9d';
      apertureStatusEl.textContent = 'ACOUSTIC CONDUIT PRIMED // AWAITING EMISSION';
      apertureStatusEl.style.color = '#00ff9d';
      footerStatusText.textContent = 'CAVITATION HARMONICS PHASE-LOCKED // MANUAL EMISSION REQUIRED';
    } else if (state.mode === 'ACTIVE_CONDUIT') {
      teleStateEl.textContent = 'CONDUIT ACTIVE // TRANSIT OPEN';
      teleStateEl.style.color = '#ffffff';
      teleDepthEl.textContent = 'SINGULARITY STABLE';
      apertureStatusEl.textContent = 'QUANTUM CAVITATION CONDUIT OPEN';
      apertureStatusEl.style.color = '#ffffff';
      footerStatusText.textContent = 'WARNING: ACTIVE QUANTUM BATHYMETRIC CONDUIT IN PROGRESS';
    }
  }

  // --- ACTIVATION TRIGGER ---
  function activateConduit() {
    if (state.lockedGlyphs.length < 6) return;

    // Safety Hold Check
    if (state.safetyHoldEngaged) {
      triggerInterlockAlert();
      return;
    }

    state.mode = 'ACTIVE_CONDUIT';
    btnActivate.setAttribute('disabled', 'true');
    SoundFX.activationVortex();
    updateTelemetry();
  }

  // --- DISENGAGE / ABORT TRIGGER (Real cycle tested) ---
  function disengageConduit() {
    cancelPresetReplay(); // abort any in-flight bearing-track replay
    SoundFX.disengageWhoosh();

    state.mode = 'IDLE';
    state.lockedGlyphs = [];
    btnActivate.setAttribute('disabled', 'true');

    // Reset chevrons
    const chevrons = transducerRingEl.querySelectorAll('.transducer-chevron');
    chevrons.forEach(ch => {
      ch.classList.remove('locked');
      ch.querySelector('.lock-symbol').textContent = '⎈';
    });

    updateAddressSlots();
    updateTelemetry();
  }

  // --- SAFETY HOLD INTERLOCK ---
  function triggerInterlockAlert() {
    SoundFX.alarm();
    interlockBanner.classList.add('active');
    setTimeout(() => {
      interlockBanner.classList.remove('active');
    }, 3500);
  }

  // --- PRESET QUICK-DIAL LOADER ---
  // CHARTED BEARING-TRACK REPLAY: presets re-tune a surveyed acoustic track
  // from the expedition chart — the array steps each hydrophone bearing at
  // beamformer cadence, far faster than manual tuning, but every bearing
  // still passes through the same lockGlyph phase lock (sonar ping, lock
  // chime, transducer chevron, telemetry) as a manually dialed glyph. The
  // 6th lock lands in PENDING_READY; emission NEVER starts on its own.
  let presetReplayTimers = [];

  function cancelPresetReplay() {
    presetReplayTimers.forEach(t => clearTimeout(t));
    presetReplayTimers = [];
  }

  function loadPreset(presetKey) {
    if (state.safetyHoldEngaged) {
      triggerInterlockAlert();
      return;
    }
    const preset = PRESETS[presetKey];
    if (!preset) return;

    disengageConduit(); // also cancels any in-flight replay

    const BEAM_STEP_MS = 300; // beamformer cadence: faster than manual tuning, one bearing at a time
    preset.glyphs.forEach((glyphName, i) => {
      const timer = setTimeout(() => {
        if (state.safetyHoldEngaged) {
          cancelPresetReplay();
          triggerInterlockAlert();
          return;
        }
        const btn = document.querySelector(`.glyph-btn[data-glyph="${glyphName}"]`);
        const sym = btn ? btn.dataset.symbol : '⎈';
        lockGlyph(glyphName, sym);
      }, BEAM_STEP_MS * (i + 1));
      presetReplayTimers.push(timer);
    });
  }

  // --- DYNAMIC SCALING HANDLER ---
  function handleResize() {
    const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    document.documentElement.style.setProperty('--scale-factor', scale);
    const root = document.getElementById('viewport-root');
    if (root) {
      root.style.transform = `translate(-50%, -50%) scale(${scale})`;
    }
  }

  // --- EVENT ATTACHMENTS ---
  function attachEvents() {
    window.addEventListener('resize', handleResize);
    handleResize();

    // Glyph Matrix clicks
    document.querySelectorAll('.glyph-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        lockGlyph(btn.dataset.glyph, btn.dataset.symbol);
      });
    });

    // Activation button
    btnActivate.addEventListener('click', () => {
      activateConduit();
    });

    // Disengage / Abort button
    btnDisengage.addEventListener('click', () => {
      disengageConduit();
    });

    // Safety Hold toggle
    safetyToggle.addEventListener('change', (e) => {
      state.safetyHoldEngaged = e.target.checked;
      safetyStatusText.textContent = state.safetyHoldEngaged ? 'ENGAGED' : 'RELEASED';
      if (state.safetyHoldEngaged) {
        SoundFX.alarm();
      }
    });

    // Banner dismiss
    bannerDismiss.addEventListener('click', () => {
      interlockBanner.classList.remove('active');
    });

    // Preset buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        loadPreset(btn.dataset.preset);
      });
    });

    // Operator reference modal
    btnHelp.addEventListener('click', () => {
      helpModal.classList.add('open');
    });

    btnCloseModal.addEventListener('click', () => {
      helpModal.classList.remove('open');
    });

    helpModal.addEventListener('click', (e) => {
      if (e.target === helpModal) {
        helpModal.classList.remove('open');
      }
    });

    // Canvas animation loop
    requestAnimationFrame(renderSonar);
  }

  // Initialize
  window.addEventListener('DOMContentLoaded', () => {
    initHydrophones();
    attachEvents();
    updateTelemetry();
  });

})();
