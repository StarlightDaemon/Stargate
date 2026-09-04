/**
 * AERIS Main Orchestrator & State Manager
 * Project AetherLink / Metric Recursion Initiative (NMRI)
 * Astraea Deep Resonance Laboratory (ADRL-04)
 */

class AerisApplication {
  constructor() {
    this.powerOnline = false;
    this.gateState = 'IDLE'; // 'IDLE', 'DIALING', 'LOCKING', 'LOCKED', 'IGNITING', 'ACTIVE', 'DISENGAGING'
    
    // Core Dialpad Buffer (up to 6 coordinate glyphs)
    this.dialBuffer = [];
    this.targetDestination = null;
    this.activeDestination = null;
    this.lockedDestination = null; // destination committed by the last lock

    // Fast-dial lock in progress flag
    this.isAutomatedSequence = false;

    // Generation token: every new lock sequence (or anything that cancels
    // one - disengage, power-off) bumps this, so async callbacks belonging
    // to a superseded sequence can detect they are stale and stop.
    this.dialSequenceId = 0;

    // Subsystems
    this.ring = null;
    this.iris = null;
    this.starMap = null;

    // UI state
    this.activeTab = 'GATE'; // 'GATE', 'DATABASE', 'STARMAP', 'TELEMETRY', 'HISTORY', 'SETTINGS'

    // Settings
    this.settings = {
      crtEffect: false,
      reducedMotion: false,
      glowIntensity: 1.0,
      uiDensity: 'standard'
    };
  }

  init() {
    // 0. Proportional stage scaling for viewports beyond the 1920x1080 design box
    this.fitStage();
    window.addEventListener('resize', () => this.fitStage());

    // 1. Initialize Subsystems
    this.ring = new VectorRingEngine('vector-ring-container');
    this.iris = new AerisContainmentIris('vector-ring-container');
    this.iris.onStateSettled = () => this.updateIrisUI();

    // 2. Render Core UI Components
    this.renderDialpad();
    this.renderBuffer();
    this.renderDatabaseList();
    this.renderPresets();

    // 3. Bind UI Controls
    this.bindCoreControls();
    this.bindNavigation();
    this.bindModals();
    this.bindSettings();

    // 4. Start Clock
    this.startClock();

    // 5. Check if user interacts to unlock AudioContext
    document.addEventListener('click', () => {
      if (window.aerisAudio) {
        window.aerisAudio.ensureContext();
      }
    }, { once: true });
  }

  // Scale the whole console up proportionally on viewports larger than the
  // 1920x1080 design box (e.g. 4K). At or below 1080p the native flex/grid
  // layout is used unchanged (scale factor clamps to 1).
  fitStage() {
    const stage = document.getElementById('app-stage');
    if (!stage) return;
    const k = Math.max(1, Math.min(window.innerWidth / 1920, window.innerHeight / 1080));
    window.__aerisStageScale = k;
    if (k > 1) {
      stage.style.width = `${window.innerWidth / k}px`;
      stage.style.height = `${window.innerHeight / k}px`;
      stage.style.transform = `scale(${k})`;
    } else {
      stage.style.width = '';
      stage.style.height = '';
      stage.style.transform = '';
    }
  }

  startClock() {
    const clockEl = document.getElementById('top-clock');
    const update = () => {
      const now = new Date();
      if (clockEl) {
        clockEl.textContent = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
      }
    };
    update();
    setInterval(update, 1000);
  }

  // --- CORE CONTROL CLUSTER 1: COORDINATE VECTOR DIALPAD ---
  renderDialpad() {
    const grid = document.getElementById('dialpad-grid');
    if (!grid || !window.aerisDB) return;

    grid.innerHTML = '';
    window.aerisDB.glyphs.forEach(glyph => {
      const btn = document.createElement('button');
      btn.className = 'glyph-key-btn';
      btn.id = `glyph-btn-${glyph.id}`;
      btn.dataset.glyphId = glyph.id;
      btn.title = `${glyph.name} (${glyph.meaning})`;
      btn.innerHTML = `
        <svg viewBox="0 0 100 100" class="glyph-svg-icon">${glyph.svg}</svg>
        <span class="glyph-code">${glyph.code}</span>
      `;

      btn.addEventListener('click', () => {
        this.onGlyphClick(glyph.id);
      });

      grid.appendChild(btn);
    });
  }

