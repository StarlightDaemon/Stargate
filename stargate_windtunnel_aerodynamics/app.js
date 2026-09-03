// ============================================================================
// Aeolos Stagnation Plenum (ASP-9) — Central Control Room Orchestrator
// Coordinates Vane Steering, Locking Mechanics, 3-Stage Activation & Telemetry
// ============================================================================

import { AERODYNAMIC_SECTORS, TEST_RUN_PROFILES } from './registry.js';
import { audio } from './audio.js';
import { WindTunnelRenderer } from './windtunnel.js';

class StargateWindTunnelApp {
  constructor() {
    this.appState = 'STANDBY'; // 'STANDBY', 'ARMED', 'BUILDUP', 'BREAKTHROUGH', 'ACTIVE'
    this.selectedSector = AERODYNAMIC_SECTORS[0];
    this.lockedSectors = [];
    this.interlockEngaged = false; // Default: RELEASED
    this.autoDialTimer = null;
    this.activationTimers = [];

    // Telemetry values
    this.currentMach = 0.05;
    this.stagnationP0 = 101.3;
    this.dynamicHeadQ = 1.2;
    this.reynoldsRe = 1.4;

    // DOM Elements
    this.scaler = document.getElementById('app-scaler');
    this.canvas = document.getElementById('windtunnel-canvas');
    this.renderer = new WindTunnelRenderer(this.canvas, AERODYNAMIC_SECTORS);

    this.initScaler();
    this.bindDomElements();
    this.buildManometerBank();
    this.buildSectorMatrix();
    this.buildRakeProfile();
    this.buildPresetDropdown();
    this.setupEventListeners();

    // Initial render update
    this.updateSelectedSector(AERODYNAMIC_SECTORS[0], false);
    this.updateLockStrip();
    this.updateRunMasterControls();

    // Start simulation / telemetry animation loop
    this.lastTime = performance.now();
    this.animLoop = this.animLoop.bind(this);
    requestAnimationFrame(this.animLoop);
  }

  // Robust Unitless Viewport Scaling (No CSS calc division bugs!)
  initScaler() {
    const applyScale = () => {
      const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
      const scaleStr = scale.toFixed(4);
      document.documentElement.style.setProperty('--ui-scale', scaleStr);
      if (this.scaler) {
        this.scaler.style.transform = `scale(${scaleStr})`;
      }
    };
    applyScale();
    window.addEventListener('resize', applyScale);
  }

