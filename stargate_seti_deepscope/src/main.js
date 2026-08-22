// Argos DeepScope - Main Application & State Coordinator

import { CARRIER_SECTORS, QUICKDIAL_PRESETS } from './data/carriers.js';
import { soundEngine } from './audio/soundEngine.js';
import { PolarWaterfall } from './canvas/polarWaterfall.js';
import { SpectralOscillogram } from './canvas/spectralOscillogram.js';
import { TriageLab } from './components/triageLab.js';
import { InterferometryModal } from './components/interferometryModal.js';
import { ArchiveModal } from './components/archiveModal.js';
import { OperatorManual } from './components/operatorManual.js';
import { SettingsModal } from './components/settingsModal.js';

class DeepScopeApp {
  constructor() {
    this.addressLength = 7;
    this.lockedCarriers = []; // Array of sector IDs (e.g. ['c04', 'c02', ...])
    this.state = 'IDLE'; // IDLE, VERIFYING, PENDING, BUILDUP, BREAKTHROUGH, ACTIVE
    
    // Safety Hold Subsystem (Defaults to RELEASED!)
    this.safetyHoldEngaged = false;

    // Auto-dial state
    this.isAutoDialing = false;
    this.autoDialTimeout = null;

    // Timers
    this.lastFrameTime = performance.now();
    this.activationTimer = null;

    // Components & Canvas
    this.polarWaterfall = null;
    this.spectralOsc = null;
    this.triageLab = null;
    this.interferometryModal = null;
    this.archiveModal = null;
    this.operatorManual = null;
    this.settingsModal = null;

    this.init();
  }

  init() {
    this.initScalingEngine();
    this.initCanvasEngines();
    this.initUI();
    this.initModals();
    this.initPerimeterDishNodes();
    this.initBaselineGrid();
    this.renderRegisterSlots();
    this.renderSectorDial();
    this.renderQuickDialPresets();
    this.startLiveTelemetryClocks();
    this.startAnimationLoop();

    // Global audio unlock listener
    window.addEventListener('pointerdown', () => soundEngine.ensureContext(), { once: true });
    window.addEventListener('keydown', () => soundEngine.ensureContext(), { once: true });
  }

  // 1. Viewport Scaling Engine (Zero-Scroll 1920x1080 native lock, scales to 4K)
  initScalingEngine() {
    const updateScale = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const scaleX = w / 1920;
      const scaleY = h / 1080;
      const scale = Math.min(scaleX, scaleY);
      document.documentElement.style.setProperty('--scale', scale.toString());
    };

