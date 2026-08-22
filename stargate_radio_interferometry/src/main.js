// Main Coordinator & State Machine for Hesperus Deep-Space Synthesis Array (HDSSA)

import { RadialWaterfallEngine } from './waterfall.js';
import {
  getAudioContext,
  startAmbientHum,
  playCoincidenceChirp,
  playSectorLockConfirmed,
  playBuildupSound,
  playBreakthroughSound,
  startSustainedActiveAudio,
  stopSustainedActiveAudio,
  playDisengageSound,
  playInterlockWarning
} from './audio.js';

// 24 Original Technosignature Modulation Glyphs (Water Hole Continuum: 1.420 - 1.666 GHz)
const CANDIDATE_SECTORS = [
  { id: 0, code: 'Ψ01', name: 'Soliton Pulse', freq: 1420.405, path: 'M4 14 Q14 2 24 14 T44 14' },
  { id: 1, code: 'Ψ02', name: 'Hydrogen Spin-Flip', freq: 1420.750, path: 'M6 24 L24 4 L42 24 M14 18 L34 18' },
  { id: 2, code: 'Ψ03', name: 'Doppler Chirp', freq: 1421.210, path: 'M4 24 Q16 22 24 14 Q32 6 44 4' },
  { id: 3, code: 'Ψ04', name: 'Binary Triplet', freq: 1422.050, path: 'M8 24 L8 4 M24 24 L24 4 M40 24 L40 4' },
  { id: 4, code: 'Ψ05', name: 'Hydroxyl Doublet', freq: 1423.680, path: 'M6 14 A8 8 0 1 0 22 14 A8 8 0 1 0 6 14 M26 14 A8 8 0 1 0 42 14 A8 8 0 1 0 26 14' },
  { id: 5, code: 'Ψ06', name: 'Phase Comb', freq: 1425.100, path: 'M6 24 L6 8 L14 8 L14 24 L22 8 L22 24 L30 8 L30 24 L38 8 L38 24 L44 24' },
  { id: 6, code: 'Ψ07', name: 'Stokes Ellipse', freq: 1427.320, path: 'M24 6 A18 10 0 1 0 24 22 A18 10 0 1 0 24 6' },
  { id: 7, code: 'Ψ08', name: 'Orbital Vortex', freq: 1430.450, path: 'M24 24 m -18 0 a 18 18 0 1 0 36 0 a 18 18 0 1 0 -36 0 M24 24 m -8 0 a 8 8 0 1 0 16 0 a 8 8 0 1 0 -16 0' },
  { id: 8, code: 'Ψ09', name: 'Harmonic Lattice', freq: 1434.120, path: 'M6 6 L42 42 M6 42 L42 6 M24 4 L24 44 M4 24 L44 24' },
  { id: 9, code: 'Ψ10', name: 'Neutrino Peak', freq: 1438.900, path: 'M4 24 L18 24 L24 4 L30 24 L44 24' },
  { id: 10, code: 'Ψ11', name: 'Negative Dispersion', freq: 1443.500, path: 'M4 4 Q16 6 24 14 Q32 22 44 24' },
  { id: 11, code: 'Ψ12', name: 'Quantum Knot', freq: 1449.020, path: 'M10 14 C10 4 20 4 24 14 C28 24 38 24 38 14 C38 4 28 4 24 14 C20 24 10 24 10 14' },
  { id: 12, code: 'Ψ13', name: 'Dyson Flux Mod', freq: 1455.600, path: 'M6 24 L14 10 L24 20 L34 8 L42 24' },
  { id: 13, code: 'Ψ14', name: 'Stokes Linear Mode', freq: 1463.150, path: 'M6 40 L42 8 M14 40 L42 16 M6 32 L34 4' },
  { id: 14, code: 'Ψ15', name: 'Coherence Bridge', freq: 1471.800, path: 'M6 10 L42 10 M6 38 L42 38 M16 10 L16 38 M32 10 L32 38' },
  { id: 15, code: 'Ψ16', name: 'Hyperbolic Drift', freq: 1481.000, path: 'M8 4 Q14 24 44 24 M8 44 Q14 24 44 24' },
  { id: 16, code: 'Ψ17', name: 'Transit Step', freq: 1492.300, path: 'M4 24 L16 24 L16 10 L32 10 L32 24 L44 24' },
  { id: 17, code: 'Ψ18', name: 'Tri-Band Resonator', freq: 1504.600, path: 'M24 4 L42 40 L6 40 Z M24 16 L34 36 L14 36 Z' },
  { id: 18, code: 'Ψ19', name: 'Fringe Inversion', freq: 1518.200, path: 'M6 6 H42 V18 H6 Z M6 30 H42 V42 H6 Z' },
  { id: 19, code: 'Ψ20', name: 'Sub-Harmonic Comb', freq: 1533.400, path: 'M4 24 C14 8 14 40 24 24 C34 8 34 40 44 24' },
  { id: 20, code: 'Ψ21', name: 'Stokes Circular Left', freq: 1550.000, path: 'M24 4 A20 20 0 1 0 44 24 L34 24' },
  { id: 21, code: 'Ψ22', name: 'Phase Quadrupole', freq: 1568.500, path: 'M12 12 L36 12 L36 36 L12 36 Z M6 24 L42 24' },
  { id: 22, code: 'Ψ23', name: 'Hyper-Narrow Drift', freq: 1589.100, path: 'M4 20 L20 20 L24 4 L28 20 L44 20' },
  { id: 23, code: 'Ψ24', name: 'Master Continuum Peak', freq: 1612.231, path: 'M24 4 L44 24 L24 44 L4 24 Z M24 12 L36 24 L24 36 L12 24 Z' }
];

