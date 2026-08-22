/**
 * IPATC APICULTURE TELEMETRY NETWORK — MASTER APPLICATION CONTROLLER
 * Orchestrates dialing logic, 2-part correlation locks, 3-stage activation,
 * biosecurity containment interlock, quick-dial timed auto-sequencing,
 * secondary drawer modals, and JS-computed unitless viewport scaling.
 */

class TelemetryConsoleApp {
  constructor() {
    // Console State
    this.maxAddressLength = 7;
    this.activeAddress = []; // array of colony objects { id, code, classCode, freq }
    this.dialedNodeIndices = []; // 0..9
    this.isDialingNode = false;
    this.activationState = 'IDLE'; // 'IDLE' | 'PENDING' | 'BUILDUP' | 'BREAKTHROUGH' | 'ACTIVE'
    this.biosecurityHoldEngaged = false; // MUST default to RELEASED (false)
    this.autoDialTimeoutIds = [];
    this.sessionStartTime = Date.now();

    // Canvas renderers
    this.ringRenderer = null;
    this.thermalRenderer = null;

    // Initialize UI
    this.initScaling();
    this.initDOM();
    this.initEventListeners();
    this.subscribeTelemetry();
  }

  // 1. JS-Driven Viewport Scaling (avoids calc() length scale pitfall)
  initScaling() {
    const updateScale = () => {
      const targetW = 1920;
      const targetH = 1080;
      const scaleX = window.innerWidth / targetW;
      const scaleY = window.innerHeight / targetH;
      const scale = Math.min(scaleX, scaleY);

      document.documentElement.style.setProperty('--app-scale', scale.toString());
      console.log(`[ViewportScale] Window: ${window.innerWidth}x${window.innerHeight} -> Scale: ${scale.toFixed(4)}`);
    };

    window.addEventListener('resize', updateScale);
    updateScale();
  }

  // 2. DOM Initialization
  initDOM() {
    // Setup Ring Canvas Renderer
    const ringCanvas = document.getElementById('ring-canvas');
    if (ringCanvas) {
      this.ringRenderer = new window.RingArrayCanvasRenderer(ringCanvas);
    }

    // Populate Colony Selection Buttons
    this.renderColonyKeyGrid();

    // Populate Quick-Dial Dropdown
    this.renderQuickDialOptions();

    // Populate Colony Health Dashboard Table
    this.renderColonyHealthTable();
  }

  renderColonyKeyGrid() {
    const grid = document.getElementById('colony-glyph-grid');
    if (!grid) return;
    grid.innerHTML = '';

    window.COLONY_DEFINITIONS.forEach((colony, idx) => {
      const btn = document.createElement('button');
      btn.className = 'colony-key-btn';
      btn.id = `colony-key-${colony.id}`;
      btn.dataset.colonyId = colony.id;
      btn.dataset.nodeIndex = idx;
      btn.setAttribute('aria-label', `Dial Colony ${colony.code} ${colony.name}`);

      btn.innerHTML = `
        <span class="key-node-tag">NODE α-${(idx + 1).toString().padStart(2, '0')}</span>
        <div class="key-glyph-svg">${colony.glyphSvg}</div>
        <div class="key-label-group">
          <span class="key-station-id">${colony.code}</span>
          <span class="key-freq-badge">${colony.freq}Hz · ${colony.classCode}</span>
        </div>
      `;

      btn.addEventListener('click', () => this.handleManualColonyClick(colony, idx));
      grid.appendChild(btn);
    });
  }

