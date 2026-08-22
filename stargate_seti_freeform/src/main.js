import { DISH_CONFIG, CANDIDATE_SIGNALS, QUICK_DIAL_ENTRIES, REQUIRED_ADDRESS_LENGTH } from './data.js';
import { audioEngine } from './audio.js';
import { PolarWaterfallSpectrogram } from './spectrogram.js';

class TechnosignatureApp {
  constructor() {
    this.currentAddress = []; // Array of candidate IDs [id1, id2, ...]
    this.systemState = 'IDLE'; // 'IDLE', 'DIALING', 'READY', 'BUILDUP', 'BREAKTHROUGH', 'ACTIVE'
    this.verificationHoldEngaged = false; // MUST DEFAULT TO RELEASED
    this.isAutoDialing = false;
    this.autoDialTimer = null;
    this.buildupTimer = null;
    this.activeDurationTimer = null;
    this.snrValue = 14.2;
    this.coincidenceScore = 0.08;

    this.spectrogram = null;
    this.driftCanvas = null;
    this.linearWaterfallCanvas = null;

    this.init();
  }

  init() {
    this.setupScaling();
    this.renderDishMatrix();
    this.renderCandidateButtons();
    this.renderAddressSlots();
    this.renderQuickDialEntries();
    this.setupSpectrogram();
    this.setupSideCanvases();
    this.bindEvents();
    this.startTelemetryClocks();
    this.updateUIState();
  }

  // Viewport Scaling System for 16:9 (1920x1080 up to 4K)
  setupScaling() {
    const updateScale = () => {
      const targetW = 1920;
      const targetH = 1080;
      const scaleX = window.innerWidth / targetW;
      const scaleY = window.innerHeight / targetH;
      const scale = Math.min(scaleX, scaleY);
      document.documentElement.style.setProperty('--app-scale', scale.toString());
      
      // Store on window for automated testing verification
      window.__APP_SCALE__ = scale;
      window.__VIEWPORT__ = { width: window.innerWidth, height: window.innerHeight };
    };

    window.addEventListener('resize', updateScale);
    updateScale();
  }

  renderDishMatrix() {
    const container = document.getElementById('dishArrayContainer');
    if (!container) return;
    container.innerHTML = DISH_CONFIG.map(dish => `
      <div class="dish-card" id="dish-${dish.id}" data-dish="${dish.id}">
        <div class="dish-header">
          <span class="dish-id">${dish.id}</span>
          <span class="dish-led" id="led-${dish.id}"></span>
        </div>
        <div class="dish-name">${dish.name}</div>
        <div class="dish-meta">
          <span class="dish-delay">τ: ${dish.delay}</span>
          <span class="dish-status" id="status-${dish.id}">SYNC</span>
        </div>
      </div>
    `).join('');
  }

  renderCandidateButtons() {
    const container = document.getElementById('candidateGrid');
    if (!container) return;
    container.innerHTML = CANDIDATE_SIGNALS.map(c => `
      <button class="candidate-btn" id="candidate-btn-${c.id}" data-id="${c.id}" title="${c.name} (${c.frequency})">
        <div class="glyph-wrapper">${c.glyphSvg}</div>
        <div class="candidate-info">
          <div class="candidate-tag">${c.tag}</div>
          <div class="candidate-freq">${c.frequency}</div>
        </div>
        <div class="candidate-drift">${c.driftRate}</div>
        <div class="candidate-status-indicator"></div>
      </button>
    `).join('');
  }

  renderAddressSlots() {
    const container = document.getElementById('addressSlots');
    if (!container) return;
    container.innerHTML = Array.from({ length: REQUIRED_ADDRESS_LENGTH }, (_, i) => `
      <div class="address-slot" id="slot-${i}" data-index="${i}">
        <div class="slot-number">${i + 1}</div>
        <div class="slot-glyph" id="slot-glyph-${i}">--</div>
        <div class="slot-tag" id="slot-tag-${i}">EMPTY</div>
      </div>
    `).join('');
  }

