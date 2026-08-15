/**
 * Solarpunk Smart Eco-Grid Dispatch Console (SGC-SOLAR-03)
 * Renewable Biosphere Microgrid Routing Logic
 */

(function() {
  'use strict';

  // --- AUDIO SYNTHESIZER (Pure Electric Sine & Harmonic Synthesizer) ---
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
    gridPulse(stepIndex = 0) {
      const ctx = getAudioContext();
      if (!ctx) return;
      // High-efficiency harmonic series based on 60Hz grid harmonics
      const gridHarmonics = [360, 480, 540, 600, 720, 840, 960, 1080];
      const freq = gridHarmonics[stepIndex % gridHarmonics.length];

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.22, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    },
    phaseLockChime() {
      const ctx = getAudioContext();
      if (!ctx) return;
      [540, 720, 1080].forEach(f => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, ctx.currentTime);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.8);
      });
    },
    alarm() {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(900, ctx.currentTime + 0.15);
      osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    },
    biosphereSurge() {
      const ctx = getAudioContext();
      if (!ctx) return;
      // 60Hz Sub-bass power drone
      const sub = ctx.createOscillator();
      const subGain = ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(60, ctx.currentTime);
      subGain.gain.setValueAtTime(0.01, ctx.currentTime);
      subGain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 1.0);
      subGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 4.0);
      sub.connect(subGain);
      subGain.connect(ctx.destination);
      sub.start();
      sub.stop(ctx.currentTime + 4.0);

      // High harmonic shimmer
      [480, 720, 960, 1200].forEach(f => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, ctx.currentTime);
        g.gain.setValueAtTime(0.01, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.8);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.5);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 3.5);
      });
    },
    scramPurge() {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(450, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.45);
      gain.gain.setValueAtTime(0.28, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    }
  };

  // --- 10 MICROGRID SUBSTATIONS (36° increments) ---
  const SUBSTATIONS = [
    { deg: 0, greek: 'α', label: 'SOL-ALPHA', id: 'sub-0' },
    { deg: 36, greek: 'β', label: 'HYDRO-BETA', id: 'sub-1' },
    { deg: 72, greek: 'γ', label: 'GEO-GAMMA', id: 'sub-2' },
    { deg: 108, greek: 'δ', label: 'AERO-DELTA', id: 'sub-3' },
    { deg: 144, greek: 'ε', label: 'BIO-EPSILON', id: 'sub-4' },
    { deg: 180, greek: 'ζ', label: 'KINETIC-ZETA', id: 'sub-5' },
    { deg: 216, greek: 'η', label: 'TIDAL-ETA', id: 'sub-6' },
    { deg: 252, greek: 'θ', label: 'THERMAL-THETA', id: 'sub-7' },
    { deg: 288, greek: 'ι', label: 'OSMO-IOTA', id: 'sub-8' },
    { deg: 324, greek: 'κ', label: 'QUANTUM-KAPPA', id: 'sub-9' }
  ];

  // --- PRESET BIOSPHERE HABITATS (6 Entries across 2 Tiers) ---
  const PRESETS = {
    'valencia-sol': {
      name: 'VALENCIA ARCOLOGY',
      glyphs: ['PV-ARRAY-CORE', 'SUPERCONDUCTING-BUS', 'MHD-CONVERTER', 'AERO-VORTEX', 'HYDRO-TURBINE', 'FLYWHEEL-STORAGE', 'BIOMASS-DIGESTER', 'GEOTHERMAL-VENT']
    },
    'sahara-canopy': {
      name: 'SAHARA SUN CANOPY',
      glyphs: ['PV-ARRAY-CORE', 'MHD-CONVERTER', 'SUPERCONDUCTING-BUS', 'FLYWHEEL-STORAGE', 'GEOTHERMAL-VENT', 'AERO-VORTEX', 'HYDRO-TURBINE', 'BIOMASS-DIGESTER']
    },
    'amazon-canopy': {
      name: 'AMAZON BIODOME',
      glyphs: ['BIOMASS-DIGESTER', 'HYDRO-TURBINE', 'PV-ARRAY-CORE', 'SUPERCONDUCTING-BUS', 'GEOTHERMAL-VENT', 'FLYWHEEL-STORAGE', 'AERO-VORTEX', 'MHD-CONVERTER']
    },
    'nordic-fjord': {
      name: 'NORDIC FJORD TIDAL',
      glyphs: ['HYDRO-TURBINE', 'AERO-VORTEX', 'FLYWHEEL-STORAGE', 'SUPERCONDUCTING-BUS', 'PV-ARRAY-CORE', 'GEOTHERMAL-VENT', 'MHD-CONVERTER', 'BIOMASS-DIGESTER']
    },
    'iceland-geothermal': {
      name: 'HEKLA GEO BASIN',
      glyphs: ['GEOTHERMAL-VENT', 'MHD-CONVERTER', 'SUPERCONDUCTING-BUS', 'HYDRO-TURBINE', 'PV-ARRAY-CORE', 'FLYWHEEL-STORAGE', 'BIOMASS-DIGESTER', 'AERO-VORTEX']
    },
    'kyoto-bamboo': {
      name: 'KYOTO ECO-GROVE',
      glyphs: ['BIOMASS-DIGESTER', 'PV-ARRAY-CORE', 'HYDRO-TURBINE', 'AERO-VORTEX', 'SUPERCONDUCTING-BUS', 'MHD-CONVERTER', 'FLYWHEEL-STORAGE', 'GEOTHERMAL-VENT']
    }
  };

  // --- STATE ---
  const state = {
    mode: 'IDLE', // IDLE, ROUTING, PENDING_READY, ACTIVE_CONDUIT
    lockedGlyphs: [], // Max 8
    safetyHoldEngaged: false,
    particles: [],
    rotorAngle: 0
  };

  // Power flow particle stream
  for (let i = 0; i < 75; i++) {
    state.particles.push({
      r: 40 + Math.random() * 240,
      theta: Math.random() * Math.PI * 2,
      speed: 0.005 + Math.random() * 0.015,
      size: 1.5 + Math.random() * 2.5
    });
  }

  // --- DOM REFS ---
  const canvas = document.getElementById('grid-canvas');
  const ctx = canvas.getContext('2d');
  const substationsRingEl = document.getElementById('substations-ring');
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
  const teleLoadEl = document.getElementById('tele-load');
  const synchroStatusEl = document.getElementById('synchro-status');
  const footerStatusText = document.getElementById('footer-status-text');

  // --- INITIALIZE 10 SUBSTATIONS ---
  function initSubstations() {
    substationsRingEl.innerHTML = '';
    const radius = 290;
    const cx = 340;
    const cy = 340;

    SUBSTATIONS.forEach((sub, idx) => {
      const el = document.createElement('div');
      el.className = 'substation-chevron';
      el.id = sub.id;
      el.dataset.index = idx;

      const rad = (sub.deg - 90) * (Math.PI / 180);
      const x = cx + radius * Math.cos(rad);
      const y = cy + radius * Math.sin(rad);

      el.style.left = `${x}px`;
      el.style.top = `${y}px`;

      el.innerHTML = `
        <span class="sub-greek">${sub.greek}</span>
        <span class="sub-symbol">⚡</span>
      `;
      substationsRingEl.appendChild(el);
    });
  }

  // --- CANVAS RENDERING (Microgrid Power Flow & Dynamic Particle Network) ---
  function renderGrid(time) {
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    // 1. Concentric Microgrid Bus Rings
    [70, 140, 210, 280].forEach((r, idx) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = idx === 3 ? 'rgba(0, 255, 200, 0.45)' : 'rgba(0, 255, 200, 0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash(idx % 2 === 1 ? [6, 4] : []);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // 2. Substation Radial Bus Feeders (10 Spokes)
    SUBSTATIONS.forEach(sub => {
      const rad = (sub.deg - 90) * (Math.PI / 180);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(rad) * 285, cy + Math.sin(rad) * 285);
      ctx.strokeStyle = 'rgba(0, 255, 200, 0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // 3. Dynamic Power Flow Particles
    state.particles.forEach(p => {
      p.theta += p.speed;
      const px = cx + p.r * Math.cos(p.theta);
      const py = cy + p.r * Math.sin(p.theta);

      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(56, 239, 125, 0.65)';
      ctx.shadowColor = '#00ffc8';
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.restore();
    });

    // 4. Power Surge Streamlines to Locked Substations
    state.lockedGlyphs.forEach((_, idx) => {
      const sub = SUBSTATIONS[idx];
      const rad = (sub.deg - 90) * (Math.PI / 180);
      const sx = cx + 290 * Math.cos(rad);
      const sy = cy + 290 * Math.sin(rad);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(sx, sy);
      ctx.strokeStyle = 'rgba(56, 239, 125, 0.75)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 4]);
      ctx.shadowColor = '#38ef7d';
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    });

    // 5. Active Biosphere Quantum Energy Vortex if ACTIVE_CONDUIT
    if (state.mode === 'ACTIVE_CONDUIT') {
      const t = time * 0.005;
      ctx.save();

      // Expanding Bio-energy rings
      for (let r = 25; r <= 240; r += 45) {
        ctx.beginPath();
        ctx.arc(cx, cy, r + Math.sin(t + r) * 8, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 255, 200, ${Math.max(0, 0.8 - r / 260)})`;
        ctx.lineWidth = 3;
        ctx.shadowColor = '#00ffc8';
        ctx.shadowBlur = 15;
        ctx.stroke();
      }

      // Central Fusion Singularity
      const coreGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 110);
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.3, '#38ef7d');
      coreGrad.addColorStop(0.7, '#00ffc8');
      coreGrad.addColorStop(1, 'transparent');

      ctx.beginPath();
      ctx.arc(cx, cy, 100, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.fill();

      // Renewable Power Streamlines
      for (let i = 0; i < 10; i++) {
        const rayAngle = (i * Math.PI / 5) + t;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(rayAngle) * 20, cy + Math.sin(rayAngle) * 20);
        ctx.lineTo(cx + Math.cos(rayAngle) * 140, cy + Math.sin(rayAngle) * 140);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.restore();
    }

    requestAnimationFrame(renderGrid);
  }

  // --- DIALING & LOCKING LOGIC ---
  function lockGlyph(glyphId, symbolLabel) {
    if (state.mode === 'ACTIVE_CONDUIT') return;
    if (state.lockedGlyphs.length >= 8) return;

    if (state.safetyHoldEngaged) {
      triggerInterlockAlert();
      return;
    }

    const stepIdx = state.lockedGlyphs.length;
    state.lockedGlyphs.push({ id: glyphId, symbol: symbolLabel });
    state.mode = state.lockedGlyphs.length === 8 ? 'PENDING_READY' : 'ROUTING';

    SoundFX.gridPulse(stepIdx);
    SoundFX.phaseLockChime();

    // Update Chevron Substation UI
    const subEl = document.getElementById(`sub-${stepIdx}`);
    if (subEl) {
      subEl.classList.add('locked');
      subEl.querySelector('.sub-symbol').textContent = symbolLabel.split('-')[0] || '⚡';
    }

    updateAddressSlots();
    updateTelemetry();

    // NEGATIVE CHECK: 8 locked -> PENDING_READY, NOT ACTIVE_CONDUIT!
    if (state.lockedGlyphs.length === 8) {
      state.mode = 'PENDING_READY';
      btnActivate.removeAttribute('disabled');
      synchroStatusEl.textContent = 'POWER CONDUIT SYNCHRONIZED // READY FOR TRANSMISSION';
      synchroStatusEl.style.color = '#38ef7d';
      teleStateEl.textContent = 'PENDING TRANSMISSION';
      teleStateEl.style.color = '#38ef7d';
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

    addressCounterEl.textContent = `${state.lockedGlyphs.length} / 8 LOCKED`;
  }

  function updateTelemetry() {
    if (state.mode === 'IDLE') {
      teleStateEl.textContent = 'AUTONOMOUS FLOW';
      teleStateEl.style.color = '#38ef7d';
      teleLoadEl.textContent = '4,850 GW';
      synchroStatusEl.textContent = 'MICROGRID EQUILIBRIUM';
      synchroStatusEl.style.color = '#00ffc8';
      footerStatusText.textContent = 'MICROGRID ONLINE // 10 SUBSTATIONS COUPLED';
    } else if (state.mode === 'ROUTING') {
      teleStateEl.textContent = `COUPLING SUBSTATION [0${state.lockedGlyphs.length}]`;
      teleStateEl.style.color = '#00ffc8';
      teleLoadEl.textContent = `${4850 + state.lockedGlyphs.length * 280} GW`;
      synchroStatusEl.textContent = `BUS PHASE LOCK ${state.lockedGlyphs.length}/8`;
      synchroStatusEl.style.color = '#00ffc8';
      footerStatusText.textContent = `SUBSTATION COUPLING IN PROGRESS (${state.lockedGlyphs.length}/8)`;
    } else if (state.mode === 'PENDING_READY') {
      teleStateEl.textContent = 'PENDING TRANSMISSION';
      teleStateEl.style.color = '#38ef7d';
      synchroStatusEl.textContent = 'BIOSPHERE CONDUIT PRIMED // AWAITING DISPATCH';
      synchroStatusEl.style.color = '#38ef7d';
      footerStatusText.textContent = 'ALL 8 VECTORS PHASE-LOCKED // MANUAL DISPATCH REQUIRED';
    } else if (state.mode === 'ACTIVE_CONDUIT') {
      teleStateEl.textContent = 'BIOSPHERE POWER CONDUIT ACTIVE';
      teleStateEl.style.color = '#ffffff';
      teleLoadEl.textContent = 'QUANTUM TRANSIT 100%';
      synchroStatusEl.textContent = 'HIGH-VOLTAGE QUANTUM POWER TRANSMISSION';
      synchroStatusEl.style.color = '#ffffff';
      footerStatusText.textContent = 'WARNING: ACTIVE QUANTUM BIOSPHERE POWER CONDUIT IN PROGRESS';
    }
  }

  // --- ACTIVATION TRIGGER ---
  function activateConduit() {
    if (state.lockedGlyphs.length < 8) return;

    if (state.safetyHoldEngaged) {
      triggerInterlockAlert();
      return;
    }

    state.mode = 'ACTIVE_CONDUIT';
    btnActivate.setAttribute('disabled', 'true');
    SoundFX.biosphereSurge();
    updateTelemetry();
  }

  // --- DISENGAGE / SCRAM TRIGGER ---
  function disengageConduit() {
    cancelPresetReplay(); // abort any in-flight dispatch-schedule replay
    SoundFX.scramPurge();

    state.mode = 'IDLE';
    state.lockedGlyphs = [];
    btnActivate.setAttribute('disabled', 'true');

    const subs = substationsRingEl.querySelectorAll('.substation-chevron');
    subs.forEach(s => {
      s.classList.remove('locked');
      s.querySelector('.sub-symbol').textContent = '⚡';
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
  // STORED DISPATCH-SCHEDULE REPLAY: presets run a pre-balanced grid dispatch
  // schedule — the grid controller couples the substations at relay cadence,
  // far faster than manual switching, but every substation still passes
  // through the same lockGlyph phase-lock (grid pulse, phase-lock chime,
  // substation chevron, telemetry) as a manually coupled glyph. The 8th lock
  // lands in PENDING_READY; power dispatch is NEVER transmitted on its own.
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

    const RELAY_STEP_MS = 260; // relay cadence: faster than manual switching, one substation at a time
    preset.glyphs.forEach((glyphName, i) => {
      const timer = setTimeout(() => {
        if (state.safetyHoldEngaged) {
          cancelPresetReplay();
          triggerInterlockAlert();
          return;
        }
        const btn = document.querySelector(`.glyph-btn[data-glyph="${glyphName}"]`);
        const sym = btn ? btn.dataset.symbol : '⚡';
        lockGlyph(glyphName, sym);
      }, RELAY_STEP_MS * (i + 1));
      presetReplayTimers.push(timer);
    });
  }

  // --- DYNAMIC SCALING ---
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

    document.querySelectorAll('.glyph-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        lockGlyph(btn.dataset.glyph, btn.dataset.symbol);
      });
    });

    btnActivate.addEventListener('click', () => {
      activateConduit();
    });

    btnDisengage.addEventListener('click', () => {
      disengageConduit();
    });

    safetyToggle.addEventListener('change', (e) => {
      state.safetyHoldEngaged = e.target.checked;
      safetyStatusText.textContent = state.safetyHoldEngaged ? 'ENGAGED' : 'RELEASED';
      if (state.safetyHoldEngaged) {
        SoundFX.alarm();
      }
    });

    bannerDismiss.addEventListener('click', () => {
      interlockBanner.classList.remove('active');
    });

    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        loadPreset(btn.dataset.preset);
      });
    });

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

    requestAnimationFrame(renderGrid);
  }

  window.addEventListener('DOMContentLoaded', () => {
    initSubstations();
    attachEvents();
    updateTelemetry();
  });

})();