  onGlyphClick(glyphId) {
    if (!this.powerOnline) {
      if (window.aerisAudio) window.aerisAudio.playError();
      if (window.aerisTelemetry) window.aerisTelemetry.showAlert('Power bus offline. Initialize power to input vector coordinates.', 'warn');
      return;
    }

    if (this.gateState === 'LOCKING' || this.gateState === 'ACTIVE' || this.gateState === 'IGNITING') {
      if (window.aerisAudio) window.aerisAudio.playError();
      return;
    }

    if (this.dialBuffer.length >= 6) {
      if (window.aerisAudio) window.aerisAudio.playError();
      return;
    }

    // Add to buffer
    this.dialBuffer.push(glyphId);
    if (window.aerisAudio) {
      window.aerisAudio.playGlyphTone(glyphId);
    }

    this.renderBuffer();
    this.checkBufferMatch();

    if (window.aerisHistory) {
      const g = window.aerisDB.getGlyph(glyphId);
      window.aerisHistory.log('DIAL', `Glyph [${g.code} / ${g.name}] entered into coordinate buffer position ${this.dialBuffer.length}.`);
    }
  }

  renderBuffer() {
    const slots = document.querySelectorAll('.buffer-slot');
    slots.forEach((slot, idx) => {
      const glyphId = this.dialBuffer[idx];
      if (glyphId !== undefined && window.aerisDB) {
        const glyph = window.aerisDB.getGlyph(glyphId);
        slot.classList.add('filled');
        slot.innerHTML = `
          <svg viewBox="0 0 100 100" class="buffer-glyph-icon">${glyph.svg}</svg>
          <span class="buffer-code">${glyph.code}</span>
        `;
      } else {
        slot.classList.remove('filled');
        slot.innerHTML = `<span class="buffer-empty-label">V-0${idx + 1}</span>`;
      }
    });

    // Update lock button state
    const lockBtn = document.getElementById('btn-lock-target');
    if (lockBtn) {
      lockBtn.disabled = this.dialBuffer.length < 4 || this.gateState === 'LOCKING' || this.gateState === 'ACTIVE';
    }
  }

  clearBuffer() {
    if (this.gateState === 'LOCKING' || this.gateState === 'ACTIVE') return;
    this.dialBuffer = [];
    this.targetDestination = null;
    this.renderBuffer();
    this.updateTargetDisplay(null);
    if (window.aerisAudio) window.aerisAudio.playClick(900);
  }

  backspaceBuffer() {
    if (this.gateState === 'LOCKING' || this.gateState === 'ACTIVE') return;
    if (this.dialBuffer.length > 0) {
      this.dialBuffer.pop();
      this.renderBuffer();
      this.checkBufferMatch();
      if (window.aerisAudio) window.aerisAudio.playClick(1100);
    }
  }

  loadCoordinates(coords, destination = null) {
    if (this.gateState === 'LOCKING' || this.gateState === 'ACTIVE') return;
    if (!this.powerOnline) {
      this.setPower(true);
    }
    this.dialBuffer = [...coords];
    this.targetDestination = destination || window.aerisDB.getDestinationByAddress(coords);
    this.renderBuffer();
    this.updateTargetDisplay(this.targetDestination);
    if (window.aerisAudio) window.aerisAudio.playClick(1500);
  }

  checkBufferMatch() {
    if (!window.aerisDB) return;
    const dest = window.aerisDB.getDestinationByAddress(this.dialBuffer);
    this.targetDestination = dest;
    this.updateTargetDisplay(dest);
  }

  updateTargetDisplay(dest) {
    const nameEl = document.getElementById('target-dest-name');
    const secEl = document.getElementById('target-dest-sector');
    const freqEl = document.getElementById('target-dest-freq');
    const badgeEl = document.getElementById('target-threat-badge');

    if (dest) {
      if (nameEl) nameEl.textContent = `${dest.designation} — ${dest.name}`;
      if (secEl) secEl.textContent = `${dest.sector} (${dest.distanceLY} LY)`;
      if (freqEl) freqEl.textContent = `Carrier: ${dest.carrierFreq} | Stability: ${dest.stability}`;
      if (badgeEl) {
        badgeEl.textContent = dest.threatLevel;
        badgeEl.style.backgroundColor = dest.threatColor + '22';
        badgeEl.style.color = dest.threatColor;
        badgeEl.style.borderColor = dest.threatColor;
        badgeEl.classList.remove('hidden');
      }
    } else {
      if (nameEl) nameEl.textContent = this.dialBuffer.length >= 4 ? 'VECTOR ALIGNMENT: CUSTOM COORDINATE' : 'NO TARGET VECTOR SELECTED';
      if (secEl) secEl.textContent = this.dialBuffer.length >= 4 ? 'Unregistered Deep Subspace Node' : 'Enter 4 to 6 glyphs to calculate trajectory';
      if (freqEl) freqEl.textContent = 'Carrier: 1420.405 MHz (Standard Harmonic)';
      if (badgeEl) badgeEl.classList.add('hidden');
    }
  }

