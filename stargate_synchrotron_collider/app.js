/**
 * Aethel-Ring Collider (ARC) Main Application Controller
 * Handles lattice vector steering, beam injection activation, disengage abort,
 * safety quench interlock, telemetry updates, and modal panels.
 */

class SynchrotronApp {
  constructor() {
    this.selectedSector = null; // 0 to 15
    this.lockedSectors = []; // array of 1-based sector numbers (1-16)
    this.state = 'STANDBY'; // 'STANDBY', 'ARMED', 'ACTIVATING', 'ACTIVE_COLLISION', 'QUENCH_TRIPPED', 'BEAM_DUMPED'
    this.currentTarget = null;
    this.quenchInterlockActive = false; // MUST DEFAULT TO RELEASED (false)

    // Telemetry base values
    this.telemetry = {
      energyTeV: 0.45,
      luminosity: 0.12e34,
      cryoTempK: 1.86,
      vacuumMbar: 1.1e-10,
      magnetCurrentKA: 1.20,
      rfPhaseDeg: 0
    };

    // Event History
    this.eventLogs = [
      { time: "2026-08-14 18:42:10 UTC", type: "COLLISION", desc: "Alpha Centauri Resonance run completed. 3.85 TeV @ 1.25e34 luminosity." },
      { time: "2026-08-14 06:15:33 UTC", type: "DUMP", desc: "Routine beam abort / lattice reset executed by operator." },
      { time: "2026-08-13 11:05:32 UTC", type: "COLLISION", desc: "Proxima D Bipolar Focus run completed. 4.10 TeV @ 1.48e34 luminosity." }
    ];

    // Canvas References
    this.physicsCanvas = null;
    this.tunnelCanvas = null;

    // DOM Elements
    this.initDOMElements();
    this.initScaleHandler();
    this.initSectorGrid();
    this.initQuickDialPresets();
    this.initEventListeners();
    this.initModals();
    this.initTelemetryTicker();

    // Canvas init
    this.physicsCanvas = new SynchrotronPhysicsCanvas('synchrotron-canvas');
    this.tunnelCanvas = new SynopticTunnelCanvas('synoptic-canvas');

    // Initial state update
    this.updateUIState();
  }

  initDOMElements() {
    this.el = {
      appScaler: document.getElementById('app-scaler'),
      sectorGrid: document.getElementById('sector-selector-grid'),
      addressSlotsContainer: document.getElementById('address-slots-container'),
      slotsCountLabel: document.getElementById('slots-count-label'),
      btnEngageSector: document.getElementById('btn-engage-sector'),
      btnClearLattice: document.getElementById('btn-clear-lattice'),
      btnStepBack: document.getElementById('btn-step-back'),
      btnTriggerCollision: document.getElementById('btn-trigger-collision'),
      triggerSubtext: document.getElementById('trigger-subtext'),
      btnBeamDump: document.getElementById('btn-beam-dump'),
      quenchInterlockToggle: document.getElementById('quench-interlock-toggle'),
      interlockStatusLabel: document.getElementById('interlock-status-label'),
      quenchTripBanner: document.getElementById('quench-trip-banner'),
      statusDot: document.getElementById('status-dot'),
      monitorStateText: document.getElementById('monitor-state-text'),
      monitorRfLock: document.getElementById('monitor-rf-lock'),
      monitorMagnetCurrent: document.getElementById('monitor-magnet-current'),
      quickDialContainer: document.getElementById('quick-dial-container'),
      
      // Header telemetry
      telHeaderState: document.getElementById('tel-header-state'),
      telHeaderEnergy: document.getElementById('tel-header-energy'),
      telHeaderLumi: document.getElementById('tel-header-lumi'),
      telHeaderTemp: document.getElementById('tel-header-temp'),
      telHeaderVac: document.getElementById('tel-header-vac'),

      // Operator Ref & Corner
      operatorRefBtn: document.getElementById('operator-ref-btn'),
      eventLogContainer: document.getElementById('event-log-container')
    };
  }