  bindDomElements() {
    // Header Telemetry
    this.dispP0 = document.getElementById('disp-p0');
    this.dispMach = document.getElementById('disp-mach');
    this.dispQ = document.getElementById('disp-q');
    this.dispRe = document.getElementById('disp-re');
    this.btnAudioToggle = document.getElementById('btn-audio-toggle');
    this.audioIcon = document.getElementById('audio-icon');
    this.btnManualToggle = document.getElementById('btn-manual-toggle');

    // Interlock Banner
    this.interlockBanner = document.getElementById('interlock-trip-banner');
    this.btnBannerRelease = document.getElementById('btn-banner-release-interlock');

    // Canvas Overlays
    this.dispFlowRegime = document.getElementById('disp-flow-regime');
    this.dispBoundaryState = document.getElementById('disp-boundary-state');
    this.lockedVaneCount = document.getElementById('locked-vane-count');

    // Cluster 1: Vane Dial
    this.steerStatusPill = document.getElementById('steer-status-pill');
    this.dispAzimuth = document.getElementById('disp-azimuth-angle');
    this.azimuthSlider = document.getElementById('azimuth-slider');
    this.btnStepPrev = document.getElementById('btn-step-prev');
    this.btnStepNext = document.getElementById('btn-step-next');
    this.sectorMatrixGrid = document.getElementById('sector-matrix-grid');

    // Selected Sector Panel
    this.dispSectorGlyph = document.getElementById('disp-sector-glyph');
    this.dispSectorCode = document.getElementById('disp-sector-code');
    this.dispSectorName = document.getElementById('disp-sector-name');
    this.dispVanePitch = document.getElementById('disp-vane-pitch');
    this.dispPitotRef = document.getElementById('disp-pitot-ref');
    this.dispProfileType = document.getElementById('disp-profile-type');
    this.btnLockSector = document.getElementById('btn-lock-sector');
    this.btnClearSectors = document.getElementById('btn-clear-sectors');
    this.stripSlots = document.getElementById('strip-slots');

    // Cluster 2: Run Master
    this.runMasterBadge = document.getElementById('run-master-state-badge');
    this.btnInitiateRun = document.getElementById('btn-initiate-run');
    this.runBtnStatus = document.getElementById('run-btn-status-sub');
    this.runBtnText = document.getElementById('run-btn-text-main');
    this.btnEmergencyDump = document.getElementById('btn-emergency-dump');
    this.btnToggleInterlock = document.getElementById('btn-toggle-interlock');
    this.interlockBtnText = document.getElementById('interlock-toggle-btn-text');
    this.interlockDesc = document.getElementById('interlock-status-desc');
    this.selectPreset = document.getElementById('select-preset-profile');
    this.btnExecutePreset = document.getElementById('btn-execute-preset');

    // Modal
    this.manualModal = document.getElementById('manual-modal');
    this.btnCloseModal = document.getElementById('btn-close-modal');
    this.btnDismissModal = document.getElementById('btn-dismiss-modal');

    // Ambient Telemetry Elements
    this.valCl = document.getElementById('val-cl');
    this.valCd = document.getElementById('val-cd');
    this.valCm = document.getElementById('val-cm');
    this.valCy = document.getElementById('val-cy');
    this.valCn = document.getElementById('val-cn');
    this.valCll = document.getElementById('val-cll');
    this.barCl = document.getElementById('bar-cl');
    this.barCd = document.getElementById('bar-cd');
    this.barCm = document.getElementById('bar-cm');
    this.barCy = document.getElementById('bar-cy');
    this.barCn = document.getElementById('bar-cn');
    this.barCll = document.getElementById('bar-cll');
  }

  buildManometerBank() {
    const container = document.getElementById('manometer-tubes');
    if (!container) return;
    container.innerHTML = '';
    this.manometerTubes = [];
    for (let i = 0; i < 8; i++) {
      const tube = document.createElement('div');
      tube.className = 'manometer-tube';
      const fluid = document.createElement('div');
      fluid.className = 'manometer-fluid';
      fluid.style.height = `${30 + i * 7}%`;
      tube.appendChild(fluid);
      container.appendChild(tube);
      this.manometerTubes.push(fluid);
    }
  }

  buildSectorMatrix() {
    this.sectorMatrixGrid.innerHTML = '';
    AERODYNAMIC_SECTORS.forEach((sector) => {
      const btn = document.createElement('button');
      btn.className = 'sector-btn';
      btn.id = `sector-btn-${sector.id}`;
      btn.dataset.id = sector.id;
      btn.setAttribute('aria-label', `Select ${sector.code} (${sector.name})`);

      btn.innerHTML = `
        <span class="s-btn-code">${sector.code}</span>
        <span class="s-btn-angle">${sector.angleDeg}°</span>
      `;

      btn.addEventListener('click', () => {
        this.updateSelectedSector(sector, true);
      });

      this.sectorMatrixGrid.appendChild(btn);
    });
  }

  buildRakeProfile() {
    const container = document.getElementById('rake-bars');
    if (!container) return;
    container.innerHTML = '';
    this.rakeBars = [];
    for (let i = 0; i < 8; i++) {
      const bar = document.createElement('div');
      bar.className = 'rake-bar';
      bar.style.height = `${20 + i * 10}%`;
      container.appendChild(bar);
      this.rakeBars.push(bar);
    }
  }

  buildPresetDropdown() {
    this.selectPreset.innerHTML = '';
    TEST_RUN_PROFILES.forEach((profile) => {
      const opt = document.createElement('option');
      opt.value = profile.id;
      opt.textContent = `${profile.name} [${profile.targetMach}]`;
      this.selectPreset.appendChild(opt);
    });
  }