  // --- CORE CONTROL CLUSTER 2: GATE POWER & APERTURE IGNITION ---
  bindCoreControls() {
    // 1. Power Toggle Button
    const powerBtn = document.getElementById('btn-power-toggle');
    if (powerBtn) {
      powerBtn.addEventListener('click', () => {
        this.setPower(!this.powerOnline);
      });
    }

    // 2. Lock Target Vector Button
    const lockBtn = document.getElementById('btn-lock-target');
    if (lockBtn) {
      lockBtn.addEventListener('click', () => {
        this.startLockSequence();
      });
    }

    // 3. Engage Aperture / Abort Button
    const engageBtn = document.getElementById('btn-engage-aperture');
    if (engageBtn) {
      engageBtn.addEventListener('click', () => {
        if (this.gateState === 'ACTIVE' || this.gateState === 'IGNITING') {
          this.disengageAperture();
        } else if (this.gateState === 'LOCKED') {
          this.engageAperture();
        }
      });
    }

    // 4. Containment Iris Toggle Button
    const irisBtn = document.getElementById('btn-iris-toggle');
    if (irisBtn) {
      irisBtn.addEventListener('click', () => {
        this.iris.toggle();
        this.updateIrisUI();
      });
    }

    // 5. Clear & Backspace
    const clearBtn = document.getElementById('btn-buffer-clear');
    if (clearBtn) clearBtn.addEventListener('click', () => this.clearBuffer());

    const bkspBtn = document.getElementById('btn-buffer-bksp');
    if (bkspBtn) bkspBtn.addEventListener('click', () => this.backspaceBuffer());

    const rndBtn = document.getElementById('btn-buffer-random');
    if (rndBtn) {
      rndBtn.addEventListener('click', () => {
        const dest = window.aerisDB.getRandomDestination();
        if (dest) this.loadCoordinates(dest.coords, dest);
      });
    }
  }

  setPower(online) {
    this.powerOnline = online;
    if (window.aerisAudio) window.aerisAudio.playClick(online ? 1600 : 700);

    const powerBtn = document.getElementById('btn-power-toggle');
    const statusBadge = document.getElementById('system-status-badge');

    if (powerBtn) {
      powerBtn.classList.toggle('active', online);
      powerBtn.innerHTML = online
        ? '<span class="status-dot dot-online"></span> POWER ONLINE'
        : '<span class="status-dot dot-offline"></span> INITIALIZE POWER';
    }

    if (statusBadge) {
      statusBadge.textContent = online ? 'SYSTEM ONLINE' : 'STANDBY';
      statusBadge.className = `status-badge ${online ? 'badge-online' : 'badge-idle'}`;
    }

    if (this.ring) this.ring.setPower(online);
    if (window.aerisTelemetry) window.aerisTelemetry.setPower(online);

    if (window.aerisHistory) {
      window.aerisHistory.log('POWER', online ? 'Subspace Power Bus energized (4.2 MW idle feed).' : 'Subspace Power Bus de-energized. Systems cold.');
    }

    if (!online) {
      // Only run the full disengage routine if something was actually in
      // progress; a cold, idle gate should just stay idle without flashing
      // a DISENGAGING badge and logging a phantom bridge collapse.
      if (this.gateState !== 'IDLE') {
        this.disengageAperture();
      } else {
        this.dialSequenceId++;
        this.ring.resetClamps();
      }
    }
  }

