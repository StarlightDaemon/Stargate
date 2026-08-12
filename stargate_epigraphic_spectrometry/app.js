/**
 * Ancient Mythic Epigraphic Spectrometry Console (SGC-MYTH-02)
 * Laser OCR & Spectrographic Decoding Logic
 */

(function() {
  'use strict';

  // --- AUDIO SYNTHESIZER (Golden Harmonic Synthesizer) ---
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
    crystalChime(stepIndex = 0) {
      const ctx = getAudioContext();
      if (!ctx) return;
      // Solfeggio / Golden harmonic scale
      const solfeggio = [528, 594, 660, 704, 792, 880, 990, 1056];
      const base = solfeggio[stepIndex % solfeggio.length];
      [base, base * 1.618].forEach((f) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, ctx.currentTime);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.9);
      });
    },
    laserScanTone() {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(1400, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    },
    alarm() {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(500, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(750, ctx.currentTime + 0.15);
      osc.frequency.linearRampToValueAtTime(500, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    },
    solarHarmonicActivation() {
      const ctx = getAudioContext();
      if (!ctx) return;
      [264, 528, 792, 1056].forEach(f => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, ctx.currentTime);
        gain.gain.setValueAtTime(0.01, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 1.2);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 4.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 4.5);
      });
    },
    purgeDisengage() {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.45);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    }
  };

  // --- 9 EPIGRAPHIC LOCI CONFIGURATION (40° radial intervals) ---
  const LOCI = [
    { deg: 0, roman: 'I', label: 'LOCUS-I', id: 'locus-0' },
    { deg: 40, roman: 'II', label: 'LOCUS-II', id: 'locus-1' },
    { deg: 80, roman: 'III', label: 'LOCUS-III', id: 'locus-2' },
    { deg: 120, roman: 'IV', label: 'LOCUS-IV', id: 'locus-3' },
    { deg: 160, roman: 'V', label: 'LOCUS-V', id: 'locus-4' },
    { deg: 200, roman: 'VI', label: 'LOCUS-VI', id: 'locus-5' },
    { deg: 240, roman: 'VII', label: 'LOCUS-VII', id: 'locus-6' },
    { deg: 280, roman: 'VIII', label: 'LOCUS-VIII', id: 'locus-7' },
    { deg: 320, roman: 'IX', label: 'LOCUS-IX', id: 'locus-8' }
  ];

  // --- PRESET TABLET ARCHIVES (6 Preloaded Steles across 2 Tiers) ---
  const PRESETS = {
    'rosetta-quantum': {
      name: 'ROSETTA QUANTUM STELE',
      glyphs: ['KHEPRI-SOL', 'HORUS-AETHEL', 'ISIS-NEXUS', 'THOTH-CHRONO', 'OSIRIS-HADAL', 'PTAH-STRUCT', 'AMUN-CONDUIT']
    },
    'karnak-solar': {
      name: 'KARNAK SOLAR PYLON',
      glyphs: ['AMUN-CONDUIT', 'KHEPRI-SOL', 'HORUS-AETHEL', 'ANUBIS-NEB', 'ISIS-NEXUS', 'THOTH-CHRONO', 'PTAH-STRUCT']
    },
    'giza-astral': {
      name: 'GIZA HORIZON MERIDIAN',
      glyphs: ['HORUS-AETHEL', 'ISIS-NEXUS', 'KHEPRI-SOL', 'OSIRIS-HADAL', 'THOTH-CHRONO', 'ANUBIS-NEB', 'AMUN-CONDUIT']
    },
    'heliopolis-ray': {
      name: 'HELIOPOLIS SOLAR BENBEN',
      glyphs: ['KHEPRI-SOL', 'AMUN-CONDUIT', 'HORUS-AETHEL', 'PTAH-STRUCT', 'ISIS-NEXUS', 'ANUBIS-NEB', 'OSIRIS-HADAL']
    },
    'abydos-osiris': {
      name: 'ABYDOS HADAL OSIRION',
      glyphs: ['OSIRIS-HADAL', 'ANUBIS-NEB', 'THOTH-CHRONO', 'ISIS-NEXUS', 'HORUS-AETHEL', 'PTAH-STRUCT', 'KHEPRI-SOL']
    },
    'dendera-zodiac': {
      name: 'DENDERA COSMIC CEILING',
      glyphs: ['THOTH-CHRONO', 'HORUS-AETHEL', 'KHEPRI-SOL', 'ISIS-NEXUS', 'AMUN-CONDUIT', 'OSIRIS-HADAL', 'ANUBIS-NEB']
    }
  };

  // --- STATE ---
  const state = {
    mode: 'IDLE', // IDLE, SCANNING, PENDING_READY, ACTIVE_CONDUIT
    lockedGlyphs: [], // Max 7
    safetyHoldEngaged: false,
    scanBeamAngle: 0,
    pointCloud: []
  };

  // Initialize Point Cloud for Laser OCR
  for (let i = 0; i < 60; i++) {
    state.pointCloud.push({
      r: 70 + Math.random() * 180,
      theta: Math.random() * Math.PI * 2,
      intensity: 0.3 + Math.random() * 0.7,
      char: ['𓇳', '𓃠', '𓅃', '𓊨', '𓁟', '𓁹', '𓐚', '𓇯'][Math.floor(Math.random() * 8)]
    });
  }

  // --- DOM REFS ---
  const canvas = document.getElementById('spectro-canvas');
  const ctx = canvas.getContext('2d');
  const lociRingEl = document.getElementById('loci-ring');
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
  const teleConfidenceEl = document.getElementById('tele-confidence');
  const cartoucheStatusEl = document.getElementById('cartouche-status');
  const footerStatusText = document.getElementById('footer-status-text');

  // --- INITIALIZE 9 LOCI ---
  function initLoci() {
    lociRingEl.innerHTML = '';
    const radius = 265;
    const cx = 310;
    const cy = 310;

    LOCI.forEach((loc, idx) => {
      const el = document.createElement('div');
      el.className = 'locus-chevron';
      el.id = loc.id;
      el.dataset.index = idx;

      const rad = (loc.deg - 90) * (Math.PI / 180);
      const x = cx + radius * Math.cos(rad);
      const y = cy + radius * Math.sin(rad);

      el.style.left = `${x}px`;
      el.style.top = `${y}px`;

      el.innerHTML = `
        <span class="locus-label">${loc.roman}</span>
        <span class="locus-symbol">𓇳</span>
      `;
      lociRingEl.appendChild(el);
    });
  }

  // --- CANVAS RENDERING LOOP (Laser OCR + Epigraphic Spectrogram) ---
  function renderSpectrometry(time) {
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    // 1. Concentric Radial Optical Rings
    [60, 120, 180, 240].forEach((r, idx) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = idx === 3 ? 'rgba(255, 183, 3, 0.4)' : 'rgba(255, 183, 3, 0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash(idx % 2 === 1 ? [4, 4] : []);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // 2. Optical Spokes (9 radial lines for 9 loci)
    LOCI.forEach(loc => {
      const rad = (loc.deg - 90) * (Math.PI / 180);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(rad) * 260, cy + Math.sin(rad) * 260);
      ctx.strokeStyle = 'rgba(255, 183, 3, 0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // 3. Rotating Dual Laser Scan Sweeps
    state.scanBeamAngle = (time * 0.0012) % (Math.PI * 2);
    const angle = state.scanBeamAngle;

    // Laser 1 (Gold 589nm)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * 260, cy + Math.sin(angle) * 260);
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#ffb703';
    ctx.shadowBlur = 12;
    ctx.stroke();

    // Laser 2 (Opposing 180 deg)
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle + Math.PI) * 260, cy + Math.sin(angle + Math.PI) * 260);
    ctx.strokeStyle = '#ff9500';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // 4. Inscription Point Cloud & Glyph Fragments
    state.pointCloud.forEach(p => {
      const px = cx + p.r * Math.cos(p.theta);
      const py = cy + p.r * Math.sin(p.theta);

      let diff = angle - p.theta;
      while (diff < 0) diff += Math.PI * 2;
      const alpha = Math.max(0, 1 - (diff / (Math.PI * 1.5)));

      if (alpha > 0.05) {
        ctx.save();
        ctx.fillStyle = `rgba(255, 209, 102, ${alpha * p.intensity})`;
        ctx.font = '12px "Cinzel", serif';
        ctx.fillText(p.char, px, py);
        ctx.restore();
      }
    });

    // 5. Laser Focus Lines to Locked Loci
    state.lockedGlyphs.forEach((_, idx) => {
      const loc = LOCI[idx];
      const rad = (loc.deg - 90) * (Math.PI / 180);
      const lx = cx + 265 * Math.cos(rad);
      const ly = cy + 265 * Math.sin(rad);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(lx, ly);
      ctx.strokeStyle = 'rgba(255, 209, 102, 0.7)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.shadowColor = '#ffd166';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    });

    // 6. Active Portal Solar Inscription Hologram if ACTIVE_CONDUIT
    if (state.mode === 'ACTIVE_CONDUIT') {
      const t = time * 0.004;
      ctx.save();

      // Expanding golden solar corona
      for (let r = 20; r <= 180; r += 35) {
        ctx.beginPath();
        ctx.arc(cx, cy, r + Math.sin(t + r) * 6, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 183, 3, ${Math.max(0, 0.7 - r / 200)})`;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#ffd166';
        ctx.shadowBlur = 15;
        ctx.stroke();
      }

      // Central Solar Singularity
      const goldGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, 100);
      goldGrad.addColorStop(0, '#ffffff');
      goldGrad.addColorStop(0.4, '#ffd166');
      goldGrad.addColorStop(0.8, '#ff9500');
      goldGrad.addColorStop(1, 'transparent');

      ctx.beginPath();
      ctx.arc(cx, cy, 95, 0, Math.PI * 2);
      ctx.fillStyle = goldGrad;
      ctx.fill();

      // Rotating Solar Rays
      for (let i = 0; i < 12; i++) {
        const rayAngle = (i * Math.PI / 6) + t;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(rayAngle) * 30, cy + Math.sin(rayAngle) * 30);
        ctx.lineTo(cx + Math.cos(rayAngle) * 120, cy + Math.sin(rayAngle) * 120);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.restore();
    }

    requestAnimationFrame(renderSpectrometry);
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
    state.mode = state.lockedGlyphs.length === 7 ? 'PENDING_READY' : 'SCANNING';

    SoundFX.laserScanTone();
    SoundFX.crystalChime(stepIdx);

    // Update Chevron Locus UI
    const locusEl = document.getElementById(`locus-${stepIdx}`);
    if (locusEl) {
      locusEl.classList.add('locked');
      locusEl.querySelector('.locus-symbol').textContent = symbolLabel;
    }

    updateAddressSlots();
    updateTelemetry();

    // NEGATIVE CHECK: 7 locked -> PENDING_READY, NOT ACTIVE_CONDUIT!
    if (state.lockedGlyphs.length === 7) {
      state.mode = 'PENDING_READY';
      btnActivate.removeAttribute('disabled');
      cartoucheStatusEl.textContent = 'EPIGRAPHIC HARMONIC ALIGNED // AWAITING EMISSION';
      cartoucheStatusEl.style.color = '#ffd166';
      teleStateEl.textContent = 'PENDING EMISSION';
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
      teleStateEl.textContent = 'SPECTRAL SCANNING';
      teleStateEl.style.color = '#ffd166';
      teleConfidenceEl.textContent = '99.4% OCR';
      cartoucheStatusEl.textContent = 'SPECTRAL LASER IDLE';
      cartoucheStatusEl.style.color = '#ffd166';
      footerStatusText.textContent = 'SPECTROMETER ONLINE // 9 LOCI SYNCHRONIZED';
    } else if (state.mode === 'SCANNING') {
      teleStateEl.textContent = `DECODING LOCUS [0${state.lockedGlyphs.length}]`;
      teleStateEl.style.color = '#00f0ff';
      teleConfidenceEl.textContent = `${92 + state.lockedGlyphs.length}% CONF`;
      cartoucheStatusEl.textContent = `HARMONIC ALIGNMENT ${state.lockedGlyphs.length}/7`;
      cartoucheStatusEl.style.color = '#00f0ff';
      footerStatusText.textContent = `SPECTROGRAPHIC MATCHING IN PROGRESS (${state.lockedGlyphs.length}/7)`;
    } else if (state.mode === 'PENDING_READY') {
      teleStateEl.textContent = 'PENDING EMISSION';
      teleStateEl.style.color = '#ffd166';
      cartoucheStatusEl.textContent = 'CARTOUCHE HARMONIC SYNCHRONIZED // MANUAL EMISSION REQUIRED';
      cartoucheStatusEl.style.color = '#ffd166';
      footerStatusText.textContent = 'ALL 7 GLYPHS LOCKED // INITIATE EPIGRAPHIC HARMONIC';
    } else if (state.mode === 'ACTIVE_CONDUIT') {
      teleStateEl.textContent = 'GOLDEN CONDUIT OPEN';
      teleStateEl.style.color = '#ffffff';
      teleConfidenceEl.textContent = '100% RESONANCE';
      cartoucheStatusEl.textContent = 'ACTIVE SOLAR WORMHOLE TRANSIT';
      cartoucheStatusEl.style.color = '#ffffff';
      footerStatusText.textContent = 'WARNING: ACTIVE EPIGRAPHIC QUANTUM CONDUIT IN PROGRESS';
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
    SoundFX.solarHarmonicActivation();
    updateTelemetry();
  }

  // --- DISENGAGE / PURGE TRIGGER ---
  function disengageConduit() {
    SoundFX.purgeDisengage();

    state.mode = 'IDLE';
    state.lockedGlyphs = [];
    btnActivate.setAttribute('disabled', 'true');

    const loci = lociRingEl.querySelectorAll('.locus-chevron');
    loci.forEach(l => {
      l.classList.remove('locked');
      l.querySelector('.locus-symbol').textContent = '𓇳';
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
  function loadPreset(presetKey) {
    if (state.safetyHoldEngaged) {
      triggerInterlockAlert();
      return;
    }
    const preset = PRESETS[presetKey];
    if (!preset) return;

    disengageConduit();

    preset.glyphs.forEach(glyphName => {
      const btn = document.querySelector(`.glyph-btn[data-glyph="${glyphName}"]`);
      const sym = btn ? btn.dataset.symbol : '𓇳';
      lockGlyph(glyphName, sym);
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

    requestAnimationFrame(renderSpectrometry);
  }

  window.addEventListener('DOMContentLoaded', () => {
    initLoci();
    attachEvents();
    updateTelemetry();
  });

})();