  renderQuickDialEntries() {
    const tier1Container = document.getElementById('tier1List');
    const tier2Container = document.getElementById('tier2List');

    const tier1 = QUICK_DIAL_ENTRIES.filter(e => e.tier.includes('TIER-1'));
    const tier2 = QUICK_DIAL_ENTRIES.filter(e => e.tier.includes('TIER-2'));

    const renderCard = (entry) => `
      <div class="preset-card" id="preset-${entry.id}" data-id="${entry.id}">
        <div class="preset-top">
          <span class="preset-name">${entry.name}</span>
          <span class="preset-status ${entry.statusClass}">${entry.tier.includes('TIER-1') ? 'VERIFIED' : 'UNCONFIRMED'}</span>
        </div>
        <div class="preset-coords">${entry.coords} | ${entry.distance}</div>
        <div class="preset-desc">${entry.description}</div>
        <div class="preset-footer">
          <span class="preset-snr">SNR: ${entry.snr}</span>
          <button class="preset-load-btn" data-id="${entry.id}">AUTO-CORRELATE [${entry.sequence.length} CH]</button>
        </div>
      </div>
    `;

    if (tier1Container) tier1Container.innerHTML = tier1.map(renderCard).join('');
    if (tier2Container) tier2Container.innerHTML = tier2.map(renderCard).join('');
  }

  setupSpectrogram() {
    const canvas = document.getElementById('polarWaterfall');
    if (!canvas) return;
    this.spectrogram = new PolarWaterfallSpectrogram(canvas, CANDIDATE_SIGNALS);
  }

  setupSideCanvases() {
    // Narrowband Drift Scope Canvas
    this.driftCanvas = document.getElementById('driftCanvas');
    if (this.driftCanvas) {
      const dctx = this.driftCanvas.getContext('2d');
      let driftOffset = 0;
      const animateDrift = () => {
        driftOffset += 0.04;
        dctx.fillStyle = 'rgba(2, 6, 12, 0.25)';
        dctx.fillRect(0, 0, this.driftCanvas.width, this.driftCanvas.height);

        // Center line
        dctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
        dctx.beginPath();
        dctx.moveTo(0, this.driftCanvas.height / 2);
        dctx.lineTo(this.driftCanvas.width, this.driftCanvas.height / 2);
        dctx.stroke();

        // Waveform
        dctx.strokeStyle = this.systemState === 'ACTIVE' ? '#39ff14' : '#00f0ff';
        dctx.lineWidth = 1.5;
        dctx.beginPath();
        for (let x = 0; x < this.driftCanvas.width; x++) {
          const freq = this.systemState === 'ACTIVE' ? 0.08 : 0.03;
          const amp = this.systemState === 'ACTIVE' ? 18 : (this.currentAddress.length ? 12 : 5);
          const y = (this.driftCanvas.height / 2) + Math.sin(x * freq + driftOffset) * amp + (Math.random() - 0.5) * 4;
          if (x === 0) dctx.moveTo(x, y);
          else dctx.lineTo(x, y);
        }
        dctx.stroke();
        requestAnimationFrame(animateDrift);
      };
      animateDrift();
    }

    // Linear Waterfall Slice Canvas
    this.linearWaterfallCanvas = document.getElementById('linearWaterfallCanvas');
    if (this.linearWaterfallCanvas) {
      const lctx = this.linearWaterfallCanvas.getContext('2d');
      const w = this.linearWaterfallCanvas.width;
      const h = this.linearWaterfallCanvas.height;
      const imgData = lctx.createImageData(w, h);

      const updateLinearWaterfall = () => {
        // Shift lines down
        for (let y = h - 1; y > 0; y--) {
          for (let x = 0; x < w; x++) {
            const srcIdx = ((y - 1) * w + x) * 4;
            const dstIdx = (y * w + x) * 4;
            imgData.data[dstIdx] = imgData.data[srcIdx];
            imgData.data[dstIdx + 1] = imgData.data[srcIdx + 1];
            imgData.data[dstIdx + 2] = imgData.data[srcIdx + 2];
            imgData.data[dstIdx + 3] = imgData.data[srcIdx + 3];
          }
        }
        // Generate new top row
        for (let x = 0; x < w; x++) {
          const dstIdx = x * 4;
          const hasLock = this.currentAddress.length > 0;
          const isSignalBand = (x > w * 0.45 && x < w * 0.55);
          let intensity;
          if (hasLock && isSignalBand) {
            intensity = 0.8 + Math.random() * 0.2;
            imgData.data[dstIdx] = 0;
            imgData.data[dstIdx + 1] = Math.floor(intensity * 255);
            imgData.data[dstIdx + 2] = Math.floor(intensity * 230);
          } else {
            intensity = 0.1 + Math.random() * 0.25;
            imgData.data[dstIdx] = 0;
            imgData.data[dstIdx + 1] = Math.floor(intensity * 120);
            imgData.data[dstIdx + 2] = Math.floor(intensity * 180);
          }
          imgData.data[dstIdx + 3] = 255;
        }
        lctx.putImageData(imgData, 0, 0);
        setTimeout(updateLinearWaterfall, 60);
      };
      updateLinearWaterfall();
    }
  }