  // --- 1. DYNAMIC CSS SCALE HANDLER (Avoids calc() unitless bug) ---
  initScaleHandler() {
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const scaleX = w / 1920;
      const scaleY = h / 1080;
      const scale = Math.min(scaleX, scaleY);
      
      // Set unitless scale number directly on CSS variable
      document.documentElement.style.setProperty('--ui-scale', scale);
      
      if (this.physicsCanvas) this.physicsCanvas.resize();
      if (this.tunnelCanvas) this.tunnelCanvas.resize();
    };

    window.addEventListener('resize', handleResize);
    handleResize();
  }

  // --- 2. SECTOR SELECTOR GRID (16 Superconducting Sector Cells) ---
  initSectorGrid() {
    this.el.sectorGrid.innerHTML = '';
    for (let i = 1; i <= 16; i++) {
      const btn = document.createElement('button');
      btn.className = 'sector-dial-btn';
      btn.id = `sec-btn-${i}`;
      btn.dataset.sector = i;
      btn.innerHTML = `<span>S-${String(i).padStart(2, '0')}</span>`;
      
      btn.addEventListener('click', () => {
        synchrotronAudio.playUiClick();
        this.selectSector(i);
      });

      this.el.sectorGrid.appendChild(btn);
    }
  }

  selectSector(secNum) {
    if (this.lockedSectors.length >= 6) return;
    if (this.lockedSectors.includes(secNum)) return; // already locked

    this.selectedSector = secNum;
    if (this.physicsCanvas) {
      this.physicsCanvas.activeSectorHover = secNum - 1;
    }

    // Update buttons
    const allBtns = this.el.sectorGrid.querySelectorAll('.sector-dial-btn');
    allBtns.forEach(b => {
      const bSec = parseInt(b.dataset.sector);
      if (bSec === secNum) {
        b.classList.add('selected');
      } else {
        b.classList.remove('selected');
      }
    });

    this.el.btnEngageSector.disabled = false;
    this.el.btnEngageSector.innerHTML = `<span>⚡</span> ENGAGE SECTOR DIPOLE S-${String(secNum).padStart(2, '0')}`;
  }

  engageSelectedSector() {
    if (this.selectedSector === null || this.lockedSectors.length >= 6) return;
    
    const secNum = this.selectedSector;
    this.lockedSectors.push(secNum);
    
    // Audio feedback
    synchrotronAudio.playSectorLock(secNum - 1, this.lockedSectors.length);
    synchrotronAudio.setDetectorClickRate(4 + this.lockedSectors.length * 8);
    synchrotronAudio.updateCoilIntensity(this.lockedSectors.length / 6, this.lockedSectors.length);

    this.selectedSector = null;
    this.el.btnEngageSector.disabled = true;
    this.el.btnEngageSector.innerHTML = `<span>⚡</span> ENGAGE SECTOR DIPOLE`;

    if (this.physicsCanvas) {
      this.physicsCanvas.activeSectorHover = -1;
      this.physicsCanvas.setLockedSectors(this.lockedSectors.map(s => s - 1));
    }

    // Check if 6 sectors reached
    if (this.lockedSectors.length === 6) {
      // Transition to ARMED state (NEVER AUTO-FIRES)
      this.setState('ARMED');
    } else {
      this.setState('STANDBY');
    }

    this.updateUIState();
  }

  stepBackSector() {
    if (this.lockedSectors.length === 0) return;
    synchrotronAudio.playUiClick();
    this.lockedSectors.pop();
    this.selectedSector = null;

    if (this.physicsCanvas) {
      this.physicsCanvas.setLockedSectors(this.lockedSectors.map(s => s - 1));
    }
    
    this.setState('STANDBY');
    this.updateUIState();
  }

  clearLattice() {
    synchrotronAudio.playUiClick();
    this.lockedSectors = [];
    this.selectedSector = null;
    this.currentTarget = null;

    if (this.physicsCanvas) {
      this.physicsCanvas.setLockedSectors([]);
      this.physicsCanvas.setState('STANDBY');
    }

    this.setState('STANDBY');
    this.updateUIState();
  }

  // --- 3. QUICK-DIAL PRESETS (Curated 6 targets across 2+ tiers) ---
  initQuickDialPresets() {
    const quickTargets = collisionRegistry.getQuickDialTargets();
    this.el.quickDialContainer.innerHTML = '';

    quickTargets.forEach(tgt => {
      const btn = document.createElement('button');
      btn.className = 'quick-dial-btn';
      btn.innerHTML = `<span style="color:var(--neon-cyan); font-weight:bold;">[${tgt.tier.split(':')[0]}]</span> ${tgt.designation.substring(0, 18)}`;
      btn.title = `${tgt.designation} (${tgt.beamEnergyTeV} TeV) - [${tgt.coordinates.map(c => 'S-' + String(c).padStart(2, '0')).join(', ')}]`;
      
      btn.addEventListener('click', () => {
        this.loadTargetCoordinates(tgt);
      });

      this.el.quickDialContainer.appendChild(btn);
    });
  }

  loadTargetCoordinates(target) {
    synchrotronAudio.playUiClick();
    this.currentTarget = target;
    this.lockedSectors = [...target.coordinates];
    this.selectedSector = null;

    if (this.physicsCanvas) {
      this.physicsCanvas.setLockedSectors(this.lockedSectors.map(s => s - 1));
      this.physicsCanvas.setState('ARMED', target);
    }

    synchrotronAudio.updateCoilIntensity(1.0, 6);
    synchrotronAudio.setDetectorClickRate(35);

    // CRITICAL: Transitions to ARMED, NEVER AUTO-FIRES!
    this.setState('ARMED');
    this.updateUIState();
  }

  // --- 4. BEAM COLLISION ACTIVATION (Explicit trigger required) ---
  triggerCollisionActivation() {
    if (this.lockedSectors.length < 6) return;

    // Safety Quench Interlock Check
    if (this.quenchInterlockActive) {
      synchrotronAudio.playQuenchAlarm();
      this.el.quenchTripBanner.style.display = 'block';
      this.setState('QUENCH_TRIPPED');

      this.addEventLog('TRIP', `Quench Protection Interlock triggered. Beam injection aborted.`);
      return;
    }

    // Hide quench banner if open
    this.el.quenchTripBanner.style.display = 'none';

    // Start Activation Sequence
    this.setState('ACTIVATING');
    synchrotronAudio.playBeamInjection();

    if (this.physicsCanvas) {
      this.physicsCanvas.setState('ACTIVATING', this.currentTarget);
    }

    // Collision Apex after RF chirp sweep (1.2s)
    setTimeout(() => {
      if (this.state !== 'ACTIVATING') return; // aborted during ramp

      this.setState('ACTIVE_COLLISION');
      synchrotronAudio.playCollisionEvent();
      synchrotronAudio.setDetectorClickRate(70);

      if (this.physicsCanvas) {
        this.physicsCanvas.setState('ACTIVE_COLLISION', this.currentTarget);
      }

      const tgtName = this.currentTarget ? this.currentTarget.designation : `SECTOR VECTOR [${this.lockedSectors.join('-')}]`;
      const energy = this.currentTarget ? this.currentTarget.beamEnergyTeV : 7.25;
      this.addEventLog('COLLISION', `Collision vertex established with ${tgtName}. Beam energy: ${energy} TeV.`);
    }, 1200);
  }

  // --- 5. BEAM DUMP / ABORT (Disengage) ---
  triggerBeamDump() {
    synchrotronAudio.playBeamDump();
    synchrotronAudio.setDetectorClickRate(3);
    synchrotronAudio.updateCoilIntensity(0, 0);

    this.el.quenchTripBanner.style.display = 'none';
    this.lockedSectors = [];
    this.selectedSector = null;
    this.currentTarget = null;

    if (this.physicsCanvas) {
      this.physicsCanvas.setState('BEAM_DUMPED');
      this.physicsCanvas.setLockedSectors([]);
    }

    this.setState('STANDBY');
    this.addEventLog('DUMP', 'Emergency Beam Abort executed. Relativistic bunches dumped to graphite absorber.');
    this.updateUIState();
  }

  // --- 6. STATE & UI REFRESH ---
  setState(newState) {
    this.state = newState;
    if (this.physicsCanvas && newState !== 'ACTIVATING' && newState !== 'ACTIVE_COLLISION') {
      this.physicsCanvas.setState(newState, this.currentTarget);
    }
    this.updateUIState();
  }

  updateUIState() {
    // 1. Update Address Slots
    const slots = this.el.addressSlotsContainer.querySelectorAll('.address-slot');
    slots.forEach((slot, idx) => {
      const lockedVal = this.lockedSectors[idx];
      if (lockedVal !== undefined) {
        slot.textContent = `S-${String(lockedVal).padStart(2, '0')}`;
        slot.className = 'address-slot filled';
      } else if (idx === this.lockedSectors.length) {
        slot.textContent = '--';
        slot.className = 'address-slot next-target';
      } else {
        slot.textContent = '--';
        slot.className = 'address-slot';
      }
    });

    this.el.slotsCountLabel.textContent = `${this.lockedSectors.length} / 6 LOCKED`;

    // 2. Update Sector Buttons in Cluster 1
    const allBtns = this.el.sectorGrid.querySelectorAll('.sector-dial-btn');
    allBtns.forEach(b => {
      const bSec = parseInt(b.dataset.sector);
      if (this.lockedSectors.includes(bSec)) {
        b.className = 'sector-dial-btn locked';
        b.disabled = true;
      } else if (this.selectedSector === bSec) {
        b.className = 'sector-dial-btn selected';
        b.disabled = false;
      } else {
        b.className = 'sector-dial-btn';
        b.disabled = (this.lockedSectors.length >= 6) || (this.state === 'ACTIVATING' || this.state === 'ACTIVE_COLLISION');
      }
    });

    // 3. Update Cluster 2 Status & Trigger Button
    const triggerBtn = this.el.btnTriggerCollision;
    const isArmed = (this.lockedSectors.length === 6);

    if (this.state === 'ACTIVE_COLLISION') {
      this.el.statusDot.className = 'status-indicator-dot active';
      this.el.monitorStateText.textContent = 'COLLISION IN PROGRESS';
      this.el.monitorStateText.style.color = 'var(--neon-green)';
      this.el.telHeaderState.textContent = 'ACTIVE COLLISION';
      this.el.telHeaderState.style.color = 'var(--neon-green)';
      
      triggerBtn.disabled = true;
      triggerBtn.className = 'trigger-collision-btn';
      this.el.triggerSubtext.textContent = 'TOPOLOGICAL INVERSION PORTAL OPEN';
      this.el.monitorRfLock.textContent = 'COLLISION LOCK (360°)';
    } else if (this.state === 'ACTIVATING') {
      this.el.statusDot.className = 'status-indicator-dot armed';
      this.el.monitorStateText.textContent = 'INJECTING BEAMS...';
      this.el.monitorStateText.style.color = 'var(--neon-amber)';
      this.el.telHeaderState.textContent = 'BEAM INJECTION';
      this.el.telHeaderState.style.color = 'var(--neon-amber)';

      triggerBtn.disabled = true;
      triggerBtn.className = 'trigger-collision-btn';
      this.el.triggerSubtext.textContent = 'RAMPING CAVITY GRADIENT...';
      this.el.monitorRfLock.textContent = 'RAMPING (180°)';
    } else if (this.state === 'ARMED' || (isArmed && this.state !== 'QUENCH_TRIPPED')) {
      this.el.statusDot.className = 'status-indicator-dot armed';
      this.el.monitorStateText.textContent = 'COLLISION ARMED';
      this.el.monitorStateText.style.color = 'var(--neon-amber)';
      this.el.telHeaderState.textContent = 'COLLISION ARMED';
      this.el.telHeaderState.style.color = 'var(--neon-amber)';

      triggerBtn.disabled = false;
      triggerBtn.className = 'trigger-collision-btn armed-state';
      this.el.triggerSubtext.textContent = 'READY // CLICK TO TRIGGER COLLISION';
      this.el.monitorRfLock.textContent = 'PHASE SYNCHRONIZED (120°)';
    } else if (this.state === 'QUENCH_TRIPPED') {
      this.el.statusDot.className = 'status-indicator-dot quenched';
      this.el.monitorStateText.textContent = 'QUENCH INTERLOCK TRIP';
      this.el.monitorStateText.style.color = 'var(--neon-crimson)';
      this.el.telHeaderState.textContent = 'QUENCH TRIP';
      this.el.telHeaderState.style.color = 'var(--neon-crimson)';

      triggerBtn.disabled = true;
      triggerBtn.className = 'trigger-collision-btn';
      this.el.triggerSubtext.textContent = 'RELEASE QUENCH INTERLOCK TO RESUME';
      this.el.monitorRfLock.textContent = 'INHIBITED (0°)';
    } else {
      this.el.statusDot.className = 'status-indicator-dot standby';
      this.el.monitorStateText.textContent = 'STANDBY';
      this.el.monitorStateText.style.color = 'var(--neon-cyan)';
      this.el.telHeaderState.textContent = 'STANDBY';
      this.el.telHeaderState.style.color = 'var(--neon-amber)';

      triggerBtn.disabled = true;
      triggerBtn.className = 'trigger-collision-btn';
      this.el.triggerSubtext.textContent = `AWAITING 6-SECTOR LATTICE LOCK (${this.lockedSectors.length}/6)`;
      this.el.monitorRfLock.textContent = 'STANDBY (0°)';
    }

    // Magnet Current Readout
    const magnetCurrent = 1.20 + (this.lockedSectors.length / 6) * 11.60;
    this.el.monitorMagnetCurrent.textContent = `${magnetCurrent.toFixed(2)} kA`;
  }

  // --- 7. EVENT LISTENERS ---
  initEventListeners() {
    this.el.btnEngageSector.addEventListener('click', () => this.engageSelectedSector());
    this.el.btnClearLattice.addEventListener('click', () => this.clearLattice());
    this.el.btnStepBack.addEventListener('click', () => this.stepBackSector());
    this.el.btnTriggerCollision.addEventListener('click', () => this.triggerCollisionActivation());
    this.el.btnBeamDump.addEventListener('click', () => this.triggerBeamDump());

    // Safety Quench Interlock Toggle
    this.el.quenchInterlockToggle.addEventListener('change', (e) => {
      synchrotronAudio.playUiClick();
      this.quenchInterlockActive = e.target.checked;
      
      if (this.quenchInterlockActive) {
        this.el.interlockStatusLabel.textContent = 'STATUS: ENGAGED (INJECTION BLOCKED)';
        this.el.interlockStatusLabel.style.color = 'var(--neon-crimson)';
      } else {
        this.el.interlockStatusLabel.textContent = 'STATUS: RELEASED (READY FOR INJECTION)';
        this.el.interlockStatusLabel.style.color = 'var(--text-dim)';
        this.el.quenchTripBanner.style.display = 'none';
        if (this.state === 'QUENCH_TRIPPED') {
          this.setState(this.lockedSectors.length === 6 ? 'ARMED' : 'STANDBY');
        }
      }
    });

    // Operator Reference Guide Button
    this.el.operatorRefBtn.addEventListener('click', () => {
      synchrotronAudio.playUiClick();
      this.openModal('modal-operator-guide');
    });

    // Header Secondary Navigation Tabs
    document.getElementById('btn-nav-registry').addEventListener('click', () => {
      synchrotronAudio.playUiClick();
      this.renderRegistryTable();
      this.openModal('modal-registry');
    });

    document.getElementById('btn-nav-schematic').addEventListener('click', () => {
      synchrotronAudio.playUiClick();
      this.openModal('modal-schematic');
      if (this.tunnelCanvas) this.tunnelCanvas.resize();
    });

    document.getElementById('btn-nav-history').addEventListener('click', () => {
      synchrotronAudio.playUiClick();
      this.renderEventLogs();
      this.openModal('modal-history');
    });

    document.getElementById('btn-nav-settings').addEventListener('click', () => {
      synchrotronAudio.playUiClick();
      this.openModal('modal-settings');
    });
  }

  // --- 8. MODAL CONTROLLERS & REGISTRY VIEW ---
  initModals() {
    // Close buttons
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        synchrotronAudio.playUiClick();
        const targetId = btn.dataset.close;
        this.closeModal(targetId);
      });
    });

    // Click outside modal window to close
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          synchrotronAudio.playUiClick();
          overlay.classList.remove('open');
        }
      });
    });

    // Registry Search & Filters
    const searchInput = document.getElementById('registry-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        collisionRegistry.searchQuery = e.target.value;
        this.renderRegistryTable();
      });
    }

    document.querySelectorAll('.filter-btn').forEach(fBtn => {
      fBtn.addEventListener('click', () => {
        synchrotronAudio.playUiClick();
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        fBtn.classList.add('active');
        collisionRegistry.activeFilter = fBtn.dataset.filter;
        this.renderRegistryTable();
      });
    });

    // Settings
    const volSlider = document.getElementById('setting-master-vol');
    if (volSlider) {
      volSlider.addEventListener('input', (e) => {
        synchrotronAudio.setVolume(parseFloat(e.target.value));
      });
    }

    const muteBtn = document.getElementById('btn-toggle-audio-mute');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        const isMuted = synchrotronAudio.toggleMute();
        muteBtn.textContent = isMuted ? 'AUDIO MUTED' : 'AUDIO ACTIVE (UNMUTED)';
      });
    }
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('open');
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('open');
  }

  renderRegistryTable() {
    const tbody = document.getElementById('registry-table-body');
    if (!tbody) return;

    const filtered = collisionRegistry.getFilteredTargets();
    tbody.innerHTML = '';

    filtered.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div style="font-weight:bold; color:var(--neon-cyan);">${item.designation}</div>
          <div style="color:var(--text-dim); font-size:9px;">${item.id}</div>
        </td>
        <td><span class="cluster-tag">${item.tier}</span></td>
        <td><code>[${item.coordinates.map(c => 'S-' + String(c).padStart(2, '0')).join(', ')}]</code></td>
        <td>${item.beamEnergyTeV.toFixed(2)} TeV</td>
        <td>${item.magneticFieldTesla.toFixed(2)} T</td>
        <td><span style="color:var(--neon-green);">${item.stabilityRating}%</span></td>
        <td>
          <button class="table-action-btn" data-target-id="${item.id}">LOAD TO LATTICE</button>
        </td>
      `;

      const loadBtn = tr.querySelector('.table-action-btn');
      loadBtn.addEventListener('click', () => {
        this.loadTargetCoordinates(item);
        this.closeModal('modal-registry');
      });

      tbody.appendChild(tr);
    });
  }

  addEventLog(type, desc) {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    this.eventLogs.unshift({ time: now, type, desc });
    if (this.eventLogs.length > 30) this.eventLogs.pop();
  }

  renderEventLogs() {
    if (!this.el.eventLogContainer) return;
    this.el.eventLogContainer.innerHTML = '';
    this.eventLogs.forEach(log => {
      const div = document.createElement('div');
      div.className = `log-entry ${log.type.toLowerCase()}`;
      div.innerHTML = `
        <div>
          <span style="color:var(--neon-cyan); font-weight:bold;">[${log.type}]</span> ${log.desc}
        </div>
        <div style="color:var(--text-dim); font-size:10px; min-width:140px; text-align:right;">${log.time}</div>
      `;
      this.el.eventLogContainer.appendChild(div);
    });
  }

  // --- 9. LIVE TELEMETRY TICKER ---
  initTelemetryTicker() {
    setInterval(() => {
      // Dynamic live micro-fluctuations in telemetry
      const noise = (Math.random() - 0.5) * 0.02;
      let energy = this.physicsCanvas ? this.physicsCanvas.beamEnergy : 0.45;
      let lumi = this.physicsCanvas ? this.physicsCanvas.beamLuminosity : 0.12e34;
      
      let temp = 1.85 + (Math.random() * 0.02) + (this.state === 'ACTIVE_COLLISION' ? 0.06 : 0);
      let vac = (1.1 + noise * 0.5).toFixed(2);

      this.el.telHeaderEnergy.textContent = `${energy.toFixed(2)} TeV`;
      this.el.telHeaderLumi.textContent = `${(lumi / 1e34).toFixed(2)}×10³⁴`;
      this.el.telHeaderTemp.textContent = `${temp.toFixed(2)} K`;
      this.el.telHeaderVac.textContent = `${vac}×10⁻¹⁰ mbar`;
    }, 400);
  }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.arcApp = new SynchrotronApp();
});