  setupEventListeners() {
    // Azimuth Slider
    this.azimuthSlider.addEventListener('input', (e) => {
      const deg = parseInt(e.target.value, 10);
      const sector = AERODYNAMIC_SECTORS.find((s) => s.angleDeg === deg);
      if (sector) {
        this.updateSelectedSector(sector, true);
      }
    });

    // Step Prev/Next
    this.btnStepPrev.addEventListener('click', () => {
      const curIdx = AERODYNAMIC_SECTORS.findIndex((s) => s.id === this.selectedSector.id);
      const prevIdx = (curIdx - 1 + AERODYNAMIC_SECTORS.length) % AERODYNAMIC_SECTORS.length;
      this.updateSelectedSector(AERODYNAMIC_SECTORS[prevIdx], true);
    });

    this.btnStepNext.addEventListener('click', () => {
      const curIdx = AERODYNAMIC_SECTORS.findIndex((s) => s.id === this.selectedSector.id);
      const nextIdx = (curIdx + 1) % AERODYNAMIC_SECTORS.length;
      this.updateSelectedSector(AERODYNAMIC_SECTORS[nextIdx], true);
    });

    // Sector Vane Lock
    this.btnLockSector.addEventListener('click', () => {
      this.lockCurrentSector();
    });

    // Clear Vanes
    this.btnClearSectors.addEventListener('click', () => {
      this.resetVanes();
    });

    // Master Activation Trigger
    this.btnInitiateRun.addEventListener('click', () => {
      this.initiateTransonicRun();
    });

    // Emergency Blowdown Dump
    this.btnEmergencyDump.addEventListener('click', () => {
      this.emergencyBlowdownDump();
    });

    // Safety Interlock Toggle
    this.btnToggleInterlock.addEventListener('click', () => {
      this.toggleInterlock();
    });

    this.btnBannerRelease.addEventListener('click', () => {
      this.releaseInterlock();
    });

    // Quick-Dial Preset
    this.btnExecutePreset.addEventListener('click', () => {
      this.executePresetAutoDial();
    });

    // Audio Mute Toggle
    this.btnAudioToggle.addEventListener('click', () => {
      const muted = audio.toggleMute();
      this.audioIcon.textContent = muted ? '🔇' : '🔊';
      this.btnAudioToggle.innerHTML = `<span class="btn-icon" id="audio-icon">${muted ? '🔇' : '🔊'}</span> AUDIO: ${muted ? 'OFF' : 'ON'}`;
    });

    // Modal Reference
    this.btnManualToggle.addEventListener('click', () => {
      this.manualModal.style.display = 'flex';
    });
    this.btnCloseModal.addEventListener('click', () => {
      this.manualModal.style.display = 'none';
    });
    this.btnDismissModal.addEventListener('click', () => {
      this.manualModal.style.display = 'none';
    });
    this.manualModal.addEventListener('click', (e) => {
      if (e.target === this.manualModal) {
        this.manualModal.style.display = 'none';
      }
    });
  }

  updateSelectedSector(sector, playAudio = true) {
    this.selectedSector = sector;
    this.azimuthSlider.value = sector.angleDeg;
    this.dispAzimuth.textContent = `${String(sector.angleDeg).padStart(3, '0')}.0°`;

    // Highlight sector buttons
    document.querySelectorAll('.sector-btn').forEach((b) => {
      b.classList.toggle('selected', b.dataset.id === String(sector.id));
    });

    // Update inspector panel
    this.dispSectorGlyph.innerHTML = `<svg viewBox="0 0 50 50">${sector.glyphSvg}</svg>`;
    this.dispSectorCode.textContent = sector.code;
    this.dispSectorName.textContent = sector.name;
    this.dispVanePitch.textContent = sector.vanePitch;
    this.dispPitotRef.textContent = `${sector.pitotRef.toFixed(1)} kPa`;
    this.dispProfileType.textContent = sector.profileType;

    // Check if already locked
    const isLocked = this.lockedSectors.some((s) => s.id === sector.id);
    if (isLocked) {
      this.btnLockSector.classList.add('already-locked');
      this.btnLockSector.querySelector('.lock-label-main').textContent = 'VANE ALREADY LOCKED';
    } else {
      this.btnLockSector.classList.remove('already-locked');
      this.btnLockSector.querySelector('.lock-label-main').textContent = 'ENGAGE VANE LOCK';
    }

    this.renderer.setSelectedSector(sector);

    if (playAudio) {
      audio.playVaneSteerTick();
    }
  }

