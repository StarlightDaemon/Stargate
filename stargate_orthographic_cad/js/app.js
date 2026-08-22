/**
 * Stargate Orthographic CAD Terminal - Application Controller
 * Bureau: Aethelgard-Voss Structural Telemetrics & CAD Engineering Bureau
 * Spec: AV-CAD-STG-9042-REV-D
 */

import { cadAudio } from './audio.js';
import { GLYPH_DEFS, CALIPER_CONFIGS, CadRingRenderer } from './ring.js';
import { QUICK_DIAL_PRESETS } from './presets.js';
import { CadPortalEngine, PORTAL_STATES } from './portal.js';
import { CadDialerCoordinator, DIALER_STATES } from './dialer.js';

class StargateCadApp {
  constructor() {
    this.ring = null;
    this.portal = null;
    this.dialer = null;

    // Viewport scaling
    this.currentScale = 1;
    this.alertTimer = null;
    this.telemetryAnimTimer = null;
  }

  init() {
    this.setupViewportScaling();
    
    // Instantiate Core Engines
    this.ring = new CadRingRenderer("cad-ring-svg-container");
    this.portal = new CadPortalEngine("cad-portal-canvas");
    this.dialer = new CadDialerCoordinator(this.ring, this.portal);

    // Build UI Components
    this.renderGlyphPalette();
    this.renderAddressSlots();
    this.renderCaliperPills();
    this.renderQuickDialPresets();

    // Bind Event Listeners
    this.bindControls();
    this.bindCursorTracking();
    this.bindKeyboardShortcuts();
    this.bindStateCoordinator();

    // Start background telemetric oscillator
    this.startTelemetricClock();

    this.logStatus("AETHELGARD-VOSS CAD TERMINAL INITIALIZED // SPEC 9042-D READY");
  }

  /**
   * Viewport Scaling with plain unitless ratio (fixes CSS calc dividing length pitfall)
   */
  setupViewportScaling() {
    const updateScale = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.currentScale = Math.min(w / 1920, h / 1080);
      document.documentElement.style.setProperty('--app-scale', this.currentScale);
    };

