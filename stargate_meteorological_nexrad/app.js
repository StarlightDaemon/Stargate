/**
 * Meteorological Doppler NEXRAD Radar Console (SGC-STORM-06)
 * Severe Cyclone Tracking & Vortex Conduit Routing Logic
 */

(function() {
  'use strict';

  // --- AUDIO SYNTHESIZER (Meteorological Doppler & Atmospheric Synthesizer) ---
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
    radarPing(stepIndex = 0) {
      const ctx = getAudioContext();
      if (!ctx) return;
      const freqs = [440, 520, 600, 680, 760, 840, 920];
      const f = freqs[stepIndex % freqs.length];

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    },
    windRumble() {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(45, ctx.currentTime + 0.6);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    },
    alarm() {
      const ctx = getAudioContext();
      if (!ctx) return;
      // NOAA Weather Radio 1050Hz Warning Tone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1050, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    },
    cycloneVortexActivation() {
      const ctx = getAudioContext();
      if (!ctx) return;
      // Deep hurricane eye sub rumble
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(50, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(110, ctx.currentTime + 2.0);
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 1.0);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 4.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 4.5);

      [330, 495, 660, 990].forEach(f => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(f, ctx.currentTime);
        g.gain.setValueAtTime(0.01, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.8);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 4.0);
        o.connect(g);
        g.connect(ctx.destination);
        o.start();
        o.stop(ctx.currentTime + 4.0);
      });
    },
    deenergizePurge() {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.45);
      gain.gain.setValueAtTime(0.28, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    }
  };

  // --- 9 STORM SECTORS (40° increments: 0° to 320°) ---
  const SECTORS = [
    { deg: 0, label: 'SEC-N [000°]', id: 'sec-0' },
    { deg: 40, label: 'SEC-NE [040°]', id: 'sec-1' },
    { deg: 80, label: 'SEC-E [080°]', id: 'sec-2' },
    { deg: 120, label: 'SEC-SE [120°]', id: 'sec-3' },
    { deg: 160, label: 'SEC-S [160°]', id: 'sec-4' },
    { deg: 200, label: 'SEC-SW [200°]', id: 'sec-5' },
    { deg: 240, label: 'SEC-W [240°]', id: 'sec-6' },
    { deg: 280, label: 'SEC-NW [280°]', id: 'sec-7' },
    { deg: 320, label: 'SEC-EYE [320°]', id: 'sec-8' }
  ];

  // --- PRESET SEVERE STORM SYSTEMS (6 Entries across 2 Tiers) ---
  const PRESETS = {
    'moore-ef5': {
      name: 'MOORE SUPERCELL',
      glyphs: ['SUPERCELL-MESO', 'MICROBURST-DOWNDRAFT', 'BAROMETRIC-SHEAR', 'CYCLONE-VORTEX', 'SQUALL-LINE', 'ISOBAR-GRADIENT', 'CORIOLIS-FRONT']
    },
    'tri-state': {
      name: 'TRI-STATE VORTEX',
      glyphs: ['CYCLONE-VORTEX', 'SUPERCELL-MESO', 'ISOBAR-GRADIENT', 'BAROMETRIC-SHEAR', 'SQUALL-LINE', 'MICROBURST-DOWNDRAFT', 'CORIOLIS-FRONT']
    },
    'plainfield': {
      name: 'PLAINFIELD MESO',
      glyphs: ['BAROMETRIC-SHEAR', 'SUPERCELL-MESO', 'CYCLONE-VORTEX', 'SQUALL-LINE', 'ISOBAR-GRADIENT', 'CORIOLIS-FRONT', 'MICROBURST-DOWNDRAFT']
    },
    'tip-1979': {
      name: 'SUPER TYPHOON TIP',
      glyphs: ['CYCLONE-VORTEX', 'ISOBAR-GRADIENT', 'CORIOLIS-FRONT', 'BAROMETRIC-SHEAR', 'SUPERCELL-MESO', 'MICROBURST-DOWNDRAFT', 'SQUALL-LINE']
    },
    'haiyan-2013': {
      name: 'TYPHOON HAIYAN',
      glyphs: ['CORIOLIS-FRONT', 'CYCLONE-VORTEX', 'SUPERCELL-MESO', 'ISOBAR-GRADIENT', 'SQUALL-LINE', 'BAROMETRIC-SHEAR', 'MICROBURST-DOWNDRAFT']
    },
    'patricia-2015': {
      name: 'HURRICANE PATRICIA',
      glyphs: ['ISOBAR-GRADIENT', 'CYCLONE-VORTEX', 'MICROBURST-DOWNDRAFT', 'SUPERCELL-MESO', 'BAROMETRIC-SHEAR', 'CORIOLIS-FRONT', 'SQUALL-LINE']
    }
  };

  // --- STATE ---
  const state = {
    mode: 'IDLE', // IDLE, TRACKING, PENDING_READY, ACTIVE_CONDUIT
    lockedGlyphs: [], // Max 7
    safetyHoldEngaged: false,
    radarSweepAngle: 0,
    precipitationCells: []
  };

  // Generate precipitation dBZ reflectivity cells in spiral rainbands
  for (let i = 0; i < 80; i++) {
    const spiralRadius = 50 + Math.random() * 220;
    const spiralAngle = Math.random() * Math.PI * 2;
    state.precipitationCells.push({
      r: spiralRadius,
      theta: spiralAngle,
      dbz: 30 + Math.random() * 40,
      size: 4 + Math.random() * 8
    });
  }

  // --- DOM REFS ---
  const canvas = document.getElementById('nexrad-canvas');
  const ctx = canvas.getContext('2d');
  const sectorsRingEl = document.getElementById('sectors-ring');
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
  const telePressEl = document.getElementById('tele-press');
  const eyeStatusEl = document.getElementById('eye-status');
  const footerStatusText = document.getElementById('footer-status-text');

  // --- INITIALIZE 9 SECTORS ---
  function initSectors() {
    sectorsRingEl.innerHTML = '';
    const radius = 290;
    const cx = 340;
    const cy = 340;

    SECTORS.forEach((sec, idx) => {
      const el = document.createElement('div');
      el.className = 'sector-chevron';
      el.id = sec.id;
      el.dataset.index = idx;

      const rad = (sec.deg - 90) * (Math.PI / 180);
      const x = cx + radius * Math.cos(rad);
      const y = cy + radius * Math.sin(rad);

      el.style.left = `${x}px`;
      el.style.top = `${y}px`;

      el.innerHTML = `
        <span class="sec-label">S-${idx + 1}</span>
        <span class="sec-symbol">🌪️</span>
      `;
      sectorsRingEl.appendChild(el);
    });
  }

  // --- CANVAS RENDERING (NEXRAD Doppler Sweep & Spiral Cyclone Bands) ---
  function renderNexrad(time) {
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    // 1. Concentric Barometric Isobar Rings (980 hPa to 1020 hPa)
    const isobars = [70, 140, 210, 280];
    isobars.forEach((r, idx) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = idx === 3 ? 'rgba(0, 245, 212, 0.45)' : 'rgba(0, 245, 212, 0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash(idx % 2 === 1 ? [4, 4] : []);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(110, 132, 163, 0.6)';
      ctx.font = '9px "Share Tech Mono"';
      ctx.fillText(`${980 + (idx + 1) * 10} hPa`, cx + 6, cy - r + 12);
    });

    // 2. 9 Sector Radial Spokes (at 40° intervals)
    SECTORS.forEach(sec => {
      const rad = (sec.deg - 90) * (Math.PI / 180);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(rad) * 285, cy + Math.sin(rad) * 285);
      ctx.strokeStyle = 'rgba(0, 245, 212, 0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // 3. Rotating Doppler Sweep Beam
    state.radarSweepAngle = (time * 0.0013) % (Math.PI * 2);
    const sweepAngle = state.radarSweepAngle;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, 285, sweepAngle - 0.35, sweepAngle);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 245, 212, 0.08)';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(sweepAngle) * 285, cy + Math.sin(sweepAngle) * 285);
    ctx.strokeStyle = '#00f5d4';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00f5d4';
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.restore();

    // 4. Spiral Precipitation Rainband Cells (Multi-Spectral dBZ)
    const t = time * 0.002;
    state.precipitationCells.forEach(cell => {
      const currentTheta = cell.theta + t * 0.3;
      const px = cx + cell.r * Math.cos(currentTheta);
      const py = cy + cell.r * Math.sin(currentTheta);

      let diff = sweepAngle - currentTheta;
      while (diff < 0) diff += Math.PI * 2;
      const alpha = Math.max(0, 1 - (diff / (Math.PI * 1.5)));

      if (alpha > 0.05) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(px, py, cell.size * 0.8, 0, Math.PI * 2);

        let col = '#00f5d4';
        if (cell.dbz > 60) col = '#d90429';
        else if (cell.dbz > 50) col = '#f77f00';
        else if (cell.dbz > 40) col = '#ffd166';
        else col = '#52b788';

        ctx.fillStyle = col;
        ctx.globalAlpha = alpha * 0.75;
        ctx.shadowColor = col;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.restore();
      }
    });

    // 5. Isobar Compression Beams to Locked Sectors
    state.lockedGlyphs.forEach((_, idx) => {
      const sec = SECTORS[idx];
      const rad = (sec.deg - 90) * (Math.PI / 180);
      const sx = cx + 290 * Math.cos(rad);
      const sy = cy + 290 * Math.sin(rad);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(sx, sy);
      ctx.strokeStyle = 'rgba(247, 127, 0, 0.75)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.shadowColor = '#f77f00';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    });

    // 6. Active Cyclone Eyewall Vortex Singularity if ACTIVE_CONDUIT
    if (state.mode === 'ACTIVE_CONDUIT') {
      const tA = time * 0.006;
      ctx.save();

      for (let r = 20; r <= 230; r += 40) {
        ctx.beginPath();
        ctx.arc(cx, cy, r + Math.sin(tA + r) * 7, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(247, 127, 0, ${Math.max(0, 0.8 - r / 250)})`;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#d90429';
        ctx.shadowBlur = 12;
        ctx.stroke();
      }

      const stormGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 105);
      stormGrad.addColorStop(0, '#ffffff');
      stormGrad.addColorStop(0.3, '#f77f00');
      stormGrad.addColorStop(0.7, '#d90429');
      stormGrad.addColorStop(1, 'transparent');

      ctx.beginPath();
      ctx.arc(cx, cy, 95, 0, Math.PI * 2);
      ctx.fillStyle = stormGrad;
      ctx.fill();

      for (let i = 0; i < 8; i++) {
        const rayAngle = (i * Math.PI / 4) + tA;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(rayAngle) * 20, cy + Math.sin(rayAngle) * 20);
        ctx.lineTo(cx + Math.cos(rayAngle) * 135, cy + Math.sin(rayAngle) * 135);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.restore();
    }

    requestAnimationFrame(renderNexrad);
  }

  // --- DIALING & LOCKING LOGIC ---
  function lockGlyph(glyphId, symbolLabel) {
    if (state.mode === 'ACTIVE_CONDUIT') return;
    if (state.lockedGlyphs.length >= 7) return;

    if (state.safetyHoldEngaged) {
      triggerInterlockAlert();
      return;
    }

    const stepIdx = state.lockedGlyphs.length;
    state.lockedGlyphs.push({ id: glyphId, symbol: symbolLabel });
    state.mode = state.lockedGlyphs.length === 7 ? 'PENDING_READY' : 'TRACKING';

    SoundFX.radarPing(stepIdx);
    SoundFX.windRumble();

    // Update Chevron UI
    const secEl = document.getElementById(`sec-${stepIdx}`);
    if (secEl) {
      secEl.classList.add('locked');
      secEl.querySelector('.sec-symbol').textContent = symbolLabel.split('-')[0] || '🌪️';
    }

    updateAddressSlots();
    updateTelemetry();

    // NEGATIVE CHECK: 7 locked -> PENDING_READY, NOT ACTIVE_CONDUIT!
    if (state.lockedGlyphs.length === 7) {
      state.mode = 'PENDING_READY';
      btnActivate.removeAttribute('disabled');
      eyeStatusEl.textContent = 'CYCLONE EYE ALIGNED // READY FOR TRANSMISSION';
      eyeStatusEl.style.color = '#ffd166';
      teleStateEl.textContent = 'PENDING TRANSMISSION';
      teleStateEl.style.color = '#ffd166';
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

    addressCounterEl.textContent = `${state.lockedGlyphs.length} / 7 LOCKED`;
  }

  function updateTelemetry() {
    if (state.mode === 'IDLE') {
      teleStateEl.textContent = 'DUAL-POL SWEEP';
      teleStateEl.style.color = '#00f5d4';
      telePressEl.textContent = '932.4 hPa';
      eyeStatusEl.textContent = 'CALM EYE STABLE';
      eyeStatusEl.style.color = '#00f5d4';
      footerStatusText.textContent = 'NEXRAD RADAR ONLINE // DUAL-POL POLARIMETRY ACTIVE';
    } else if (state.mode === 'TRACKING') {
      teleStateEl.textContent = `ISOLATING SECTOR [S-0${state.lockedGlyphs.length}]`;
      teleStateEl.style.color = '#ffd166';
      telePressEl.textContent = `${932 - state.lockedGlyphs.length * 6.5} hPa`;
      eyeStatusEl.textContent = `BAROMETRIC CONTOUR LOCK ${state.lockedGlyphs.length}/7`;
      eyeStatusEl.style.color = '#ffd166';
      footerStatusText.textContent = `VORTEX ISOBAR COMPRESSION IN PROGRESS (${state.lockedGlyphs.length}/7)`;
    } else if (state.mode === 'PENDING_READY') {
      teleStateEl.textContent = 'PENDING TRANSMISSION';
      teleStateEl.style.color = '#f77f00';
      eyeStatusEl.textContent = 'EYEWALL APERTURE SYNCHRONIZED // MANUAL TRANSMISSION REQUIRED';
      eyeStatusEl.style.color = '#f77f00';
      footerStatusText.textContent = 'ALL 7 VECTORS PHASE-LOCKED // ENGAGE CYCLONE VORTEX CONDUIT';
    } else if (state.mode === 'ACTIVE_CONDUIT') {
      teleStateEl.textContent = 'STORM EYE CONDUIT ACTIVE';
      teleStateEl.style.color = '#ffffff';
      telePressEl.textContent = 'EYE PRESSURE MINIMAL';
      eyeStatusEl.textContent = 'ACTIVE QUANTUM CYCLONE CONDUIT';
      eyeStatusEl.style.color = '#ffffff';
      footerStatusText.textContent = 'WARNING: ACTIVE STORM EYE QUANTUM CONDUIT IN PROGRESS';
    }
  }

  // --- ACTIVATION TRIGGER ---
  function activateConduit() {
    if (state.lockedGlyphs.length < 7) return;

    if (state.safetyHoldEngaged) {
      triggerInterlockAlert();
      return;
    }

    state.mode = 'ACTIVE_CONDUIT';
    btnActivate.setAttribute('disabled', 'true');
    SoundFX.cycloneVortexActivation();
    updateTelemetry();
  }

  // --- DISENGAGE / ABORT TRIGGER ---
  function disengageConduit() {
    cancelPresetReplay(); // abort any in-flight storm-track replay
    SoundFX.deenergizePurge();

    state.mode = 'IDLE';
    state.lockedGlyphs = [];
    btnActivate.setAttribute('disabled', 'true');

    const sectors = sectorsRingEl.querySelectorAll('.sector-chevron');
    sectors.forEach(s => {
      s.classList.remove('locked');
      s.querySelector('.sec-symbol').textContent = '🌪️';
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
  // ARCHIVED STORM-TRACK REPLAY: presets re-acquire each stored vector on
  // successive antenna sweeps — the volume scan runs at radar cadence, far
  // faster than manual isolation, but every vector still passes through the
  // same lockGlyph barometric contour lock (radar ping, chevron lock, telemetry)
  // as a manually dialed glyph. The 7th lock lands in PENDING_READY; the
  // conduit NEVER engages on its own.
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

    const SWEEP_STEP_MS = 280; // radar sweep cadence: faster than manual, one vector per sweep
    preset.glyphs.forEach((glyphName, i) => {
      const timer = setTimeout(() => {
        if (state.safetyHoldEngaged) {
          cancelPresetReplay();
          triggerInterlockAlert();
          return;
        }
        const btn = document.querySelector(`.glyph-btn[data-glyph="${glyphName}"]`);
        const sym = btn ? btn.dataset.symbol : '🌪️';
        lockGlyph(glyphName, sym);
      }, SWEEP_STEP_MS * (i + 1));
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

    requestAnimationFrame(renderNexrad);
  }

  window.addEventListener('DOMContentLoaded', () => {
    initSectors();
    attachEvents();
    updateTelemetry();
  });

})();