  // PHYSICAL VANE LOCK ACTION
  lockCurrentSector() {
    if (this.appState === 'ACTIVE' || this.appState === 'BUILDUP' || this.appState === 'BREAKTHROUGH') {
      return;
    }
    if (this.lockedSectors.length >= 6) {
      return;
    }
    if (this.lockedSectors.some((s) => s.id === this.selectedSector.id)) {
      return;
    }

    this.lockedSectors.push(this.selectedSector);
    const lockIdx = this.lockedSectors.length;

    // Play physical lock sound
    audio.playVaneLockSound(lockIdx);

    // Update button states
    const btn = document.getElementById(`sector-btn-${this.selectedSector.id}`);
    if (btn) btn.classList.add('locked');

    this.renderer.setLockedSectors(this.lockedSectors);
    this.updateLockStrip();

    // Check if 6th sector locked -> TRANSITION TO ARMED (NEVER AUTO-FIRE!)
    if (this.lockedSectors.length === 6) {
      this.appState = 'ARMED';
      this.renderer.setState('ARMED');
      this.dispFlowRegime.textContent = 'PLENUM CHARGED // FLOW READY';
      this.dispBoundaryState.textContent = 'LAMINAR SUCTION SEALED';
      this.dispBoundaryState.className = 'boundary-val text-emerald';
    } else {
      this.appState = 'STANDBY';
      this.renderer.setState('STANDBY');
      this.dispBoundaryState.textContent = `LAMINAR TRANSITION (${this.lockedSectors.length}/6)`;
      this.dispBoundaryState.className = 'boundary-val text-amber';
    }

    this.updateRunMasterControls();
  }

  resetVanes() {
    if (this.appState === 'ACTIVE' || this.appState === 'BUILDUP' || this.appState === 'BREAKTHROUGH') {
      return;
    }
    this.clearAutoDial();
    this.lockedSectors = [];
    audio.playSectorUnlockSound();

    document.querySelectorAll('.sector-btn').forEach((b) => b.classList.remove('locked'));
    this.renderer.setLockedSectors([]);
    this.appState = 'STANDBY';
    this.renderer.setState('STANDBY');

    this.dispFlowRegime.textContent = 'SUBSONIC QUIESCENT';
    this.dispBoundaryState.textContent = 'TURB // UNCONDITIONED';
    this.dispBoundaryState.className = 'boundary-val text-amber';

    this.updateLockStrip();
    this.updateRunMasterControls();
    this.updateSelectedSector(this.selectedSector, false);
  }

  updateLockStrip() {
    this.lockedVaneCount.textContent = this.lockedSectors.length;
    const slots = this.stripSlots.children;
    for (let i = 0; i < 6; i++) {
      const slot = slots[i];
      if (i < this.lockedSectors.length) {
        slot.className = 'slot filled';
        slot.textContent = this.lockedSectors[i].code;
      } else {
        slot.className = 'slot empty';
        slot.textContent = '--';
      }
    }
  }

