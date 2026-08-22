/**
 * TX-77 'AURA' Fast-Neutron Annular Resonator
 * Main Application Coordinator & UI State Machine
 */

class HMIApplication {
  constructor() {
    this.physics = window.reactorPhysics;
    this.audio = window.hmiAudio;
    this.renderer = null;
    this.telemetry = null;
    this.presets = new window.PresetSequencer();
    this.archive = null;

    this.lastFrameTime = performance.now();
    this.activeStabilizationTimeout = null;

    this.init();
  }

  init() {
    this.setupViewportScaling();
    window.addEventListener('resize', () => this.setupViewportScaling());

    this.renderer = new window.CoreCanvasRenderer('core-vector-canvas');
    this.telemetry = new window.TelemetrySubsystem();
    this.archive = new window.ConfigurationArchive();

    this.renderChannelButtons();
    this.setupEventListeners();
    this.setupTabs();

    // Hook canvas clicks to channel selection
    this.renderer.onChannelClick = (channelId) => {
      this.handleChannelSelection(channelId);
    };

    // Start Real-Time Animation Loop
    requestAnimationFrame((t) => this.animationLoop(t));
  }

  setupViewportScaling() {
    const scaler = document.getElementById('hmi-viewport-scaler');
    const container = document.getElementById('app-container');
    if (!scaler || !container) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const baseW = 1920;
    const baseH = 1080;

    // Unitless scale factor
    const scale = Math.min(vw / baseW, vh / baseH);
    document.documentElement.style.setProperty('--hmi-scale', scale.toFixed(5));
  }

  renderChannelButtons() {
    const grid = document.getElementById('channels-button-grid');
    if (!grid) return;
    grid.innerHTML = '';

    this.physics.channels.forEach(ch => {
      const btn = document.createElement('button');
      btn.className = 'channel-btn';
      btn.id = `channel-btn-${ch.id}`;
      btn.setAttribute('data-channel-id', ch.id);
      btn.innerHTML = `
        <span class="ch-symbol">${ch.symbol}</span>
        <span class="ch-bank">${ch.bank}</span>
        <div class="ch-depth-bar"><div class="ch-depth-fill" id="ch-depth-fill-${ch.id}"></div></div>
        <span class="ch-flux" id="ch-flux-${ch.id}">1.00 nv</span>
      `;

      btn.addEventListener('click', () => {
        this.handleChannelSelection(ch.id);
      });

      grid.appendChild(btn);
    });
  }