    window.addEventListener('resize', updateScale);
    updateScale();
  }

  /**
   * Render 25 Interactive CAD Glyphs
   */
  renderGlyphPalette() {
    const grid = document.getElementById("glyph-matrix-grid");
    if (!grid) return;
    grid.innerHTML = "";

    GLYPH_DEFS.forEach(glyph => {
      const btn = document.createElement("button");
      btn.className = "glyph-key-btn";
      btn.id = `glyph-btn-${glyph.id}`;
      btn.title = `${glyph.code}: ${glyph.name}`;
      btn.setAttribute("aria-label", `Glyph ${glyph.code} ${glyph.name}`);

      btn.innerHTML = `
        <svg viewBox="-16 -16 32 32" class="glyph-key-svg">
          <path d="${glyph.path}" fill="none" stroke="#5de6ff" stroke-width="1.5" />
        </svg>
        <span class="glyph-key-code">${glyph.code}</span>
      `;

      btn.addEventListener("click", () => {
        cadAudio.ensureContext();
        this.dialer.inscribeGlyph(glyph.id);
      });

      grid.appendChild(btn);
    });
  }

  /**
   * Render 7 Inscription Address Slots
   */
  renderAddressSlots() {
    const container = document.getElementById("address-slots-container");
    if (!container) return;
    container.innerHTML = "";

    for (let i = 0; i < 7; i++) {
      const caliperConfig = CALIPER_CONFIGS[i];
      const slot = document.createElement("div");
      slot.className = `address-slot ${i === 0 ? 'active-target' : ''}`;
      slot.id = `address-slot-${i}`;

      const shortLabel = caliperConfig ? caliperConfig.name.split(" ")[0] : `C-${i+1}`;

      slot.innerHTML = `
        <span class="slot-index-tag">#0${i + 1}</span>
        <span class="slot-caliper-tag">${shortLabel}</span>
        <div id="slot-content-${i}" class="slot-empty-dash">-</div>
      `;

      container.appendChild(slot);
    }
  }

  /**
   * Render 8 Caliper Status Tracker Pills
   */
  renderCaliperPills() {
    const container = document.getElementById("caliper-tracker-list");
    if (!container) return;
    container.innerHTML = "";

    CALIPER_CONFIGS.forEach((c, idx) => {
      const pill = document.createElement("div");
      pill.className = "caliper-status-pill";
      pill.id = `caliper-pill-${idx}`;

      pill.innerHTML = `
        <span class="pill-node-title">${c.name.split(" ")[0]}</span>
        <span id="pill-node-state-${idx}" class="pill-node-state">UNCLAMPED</span>
      `;

      container.appendChild(pill);
    });
  }

  /**
   * Render Quick-Dial Presets in 2 Distinct Visual Tiers
   */
  renderQuickDialPresets() {
    const tier1Container = document.getElementById("quickdial-tier1-container");
    const tier2Container = document.getElementById("quickdial-tier2-container");

    if (tier1Container) tier1Container.innerHTML = "";
    if (tier2Container) tier2Container.innerHTML = "";

    QUICK_DIAL_PRESETS.forEach(preset => {
      const btn = document.createElement("button");
      btn.className = "preset-card-btn";
      btn.id = `preset-btn-${preset.id}`;
      btn.setAttribute("aria-label", `Quick-dial ${preset.name}`);

      btn.innerHTML = `
        <div class="preset-info">
          <span class="preset-name">${preset.name}</span>
          <span class="preset-sub">${preset.sector} // ${preset.desc.substring(0, 32)}...</span>
        </div>
        <div class="preset-meta">
          <span class="preset-energy">${preset.energyReq}</span>
          <span class="preset-status">[${preset.status}]</span>
        </div>
      `;

      btn.addEventListener("click", () => {
        cadAudio.ensureContext();
        this.logStatus(`BATCH SCRIPT INITIATED // AUTO-DIALING ${preset.name}`);
        this.highlightActivePresetButton(preset.id);
        this.dialer.startQuickDialPreset(preset.id);
      });

      if (preset.tier === "tier_1" && tier1Container) {
        tier1Container.appendChild(btn);
      } else if (preset.tier === "tier_2" && tier2Container) {
        tier2Container.appendChild(btn);
      }
    });
  }

  highlightActivePresetButton(presetId) {
    document.querySelectorAll(".preset-card-btn").forEach(b => b.classList.remove("active-preset"));
    const activeBtn = document.getElementById(`preset-btn-${presetId}`);
    if (activeBtn) activeBtn.classList.add("active-preset");
  }

  /**
   * Bind Interactive Controls
   */
  bindControls() {
    // 1. Primary Execution Button
    const btnActivate = document.getElementById("btn-activate");
    if (btnActivate) {
      btnActivate.addEventListener("click", () => {
        cadAudio.ensureContext();
        const result = this.dialer.executeActivation();
        if (!result.success) {
          if (result.reason === "SAFETY_HOLD") {
            this.showAlertBanner("HOLD: SECTION 14-B STRUCTURAL PERMIT RESTRICTION ENGAGED");
          } else {
            this.showAlertBanner(result.message);
          }
        }
      });
    }

    // 2. Safety Interlock (Structural Permit Review Hold) Toggle
    const toggleInterlock = document.getElementById("toggle-safety-interlock");
    if (toggleInterlock) {
      toggleInterlock.addEventListener("click", () => {
        cadAudio.ensureContext();
        const isApproved = this.dialer.toggleSafetyInterlock();
        this.updateSafetyInterlockUI(isApproved);
      });
    }

    // 3. Disengage & Purge Button
    const btnDisengage = document.getElementById("btn-disengage");
    if (btnDisengage) {
      btnDisengage.addEventListener("click", () => {
        cadAudio.ensureContext();
        this.logStatus("MANIFOLD PURGE INITIATED // COLLAPSING APERTURE");
        this.dialer.disengage();
      });
    }

    // 4. Audio Mute Toggle Button
    const btnAudio = document.getElementById("btn-audio-toggle");
    const audioIcon = document.getElementById("audio-icon");
    if (btnAudio) {
      btnAudio.addEventListener("click", () => {
        const isMuted = cadAudio.toggleMute();
        if (audioIcon) audioIcon.textContent = isMuted ? "🔇" : "🔊";
      });
    }

    // 5. Operator Reference Manual Modal
    const btnHelp = document.getElementById("btn-operator-help");
    const modal = document.getElementById("modal-operator-guide");
    const btnModalClose = document.getElementById("btn-modal-close");
    const btnModalDismiss = document.getElementById("btn-modal-dismiss");

    const openModal = () => {
      cadAudio.playClick();
      if (modal) modal.classList.remove("hidden");
    };

    const closeModal = () => {
      cadAudio.playClick();
      if (modal) modal.classList.add("hidden");
    };

    if (btnHelp) btnHelp.addEventListener("click", openModal);
    if (btnModalClose) btnModalClose.addEventListener("click", closeModal);
    if (btnModalDismiss) btnModalDismiss.addEventListener("click", closeModal);

    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
      });
    }
  }

  /**
   * Bind Live Cursor Coordinate Telemetry Tracker
   */
  bindCursorTracking() {
    const viewport = document.getElementById("panel-drawing-viewport");
    const coordX = document.getElementById("coord-x");
    const coordY = document.getElementById("coord-y");
    const coordTheta = document.getElementById("coord-theta");

    if (!viewport || !coordX || !coordY || !coordTheta) return;

    viewport.addEventListener("mousemove", (e) => {
      const rect = viewport.getBoundingClientRect();
      const rawX = (e.clientX - rect.left) / this.currentScale - (rect.width / this.currentScale) / 2;
      const rawY = (e.clientY - rect.top) / this.currentScale - (rect.height / this.currentScale) / 2;

      // Scale to CAD mm coordinates
      const cadX = (rawX * 28.5).toFixed(1);
      const cadY = (-rawY * 28.5).toFixed(1);
      let angle = (Math.atan2(rawY, rawX) * (180 / Math.PI) + 90);
      if (angle < 0) angle += 360;

      coordX.textContent = `X: ${cadX > 0 ? '+' : ''}${cadX}`;
      coordY.textContent = `Y: ${cadY > 0 ? '+' : ''}${cadY}`;
      coordTheta.textContent = `θ: ${angle.toFixed(2)}°`;
    });
  }

  /**
   * Bind Keyboard Shortcuts
   */
  bindKeyboardShortcuts() {
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const modal = document.getElementById("modal-operator-guide");
        if (modal && !modal.classList.contains("hidden")) {
          modal.classList.add("hidden");
        }
      } else if (e.key === " " && e.target === document.body) {
        e.preventDefault();
        this.dialer.disengage();
      } else if (e.key === "Enter" && this.dialer.state === DIALER_STATES.READY) {
        e.preventDefault();
        this.dialer.executeActivation();
      } else if (e.key.toLowerCase() === "m") {
        const isMuted = cadAudio.toggleMute();
        const icon = document.getElementById("audio-icon");
        if (icon) icon.textContent = isMuted ? "🔇" : "🔊";
      } else if (e.key.toLowerCase() === "s") {
        const isApproved = this.dialer.toggleSafetyInterlock();
        this.updateSafetyInterlockUI(isApproved);
      }
    });
  }

  /**
   * Bind State Machine & Telemetric Callbacks
   */
  bindStateCoordinator() {
    this.dialer.onStateChange = (state) => {
      this.updateStateUI(state);
    };

    this.dialer.onAddressChange = (address) => {
      this.updateAddressSlotsUI(address);
      this.updateCaliperPillsUI(address);
    };

    this.dialer.onTelemetryUpdate = (data) => {
      if (data.msg) this.logStatus(data.msg);
    };
  }

  /**
   * Update UI on State Transition
   */
  updateStateUI(state) {
    const statusLed = document.getElementById("system-status-led");
    const statusText = document.getElementById("system-status-text");
    const btnActivate = document.getElementById("btn-activate");
    const tagActuator = document.getElementById("actuator-status-tag");
    const stageIndicator = document.getElementById("activation-stage-indicator");
    const stageStep = document.getElementById("stage-step-tag");
    const stageName = document.getElementById("stage-name-tag");
    const stageProgress = document.getElementById("stage-progress-fill");

    if (state === DIALER_STATES.IDLE) {
      if (statusLed) statusLed.className = "status-led idle";
      if (statusText) statusText.textContent = "SYS IDLE // STANDBY";
      if (btnActivate) {
        btnActivate.className = "cad-btn-primary-action disabled";
        btnActivate.disabled = true;
      }
      if (tagActuator) {
        tagActuator.className = "subcard-badge tag-standby";
        tagActuator.textContent = "STANDBY";
      }
      if (stageIndicator) stageIndicator.classList.add("hidden");
      this.updateMetricsUI(0, 0, 120, 0);
    } else if (state === DIALER_STATES.DIALING) {
      if (statusLed) statusLed.className = "status-led idle";
      if (statusText) statusText.textContent = `INSCRIBING [${this.dialer.currentAddress.length}/7]`;
      if (btnActivate) {
        btnActivate.className = "cad-btn-primary-action disabled";
        btnActivate.disabled = true;
      }
      if (tagActuator) {
        tagActuator.className = "subcard-badge tag-standby";
        tagActuator.textContent = "INCOMPLETE";
      }
      if (stageIndicator) stageIndicator.classList.add("hidden");
    } else if (state === DIALER_STATES.READY) {
      if (statusLed) statusLed.className = "status-led ready";
      if (statusText) statusText.textContent = "MANIFOLD READY // APERTURE PENDING";
      if (btnActivate) {
        btnActivate.className = "cad-btn-primary-action ready";
        btnActivate.disabled = false;
      }
      if (tagActuator) {
        tagActuator.className = "subcard-badge tag-ready";
        tagActuator.textContent = "READY TO COMMIT";
      }
      if (stageIndicator) stageIndicator.classList.add("hidden");
      this.logStatus("7-VECTOR MANIFOLD CONSTRAINTS SATISFIED // AWAITING OPERATOR COMMIT");
      this.updateMetricsUI(25.0, 1.25, 340, 0.125);
    } else if (state === DIALER_STATES.BUILDUP) {
      if (statusLed) statusLed.className = "status-led ready";
      if (statusText) statusText.textContent = "STAGE 1: BUILDUP INITIALIZING";
      if (btnActivate) {
        btnActivate.className = "cad-btn-primary-action active-running";
        btnActivate.disabled = true;
      }
      if (tagActuator) {
        tagActuator.className = "subcard-badge tag-ready";
        tagActuator.textContent = "BUILDUP...";
      }
      if (stageIndicator) {
        stageIndicator.classList.remove("hidden");
        if (stageStep) stageStep.textContent = "STAGE 1/3";
        if (stageName) stageName.textContent = "VECTOR MANIFOLD BUILDUP";
        if (stageProgress) {
          stageProgress.style.width = "0%";
          setTimeout(() => { stageProgress.style.width = "70%"; }, 50);
        }
      }
      this.logStatus("COLLIMATING APERTURE RAYS // ACCELERATING DRAFTING CLOCK");
      this.updateMetricsUI(65.0, 3.42, 680, 0.485);
    } else if (state === DIALER_STATES.BREAKTHROUGH) {
      if (statusLed) statusLed.className = "status-led active";
      if (statusText) statusText.textContent = "STAGE 2: BREAKTHROUGH INSTANT";
      if (stageIndicator) {
        stageIndicator.classList.remove("hidden");
        if (stageStep) stageStep.textContent = "STAGE 2/3";
        if (stageName) stageName.textContent = "PHOTON SINGULARITY BREAKTHROUGH";
        if (stageProgress) stageProgress.style.width = "90%";
      }
      this.logStatus("BREAKTHROUGH CONFIRMED // APERTURE OPENED");
      this.updateMetricsUI(92.0, 4.65, 840, 0.892);
    } else if (state === DIALER_STATES.ACTIVE) {
      if (statusLed) statusLed.className = "status-led active";
      if (statusText) statusText.textContent = "STAGE 3: MANIFOLD SUSTAINED";
      if (btnActivate) {
        btnActivate.className = "cad-btn-primary-action active-running";
        btnActivate.disabled = true;
      }
      if (tagActuator) {
        tagActuator.className = "subcard-badge tag-active";
        tagActuator.textContent = "ACTIVE";
      }
      if (stageIndicator) {
        stageIndicator.classList.remove("hidden");
        if (stageStep) stageStep.textContent = "STAGE 3/3";
        if (stageName) stageName.textContent = "SUSTAINED EVENT MANIFOLD";
        if (stageProgress) stageProgress.style.width = "100%";
      }
      this.logStatus("ORTHOGONAL APERTURE STABLE // WARP FLUX: 99.8%");
      this.updateMetricsUI(99.8, 4.881, 880, 0.998);
    } else if (state === DIALER_STATES.DISENGAGING) {
      if (statusLed) statusLed.className = "status-led idle";
      if (statusText) statusText.textContent = "PURGING MANIFOLD...";
      if (stageIndicator) stageIndicator.classList.add("hidden");
      this.updateMetricsUI(0, 0, 120, 0);
    }
  }

  /**
   * Update Address Slots UI with locked glyphs
   */
  updateAddressSlotsUI(address) {
    const lockCounter = document.getElementById("address-lock-counter");
    if (lockCounter) lockCounter.textContent = `${address.length} / 7 LOCKED`;

    for (let i = 0; i < 7; i++) {
      const slot = document.getElementById(`address-slot-${i}`);
      const content = document.getElementById(`slot-content-${i}`);
      if (!slot || !content) continue;

      if (i < address.length) {
        const glyph = address[i];
        slot.className = "address-slot locked";
        content.className = "slot-glyph-svg";
        content.innerHTML = `
          <svg viewBox="-14 -14 28 28">
            <path d="${glyph.path}" fill="none" stroke="#ffffff" stroke-width="1.8" />
          </svg>
        `;
      } else {
        slot.className = `address-slot ${i === address.length ? 'active-target' : ''}`;
        content.className = "slot-empty-dash";
        content.textContent = "-";
      }
    }

    // Highlight used buttons in matrix
    document.querySelectorAll(".glyph-key-btn").forEach(btn => btn.classList.remove("used-in-address"));
    address.forEach(g => {
      const btn = document.getElementById(`glyph-btn-${g.id}`);
      if (btn) btn.classList.add("used-in-address");
    });
  }

  /**
   * Update Caliper Status Pills
   */
  updateCaliperPillsUI(address) {
    CALIPER_CONFIGS.forEach((c, idx) => {
      const pill = document.getElementById(`caliper-pill-${idx}`);
      const stateSpan = document.getElementById(`pill-node-state-${idx}`);
      if (!pill || !stateSpan) return;

      if (idx < address.length) {
        pill.classList.add("locked");
        stateSpan.textContent = `LOCKED: ${address[idx].code}`;
      } else {
        pill.classList.remove("locked");
        stateSpan.textContent = "UNCLAMPED";
      }
    });
  }

  /**
   * Update Safety Interlock UI
   */
  updateSafetyInterlockUI(isApproved) {
    const badge = document.getElementById("interlock-status-badge");
    const toggleBtn = document.getElementById("toggle-safety-interlock");
    const toggleLabel = document.getElementById("toggle-btn-label");

    if (isApproved) {
      if (badge) {
        badge.className = "interlock-badge badge-released";
        badge.textContent = "RELEASED [PERMIT APPROVED]";
      }
      if (toggleBtn) {
        toggleBtn.className = "cad-toggle-btn released";
        toggleBtn.setAttribute("aria-pressed", "false");
      }
      if (toggleLabel) toggleLabel.textContent = "HOLD: RELEASED";
      this.logStatus("SECTION 14-B PERMIT HOLD RELEASED [AUTHORIZED]");
    } else {
      if (badge) {
        badge.className = "interlock-badge badge-engaged";
        badge.textContent = "ENGAGED [RESTRICTION HOLD]";
      }
      if (toggleBtn) {
        toggleBtn.className = "cad-toggle-btn engaged";
        toggleBtn.setAttribute("aria-pressed", "true");
      }
      if (toggleLabel) toggleLabel.textContent = "HOLD: ENGAGED";
      this.logStatus("SAFETY INTERLOCK ENGAGED: ACTIVATION RESTRICTED");
    }
  }

  /**
   * Show High-Priority Alert Banner
   */
  showAlertBanner(msg) {
    const banner = document.getElementById("cad-alert-banner");
    const text = document.getElementById("alert-message");
    if (!banner || !text) return;

    text.textContent = msg;
    banner.classList.remove("hidden");

    if (this.alertTimer) clearTimeout(this.alertTimer);
    this.alertTimer = setTimeout(() => {
      banner.classList.add("hidden");
    }, 3200);
  }

  /**
   * Update Telemetric Digital Readouts
   */
  updateMetricsUI(flux, energy, resonance, curvature) {
    const elFlux = document.getElementById("metric-warp-flux");
    const elEnergy = document.getElementById("metric-energy");
    const elResonance = document.getElementById("metric-resonance");
    const elCurvature = document.getElementById("metric-curvature");

    if (elFlux) elFlux.textContent = `${flux.toFixed(1)}%`;
    if (elEnergy) elEnergy.textContent = `${energy.toFixed(3)} TeV`;
    if (elResonance) elResonance.textContent = `${resonance.toFixed(1)} Hz`;
    if (elCurvature) elCurvature.textContent = `${curvature.toFixed(4)}`;
  }

  /**
   * Subtle Telemetric Fluctuation Clock
   */
  startTelemetricClock() {
    setInterval(() => {
      if (this.dialer.state === DIALER_STATES.ACTIVE) {
        const jitterFlux = (99.6 + Math.random() * 0.35).toFixed(1);
        const jitterEnergy = (4.875 + Math.random() * 0.015).toFixed(3);
        const jitterRes = (879.5 + Math.random() * 1.2).toFixed(1);
        const jitterCurv = (0.9975 + Math.random() * 0.002).toFixed(4);
        this.updateMetricsUI(parseFloat(jitterFlux), parseFloat(jitterEnergy), parseFloat(jitterRes), parseFloat(jitterCurv));
      }
    }, 650);
  }

  logStatus(msg) {
    const logEl = document.getElementById("cad-log-output");
    if (logEl) {
      logEl.textContent = msg;
    }
  }
}

// Instantiate on DOMContentLoaded
window.addEventListener("DOMContentLoaded", () => {
  const app = new StargateCadApp();
  app.init();
  window.__STARGATE_CAD_APP = app; // Expose for testing verification
});