  updateRunMasterControls() {
    if (this.appState === 'ACTIVE') {
      this.runMasterBadge.textContent = 'BLOWDOWN ACTIVE';
      this.runMasterBadge.style.color = '#00e676';
      this.runMasterBadge.style.borderColor = '#00e676';

      this.btnInitiateRun.disabled = true;
      this.btnInitiateRun.className = 'btn-initiate-run active-state';
      this.runBtnStatus.textContent = 'INVERSION SUSTAINED';
      this.runBtnText.textContent = 'TRANSONIC FLOW ACTIVE';

    } else if (this.appState === 'BUILDUP') {
      this.runMasterBadge.textContent = 'STAGE 1: COMPRESSOR SPOOL-UP';
      this.runMasterBadge.style.color = '#ffb300';
      this.runMasterBadge.style.borderColor = '#ffb300';

      this.btnInitiateRun.disabled = true;
      this.btnInitiateRun.className = 'btn-initiate-run ready';
      this.runBtnStatus.textContent = 'COMPRESSOR RAMPING';
      this.runBtnText.textContent = 'SPOOLING PLENUM...';

    } else if (this.appState === 'BREAKTHROUGH') {
      this.runMasterBadge.textContent = 'STAGE 2: TRANSONIC BREAKTHROUGH';
      this.runMasterBadge.style.color = '#ffffff';
      this.runMasterBadge.style.borderColor = '#ffffff';

      this.btnInitiateRun.disabled = true;
      this.btnInitiateRun.className = 'btn-initiate-run ready';
      this.runBtnStatus.textContent = 'MACH 1.0 CROSSING';
      this.runBtnText.textContent = 'SHOCK WAVE DETONATION';

    } else if (this.appState === 'ARMED') {
      if (this.interlockEngaged) {
        this.runMasterBadge.textContent = 'BLOCKED: CHOKE GATE SEALED';
        this.runMasterBadge.style.color = '#ff1744';
        this.runMasterBadge.style.borderColor = '#ff1744';

        this.btnInitiateRun.disabled = true;
        this.btnInitiateRun.className = 'btn-initiate-run blocked-interlock';
        this.runBtnStatus.textContent = 'INTERLOCK TRIPPED';
        this.runBtnText.textContent = 'BLOCKED // CHOKE GATE SEALED';
      } else {
        this.runMasterBadge.textContent = 'PLENUM ARMED // READY';
        this.runMasterBadge.style.color = '#ffb300';
        this.runMasterBadge.style.borderColor = '#ffb300';

        this.btnInitiateRun.disabled = false;
        this.btnInitiateRun.className = 'btn-initiate-run ready';
        this.runBtnStatus.textContent = 'ALL 6 VANES SEALED';
        this.runBtnText.textContent = 'INITIATE TRANSONIC RUN';
      }

    } else {
      // STANDBY / Configuring
      this.runMasterBadge.textContent = `CONFIGURING [${this.lockedSectors.length}/6]`;
      this.runMasterBadge.style.color = '#00e5ff';
      this.runMasterBadge.style.borderColor = 'rgba(0, 229, 255, 0.3)';

      this.btnInitiateRun.disabled = true;
      this.btnInitiateRun.className = 'btn-initiate-run';
      this.runBtnStatus.textContent = 'LATTICE INCOMPLETE';
      this.runBtnText.textContent = 'INITIATE TRANSONIC RUN';
    }
  }

  // 3-STAGE ACTIVATION FLOW
  initiateTransonicRun() {
    if (this.appState !== 'ARMED') return;

    if (this.interlockEngaged) {
      audio.playInterlockKlaxon();
      this.interlockBanner.style.display = 'flex';
      return;
    }

    // STAGE 1: BUILDUP PHASE (2.2 seconds)
    this.appState = 'BUILDUP';
    this.renderer.setState('BUILDUP');
    this.updateRunMasterControls();
    audio.startCompressorSpool(2.2);

    this.dispFlowRegime.textContent = 'COMPRESSOR SPOOL-UP // TRANSONIC RAMP';

    // Clear any pending timers
    this.clearActivationTimers();

    // Schedule STAGE 2: BREAKTHROUGH INSTANT (at 2.2s)
    const tBreakthrough = setTimeout(() => {
      this.appState = 'BREAKTHROUGH';
      this.renderer.setState('BREAKTHROUGH');
      this.updateRunMasterControls();
      audio.playSonicBoomBreakthrough();

      this.dispFlowRegime.textContent = 'PRANDTL-GLAUERT CONDENSATION // MACH 1.0';

      // Schedule STAGE 3: SUSTAINED ACTIVE STATE (at 2.9s)
      const tActive = setTimeout(() => {
        this.appState = 'ACTIVE';
        this.renderer.setState('ACTIVE');
        this.updateRunMasterControls();
        audio.startSustainedTunnelRoar();

        this.dispFlowRegime.textContent = 'SUPERSONIC INVERSION ACTIVE // M 1.45';
      }, 700);

      this.activationTimers.push(tActive);
    }, 2200);

    this.activationTimers.push(tBreakthrough);
  }

