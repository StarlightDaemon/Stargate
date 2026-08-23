/**
 * controls.js - State Machine, Safety Interlock, and Quick-Dial Sequencer
 * Cascadia Lithospheric Seismo-Acoustic Array (CLSA-9)
 */

class SeismicControlSystem {
  constructor() {
    this.state = 'IDLE'; // IDLE, LOCKING, PENDING, BUILDUP, BREAKTHROUGH, ACTIVE
    this.lockedStations = []; // List of locked station indices (0-9)
    this.interlockEngaged = false; // MUST DEFAULT TO RELEASED (false)
    this.autoDialTimer = null;
    this.activationTimers = [];

    this.visualEngine = null;
    this.activePreset = null;
  }

  init(visualEngine) {
    this.visualEngine = visualEngine;
    this.bindDomElements();
    this.renderStationButtons();
    this.renderPresetLists();
    this.updateUI();
  }

  bindDomElements() {
    // Primary Activation Button
    this.activateBtn = document.getElementById('establish-link-btn');
    if (this.activateBtn) {
      this.activateBtn.addEventListener('click', () => this.handleActivationAttempt());
    }

    // Disengage / Abort Button
    this.disengageBtn = document.getElementById('disengage-network-btn');
    if (this.disengageBtn) {
      this.disengageBtn.addEventListener('click', () => this.disengageNetwork());
    }

    // Safety Interlock Toggle
    this.interlockToggle = document.getElementById('interlock-toggle-btn');
    if (this.interlockToggle) {
      this.interlockToggle.addEventListener('click', () => this.toggleInterlock());
    }

    // Preset Tab Buttons
    this.tab1Btn = document.getElementById('preset-tab-1');
    this.tab2Btn = document.getElementById('preset-tab-2');
    this.list1El = document.getElementById('preset-list-tier1');
    this.list2El = document.getElementById('preset-list-tier2');

    if (this.tab1Btn && this.tab2Btn) {
      this.tab1Btn.addEventListener('click', () => this.switchPresetTab(1));
      this.tab2Btn.addEventListener('click', () => this.switchPresetTab(2));
    }
  }

  switchPresetTab(tier) {
    if (tier === 1) {
      this.tab1Btn.classList.add('active');
      this.tab2Btn.classList.remove('active');
      this.list1El.style.display = 'flex';
      this.list2El.style.display = 'none';
    } else {
      this.tab2Btn.classList.add('active');
      this.tab1Btn.classList.remove('active');
      this.list2El.style.display = 'flex';
      this.list1El.style.display = 'none';
    }
  }

  toggleInterlock() {
    this.interlockEngaged = !this.interlockEngaged;
    window.seismicAudio.ensureContext();
    this.updateInterlockUI();
  }

  updateInterlockUI() {
    const badge = document.getElementById('interlock-status-badge');
    if (!this.interlockToggle || !badge) return;

    if (this.interlockEngaged) {
      this.interlockToggle.classList.add('engaged');
      badge.classList.remove('released');
      badge.classList.add('engaged');
      badge.textContent = 'ENGAGED [LOCKED]';
    } else {
      this.interlockToggle.classList.remove('engaged');
      badge.classList.remove('engaged');
      badge.classList.add('released');
      badge.textContent = 'RELEASED [ARMED]';
    }
  }

  renderStationButtons() {
    const container = document.getElementById('station-matrix-grid');
    if (!container) return;
    container.innerHTML = '';

    SEISMIC_STATIONS.forEach((st, idx) => {
      const tile = document.createElement('div');
      tile.className = 'station-tile';
      tile.id = `station-tile-${idx}`;
      tile.dataset.index = idx;

      tile.innerHTML = `
        <div class="station-tile-header">
          <span class="station-id">${st.id}</span>
          <span class="station-status-pill" id="st-pill-${idx}">OFFLINE</span>
        </div>
        <div class="station-tile-body">
          <span class="station-name">${st.code}</span>
          <span class="station-rms" id="st-rms-${idx}">${st.noiseRms} Mw</span>
        </div>
      `;

      tile.addEventListener('click', () => {
        window.seismicAudio.ensureContext();
        this.toggleStationManual(idx);
      });

      container.appendChild(tile);
    });
  }

