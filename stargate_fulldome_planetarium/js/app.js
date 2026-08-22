/**
 * VXD-9000 Master Application Controller & State Machine
 * Mount Tycho Zenith Fulldome Observatory & Public Sky Theatre
 */

class VXDApp {
  constructor() {
    this.state = 'IDLE'; // IDLE, DIALING, PENDING, BUILDUP, BREAKTHROUGH, ACTIVE
    this.addressBuffer = []; // Max 5 sector objects
    this.isAutoDialing = false;
    this.autoDialTimer = null;
    this.buildupTimer = null;
    this.buildupInterval = null;
    this.breakthroughTimer = null;

    // Safety interlock defaults to TRUE (RELEASED / ARMED)
    this.interlockReleased = true;

    this.initScaling();
    this.initDomReferences();
    this.initSubsystems();
    this.bindEvents();
    this.startSiderealClock();
    this.updateUI();
  }

  // =========================================================================
  // Responsive Scaling Architecture
  // =========================================================================
  initScaling() {
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const scale = Math.min(w / 1920, h / 1080);
      document.documentElement.style.setProperty('--app-scale', scale.toString());
    };

    window.addEventListener('resize', handleResize);
    handleResize();
  }

  // =========================================================================
  // DOM References
  // =========================================================================
  initDomReferences() {
    this.dom = {
      // Header
      siderealTime: document.getElementById('sidereal-time'),
      systemStatusPill: document.getElementById('system-status-pill'),
      btnSoundToggle: document.getElementById('btn-sound-toggle'),
      soundLabel: document.getElementById('sound-label'),
      btnOperatorRef: document.getElementById('btn-operator-reference'),

      // Left Column: Buffer & Telemetry
      bufferSlots: Array.from(document.querySelectorAll('.buffer-slot')),
      bufferCount: document.getElementById('buffer-count'),
      bufferLockMsg: document.getElementById('buffer-lock-msg'),
      btnClearBuffer: document.getElementById('btn-clear-buffer'),
      teleFlux: document.getElementById('tele-flux'),
      barFlux: document.getElementById('bar-flux'),
      teleStars: document.getElementById('tele-stars'),
      barStars: document.getElementById('bar-stars'),
      teleIris: document.getElementById('tele-iris'),
      barIris: document.getElementById('bar-iris'),
      teleRpm: document.getElementById('tele-rpm'),
      barRpm: document.getElementById('bar-rpm'),

      // Center Column: Ring & Banner
      instrumentBanner: document.getElementById('banner-text'),
      shockwaveBloom: document.getElementById('shockwave-bloom'),

      // Right Column: Presets & Master Console
      presetButtons: Array.from(document.querySelectorAll('.btn-preset-slew')),
      interlockSwitch: document.getElementById('interlock-switch'),
      interlockStatusText: document.getElementById('interlock-status-text'),
      btnIgnition: document.getElementById('btn-zenith-ignition'),
      ignitionSubtext: document.getElementById('ignition-subtext'),
      btnAbort: document.getElementById('btn-dome-abort'),
      stageStatusText: document.getElementById('stage-status-text'),

      // Modal & Reference
      operatorModal: document.getElementById('operator-modal'),
      btnCloseModal: document.getElementById('btn-close-modal'),
      btnModalAck: document.getElementById('btn-modal-ack'),
      glyphCatalog: document.getElementById('glyph-catalog')
    };
  }

  // =========================================================================
  // Subsystems Initialization
  // =========================================================================
  initSubsystems() {
    // 1. Fulldome Background Canvas Engine
    this.dome = new FulldomeEngine('dome-canvas');

    // 2. Optical Collimator Ring Controller
    this.ring = new VXDRingController({
      onNodeClick: (sector, index) => this.handleSectorClick(sector, index)
    });

    // 3. Ensure Safety Interlock Switch defaults to checked (RELEASED / ARMED)
    if (this.dom.interlockSwitch) {
      this.dom.interlockSwitch.checked = true;
      this.interlockReleased = true;
      this.updateInterlockUI();
    }

    // 4. Populate Modal Glyph Catalog
    this.populateGlyphCatalog();
  }

  populateGlyphCatalog() {
    if (!this.dom.glyphCatalog) return;
    let html = '';
    VXD_SECTORS.forEach(s => {
      html += `
        <div class="glyph-cat-card">
          <svg class="glyph-cat-icon" viewBox="0 0 28 28" fill="none" stroke-width="1.5">
            ${s.glyphSvg}
          </svg>
          <div class="glyph-cat-info">
            <span class="glyph-cat-code">${s.code}</span>
            <span class="glyph-cat-name">${s.name}</span>
            <span class="glyph-cat-coord">AZ: ${s.azimuth.toFixed(0)}° // ${s.epoch}</span>
          </div>
        </div>
      `;
    });
    this.dom.glyphCatalog.innerHTML = html;
  }

  // =========================================================================
  // Event Bindings
  // =========================================================================
  bindEvents() {
    // Audio Toggle
    this.dom.btnSoundToggle.addEventListener('click', () => {
      const active = window.vxdAudio.toggleMute();
      this.dom.soundLabel.textContent = active ? 'AUDIO: ON' : 'AUDIO: MUTED';
    });

    // Clear Buffer Button
    this.dom.btnClearBuffer.addEventListener('click', () => {
      window.vxdAudio.playHover();
      this.disengage();
    });

    // Quick-Dial Auto-Slew Buttons
    this.dom.presetButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const presetId = parseInt(btn.dataset.presetId, 10);
        this.triggerPresetAutoDial(presetId);
      });
    });

    // Safety Interlock Switch
    this.dom.interlockSwitch.addEventListener('change', (e) => {
      window.vxdAudio.ensureContext();
      this.interlockReleased = e.target.checked;
      this.updateInterlockUI();
      window.vxdAudio.playHover();
    });

    // Master Ignition Button (Dedicated Activation Trigger)
    this.dom.btnIgnition.addEventListener('click', () => {
      this.triggerZenithIgnition();
    });

    // Emergency Abort / Disengage Button (Always Reachable)
    this.dom.btnAbort.addEventListener('click', () => {
      this.disengage();
    });

    // Modal Events
    this.dom.btnOperatorRef.addEventListener('click', () => this.toggleModal(true));
    this.dom.btnCloseModal.addEventListener('click', () => this.toggleModal(false));
    this.dom.btnModalAck.addEventListener('click', () => this.toggleModal(false));

    // Global Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.key >= '1' && e.key <= '6') {
        const id = parseInt(e.key, 10) - 1;
        if (id < VXD_PRESETS.length) this.triggerPresetAutoDial(id);
      } else if (e.key === ' ' || e.key === 'Enter') {
        if (this.state === 'PENDING') {
          e.preventDefault();
          this.triggerZenithIgnition();
        }
      } else if (e.key === 'Escape') {
        this.disengage();
        this.toggleModal(false);
      } else if (e.key.toLowerCase() === 'i') {
        this.dom.interlockSwitch.checked = !this.dom.interlockSwitch.checked;
        this.dom.interlockSwitch.dispatchEvent(new Event('change'));
      } else if (e.key === '?') {
        this.toggleModal();
      } else if (e.key.toLowerCase() === 'm') {
        this.dom.btnSoundToggle.click();
      }
    });
  }

  toggleModal(force) {
    window.vxdAudio.playHover();
    const isHidden = this.dom.operatorModal.classList.contains('hidden');
    const show = force !== undefined ? force : isHidden;
    if (show) {
      this.dom.operatorModal.classList.remove('hidden');
    } else {
      this.dom.operatorModal.classList.add('hidden');
    }
  }

  updateInterlockUI() {
    if (this.interlockReleased) {
      this.dom.interlockStatusText.textContent = 'RELEASED // READY TO EMIT';
      this.dom.interlockStatusText.className = 'interlock-status highlight-emerald';
    } else {
      this.dom.interlockStatusText.textContent = 'ENGAGED // PROJECTION INHIBITED';
      this.dom.interlockStatusText.className = 'interlock-status highlight-red';
    }
  }

  // =========================================================================
  // Manual Dialing & Sector Locking
  // =========================================================================
  handleSectorClick(sector, index) {
    if (this.isAutoDialing || this.state === 'BUILDUP' || this.state === 'BREAKTHROUGH' || this.state === 'ACTIVE') {
      return;
    }

    // If buffer is already 5/5, reject click unless operator resets
    if (this.addressBuffer.length >= 5) {
      window.vxdAudio.playReject();
      return;
    }

    // Check if sector is already in buffer
    const existingIdx = this.addressBuffer.findIndex(s => s.code === sector.code);
    if (existingIdx !== -1) {
      // Sector already locked: feedback ping
      window.vxdAudio.playHover();
      return;
    }

    // Lock sector into buffer
    this.lockSector(sector, index);
  }

  lockSector(sector, index) {
    const slotIdx = this.addressBuffer.length;
    this.addressBuffer.push(sector);

    // Audio & Ring visual reaction
    window.vxdAudio.playLock(slotIdx);
    this.ring.setNodeLocked(sector.code, true);
    this.ring.rotateCageToSector(index);

    // Update state machine
    if (this.addressBuffer.length === 5) {
      this.state = 'PENDING';
    } else {
      this.state = 'DIALING';
    }

    this.updateUI();
  }

  // =========================================================================
  // Quick-Dial Automated Ephemeris Slew
  // =========================================================================
  triggerPresetAutoDial(presetId) {
    if (this.state === 'BUILDUP' || this.state === 'BREAKTHROUGH' || this.state === 'ACTIVE') {
      this.disengage();
    }

    const preset = VXD_PRESETS[presetId];
    if (!preset) return;

    // Reset current buffer
    this.clearBufferState();
    this.isAutoDialing = true;
    this.state = 'DIALING';

    this.dom.instrumentBanner.textContent = `AUTO-SLEWING TO EPHEMERIS ARCHIVE [${preset.name.toUpperCase()}]`;

    let step = 0;
    const dialStep = () => {
      if (!this.isAutoDialing) return; // aborted

      if (step < preset.sequence.length) {
        const code = preset.sequence[step];
        const sector = VXD_SECTORS.find(s => s.code === code);
        const index = VXD_SECTORS.findIndex(s => s.code === code);

        if (sector) {
          window.vxdAudio.playSlewTick();
          this.lockSector(sector, index);
        }

        step++;
        if (step < preset.sequence.length) {
          this.autoDialTimer = setTimeout(dialStep, 420); // ~400ms per glyph
        } else {
          // Finished auto-dialing: LAND IN PENDING STATE. NEVER AUTO-FIRE.
          this.isAutoDialing = false;
          this.state = 'PENDING';
          this.updateUI();
        }
      }
    };

    dialStep();
  }

  // =========================================================================
  // Three-Stage Zenith Activation Sequence
  // =========================================================================
  triggerZenithIgnition() {
    if (this.state !== 'PENDING') return;

    // Safety Interlock Check
    if (!this.interlockReleased) {
      window.vxdAudio.playReject();
      this.dom.instrumentBanner.textContent = 'WARNING: HIGH-FLUX LASER INTERLOCK ENGAGED // RELEASE TO EMIT SKY';
      this.dom.stageStatusText.textContent = 'INHIBITED // RELEASE SAFETY INTERLOCK';
      return;
    }

    // =======================================================================
    // STAGE 1: BUILDUP (~1.8 seconds)
    // =======================================================================
    this.state = 'BUILDUP';
    this.updateUI();

    const buildupDuration = 1.8;
    const startTime = performance.now();

    window.vxdAudio.playBuildup(buildupDuration);
    this.ring.setApertureDilated(true);
    this.ring.setEmitterMode('buildup');
    this.dome.setState('BUILDUP');

    this.buildupInterval = setInterval(() => {
      const elapsed = (performance.now() - startTime) / 1000;
      const progress = Math.min(1, elapsed / buildupDuration);
      
      this.dome.setBuildupProgress(progress);
      this.ring.updateHud('BUILDUP', `CHARGING ${(progress * 100).toFixed(0)}%`, progress * 100);

      // Telemetry ramp
      this.dom.teleFlux.textContent = `${(progress * 12.4).toFixed(1)} kW`;
      this.dom.barFlux.style.width = `${progress * 100}%`;
      this.dom.teleRpm.textContent = `${(progress * 180).toFixed(0)} RPM`;
      this.dom.barRpm.style.width = `${progress * 100}%`;
      this.dom.stageStatusText.textContent = `STAGE 1: XENON ACCELERATION [${(progress * 100).toFixed(0)}%]`;

      if (progress >= 1) {
        clearInterval(this.buildupInterval);
        this.buildupInterval = null;
        this.triggerBreakthrough();
      }
    }, 30);
  }

  // =======================================================================
  // STAGE 2: BREAKTHROUGH (~0.4 seconds)
  // =======================================================================
  triggerBreakthrough() {
    this.state = 'BREAKTHROUGH';
    this.updateUI();

    window.vxdAudio.playBreakthrough();
    this.dome.setState('BREAKTHROUGH');

    // Trigger visual shockwave bloom
    this.dom.shockwaveBloom.classList.add('trigger');
    this.dom.stageStatusText.textContent = 'STAGE 2: BREAKTHROUGH // ZENITH IRIS DETONATION';
    this.dom.teleFlux.textContent = '14.8 kW (PEAK)';
    this.dom.barFlux.style.width = '100%';

    this.breakthroughTimer = setTimeout(() => {
      this.dom.shockwaveBloom.classList.remove('trigger');
      this.triggerSustainedActive();
    }, 400);
  }

  // =======================================================================
  // STAGE 3: SUSTAINED ACTIVE PROJECTION
  // =======================================================================
  triggerSustainedActive() {
    this.state = 'ACTIVE';
    this.updateUI();

    window.vxdAudio.startActiveDrone();
    this.ring.setEmitterMode('active');

    // Pass dialed node coordinates to canvas engine for constellation tracing
    const screenVectors = this.addressBuffer.map(s => this.ring.getNodePositionOnScreen(s.code)).filter(Boolean);
    this.dome.setState('ACTIVE', { lockedVectors: screenVectors });

    this.ring.updateHud('ACTIVE', '10,800 STARS', 100);
    this.dom.teleFlux.textContent = '8.2 kW (STABLE)';
    this.dom.barFlux.style.width = '70%';
    this.dom.teleRpm.textContent = '45 RPM';
    this.dom.barRpm.style.width = '25%';
    this.dom.stageStatusText.textContent = 'STAGE 3: SUSTAINED PROJECTION // 10,800 BODIES ACTIVE';
    this.dom.instrumentBanner.textContent = 'FULLDOME CELESTIAL PROJECTION ONLINE // AUDIENCE IMMERSION ACTIVE';
  }

  // =========================================================================
  // Disengage & Emergency Shutter Reset (Always Reachable)
  // =========================================================================
  disengage() {
    // Clear all pending timers/intervals
    if (this.autoDialTimer) clearTimeout(this.autoDialTimer);
    if (this.buildupInterval) clearInterval(this.buildupInterval);
    if (this.breakthroughTimer) clearTimeout(this.breakthroughTimer);
    this.isAutoDialing = false;

    window.vxdAudio.playDisengage();

    // Reset dome canvas and ring
    this.dome.setState('IDLE', { lockedVectors: [] });
    this.ring.setApertureDilated(false);
    this.ring.setEmitterMode('none');
    this.dom.shockwaveBloom.classList.remove('trigger');

    this.clearBufferState();
    this.state = 'IDLE';
    this.updateUI();
  }

  clearBufferState() {
    this.addressBuffer = [];
    this.ring.clearAllLockedNodes();
    this.ring.updateHud('STANDBY', '0/5 LOCKED', 0);
  }

  // =========================================================================
  // Master UI Synchronization
  // =========================================================================
  updateUI() {
    const bufLen = this.addressBuffer.length;
    this.dom.bufferCount.textContent = bufLen.toString();

    // 1. Update Buffer Slots
    this.dom.bufferSlots.forEach((slotEl, idx) => {
      const sector = this.addressBuffer[idx];
      const slotContent = slotEl.querySelector('.slot-content');
      const symEl = slotEl.querySelector('.slot-symbol');
      const nameEl = slotEl.querySelector('.slot-name');
      const azEl = slotEl.querySelector('.slot-az');

      if (sector) {
        slotEl.classList.add('locked');
        slotContent.classList.remove('empty');
        symEl.textContent = sector.code;
        nameEl.textContent = sector.name;
        azEl.textContent = `AZ: ${sector.azimuth.toFixed(1)}°`;
      } else {
        slotEl.classList.remove('locked');
        slotContent.classList.add('empty');
        symEl.textContent = '---';
        nameEl.textContent = 'EMPTY VECTOR';
        azEl.textContent = 'AZ: 000.0°';
      }
    });

    // 2. Update Central HUD preview
    if (this.state === 'IDLE' || this.state === 'DIALING') {
      this.ring.updateHud('STANDBY', `${bufLen}/5 LOCKED`, (bufLen / 5) * 40);
    } else if (this.state === 'PENDING') {
      this.ring.updateHud('READY', '5/5 LOCKED', 100);
    }

    // 3. Header & System Status Pill
    if (this.state === 'IDLE') {
      this.dom.systemStatusPill.textContent = 'STANDBY // READY';
      this.dom.systemStatusPill.className = 'tele-val highlight-cyan';
      this.dom.bufferLockMsg.textContent = 'SELECT 5 CELESTIAL SECTORS TO ENGAGE APERTURE';
      this.dom.instrumentBanner.textContent = 'COLLIMATOR SYSTEM STANDBY // SELECT CELESTIAL SECTORS TO CONFIGURE SKY';
      this.dom.btnIgnition.disabled = true;
      this.dom.ignitionSubtext.textContent = 'AWAITING 5/5 EPHEMERIS LOCK';
      this.dom.stageStatusText.textContent = 'SYSTEM INACTIVE // SHUTTER CLOSED';
      this.dom.teleFlux.textContent = '0.0 kW';
      this.dom.barFlux.style.width = '0%';
      this.dom.teleRpm.textContent = '0.0 RPM';
      this.dom.barRpm.style.width = '0%';
    } else if (this.state === 'DIALING') {
      this.dom.systemStatusPill.textContent = `DIALING [${bufLen}/5]`;
      this.dom.systemStatusPill.className = 'tele-val highlight-cyan';
      this.dom.bufferLockMsg.textContent = `EPHEMERIS BUFFER: ${bufLen} OF 5 VECTORS REGISTERED`;
      this.dom.instrumentBanner.textContent = `APERTURE MOTOR TRACKING // SECTOR ${this.addressBuffer[bufLen - 1]?.name.toUpperCase()} ALIGNED`;
      this.dom.btnIgnition.disabled = true;
      this.dom.ignitionSubtext.textContent = `AWAITING ${5 - bufLen} MORE VECTORS`;
      this.dom.stageStatusText.textContent = `DIALING IN PROGRESS [${bufLen}/5]`;
    } else if (this.state === 'PENDING') {
      this.dom.systemStatusPill.textContent = 'PENDING // READY FOR EMISSION';
      this.dom.systemStatusPill.className = 'tele-val highlight-amber';
      this.dom.bufferLockMsg.textContent = 'EPHEMERIS BUFFER 5/5 LOCKED // APERTURE LATCH ENGAGED';
      this.dom.instrumentBanner.textContent = 'EPHEMERIS BUFFER COMPLETE // PRESS EMISSION TRIGGER TO IGNITE FULLDOME';
      this.dom.btnIgnition.disabled = false;
      this.dom.ignitionSubtext.textContent = 'READY FOR EMISSION // CLICK TO IGNITE';
      this.dom.stageStatusText.textContent = 'STANDBY PENDING // WAITING FOR OPERATOR COMMAND';
    } else if (this.state === 'BUILDUP') {
      this.dom.systemStatusPill.textContent = 'STAGE 1: XENON BUILDUP';
      this.dom.systemStatusPill.className = 'tele-val highlight-amber';
      this.dom.btnIgnition.disabled = true;
      this.dom.ignitionSubtext.textContent = 'PRE-CHARGING XENON ARC...';
    } else if (this.state === 'BREAKTHROUGH') {
      this.dom.systemStatusPill.textContent = 'STAGE 2: BREAKTHROUGH';
      this.dom.systemStatusPill.className = 'tele-val highlight-cyan';
      this.dom.btnIgnition.disabled = true;
      this.dom.ignitionSubtext.textContent = 'FULLDOME DETONATION';
    } else if (this.state === 'ACTIVE') {
      this.dom.systemStatusPill.textContent = 'SUSTAINED SKY PROJECTION';
      this.dom.systemStatusPill.className = 'tele-val highlight-emerald';
      this.dom.btnIgnition.disabled = true;
      this.dom.ignitionSubtext.textContent = 'PROJECTION ACTIVE (DISENGAGE TO RESET)';
    }
  }

  // =========================================================================
  // Sidereal Clock
  // =========================================================================
  startSiderealClock() {
    let siderealSeconds = 18 * 3600 + 42 * 60 + 19;
    setInterval(() => {
      siderealSeconds = (siderealSeconds + 1) % 86400;
      const h = Math.floor(siderealSeconds / 3600).toString().padStart(2, '0');
      const m = Math.floor((siderealSeconds % 3600) / 60).toString().padStart(2, '0');
      const s = Math.floor(siderealSeconds % 60).toString().padStart(2, '0');
      if (this.dom.siderealTime) {
        this.dom.siderealTime.textContent = `${h}h ${m}m ${s}s`;
      }
    }, 1000);
  }
}

// Instantiate on DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
  window.vxdApp = new VXDApp();
});