  renderQuickDialOptions() {
    const select = document.getElementById('quick-dial-select');
    if (!select) return;
    select.innerHTML = '';

    // Group by tiers
    const tier1 = window.QUICK_DIAL_PRESETS.filter(p => p.tier === 1);
    const tier2 = window.QUICK_DIAL_PRESETS.filter(p => p.tier === 2);

    const group1 = document.createElement('optgroup');
    group1.label = '── Tier 1: Verified Healthy Apiaries ──';
    tier1.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.name} (${p.address.map(a => 'COL-0' + a).join('·')})`;
      group1.appendChild(opt);
    });
    select.appendChild(group1);

    const group2 = document.createElement('optgroup');
    group2.label = '── Tier 2: Flagged / Under Observation ──';
    tier2.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.name} (${p.address.map(a => 'COL-0' + a).join('·')})`;
      group2.appendChild(opt);
    });
    select.appendChild(group2);
  }

  renderColonyHealthTable() {
    const tbody = document.getElementById('colony-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    window.COLONY_HEALTH_STATIONS.forEach(station => {
      const row = document.createElement('tr');
      const statusClass = station.status === 'HEALTHY' ? 'badge-health-ok' : station.status === 'WARNING' ? 'badge-health-warn' : 'badge-health-danger';

      row.innerHTML = `
        <td style="font-weight:700; color:var(--text-bright);">${station.id}</td>
        <td>${station.name}</td>
        <td style="color:var(--text-muted);">${station.region}</td>
        <td>${station.pop}</td>
        <td>${station.vmi}</td>
        <td>${station.queen}</td>
        <td>${station.weight}</td>
        <td>${station.temp}</td>
        <td><span class="tag-badge" style="font-size:9px;">${station.acoustic}</span></td>
        <td>${station.traffic}</td>
        <td><span class="${statusClass}">● ${station.status}</span></td>
      `;
      tbody.appendChild(row);
    });
  }

  // 3. Event Listeners
  initEventListeners() {
    // Primary Activation Button
    const btnActivate = document.getElementById('btn-activate');
    if (btnActivate) {
      btnActivate.addEventListener('click', () => this.handleActivationTrigger());
    }

    // Disengage Button
    const btnDisengage = document.getElementById('btn-disengage');
    if (btnDisengage) {
      btnDisengage.addEventListener('click', () => this.handleDisengage());
    }

    // Quick-Dial Auto-Dial Button
    const btnQuickDial = document.getElementById('btn-quick-dial-engage');
    if (btnQuickDial) {
      btnQuickDial.addEventListener('click', () => this.handleQuickDialEngage());
    }

    // Biosecurity Containment Hold Switch
    const safetyCard = document.getElementById('safety-toggle-card');
    if (safetyCard) {
      safetyCard.addEventListener('click', () => this.toggleBiosecurityHold());
    }

    // Modal Nav Buttons & Close Handlers
    this.setupModalDrawers();

    // Session Uptime & Audio Settings Handlers
    this.setupSettingsHandlers();
  }

  // 4. Two-Part Manual Dialing Logic
  handleManualColonyClick(colony, nodeIndex) {
    if (this.isDialingNode || this.activeAddress.length >= this.maxAddressLength) return;
    if (this.activationState === 'ACTIVE' || this.activationState === 'BUILDUP') return;

    this.isDialingNode = true;

    // Part 1: Signature Acquisition
    window.telemetryAudio.playSweepChirp(colony.freq);
    this.updateStatusDisplay('TELEMETRY ACQUISITION IN PROGRESS...', 'pending');

    const keyBtn = document.getElementById(`colony-key-${colony.id}`);
    if (keyBtn) keyBtn.classList.add('selected');

    // Correlation-Confidence Climb (Ascending from 0 to 100%)
    let conf = 0;
    const interval = setInterval(() => {
      conf += 0.25;
      if (this.ringRenderer) {
        this.ringRenderer.setDialState(this.dialedNodeIndices, nodeIndex, Math.min(1, conf), this.activationState);
      }
      this.updateConfidenceBar(this.activeAddress.length * 14.28 + (conf * 14.28));

      if (conf >= 1) {
        clearInterval(interval);
        // Part 2: Correlation Confirmation
        this.lockColonyNode(colony, nodeIndex);
      }
    }, 45);
  }

  lockColonyNode(colony, nodeIndex) {
    window.telemetryAudio.playLockConfirm(colony.freq * 1.5);

    this.activeAddress.push(colony);
    this.dialedNodeIndices.push(nodeIndex);
    this.isDialingNode = false;

    const keyBtn = document.getElementById(`colony-key-${colony.id}`);
    if (keyBtn) {
      keyBtn.classList.remove('selected');
      keyBtn.classList.add('dialed');
    }

    // Update active address slots UI
    this.updateAddressSlots();

    // Check if fully dialed (7/7)
    if (this.activeAddress.length === this.maxAddressLength) {
      this.activationState = 'PENDING';
      this.updateStatusDisplay('HARMONIC RESONANCE ACHIEVED — PENDING UPLINK ENGAGEMENT', 'pending');

      const btnActivate = document.getElementById('btn-activate');
      if (btnActivate) {
        btnActivate.disabled = false;
        btnActivate.classList.add('ready-to-activate');
      }
    } else {
      this.updateStatusDisplay(`NODE α-${(nodeIndex + 1).toString().padStart(2, '0')} CORRELATED (${this.activeAddress.length}/${this.maxAddressLength})`, 'active');
    }

    if (this.ringRenderer) {
      this.ringRenderer.setDialState(this.dialedNodeIndices, null, 1, this.activationState);
    }
  }

  updateAddressSlots() {
    for (let i = 0; i < this.maxAddressLength; i++) {
      const slot = document.getElementById(`dial-slot-${i}`);
      if (!slot) continue;

      if (i < this.activeAddress.length) {
        const item = this.activeAddress[i];
        slot.classList.add('filled', 'locked');
        slot.querySelector('.slot-symbol').textContent = item.code;
        slot.querySelector('.slot-class').textContent = `${item.freq}Hz · ${item.classCode}`;
      } else {
        slot.classList.remove('filled', 'locked');
        slot.querySelector('.slot-symbol').textContent = '—';
        slot.querySelector('.slot-class').textContent = 'VACANT';
      }
    }
  }

  updateConfidenceBar(pct) {
    const fill = document.getElementById('correlation-progress-fill');
    const label = document.getElementById('correlation-percent-label');
    const clamped = Math.max(0, Math.min(100, pct));
    if (fill) fill.style.width = `${clamped}%`;
    if (label) label.textContent = `${clamped.toFixed(1)}%`;
  }

  // 5. Quick-Dial Auto-Sequencing (MUST Genuinely Auto-Dial with timed steps, NOT instant-jump)
  handleQuickDialEngage() {
    const select = document.getElementById('quick-dial-select');
    if (!select || this.activationState === 'ACTIVE' || this.isDialingNode) return;

    const presetId = select.value;
    const preset = window.QUICK_DIAL_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    // Reset current dial before starting sequence
    this.handleDisengage(false);

    this.updateStatusDisplay(`REPLAYING LOGGED NETWORK ROUTE: ${preset.name.toUpperCase()}...`, 'pending');

    // Step-by-step timed execution (220ms per node)
    preset.address.forEach((colonyId, stepIdx) => {
      const timeoutId = setTimeout(() => {
        const colony = window.COLONY_DEFINITIONS.find(c => c.id === colonyId);
        const nodeIdx = colony ? window.COLONY_DEFINITIONS.indexOf(colony) : stepIdx;
        if (colony) {
          window.telemetryAudio.playSweepChirp(colony.freq);
          this.lockColonyNode(colony, nodeIdx);
        }
      }, stepIdx * 240);
      this.autoDialTimeoutIds.push(timeoutId);
    });
  }

  // 6. Three-Stage Activation Trigger
  handleActivationTrigger() {
    if (this.activationState !== 'PENDING') return;

    // Biosecurity Check: If BCH-9 is engaged, block activation!
    if (this.biosecurityHoldEngaged) {
      window.telemetryAudio.playBiosecurityAlert();
      this.showBiosecurityBlockedWarning();
      return;
    }

    // Stage 1: BUILDUP (2.0s)
    this.activationState = 'BUILDUP';
    this.updateStatusDisplay('APERTURE PRE-IONIZATION & HARMONIC BUILDUP IN PROGRESS...', 'pending');
    window.telemetryAudio.playBuildupRiser(2.0);

    const btnActivate = document.getElementById('btn-activate');
    if (btnActivate) {
      btnActivate.disabled = true;
      btnActivate.classList.remove('ready-to-activate');
      btnActivate.classList.add('active-link');
    }

    if (this.ringRenderer) {
      this.ringRenderer.setDialState(this.dialedNodeIndices, null, 1, 'BUILDUP');
    }

    // Stage 2: BREAKTHROUGH (after 2000ms, lasts 1400ms)
    setTimeout(() => {
      if (this.activationState !== 'BUILDUP') return; // aborted

      this.activationState = 'BREAKTHROUGH';
      this.updateStatusDisplay('BREAKTHROUGH: OPTICAL IRIS BREACH CONFIRMED!', 'active');
      window.telemetryAudio.playBreakthroughShockwave();

      if (this.ringRenderer) {
        this.ringRenderer.setDialState(this.dialedNodeIndices, null, 1, 'BREAKTHROUGH');
      }

      // Stage 3: SUSTAINED ACTIVE (after 1400ms)
      setTimeout(() => {
        if (this.activationState !== 'BREAKTHROUGH') return;

        this.activationState = 'ACTIVE';
        this.updateStatusDisplay('TELEMETRY UPLINK ACTIVE // STREAMING 60 FPS BIO-PHOTONIC VORTEX', 'active');
        window.telemetryAudio.startApertureDrone();

        if (this.ringRenderer) {
          this.ringRenderer.setDialState(this.dialedNodeIndices, null, 1, 'ACTIVE');
        }
      }, 1400);
    }, 2000);
  }

  // 7. Disengage / Sever Telemetry Link
  handleDisengage(playSound = true) {
    // Clear auto-dial queue
    this.autoDialTimeoutIds.forEach(id => clearTimeout(id));
    this.autoDialTimeoutIds = [];

    if (playSound) {
      window.telemetryAudio.playDisengageSound();
    }

    this.activationState = 'IDLE';
    this.isDialingNode = false;
    this.activeAddress = [];
    this.dialedNodeIndices = [];

    // Reset UI keys
    document.querySelectorAll('.colony-key-btn').forEach(btn => {
      btn.classList.remove('selected', 'dialed');
    });

    // Reset Address Slots
    this.updateAddressSlots();
    this.updateConfidenceBar(0);

    // Reset Primary Activation Button
    const btnActivate = document.getElementById('btn-activate');
    if (btnActivate) {
      btnActivate.disabled = true;
      btnActivate.classList.remove('ready-to-activate', 'active-link');
    }

    this.updateStatusDisplay('STANDBY // BIO-ACOUSTIC ARRAY IDLE', 'idle');

    if (this.ringRenderer) {
      this.ringRenderer.setDialState([], null, 0, 'IDLE');
    }
  }

  // 8. Biosecurity Containment Hold Switch
  toggleBiosecurityHold() {
    this.biosecurityHoldEngaged = !this.biosecurityHoldEngaged;
    const card = document.getElementById('safety-toggle-card');
    const statusText = document.getElementById('safety-toggle-status-text');
    const banner = document.getElementById('biosecurity-warning-banner');

    if (this.biosecurityHoldEngaged) {
      window.telemetryAudio.playBiosecurityAlert();
      if (card) card.classList.add('engaged');
      if (statusText) statusText.textContent = 'ENGAGED (LOCKED)';
      if (banner) banner.classList.add('visible');
    } else {
      if (card) card.classList.remove('engaged');
      if (statusText) statusText.textContent = 'RELEASED (NORMAL)';
      if (banner) banner.classList.remove('visible');
    }
  }

  showBiosecurityBlockedWarning() {
    const banner = document.getElementById('biosecurity-warning-banner');
    if (banner) {
      banner.classList.add('visible');
      banner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    this.updateStatusDisplay('TRANSMISSION BLOCKED: BIOSECURITY CONTAINMENT HOLD ENGAGED', 'quarantine');
  }

  updateStatusDisplay(text, stateClass = 'idle') {
    const label = document.getElementById('system-status-label');
    const dot = document.getElementById('system-status-dot');
    if (label) label.textContent = text;
    if (dot) {
      dot.className = `status-dot ${stateClass}`;
    }
  }

  // 9. Modal Drawers Setup
  setupModalDrawers() {
    const modals = {
      'btn-open-colony-dashboard': 'modal-colony-dashboard',
      'btn-open-thermal-matrix': 'modal-thermal-matrix',
      'btn-open-swarm-radar': 'modal-swarm-radar',
      'btn-open-settings': 'modal-settings',
      'btn-open-help': 'modal-operator-guide'
    };

    Object.entries(modals).forEach(([btnId, modalId]) => {
      const btn = document.getElementById(btnId);
      const modal = document.getElementById(modalId);
      if (btn && modal) {
        btn.addEventListener('click', () => {
          modal.classList.add('open');
          // If thermal modal opened, init thermal canvas
          if (modalId === 'modal-thermal-matrix' && !this.thermalRenderer) {
            const c = document.getElementById('thermal-canvas');
            if (c) this.thermalRenderer = new window.ThermalCanvasRenderer(c);
          }
        });
      }
    });

    // Close buttons
    document.querySelectorAll('.btn-modal-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.telemetry-modal-backdrop');
        if (modal) modal.classList.remove('open');
      });
    });

    // Close on backdrop click
    document.querySelectorAll('.telemetry-modal-backdrop').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('open');
      });
    });
  }

  // 10. Settings & Real-time Uptime
  setupSettingsHandlers() {
    const volSlider = document.getElementById('setting-master-volume');
    if (volSlider) {
      volSlider.addEventListener('input', (e) => {
        window.telemetryAudio.setVolume(parseFloat(e.target.value));
      });
    }

    const muteToggle = document.getElementById('setting-mute-toggle');
    if (muteToggle) {
      muteToggle.addEventListener('change', () => {
        window.telemetryAudio.toggleMute();
      });
    }

    // Telemetry Uptime Counter in footer
    setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.sessionStartTime) / 1000);
      const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
      const s = (elapsed % 60).toString().padStart(2, '0');
      const elem = document.getElementById('footer-session-uptime');
      if (elem) elem.textContent = `UPTIME: ${m}:${s}`;
    }, 1000);
  }

  // 11. Subscribe to Live Telemetry Feed
  subscribeTelemetry() {
    if (!window.telemetryEngine) return;
    window.telemetryEngine.subscribe((engine) => {
      const tempEl = document.getElementById('hud-brood-temp');
      const weightEl = document.getElementById('hud-hive-weight');
      const trafficEl = document.getElementById('hud-entrance-traffic');
      const baroEl = document.getElementById('header-baro-pressure');

      if (tempEl) tempEl.textContent = `${engine.broodNestTemp.toFixed(2)}°C`;
      if (weightEl) weightEl.textContent = `${engine.hiveMassKg.toFixed(2)} kg`;
      if (trafficEl) trafficEl.textContent = `${engine.inboundTraffic} / ${engine.outboundTraffic}`;
      if (baroEl) baroEl.textContent = `${engine.barometricPressure.toFixed(1)} hPa`;
    });
  }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
  window.app = new TelemetryConsoleApp();
});