// 9 Baseline Array Station Elements
const DISH_STATIONS = [
  { id: 'M-01', name: 'Caldera Alpha', baseline: '4.2 km' },
  { id: 'M-02', name: 'Ridge Beta', baseline: '8.7 km' },
  { id: 'M-03', name: 'Valley Gamma', baseline: '13.1 km' },
  { id: 'M-04', name: 'Peak Delta', baseline: '18.5 km' },
  { id: 'M-05', name: 'Plains Epsilon', baseline: '23.9 km' },
  { id: 'M-06', name: 'Outpost Zeta', baseline: '29.4 km' },
  { id: 'M-07', name: 'Dome Eta', baseline: '34.8 km' },
  { id: 'M-08', name: 'Canyon Theta', baseline: '39.2 km' },
  { id: 'M-09', name: 'Array Iota', baseline: '42.8 km' }
];

// 6 Preloaded Quick-Dial Presets across 2 Distinct Tiers
const PRESETS = [
  // Tier 1: Confirmed Technosignatures
  { id: 0, name: 'HD 164595-B', tier: 1, sequence: [0, 3, 6, 9, 12, 15, 18], desc: '1.420 GHz Narrowband Peak' },
  { id: 1, name: 'TRAPPIST-1e', tier: 1, sequence: [1, 4, 7, 10, 13, 16, 19], desc: '1.428 GHz Resonant Beacon' },
  { id: 2, name: 'ROSS 128', tier: 1, sequence: [2, 5, 8, 11, 14, 17, 20], desc: '1.442 GHz Phase-Locked Pulse' },
  // Tier 2: Unconfirmed Anomalies
  { id: 3, name: 'TABBY-V', tier: 2, sequence: [0, 2, 4, 6, 8, 10, 12], desc: '1.455 GHz Flux Modulation' },
  { id: 4, name: '1I/ʻOUMUAMUA', tier: 2, sequence: [3, 7, 11, 15, 19, 1, 5], desc: '1.488 GHz Hyperbolic Drift' },
  { id: 5, name: 'PROXIMA BRC-1', tier: 2, sequence: [6, 9, 12, 15, 18, 21, 0], desc: '1.512 GHz Transit Burst' }
];

