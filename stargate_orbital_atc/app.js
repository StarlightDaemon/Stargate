/**
 * Orbital Air Traffic Control Console (SGC-ORBIT-04)
 * Aerospace Flight Corridor Routing & Radar Logic
 */

(function() {
  'use strict';

  // --- AUDIO SYNTHESIZER (Aerospace Avionics & Transponder Synthesizer) ---
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
    transponderChirp(stepIndex = 0) {
      const ctx = getAudioContext();
      if (!ctx) return;
      // High-tech aviation IFF transponder dual-tone chirp
      const freqs = [1030, 1090, 1150, 1220, 1300, 1380, 1470, 1560, 1660];
      const f1 = freqs[stepIndex % freqs.length];

      [f1, f1 * 1.25].forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, ctx.currentTime + i * 0.04);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.04 + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.04);
        osc.stop(ctx.currentTime + i * 0.04 + 0.08);
      });
    },
    radarLockBeep() {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    },
    alarm() {
      const ctx = getAudioContext();
      if (!ctx) return;
      // Dual-beep Master Caution
      [0, 0.15].forEach(delay => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0.3, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.1);
      });
    },
    orbitalBurnActivation() {
      const ctx = getAudioContext();
      if (!ctx) return;
      // Low rocket burn rumble
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(45, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(90, ctx.currentTime + 1.5);
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.8);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 4.0);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 4.0);
    },
    abortPurge() {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(350, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    }
  };

  // --- 12 ORBITAL WAYPOINT SECTORS (30° intervals) ---
  const WAYPOINTS = [
    { deg: 0, label: 'ZULU-01', id: 'wp-0' },
    { deg: 30, label: 'ZULU-02', id: 'wp-1' },
    { deg: 60, label: 'ZULU-03', id: 'wp-2' },
    { deg: 90, label: 'ZULU-04', id: 'wp-3' },
    { deg: 120, label: 'ZULU-05', id: 'wp-4' },
    { deg: 150, label: 'ZULU-06', id: 'wp-5' },
    { deg: 180, label: 'ZULU-07', id: 'wp-6' },
    { deg: 210, label: 'ZULU-08', id: 'wp-7' },
    { deg: 240, label: 'ZULU-09', id: 'wp-8' },
    { deg: 270, label: 'ZULU-10', id: 'wp-9' },
    { deg: 300, label: 'ZULU-11', id: 'wp-10' },
    { deg: 330, label: 'ZULU-12', id: 'wp-11' }
  ];

  // --- PRESET FLIGHT PLANS (6 Entries across 2 Tiers) ---
  const PRESETS = {
    'iss-corridor': {
      name: 'ISS ALPHA HABITAT',
      glyphs: ['CORRIDOR-GEO', 'APOGEE-VECTOR', 'PERIGEE-BURN', 'HOHMANN-TRANSFER', 'LEO-POLAR', 'MOLNIYA-ARC', 'EQUATORIAL-SLOT', 'ESCAPE-TRAJECTORY', 'LAGRANGE-L1']
    },
    'tiangong-station': {
      name: 'TIANGONG CORE',
      glyphs: ['APOGEE-VECTOR', 'PERIGEE-BURN', 'LEO-POLAR', 'HOHMANN-TRANSFER', 'CORRIDOR-GEO', 'EQUATORIAL-SLOT', 'MOLNIYA-ARC', 'LAGRANGE-L1', 'ESCAPE-TRAJECTORY']
    },
    'gateway-orbit': {
      name: 'LUNAR GATEWAY NRHO',
      glyphs: ['HOHMANN-TRANSFER', 'ESCAPE-TRAJECTORY', 'LAGRANGE-L1', 'APOGEE-VECTOR', 'CORRIDOR-GEO', 'LEO-POLAR', 'PERIGEE-BURN', 'MOLNIYA-ARC', 'EQUATORIAL-SLOT']
    },
    'jwst-l2': {
      name: 'WEBB L-2 HALO',
      glyphs: ['LAGRANGE-L1', 'ESCAPE-TRAJECTORY', 'HOHMANN-TRANSFER', 'CORRIDOR-GEO', 'APOGEE-VECTOR', 'EQUATORIAL-SLOT', 'MOLNIYA-ARC', 'LEO-POLAR', 'PERIGEE-BURN']
    },
    'starlink-ring': {
      name: 'STARLINK HIGH-SHELL',
      glyphs: ['LEO-POLAR', 'EQUATORIAL-SLOT', 'APOGEE-VECTOR', 'PERIGEE-BURN', 'CORRIDOR-GEO', 'HOHMANN-TRANSFER', 'MOLNIYA-ARC', 'LAGRANGE-L1', 'ESCAPE-TRAJECTORY']
    },
    'gps-constellation': {
      name: 'GPS BLOCK-III MEO',
      glyphs: ['MOLNIYA-ARC', 'CORRIDOR-GEO', 'APOGEE-VECTOR', 'HOHMANN-TRANSFER', 'EQUATORIAL-SLOT', 'LEO-POLAR', 'PERIGEE-BURN', 'LAGRANGE-L1', 'ESCAPE-TRAJECTORY']
    }
  };

  // --- STATE ---
  const state = {
    mode: 'IDLE', // IDLE, ROUTING, PENDING_READY, ACTIVE_CONDUIT
    lockedGlyphs: [], // Max 9
    safetyHoldEngaged: false,
    radarSweepAngle: 0,
    trackedTargets: [
      { r: 150, theta: 0.8, callsign: 'ISS-ALPHA', alt: '420km' },
      { r: 230, theta: 2.3, callsign: 'ORB-702', alt: '550km' },
      { r: 190, theta: 3.7, callsign: 'GPS-V-04', alt: '20.2k' },
      { r: 270, theta: 5.1, callsign: 'TIANGONG', alt: '390km' }
    ]
  };

  // --- DOM REFS ---
  const canvas = document.getElementById('radar-canvas');
  const ctx = canvas.getContext('2d');
  const waypointsRingEl = document.getElementById('waypoints-ring');
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
  const teleAltEl = document.getElementById('tele-alt');
  const corridorStatusEl = document.getElementById('corridor-status');
  const footerStatusText = document.getElementById('footer-status-text');

  // --- INITIALIZE 12 WAYPOINTS ---
  function initWaypoints() {
    waypointsRingEl.innerHTML = '';
    const radius = 290;
    const cx = 340;
    const cy = 340;

    WAYPOINTS.forEach((wp, idx) => {
      const el = document.createElement('div');
      el.className = 'waypoint-chevron';
      el.id = wp.id;
      el.dataset.index = idx;

      const rad = (wp.deg - 90) * (Math.PI / 180);
      const x = cx + radius * Math.cos(rad);
      const y = cy + radius * Math.sin(rad);

      el.style.left = `${x}px`;
      el.style.top = `${y}px`;

      el.innerHTML = `
        <span class="wp-label">Z-${idx + 1}</span>
        <span class="wp-symbol">⌖</span>
      `;
      waypointsRingEl.appendChild(el);
    });
  }

  // --- CANVAS RENDERING (Aerospace Multi-Band Radar Scope) ---
  function renderRadar(time) {
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    // 1. Concentric Altitude Distance Rings
    [60, 120, 180, 240, 300].forEach((r, idx) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = idx === 4 ? 'rgba(56, 189, 248, 0.45)' : 'rgba(56, 189, 248, 0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash(idx % 2 === 1 ? [4, 4] : []);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(100, 116, 139, 0.6)';
      ctx.font = '9px "Share Tech Mono"';
      ctx.fillText(`${(idx + 1) * 100}KM`, cx + 6, cy - r + 12);
    });

    // 2. Azimuth Radial Spokes (12 Spokes at 30°)
    WAYPOINTS.forEach(wp => {
      const rad = (wp.deg - 90) * (Math.PI / 180);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(rad) * 300, cy + Math.sin(rad) * 300);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // 3. Rotating Aerospace Radar Sweep
    state.radarSweepAngle = (time * 0.0014) % (Math.PI * 2);
    const sweepAngle = state.radarSweepAngle;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, 300, sweepAngle - 0.35, sweepAngle);
    ctx.closePath();
    ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(sweepAngle) * 300, cy + Math.sin(sweepAngle) * 300);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.restore();

    // 4. Tracked Orbital Targets (IFF Mode-S)
    state.trackedTargets.forEach(tgt => {
      const tx = cx + tgt.r * Math.cos(tgt.theta);
      const ty = cy + tgt.r * Math.sin(tgt.theta);

      let diff = sweepAngle - tgt.theta;
      while (diff < 0) diff += Math.PI * 2;
      const alpha = Math.max(0, 1 - (diff / (Math.PI * 1.5)));

      if (alpha > 0.05) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(tx - 3, ty - 3, 6, 6);
        ctx.fillStyle = `rgba(56, 189, 248, ${alpha * 0.9})`;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 8;
        ctx.fill();

        ctx.font = '8px "Share Tech Mono"';
        ctx.fillStyle = `rgba(240, 249, 255, ${alpha * 0.8})`;
        ctx.fillText(`${tgt.callsign} [${tgt.alt}]`, tx + 7, ty + 3);
        ctx.restore();
      }
    });

    // 5. Radar Vectors to Locked Waypoints
    state.lockedGlyphs.forEach((_, idx) => {
      const wp = WAYPOINTS[idx];
      const rad = (wp.deg - 90) * (Math.PI / 180);
      const wx = cx + 290 * Math.cos(rad);
      const wy = cy + 290 * Math.sin(rad);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(wx, wy);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    });

    // 6. Active Orbital Wormhole Singularity if ACTIVE_CONDUIT
    if (state.mode === 'ACTIVE_CONDUIT') {
      const t = time * 0.005;
      ctx.save();

      for (let r = 20; r <= 220; r += 40) {
        ctx.beginPath();
        ctx.arc(cx, cy, r + Math.sin(t + r) * 6, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(56, 189, 248, ${Math.max(0, 0.8 - r / 240)})`;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 12;
        ctx.stroke();
      }

      const orbGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 105);
      orbGrad.addColorStop(0, '#ffffff');
      orbGrad.addColorStop(0.3, '#38bdf8');
      orbGrad.addColorStop(0.7, '#0284c7');
      orbGrad.addColorStop(1, 'transparent');

      ctx.beginPath();
      ctx.arc(cx, cy, 95, 0, Math.PI * 2);
      ctx.fillStyle = orbGrad;
      ctx.fill();

      for (let i = 0; i < 12; i++) {
        const rayAngle = (i * Math.PI / 6) + t;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(rayAngle) * 20, cy + Math.sin(rayAngle) * 20);
        ctx.lineTo(cx + Math.cos(rayAngle) * 130, cy + Math.sin(rayAngle) * 130);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.restore();
    }

    requestAnimationFrame(renderRadar);
  }

  // --- DIALING & LOCKING LOGIC ---
  function lockGlyph(glyphId, symbolLabel) {
    if (state.mode === 'ACTIVE_CONDUIT') return;
    if (state.lockedGlyphs.length >= 9) return;

    if (state.safetyHoldEngaged) {
      triggerInterlockAlert();
      return;
    }

    const stepIdx = state.lockedGlyphs.length;
    state.lockedGlyphs.push({ id: glyphId, symbol: symbolLabel });
    state.mode = state.lockedGlyphs.length === 9 ? 'PENDING_READY' : 'ROUTING';

    SoundFX.transponderChirp(stepIdx);
    SoundFX.radarLockBeep();

    // Update Chevron UI
    const wpEl = document.getElementById(`wp-${stepIdx}`);
    if (wpEl) {
      wpEl.classList.add('locked');
      wpEl.querySelector('.wp-symbol').textContent = symbolLabel.split('-')[0] || '⌖';
    }

    updateAddressSlots();
    updateTelemetry();

    // NEGATIVE CHECK: 9 locked -> PENDING_READY, NOT ACTIVE_CONDUIT!
    if (state.lockedGlyphs.length === 9) {
      state.mode = 'PENDING_READY';
      btnActivate.removeAttribute('disabled');
      corridorStatusEl.textContent = 'CORRIDOR CLEARANCE ACQUIRED // READY FOR INSERTION';
      corridorStatusEl.style.color = '#38bdf8';
      teleStateEl.textContent = 'PENDING INSERTION';
      teleStateEl.style.color = '#38bdf8';
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

    addressCounterEl.textContent = `${state.lockedGlyphs.length} / 9 LOCKED`;
  }

  function updateTelemetry() {
    if (state.mode === 'IDLE') {
      teleStateEl.textContent = 'RADAR MONITORING';
      teleStateEl.style.color = '#38bdf8';
      teleAltEl.textContent = '420 x 412 KM';
      corridorStatusEl.textContent = 'ORBITAL CORRIDOR CLEAR';
      corridorStatusEl.style.color = '#38bdf8';
      footerStatusText.textContent = 'RADAR SCOPE ACTIVE // 12 ORBITAL SECTORS MONITORED';
    } else if (state.mode === 'ROUTING') {
      teleStateEl.textContent = `VECTORING SECTOR [Z-0${state.lockedGlyphs.length}]`;
      teleStateEl.style.color = '#7dd3fc';
      teleAltEl.textContent = `${420 + state.lockedGlyphs.length * 45} KM`;
      corridorStatusEl.textContent = `WAYPOINT LOCK ${state.lockedGlyphs.length}/9`;
      corridorStatusEl.style.color = '#7dd3fc';
      footerStatusText.textContent = `FLIGHT VECTOR ACQUISITION IN PROGRESS (${state.lockedGlyphs.length}/9)`;
    } else if (state.mode === 'PENDING_READY') {
      teleStateEl.textContent = 'PENDING INSERTION';
      teleStateEl.style.color = '#38bdf8';
      corridorStatusEl.textContent = 'ALL 9 WAYPOINTS LOCKED // TRANSMIT INSERTION CLEARANCE';
      corridorStatusEl.style.color = '#38bdf8';
      footerStatusText.textContent = 'ORBITAL CORRIDOR SYNCHRONIZED // MANUAL INSERTION REQUIRED';
    } else if (state.mode === 'ACTIVE_CONDUIT') {
      teleStateEl.textContent = 'ORBITAL INSERTION ACTIVE';
      teleStateEl.style.color = '#ffffff';
      teleAltEl.textContent = 'QUANTUM TRANSIT 100%';
      corridorStatusEl.textContent = 'ACTIVE ORBITAL WORMHOLE CORRIDOR';
      corridorStatusEl.style.color = '#ffffff';
      footerStatusText.textContent = 'WARNING: ACTIVE ORBITAL QUANTUM CONDUIT IN PROGRESS';
    }
  }

  // --- ACTIVATION TRIGGER ---
  function activateConduit() {
    if (state.lockedGlyphs.length < 9) return;

    if (state.safetyHoldEngaged) {
      triggerInterlockAlert();
      return;
    }

    state.mode = 'ACTIVE_CONDUIT';
    btnActivate.setAttribute('disabled', 'true');
    SoundFX.orbitalBurnActivation();
    updateTelemetry();
  }

  // --- DISENGAGE / ABORT TRIGGER ---
  function disengageConduit() {
    cancelPresetReplay(); // abort any in-flight flight-plan replay
    SoundFX.abortPurge();

    state.mode = 'IDLE';
    state.lockedGlyphs = [];
    btnActivate.setAttribute('disabled', 'true');

    const wps = waypointsRingEl.querySelectorAll('.waypoint-chevron');
    wps.forEach(w => {
      w.classList.remove('locked');
      w.querySelector('.wp-symbol').textContent = '⌖';
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
  // FILED FLIGHT-PLAN REPLAY: presets execute a pre-filed departure route —
  // the flight computer sequences the waypoints at autopilot cadence, far
  // faster than manual vectoring, but every waypoint still passes through
  // the same lockGlyph acquisition (transponder chirp, radar lock beep,
  // waypoint chevron, telemetry) as a manually vectored glyph. The 9th lock
  // lands in PENDING_READY; insertion clearance is NEVER transmitted on its own.
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

    const AUTOPILOT_STEP_MS = 240; // autopilot cadence: faster than manual vectoring, one waypoint at a time
    preset.glyphs.forEach((glyphName, i) => {
      const timer = setTimeout(() => {
        if (state.safetyHoldEngaged) {
          cancelPresetReplay();
          triggerInterlockAlert();
          return;
        }
        const btn = document.querySelector(`.glyph-btn[data-glyph="${glyphName}"]`);
        const sym = btn ? btn.dataset.symbol : '⌖';
        lockGlyph(glyphName, sym);
      }, AUTOPILOT_STEP_MS * (i + 1));
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

    requestAnimationFrame(renderRadar);
  }

  window.addEventListener('DOMContentLoaded', () => {
    initWaypoints();
    attachEvents();
    updateTelemetry();
  });

})();