  // Automated Stator Clamp Lock Sequence
  startLockSequence(onComplete = null) {
    if (!this.powerOnline || this.dialBuffer.length < 4) return;
    if (this.gateState === 'LOCKING' || this.gateState === 'ACTIVE') return;

    this.gateState = 'LOCKING';
    const seq = ++this.dialSequenceId;
    if (window.aerisTelemetry) window.aerisTelemetry.setGateState('ROTATING');
    this.updateStatusBadge('LOCKING VECTOR...', 'badge-locking');

    // Reset the engage control - it may carry state from a wormhole this
    // sequence just superseded (fast-dial redial skips the idle settle).
    const engageBtnReset = document.getElementById('btn-engage-aperture');
    if (engageBtnReset) {
      engageBtnReset.disabled = true;
      engageBtnReset.classList.remove('ready', 'active-wormhole');
      engageBtnReset.innerHTML = '<span class="engage-icon">⚡</span> ENGAGE APERTURE';
    }

    const totalGlyphs = this.dialBuffer.length;
    let currentStep = 0;

    if (window.aerisHistory) {
      window.aerisHistory.log('LOCK', `Harmonic Vector alignment sequence started. Target glyph count: ${totalGlyphs}.`);
    }

    const processNextGlyph = () => {
      if (seq !== this.dialSequenceId) return; // superseded by a newer sequence
      if (currentStep >= totalGlyphs) {
        // Final lock completed! Capture the destination the lock committed
        // to - the input buffer may be cleared/edited while LOCKED without
        // changing what the stators are actually holding.
        this.lockedDestination = this.targetDestination;
        this.gateState = 'LOCKED';
        if (window.aerisTelemetry) window.aerisTelemetry.setGateState('LOCKED');
        this.updateStatusBadge('VECTOR LOCKED', 'badge-locked');
        
        const engageBtn = document.getElementById('btn-engage-aperture');
        if (engageBtn) {
          engageBtn.disabled = false;
          engageBtn.classList.add('ready');
          engageBtn.innerHTML = '<span class="engage-icon">⚡</span> ENGAGE APERTURE';
        }

        if (window.aerisHistory) {
          window.aerisHistory.log('LOCK', `Vector lock verified on all ${totalGlyphs} harmonic stator nodes. Aperture transit ready.`);
        }

        if (onComplete) onComplete();
        return;
      }

      const glyphId = this.dialBuffer[currentStep];
      const clampIndex = currentStep;

      // 1. Rotate Ring to align glyph
      this.ring.rotateToGlyph(glyphId, () => {
        if (seq !== this.dialSequenceId) return;
        // 2. Lock stator clamp
        this.ring.lockClamp(clampIndex, () => {
          if (seq !== this.dialSequenceId) return;
          currentStep++;
          setTimeout(processNextGlyph, 250);
        });
      });
    };

    processNextGlyph();
  }

  // Engage Aperture Wormhole Transit
  engageAperture() {
    if (this.gateState !== 'LOCKED') return;

    // Containment interlock: no outbound transit through a deployed iris.
    if (this.iris && !this.iris.isOpen()) {
      if (window.aerisAudio) window.aerisAudio.playError();
      if (window.aerisTelemetry) {
        window.aerisTelemetry.showAlert('Ignition interlock: containment iris not fully retracted. Retract iris to permit outbound aperture transit.', 'warn');
      }
      if (window.aerisHistory) {
        window.aerisHistory.log('SHIELD', 'ENGAGE blocked by safety interlock: containment iris deployed during ignition request.');
      }
      return;
    }

    this.gateState = 'IGNITING';
    this.activeDestination = this.lockedDestination || this.targetDestination || { designation: 'CUSTOM-VEC', name: 'Deep Space Coordinate' };
    
    if (window.aerisTelemetry) window.aerisTelemetry.setGateState('IGNITING');
    this.updateStatusBadge('IGNITING APERTURE...', 'badge-igniting');

    // Trigger ring ignition
    this.ring.igniteAperture();

    if (this.starMap) {
      this.starMap.setActiveDestination(this.activeDestination);
    }

    if (window.aerisHistory) {
      window.aerisHistory.log('IGNITE', `Aperture ignited! Establishing superluminal wormhole bridge to [${this.activeDestination.designation}].`);
    }

    setTimeout(() => {
      // Aborted (or powered off) mid-ignition - do not resurrect ACTIVE.
      if (this.gateState !== 'IGNITING') return;
      this.gateState = 'ACTIVE';
      if (window.aerisTelemetry) window.aerisTelemetry.setGateState('ACTIVE');
      this.updateStatusBadge('WORMHOLE ACTIVE', 'badge-active');

      const engageBtn = document.getElementById('btn-engage-aperture');
      if (engageBtn) {
        engageBtn.disabled = false;
        engageBtn.classList.add('active-wormhole');
        engageBtn.innerHTML = '<span class="engage-icon">⏹</span> ABORT / DISENGAGE';
      }

      if (window.aerisTelemetry) {
        window.aerisTelemetry.showAlert(`Superluminal wormhole bridge active to ${this.activeDestination.designation}. Stability 99.9%.`, 'info');
      }
    }, 1100);
  }