  renderPresetLists() {
    if (!this.list1El || !this.list2El) return;
    this.list1El.innerHTML = '';
    this.list2El.innerHTML = '';

    PRELOADED_FAULT_PRESETS.forEach(preset => {
      const card = document.createElement('div');
      card.className = 'preset-card';
      card.id = preset.id;
      card.innerHTML = `
        <div class="preset-card-left">
          <span class="preset-name">${preset.name}</span>
          <div class="preset-meta">
            <span>${preset.region}</span>
            <span>DEPTH: ${preset.depthKm} km</span>
          </div>
        </div>
        <div class="preset-card-right">
          <span class="preset-mag-badge">Mw ${preset.mw}</span>
          <span class="autodial-arrow">▶</span>
        </div>
      `;

      card.addEventListener('click', () => {
        window.seismicAudio.ensureContext();
        this.loadAndAutoDialPreset(preset);
      });

      if (preset.tier === 1) {
        this.list1El.appendChild(card);
      } else {
        this.list2El.appendChild(card);
      }
    });
  }

  toggleStationManual(index) {
    if (this.state === 'BUILDUP' || this.state === 'BREAKTHROUGH' || this.state === 'ACTIVE') {
      return; // Locked while active
    }

    // Abort any active autodial playback
    if (this.autoDialTimer) {
      clearInterval(this.autoDialTimer);
      this.autoDialTimer = null;
    }

    const pos = this.lockedStations.indexOf(index);
    if (pos >= 0) {
      this.lockedStations.splice(pos, 1);
      window.seismicAudio.playStationUnlock();
    } else {
      if (this.lockedStations.length < 7) {
        this.lockedStations.push(index);
        window.seismicAudio.playStationLock(index);
      }
    }

    this.checkStateTransition();
    this.updateUI();
  }

  loadAndAutoDialPreset(preset) {
    if (this.state === 'BUILDUP' || this.state === 'BREAKTHROUGH') return;

    // Reset current locks
    this.disengageNetwork(false);
    window.seismicAudio.playPresetLoad();

    this.activePreset = preset;
    let stepIndex = 0;
    const targetStations = [...preset.stations];

    // Authentic non-instantaneous sequential auto-dialing (~320ms per station)
    this.autoDialTimer = setInterval(() => {
      if (stepIndex >= targetStations.length) {
        clearInterval(this.autoDialTimer);
        this.autoDialTimer = null;
        this.checkStateTransition();
        this.updateUI();
        return;
      }

      const stIdx = targetStations[stepIndex];
      if (!this.lockedStations.includes(stIdx)) {
        this.lockedStations.push(stIdx);
        window.seismicAudio.playStationLock(stIdx);
      }

      this.checkStateTransition();
      this.updateUI();
      stepIndex++;
    }, 320);
  }

  checkStateTransition() {
    if (this.lockedStations.length >= 7) {
      this.state = 'PENDING';
    } else if (this.lockedStations.length > 0) {
      this.state = 'LOCKING';
    } else {
      this.state = 'IDLE';
    }
  }

  handleActivationAttempt() {
    window.seismicAudio.ensureContext();

    if (this.state !== 'PENDING') {
      return;
    }

    // Safety Interlock Check
    if (this.interlockEngaged) {
      window.seismicAudio.playInterlockBlocked();
      this.showInterlockToast();
      return;
    }

    // Execute Three-Stage Staged Activation Sequence
    this.executeThreeStageActivation();
  }