  // EMERGENCY BLOWDOWN DUMP / DISENGAGE (Always reachable!)
  emergencyBlowdownDump() {
    this.clearAutoDial();
    this.clearActivationTimers();

    audio.playEmergencyDumpSound();

    this.appState = 'STANDBY';
    this.renderer.setState('STANDBY');
    this.lockedSectors = [];
    document.querySelectorAll('.sector-btn').forEach((b) => b.classList.remove('locked'));
    this.renderer.setLockedSectors([]);

    this.dispFlowRegime.textContent = 'BLOWDOWN DUMP EXHAUSTED // STANDBY';
    this.dispBoundaryState.textContent = 'TURB // VENTED';
    this.dispBoundaryState.className = 'boundary-val text-amber';

    this.updateLockStrip();
    this.updateRunMasterControls();
    this.updateSelectedSector(this.selectedSector, false);
  }

  // SAFETY INTERLOCK HANDLING
  toggleInterlock() {
    this.interlockEngaged = !this.interlockEngaged;
    audio.playInterlockToggle(this.interlockEngaged);
    this.renderInterlockState();
    this.updateRunMasterControls();
  }

  releaseInterlock() {
    this.interlockEngaged = false;
    audio.playInterlockToggle(false);
    this.renderInterlockState();
    this.updateRunMasterControls();
  }

  renderInterlockState() {
    if (this.interlockEngaged) {
      this.btnToggleInterlock.className = 'btn-interlock-toggle engaged';
      this.interlockBtnText.textContent = 'ENGAGED';
      this.interlockDesc.textContent = 'Status: ENGAGED (Blocks Blowdown)';
      this.interlockBanner.style.display = 'flex';
      audio.playInterlockKlaxon();
    } else {
      this.btnToggleInterlock.className = 'btn-interlock-toggle released';
      this.interlockBtnText.textContent = 'RELEASED';
      this.interlockDesc.textContent = 'Status: RELEASED (Permit Blowdown)';
      this.interlockBanner.style.display = 'none';
    }
  }

  // QUICK-DIAL PRESET EXECUTION (Paced machine cadence, never auto-fires!)
  executePresetAutoDial() {
    if (this.appState === 'ACTIVE' || this.appState === 'BUILDUP' || this.appState === 'BREAKTHROUGH') {
      return;
    }

    this.clearAutoDial();
    this.clearActivationTimers();

    const profileId = this.selectPreset.value;
    const profile = TEST_RUN_PROFILES.find((p) => p.id === profileId);
    if (!profile) return;

    // Reset current vanes first
    this.lockedSectors = [];
    document.querySelectorAll('.sector-btn').forEach((b) => b.classList.remove('locked'));
    this.renderer.setLockedSectors([]);
    this.appState = 'STANDBY';
    this.renderer.setState('STANDBY');
    this.updateLockStrip();

    let stepIndex = 0;
    const sequence = profile.sequence; // 6 sector ids

    const runStep = () => {
      if (stepIndex >= sequence.length) {
        // Auto-dial complete: land cleanly in ARMED, NEVER auto-fire!
        this.clearAutoDial();
        return;
      }

      const sectorId = sequence[stepIndex];
      const sector = AERODYNAMIC_SECTORS.find((s) => s.id === sectorId);
      if (sector) {
        this.updateSelectedSector(sector, false);
        this.lockCurrentSector();
      }

      stepIndex++;
      if (stepIndex < sequence.length) {
        this.autoDialTimer = setTimeout(runStep, 350);
      }
    };

    // Run first step immediately
    runStep();
  }

  clearAutoDial() {
    if (this.autoDialTimer) {
      clearTimeout(this.autoDialTimer);
      this.autoDialTimer = null;
    }
  }

  clearActivationTimers() {
    this.activationTimers.forEach((t) => clearTimeout(t));
    this.activationTimers = [];
  }