  // Disengage Aperture
  disengageAperture() {
    this.dialSequenceId++; // cancel any in-flight lock sequence
    this.gateState = 'DISENGAGING';
    if (window.aerisTelemetry) window.aerisTelemetry.setGateState('DISENGAGING');
    this.updateStatusBadge('DISENGAGING...', 'badge-idle');

    this.ring.disengage();
    if (this.starMap) {
      this.starMap.setActiveDestination(null);
    }

    if (window.aerisHistory) {
      window.aerisHistory.log('DISENGAGE', 'Subspace bridge collapsed. Harmonic stator clamps disengaged.');
    }

    setTimeout(() => {
      // A newer sequence (fast-dial redial) may already own the gate.
      if (this.gateState !== 'DISENGAGING') return;
      this.gateState = 'IDLE';
      this.activeDestination = null;
      this.lockedDestination = null;
      if (window.aerisTelemetry) window.aerisTelemetry.setGateState('IDLE');
      this.updateStatusBadge(this.powerOnline ? 'SYSTEM ONLINE' : 'STANDBY', this.powerOnline ? 'badge-online' : 'badge-idle');

      const engageBtn = document.getElementById('btn-engage-aperture');
      if (engageBtn) {
        engageBtn.disabled = true;
        engageBtn.classList.remove('ready', 'active-wormhole');
        engageBtn.innerHTML = '<span class="engage-icon">⚡</span> ENGAGE APERTURE';
      }
    }, 700);
  }

  // Fast-Dial EAFP Protocol Execution
  executeFastDial(destination) {
    if (!destination) return;
    if (this.gateState === 'LOCKING' || this.gateState === 'ACTIVE' || this.gateState === 'IGNITING') {
      this.disengageAperture();
    }

    if (window.aerisAudio) window.aerisAudio.playClick(1800);
    if (!this.powerOnline) this.setPower(true);

    this.loadCoordinates(destination.coords, destination);
    
    if (window.aerisTelemetry) {
      window.aerisTelemetry.showAlert(`EAFP Fast-Lock protocol initiated for ${destination.designation}.`, 'info');
    }

    if (window.aerisHistory) {
      window.aerisHistory.log('SYSTEM', `Emergency Automated Fast-Lock Protocol (EAFP) triggered for [${destination.designation}].`);
    }

    // Auto-start lock and engage sequence
    setTimeout(() => {
      this.startLockSequence(() => {
        // Auto engage once locked
        setTimeout(() => {
          this.engageAperture();
        }, 300);
      });
    }, 350);
  }