  showInterlockToast() {
    const toast = document.getElementById('interlock-toast');
    if (!toast) return;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  executeThreeStageActivation() {
    // 1. Stage 1: BUILDUP (2.0s)
    this.state = 'BUILDUP';
    if (this.visualEngine) this.visualEngine.setState('BUILDUP');
    this.updateUI();

    let buildupProgress = 0;
    const tremorInterval = setInterval(() => {
      buildupProgress += 0.12;
      window.seismicAudio.playBuildupTremor(Math.min(1.0, buildupProgress));
    }, 240);
    this.activationTimers.push(tremorInterval);

    // 2. Stage 2: BREAKTHROUGH (at t=2000ms, lasting 1200ms)
    const t1 = setTimeout(() => {
      clearInterval(tremorInterval);
      this.state = 'BREAKTHROUGH';
      if (this.visualEngine) this.visualEngine.setState('BREAKTHROUGH');
      window.seismicAudio.playBreakthroughRupture();
      this.updateUI();

      // 3. Stage 3: SUSTAINED ACTIVE (at t=3200ms)
      const t2 = setTimeout(() => {
        this.state = 'ACTIVE';
        if (this.visualEngine) this.visualEngine.setState('ACTIVE');
        window.seismicAudio.startSustainedDrone();
        this.updateUI();
      }, 1200);
      this.activationTimers.push(t2);

    }, 2000);
    this.activationTimers.push(t1);
  }

  disengageNetwork(playSound = true) {
    if (this.autoDialTimer) {
      clearInterval(this.autoDialTimer);
      this.autoDialTimer = null;
    }

    this.activationTimers.forEach(t => clearTimeout(t));
    this.activationTimers = [];

    window.seismicAudio.stopSustainedDrone();
    if (playSound && (this.lockedStations.length > 0 || this.state !== 'IDLE')) {
      window.seismicAudio.playDisengage();
    }

    this.lockedStations = [];
    this.state = 'IDLE';
    this.activePreset = null;

    if (this.visualEngine) {
      this.visualEngine.setLockedStations([]);
      this.visualEngine.setState('IDLE');
    }

    this.updateUI();
  }

  updateUI() {
    if (this.visualEngine) {
      this.visualEngine.setLockedStations(this.lockedStations);
      this.visualEngine.setState(this.state);
    }

    // Update Station Tiles
    SEISMIC_STATIONS.forEach((st, idx) => {
      const tile = document.getElementById(`station-tile-${idx}`);
      const pill = document.getElementById(`st-pill-${idx}`);
      const rms = document.getElementById(`st-rms-${idx}`);
      const isLocked = this.lockedStations.includes(idx);

      if (tile && pill) {
        if (isLocked) {
          tile.classList.add('locked');
          pill.textContent = 'PHASE LOCK';
          if (rms) rms.textContent = '0.98 CORR';
        } else {
          tile.classList.remove('locked');
          pill.textContent = 'STANDBY';
          if (rms) rms.textContent = `${st.noiseRms} Mw`;
        }
      }
    });

    // Update Telemetry Metrics
    const tri = window.seismicTelemetry.solveTriangulation(
      this.lockedStations,
      this.visualEngine ? this.visualEngine.center.x : 0,
      this.visualEngine ? this.visualEngine.center.y : 0,
      this.visualEngine ? this.visualEngine.arrayRadius : 260
    );

    // Beachball canvas
    const bbCanvas = document.getElementById('beachball-canvas');
    if (bbCanvas) {
      window.seismicTelemetry.renderBeachball(bbCanvas, tri.strike, tri.dip, tri.rake);
    }

    // Telemetry DOM Values
    this.setElText('val-coherence', `${tri.coherencePercent}%`);
    this.setElText('val-lat', `${tri.lat.toFixed(3)}°N`);
    this.setElText('val-lng', `${tri.lng.toFixed(3)}°W`);
    this.setElText('val-depth', `${tri.depthKm.toFixed(1)} km`);
    this.setElText('val-rms', `${tri.rmsResidual.toFixed(2)} ms`);
    this.setElText('val-strike', `${tri.strike}°`);
    this.setElText('val-dip', `${tri.dip}°`);
    this.setElText('val-rake', `${tri.rake}°`);

    // Magnitude readout
    const magEl = document.getElementById('val-magnitude');
    if (magEl) {
      if (this.state === 'ACTIVE') {
        magEl.textContent = 'Mw 8.8 (SUSTAINED)';
        magEl.className = 'cell-val alert';
      } else if (this.state === 'BUILDUP') {
        magEl.textContent = 'Mw 7.9 (ESCALATING)';
        magEl.className = 'cell-val alert';
      } else if (this.state === 'BREAKTHROUGH') {
        magEl.textContent = 'Mw 9.2 (RUPTURE)';
        magEl.className = 'cell-val alert';
      } else if (this.lockedStations.length > 0) {
        magEl.textContent = `Mw ${tri.mw.toFixed(1)}`;
        magEl.className = 'cell-val highlight';
      } else {
        magEl.textContent = 'Mw 0.0 (IDLE)';
        magEl.className = 'cell-val';
      }
    }

    // Header Status Pill
    const headerStatus = document.getElementById('header-system-status');
    if (headerStatus) {
      if (this.state === 'ACTIVE') {
        headerStatus.textContent = 'APERTURE SUSTAINED ACTIVE';
        headerStatus.style.color = '#00ffb3';
        headerStatus.style.borderColor = '#00ffb3';
      } else if (this.state === 'BREAKTHROUGH') {
        headerStatus.textContent = 'CRUSTAL BREAKTHROUGH';
        headerStatus.style.color = '#ffffff';
        headerStatus.style.borderColor = '#ffffff';
      } else if (this.state === 'BUILDUP') {
        headerStatus.textContent = 'TREMOR BUILDUP SWELL';
        headerStatus.style.color = '#ff1744';
        headerStatus.style.borderColor = '#ff1744';
      } else if (this.state === 'PENDING') {
        headerStatus.textContent = 'EPICENTER RESOLVED - ARMED';
        headerStatus.style.color = '#ff6d00';
        headerStatus.style.borderColor = '#ff6d00';
      } else if (this.state === 'LOCKING') {
        headerStatus.textContent = `TRIANGULATING (${this.lockedStations.length}/7)`;
        headerStatus.style.color = '#00e5ff';
        headerStatus.style.borderColor = '#00e5ff';
      } else {
        headerStatus.textContent = 'MONITORING ARRAY NOMINAL';
        headerStatus.style.color = '#00e676';
        headerStatus.style.borderColor = '#00e676';
      }
    }

    // Primary Activation Button State
    if (this.activateBtn) {
      this.activateBtn.className = '';
      if (this.state === 'PENDING') {
        this.activateBtn.classList.add('armed');
        this.activateBtn.innerHTML = `<span>⚡</span> ESTABLISH FAULT LINK`;
        this.activateBtn.style.cursor = 'pointer';
      } else if (this.state === 'BUILDUP') {
        this.activateBtn.classList.add('buildup');
        this.activateBtn.innerHTML = `<span>⏳</span> RUPTURE BUILDUP...`;
        this.activateBtn.style.cursor = 'wait';
      } else if (this.state === 'BREAKTHROUGH') {
        this.activateBtn.classList.add('breakthrough');
        this.activateBtn.innerHTML = `<span>💥</span> CRUSTAL RUPTURE`;
        this.activateBtn.style.cursor = 'wait';
      } else if (this.state === 'ACTIVE') {
        this.activateBtn.classList.add('active');
        this.activateBtn.innerHTML = `<span>💠</span> APERTURE ACTIVE`;
        this.activateBtn.style.cursor = 'default';
      } else {
        this.activateBtn.innerHTML = `<span>🔒</span> LOCK 7 STATIONS TO ARM`;
        this.activateBtn.style.cursor = 'not-allowed';
      }
    }
  }

  setElText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }
}

window.SeismicControlSystem = SeismicControlSystem;