    window.addEventListener('resize', updateScale);
    updateScale();
  }

  // 2. Canvas Engines
  initCanvasEngines() {
    this.polarWaterfall = new PolarWaterfall('canvas-polar-waterfall', 'canvas-aperture-lens');
    this.spectralOsc = new SpectralOscillogram('canvas-iq-scatter', 'canvas-power-spectrum');
  }

  // 3. UI Bindings
  initUI() {
    this.btnEngage = document.getElementById('btn-engage-aperture');
    this.btnDisengage = document.getElementById('btn-disengage');
    this.safetyHoldBtn = document.getElementById('safety-hold-btn');
    this.safetyHoldStatus = document.getElementById('safety-hold-status');
    this.safetyToast = document.getElementById('safety-toast-alert');
    this.toastReleaseBtn = document.getElementById('toast-release-btn');
    this.coincidenceBanner = document.getElementById('coincidence-banner');
    this.bannerTitle = document.getElementById('banner-title');
    this.bannerDesc = document.getElementById('banner-desc');
    this.bannerCounter = document.getElementById('banner-counter');
    this.apertureGlyph = document.getElementById('aperture-active-glyph');
    this.apertureStateText = document.getElementById('aperture-state-text');
    this.apertureSnrText = document.getElementById('aperture-snr-text');
    this.regStatusBadge = document.getElementById('reg-status-badge');
    this.engageBtnSub = document.getElementById('engage-btn-sub');

    // Engage Aperture Button Listener (NEVER Auto-Fires)
    if (this.btnEngage) {
      this.btnEngage.addEventListener('click', () => this.handleEngageClick());
    }

    // Disengage Button Listener (Always Reachable)
    if (this.btnDisengage) {
      this.btnDisengage.addEventListener('click', () => this.handleDisengage());
    }

    // Safety Interlock Toggle (Defaults to RELEASED)
    if (this.safetyHoldBtn) {
      this.safetyHoldBtn.addEventListener('click', () => this.toggleSafetyHold());
    }

    // Safety Toast Release Button
    if (this.toastReleaseBtn) {
      this.toastReleaseBtn.addEventListener('click', () => {
        this.setSafetyHold(false);
        this.hideSafetyToast();
      });
    }
  }

  initModals() {
    this.triageLab = new TriageLab();
    this.interferometryModal = new InterferometryModal();
    this.archiveModal = new ArchiveModal((rec) => this.loadArchivedTarget(rec));
    this.operatorManual = new OperatorManual();
    this.settingsModal = new SettingsModal((hex, rgb) => {
      this.polarWaterfall.setTheme(hex, rgb);
      this.spectralOsc.setTheme(hex, rgb);
    });
  }

  // 4. Perimeter Dish Nodes ($D_{01} \dots D_{10}$) around the Polar Spectrogram
  initPerimeterDishNodes() {
    const container = document.getElementById('dish-perimeter-nodes');
    if (!container) return;
    container.innerHTML = '';

    const radius = 275;
    const cx = 290;
    const cy = 290;

    for (let i = 0; i < 10; i++) {
      const angle = (i * 36 * Math.PI) / 180 - Math.PI / 2;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;

      const node = document.createElement('div');
      node.className = 'perimeter-node';
      node.id = `dish-node-${i}`;
      node.style.left = `${x}px`;
      node.style.top = `${y}px`;
      node.textContent = `D${i + 1 < 10 ? '0' : ''}${i + 1}`;

      container.appendChild(node);
    }
  }

  // 5. Baselines Telemetry Grid
  initBaselineGrid() {
    const container = document.getElementById('baseline-dishes-status');
    if (!container) return;
    container.innerHTML = '';

    for (let i = 0; i < 10; i++) {
      const card = document.createElement('div');
      card.className = 'dish-sync-card';
      card.id = `dish-grid-card-${i}`;
      card.innerHTML = `
        <span class="dish-name">D0${i + 1}</span>
        <span class="dish-phase" id="dish-phase-${i}">0.00 ps</span>
      `;
      container.appendChild(card);
    }
  }

  // 6. 7-Slot Carrier Address Register
  renderRegisterSlots() {
    const container = document.getElementById('register-slots');
    if (!container) return;
    container.innerHTML = '';

    for (let i = 0; i < this.addressLength; i++) {
      const carrierId = this.lockedCarriers[i];
      const carrier = carrierId ? CARRIER_SECTORS.find(c => c.id === carrierId) : null;

      const slot = document.createElement('div');
      slot.className = `reg-slot ${carrier ? 'filled' : ''}`;
      slot.id = `reg-slot-${i}`;

      slot.innerHTML = `
        <span class="slot-index">0${i + 1}</span>
        <span class="slot-glyph">${carrier ? carrier.symbol : '—'}</span>
        <span class="slot-freq">${carrier ? carrier.freq.toFixed(3) : 'OFF'}</span>
      `;

      container.appendChild(slot);
    }
  }

  // 7. 18-Candidate Sector Dial Matrix
  renderSectorDial() {
    const container = document.getElementById('sector-glyph-grid');
    if (!container) return;
    container.innerHTML = '';

    CARRIER_SECTORS.forEach((sec, idx) => {
      const isLocked = this.lockedCarriers.includes(sec.id);
      const isFull = this.lockedCarriers.length >= this.addressLength;
      const isVerifying = this.state === 'VERIFYING';
      const isActive = this.state === 'ACTIVE' || this.state === 'BUILDUP' || this.state === 'BREAKTHROUGH';

      const btn = document.createElement('button');
      btn.className = `glyph-dial-btn ${isLocked ? 'is-active-locked' : ''}`;
      btn.id = `dial-btn-${sec.id}`;
      btn.disabled = isLocked || isFull || isVerifying || isActive;

      btn.innerHTML = `
        <span class="dial-sym">${sec.symbol}</span>
        <span class="dial-f">${sec.freq.toFixed(1)}M</span>
      `;

      btn.addEventListener('click', () => this.handleManualCarrierSelect(sec.id));
      container.appendChild(btn);
    });
  }

  // 8. Quick-Dial Presets
  renderQuickDialPresets() {
    const tier1Container = document.getElementById('tier1-presets');
    const tier2Container = document.getElementById('tier2-presets');

    if (tier1Container) tier1Container.innerHTML = '';
    if (tier2Container) tier2Container.innerHTML = '';

    QUICKDIAL_PRESETS.forEach(preset => {
      const card = document.createElement('div');
      card.className = 'preset-card';
      card.id = `preset-${preset.id}`;

      const glyphPreview = preset.carriers.map(cId => {
        const c = CARRIER_SECTORS.find(s => s.id === cId);
        return c ? c.symbol : '◈';
      }).join(' ');

      card.innerHTML = `
        <div class="preset-info">
          <span class="preset-name">${preset.name}</span>
          <span class="preset-meta">${preset.freq} &bull; SNR ${preset.snr}</span>
          <span class="preset-glyphs-preview">${glyphPreview}</span>
        </div>
        <span class="preset-auto-btn">AUTO-DIAL</span>
      `;

      card.addEventListener('click', () => this.triggerAutoDialPreset(preset));

      if (preset.tier === 1 && tier1Container) tier1Container.appendChild(card);
      if (preset.tier === 2 && tier2Container) tier2Container.appendChild(card);
    });
  }

  // Manual Dialing Handler
  handleManualCarrierSelect(carrierId) {
    if (this.state === 'VERIFYING' || this.lockedCarriers.length >= this.addressLength) return;
    this.executeCoincidenceLockSequence(carrierId);
  }

  // 10-Dish Coincidence-Locking Cascade
  executeCoincidenceLockSequence(carrierId, onComplete) {
    const carrier = CARRIER_SECTORS.find(c => c.id === carrierId);
    if (!carrier) return;

    this.state = 'VERIFYING';
    this.polarWaterfall.setSystemState('VERIFYING');
    this.renderSectorDial();
    this.updateStatusBanner();

    let dishIdx = 0;
    const totalDishes = 10;
    const stepDuration = 25; // 25ms per dish cross-check (total 250ms)

    const runDishStep = () => {
      if (dishIdx < totalDishes) {
        // Light up perimeter node
        const node = document.getElementById(`dish-node-${dishIdx}`);
        const card = document.getElementById(`dish-grid-card-${dishIdx}`);
        const phaseTxt = document.getElementById(`dish-phase-${dishIdx}`);

        if (node) node.classList.add('active-check');
        if (card) card.classList.add('verifying');
        if (phaseTxt) phaseTxt.textContent = `CORRELATING...`;

        soundEngine.playCoincidenceStep(dishIdx);

        setTimeout(() => {
          if (node) {
            node.classList.remove('active-check');
            node.classList.add('locked-ok');
          }
          if (card) {
            card.classList.remove('verifying');
            card.classList.add('locked');
          }
          if (phaseTxt) phaseTxt.textContent = `0.000 ps`;
          dishIdx++;
          runDishStep();
        }, stepDuration);
      } else {
        // All 10 dishes confirmed coincidence!
        this.lockedCarriers.push(carrierId);
        const slotIdx = this.lockedCarriers.length - 1;

        soundEngine.playLockChime(slotIdx);

        // Update Polar Spectrogram & Oscillogram
        const lockedIndices = this.lockedCarriers.map(id => {
          return CARRIER_SECTORS.findIndex(c => c.id === id);
        });
        this.polarWaterfall.setLockedSectors(lockedIndices);
        this.spectralOsc.setState(false, this.lockedCarriers.length);

        // Clear perimeter nodes back to idle
        for (let i = 0; i < 10; i++) {
          const n = document.getElementById(`dish-node-${i}`);
          if (n) n.className = 'perimeter-node';
        }

        if (this.lockedCarriers.length >= this.addressLength) {
          // 7/7 LOCKED -> PENDING ACTIVATION (NEVER AUTO-FIRES)
          this.state = 'PENDING';
          this.polarWaterfall.setSystemState('PENDING');
        } else {
          this.state = 'DIALING';
          this.polarWaterfall.setSystemState('DIALING');
        }

        this.renderRegisterSlots();
        this.renderSectorDial();
        this.updateStatusBanner();

        if (onComplete) onComplete();
      }
    };

    runDishStep();
  }

  // Quick-Dial Auto-Dial Sequence (Genuinely paced, never instantaneous)
  triggerAutoDialPreset(preset) {
    if (this.isAutoDialing || this.state === 'ACTIVE' || this.state === 'BUILDUP') return;

    soundEngine.playUiClick();
    this.handleDisengage(false); // Clean flush first

    this.isAutoDialing = true;
    const targetCarriers = [...preset.carriers];
    let currentIndex = 0;

    const dialNext = () => {
      if (!this.isAutoDialing) return; // Aborted by disengage

      if (currentIndex < targetCarriers.length) {
        const cId = targetCarriers[currentIndex];
        currentIndex++;
        this.executeCoincidenceLockSequence(cId, () => {
          if (this.isAutoDialing && currentIndex < targetCarriers.length) {
            this.autoDialTimeout = setTimeout(dialNext, 120);
          } else {
            this.isAutoDialing = false;
          }
        });
      } else {
        this.isAutoDialing = false;
      }
    };

    dialNext();
  }

  loadArchivedTarget(rec) {
    if (!rec.carriers || rec.carriers.length === 0) return;
    this.triggerAutoDialPreset({
      id: rec.id,
      name: rec.target,
      freq: `${rec.freq} MHz`,
      snr: `${rec.snr} dB`,
      carriers: rec.carriers
    });
  }

  // Safety Interlock Handlers (Defaults to RELEASED)
  toggleSafetyHold() {
    soundEngine.playUiClick();
    this.setSafetyHold(!this.safetyHoldEngaged);
  }

  setSafetyHold(engaged) {
    this.safetyHoldEngaged = engaged;
    if (this.safetyHoldBtn) {
      if (engaged) {
        this.safetyHoldBtn.classList.remove('is-released');
        this.safetyHoldBtn.classList.add('is-engaged');
        this.safetyHoldBtn.setAttribute('aria-pressed', 'true');
        if (this.safetyHoldStatus) this.safetyHoldStatus.textContent = 'ENGAGED (HOLD)';
      } else {
        this.safetyHoldBtn.classList.remove('is-engaged');
        this.safetyHoldBtn.classList.add('is-released');
        this.safetyHoldBtn.setAttribute('aria-pressed', 'false');
        if (this.safetyHoldStatus) this.safetyHoldStatus.textContent = 'RELEASED';
      }
    }
  }

  showSafetyToast() {
    soundEngine.playSafetyHoldAlert();
    if (this.safetyToast) {
      this.safetyToast.classList.add('is-visible');
      this.safetyToast.setAttribute('aria-hidden', 'false');
    }
  }

  hideSafetyToast() {
    if (this.safetyToast) {
      this.safetyToast.classList.remove('is-visible');
      this.safetyToast.setAttribute('aria-hidden', 'true');
    }
  }

  // Primary Activation Trigger (3-Stage Real Duration)
  handleEngageClick() {
    if (this.state !== 'PENDING' || this.lockedCarriers.length < this.addressLength) return;

    // Check Safety Interlock
    if (this.safetyHoldEngaged) {
      this.showSafetyToast();
      return;
    }

    this.hideSafetyToast();
    this.startThreeStageActivation();
  }

  startThreeStageActivation() {
    // -------------------------------------------------------------
    // STAGE 1: BUILDUP (1.8 Seconds Duration)
    // -------------------------------------------------------------
    this.state = 'BUILDUP';
    this.polarWaterfall.setSystemState('BUILDUP');
    soundEngine.playBuildupSound();
    this.updateStatusBanner();

    // Telemetry ramp simulation
    this.setTelemetryState('BUILDUP');

    this.activationTimer = setTimeout(() => {
      // -----------------------------------------------------------
      // STAGE 2: BREAKTHROUGH (1.4 Seconds Duration)
      // -----------------------------------------------------------
      this.state = 'BREAKTHROUGH';
      this.polarWaterfall.setSystemState('BREAKTHROUGH');
      soundEngine.playBreakthroughSound();
      this.updateStatusBanner();
      this.setTelemetryState('BREAKTHROUGH');

      this.activationTimer = setTimeout(() => {
        // ---------------------------------------------------------
        // STAGE 3: SUSTAINED ACTIVE
        // ---------------------------------------------------------
        this.state = 'ACTIVE';
        this.polarWaterfall.setSystemState('ACTIVE');
        this.spectralOsc.setState(true, 7);
        this.updateStatusBanner();
        this.setTelemetryState('ACTIVE');
      }, 1400);

    }, 2000);
  }

  // Disengage / Flush (Always Reachable)
  handleDisengage(playSound = true) {
    if (playSound) soundEngine.playDisengageSound();

    if (this.autoDialTimeout) {
      clearTimeout(this.autoDialTimeout);
      this.autoDialTimeout = null;
    }
    if (this.activationTimer) {
      clearTimeout(this.activationTimer);
      this.activationTimer = null;
    }

    this.isAutoDialing = false;
    this.state = 'IDLE';
    this.lockedCarriers = [];

    this.polarWaterfall.setLockedSectors([]);
    this.polarWaterfall.setSystemState('IDLE');
    this.spectralOsc.setState(false, 0);

    // Reset Dish Grid
    for (let i = 0; i < 10; i++) {
      const card = document.getElementById(`dish-grid-card-${i}`);
      const phaseTxt = document.getElementById(`dish-phase-${i}`);
      const node = document.getElementById(`dish-node-${i}`);
      if (card) card.className = 'dish-sync-card';
      if (phaseTxt) phaseTxt.textContent = '0.00 ps';
      if (node) node.className = 'perimeter-node';
    }

    this.renderRegisterSlots();
    this.renderSectorDial();
    this.updateStatusBanner();
    this.setTelemetryState('IDLE');
  }

  // Status Banner & Dynamic Readouts
  updateStatusBanner() {
    if (!this.coincidenceBanner) return;

    this.coincidenceBanner.className = 'coincidence-status-banner';
    const count = this.lockedCarriers.length;
    if (this.bannerCounter) this.bannerCounter.textContent = `${count} / ${this.addressLength}`;

    if (this.state === 'IDLE') {
      this.coincidenceBanner.classList.remove('is-pending', 'is-active');
      this.bannerTitle.textContent = 'POLAR SPECTROGRAM SCANNING';
      this.bannerDesc.textContent = 'SELECT NARROWBAND CANDIDATE CARRIERS (0/7 LOCKED)';
      this.apertureStateText.textContent = 'STANDBY';
      this.apertureGlyph.textContent = '◈';
      this.apertureSnrText.textContent = 'NOISE FLOOR: -118 dBm';
      this.regStatusBadge.textContent = 'AWAITING CARRIER LOCKS';
      this.btnEngage.disabled = true;
      this.btnEngage.classList.remove('is-ready-pulsing');
      this.engageBtnSub.textContent = 'AWAITING 7/7 COINCIDENCE LOCKS';
    } else if (this.state === 'VERIFYING' || this.state === 'DIALING') {
      this.bannerTitle.textContent = `COINCIDENCE CROSS-CHECKING (${count}/7)`;
      this.bannerDesc.textContent = 'VERIFYING PLANE-WAVE PHASE COHERENCE ACROSS D01-D10 BASELINES';
      this.apertureStateText.textContent = `LOCKING ${count}/7`;
      this.apertureGlyph.textContent = '☵';
      this.apertureSnrText.textContent = `SNR: ${(12 + count * 8.5).toFixed(1)} dB`;
      this.regStatusBadge.textContent = `COINCIDENCE IN PROGRESS (${count}/7)`;
      this.btnEngage.disabled = true;
      this.btnEngage.classList.remove('is-ready-pulsing');
    } else if (this.state === 'PENDING') {
      this.coincidenceBanner.classList.add('is-pending');
      this.bannerTitle.textContent = 'COINCIDENCE CONFIRMED (7/7)';
      this.bannerDesc.textContent = 'READY FOR APERTURE ACTIVATION • MANUAL ENGAGE REQUIRED';
      this.apertureStateText.textContent = 'PENDING';
      this.apertureGlyph.textContent = '⚡';
      this.apertureSnrText.textContent = 'PHASE LOCK: 100%';
      this.regStatusBadge.textContent = 'ALL 7 CARRIERS LOCKED - READY';
      this.btnEngage.disabled = false;
      this.btnEngage.classList.add('is-ready-pulsing');
      this.engageBtnSub.textContent = 'CLICK TO ENGAGE APERTURE';
    } else if (this.state === 'BUILDUP') {
      this.coincidenceBanner.classList.add('is-pending');
      this.bannerTitle.textContent = 'STAGE 1: APERTURE IONIZATION BUILDUP';
      this.bannerDesc.textContent = 'RAMPING CRYOGENIC HEMT • LOCKING DOPPLER DRIFT TO 0.00 Hz/s';
      this.apertureStateText.textContent = 'BUILDUP';
      this.apertureGlyph.textContent = '✦';
      this.btnEngage.disabled = true;
      this.btnEngage.classList.remove('is-ready-pulsing');
      this.engageBtnSub.textContent = 'BUILDUP IN PROGRESS (1.8s)...';
    } else if (this.state === 'BREAKTHROUGH') {
      this.coincidenceBanner.classList.add('is-active');
      this.bannerTitle.textContent = 'STAGE 2: COHERENCE BREAKTHROUGH ACHIEVED';
      this.bannerDesc.textContent = 'OPTICAL SINGULARITY DETECTED • APERTURE HORIZON OPENING';
      this.apertureStateText.textContent = 'BREAKTHROUGH';
      this.apertureGlyph.textContent = '✺';
      this.engageBtnSub.textContent = 'BREAKTHROUGH ESTABLISHED';
    } else if (this.state === 'ACTIVE') {
      this.coincidenceBanner.classList.add('is-active');
      this.bannerTitle.textContent = 'STAGE 3: SUSTAINED TECHNOSIGNATURE APERTURE ACTIVE';
      this.bannerDesc.textContent = 'CONTINUOUS HIGH-SNR CARRIER LINK OPEN • RELATIVISTIC HORIZON STABLE';
      this.apertureStateText.textContent = 'ACTIVE BEAM';
      this.apertureGlyph.textContent = '✹';
      this.apertureSnrText.textContent = 'LINK SNR: 99.4 dB';
      this.regStatusBadge.textContent = 'TRANSMITTING ON 7 COHERENT CARRIERS';
      this.btnEngage.disabled = true;
      this.btnEngage.classList.remove('is-ready-pulsing');
      this.engageBtnSub.textContent = 'SUSTAINED TRANSMISSION ACTIVE';
    }
  }

  // Dynamic Telemetry Metrics
  setTelemetryState(state) {
    const metricTsys = document.getElementById('metric-tsys');
    const metricGain = document.getElementById('metric-gain');
    const metricSnr = document.getElementById('metric-snr');
    const metricDrift = document.getElementById('metric-drift');
    const meterTsys = document.getElementById('meter-tsys');
    const meterGain = document.getElementById('meter-gain');
    const meterSnr = document.getElementById('meter-snr');
    const meterDrift = document.getElementById('meter-drift');

    if (state === 'ACTIVE') {
      if (metricTsys) metricTsys.textContent = '11.85 K';
      if (metricGain) metricGain.textContent = '96.2 dB';
      if (metricSnr) metricSnr.textContent = '99.4 dB';
      if (metricDrift) metricDrift.textContent = '0.000 Hz/s';
      if (meterTsys) meterTsys.style.width = '18%';
      if (meterGain) meterGain.style.width = '96%';
      if (meterSnr) meterSnr.style.width = '100%';
      if (meterDrift) meterDrift.style.width = '50%';
    } else if (state === 'BUILDUP') {
      if (metricTsys) metricTsys.textContent = '12.40 K';
      if (metricGain) metricGain.textContent = '88.5 dB';
      if (metricSnr) metricSnr.textContent = '74.2 dB';
      if (metricDrift) metricDrift.textContent = '-0.005 Hz/s';
      if (meterGain) meterGain.style.width = '88%';
      if (meterSnr) meterSnr.style.width = '75%';
    } else {
      if (metricTsys) metricTsys.textContent = '14.18 K';
      if (metricGain) metricGain.textContent = '78.4 dB';
      if (metricSnr) metricSnr.textContent = '12.4 dB';
      if (metricDrift) metricDrift.textContent = '-0.042 Hz/s';
      if (meterTsys) meterTsys.style.width = '24%';
      if (meterGain) meterGain.style.width = '78%';
      if (meterSnr) meterSnr.style.width = '15%';
      if (meterDrift) meterDrift.style.width = '48%';
    }
  }

  // Real-Time Clocks & Telemetry Jitter
  startLiveTelemetryClocks() {
    const utcClock = document.getElementById('utc-clock');
    const gmstClock = document.getElementById('gmst-clock');
    const cryoTemp = document.getElementById('cryo-temp');

    setInterval(() => {
      const now = new Date();
      if (utcClock) {
        const h = String(now.getUTCHours()).padStart(2, '0');
        const m = String(now.getUTCMinutes()).padStart(2, '0');
        const s = String(now.getUTCSeconds()).padStart(2, '0');
        const ms = String(now.getUTCMilliseconds()).padStart(3, '0');
        utcClock.textContent = `${h}:${m}:${s}.${ms}`;
      }

      // Greenwich Mean Sidereal Time (GMST) calculation approximation
      if (gmstClock) {
        const jd = (now.getTime() / 86400000) + 2440587.5;
        const d = jd - 2451545.0;
        const gmstHours = (18.697374558 + 24.06570982441908 * d) % 24;
        const gh = Math.floor(gmstHours >= 0 ? gmstHours : gmstHours + 24);
        const gm = Math.floor(((gmstHours % 1) * 60));
        const gs = Math.floor(((((gmstHours % 1) * 60) % 1) * 60));
        gmstClock.textContent = `${String(gh).padStart(2, '0')}:${String(gm).padStart(2, '0')}:${String(gs).padStart(2, '0')}.${Math.floor(Math.random() * 99)}`;
      }

      // Subtle Cryogenic Jitter
      if (cryoTemp && this.state !== 'ACTIVE') {
        const temp = 14.18 + (Math.random() - 0.5) * 0.08;
        cryoTemp.textContent = `${temp.toFixed(2)} K`;
      }
    }, 80);
  }

  // Animation Loop (60 FPS)
  startAnimationLoop() {
    const loop = (currentTime) => {
      const dt = Math.min(100, currentTime - this.lastFrameTime);
      this.lastFrameTime = currentTime;

      if (this.polarWaterfall) {
        this.polarWaterfall.update(dt);
        this.polarWaterfall.draw();
      }

      if (this.spectralOsc) {
        this.spectralOsc.update(dt);
        this.spectralOsc.draw();
      }

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.deepScopeApp = new DeepScopeApp();
});
