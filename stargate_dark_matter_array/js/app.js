/**
 * BOREAS-IX Master Application Controller
 * Coordinates physics simulation, renderer, audio, discrimination, archive, and UI state.
 */

class DarkMatterApp {
  constructor() {
    this.detectorRenderer = null;
    this.engineeringRenderer = null;
    this.currentView = 'detector'; // 'detector', 'engineering', 'archive', 'logger', 'settings'
    this.apertureState = 'STANDBY'; // 'STANDBY', 'PENDING', 'BUILDUP', 'BREAKTHROUGH', 'ACTIVE'
    this.activationTimeout = null;
    this.breakthroughTimeout = null;

    this.init();
  }

  init() {
    // 1. Setup scale listener
    this.setupViewportScaling();

    // 2. Initialize Renderers
    this.detectorRenderer = new window.DetectorRenderer('detector-canvas');
    this.engineeringRenderer = new window.CryoEngineeringRenderer('engineering-canvas', 'engineering-info-panel');

    // 3. Bind UI Events
    this.bindNavigation();
    this.bindCoreControls();
    this.bindArchiveUI();
    this.bindLoggerUI();
    this.bindOperatorManual();

    // 4. Connect Telemetry Subscriptions
    if (window.dmTelemetry) {
      window.dmTelemetry.subscribe((telemetry) => {
        this.updateTelemetryUI(telemetry);
      });
    }

    // 5. Connect Logger Subscriptions
    if (window.dmLogger) {
      window.dmLogger.subscribe((logs) => {
        this.renderLogs(logs);
      });
      window.dmLogger.log('SYSTEM', 'BOREAS-IX Cryogenic Observatory Console Initialized [1,450m Overburden]');
    }

    // 6. Update Slot & Channel UI
    this.updateSlotUI();
    this.updateChannelButtons();
    this.updateApertureUI();

    // 7. Initial archive render
    this.renderArchiveList();

    // 8. Bind settings
    if (window.dmSettings) {
      window.dmSettings.bindUI();
    }
  }

  setupViewportScaling() {
    const updateScale = () => {
      const targetW = 1920;
      const targetH = 1080;
      const curW = window.innerWidth;
      const curH = window.innerHeight;
      
      // Calculate unitless aspect-ratio scale factor
      const scale = Math.min(curW / targetW, curH / targetH);
      document.documentElement.style.setProperty('--ui-scale', scale.toFixed(4));
    };

    window.addEventListener('resize', () => {
      updateScale();
      if (this.detectorRenderer) this.detectorRenderer.resize();
      if (this.engineeringRenderer) this.engineeringRenderer.resize();
    });

    updateScale();
  }