  bindEvents() {
    // 1. Candidate Button Click (Manual Dialing)
    document.querySelectorAll('.candidate-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        audioEngine.ensureContext();
        if (this.isAutoDialing || this.systemState === 'BUILDUP' || this.systemState === 'ACTIVE') return;
        const candidateId = parseInt(btn.dataset.id, 10);
        this.selectCandidate(candidateId);
      });
    });

    // 2. Activation Master Button (Staged 3-Stage Event, NEVER AUTO-FIRES)
    const activateBtn = document.getElementById('activateBtn');
    if (activateBtn) {
      activateBtn.addEventListener('click', () => {
        audioEngine.ensureContext();
        this.attemptActivation();
      });
    }

    // 3. Disengage Master Button (Always reachable)
    const disengageBtn = document.getElementById('disengageBtn');
    if (disengageBtn) {
      disengageBtn.addEventListener('click', () => {
        audioEngine.ensureContext();
        this.disengage();
      });
    }

    // 4. Safety Interlock: Post-Detection Verification Hold Toggle
    const holdToggle = document.getElementById('verificationHoldToggle');
    if (holdToggle) {
      holdToggle.checked = this.verificationHoldEngaged; // default false (RELEASED)
      holdToggle.addEventListener('change', (e) => {
        audioEngine.ensureContext();
        this.verificationHoldEngaged = e.target.checked;
        audioEngine.playUiBlip();
        this.updateHoldUI();
      });
    }

    // 5. Quick-Dial Preset Auto-Correlate Buttons
    document.querySelectorAll('.preset-load-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        audioEngine.ensureContext();
        const presetId = btn.dataset.id;
        const preset = QUICK_DIAL_ENTRIES.find(p => p.id === presetId);
        if (preset) {
          this.loadQuickDialPreset(preset);
        }
      });
    });

    // Quick-dial Tab Switching
    document.querySelectorAll('.tab-btn').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.dataset.tab;
        const content = document.getElementById(target);
        if (content) content.classList.add('active');
        audioEngine.playUiBlip();
      });
    });

    // 6. Operator Reference Modal (?)
    const helpBtn = document.getElementById('helpBtn');
    const helpModal = document.getElementById('helpModal');
    const closeHelpBtn = document.getElementById('closeHelpBtn');
    if (helpBtn && helpModal) {
      helpBtn.addEventListener('click', () => {
        audioEngine.ensureContext();
        helpModal.classList.add('open');
        audioEngine.playUiBlip();
      });
    }
    if (closeHelpBtn && helpModal) {
      closeHelpBtn.addEventListener('click', () => {
        helpModal.classList.remove('open');
        audioEngine.playUiBlip();
      });
    }
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && helpModal && helpModal.classList.contains('open')) {
        helpModal.classList.remove('open');
      }
    });

    // Dismiss hold warning banner
    const banner = document.getElementById('holdWarningBanner');
    if (banner) {
      banner.addEventListener('click', () => banner.classList.remove('active'));
    }
  }

  // Manual Candidate Selection with Coincidence-Detection Locking
  selectCandidate(candidateId) {
    if (this.currentAddress.length >= REQUIRED_ADDRESS_LENGTH) return;
    if (this.currentAddress.includes(candidateId)) return;

    this.systemState = 'DIALING';
    this.updateUIState();

    // Trigger Coincidence Check across 10 dishes
    this.performCoincidenceCheck(candidateId, (success) => {
      if (success) {
        this.currentAddress.push(candidateId);
        const slotIdx = this.currentAddress.length - 1;
        const candidate = CANDIDATE_SIGNALS.find(c => c.id === candidateId);

        // Play harmonic chirp & correlation lock sound
        audioEngine.playCandidateLock(slotIdx);

        // Update Address Slot UI
        this.updateSlotUI(slotIdx, candidate);

        // Update Candidate Button UI
        const btn = document.getElementById(`candidate-btn-${candidateId}`);
        if (btn) btn.classList.add('locked');

        // Update Polar Waterfall Spectrogram
        if (this.spectrogram) {
          this.spectrogram.setLockedCandidates(this.currentAddress);
        }

        // Increase telemetry SNR & Coincidence metrics
        this.snrValue = Math.min(88, 14.2 + this.currentAddress.length * 9.8);
        this.coincidenceScore = Math.min(0.99, 0.25 + (this.currentAddress.length / REQUIRED_ADDRESS_LENGTH) * 0.74);
        this.updateTelemetryValues();

        // Check if address is complete
        if (this.currentAddress.length === REQUIRED_ADDRESS_LENGTH) {
          this.systemState = 'READY';
          if (this.spectrogram) this.spectrogram.setSystemState('READY');
        } else {
          this.systemState = 'DIALING';
          if (this.spectrogram) this.spectrogram.setSystemState('DIALING');
        }

        this.updateUIState();
      }
    });
  }

  // 10-Dish Interferometric Coincidence Scan Animation
  performCoincidenceCheck(candidateId, callback) {
    const dishes = DISH_CONFIG;
    let dishIdx = 0;

    const interval = setInterval(() => {
      if (dishIdx < dishes.length) {
        const dish = dishes[dishIdx];
        const card = document.getElementById(`dish-${dish.id}`);
        const led = document.getElementById(`led-${dish.id}`);
        const status = document.getElementById(`status-${dish.id}`);

        if (card) card.classList.add('scanning');
        if (led) led.className = 'dish-led scanning';
        if (status) status.innerText = 'CORRELATING';

        audioEngine.playDishSample();

        setTimeout(() => {
          if (card) card.classList.remove('scanning');
          if (card) card.classList.add('locked');
          if (led) led.className = 'dish-led locked';
          if (status) status.innerText = 'LOCKED';
        }, 120);

        dishIdx++;
      } else {
        clearInterval(interval);
        callback(true);
      }
    }, 28);
  }

  updateSlotUI(slotIdx, candidate) {
    const slot = document.getElementById(`slot-${slotIdx}`);
    const glyphEl = document.getElementById(`slot-glyph-${slotIdx}`);
    const tagEl = document.getElementById(`slot-tag-${slotIdx}`);

    if (slot) slot.classList.add('filled');
    if (glyphEl && candidate) glyphEl.innerHTML = candidate.glyphSvg;
    if (tagEl && candidate) tagEl.innerText = candidate.tag;
  }

  clearSlotUI() {
    for (let i = 0; i < REQUIRED_ADDRESS_LENGTH; i++) {
      const slot = document.getElementById(`slot-${i}`);
      const glyphEl = document.getElementById(`slot-glyph-${i}`);
      const tagEl = document.getElementById(`slot-tag-${i}`);
      if (slot) slot.classList.remove('filled');
      if (glyphEl) glyphEl.innerHTML = '--';
      if (tagEl) tagEl.innerText = 'EMPTY';
    }
  }

  // Quick-Dial Auto-Dial Sequence (Paced cross-correlation replay, NEVER instant, NEVER auto-fires)
  loadQuickDialPreset(preset) {
    if (this.isAutoDialing || this.systemState === 'BUILDUP' || this.systemState === 'ACTIVE') return;

    // Reset current address first
    this.disengage(false);

    this.isAutoDialing = true;
    this.systemState = 'DIALING';
    this.updateUIState();

    const sequence = [...preset.sequence];
    let step = 0;

    const logBanner = document.getElementById('statusModeText');
    if (logBanner) logBanner.innerText = `REPLAYING ARCHIVED DETECTION [${preset.targetCode}]...`;

    this.autoDialTimer = setInterval(() => {
      if (step < sequence.length && this.isAutoDialing) {
        const candidateId = sequence[step];
        const candidate = CANDIDATE_SIGNALS.find(c => c.id === candidateId);
        
        if (candidate) {
          this.currentAddress.push(candidateId);
          const slotIdx = this.currentAddress.length - 1;

          audioEngine.playCandidateLock(slotIdx);
          this.updateSlotUI(slotIdx, candidate);

          const btn = document.getElementById(`candidate-btn-${candidateId}`);
          if (btn) btn.classList.add('locked');

          if (this.spectrogram) {
            this.spectrogram.setLockedCandidates(this.currentAddress);
          }

          // Trigger fast dish flash for each step
          this.fastDishFlash();

          this.snrValue = Math.min(94, 18.0 + this.currentAddress.length * 10.5);
          this.coincidenceScore = Math.min(0.99, 0.3 + (this.currentAddress.length / REQUIRED_ADDRESS_LENGTH) * 0.69);
          this.updateTelemetryValues();
        }

        step++;
      } else {
        clearInterval(this.autoDialTimer);
        this.isAutoDialing = false;

        if (this.currentAddress.length === REQUIRED_ADDRESS_LENGTH) {
          this.systemState = 'READY';
          if (this.spectrogram) this.spectrogram.setSystemState('READY');
        }
        this.updateUIState();
      }
    }, 380); // 380ms per candidate for visible, paced, genuine auto-dialing
  }

  fastDishFlash() {
    DISH_CONFIG.forEach(dish => {
      const card = document.getElementById(`dish-${dish.id}`);
      const led = document.getElementById(`led-${dish.id}`);
      if (card) {
        card.classList.add('locked');
      }
      if (led) {
        led.className = 'dish-led locked';
      }
    });
  }

  // Attempt Activation (Enforces Safety Interlock & Executes 3-Stage Sequence)
  attemptActivation() {
    if (this.systemState !== 'READY') return;

    // Safety Interlock Check: Post-Detection Verification Hold
    if (this.verificationHoldEngaged) {
      audioEngine.playSafetyHoldWarning();
      const banner = document.getElementById('holdWarningBanner');
      if (banner) {
        banner.classList.add('active');
      }
      const holdContainer = document.getElementById('holdControlPanel');
      if (holdContainer) {
        holdContainer.classList.add('flash-warning');
        setTimeout(() => holdContainer.classList.remove('flash-warning'), 1200);
      }
      return;
    }

    // Dismiss any warning banner
    const banner = document.getElementById('holdWarningBanner');
    if (banner) banner.classList.remove('active');

    // Begin THREE-STAGE ACTIVATION EVENT
    this.startThreeStageActivation();
  }

  // Explicit Three-Stage Activation Sequence
  startThreeStageActivation() {
    // STAGE 1: BUILDUP (2.6s)
    this.systemState = 'BUILDUP';
    this.updateUIState();
    if (this.spectrogram) this.spectrogram.setSystemState('BUILDUP', 0);
    audioEngine.playActivationBuildup(2.6);

    const startTime = performance.now();
    const buildupDuration = 2600;

    const buildupInterval = setInterval(() => {
      if (this.systemState !== 'BUILDUP') {
        clearInterval(buildupInterval);
        return;
      }
      const elapsed = performance.now() - startTime;
      const progress = Math.min(1.0, elapsed / buildupDuration);
      
      if (this.spectrogram) this.spectrogram.setSystemState('BUILDUP', progress);
      this.snrValue = 75 + progress * 24; // SNR climbs to 99 dB
      this.coincidenceScore = 0.98 + progress * 0.019;
      this.updateTelemetryValues();

      if (progress >= 1.0) {
        clearInterval(buildupInterval);
        this.triggerBreakthrough();
      }
    }, 40);
  }

  // STAGE 2: BREAKTHROUGH (Instantaneous Peak Flash)
  triggerBreakthrough() {
    if (this.systemState !== 'BUILDUP') return;

    this.systemState = 'BREAKTHROUGH';
    this.updateUIState();
    if (this.spectrogram) {
      this.spectrogram.setSystemState('BREAKTHROUGH');
      this.spectrogram.triggerFlash();
    }
    audioEngine.playActivationBreakthrough();

    // Transition smoothly to STAGE 3 after flash peak
    setTimeout(() => {
      if (this.systemState === 'BREAKTHROUGH') {
        this.enterSustainedActiveState();
      }
    }, 350);
  }

  // STAGE 3: SUSTAINED ACTIVE STATE
  enterSustainedActiveState() {
    this.systemState = 'ACTIVE';
    this.updateUIState();
    if (this.spectrogram) this.spectrogram.setSystemState('ACTIVE');
    audioEngine.startSustainedActiveDrone();

    this.snrValue = 99.8;
    this.coincidenceScore = 0.999;
    this.updateTelemetryValues();
  }

  // Disengage / Reset Method (Always reachable)
  disengage(playAudio = true) {
    if (this.isAutoDialing) {
      clearInterval(this.autoDialTimer);
      this.isAutoDialing = false;
    }

    if (playAudio && (this.systemState === 'ACTIVE' || this.systemState === 'BUILDUP' || this.currentAddress.length > 0)) {
      audioEngine.playDisengage();
    } else {
      audioEngine.stopActiveDrone();
    }

    this.systemState = 'IDLE';
    this.currentAddress = [];
    this.snrValue = 14.2;
    this.coincidenceScore = 0.08;

    // Reset Candidate Buttons UI
    document.querySelectorAll('.candidate-btn').forEach(btn => btn.classList.remove('locked'));

    // Reset Address Slots
    this.clearSlotUI();

    // Reset Dishes
    DISH_CONFIG.forEach(dish => {
      const card = document.getElementById(`dish-${dish.id}`);
      const led = document.getElementById(`led-${dish.id}`);
      const status = document.getElementById(`status-${dish.id}`);
      if (card) {
        card.classList.remove('scanning', 'locked');
      }
      if (led) {
        led.className = 'dish-led';
      }
      if (status) {
        status.innerText = 'SYNC';
      }
    });

    // Reset Spectrogram
    if (this.spectrogram) {
      this.spectrogram.setLockedCandidates([]);
      this.spectrogram.setSystemState('IDLE');
    }

    this.updateTelemetryValues();
    this.updateUIState();
  }

  updateHoldUI() {
    const statusText = document.getElementById('holdStatusText');
    const panel = document.getElementById('holdControlPanel');
    const banner = document.getElementById('holdWarningBanner');

    if (this.verificationHoldEngaged) {
      if (statusText) statusText.innerHTML = '<span class="text-amber">HOLD ENGAGED</span> (TRANSMISSION BLOCKED)';
      if (panel) panel.classList.add('hold-active');
    } else {
      if (statusText) statusText.innerHTML = '<span class="text-cyan">HOLD RELEASED</span> (TRANSMISSION PERMITTED)';
      if (panel) panel.classList.remove('hold-active');
      if (banner) banner.classList.remove('active');
    }
  }

  updateTelemetryValues() {
    const snrEl = document.getElementById('snrValue');
    const snrBar = document.getElementById('snrBarFill');
    const coincEl = document.getElementById('coincidenceValue');
    const coincBar = document.getElementById('coincidenceBarFill');

    if (snrEl) snrEl.innerText = `${this.snrValue.toFixed(1)} dB`;
    if (snrBar) snrBar.style.width = `${Math.min(100, (this.snrValue / 100) * 100)}%`;

    if (coincEl) coincEl.innerText = this.coincidenceScore.toFixed(3);
    if (coincBar) coincBar.style.width = `${Math.min(100, this.coincidenceScore * 100)}%`;
  }

  updateUIState() {
    const activateBtn = document.getElementById('activateBtn');
    const statusModeText = document.getElementById('statusModeText');
    const statusBadge = document.getElementById('systemStatusBadge');
    const root = document.getElementById('appRoot');

    if (root) {
      root.dataset.state = this.systemState;
    }

    if (this.systemState === 'IDLE') {
      if (statusModeText) statusModeText.innerText = 'AMBIENT NOISE FIELD // SCANNING HYDROGEN & HYDROXYL BANDS';
      if (statusBadge) {
        statusBadge.innerText = 'RECEIVER: IDLE';
        statusBadge.className = 'status-badge idle';
      }
      if (activateBtn) {
        activateBtn.disabled = true;
        activateBtn.className = 'action-btn activate-btn disabled';
        activateBtn.innerHTML = `<span class="btn-label">CARRIER LOCKED [${this.currentAddress.length}/${REQUIRED_ADDRESS_LENGTH}]</span>`;
      }
    } else if (this.systemState === 'DIALING') {
      if (statusModeText) statusModeText.innerText = `MULTI-BASELINE COINCIDENCE CROSS-CORRELATION [${this.currentAddress.length}/${REQUIRED_ADDRESS_LENGTH}]...`;
      if (statusBadge) {
        statusBadge.innerText = 'COINCIDENCE CHECK';
        statusBadge.className = 'status-badge dialing';
      }
      if (activateBtn) {
        activateBtn.disabled = true;
        activateBtn.className = 'action-btn activate-btn disabled';
        activateBtn.innerHTML = `<span class="btn-label">CHANNELS LOCKED [${this.currentAddress.length}/${REQUIRED_ADDRESS_LENGTH}]</span>`;
      }
    } else if (this.systemState === 'READY') {
      if (statusModeText) statusModeText.innerText = '7/7 HARMONICS LOCKED // PENDING CARRIER EXCITATION BEAM';
      if (statusBadge) {
        statusBadge.innerText = 'COINCIDENCE VERIFIED';
        statusBadge.className = 'status-badge ready';
      }
      if (activateBtn) {
        activateBtn.disabled = false;
        activateBtn.className = 'action-btn activate-btn ready-pulse';
        activateBtn.innerHTML = `<span class="btn-glow"></span><span class="btn-label">ENGAGE CARRIER TRANSMISSION // OPEN CHANNEL</span>`;
      }
    } else if (this.systemState === 'BUILDUP') {
      if (statusModeText) statusModeText.innerText = 'STAGE 1: DOPPLER DRIFT LOCK & BEAMFORMING EXCITATION...';
      if (statusBadge) {
        statusBadge.innerText = 'EXCITATION BUILDUP';
        statusBadge.className = 'status-badge buildup';
      }
      if (activateBtn) {
        activateBtn.disabled = true;
        activateBtn.className = 'action-btn activate-btn in-progress';
        activateBtn.innerHTML = `<span class="btn-label">EXCITING CARRIER APERTURE...</span>`;
      }
    } else if (this.systemState === 'BREAKTHROUGH') {
      if (statusModeText) statusModeText.innerText = 'STAGE 2: HYPER-SPATIAL BREAKTHROUGH INSTANT';
      if (statusBadge) {
        statusBadge.innerText = 'BREAKTHROUGH';
        statusBadge.className = 'status-badge breakthrough';
      }
    } else if (this.systemState === 'ACTIVE') {
      if (statusModeText) statusModeText.innerText = 'STAGE 3: BILATERAL TECHNOSIGNATURE LINK ESTABLISHED // CARRIER OPEN';
      if (statusBadge) {
        statusBadge.innerText = 'LINK ACTIVE';
        statusBadge.className = 'status-badge active';
      }
      if (activateBtn) {
        activateBtn.disabled = true;
        activateBtn.className = 'action-btn activate-btn sustained';
        activateBtn.innerHTML = `<span class="btn-label">BILATERAL CARRIER ACTIVE</span>`;
      }
    }
  }

  startTelemetryClocks() {
    const utcClock = document.getElementById('utcClock');
    const siderealClock = document.getElementById('siderealClock');

    const updateClocks = () => {
      const now = new Date();
      if (utcClock) {
        utcClock.innerText = now.toUTCString().split(' ')[4] + ' UTC';
      }
      if (siderealClock) {
        // Approximate Local Sidereal Time
        const gst = (now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds()) * 1.00273790935;
        const sh = Math.floor((gst / 3600) % 24).toString().padStart(2, '0');
        const sm = Math.floor((gst / 60) % 60).toString().padStart(2, '0');
        const ss = Math.floor(gst % 60).toString().padStart(2, '0');
        siderealClock.innerText = `LST ${sh}:${sm}:${ss}`;
      }
    };
    setInterval(updateClocks, 1000);
    updateClocks();
  }
}

// Instantiate and expose application globally for browser/testing access
window.addEventListener('DOMContentLoaded', () => {
  window.__APP__ = new TechnosignatureApp();
});