  renderPresets() {
    const container = document.getElementById('presets-bar');
    if (!container || !window.aerisDB) return;

    const presets = window.aerisDB.getPresets();
    container.innerHTML = presets.map(p => `
      <button class="preset-btn" data-preset-id="${p.id}" title="EAFP Quick Dial: ${p.name}">
        <span class="preset-slot">0${p.presetSlot}</span>
        <span class="preset-name">${p.designation}</span>
      </button>
    `).join('');

    container.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const dest = presets.find(p => p.id === btn.dataset.presetId);
        if (dest) this.executeFastDial(dest);
      });
    });
  }

  updateIrisUI() {
    const irisBtn = document.getElementById('btn-iris-toggle');
    const irisStatus = document.getElementById('iris-status-val');
    // Drive the UI from the commanded direction, not from openProgress -
    // at click time the blades have not moved yet, so reading progress here
    // showed the pre-click state (inverted labels) for the whole stroke.
    const state = this.iris.state; // 'OPEN' | 'CLOSING' | 'SEALED' | 'OPENING'
    const sealing = state === 'CLOSING' || state === 'SEALED';

    if (irisBtn) {
      irisBtn.classList.toggle('shield-active', sealing);
      irisBtn.innerHTML = sealing
        ? '<span class="shield-icon">🛡️</span> RETRACT IRIS'
        : '<span class="shield-icon">🛡️</span> SEAL IRIS';
    }

    if (irisStatus) {
      const labels = {
        OPEN: 'OPEN / RETRACTED',
        OPENING: 'RETRACTING...',
        CLOSING: 'SEALING...',
        SEALED: 'SEALED (TITANIUM ARMORED)'
      };
      irisStatus.textContent = labels[state] || state;
      irisStatus.style.color = sealing ? '#ff4b72' : '#38bdf8';
    }
  }

  updateStatusBadge(text, className) {
    const badge = document.getElementById('system-status-badge');
    if (badge) {
      badge.textContent = text;
      badge.className = `status-badge ${className}`;
    }
  }

  // --- SECONDARY PANELS & NAVIGATION ---
  bindNavigation() {
    const tabs = document.querySelectorAll('.nav-tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        this.switchTab(target);
      });
    });
  }

  switchTab(tabId) {
    this.activeTab = tabId;
    if (window.aerisAudio) window.aerisAudio.playClick(1200);

    // Update active tab button
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    // Show/Hide views
    const mainConsole = document.getElementById('main-gate-console');
    const panels = document.querySelectorAll('.sub-panel-view');

    if (tabId === 'GATE') {
      if (mainConsole) mainConsole.classList.remove('hidden');
      panels.forEach(p => p.classList.add('hidden'));
    } else {
      if (mainConsole) mainConsole.classList.add('hidden');
      panels.forEach(p => {
        p.classList.toggle('hidden', p.id !== `panel-${tabId.toLowerCase()}`);
      });

      if (tabId === 'STARMAP' && !this.starMap) {
        this.starMap = new AerisStarMap('starmap-canvas');
        // Seed the lazily-created map with any wormhole that is already up,
        // otherwise its live transit conduit beam never appears.
        if (this.activeDestination && (this.gateState === 'ACTIVE' || this.gateState === 'IGNITING')) {
          this.starMap.setActiveDestination(this.activeDestination);
        }
      }
    }
  }

  renderDatabaseList(query = '', sector = 'ALL', threat = 'ALL') {
    const listEl = document.getElementById('db-destinations-list');
    if (!listEl || !window.aerisDB) return;

    const results = window.aerisDB.searchDestinations(query, sector, threat);
    document.getElementById('db-results-count').textContent = `${results.length} DESTINATIONS FOUND`;

    listEl.innerHTML = results.map(dest => {
      const glyphsHtml = dest.coords.map(gId => {
        const g = window.aerisDB.getGlyph(gId);
        return `<span class="db-glyph-badge" title="${g ? g.name : ''}">${g ? g.code : ''}</span>`;
      }).join('');

      return `
        <div class="db-card" data-dest-id="${dest.id}">
          <div class="db-card-header">
            <div>
              <span class="db-desig">${dest.designation}</span>
              <h3 class="db-name">${dest.name}</h3>
            </div>
            <span class="db-threat-badge" style="color: ${dest.threatColor}; border-color: ${dest.threatColor}; background: ${dest.threatColor}18;">
              ${dest.threatLevel}
            </span>
          </div>

          <div class="db-card-body">
            <div class="db-field"><strong>Sector:</strong> ${dest.sector} · ${dest.distanceLY} LY</div>
            <div class="db-field"><strong>Environment:</strong> ${dest.environment}</div>
            <div class="db-field"><strong>Carrier Freq:</strong> ${dest.carrierFreq} | <strong>Stability:</strong> ${dest.stability}</div>
            <div class="db-field db-notes"><em>${dest.notes}</em></div>
            <div class="db-glyphs-row">${glyphsHtml}</div>
          </div>

          <div class="db-card-actions">
            <button class="btn-db-load" data-id="${dest.id}">LOAD COORDINATES</button>
            <button class="btn-db-fast" data-id="${dest.id}">⚡ FAST ENGAGE</button>
          </div>
        </div>
      `;
    }).join('');

    // Bind card buttons
    listEl.querySelectorAll('.btn-db-load').forEach(btn => {
      btn.addEventListener('click', () => {
        const dest = results.find(d => d.id === btn.dataset.id);
        if (dest) {
          this.loadCoordinates(dest.coords, dest);
          this.switchTab('GATE');
        }
      });
    });

    listEl.querySelectorAll('.btn-db-fast').forEach(btn => {
      btn.addEventListener('click', () => {
        const dest = results.find(d => d.id === btn.dataset.id);
        if (dest) {
          this.switchTab('GATE');
          this.executeFastDial(dest);
        }
      });
    });
  }

  // --- MODALS & OPERATOR REFERENCE ---
  bindModals() {
    // 1. Operator Reference Modal (?)
    const helpBtn = document.getElementById('btn-help-ref');
    const helpModal = document.getElementById('modal-operator-ref');
    const closeHelpBtn = document.getElementById('btn-close-help');

    if (helpBtn && helpModal) {
      helpBtn.addEventListener('click', () => {
        helpModal.classList.remove('hidden');
        if (window.aerisAudio) window.aerisAudio.playClick(1400);
      });
    }

    if (closeHelpBtn && helpModal) {
      closeHelpBtn.addEventListener('click', () => {
        helpModal.classList.add('hidden');
        if (window.aerisAudio) window.aerisAudio.playClick(900);
      });
    }

    // Close modal on click outside content
    if (helpModal) {
      helpModal.addEventListener('click', (e) => {
        if (e.target === helpModal) {
          helpModal.classList.add('hidden');
        }
      });
    }

    // Database Filters
    const dbSearch = document.getElementById('db-search-input');
    const dbSector = document.getElementById('db-sector-select');
    const dbThreat = document.getElementById('db-threat-select');

    const updateDB = () => {
      this.renderDatabaseList(
        dbSearch ? dbSearch.value : '',
        dbSector ? dbSector.value : 'ALL',
        dbThreat ? dbThreat.value : 'ALL'
      );
    };

    if (dbSearch) dbSearch.addEventListener('input', updateDB);
    if (dbSector) dbSector.addEventListener('change', updateDB);
    if (dbThreat) dbThreat.addEventListener('change', updateDB);

    // StarMap Card Actions
    const smLoadBtn = document.getElementById('btn-starmap-load');
    const smFastBtn = document.getElementById('btn-starmap-fast');
    if (smLoadBtn) {
      smLoadBtn.addEventListener('click', () => {
        if (this.starMap && this.starMap.selectedDest) {
          this.loadCoordinates(this.starMap.selectedDest.coords, this.starMap.selectedDest);
          this.switchTab('GATE');
        }
      });
    }
    if (smFastBtn) {
      smFastBtn.addEventListener('click', () => {
        if (this.starMap && this.starMap.selectedDest) {
          this.switchTab('GATE');
          this.executeFastDial(this.starMap.selectedDest);
        }
      });
    }

    // History Log Filter Buttons
    document.querySelectorAll('.btn-log-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.btn-log-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (window.aerisHistory) {
          window.aerisHistory.setFilter(btn.dataset.filter);
        }
      });
    });

    const exportBtn = document.getElementById('btn-export-log');
    if (exportBtn) exportBtn.addEventListener('click', () => window.aerisHistory && window.aerisHistory.exportLog());

    const clearLogBtn = document.getElementById('btn-clear-log');
    if (clearLogBtn) clearLogBtn.addEventListener('click', () => window.aerisHistory && window.aerisHistory.clear());
  }

  // --- SETTINGS PANEL ---
  bindSettings() {
    const audioToggle = document.getElementById('setting-audio-toggle');
    const volumeSlider = document.getElementById('setting-master-volume');
    const crtToggle = document.getElementById('setting-crt-toggle');
    const motionToggle = document.getElementById('setting-motion-toggle');

    if (audioToggle) {
      audioToggle.addEventListener('change', (e) => {
        if (window.aerisAudio) window.aerisAudio.setEnabled(e.target.checked);
      });
    }

    if (volumeSlider) {
      volumeSlider.addEventListener('input', (e) => {
        if (window.aerisAudio) window.aerisAudio.setMasterVolume(parseFloat(e.target.value));
      });
    }

    if (crtToggle) {
      crtToggle.addEventListener('change', (e) => {
        document.body.classList.toggle('crt-scanlines', e.target.checked);
      });
    }

    if (motionToggle) {
      motionToggle.addEventListener('change', (e) => {
        document.body.classList.toggle('reduced-motion', e.target.checked);
      });
    }
  }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.aerisApp = new AerisApplication();
  window.aerisApp.init();
});
