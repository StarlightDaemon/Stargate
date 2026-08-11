/**
 * DITMCO // Municipal Conduit Registry Terminal - Application Logic
 * Department of Interzonal Transit & Municipal Conduit Oversight
 * Revision 8.41 - Form 1099-TX Processing Engine
 */

(function() {
  'use strict';

  // =========================================================================
  // CONSTANTS & REGISTRY DATA
  // =========================================================================
  const REQUIRED_ADDRESS_LENGTH = 8;
  const TOTAL_CHEVRONS = 12;
  const RESERVED_CHEVRONS = 4; // 8 active + 4 reserved priority positions

  const MUNICIPAL_GLYPHS = [
    { symbol: '§', code: 'SEC-01', name: 'Municipal Statute' },
    { symbol: '☵', code: 'HYD-02', name: 'Water & Siphon Conduit' },
    { symbol: '⌬', code: 'ENG-03', name: 'Reactor Vector' },
    { symbol: '⍚', code: 'ARC-04', name: 'Deed & Records Registry' },
    { symbol: '⊞', code: 'WBD-05', name: 'Ward Boundary Grid' },
    { symbol: '⌗', code: 'DOK-06', name: 'Cargo Manifest Docket' },
    { symbol: '⌘', code: 'ADM-07', name: 'Commissioner Exec Order' },
    { symbol: '⌥', code: 'ALT-08', name: 'Auxiliary Bypass Flange' },
    { symbol: '⎈', code: 'NAV-09', name: 'Spatial Coordinate Datum' },
    { symbol: '⏣', code: 'ZON-10', name: 'Interzonal Perimeter Fence' },
    { symbol: '⎇', code: 'BRN-11', name: 'Secondary Lateral Trunk' },
    { symbol: '⌖', code: 'LOC-12', name: 'Target Focal Aperture' },
    { symbol: '⍝', code: 'AUD-13', name: 'Comptroller Review Mark' },
    { symbol: '⍎', code: 'EXC-14', name: 'Municipal Exclusion Zone' },
    { symbol: '⍕', code: 'VAL-15', name: 'Tax Assessment Digest' },
    { symbol: '⍰', code: 'REQ-16', name: 'Pending Variance Claim' },
    { symbol: '⌸', code: 'CLR-17', name: 'Sanitary Drain Vector' },
    { symbol: '⌹', code: 'MAT-18', name: 'Allocation Ledger Matrix' },
    { symbol: '⌺', code: 'FIL-19', name: 'Microfiche Record Spool' },
    { symbol: '⌻', code: 'QUR-20', name: 'Quarantine Isolation' },
    { symbol: '⌼', code: 'TER-21', name: 'Terminal Annex Sub-station' },
    { symbol: '⍁', code: 'VOL-22', name: 'Voltage Phase Regulator' },
    { symbol: '⍂', code: 'SUR-23', name: 'Public Works Survey Pin' },
    { symbol: '⍃', code: 'INS-24', name: 'Structural Inspection' },
    { symbol: '⍄', code: 'PLN-25', name: 'City Planning Ordinance' },
    { symbol: '⍅', code: 'TKT-26', name: 'Inter-Ward Transit Token' },
    { symbol: '⍆', code: 'CAR-27', name: 'Pneumatic Carrier Capsule' },
    { symbol: '⍇', code: 'REL-28', name: 'Mainframe Magnetic Relay' },
    { symbol: '⍈', code: 'TIM-29', name: 'Chronometer Epoch Check' },
    { symbol: '⍙', code: 'VAP-30', name: 'Steam Evacuation Flue' },
    { symbol: '⍚', code: 'RES-31', name: 'Judicial Easement' },
    { symbol: '⍛', code: 'SUM-32', name: 'Final Checksum Digest' }
  ];

  const QUICK_DIAL_PRESETS = {
    qd1: {
      name: 'City Hall Archives Annex',
      code: '01-A',
      tier: 1,
      sequence: [0, 3, 18, 8, 6, 13, 27, 31] // Indices in MUNICIPAL_GLYPHS
    },
    qd2: {
      name: 'Water Works Hydro-Vector',
      code: '04-W',
      tier: 1,
      sequence: [1, 7, 16, 29, 21, 4, 22, 31]
    },
    qd3: {
      name: 'Postal Pneumatic Transit Hub',
      code: '09-P',
      tier: 1,
      sequence: [26, 25, 5, 10, 11, 28, 17, 31]
    },
    qd4: {
      name: 'Sub-Level 13 Hazardous Sump',
      code: '13-X',
      tier: 2,
      sequence: [12, 19, 13, 2, 16, 29, 23, 31]
    },
    qd5: {
      name: 'Off-Grid Perimeter Outpost 9',
      code: '99-Z',
      tier: 2,
      sequence: [9, 8, 3, 24, 22, 7, 27, 31]
    },
    qd6: {
      name: 'Unregistered Deep Sector',
      code: '??-Ω',
      tier: 2,
      sequence: [15, 14, 2, 19, 11, 13, 21, 31]
    }
  };

  // =========================================================================
  // STATE STORE
  // =========================================================================
  const state = {
    audioEnabled: true,
    isLockoutActive: false, // Administrative Compliance Freeze
    systemStatus: 'DORMANT', // DORMANT, SEEKING, FILED_READY, ENGAGED, TERMINATING, REJECTED
    enteredGlyphs: [], // Array of selected glyph objects (up to 8)
    activeDocketId: generateDocketId(),
    activeSessionStartTime: null,
    sessionTimerInterval: null,
    carrierAudioNode: null,
    isProcessingBatch: false
  };

  function generateDocketId() {
    const num = Math.floor(1000 + Math.random() * 9000);
    const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    return `DKT-${Math.floor(100 + Math.random() * 900)}-${num}-${letter}`;
  }

  // =========================================================================
  // AUDIO SYNTHESIS ENGINE (Web Audio API - Text-mode/Bureaucratic Sonic Character)
  // =========================================================================
  class AudioSynthesizer {
    constructor() {
      this.ctx = null;
      this.carrierOsc1 = null;
      this.carrierOsc2 = null;
      this.carrierGain = null;
    }

    init() {
      if (!this.ctx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          this.ctx = new AudioContextClass();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    // Model M / Teletype mechanical relay click
    playKeyClick() {
      if (!state.audioEnabled || !this.ctx) return;
      this.init();
      const t = this.ctx.currentTime;
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, t);
      filter.Q.setValueAtTime(3, t);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.035);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.04);
    }

    // Dot-matrix seek chirp / 1200 baud frequency sweep
    playSeekChirp() {
      if (!state.audioEnabled || !this.ctx) return;
      this.init();
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(750, t);
      osc.frequency.setValueAtTime(1250, t + 0.02);
      osc.frequency.setValueAtTime(980, t + 0.04);
      osc.frequency.setValueAtTime(1600, t + 0.06);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.09);
    }

    // Hydraulic docket stamp impact + verification ping
    playStampLock() {
      if (!state.audioEnabled || !this.ctx) return;
      this.init();
      const t = this.ctx.currentTime;

      // Heavy stamp thud (Low bandpass impact)
      const thudOsc = this.ctx.createOscillator();
      const thudGain = this.ctx.createGain();
      thudOsc.type = 'sine';
      thudOsc.frequency.setValueAtTime(140, t);
      thudOsc.frequency.exponentialRampToValueAtTime(30, t + 0.12);
      thudGain.gain.setValueAtTime(0.6, t);
      thudGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      thudOsc.connect(thudGain);
      thudGain.connect(this.ctx.destination);
      thudOsc.start(t);
      thudOsc.stop(t + 0.13);

      // High stamp validation ding (1150Hz)
      const dingOsc = this.ctx.createOscillator();
      const dingGain = this.ctx.createGain();
      dingOsc.type = 'sine';
      dingOsc.frequency.setValueAtTime(1150, t + 0.04);
      dingGain.gain.setValueAtTime(0.18, t + 0.04);
      dingGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      dingOsc.connect(dingGain);
      dingGain.connect(this.ctx.destination);
      dingOsc.start(t + 0.04);
      dingOsc.stop(t + 0.23);
    }

    // Continuous 60Hz/120Hz Mainframe Transformer Hum & Carrier Tone
    startMainframeCarrier() {
      if (!state.audioEnabled || !this.ctx) return;
      this.init();
      this.stopMainframeCarrier();

      const t = this.ctx.currentTime;
      this.carrierOsc1 = this.ctx.createOscillator();
      this.carrierOsc2 = this.ctx.createOscillator();
      this.carrierGain = this.ctx.createGain();

      this.carrierOsc1.type = 'sawtooth';
      this.carrierOsc1.frequency.setValueAtTime(60, t); // 60Hz utility hum

      this.carrierOsc2.type = 'sine';
      this.carrierOsc2.frequency.setValueAtTime(120, t); // 120Hz harmonic

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(350, t);

      this.carrierGain.gain.setValueAtTime(0.001, t);
      this.carrierGain.gain.linearRampToValueAtTime(0.12, t + 0.5);

      this.carrierOsc1.connect(filter);
      this.carrierOsc2.connect(filter);
      filter.connect(this.carrierGain);
      this.carrierGain.connect(this.ctx.destination);

      this.carrierOsc1.start(t);
      this.carrierOsc2.start(t);
    }

    stopMainframeCarrier() {
      if (this.carrierGain && this.ctx) {
        const t = this.ctx.currentTime;
        try {
          this.carrierGain.gain.linearRampToValueAtTime(0.001, t + 0.25);
          if (this.carrierOsc1) this.carrierOsc1.stop(t + 0.3);
          if (this.carrierOsc2) this.carrierOsc2.stop(t + 0.3);
        } catch (e) {
          // ignore already stopped
        }
      }
      this.carrierOsc1 = null;
      this.carrierOsc2 = null;
      this.carrierGain = null;
    }

    // Teletype paper tear & disengage spool down
    playDisengageTear() {
      if (!state.audioEnabled || !this.ctx) return;
      this.init();
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(340, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.28);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.3);
    }

    // Statutory audit hold / error buzzer (180Hz square wave triple pulse)
    playErrorBuzzer() {
      if (!state.audioEnabled || !this.ctx) return;
      this.init();
      const t = this.ctx.currentTime;

      [0, 0.12, 0.24].forEach(offset => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(185, t + offset);

        gain.gain.setValueAtTime(0.3, t + offset);
        gain.gain.setValueAtTime(0.001, t + offset + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t + offset);
        osc.stop(t + offset + 0.085);
      });
    }
  }

  const audio = new AudioSynthesizer();

  // =========================================================================
  // CANVAS CONDUIT VECTOR OSCILLOSCOPE
  // =========================================================================
  class ConduitCanvasRenderer {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      this.ctx = this.canvas.getContext('2d');
      this.width = this.canvas.width;
      this.height = this.canvas.height;
      this.centerX = this.width / 2;
      this.centerY = this.height / 2;
      this.animationFrameId = null;
      this.phase = 0;
      this.particles = [];
      this.initParticles();
      this.render();
    }

    initParticles() {
      this.particles = [];
      for (let i = 0; i < 40; i++) {
        this.particles.push({
          angle: Math.random() * Math.PI * 2,
          radius: 20 + Math.random() * 120,
          speed: 0.01 + Math.random() * 0.02,
          size: 1 + Math.random() * 2,
          alpha: 0.2 + Math.random() * 0.6
        });
      }
    }

    render() {
      this.phase += 0.035;
      this.ctx.clearRect(0, 0, this.width, this.height);

      const cx = this.centerX;
      const cy = this.centerY;

      // 1. Draw CRT grid vectors & calibration rings
      this.ctx.strokeStyle = 'rgba(51, 255, 102, 0.12)';
      this.ctx.lineWidth = 1;

      // Outer ring
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, 140, 0, Math.PI * 2);
      this.ctx.stroke();

      // Middle ring
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, 95, 0, Math.PI * 2);
      this.ctx.stroke();

      // Inner aperture
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, 45, 0, Math.PI * 2);
      this.ctx.stroke();

      // Radial cross vector ticks
      for (let i = 0; i < 12; i++) {
        const rad = (i * Math.PI) / 6;
        const x1 = cx + Math.cos(rad) * 45;
        const y1 = cy + Math.sin(rad) * 45;
        const x2 = cx + Math.cos(rad) * 140;
        const y2 = cy + Math.sin(rad) * 140;

        this.ctx.strokeStyle = (i < state.enteredGlyphs.length) 
          ? 'rgba(51, 255, 102, 0.45)' 
          : 'rgba(51, 255, 102, 0.1)';
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
      }

      // 2. Render state-dependent waveforms
      if (state.systemStatus === 'ENGAGED') {
        // Active conduit horizon waveform & particle vortex
        this.ctx.fillStyle = 'rgba(51, 255, 102, 0.08)';
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, 80 + Math.sin(this.phase * 2) * 5, 0, Math.PI * 2);
        this.ctx.fill();

        // Shimmering raster waveform
        this.ctx.strokeStyle = '#33ff66';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        for (let a = 0; a < Math.PI * 2; a += 0.05) {
          const r = 70 + Math.sin(a * 8 + this.phase * 3) * 8 + Math.cos(a * 3 - this.phase * 4) * 6;
          const x = cx + Math.cos(a) * r;
          const y = cy + Math.sin(a) * r;
          if (a === 0) this.ctx.moveTo(x, y);
          else this.ctx.lineTo(x, y);
        }
        this.ctx.closePath();
        this.ctx.stroke();

        // Flowing transit particles
        this.ctx.fillStyle = '#66ff88';
        this.particles.forEach(p => {
          p.angle += p.speed;
          p.radius -= 0.4;
          if (p.radius < 10) p.radius = 135;
          const px = cx + Math.cos(p.angle) * p.radius;
          const py = cy + Math.sin(p.angle) * p.radius;
          this.ctx.beginPath();
          this.ctx.arc(px, py, p.size, 0, Math.PI * 2);
          this.ctx.fill();
        });

      } else if (state.systemStatus === 'SEEKING' || state.systemStatus === 'FILED_READY') {
        // Scanning radar sweep & locked sector polygons
        const sweepAngle = this.phase * 1.5;
        this.ctx.strokeStyle = 'rgba(255, 176, 0, 0.7)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy);
        this.ctx.lineTo(cx + Math.cos(sweepAngle) * 140, cy + Math.sin(sweepAngle) * 140);
        this.ctx.stroke();

        // Connect locked points
        if (state.enteredGlyphs.length > 1) {
          this.ctx.strokeStyle = 'rgba(51, 255, 102, 0.8)';
          this.ctx.lineWidth = 1.5;
          this.ctx.beginPath();
          state.enteredGlyphs.forEach((_, idx) => {
            const angle = (idx * (360 / TOTAL_CHEVRONS) - 90) * (Math.PI / 180);
            const gx = cx + Math.cos(angle) * 95;
            const gy = cy + Math.sin(angle) * 95;
            if (idx === 0) this.ctx.moveTo(gx, gy);
            else this.ctx.lineTo(gx, gy);
          });
          if (state.enteredGlyphs.length === REQUIRED_ADDRESS_LENGTH) {
            this.ctx.closePath();
          }
          this.ctx.stroke();
        }

      } else {
        // Idle CRT sweep trace
        const traceX = cx + Math.sin(this.phase * 0.8) * 120;
        this.ctx.strokeStyle = 'rgba(51, 255, 102, 0.25)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(traceX, cy - 130);
        this.ctx.lineTo(traceX, cy + 130);
        this.ctx.stroke();
      }

      this.animationFrameId = requestAnimationFrame(() => this.render());
    }
  }

  // =========================================================================
  // DOM ELEMENT REFS
  // =========================================================================
  let dom = {};

  function cacheDom() {
    dom = {
      sysStatusText: document.getElementById('sysStatusText'),
      sessionClock: document.getElementById('sessionClock'),
      audioToggleBtn: document.getElementById('audioToggleBtn'),
      audioIcon: document.getElementById('audioIcon'),
      audioLabel: document.getElementById('audioLabel'),
      operatorHelpBtn: document.getElementById('operatorHelpBtn'),
      helpModalBackdrop: document.getElementById('helpModalBackdrop'),
      helpModalCloseBtn: document.getElementById('helpModalCloseBtn'),
      modalDismissBtn: document.getElementById('modalDismissBtn'),
      
      docketRefId: document.getElementById('docketRefId'),
      clearanceTierText: document.getElementById('clearanceTierText'),
      commissionerSealText: document.getElementById('commissionerSealText'),
      queuePosition: document.getElementById('queuePosition'),
      
      radialStationsRing: document.getElementById('radialStationsRing'),
      centerStampOverlay: document.getElementById('centerStampOverlay'),
      stampTitle: document.getElementById('stampTitle'),
      stampStatus: document.getElementById('stampStatus'),
      stampSub: document.getElementById('stampSub'),
      stampMeta: document.getElementById('stampMeta'),
      conduitStatusLight: document.getElementById('conduitStatusLight'),
      conduitStatusMsg: document.getElementById('conduitStatusMsg'),
      
      chevronSlotsGrid: document.getElementById('chevronSlotsGrid'),
      glyphGrid: document.getElementById('glyphGrid'),
      counterCurrent: document.getElementById('counterCurrent'),
      
      lockoutToggleBtn: document.getElementById('lockoutToggleBtn'),
      lockoutSwitchText: document.getElementById('lockoutSwitchText'),
      lockoutLed: document.getElementById('lockoutLed'),
      lockoutStatusLabel: document.getElementById('lockoutStatusLabel'),
      
      engageBtn: document.getElementById('engageBtn'),
      disengageBtn: document.getElementById('disengageBtn'),
      authStatusPill: document.getElementById('authStatusPill'),
      
      monFlux: document.getElementById('monFlux'),
      monIntegrity: document.getElementById('monIntegrity'),
      monDuration: document.getElementById('monDuration'),
      logStream: document.getElementById('logStream')
    };
  }

  // =========================================================================
  // UI INITIALIZATION & POPULATION
  // =========================================================================

  function initUI() {
    cacheDom();
    startClock();
    buildRadialStations();
    buildLinearDocketSlots();
    buildGlyphGrid();
    bindEvents();
    updateUIState();
    logTeleprinter('DITMCO SYSTEM READY. FORM 1099-TX CLEARED FOR DATA ENTRY.', 'system');
  }

  function startClock() {
    setInterval(() => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      const ms = String(Math.floor(now.getMilliseconds() / 10)).padStart(2, '0');
      if (dom.sessionClock) {
        dom.sessionClock.textContent = `${h}:${m}:${s}.${ms}`;
      }
    }, 45);
  }

  // 12 Radial Chevron Stations placed geometrically around center scope
  function buildRadialStations() {
    if (!dom.radialStationsRing) return;
    dom.radialStationsRing.innerHTML = '';

    const radius = 175; // px from center
    const centerX = 280; // container width 560 / 2
    const centerY = 210; // container height 420 / 2

    for (let i = 0; i < TOTAL_CHEVRONS; i++) {
      const isReserved = i >= REQUIRED_ADDRESS_LENGTH;
      const angleDeg = i * (360 / TOTAL_CHEVRONS) - 90;
      const angleRad = angleDeg * (Math.PI / 180);

      const posX = centerX + Math.cos(angleRad) * radius;
      const posY = centerY + Math.sin(angleRad) * radius;

      const station = document.createElement('div');
      station.className = `radial-chevron-station ${isReserved ? 'reserved' : ''}`;
      station.id = `radialStation-${i}`;
      station.style.left = `${posX}px`;
      station.style.top = `${posY}px`;

      station.innerHTML = `
        <span class="ch-num">CH-${String(i + 1).padStart(2, '0')}</span>
        <span class="ch-symbol">${isReserved ? '🔒' : '—'}</span>
      `;

      dom.radialStationsRing.appendChild(station);
    }
  }

  // 12 Linear Horizontal Chevron Slots in Staging Ledger
  function buildLinearDocketSlots() {
    if (!dom.chevronSlotsGrid) return;
    dom.chevronSlotsGrid.innerHTML = '';

    for (let i = 0; i < TOTAL_CHEVRONS; i++) {
      const isReserved = i >= REQUIRED_ADDRESS_LENGTH;
      const card = document.createElement('div');
      card.className = `chevron-slot-card ${isReserved ? 'reserved' : ''}`;
      card.id = `chevronSlotCard-${i}`;

      card.innerHTML = `
        <div class="slot-top">
          <span class="slot-id">FIELD [${String(i + 1).padStart(2, '0')}]</span>
          <span class="slot-status" id="slotStatus-${i}">${isReserved ? 'RESERVED' : 'DORMANT'}</span>
        </div>
        <div class="slot-body">
          <span class="slot-glyph" id="slotGlyph-${i}">${isReserved ? '🔒' : '·'}</span>
          <span class="slot-name" id="slotName-${i}">${isReserved ? 'Priority Override' : '[Empty Docket Slot]'}</span>
        </div>
        <div class="slot-stamp-tag" id="slotStamp-${i}">
          ${isReserved ? 'SEC-44 RESERVED' : '[UNALLOCATED]'}
        </div>
      `;

      dom.chevronSlotsGrid.appendChild(card);
    }
  }

  // 32 Municipal Bureaucratic Section Glyphs
  function buildGlyphGrid() {
    if (!dom.glyphGrid) return;
    dom.glyphGrid.innerHTML = '';

    MUNICIPAL_GLYPHS.forEach((item, index) => {
      const btn = document.createElement('button');
      btn.className = 'glyph-btn';
      btn.id = `glyphBtn-${index}`;
      btn.setAttribute('data-glyph-index', index);
      btn.setAttribute('title', `${item.code} : ${item.name}`);

      btn.innerHTML = `
        <span class="glyph-symbol">${item.symbol}</span>
        <span class="glyph-code">${item.code}</span>
      `;

      btn.addEventListener('click', () => {
        handleGlyphSelection(item, index);
      });

      dom.glyphGrid.appendChild(btn);
    });
  }

  // =========================================================================
  // LOGGING / TELEPRINTER AUDIT TRAIL
  // =========================================================================
  function logTeleprinter(message, type = 'normal') {
    if (!dom.logStream) return;
    const now = new Date();
    const ts = `[${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}]`;
    
    const line = document.createElement('div');
    line.className = `log-line ${type}`;
    line.textContent = `${ts} ${message}`;

    dom.logStream.appendChild(line);
    dom.logStream.scrollTop = dom.logStream.scrollHeight;
  }

  // =========================================================================
  // EVENT BINDINGS
  // =========================================================================
  function bindEvents() {
    // Audio toggle
    if (dom.audioToggleBtn) {
      dom.audioToggleBtn.addEventListener('click', () => {
        state.audioEnabled = !state.audioEnabled;
        dom.audioIcon.textContent = state.audioEnabled ? '🔊' : '🔇';
        dom.audioLabel.textContent = state.audioEnabled ? 'AUDIO: ON' : 'AUDIO: MUTED';
        if (state.audioEnabled) audio.init();
        else audio.stopMainframeCarrier();
      });
    }

    // Help Modal
    if (dom.operatorHelpBtn) {
      dom.operatorHelpBtn.addEventListener('click', openHelpModal);
    }
    if (dom.helpModalCloseBtn) {
      dom.helpModalCloseBtn.addEventListener('click', closeHelpModal);
    }
    if (dom.modalDismissBtn) {
      dom.modalDismissBtn.addEventListener('click', closeHelpModal);
    }
    if (dom.helpModalBackdrop) {
      dom.helpModalBackdrop.addEventListener('click', (e) => {
        if (e.target === dom.helpModalBackdrop) closeHelpModal();
      });
    }
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && dom.helpModalBackdrop && dom.helpModalBackdrop.classList.contains('open')) {
        closeHelpModal();
      }
    });

    // Lockout Switch (Compliance Freeze)
    if (dom.lockoutToggleBtn) {
      dom.lockoutToggleBtn.addEventListener('click', toggleLockout);
    }

    // Engage Button
    if (dom.engageBtn) {
      dom.engageBtn.addEventListener('click', handleEngageClick);
    }

    // Disengage Button (HARD REQUIREMENT: Always accessible, fully tested)
    if (dom.disengageBtn) {
      dom.disengageBtn.addEventListener('click', handleDisengageClick);
    }

    // Quick-Dial Buttons
    document.querySelectorAll('.qd-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const qdId = btn.getAttribute('data-qd-id');
        handleQuickDial(qdId);
      });
    });
  }

  function openHelpModal() {
    audio.playKeyClick();
    if (dom.helpModalBackdrop) {
      dom.helpModalBackdrop.classList.add('open');
      dom.helpModalBackdrop.setAttribute('aria-hidden', 'false');
    }
  }

  function closeHelpModal() {
    audio.playKeyClick();
    if (dom.helpModalBackdrop) {
      dom.helpModalBackdrop.classList.remove('open');
      dom.helpModalBackdrop.setAttribute('aria-hidden', 'true');
    }
  }

  // =========================================================================
  // CORE WORKFLOW: GLYPH SELECTION & STAMPING
  // =========================================================================

  function handleGlyphSelection(glyph, glyphIndex) {
    if (state.isProcessingBatch || state.systemStatus === 'ENGAGED') return;
    if (state.enteredGlyphs.length >= REQUIRED_ADDRESS_LENGTH) return;

    audio.playKeyClick();
    const targetSlotIndex = state.enteredGlyphs.length;
    state.enteredGlyphs.push({ ...glyph, index: glyphIndex });

    // 1. Advance to SEEKING state for this slot
    setSlotSeeking(targetSlotIndex, glyph);

    // 2. After micro-delay for dot-matrix carriage indexing, slam stamp to LOCKED
    setTimeout(() => {
      lockSlot(targetSlotIndex, glyph);
      updateUIState();
    }, 140);
  }

  function setSlotSeeking(slotIdx, glyph) {
    state.systemStatus = 'SEEKING';
    audio.playSeekChirp();

    // Radial station
    const radialStation = document.getElementById(`radialStation-${slotIdx}`);
    if (radialStation) {
      radialStation.classList.add('state-seeking');
      radialStation.querySelector('.ch-symbol').textContent = glyph.symbol;
    }

    // Linear card
    const card = document.getElementById(`chevronSlotCard-${slotIdx}`);
    if (card) {
      card.classList.add('state-seeking');
      const status = document.getElementById(`slotStatus-${slotIdx}`);
      const glyphEl = document.getElementById(`slotGlyph-${slotIdx}`);
      const nameEl = document.getElementById(`slotName-${slotIdx}`);
      const stampEl = document.getElementById(`slotStamp-${slotIdx}`);

      if (status) status.textContent = 'SEEKING...';
      if (glyphEl) glyphEl.textContent = glyph.symbol;
      if (nameEl) nameEl.textContent = `Validating ${glyph.code}...`;
      if (stampEl) stampEl.textContent = 'INDEXING LEDGER';
    }

    logTeleprinter(`INDEXING FIELD [0${slotIdx + 1}]: ${glyph.code} (${glyph.name})...`, 'normal');
  }

  function lockSlot(slotIdx, glyph) {
    audio.playStampLock();

    // Radial station
    const radialStation = document.getElementById(`radialStation-${slotIdx}`);
    if (radialStation) {
      radialStation.classList.remove('state-seeking');
      radialStation.classList.add('state-locked');
      radialStation.querySelector('.ch-symbol').textContent = glyph.symbol;
    }

    // Linear card
    const card = document.getElementById(`chevronSlotCard-${slotIdx}`);
    if (card) {
      card.classList.remove('state-seeking');
      card.classList.add('state-locked');
      const status = document.getElementById(`slotStatus-${slotIdx}`);
      const glyphEl = document.getElementById(`slotGlyph-${slotIdx}`);
      const nameEl = document.getElementById(`slotName-${slotIdx}`);
      const stampEl = document.getElementById(`slotStamp-${slotIdx}`);

      if (status) status.textContent = 'LOCKED';
      if (glyphEl) glyphEl.textContent = glyph.symbol;
      if (nameEl) nameEl.textContent = `${glyph.code} // ${glyph.name}`;
      if (stampEl) stampEl.textContent = '# FILED SEC 4-B';
    }

    logTeleprinter(`CHEVRON [0${slotIdx + 1}] FILED: ${glyph.code} VERIFIED BY DITMCO AUDIT LEDGER.`, 'stamp');
  }

  // =========================================================================
  // QUICK-DIAL PRESET PROCESSOR
  // =========================================================================
  function handleQuickDial(presetId) {
    const preset = QUICK_DIAL_PRESETS[presetId];
    if (!preset || state.systemStatus === 'ENGAGED' || state.isProcessingBatch) return;

    audio.playKeyClick();
    logTeleprinter(`LOADING PRESET [${preset.code}] - ${preset.name.toUpperCase()} (TIER ${preset.tier})...`, 'alert');

    // Reset current dial slots cleanly
    resetDialStateOnly();
    state.isProcessingBatch = true;

    preset.sequence.forEach((glyphIdx, step) => {
      setTimeout(() => {
        const glyph = MUNICIPAL_GLYPHS[glyphIdx];
        if (glyph) {
          state.enteredGlyphs.push({ ...glyph, index: glyphIdx });
          setSlotSeeking(step, glyph);
          setTimeout(() => {
            lockSlot(step, glyph);
            updateUIState();
            if (step === preset.sequence.length - 1) {
              state.isProcessingBatch = false;
              logTeleprinter(`BATCH ENTRY COMPLETE: ALL 8 FIELDS FILED FOR DOCKET ${state.activeDocketId}.`, 'stamp');
            }
          }, 80);
        }
      }, step * 160);
    });
  }

  function resetDialStateOnly() {
    state.enteredGlyphs = [];
    state.systemStatus = 'DORMANT';

    // Clear radial stations
    for (let i = 0; i < REQUIRED_ADDRESS_LENGTH; i++) {
      const station = document.getElementById(`radialStation-${i}`);
      if (station) {
        station.className = 'radial-chevron-station';
        station.querySelector('.ch-symbol').textContent = '—';
      }

      const card = document.getElementById(`chevronSlotCard-${i}`);
      if (card) {
        card.className = 'chevron-slot-card';
        const status = document.getElementById(`slotStatus-${i}`);
        const glyphEl = document.getElementById(`slotGlyph-${i}`);
        const nameEl = document.getElementById(`slotName-${i}`);
        const stampEl = document.getElementById(`slotStamp-${i}`);

        if (status) status.textContent = 'DORMANT';
        if (glyphEl) glyphEl.textContent = '·';
        if (nameEl) nameEl.textContent = '[Empty Docket Slot]';
        if (stampEl) stampEl.textContent = '[UNALLOCATED]';
      }
    }
  }

  // =========================================================================
  // LOCKOUT TOGGLE (ADMINISTRATIVE COMPLIANCE FREEZE)
  // =========================================================================
  function toggleLockout() {
    audio.playKeyClick();
    state.isLockoutActive = !state.isLockoutActive;

    if (dom.lockoutToggleBtn) {
      dom.lockoutToggleBtn.setAttribute('aria-pressed', state.isLockoutActive ? 'true' : 'false');
    }
    if (dom.lockoutSwitchText) {
      dom.lockoutSwitchText.textContent = state.isLockoutActive 
        ? 'FREEZE: ACTIVE [COMPLIANCE HOLD]' 
        : 'FREEZE: INACTIVE [TRANSIT PERMITTED]';
    }
    if (dom.lockoutLed) {
      dom.lockoutLed.className = `lockout-led ${state.isLockoutActive ? 'active-lockout' : ''}`;
    }
    if (dom.lockoutStatusLabel) {
      dom.lockoutStatusLabel.textContent = state.isLockoutActive 
        ? 'STATUTORY FREEZE ENGAGED' 
        : 'AUDIT HOLD CLEARED';
      dom.lockoutStatusLabel.className = `lockout-status-label ${state.isLockoutActive ? 'alert' : ''}`;
    }

    if (state.isLockoutActive) {
      audio.playErrorBuzzer();
      logTeleprinter('RULE 9-B COMPLIANCE FREEZE APPLIED BY MUNICIPAL AUDITOR. ALL CONDUIT OPENINGS RESTRICTED.', 'error');
    } else {
      logTeleprinter('COMPLIANCE FREEZE LIFTED. CONDUIT APERTURES RETURNED TO STANDARD REGULATION.', 'system');
    }

    updateUIState();
  }

  // =========================================================================
  // ENGAGE SEQUENCE (FILE APPLICATION & CONDUIT APERTURE)
  // =========================================================================
  function handleEngageClick() {
    if (state.enteredGlyphs.length < REQUIRED_ADDRESS_LENGTH) return;

    // Check Lockout compliance hold
    if (state.isLockoutActive) {
      triggerLockoutRejection();
      return;
    }

    // Execute Conduit Authorization
    executeAuthorizationSuccess();
  }

  function triggerLockoutRejection() {
    audio.playErrorBuzzer();
    state.systemStatus = 'REJECTED';

    if (dom.centerStampOverlay) {
      dom.centerStampOverlay.className = 'center-stamp-overlay active-stamp rejected';
      if (dom.stampTitle) dom.stampTitle.textContent = 'RULE 9-B AUDIT HOLD';
      if (dom.stampStatus) dom.stampStatus.textContent = 'TRANSIT DENIED';
      if (dom.stampSub) dom.stampSub.textContent = 'COMPLIANCE FREEZE IN EFFECT';
      if (dom.stampMeta) dom.stampMeta.textContent = 'HEARING REQUIRED // FORM 44-X';
    }

    if (dom.conduitStatusLight) dom.conduitStatusLight.className = 'pulse-light alert';
    if (dom.conduitStatusMsg) {
      dom.conduitStatusMsg.textContent = 'CLEARANCE REFUSED // STATUTORY AUDIT FREEZE ACTIVE';
    }

    logTeleprinter(`FORM 1099-TX REJECTED FOR DOCKET ${state.activeDocketId}: MUNICIPAL COMPLIANCE FREEZE ENGAGED.`, 'error');

    // Auto dismiss rejection stamp after 2.5s
    setTimeout(() => {
      if (state.systemStatus === 'REJECTED') {
        if (dom.centerStampOverlay) dom.centerStampOverlay.className = 'center-stamp-overlay';
        state.systemStatus = 'FILED_READY';
        updateUIState();
      }
    }, 2500);
  }

  function executeAuthorizationSuccess() {
    state.systemStatus = 'ENGAGED';
    audio.playStampLock();
    audio.startMainframeCarrier();

    // Show Approved Stamp Overlay
    if (dom.centerStampOverlay) {
      dom.centerStampOverlay.className = 'center-stamp-overlay active-stamp';
      if (dom.stampTitle) dom.stampTitle.textContent = 'FORM 1099-TX';
      if (dom.stampStatus) dom.stampStatus.textContent = 'APPROVED';
      if (dom.stampSub) dom.stampSub.textContent = 'MUNICIPAL CONDUIT ACTIVE';
      if (dom.stampMeta) dom.stampMeta.textContent = `${state.activeDocketId} // DITMCO SEC 4-B`;
    }

    // Update Status Manifest
    if (dom.commissionerSealText) {
      dom.commissionerSealText.textContent = 'AFFIXED & RECORDED';
      dom.commissionerSealText.className = 'meta-val stamp-verified';
    }
    if (dom.conduitStatusLight) dom.conduitStatusLight.className = 'pulse-light active';
    if (dom.conduitStatusMsg) {
      dom.conduitStatusMsg.textContent = 'CONDUIT OPEN // TRANSMITTING INTERZONAL TELEMETRY';
    }

    // Start active session telemetry monitor
    startSessionTelemetry();

    logTeleprinter(`APPLICATION APPROVED: CONDUIT APERTURE SYNCHRONIZED TO 8-FIELD ROUTE.`, 'stamp');
    logTeleprinter(`DOCKET ${state.activeDocketId} COMMITTED TO MUNICIPAL PERMANENT MICROFICHE ARCHIVE.`, 'system');

    updateUIState();
  }

  function startSessionTelemetry() {
    state.activeSessionStartTime = Date.now();
    if (state.sessionTimerInterval) clearInterval(state.sessionTimerInterval);

    state.sessionTimerInterval = setInterval(() => {
      if (state.systemStatus !== 'ENGAGED') return;
      const elapsedSec = Math.floor((Date.now() - state.activeSessionStartTime) / 1000);
      const m = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
      const s = String(elapsedSec % 60).padStart(2, '0');
      const ms = String(Math.floor((Date.now() % 1000) / 10)).padStart(2, '0');

      if (dom.monDuration) dom.monDuration.textContent = `00:${m}:${s}.${ms}`;
      if (dom.monFlux) {
        const flux = (42.8 + Math.random() * 5.4).toFixed(2);
        dom.monFlux.textContent = `${flux} MB/s`;
      }
      if (dom.monIntegrity) {
        const integrity = (99.8 + Math.random() * 0.2).toFixed(1);
        dom.monIntegrity.textContent = `${integrity}% NOMINAL`;
      }
    }, 150);
  }

  // =========================================================================
  // DISENGAGE SEQUENCE (HARD REQUIREMENT: VISIBLE, RELIABLE, FULL TEARDOWN)
  // =========================================================================
  function handleDisengageClick() {
    audio.playDisengageTear();
    audio.stopMainframeCarrier();

    if (state.sessionTimerInterval) {
      clearInterval(state.sessionTimerInterval);
      state.sessionTimerInterval = null;
    }

    state.systemStatus = 'TERMINATING';
    logTeleprinter(`REVOKING TRANSIT PERMIT FOR DOCKET ${state.activeDocketId}...`, 'alert');

    // Stamp Voiced
    if (dom.centerStampOverlay) {
      dom.centerStampOverlay.className = 'center-stamp-overlay active-stamp rejected';
      if (dom.stampTitle) dom.stampTitle.textContent = 'SESSION TEARDOWN';
      if (dom.stampStatus) dom.stampStatus.textContent = 'PERMIT REVOKED';
      if (dom.stampSub) dom.stampSub.textContent = 'CONDUIT CARRIER COLLAPSED';
      if (dom.stampMeta) dom.stampMeta.textContent = 'SESSION VOIDED // DKT CLOSED';
    }

    setTimeout(() => {
      // Full reset to DORMANT state
      resetTerminalFull();
    }, 450);
  }

  function resetTerminalFull() {
    state.systemStatus = 'DORMANT';
    state.enteredGlyphs = [];
    state.activeDocketId = generateDocketId();

    if (dom.docketRefId) dom.docketRefId.textContent = state.activeDocketId;
    if (dom.commissionerSealText) {
      dom.commissionerSealText.textContent = 'PENDING FILING';
      dom.commissionerSealText.className = 'meta-val stamp-pending';
    }

    if (dom.centerStampOverlay) {
      dom.centerStampOverlay.className = 'center-stamp-overlay';
    }

    if (dom.conduitStatusLight) dom.conduitStatusLight.className = 'pulse-light';
    if (dom.conduitStatusMsg) {
      dom.conduitStatusMsg.textContent = 'CONDUIT APERTURE DORMANT // AWAITING 8-FIELD ROUTING MANIFEST';
    }

    if (dom.monDuration) dom.monDuration.textContent = '00:00:00';
    if (dom.monFlux) dom.monFlux.textContent = '0.00 MB/s';
    if (dom.monIntegrity) dom.monIntegrity.textContent = '100.0% NOMINAL';

    // Reset all chevron cards & radial stations
    resetDialStateOnly();
    updateUIState();

    logTeleprinter(`TERMINAL RETURNED TO DORMANT. READY FOR FRESH FORM 1099-TX DIAL.`, 'system');
  }

  // =========================================================================
  // UI STATE SYNCHRONIZATION
  // =========================================================================
  function updateUIState() {
    const enteredCount = state.enteredGlyphs.length;
    const isFull = enteredCount === REQUIRED_ADDRESS_LENGTH;
    const isEngaged = state.systemStatus === 'ENGAGED';

    // Update Counter
    if (dom.counterCurrent) dom.counterCurrent.textContent = enteredCount;

    // Update System Status Pill in Header
    if (dom.sysStatusText) {
      if (isEngaged) {
        dom.sysStatusText.textContent = 'CONDUIT ACTIVE [ONLINE]';
        dom.sysStatusText.className = 'val status-online';
      } else if (state.isLockoutActive) {
        dom.sysStatusText.textContent = 'AUDIT FREEZE [HOLD]';
        dom.sysStatusText.className = 'val';
      } else if (isFull) {
        dom.sysStatusText.textContent = 'DOCKET READY [8/8]';
        dom.sysStatusText.className = 'val status-online';
      } else {
        dom.sysStatusText.textContent = 'OPERATIONAL [IDLE]';
        dom.sysStatusText.className = 'val';
      }
    }

    // Update Engage Button
    if (dom.engageBtn) {
      if (isEngaged) {
        dom.engageBtn.disabled = true;
        dom.engageBtn.className = 'btn-actuator btn-engage engaged-active';
      } else {
        dom.engageBtn.disabled = !isFull;
        dom.engageBtn.className = 'btn-actuator btn-engage';
      }
    }

    // Update Authorization Pill
    if (dom.authStatusPill) {
      if (isEngaged) {
        dom.authStatusPill.textContent = 'CONDUIT AUTHORIZED';
        dom.authStatusPill.className = 'auth-status-pill engaged';
      } else if (state.isLockoutActive) {
        dom.authStatusPill.textContent = 'AUDIT FREEZE ACTIVE';
        dom.authStatusPill.className = 'auth-status-pill lockout';
      } else if (isFull) {
        dom.authStatusPill.textContent = 'FORM 1099-TX READY';
        dom.authStatusPill.className = 'auth-status-pill ready';
      } else {
        dom.authStatusPill.textContent = `AWAITING FILING (${enteredCount}/8)`;
        dom.authStatusPill.className = 'auth-status-pill';
      }
    }

    // Update Glyph Buttons highlight
    document.querySelectorAll('.glyph-btn').forEach((btn, idx) => {
      const isSelected = state.enteredGlyphs.some(g => g.index === idx);
      if (isSelected) {
        btn.classList.add('selected-in-docket');
      } else {
        btn.classList.remove('selected-in-docket');
      }
      btn.disabled = isEngaged || (isFull && !isSelected);
    });
  }

  // =========================================================================
  // BOOTSTRAP ON LOAD
  // =========================================================================
  window.addEventListener('DOMContentLoaded', () => {
    initUI();
    new ConduitCanvasRenderer('conduitCanvas');
  });

})();