  bindNavigation() {
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.currentTarget.dataset.view;
        this.switchView(view);
      });
    });
  }

  switchView(viewName) {
    this.currentView = viewName;

    // Update nav button active classes
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    // Update views visibility
    document.querySelectorAll('.view-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `view-${viewName}`);
    });

    if (viewName === 'engineering' && this.engineeringRenderer) {
      setTimeout(() => {
        this.engineeringRenderer.resize();
        this.engineeringRenderer.render();
      }, 50);
    } else if (viewName === 'detector' && this.detectorRenderer) {
      setTimeout(() => {
        this.detectorRenderer.resize();
      }, 50);
    } else if (viewName === 'archive') {
      this.renderArchiveList();
    } else if (viewName === 'logger' && window.dmLogger) {
      this.renderLogs(window.dmLogger.getFilteredLogs());
    }

    if (window.dmAudio) window.dmAudio.playChannelSelect();
  }

  bindCoreControls() {
    // -------------------------------------------------------------
    // CLUSTER 1: PMT DETECTOR SECTOR ARRAY
    // -------------------------------------------------------------
    const pmtButtonsContainer = document.getElementById('pmt-channel-buttons');
    if (pmtButtonsContainer && window.dmDiscrimination) {
      pmtButtonsContainer.innerHTML = '';
      window.dmDiscrimination.channels.forEach(ch => {
        const btn = document.createElement('button');
        btn.className = 'pmt-btn';
        btn.id = `btn-${ch.id.toLowerCase()}`;
        btn.dataset.channelId = ch.id;
        btn.innerHTML = `
          <div class="pmt-btn-header">
            <span class="pmt-btn-id">${ch.id}</span>
            <span class="pmt-btn-rate" id="rate-${ch.id}">${ch.baseRate} mHz</span>
          </div>
          <div class="pmt-btn-name">${ch.name}</div>
          <div class="pmt-btn-glyph">${ch.glyph}</div>
        `;
        btn.addEventListener('click', () => {
          this.onChannelClicked(ch.id);
        });
        pmtButtonsContainer.appendChild(btn);
      });
    }

    // Background noise / veto spike test toggle button
    const vetoSpikeBtn = document.getElementById('btn-simulate-veto');
    if (vetoSpikeBtn) {
      vetoSpikeBtn.addEventListener('click', () => {
        const isSpike = !window.dmDiscrimination.forceRejectionMode;
        window.dmDiscrimination.setForceRejectionMode(isSpike);
        vetoSpikeBtn.classList.toggle('active-spike', isSpike);
        vetoSpikeBtn.textContent = isSpike 
          ? '⚠️ NOISE SPIKE ENGAGED [REJECTION ACTIVE]' 
          : '⚡ SIMULATE VETO SPIKE / FAIL PATH';
        
        if (window.dmAudio) {
          if (isSpike) window.dmAudio.playVetoAlert();
          else window.dmAudio.playChannelSelect();
        }

        if (window.dmLogger) {
          window.dmLogger.log('SYSTEM', isSpike 
            ? 'Simulated Cosmogenic Muon & Noise Spike ENGAGED: Next candidate will fail background discrimination.' 
            : 'Simulated Noise Spike RELEASED: Ultra-pure baseline restored.');
        }
      });
    }

    // -------------------------------------------------------------
    // CLUSTER 2: RUN COMMIT & APERTURE INTERLOCK CONSOLE
    // -------------------------------------------------------------
    const commitBtn = document.getElementById('btn-commit-run');
    if (commitBtn) {
      commitBtn.addEventListener('click', () => {
        this.onCommitRunClicked();
      });
    }

    const disengageBtn = document.getElementById('btn-disengage');
    if (disengageBtn) {
      disengageBtn.addEventListener('click', () => {
        this.onDisengageClicked();
      });
    }

    // Blind Analysis Safety Interlock Toggle (MUST DEFAULT TO RELEASED / FALSE)
    const blindToggle = document.getElementById('toggle-blind-lock');
    if (blindToggle) {
      blindToggle.checked = false; // Released by default
      blindToggle.addEventListener('change', (e) => {
        const isLocked = e.target.checked;
        if (window.dmStorage) {
          window.dmStorage.set('blindAnalysisLock', isLocked);
        }
        
        const banner = document.getElementById('blind-warning-banner');
        if (banner) {
          banner.classList.toggle('visible', isLocked);
        }

        if (window.dmLogger) {
          window.dmLogger.log('SYSTEM', isLocked 
            ? 'BLIND-ANALYSIS PROTOCOL LOCK ENGAGED: Unblinding aperture opening is prohibited until review consensus.' 
            : 'BLIND-ANALYSIS PROTOCOL LOCK RELEASED: Manual unblinding aperture commits authorized.');
        }
        if (window.dmAudio) window.dmAudio.playChannelSelect();
      });
    }

    // Quick-Dial preset select dropdown
    const presetSelect = document.getElementById('quick-preset-select');
    if (presetSelect && window.dmQuickDial) {
      presetSelect.innerHTML = '<option value="">-- SELECT ARCHIVE PRESET TO AUTO-DIAL --</option>';
      
      const optGroup1 = document.createElement('optgroup');
      optGroup1.label = 'TIER 1: Vetted Historical Baselines';
      
      const optGroup2 = document.createElement('optgroup');
      optGroup2.label = 'TIER 2: Candidate Excesses Under Review';

      window.dmQuickDial.getPresets().forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.label;
        if (p.tier === 'TIER_1_VETTED') optGroup1.appendChild(opt);
        else optGroup2.appendChild(opt);
      });

      presetSelect.appendChild(optGroup1);
      presetSelect.appendChild(optGroup2);

      presetSelect.addEventListener('change', (e) => {
        const presetId = e.target.value;
        if (presetId) {
          this.triggerAutoDialPreset(presetId);
        }
      });
    }

    // Slot click to clear individual slot
    document.querySelectorAll('.coord-slot').forEach(slotEl => {
      slotEl.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.slotIndex);
        if (window.dmDiscrimination && window.dmDiscrimination.lockedSlots[idx]) {
          window.dmDiscrimination.lockedSlots[idx] = null;
          this.updateSlotUI();
          this.updateApertureUI();
          if (window.dmAudio) window.dmAudio.playChannelSelect();
        }
      });
    });
  }

  onChannelClicked(channelId) {
    if (!window.dmDiscrimination) return;
    if (this.apertureState === 'BUILDUP' || this.apertureState === 'BREAKTHROUGH' || this.apertureState === 'ACTIVE') {
      return; // Locked while aperture is active
    }

    // Check if slots are already full
    const nextSlot = window.dmDiscrimination.getNextEmptySlotIndex();
    if (nextSlot === -1) {
      if (window.dmLogger) {
        window.dmLogger.log('CHANNEL', 'All 7 candidate slots are filled. Click COMMIT RUN or DISENGAGE.');
      }
      return;
    }

    // Start discrimination sequence
    this.executeDiscriminationSequence(channelId, nextSlot);
  }

  executeDiscriminationSequence(channelId, slotIndex, isAutoDial = false) {
    const disc = window.dmDiscrimination;
    const candidate = disc.generateCandidatePulse(channelId);

    // Audio check blip
    if (window.dmAudio) {
      window.dmAudio.playDiscriminationCheck();
    }

    // Trigger waveform on detector canvas
    const traceType = candidate.expectedResult === 'FAIL' 
      ? (candidate.failReason.includes('Muon') ? 'MUON_SPIKE' : 'ER_BACKGROUND') 
      : 'NR_CANDIDATE';
    
    if (this.detectorRenderer) {
      this.detectorRenderer.triggerTrace(traceType);
    }

    // Mark slot as discriminating in UI
    const slotEl = document.getElementById(`slot-${slotIndex}`);
    if (slotEl) {
      slotEl.classList.add('discriminating');
      slotEl.querySelector('.slot-status').textContent = 'CHECKING...';
    }

    // Multi-stage evaluation
    const result = disc.evaluateDiscrimination(candidate);

    setTimeout(() => {
      if (slotEl) slotEl.classList.remove('discriminating');

      if (result.passed) {
        // PASSED: Lock Candidate
        disc.lockSlot(slotIndex, candidate);
        if (window.dmAudio) window.dmAudio.playDiscriminationSuccess(slotIndex);
        if (window.dmLogger) {
          window.dmLogger.log('DISCRIMINATION', `Candidate Recoil CONFIRMED on [${channelId}] -> Locked Slot ${slotIndex + 1} (${candidate.channel.glyph})`, {
            s1: candidate.s1,
            s2: candidate.s2,
            logRatio: candidate.logRatio,
            energy: candidate.energyKeVnr + ' keVnr'
          });
        }
        if (window.dmStorage) window.dmStorage.updateStats('candidatesPassed');
      } else {
        // FAILED: Visible & Audible Rejection
        if (window.dmAudio) {
          window.dmAudio.playDiscriminationFailed();
          window.dmAudio.playVetoAlert();
        }
        this.flashVetoRejection(result.reason);
        if (window.dmLogger) {
          window.dmLogger.log('REJECTION', `Background Event REJECTED on [${channelId}]: ${result.reason}`, candidate);
        }
        if (window.dmStorage) window.dmStorage.updateStats('candidatesRejected');
      }

      this.updateSlotUI();
      this.updateChannelButtons();
      this.updateApertureUI();
      this.updateDiscriminationMeters(candidate, result);

    }, isAutoDial ? 180 : 300);
  }

  flashVetoRejection(reason) {
    const vetoPanel = document.getElementById('muon-veto-panel');
    const vetoReasonEl = document.getElementById('veto-rejection-reason');
    if (vetoPanel) {
      vetoPanel.classList.add('veto-strobe');
      setTimeout(() => vetoPanel.classList.remove('veto-strobe'), 1200);
    }
    if (vetoReasonEl) {
      vetoReasonEl.textContent = reason;
      vetoReasonEl.classList.add('visible');
      setTimeout(() => vetoReasonEl.classList.remove('visible'), 3500);
    }
  }

  updateDiscriminationMeters(candidate, result) {
    const s1El = document.getElementById('meter-s1-val');
    const s2El = document.getElementById('meter-s2-val');
    const ratioEl = document.getElementById('meter-ratio-val');
    const vetoDtEl = document.getElementById('meter-veto-dt');
    const energyEl = document.getElementById('meter-energy-val');

    if (s1El) s1El.textContent = `${candidate.s1} PE`;
    if (s2El) s2El.textContent = `${candidate.s2} PE`;
    if (ratioEl) {
      ratioEl.textContent = candidate.logRatio.toFixed(2);
      ratioEl.className = candidate.logRatio <= 2.55 ? 'disc-val pass' : 'disc-val fail';
    }
    if (vetoDtEl) {
      vetoDtEl.textContent = `${candidate.muonVetoDt} ns`;
      vetoDtEl.className = Math.abs(candidate.muonVetoDt) >= 50 ? 'disc-val pass' : 'disc-val fail';
    }
    if (energyEl) energyEl.textContent = `${candidate.energyKeVnr} keVnr`;
  }

  triggerAutoDialPreset(presetId) {
    if (!window.dmQuickDial) return;
    this.switchView('detector');

    window.dmQuickDial.startAutoDial(
      presetId,
      (channelId, slotIndex, currentStep, totalSteps) => {
        this.executeDiscriminationSequence(channelId, slotIndex, true);
      },
      (completedPresetId) => {
        // Lands in PENDING state. NEVER AUTO-FIRES!
        this.updateApertureUI();
        if (window.dmLogger) {
          window.dmLogger.log('APERTURE', `Archival sequence [${completedPresetId}] staged (7/7 slots). Awaiting operator commit.`);
        }
      }
    );
  }

  updateSlotUI() {
    const disc = window.dmDiscrimination;
    if (!disc) return;

    for (let i = 0; i < disc.slotCount; i++) {
      const slotData = disc.lockedSlots[i];
      const slotEl = document.getElementById(`slot-${i}`);
      if (!slotEl) continue;

      if (slotData) {
        slotEl.className = 'coord-slot locked';
        slotEl.innerHTML = `
          <div class="slot-idx">SLOT 0${i + 1}</div>
          <div class="slot-glyph">${slotData.glyph}</div>
          <div class="slot-details">
            <span class="slot-ch">${slotData.channel.id}</span>
            <span class="slot-energy">${slotData.energyKeVnr} keVnr</span>
          </div>
          <div class="slot-status">LOCKED</div>
        `;
      } else {
        slotEl.className = 'coord-slot empty';
        slotEl.innerHTML = `
          <div class="slot-idx">SLOT 0${i + 1}</div>
          <div class="slot-glyph empty-glyph">[ -- ]</div>
          <div class="slot-details">
            <span class="slot-ch">WAITING</span>
            <span class="slot-energy">0.0 keVnr</span>
          </div>
          <div class="slot-status">VACANT</div>
        `;
      }
    }
  }

  updateChannelButtons() {
    const disc = window.dmDiscrimination;
    if (!disc) return;

    disc.channels.forEach(ch => {
      const btn = document.getElementById(`btn-${ch.id.toLowerCase()}`);
      if (!btn) return;
      const isLocked = disc.lockedSlots.some(s => s && s.channel.id === ch.id);
      btn.classList.toggle('channel-locked', isLocked);
    });
  }

  updateApertureUI() {
    const disc = window.dmDiscrimination;
    const lockedCount = disc ? disc.getLockedCount() : 0;
    const commitBtn = document.getElementById('btn-commit-run');
    const statusBadge = document.getElementById('aperture-status-badge');
    const stageIndicator = document.getElementById('stage-indicator-bar');

    if (this.apertureState === 'ACTIVE') {
      if (commitBtn) {
        commitBtn.disabled = true;
        commitBtn.textContent = '● FLUX APERTURE ACTIVE [SUSTAINED]';
        commitBtn.className = 'btn-commit active-run';
      }
      if (statusBadge) {
        statusBadge.textContent = 'SUSTAINED FLUX STREAM [COHERENT WIMP SIGNAL]';
        statusBadge.className = 'status-badge active-flow';
      }
      return;
    }

    if (this.apertureState === 'BUILDUP') {
      if (commitBtn) {
        commitBtn.disabled = true;
        commitBtn.textContent = '▲ BUILDUP IN PROGRESS [STATISTICAL RAMP]';
        commitBtn.className = 'btn-commit building';
      }
      if (statusBadge) {
        statusBadge.textContent = 'BUILDUP: BACKGROUND REJECTION CLIMBING';
        statusBadge.className = 'status-badge building';
      }
      return;
    }

    if (lockedCount === 7) {
      // 7/7 Locked -> PENDING STATE. NEVER AUTO-FIRES!
      this.apertureState = 'PENDING';
      if (commitBtn) {
        commitBtn.disabled = false;
        commitBtn.textContent = '▶ COMMIT CANDIDATE RUN / OPEN APERTURE';
        commitBtn.className = 'btn-commit ready-to-commit';
      }
      if (statusBadge) {
        statusBadge.textContent = '7/7 SEQUENCE STAGED // APERTURE PENDING COMMIT';
        statusBadge.className = 'status-badge ready';
      }
      if (this.detectorRenderer) this.detectorRenderer.setApertureState('PENDING');
      if (window.dmTelemetry) window.dmTelemetry.setApertureState('PENDING');
    } else {
      this.apertureState = 'STANDBY';
      if (commitBtn) {
        commitBtn.disabled = true;
        commitBtn.textContent = `AWAITING COORDINATES (${lockedCount}/7 LOCKED)`;
        commitBtn.className = 'btn-commit disabled';
      }
      if (statusBadge) {
        statusBadge.textContent = `STANDBY // SCANNING DETECTOR (${lockedCount}/7 SLOTS)`;
        statusBadge.className = 'status-badge standby';
      }
      if (this.detectorRenderer) this.detectorRenderer.setApertureState('STANDBY');
      if (window.dmTelemetry) window.dmTelemetry.setApertureState('STANDBY');
    }
  }

  onCommitRunClicked() {
    // Check Blind-Analysis Safety Interlock
    const isBlindLocked = document.getElementById('toggle-blind-lock')?.checked;
    if (isBlindLocked) {
      if (window.dmAudio) window.dmAudio.playVetoAlert();
      alert('BLIND-ANALYSIS PROTOCOL INTERLOCK ENGAGED:\nUnblinding candidate dataset is prohibited by safety protocol until analysis cuts are frozen.');
      if (window.dmLogger) {
        window.dmLogger.log('SYSTEM', 'COMMIT ATTEMPT BLOCKED: Blind-analysis interlock is active.');
      }
      return;
    }

    if (this.apertureState !== 'PENDING') return;

    // Start Three-Stage Activation Sequence
    this.startThreeStageActivation();
  }

  startThreeStageActivation() {
    if (window.dmLogger) {
      window.dmLogger.log('APERTURE', 'STAGE 1 (BUILDUP) Initiated: Ramp rate, statistical significance rising toward 5.0σ discovery threshold.');
    }

    // -------------------------------------------------------------
    // STAGE 1: BUILDUP (2.5 Seconds)
    // -------------------------------------------------------------
    this.apertureState = 'BUILDUP';
    this.updateApertureUI();
    if (this.detectorRenderer) this.detectorRenderer.setApertureState('BUILDUP', 0);
    if (window.dmTelemetry) window.dmTelemetry.setApertureState('BUILDUP');
    if (window.dmAudio) window.dmAudio.startActivationBuildup();

    let buildupStart = Date.now();
    const buildupDuration = 2400;

    const buildupInterval = setInterval(() => {
      const elapsed = Date.now() - buildupStart;
      const progress = Math.min(1, elapsed / buildupDuration);
      
      if (this.detectorRenderer) {
        this.detectorRenderer.setApertureState('BUILDUP', progress);
      }

      // Ramp statistical significance from 2.1σ to 4.9σ
      const sigma = (2.1 + progress * 2.85).toFixed(2);
      if (window.dmTelemetry) {
        window.dmTelemetry.setApertureState('BUILDUP', parseFloat(sigma));
      }

      if (progress >= 1) {
        clearInterval(buildupInterval);
        this.triggerBreakthroughStage();
      }
    }, 50);
  }

  triggerBreakthroughStage() {
    // -------------------------------------------------------------
    // STAGE 2: BREAKTHROUGH (0.6 Seconds)
    // -------------------------------------------------------------
    this.apertureState = 'BREAKTHROUGH';
    if (window.dmLogger) {
      window.dmLogger.log('APERTURE', 'STAGE 2 (BREAKTHROUGH): 5.0σ Discovery Threshold Breached! Coherent Dark Matter Aperture Burst.');
    }

    if (this.detectorRenderer) this.detectorRenderer.setApertureState('BREAKTHROUGH', 0);
    if (window.dmTelemetry) window.dmTelemetry.setApertureState('ACTIVE', 5.18);
    if (window.dmAudio) window.dmAudio.playBreakthroughBlast();

    let btStart = Date.now();
    const btDuration = 600;

    const btInterval = setInterval(() => {
      const elapsed = Date.now() - btStart;
      const progress = Math.min(1, elapsed / btDuration);
      if (this.detectorRenderer) {
        this.detectorRenderer.setApertureState('BREAKTHROUGH', progress);
      }

      if (progress >= 1) {
        clearInterval(btInterval);
        this.enterSustainedActiveStage();
      }
    }, 40);
  }

  enterSustainedActiveStage() {
    // -------------------------------------------------------------
    // STAGE 3: SUSTAINED ACTIVE
    // -------------------------------------------------------------
    this.apertureState = 'ACTIVE';
    this.updateApertureUI();
    if (this.detectorRenderer) this.detectorRenderer.setApertureState('ACTIVE', 1.0);
    if (window.dmTelemetry) window.dmTelemetry.setApertureState('ACTIVE');
    if (window.dmStorage) {
      window.dmStorage.updateStats('aperturesOpened');
      // Save dial history
      const locked = window.dmDiscrimination.lockedSlots.map(s => s.glyph).join(' - ');
      window.dmStorage.addDialHistory({
        sequence: locked,
        significance: '5.18σ (Discovered)',
        status: 'SUSTAINED_RUN'
      });
    }

    if (window.dmLogger) {
      window.dmLogger.log('APERTURE', 'STAGE 3 (SUSTAINED ACTIVE): Continuous dark matter flux streaming through target chamber.');
    }
  }

  onDisengageClicked() {
    // Abort any ongoing auto-dialing
    if (window.dmQuickDial) {
      window.dmQuickDial.abortAutoDial();
    }

    if (window.dmAudio) {
      window.dmAudio.playDisengageSound();
    }

    if (window.dmDiscrimination) {
      window.dmDiscrimination.clearSlots();
    }

    this.apertureState = 'STANDBY';
    this.updateSlotUI();
    this.updateChannelButtons();
    this.updateApertureUI();

    if (this.detectorRenderer) {
      this.detectorRenderer.setApertureState('STANDBY');
    }
    if (window.dmTelemetry) {
      window.dmTelemetry.setApertureState('STANDBY');
    }

    if (window.dmLogger) {
      window.dmLogger.log('APERTURE', 'DISENGAGE executed: Cryogenic aperture collapsed, detector restored to standby.');
    }
  }

  updateTelemetryUI(telemetry) {
    const tempEl = document.getElementById('telem-temp');
    const pressEl = document.getElementById('telem-pressure');
    const voltEl = document.getElementById('telem-voltage');
    const muonRateEl = document.getElementById('telem-muon-rate');
    const gammaRateEl = document.getElementById('telem-gamma-rate');
    const sigmaEl = document.getElementById('telem-sigma');
    const fluxEl = document.getElementById('telem-flux');

    if (tempEl) tempEl.textContent = `${telemetry.cryoTempK.toFixed(2)} K`;
    if (pressEl) pressEl.textContent = `${telemetry.vacuumPressureMbar.toExponential(2)} mbar`;
    if (voltEl) voltEl.textContent = `${telemetry.driftVoltageKv.toFixed(2)} kV`;
    if (muonRateEl) muonRateEl.textContent = `${telemetry.muonVetoRateHz.toFixed(3)} Hz`;
    if (gammaRateEl) gammaRateEl.textContent = `${telemetry.ambientGammaRateHz.toFixed(2)} Hz`;
    if (sigmaEl) {
      sigmaEl.textContent = `${telemetry.exclusionLimitSigma.toFixed(2)} σ`;
      sigmaEl.className = telemetry.exclusionLimitSigma >= 5.0 ? 'telem-val discovery' : (telemetry.exclusionLimitSigma >= 3.0 ? 'telem-val candidate' : 'telem-val');
    }
    if (fluxEl) fluxEl.textContent = `${telemetry.darkMatterFluxEventsSec} ev/s`;
  }

  bindArchiveUI() {
    const searchInput = document.getElementById('archive-search-input');
    const filterTier = document.getElementById('archive-filter-tier');

    if (searchInput) {
      searchInput.addEventListener('input', () => this.renderArchiveList());
    }
    if (filterTier) {
      filterTier.addEventListener('change', () => this.renderArchiveList());
    }
  }

  renderArchiveList() {
    const container = document.getElementById('archive-entries-container');
    if (!container || !window.dmArchive) return;

    const query = document.getElementById('archive-search-input')?.value || '';
    const tier = document.getElementById('archive-filter-tier')?.value || 'ALL';
    const entries = window.dmArchive.searchEntries(query, tier);

    container.innerHTML = '';
    entries.forEach(entry => {
      const card = document.createElement('div');
      card.className = `archive-card ${entry.tier.toLowerCase()}`;
      card.id = `archive-${entry.id}`;

      // Build relational links HTML
      const relatedHtml = entry.relatedIds.map(rid => 
        `<button class="rel-link-btn" data-target-id="${rid}">[REF: ${rid}]</button>`
      ).join(' ');

      // Channels badges
      const channelsHtml = entry.channels.map(ch => 
        `<span class="arch-ch-badge">${ch}</span>`
      ).join(' ');

      card.innerHTML = `
        <div class="arch-header">
          <div class="arch-meta">
            <span class="arch-id">${entry.id}</span>
            <span class="arch-date">${entry.date}</span>
            <span class="arch-tier-tag">${entry.tier === 'TIER_1_VETTED' ? 'TIER 1: VETTED' : 'TIER 2: CANDIDATE'}</span>
          </div>
          <h3 class="arch-title">${entry.title}</h3>
        </div>
        <p class="arch-summary">${entry.summary}</p>
        <div class="arch-specs-grid">
          <div><span class="arch-lbl">AUTHOR:</span> ${entry.author}</div>
          <div><span class="arch-lbl">SIGNIFICANCE:</span> <span class="highlight-val">${entry.significance}</span></div>
          <div><span class="arch-lbl">EXPOSURE:</span> ${entry.exposureTonnesDays} tonne-days</div>
          <div><span class="arch-lbl">ENERGY ROI:</span> ${entry.energyRange}</div>
        </div>
        <div class="arch-channels-row">
          <span class="arch-lbl">COORDINATE SEQUENCE:</span>
          <div class="arch-ch-list">${channelsHtml}</div>
        </div>
        <div class="arch-rel-row">
          <span class="arch-lbl">CROSS-REFERENCES:</span>
          <div class="arch-rel-list">${relatedHtml}</div>
        </div>
        <div class="arch-actions">
          <button class="btn-load-archive" data-preset-id="${entry.id}">
            ⚡ LOAD RUN DATASET INTO DETECTOR [AUTO-DIAL]
          </button>
        </div>
      `;

      container.appendChild(card);
    });

    // Bind relational jump buttons
    container.querySelectorAll('.rel-link-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetId = e.currentTarget.dataset.targetId;
        this.jumpToArchiveEntry(targetId);
      });
    });

    // Bind Load dataset buttons
    container.querySelectorAll('.btn-load-archive').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const pid = e.currentTarget.dataset.presetId;
        this.triggerAutoDialPreset(pid);
      });
    });
  }

  jumpToArchiveEntry(targetId) {
    if (window.dmStorage) window.dmStorage.markArchiveViewed(targetId);
    
    // Clear search filter so target is visible
    const searchInput = document.getElementById('archive-search-input');
    const filterTier = document.getElementById('archive-filter-tier');
    if (searchInput) searchInput.value = '';
    if (filterTier) filterTier.value = 'ALL';
    this.renderArchiveList();

    const targetEl = document.getElementById(`archive-${targetId}`);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      targetEl.classList.add('highlight-target');
      setTimeout(() => targetEl.classList.remove('highlight-target'), 2000);
      if (window.dmAudio) window.dmAudio.playChannelSelect();
      if (window.dmLogger) window.dmLogger.log('ARCHIVE', `Cross-referenced relational dataset: ${targetId}`);
    }
  }

  bindLoggerUI() {
    const filterSelect = document.getElementById('logger-filter-select');
    if (filterSelect && window.dmLogger) {
      filterSelect.addEventListener('change', (e) => {
        window.dmLogger.setFilter(e.target.value);
      });
    }

    const clearBtn = document.getElementById('btn-clear-logs');
    if (clearBtn && window.dmLogger) {
      clearBtn.addEventListener('click', () => {
        window.dmLogger.clear();
      });
    }

    const exportBtn = document.getElementById('btn-export-logs');
    if (exportBtn && window.dmLogger) {
      exportBtn.addEventListener('click', () => {
        const text = window.dmLogger.exportText();
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `BOREAS-IX_SessionLog_${Date.now()}.txt`;
        a.click();
      });
    }
  }

  renderLogs(logs) {
    const container = document.getElementById('session-logs-container');
    if (!container) return;

    container.innerHTML = '';
    logs.forEach(log => {
      const row = document.createElement('div');
      row.className = `log-row log-${log.category.toLowerCase()}`;
      row.innerHTML = `
        <span class="log-time">[${log.time}]</span>
        <span class="log-cat">[${log.category}]</span>
        <span class="log-msg">${log.message}</span>
      `;
      container.appendChild(row);
    });
  }

  bindOperatorManual() {
    const openBtn = document.getElementById('btn-open-manual');
    const modal = document.getElementById('modal-manual');
    const closeBtn = document.getElementById('btn-close-manual');

    if (openBtn && modal) {
      openBtn.addEventListener('click', () => {
        modal.classList.add('visible');
        if (window.dmAudio) window.dmAudio.playChannelSelect();
      });
    }

    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => {
        modal.classList.remove('visible');
        if (window.dmAudio) window.dmAudio.playChannelSelect();
      });
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('visible');
        }
      });
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.dmApp = new DarkMatterApp();
});