class StargateRadioConsole {
  constructor() {
    this.address = []; // array of locked sector IDs (0..23), max 7
    this.state = 'IDLE'; // 'IDLE' | 'DIALING' | 'COINCIDENCE_CHECKING' | 'READY' | 'BUILDUP' | 'BREAKTHROUGH' | 'ACTIVE'
    this.pdvhEngaged = false; // Post-Detection Verification Hold: MUST DEFAULT TO RELEASED (false)
    this.isAutoDialing = false;
    this.autoDialTimeout = null;
    this.activationTimeout = null;
    this.audioInitialized = false;

    // DOM Elements
    this.appRoot = document.getElementById('app-root');
    this.waterfallCanvas = document.getElementById('waterfall-canvas');
    this.oscilloscopeCanvas = document.getElementById('oscilloscope-canvas');
    this.glyphsGrid = document.getElementById('glyphs-grid');
    this.stationsGrid = document.getElementById('stations-grid');
    this.addressSlotsContainer = document.getElementById('address-slots');
    this.addressCounter = document.getElementById('address-counter');
    this.statusDot = document.getElementById('banner-status-dot');
    this.statusPrimary = document.getElementById('status-primary-text');
    this.statusSecondary = document.getElementById('status-secondary-text');
    this.snrReadout = document.getElementById('system-snr-readout');
    this.driftReadout = document.getElementById('drift-rate-readout');
    this.siderealClock = document.getElementById('sidereal-clock');
    this.engageBtn = document.getElementById('engage-btn');
    this.engageBtnText = document.getElementById('engage-btn-text');
    this.engageBtnSub = document.getElementById('engage-btn-sub');
    this.disengageBtn = document.getElementById('disengage-btn');
    this.pdvhToggle = document.getElementById('pdvh-toggle');
    this.pdvhToggleText = document.getElementById('pdvh-toggle-text');
    this.interlockCard = document.getElementById('interlock-card');
    this.interlockStatusLabel = document.getElementById('interlock-status-label');
    this.interlockOverlay = document.getElementById('interlock-warning-overlay');
    this.operatorRefBtn = document.getElementById('operator-ref-btn');
    this.operatorRefModal = document.getElementById('operator-ref-modal');
    this.modalCloseBtn = document.getElementById('modal-close-btn');
    this.modalAcknowledgeBtn = document.getElementById('modal-acknowledge-btn');

    // Engines
    this.waterfallEngine = new RadialWaterfallEngine(this.waterfallCanvas);

    this.initScaling();
    this.renderGlyphs();
    this.renderStations();
    this.bindEvents();
    this.startMainLoop();
    this.startSiderealClock();
  }

  // Calculate and apply CSS scale transform to fit any viewport smoothly
  initScaling() {
    const updateScale = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const scaleX = vw / 1920;
      const scaleY = vh / 1080;
      const scale = Math.min(scaleX, scaleY);
      document.documentElement.style.setProperty('--scale', scale.toString());
      console.log(`[HDSSA Scaling] Viewport: ${vw}x${vh}, Computed Scale: ${scale.toFixed(4)}`);
    };