  setupEventListeners() {
    // 1. Master Audio Toggle
    const audioBtn = document.getElementById('audio-toggle-btn');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        const active = this.audio.toggleMute();
        const label = document.getElementById('audio-btn-label');
        if (label) label.textContent = active ? 'AUDIO: ACTIVE' : 'AUDIO: MUTED';
      });
    }

    // 2. Operator Reference Modal (? Button)
    const refBtn = document.getElementById('operator-ref-btn');
    const modal = document.getElementById('operator-ref-modal');
    const closeBtn = document.getElementById('close-operator-ref-btn');
    const ackBtn = document.getElementById('modal-ack-btn');

    if (refBtn && modal) {
      refBtn.addEventListener('click', () => {
        modal.classList.remove('hidden');
        this.audio.playClick();
      });
    }
    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        this.audio.playClick();
      });
    }
    if (ackBtn && modal) {
      ackBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        this.audio.playClick();
      });
    }

    // 3. RPS Safety Interlock Switch
    const rpsBtn = document.getElementById('rps-toggle-btn');
    if (rpsBtn) {
      rpsBtn.addEventListener('click', () => {
        const engaged = this.physics.toggleRpsHold();
        rpsBtn.setAttribute('aria-checked', engaged ? 'true' : 'false');
        const badge = document.getElementById('rps-status-badge');
        const btnText = document.getElementById('rps-btn-text');

        if (engaged) {
          rpsBtn.className = 'rps-toggle-btn engaged';
          if (btnText) btnText.textContent = 'HOLD ENGAGED [INHIBIT]';
          if (badge) {
            badge.textContent = 'RPS: ENGAGED';
            badge.className = 'cluster-badge interlocked';
          }
          this.telemetry.addLog('RPS INTERLOCK', 'Reactor Protection System Hold ENGAGED by operator.', 'warn');
        } else {
          rpsBtn.className = 'rps-toggle-btn released';
          if (btnText) btnText.textContent = 'HOLD RELEASED [READY]';
          if (badge) {
            badge.textContent = 'RPS: CLEAR';
            badge.className = 'cluster-badge';
          }
          this.telemetry.addLog('RPS INTERLOCK', 'Reactor Protection System Hold RELEASED.', 'info');
        }
        this.updateActionButtonsUI();
      });
    }

    // 4. Master Activation Button
    const activateBtn = document.getElementById('activate-criticality-btn');
    if (activateBtn) {
      activateBtn.addEventListener('click', () => {
        const res = this.physics.initiateActivation();
        if (res.success) {
          this.telemetry.addLog('CRITICALITY INITIATED', 'Reactivity buildup started. Stage 1 in progress...', 'info');
        } else {
          if (res.reason === 'RPS_INTERLOCK_ENGAGED') {
            this.telemetry.addLog('CRITICALITY BLOCKED', 'RPS Hold active! Release interlock switch before initiating.', 'scram');
            alert('REACTOR PROTECTION SYSTEM (RPS) HOLD ACTIVE!\nRelease RPS Hold to allow criticality initiation.');
          }
        }
        this.updateActionButtonsUI();
      });
    }

    // 5. Emergency SCRAM Slam Button
    const scramBtn = document.getElementById('scram-disengage-btn');
    if (scramBtn) {
      scramBtn.addEventListener('click', () => {
        this.presets.stop();
        if (this.activeStabilizationTimeout) {
          clearTimeout(this.activeStabilizationTimeout);
          this.activeStabilizationTimeout = null;
        }
        this.physics.scram();
        this.hideStabilizationHud();
        this.telemetry.addLog('EMERGENCY SCRAM', 'Manual scram executed. All control rods inserted.', 'scram');
        this.updateChannelButtonsUI();
        this.updateActionButtonsUI();
      });
    }

    // 6. Quick-Dial Preset Run Button
    const runPresetBtn = document.getElementById('run-preset-autodial-btn');
    const presetDropdown = document.getElementById('preset-dropdown');
    if (runPresetBtn && presetDropdown) {
      runPresetBtn.addEventListener('click', () => {
        const presetId = presetDropdown.value;
        const indicator = document.getElementById('preset-status-indicator');
        if (indicator) indicator.textContent = 'SEQUENCING...';

        this.telemetry.addLog('AUTO-DIAL START', `Sequencing preset configuration ${presetId}...`, 'info');

        this.presets.executePreset(
          presetId,
          (step, channelId, index) => {
            this.updateChannelButtonsUI();
            this.updateActionButtonsUI();
            if (indicator) indicator.textContent = `CHANNEL ${index + 1}/6: ${step}`;
          },
          (preset) => {
            if (indicator) indicator.textContent = 'PENDING CRITICALITY';
            this.telemetry.addLog('AUTO-DIAL COMPLETE', `Preset ${preset.id} calibrated. Awaiting manual activation trigger.`, 'success');
            this.updateChannelButtonsUI();
            this.updateActionButtonsUI();
          }
        );
      });
    }

    // 7. Clear Log Button
    const clearLogBtn = document.getElementById('clear-log-btn');
    if (clearLogBtn) {
      clearLogBtn.addEventListener('click', () => {
        const stream = document.getElementById('event-log-stream');
        if (stream) stream.innerHTML = '';
      });
    }

    // 8. Settings Sliders & Themes
    const masterSlider = document.getElementById('vol-master-slider');
    if (masterSlider) {
      masterSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.audio.setMasterVolume(val);
        const disp = document.getElementById('vol-master-val');
        if (disp) disp.textContent = `${Math.round(val * 100)}%`;
      });
    }

    const humSlider = document.getElementById('vol-hum-slider');
    if (humSlider) {
      humSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.audio.setHumVolume(val);
        const disp = document.getElementById('vol-hum-val');
        if (disp) disp.textContent = `${Math.round(val * 100)}%`;
      });
    }

    const fxSlider = document.getElementById('vol-fx-slider');
    if (fxSlider) {
      fxSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.audio.setFxVolume(val);
        const disp = document.getElementById('vol-fx-val');
        if (disp) disp.textContent = `${Math.round(val * 100)}%`;
      });
    }

    // Theme selector buttons
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const theme = btn.getAttribute('data-theme');
        document.body.className = theme;
        this.audio.playClick();
      });
    });
  }

  setupTabs() {
    const tabs = document.querySelectorAll('.deck-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        const targetId = tab.getAttribute('data-tab');
        const targetPanel = document.getElementById(targetId);
        if (targetPanel) targetPanel.classList.add('active');

        this.audio.playClick();
      });
    });
  }

  // Handle manual channel selection (Rod withdrawal + flux stabilization)
  handleChannelSelection(channelId) {
    if (this.physics.state !== 'SUBCRITICAL' && this.physics.state !== 'PENDING') return;
    if (this.physics.selectedSequence.length >= this.physics.maxAddressLength) return;

    const res = this.physics.calibrateChannel(channelId);
    if (!res) return;

    const channel = res.channel;
    this.showStabilizationHud(channel);
    this.updateChannelButtonsUI();
    this.updateActionButtonsUI();

    this.telemetry.addLog('ROD WITHDRAWAL', `Withdrawing ${channel.bank} (${channel.symbol}) to ${channel.targetDepth}% depth.`, 'info');

    // 2-Step Sequence: Step 1 (Withdrawal animation 600ms), Step 2 (Flux Stabilization 700ms)
    this.activeStabilizationTimeout = setTimeout(() => {
      this.telemetry.addLog('FLUX STABILIZATION', `Detecting local flux equilibrium on ${channel.bank}...`, 'info');

      this.activeStabilizationTimeout = setTimeout(() => {
        this.physics.confirmChannelLock(channelId);
        this.hideStabilizationHud();
        this.updateChannelButtonsUI();
        this.updateActionButtonsUI();

        this.telemetry.addLog('CHANNEL LOCKED', `${channel.bank} (${channel.symbol}) calibrated & flux stabilized.`, 'success');

        if (this.physics.selectedSequence.length === this.physics.maxAddressLength) {
          this.telemetry.addLog('ALIGNMENT COMPLETE', 'All 6 channels calibrated. Core in PENDING CRITICALITY state. Manual trigger required.', 'success');
        }
      }, 700);
    }, 600);
  }

  showStabilizationHud(channel) {
    const hud = document.getElementById('flux-stabilization-hud');
    const title = document.getElementById('stabilization-channel-title');
    const bar = document.getElementById('stabilization-bar-fill');
    const targetFlux = document.getElementById('stabilization-target-flux');

    if (hud && title && bar && targetFlux) {
      title.textContent = `${channel.bank} (${channel.symbol}) WITHDRAWAL & FLUX STABILIZATION`;
      targetFlux.textContent = `TARGET FLUX: ${(4.5 + channel.targetDepth * 0.05).toFixed(2)} × 10¹² nv`;
      hud.classList.remove('hidden');

      bar.style.transition = 'width 1.2s ease-in-out';
      bar.style.width = '0%';
      setTimeout(() => { bar.style.width = '100%'; }, 20);
    }
  }

  hideStabilizationHud() {
    const hud = document.getElementById('flux-stabilization-hud');
    if (hud) hud.classList.add('hidden');
  }

  updateChannelButtonsUI() {
    this.physics.channels.forEach(ch => {
      const btn = document.getElementById(`channel-btn-${ch.id}`);
      const fill = document.getElementById(`ch-depth-fill-${ch.id}`);
      const flux = document.getElementById(`ch-flux-${ch.id}`);

      if (btn) {
        if (ch.isCalibrated) {
          btn.className = 'channel-btn calibrated';
        } else if (ch.isCalibrating) {
          btn.className = 'channel-btn calibrating';
        } else {
          btn.className = 'channel-btn';
        }
      }

      if (fill) {
        fill.style.width = `${ch.currentDepth.toFixed(0)}%`;
      }
      if (flux) {
        flux.textContent = `${ch.fluxReading.toFixed(2)} nv`;
      }
    });
  }

  updateActionButtonsUI() {
    const activateBtn = document.getElementById('activate-criticality-btn');
    const actLabel = document.getElementById('activate-btn-label');
    const actSub = document.getElementById('activate-btn-sub');
    const banner = document.getElementById('aperture-activation-banner');

    if (!activateBtn) return;

    if (this.physics.state === 'PENDING') {
      activateBtn.disabled = false;
      activateBtn.className = 'activate-btn ready-pulse';
      if (actLabel) actLabel.textContent = 'INITIATE CONTROLLED CRITICALITY';
      if (actSub) actSub.textContent = 'ALL 6 CHANNELS CALIBRATED — READY TO ENGAGE';
    } else if (this.physics.state === 'BUILDUP') {
      activateBtn.disabled = true;
      activateBtn.className = 'activate-btn';
      if (actLabel) actLabel.textContent = 'REACTIVITY BUILDUP IN PROGRESS';
      if (actSub) actSub.textContent = `k_eff ASCENDING: ${this.physics.keff.toFixed(4)} → 1.0000`;
    } else if (this.physics.state === 'BREAKTHROUGH' || this.physics.state === 'SUSTAINED') {
      activateBtn.disabled = true;
      activateBtn.className = 'activate-btn';
      if (actLabel) actLabel.textContent = 'SUSTAINED CRITICALITY ACTIVE';
      if (actSub) actSub.textContent = 'APERTURE OPEN — STEADY STATE 420.0 MWth';
    } else {
      activateBtn.disabled = true;
      activateBtn.className = 'activate-btn disabled';
      if (actLabel) actLabel.textContent = 'INITIATE CONTROLLED CRITICALITY';
      if (actSub) actSub.textContent = `REQUIRES 6 CHANNELS CALIBRATED (${this.physics.selectedSequence.length}/6)`;
    }

    if (banner) {
      if (this.physics.state === 'BREAKTHROUGH' || this.physics.state === 'SUSTAINED') {
        banner.classList.remove('hidden');
      } else {
        banner.classList.add('hidden');
      }
    }
  }

  animationLoop(timestamp) {
    const dt = Math.min(0.1, (timestamp - this.lastFrameTime) / 1000);
    this.lastFrameTime = timestamp;

    // 1. Update Physics Model
    this.physics.update(dt);

    // 2. Render Core Canvas Vector Scope
    this.renderer.render(dt);

    // 3. Update Live Telemetry & Gauges
    this.telemetry.update(this.physics);

    // 4. Continually refresh channel button stats
    this.updateChannelButtonsUI();

    requestAnimationFrame((t) => this.animationLoop(t));
  }
}

// Instantiate on DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
  window.hmiApp = new HMIApplication();
});