  // SIMULATION & TELEMETRY ANIMATION LOOP
  animLoop(timestamp) {
    const deltaMs = Math.min(100, timestamp - this.lastTime);
    this.lastTime = timestamp;

    // Update renderer physics and streamlines
    this.renderer.update(deltaMs);
    this.renderer.render();

    // Smooth telemetry updates
    this.currentMach = this.renderer.mach;
    this.dynamicHeadQ = this.renderer.dynamicPressureQ;

    if (this.appState === 'ACTIVE') {
      this.stagnationP0 = 124.5 + Math.sin(timestamp * 0.004) * 0.8;
      this.reynoldsRe = 5.2 + Math.sin(timestamp * 0.003) * 0.1;
    } else if (this.appState === 'BUILDUP') {
      this.stagnationP0 = 101.3 + (this.renderer.buildupProgress * 23.0);
      this.reynoldsRe = 1.4 + (this.renderer.buildupProgress * 3.6);
    } else {
      this.stagnationP0 = 101.3 + Math.sin(timestamp * 0.001) * 0.2;
      this.reynoldsRe = 1.4 + Math.sin(timestamp * 0.002) * 0.05;
    }

    this.dispP0.textContent = `${this.stagnationP0.toFixed(1)} kPa`;
    this.dispMach.textContent = `M ${this.currentMach.toFixed(2)}`;
    this.dispQ.textContent = `${this.dynamicHeadQ.toFixed(1)} kPa`;
    this.dispRe.textContent = `${this.reynoldsRe.toFixed(1)} × 10⁶`;

    // Animate Manometers
    const machFactor = Math.min(1.5, this.currentMach);
    for (let i = 0; i < this.manometerTubes.length; i++) {
      const baseHeight = 25 + (7 - i) * 6;
      const wave = Math.sin(timestamp * 0.003 + i) * 3;
      const dynamicH = baseHeight + (machFactor * (i * 5)) + wave;
      this.manometerTubes[i].style.height = `${Math.min(95, Math.max(10, dynamicH))}%`;
    }

    // Animate 6-Axis Balance Polar
    const trimJitter = this.appState === 'ACTIVE' ? 0.015 : 0.003;
    const cl = (this.appState === 'ACTIVE' ? 0.485 : 0.124) + Math.sin(timestamp * 0.005) * trimJitter;
    const cd = (this.appState === 'ACTIVE' ? 0.042 : 0.018) + Math.cos(timestamp * 0.004) * (trimJitter * 0.5);
    const cm = -0.004 + Math.sin(timestamp * 0.003) * 0.002;
    const cy = Math.sin(timestamp * 0.002) * 0.001;
    const cn = Math.cos(timestamp * 0.002) * 0.001;
    const cll = Math.sin(timestamp * 0.001) * 0.0008;

    this.valCl.textContent = cl.toFixed(3);
    this.valCd.textContent = cd.toFixed(3);
    this.valCm.textContent = cm.toFixed(3);
    this.valCy.textContent = (cy >= 0 ? '+' : '') + cy.toFixed(3);
    this.valCn.textContent = (cn >= 0 ? '+' : '') + cn.toFixed(3);
    this.valCll.textContent = (cll >= 0 ? '+' : '') + cll.toFixed(3);

    this.barCl.style.width = `${Math.min(100, cl * 140)}%`;
    this.barCd.style.width = `${Math.min(100, cd * 1200)}%`;
    this.barCm.style.width = `${Math.min(100, Math.abs(cm) * 2000)}%`;

    // Animate boundary layer rake profile
    if (this.rakeBars) {
      const isLaminar = this.lockedSectors.length === 6 || this.appState === 'ACTIVE';
      for (let i = 0; i < this.rakeBars.length; i++) {
        const uRatio = isLaminar
          ? Math.pow((i + 1) / 8, 0.4) // Sharp laminar Falkner-Skan
          : Math.pow((i + 1) / 8, 0.14) + (Math.sin(timestamp * 0.01 + i) * 0.08); // Turbulent profile
        const hPct = Math.min(100, Math.max(10, uRatio * 100));
        this.rakeBars[i].style.height = `${hPct}%`;
        this.rakeBars[i].style.backgroundColor = isLaminar ? '#00e676' : '#ffb300';
      }
    }

    requestAnimationFrame(this.animLoop);
  }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.appInstance = new StargateWindTunnelApp();
});