    window.addEventListener('resize', updateScale);
    updateScale();
  }

  ensureAudio() {
    if (!this.audioInitialized) {
      getAudioContext();
      startAmbientHum();
      this.audioInitialized = true;
    }
  }

  renderGlyphs() {
    this.glyphsGrid.innerHTML = '';
    CANDIDATE_SECTORS.forEach((sec) => {
      const btn = document.createElement('button');
      btn.className = 'glyph-btn';
      btn.id = `glyph-btn-${sec.id}`;
      btn.dataset.id = sec.id;
      btn.setAttribute('aria-label', `Sector ${sec.code}: ${sec.name} (${sec.freq.toFixed(3)} MHz)`);

      btn.innerHTML = `
        <svg viewBox="0 0 48 48" class="glyph-icon-svg">
          <path d="${sec.path}"/>
        </svg>
        <span class="glyph-label">${sec.code}</span>
        <span class="glyph-freq">${sec.freq.toFixed(1)}M</span>
      `;

      btn.addEventListener('click', () => {
        this.ensureAudio();
        this.handleGlyphClick(sec.id);
      });

      this.glyphsGrid.appendChild(btn);
    });
  }

  renderStations() {
    this.stationsGrid.innerHTML = '';
    DISH_STATIONS.forEach((st, idx) => {
      const tile = document.createElement('div');
      tile.className = 'station-tile';
      tile.id = `station-tile-${idx}`;
      tile.innerHTML = `
        <div class="station-top">
          <span class="station-id">${st.id}</span>
          <span class="station-dot"></span>
        </div>
        <div class="station-name">${st.name}</div>
        <div class="station-status" id="st-status-${idx}">STANDBY</div>
      `;
      this.stationsGrid.appendChild(tile);
    });
  }

  bindEvents() {
    // User interaction audio initialization
    window.addEventListener('pointerdown', () => this.ensureAudio(), { once: true });
    window.addEventListener('keydown', () => this.ensureAudio(), { once: true });

    // Preset buttons
    document.querySelectorAll('.preset-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        this.ensureAudio();
        const presetIdx = parseInt(btn.dataset.preset, 10);
        this.triggerPresetAutoDial(presetIdx);
      });
    });

    // Safety Interlock Toggle (Post-Detection Verification Hold)
    this.pdvhToggle.addEventListener('click', () => {
      this.ensureAudio();
      this.togglePDVH();
    });

    // Main Staged Activation Button
    this.engageBtn.addEventListener('click', () => {
      this.ensureAudio();
      this.handleActivationClick();
    });

    // Disengage Button (Always reachable)
    this.disengageBtn.addEventListener('click', () => {
      this.ensureAudio();
      this.disengage();
    });

    // Operator Reference Modal
    this.operatorRefBtn.addEventListener('click', () => {
      this.ensureAudio();
      this.operatorRefModal.style.display = 'flex';
    });

    const closeModal = () => {
      this.operatorRefModal.style.display = 'none';
    };
    this.modalCloseBtn.addEventListener('click', closeModal);
    this.modalAcknowledgeBtn.addEventListener('click', closeModal);
    this.operatorRefModal.addEventListener('click', (e) => {
      if (e.target === this.operatorRefModal) closeModal();
    });
  }

  togglePDVH() {
    this.pdvhEngaged = !this.pdvhEngaged;
    this.pdvhToggle.setAttribute('aria-pressed', this.pdvhEngaged.toString());

    if (this.pdvhEngaged) {
      this.pdvhToggle.className = 'interlock-toggle-btn engaged';
      this.pdvhToggleText.textContent = 'HOLD: ON';
      this.interlockCard.className = 'interlock-card engaged';
      this.interlockStatusLabel.textContent = 'STATUS: ENGAGED (TRANSMISSION BLOCKED)';
    } else {
      this.pdvhToggle.className = 'interlock-toggle-btn released';
      this.pdvhToggleText.textContent = 'HOLD: OFF';
      this.interlockCard.className = 'interlock-card';
      this.interlockStatusLabel.textContent = 'STATUS: RELEASED (TRANSMISSION ARMED)';
      this.interlockOverlay.style.display = 'none';
    }
  }

  // Handle Candidate Glyph Selection with 9-Station Interferometric Coincidence Check
  handleGlyphClick(sectorId) {
    if (this.state === 'BUILDUP' || this.state === 'BREAKTHROUGH' || this.state === 'ACTIVE') return;
    if (this.state === 'COINCIDENCE_CHECKING') return;
    if (this.address.includes(sectorId)) return;
    if (this.address.length >= 7) return;

    this.runCoincidenceDetection(sectorId);
  }

  // Spatial Coincidence Detection Algorithm across 9 Stations
  runCoincidenceDetection(sectorId, onComplete = null) {
    this.state = 'COINCIDENCE_CHECKING';
    const sector = CANDIDATE_SECTORS[sectorId];

    // Highlight glyph as checking
    const glyphEl = document.getElementById(`glyph-btn-${sectorId}`);
    if (glyphEl) glyphEl.classList.add('checking');

    // Update banner
    this.statusPrimary.textContent = `CORRELATING BASELINE M-01..M-09 // SECTOR ${sector.code}`;
    this.statusSecondary.textContent = `COMPUTING FRINGE VISIBILITY & REJECTING LOCAL RFI AT ${sector.freq.toFixed(3)} MHz`;
    this.snrReadout.textContent = `+${(12.0 + this.address.length * 3.5).toFixed(1)} dB`;

    let currentStation = 0;
    const totalStations = DISH_STATIONS.length; // 9

    const stepInterval = 28; // ~280ms total for 9 stations
    const checkTimer = setInterval(() => {
      if (this.state !== 'COINCIDENCE_CHECKING') {
        clearInterval(checkTimer);
        return;
      }

      if (currentStation < totalStations) {
        // Animate station tile
        const tile = document.getElementById(`station-tile-${currentStation}`);
        const statusEl = document.getElementById(`st-status-${currentStation}`);
        if (tile) tile.className = 'station-tile coincident';
        if (statusEl) statusEl.textContent = 'COINCIDENT';

        // Play rising chirp
        playCoincidenceChirp(currentStation, totalStations, sector.freq);

        // Update waterfall engine checking progress
        this.waterfallEngine.setCheckingSector(sectorId, (currentStation + 1) / totalStations);

        currentStation++;
      } else {
        // Coincidence established across all 9 baseline stations!
        clearInterval(checkTimer);

        this.address.push(sectorId);
        this.waterfallEngine.setCheckingSector(null, 0);
        this.waterfallEngine.setLockedSectors(this.address);

        if (glyphEl) {
          glyphEl.classList.remove('checking');
          glyphEl.classList.add('locked');
        }

        // Play crisp lock chime
        playSectorLockConfirmed(sectorId);

        // Update address register UI
        this.updateAddressSlots();

        // Check if all 7 candidate channels are locked
        if (this.address.length === 7) {
          // TRANSITION TO READY STATE (NEVER AUTO-FIRE!)
          this.state = 'READY';
          this.statusDot.className = 'status-indicator-dot ready';
          this.statusPrimary.textContent = 'APERTURE SYNTHESIS READY // 7/7 BASELINES LOCKED';
          this.statusSecondary.textContent = 'FULL SPATIAL COHERENCE ESTABLISHED. AWAITING OPERATOR TRANSMISSION ENGAGEMENT.';
          this.snrReadout.textContent = '+38.4 dB';

          this.engageBtn.disabled = false;
          this.engageBtn.className = 'action-btn-engage ready';
          this.engageBtnSub.textContent = 'CLICK TO OPEN TRANSMISSION CHANNEL';
        } else {
          this.state = 'DIALING';
          this.statusDot.className = 'status-indicator-dot';
          this.statusPrimary.textContent = `SECTOR ${sector.code} LOCKED // ${this.address.length}/7 CHANNELS CONFIRMED`;
          this.statusSecondary.textContent = 'SELECT NEXT CANDIDATE FREQUENCY SECTOR TO CONTINUE BASELINE SYNTHESIS';
        }

        if (onComplete) onComplete();
      }
    }, stepInterval);
  }

  updateAddressSlots() {
    this.addressCounter.textContent = `${this.address.length} / 7 LOCKED`;
    for (let i = 0; i < 7; i++) {
      const slot = document.querySelector(`.address-slot[data-slot="${i}"]`);
      if (!slot) continue;

      if (i < this.address.length) {
        const secId = this.address[i];
        const sec = CANDIDATE_SECTORS[secId];
        slot.className = 'address-slot locked';
        slot.innerHTML = `<span class="slot-idx">${i + 1}</span><span class="slot-val">${sec.code}</span>`;
      } else {
        slot.className = 'address-slot empty';
        slot.innerHTML = `<span class="slot-idx">${i + 1}</span><span class="slot-val">--</span>`;
      }
    }
  }

  // Quick-Dial Presets: Genuinely Auto-Dials in Staged Sequence
  triggerPresetAutoDial(presetIdx) {
    if (this.state === 'BUILDUP' || this.state === 'BREAKTHROUGH' || this.state === 'ACTIVE') return;

    this.disengage(false); // Reset address without full audio power-down
    this.isAutoDialing = true;

    const preset = PRESETS[presetIdx];
    this.statusPrimary.textContent = `REPLAYING ARCHIVE: ${preset.name} (${preset.desc})`;
    this.statusSecondary.textContent = 'HIGH-SPEED TELEMETRY REPLAY VIA SYNTHETIC APERTURE BUS';

    let step = 0;
    const dialNext = () => {
      if (!this.isAutoDialing) return;

      if (step < preset.sequence.length) {
        const sectorId = preset.sequence[step];
        step++;
        this.runCoincidenceDetection(sectorId, () => {
          if (this.isAutoDialing && step < preset.sequence.length) {
            this.autoDialTimeout = setTimeout(dialNext, 60);
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

  // Primary Activation Sequence: Explicit Three-Stage Event (Never Auto-Fires)
  handleActivationClick() {
    if (this.state !== 'READY') return;

    // Safety Interlock Check: Post-Detection Verification Hold
    if (this.pdvhEngaged) {
      playInterlockWarning();
      this.interlockOverlay.style.display = 'block';
      this.statusDot.className = 'status-indicator-dot warning';
      this.statusPrimary.textContent = 'ACTIVATION BLOCKED // POST-DETECTION PROTOCOL ACTIVE';
      this.statusSecondary.textContent = 'RELEASE PROTOCOL HOLD IN CLUSTER 02 TO TRANSMIT.';

      setTimeout(() => {
        if (this.interlockOverlay) this.interlockOverlay.style.display = 'none';
        if (this.state === 'READY') {
          this.statusDot.className = 'status-indicator-dot ready';
          this.statusPrimary.textContent = 'APERTURE SYNTHESIS READY // 7/7 BASELINES LOCKED';
          this.statusSecondary.textContent = 'FULL SPATIAL COHERENCE ESTABLISHED. AWAITING OPERATOR TRANSMISSION ENGAGEMENT.';
        }
      }, 3500);
      return;
    }

    this.startThreeStageActivation();
  }

  startThreeStageActivation() {
    // -------------------------------------------------------------
    // STAGE 1: BUILDUP (2.0 seconds)
    // Doppler drift tracking, SNR climb, receiver gain surging
    // -------------------------------------------------------------
    this.state = 'BUILDUP';
    this.engageBtn.className = 'action-btn-engage active';
    this.engageBtnText.textContent = 'STAGE 1: BUILDUP / SYNTHESIZING';
    this.engageBtnSub.textContent = 'DOPPLER TRACKING // CARRIER CONVERGING';
    this.statusDot.className = 'status-indicator-dot active';

    playBuildupSound(2000);

    const startTime = performance.now();
    const buildupDuration = 2000; // 2.0s

    const buildupFrame = () => {
      if (this.state !== 'BUILDUP') return;

      const elapsed = performance.now() - startTime;
      const progress = Math.min(1.0, elapsed / buildupDuration);

      // SNR climbs from +38.4 dB to +96.4 dB
      const currentSNR = 38.4 + progress * 58.0;
      this.snrReadout.textContent = `+${currentSNR.toFixed(1)} dB`;
      this.driftReadout.textContent = `+${(progress * 14.8).toFixed(2)} Hz/s`;

      this.statusPrimary.textContent = `STAGE 1: DOPPLER LOCK SYNTHESIS (${Math.floor(progress * 100)}%)`;
      this.statusSecondary.textContent = `RECEIVER GAIN SURGING +${Math.floor(progress * 72)} dB // PHASE COHERENCE CONVERGING`;

      this.waterfallEngine.setActivationState('BUILDUP', progress);

      if (progress < 1.0) {
        requestAnimationFrame(buildupFrame);
      } else {
        // -------------------------------------------------------------
        // STAGE 2: BREAKTHROUGH INSTANT (At 2.0s mark)
        // Radiant confirmation flash, aperture opening, sub-bass punch
        // -------------------------------------------------------------
        this.state = 'BREAKTHROUGH';
        this.engageBtnText.textContent = 'STAGE 2: BREAKTHROUGH INSTANT';
        this.engageBtnSub.textContent = 'CARRIER BREAKTHROUGH // APERTURE OPEN';
        this.statusPrimary.textContent = 'STAGE 2: CARRIER BREAKTHROUGH // COHERENT APERTURE CONVERGENCE';
        this.statusSecondary.textContent = 'ENERGY IRIS OPENING // CONTACT ESTABLISHING';
        this.snrReadout.textContent = '+98.8 dB';

        playBreakthroughSound();
        this.waterfallEngine.setActivationState('BREAKTHROUGH', 1.0);

        // -------------------------------------------------------------
        // STAGE 3: SUSTAINED ACTIVE STATE (After 600ms breakthrough)
        // Continuous wormhole event horizon, particle stream, harmonic chord
        // -------------------------------------------------------------
        this.activationTimeout = setTimeout(() => {
          if (this.state !== 'BREAKTHROUGH') return;

          this.state = 'ACTIVE';
          this.engageBtnText.textContent = 'STAGE 3: ACTIVE TRANSMISSION';
          this.engageBtnSub.textContent = 'INTERSTELLAR CARRIER LOCKED // DATA STREAMING';
          this.statusPrimary.textContent = 'STAGE 3: ACTIVE CONTACT ESTABLISHED // INTERSTELLAR CARRIER LOCKED';
          this.statusSecondary.textContent = 'CONTINUOUS INTERFEROMETRIC DATA STREAM ACTIVE // APERTURE OPEN';
          this.snrReadout.textContent = '+104.2 dB';
          this.driftReadout.textContent = 'LOCKED (0.00 Hz/s)';

          startSustainedActiveAudio();
          this.waterfallEngine.setActivationState('ACTIVE', 1.0);
        }, 600);
      }
    };

    requestAnimationFrame(buildupFrame);
  }

  // Disengage / Abort Channel (Always reachable, full reset)
  disengage(playSound = true) {
    if (this.autoDialTimeout) clearTimeout(this.autoDialTimeout);
    if (this.activationTimeout) clearTimeout(this.activationTimeout);

    this.isAutoDialing = false;
    this.state = 'IDLE';
    this.address = [];

    if (playSound) playDisengageSound();
    else stopSustainedActiveAudio();

    // Reset waterfall engine
    this.waterfallEngine.setLockedSectors([]);
    this.waterfallEngine.setCheckingSector(null, 0);
    this.waterfallEngine.setActivationState('IDLE');

    // Reset UI elements
    this.updateAddressSlots();
    this.renderGlyphs(); // Clear locked/checking classes
    this.renderStations(); // Clear station coincident classes

    this.statusDot.className = 'status-indicator-dot';
    this.statusPrimary.textContent = 'SYSTEM IDLE // SEARCHING WATER HOLE NOISE FLOOR';
    this.statusSecondary.textContent = 'SELECT CANDIDATE SECTOR GLYPHS TO INITIATE MULTI-STATION COINCIDENCE CHECK';
    this.snrReadout.textContent = '+3.2 dB';
    this.driftReadout.textContent = '0.00 Hz/s';

    this.engageBtn.disabled = true;
    this.engageBtn.className = 'action-btn-engage';
    this.engageBtnText.textContent = 'ENGAGE EMISSION BEACON';
    this.engageBtnSub.textContent = 'AWAITING 7/7 COHERENCE LOCK';
    this.interlockOverlay.style.display = 'none';
  }

  // Real-Time Oscilloscope Renderer
  renderOscilloscope() {
    const canvas = this.oscilloscopeCanvas;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const midY = h / 2;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#040810';
    ctx.fillRect(0, 0, w, h);

    // Oscilloscope Grid Lines
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
    ctx.lineWidth = 0.8;
    for (let x = 0; x < w; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 15) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Waveform Trace
    ctx.beginPath();
    const time = performance.now() / 1000;

    for (let x = 0; x < w; x++) {
      let y = midY;
      if (this.state === 'ACTIVE') {
        // Coherent alien multi-harmonic carrier wave
        const carrier = Math.sin(x * 0.08 + time * 8.0) * 18;
        const sub = Math.sin(x * 0.04 - time * 4.0) * 8;
        const harmonic = Math.sin(x * 0.16 + time * 12.0) * 4;
        y = midY + carrier + sub + harmonic;
      } else if (this.state === 'BUILDUP' || this.state === 'BREAKTHROUGH') {
        // High-energy chirping sweep
        const freqMod = 0.04 + (Math.sin(time * 6.0) + 1) * 0.06;
        y = midY + Math.sin(x * freqMod + time * 14.0) * 22;
      } else if (this.address.length > 0) {
        // Partially synthesized carrier + noise
        const signal = Math.sin(x * 0.06 + time * 4.0) * (this.address.length * 2.8);
        const noise = (Math.random() - 0.5) * (14 - this.address.length * 1.5);
        y = midY + signal + noise;
      } else {
        // Cryogenic Thermal Noise Floor
        y = midY + (Math.random() - 0.5) * 12;
      }

      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.strokeStyle = this.state === 'ACTIVE' ? '#00ff9d' : '#00f0ff';
    ctx.lineWidth = 1.6;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 8;
    ctx.stroke();
  }

  startMainLoop() {
    const loop = (timestamp) => {
      this.waterfallEngine.render(timestamp);
      this.renderOscilloscope();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  startSiderealClock() {
    setInterval(() => {
      const d = new Date();
      const stHours = (d.getUTCHours() + 4) % 24;
      const stMins = d.getUTCMinutes().toString().padStart(2, '0');
      const stSecs = d.getUTCSeconds().toString().padStart(2, '0');
      const stDec = Math.floor(d.getUTCMilliseconds() / 100);
      this.siderealClock.textContent = `${stHours.toString().padStart(2, '0')}:${stMins}:${stSecs}.${stDec} ST`;
    }, 100);
  }
}

// Instantiate Console upon DOM Load
window.addEventListener('DOMContentLoaded', () => {
  window.__stargateConsole = new StargateRadioConsole();
});
