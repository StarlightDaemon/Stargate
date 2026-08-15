/**
 * Genomic Bio-Sequencing Lab Console (SGC-GENOM-05)
 * Capillary Electrophoresis & Molecular Base-Pair Synthesis Logic
 */

(function() {
  'use strict';

  // --- AUDIO SYNTHESIZER (Clinical Biotech & Fluorescent Synthesizer) ---
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
    pipetteClick() {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    },
    fluorescenceLock(stepIndex = 0) {
      const ctx = getAudioContext();
      if (!ctx) return;
      // Clinical violet fluorescence harmonics
      const freqs = [740, 880, 988, 1110, 1234, 1320, 1480, 1660];
      const base = freqs[stepIndex % freqs.length];

      [base, base * 1.5].forEach(f => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, ctx.currentTime);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      });
    },
    alarm() {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(700, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(1050, ctx.currentTime + 0.15);
      osc.frequency.linearRampToValueAtTime(700, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.28, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    },
    helixSynthesisActivation() {
      const ctx = getAudioContext();
      if (!ctx) return;
      // PCR Thermal drone
      const sub = ctx.createOscillator();
      const subGain = ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(75, ctx.currentTime);
      sub.frequency.linearRampToValueAtTime(120, ctx.currentTime + 2.0);
      subGain.gain.setValueAtTime(0.01, ctx.currentTime);
      subGain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 1.0);
      subGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 4.2);
      sub.connect(subGain);
      subGain.connect(ctx.destination);
      sub.start();
      sub.stop(ctx.currentTime + 4.2);

      [554.37, 830.61, 1108.73, 1661.22].forEach(f => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, ctx.currentTime);
        g.gain.setValueAtTime(0.01, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.8);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.8);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 3.8);
      });
    },
    flushPurge() {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(500, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.45);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    }
  };

  // --- 11 CHROMOSOME LOCI (360 / 11 = ~32.727°) ---
  const LOCI = [];
  for (let i = 0; i < 11; i++) {
    const deg = i * (360 / 11);
    LOCI.push({
      deg: deg,
      label: `LOC-${i + 1 < 10 ? '0' + (i + 1) : (i + 1)}`,
      id: `locus-${i}`
    });
  }

  // --- PRESET GENOMIC SEQUENCES (6 Entries across 2 Tiers) ---
  const PRESETS = {
    'syn-ch-1': {
      name: 'SYN-CHR-ALPHA',
      glyphs: ['ADENINE-α', 'CYTOSINE-β', 'GUANINE-γ', 'THYMINE-δ', 'PSEUDOURIDINE-ψ', 'METHYLGUANINE-μ', 'URACIL-ε', 'INOSINE-ζ']
    },
    'syn-ch-2': {
      name: 'HELIOTHROPE-V',
      glyphs: ['GUANINE-γ', 'CYTOSINE-β', 'ADENINE-α', 'THYMINE-δ', 'INOSINE-ζ', 'PSEUDOURIDINE-ψ', 'METHYLGUANINE-μ', 'URACIL-ε']
    },
    'syn-ch-3': {
      name: 'MYCO-CONDUIT',
      glyphs: ['URACIL-ε', 'PSEUDOURIDINE-ψ', 'ADENINE-α', 'GUANINE-γ', 'CYTOSINE-β', 'THYMINE-δ', 'INOSINE-ζ', 'METHYLGUANINE-μ']
    },
    'tardigrade-rad': {
      name: 'TARDIGRADE RAD-X',
      glyphs: ['THYMINE-δ', 'METHYLGUANINE-μ', 'CYTOSINE-β', 'GUANINE-γ', 'ADENINE-α', 'PSEUDOURIDINE-ψ', 'URACIL-ε', 'INOSINE-ζ']
    },
    'pyrococcus-fur': {
      name: 'PYROCOCCUS GEO',
      glyphs: ['CYTOSINE-β', 'GUANINE-γ', 'METHYLGUANINE-μ', 'THYMINE-δ', 'ADENINE-α', 'INOSINE-ζ', 'PSEUDOURIDINE-ψ', 'URACIL-ε']
    },
    'deinococcus-res': {
      name: 'DEINOCOCCUS POLAR',
      glyphs: ['METHYLGUANINE-μ', 'PSEUDOURIDINE-ψ', 'THYMINE-δ', 'ADENINE-α', 'CYTOSINE-β', 'GUANINE-γ', 'URACIL-ε', 'INOSINE-ζ']
    }
  };

  // --- STATE ---
  const state = {
    mode: 'IDLE', // IDLE, SEQUENCING, PENDING_READY, ACTIVE_CONDUIT
    lockedGlyphs: [], // Max 8
    safetyHoldEngaged: false,
    electrophoresisPeaks: []
  };

  // Generate simulated capillary chromatogram peaks
  for (let i = 0; i < 44; i++) {
    state.electrophoresisPeaks.push({
      theta: (i / 44) * Math.PI * 2,
      height: 10 + Math.random() * 35,
      color: ['#00ff9d', '#38bdf8', '#e879f9', '#f43f5e'][i % 4]
    });
  }

  // --- DOM REFS ---
  const canvas = document.getElementById('bio-canvas');
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
  const teleDepthEl = document.getElementById('tele-depth');
  const helicaseStatusEl = document.getElementById('helicase-status');
  const footerStatusText = document.getElementById('footer-status-text');

  // --- INITIALIZE 11 LOCI ---
  function initLoci() {
    lociRingEl.innerHTML = '';
    const radius = 290;
    const cx = 340;
    const cy = 340;

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
        <span class="locus-label">L-${idx + 1}</span>
        <span class="locus-symbol">🧬</span>
      `;
      lociRingEl.appendChild(el);
    });
  }

  // --- CANVAS RENDERING (Double Helix Ladder + Radial Chromatogram) ---
  function renderBio(time) {
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    // 1. Concentric Radial Electrophoresis Rings
    [65, 130, 195, 260].forEach((r, idx) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = idx === 3 ? 'rgba(192, 132, 252, 0.45)' : 'rgba(192, 132, 252, 0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash(idx % 2 === 1 ? [4, 4] : []);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // 2. 11 Loci Radial Spokes
    LOCI.forEach(loc => {
      const rad = (loc.deg - 90) * (Math.PI / 180);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(rad) * 285, cy + Math.sin(rad) * 285);
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // 3. Radial Chromatogram Peaks (Capillary Electrophoresis)
    const t = time * 0.002;
    state.electrophoresisPeaks.forEach(peak => {
      const pTheta = peak.theta + t * 0.2;
      const baseR = 195;
      const peakH = peak.height + Math.sin(t + peak.theta * 4) * 6;

      const x1 = cx + baseR * Math.cos(pTheta);
      const y1 = cy + baseR * Math.sin(pTheta);
      const x2 = cx + (baseR + peakH) * Math.cos(pTheta);
      const y2 = cy + (baseR + peakH) * Math.sin(pTheta);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = peak.color;
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // 4. Rotating Double-Helix Base Ladder in Middle Ring
    ctx.save();
    for (let deg = 0; deg < 360; deg += 10) {
      const rad = deg * (Math.PI / 180) + t;
      const wave = Math.sin(deg * 0.1 + t * 2) * 20;
      const r1 = 130 + wave;
      const r2 = 130 - wave;

      const p1x = cx + r1 * Math.cos(rad);
      const p1y = cy + r1 * Math.sin(rad);
      const p2x = cx + r2 * Math.cos(rad);
      const p2y = cy + r2 * Math.sin(rad);

      ctx.beginPath();
      ctx.moveTo(p1x, p1y);
      ctx.lineTo(p2x, p2y);
      ctx.strokeStyle = 'rgba(232, 121, 249, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();

    // 5. Polymerase Beams to Locked Loci
    state.lockedGlyphs.forEach((_, idx) => {
      const loc = LOCI[idx];
      const rad = (loc.deg - 90) * (Math.PI / 180);
      const lx = cx + 290 * Math.cos(rad);
      const ly = cy + 290 * Math.sin(rad);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(lx, ly);
      ctx.strokeStyle = 'rgba(232, 121, 249, 0.8)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.shadowColor = '#e879f9';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    });

    // 6. Active Quantum Genomic Singularity if ACTIVE_CONDUIT
    if (state.mode === 'ACTIVE_CONDUIT') {
      const tA = time * 0.005;
      ctx.save();

      for (let r = 20; r <= 230; r += 40) {
        ctx.beginPath();
        ctx.arc(cx, cy, r + Math.sin(tA + r) * 7, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(232, 121, 249, ${Math.max(0, 0.8 - r / 250)})`;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#e879f9';
        ctx.shadowBlur = 12;
        ctx.stroke();
      }

      const bioGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 105);
      bioGrad.addColorStop(0, '#ffffff');
      bioGrad.addColorStop(0.3, '#e879f9');
      bioGrad.addColorStop(0.7, '#c084fc');
      bioGrad.addColorStop(1, 'transparent');

      ctx.beginPath();
      ctx.arc(cx, cy, 95, 0, Math.PI * 2);
      ctx.fillStyle = bioGrad;
      ctx.fill();

      for (let i = 0; i < 11; i++) {
        const rayAngle = (i * Math.PI / 5.5) + tA;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(rayAngle) * 20, cy + Math.sin(rayAngle) * 20);
        ctx.lineTo(cx + Math.cos(rayAngle) * 135, cy + Math.sin(rayAngle) * 135);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.restore();
    }

    requestAnimationFrame(renderBio);
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
    state.mode = state.lockedGlyphs.length === 8 ? 'PENDING_READY' : 'SEQUENCING';

    SoundFX.pipetteClick();
    SoundFX.fluorescenceLock(stepIdx);

    // Update Chevron UI
    const locEl = document.getElementById(`locus-${stepIdx}`);
    if (locEl) {
      locEl.classList.add('locked');
      locEl.querySelector('.locus-symbol').textContent = symbolLabel.split('-')[0] || '🧬';
    }

    updateAddressSlots();
    updateTelemetry();

    // NEGATIVE CHECK: 8 locked -> PENDING_READY, NOT ACTIVE_CONDUIT!
    if (state.lockedGlyphs.length === 8) {
      state.mode = 'PENDING_READY';
      btnActivate.removeAttribute('disabled');
      helicaseStatusEl.textContent = 'GENOMIC TEMPLATE HYBRIDIZED // READY FOR SYNTHESIS';
      helicaseStatusEl.style.color = '#e879f9';
      teleStateEl.textContent = 'PENDING SYNTHESIS';
      teleStateEl.style.color = '#e879f9';
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
      teleStateEl.textContent = 'CAPILLARY RUNNING';
      teleStateEl.style.color = '#e879f9';
      teleDepthEl.textContent = '150X NGS';
      helicaseStatusEl.textContent = 'FLOWCELL IDLE';
      helicaseStatusEl.style.color = '#c084fc';
      footerStatusText.textContent = 'FLOWCELL ACTIVE // 11 CHROMOSOME LOCI CALIBRATED';
    } else if (state.mode === 'SEQUENCING') {
      teleStateEl.textContent = `ANNEALING LOCUS [LOC-0${state.lockedGlyphs.length}]`;
      teleStateEl.style.color = '#38bdf8';
      teleDepthEl.textContent = `${150 + state.lockedGlyphs.length * 25}X NGS`;
      helicaseStatusEl.textContent = `BASE HYBRIDIZATION ${state.lockedGlyphs.length}/8`;
      helicaseStatusEl.style.color = '#38bdf8';
      footerStatusText.textContent = `POLYMERASE EXTENSION IN PROGRESS (${state.lockedGlyphs.length}/8)`;
    } else if (state.mode === 'PENDING_READY') {
      teleStateEl.textContent = 'PENDING SYNTHESIS';
      teleStateEl.style.color = '#e879f9';
      helicaseStatusEl.textContent = 'ALL 8 BASES HYBRIDIZED // MANUAL SYNTHESIS REQUIRED';
      helicaseStatusEl.style.color = '#e879f9';
      footerStatusText.textContent = 'GENOMIC TEMPLATE STABLE // SYNTHESIZE QUANTUM HELIX';
    } else if (state.mode === 'ACTIVE_CONDUIT') {
      teleStateEl.textContent = 'QUANTUM HELIX ACTIVE';
      teleStateEl.style.color = '#ffffff';
      teleDepthEl.textContent = 'EXPRESSION 100%';
      helicaseStatusEl.textContent = 'ACTIVE QUANTUM GENOMIC CONDUIT';
      helicaseStatusEl.style.color = '#ffffff';
      footerStatusText.textContent = 'WARNING: ACTIVE GENOMIC CONDUIT SYNTHESIS IN PROGRESS';
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
    SoundFX.helixSynthesisActivation();
    updateTelemetry();
  }

  // --- DISENGAGE / ABORT TRIGGER ---
  function disengageConduit() {
    cancelPresetReplay(); // abort any in-flight thermocycler replay
    SoundFX.flushPurge();

    state.mode = 'IDLE';
    state.lockedGlyphs = [];
    btnActivate.setAttribute('disabled', 'true');

    const loci = lociRingEl.querySelectorAll('.locus-chevron');
    loci.forEach(l => {
      l.classList.remove('locked');
      l.querySelector('.locus-symbol').textContent = '🧬';
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
  // THERMOCYCLER PROGRAM REPLAY: presets anneal a validated primer library
  // one locus per PCR cycle — the thermocycler runs at machine speed, far
  // faster than manual pipetting, but every base still passes through the
  // same lockGlyph hybridization lock (pipette click, fluorescence lock,
  // locus chevron, telemetry) as a manually dialed glyph. The 8th lock lands
  // in PENDING_READY; synthesis NEVER starts on its own.
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

    const CYCLE_STEP_MS = 260; // thermocycler cadence: faster than pipetting, one locus per cycle
    preset.glyphs.forEach((glyphName, i) => {
      const timer = setTimeout(() => {
        if (state.safetyHoldEngaged) {
          cancelPresetReplay();
          triggerInterlockAlert();
          return;
        }
        const btn = document.querySelector(`.glyph-btn[data-glyph="${glyphName}"]`);
        const sym = btn ? btn.dataset.symbol : '🧬';
        lockGlyph(glyphName, sym);
      }, CYCLE_STEP_MS * (i + 1));
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

    requestAnimationFrame(renderBio);
  }

  window.addEventListener('DOMContentLoaded', () => {
    initLoci();
    attachEvents();
    updateTelemetry();
  });

})();
