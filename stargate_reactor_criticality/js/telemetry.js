/**
 * TX-77 'AURA' Fast-Neutron Annular Resonator
 * Live Telemetry Subsystem, Xenon Tracker & Axial Cross-Section Renderer
 */

class TelemetrySubsystem {
  constructor() {
    this.xenonCanvas = document.getElementById('xenon-curve-canvas');
    this.xenonCtx = this.xenonCanvas ? this.xenonCanvas.getContext('2d') : null;

    this.csCanvas = document.getElementById('cross-section-canvas');
    this.csCtx = this.csCanvas ? this.csCanvas.getContext('2d') : null;

    this.logStreamEl = document.getElementById('event-log-stream');
    this.setupLogging();
  }

  setupLogging() {
    this.addLog('SYSTEM BOOT', 'TX-77 AURA Fast-Neutron Resonator HMI online.', 'success');
    this.addLog('PHYSICS ENGINE', 'Point kinetics initialized. Baseline k_eff = 0.75000.', 'info');
    this.addLog('RPS SAFETY', 'Reactor Protection System Hold: RELEASED (Clear).', 'info');
  }

  addLog(tag, msg, type = 'info') {
    if (!this.logStreamEl) return;
    const timeStr = new Date().toTimeString().split(' ')[0] + '.' + Math.floor(Date.now() % 1000 / 100);
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `
      <span class="log-time">[${timeStr}]</span>
      <span class="log-tag ${type}">[${tag}]</span>
      <span class="log-msg">${msg}</span>
    `;
    this.logStreamEl.appendChild(entry);
    this.logStreamEl.scrollTop = this.logStreamEl.scrollHeight;
  }

  update(physics) {
    // 1. Header Displays
    const keffDisplay = document.getElementById('header-keff-display');
    if (keffDisplay) keffDisplay.textContent = physics.keff.toFixed(4);

    const powerDisplay = document.getElementById('header-power-display');
    if (powerDisplay) {
      if (physics.thermalPowerMw >= 1.0) {
        powerDisplay.innerHTML = `${physics.thermalPowerMw.toFixed(1)} <span class="unit">MWth</span>`;
      } else {
        powerDisplay.innerHTML = `${physics.thermalPowerMw.toFixed(3)} <span class="unit">MWth</span>`;
      }
    }

    const statusText = document.getElementById('status-text');
    const statusBeacon = document.getElementById('status-beacon');
    if (statusText && statusBeacon) {
      if (physics.state === 'SUBCRITICAL') {
        statusText.textContent = 'SUBCRITICAL STANDBY';
        statusText.style.color = 'var(--accent-cyan)';
        statusBeacon.style.background = 'var(--accent-green)';
        statusBeacon.style.boxShadow = '0 0 8px var(--accent-green)';
      } else if (physics.state === 'PENDING') {
        statusText.textContent = 'PENDING CRITICALITY';
        statusText.style.color = 'var(--accent-amber)';
        statusBeacon.style.background = 'var(--accent-amber)';
        statusBeacon.style.boxShadow = '0 0 10px var(--accent-amber)';
      } else if (physics.state === 'BUILDUP') {
        statusText.textContent = 'REACTIVITY BUILDUP';
        statusText.style.color = 'var(--accent-amber)';
        statusBeacon.style.background = 'var(--accent-amber)';
        statusBeacon.style.boxShadow = '0 0 12px var(--accent-amber)';
      } else if (physics.state === 'BREAKTHROUGH') {
        statusText.textContent = 'PROMPT BREAKTHROUGH';
        statusText.style.color = '#ffffff';
        statusBeacon.style.background = '#00f0ff';
        statusBeacon.style.boxShadow = '0 0 15px #00f0ff';
      } else if (physics.state === 'SUSTAINED') {
        statusText.textContent = 'SUSTAINED CRITICAL';
        statusText.style.color = 'var(--accent-green)';
        statusBeacon.style.background = 'var(--accent-green)';
        statusBeacon.style.boxShadow = '0 0 14px var(--accent-green)';
      }
    }

    // 2. Alignment Ribbon Slots (6 Slots)
    const progressText = document.getElementById('alignment-progress-text');
    if (progressText) {
      progressText.textContent = `CALIBRATED: ${physics.selectedSequence.length} / ${physics.maxAddressLength} CHANNELS`;
    }

    for (let s = 0; s < physics.maxAddressLength; s++) {
      const slotEl = document.getElementById(`slot-${s}`);
      if (!slotEl) continue;

      if (s < physics.selectedSequence.length) {
        const ch = physics.selectedSequence[s];
        slotEl.className = 'address-slot calibrated';
        slotEl.querySelector('.slot-symbol').textContent = ch.symbol;
        slotEl.querySelector('.slot-depth').textContent = `${ch.targetDepth.toFixed(1)}%`;
        slotEl.querySelector('.slot-flux-status').textContent = 'CALIBRATED';
      } else {
        slotEl.className = 'address-slot';
        slotEl.querySelector('.slot-symbol').textContent = '--';
        slotEl.querySelector('.slot-depth').textContent = '0.0%';
        slotEl.querySelector('.slot-flux-status').textContent = 'OFFLINE';
      }
    }

    // 3. Canvas HUD Overlays
    const hudCherenkov = document.getElementById('hud-cherenkov-level');
    if (hudCherenkov) {
      const cd = (physics.cherenkovIntensity * 12.5).toFixed(2);
      hudCherenkov.textContent = `SPECTRAL EMISSION: ${cd} cd`;
    }

    const hudKeff = document.getElementById('hud-keff-detail');
    if (hudKeff) {
      hudKeff.textContent = `k_eff = ${physics.keff.toFixed(5)} [${physics.state}]`;
    }

    const hudReactivity = document.getElementById('hud-reactivity-pcm');
    if (hudReactivity) {
      hudReactivity.textContent = `ρ = ${physics.reactivityPcm.toLocaleString()} pcm`;
    }

    // 4. Tab 1: Telemetry Values & Bars
    const tempEl = document.getElementById('t-temp-in-out');
    if (tempEl) tempEl.textContent = `${physics.tempInlet.toFixed(1)}°C / ${physics.tempOutlet.toFixed(1)}°C`;
    const tempBar = document.getElementById('bar-temp');
    if (tempBar) tempBar.style.width = `${((physics.tempOutlet - 250) / 100) * 100}%`;

    const flowEl = document.getElementById('t-coolant-flow');
    if (flowEl) flowEl.innerHTML = `${Math.round(physics.coolantFlow).toLocaleString()} <span class="t-unit">kg/s</span>`;
    const flowBar = document.getElementById('bar-flow');
    if (flowBar) flowBar.style.width = `${(physics.coolantFlow / 20000) * 100}%`;

    const pressEl = document.getElementById('t-pressure');
    if (pressEl) pressEl.innerHTML = `${physics.primaryPressure.toFixed(1)} <span class="t-unit">bar</span>`;
    const pressBar = document.getElementById('bar-pressure');
    if (pressBar) pressBar.style.width = `${(physics.primaryPressure / 180) * 100}%`;

    // 5. Render Secondary Canvases
    this.renderXenonChart(physics);
    this.renderCrossSection(physics);
  }

  renderXenonChart(physics) {
    if (!this.xenonCtx || !this.xenonCanvas) return;
    const ctx = this.xenonCtx;
    const w = this.xenonCanvas.width;
    const h = this.xenonCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = 'rgba(0, 180, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let y = 20; y < h; y += 30) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    for (let x = 40; x < w; x += 60) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }

    const history = physics.xenonHistory;
    if (history.length < 2) return;

    // Draw Iodine curve (Cyan)
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    history.forEach((pt, idx) => {
      const px = (idx / (history.length - 1)) * (w - 20) + 10;
      const py = h - 20 - ((pt.iodine - 1e12) / 2e14) * (h - 40);
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();

    // Draw Xenon-135 Poisoning curve (Amber)
    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    history.forEach((pt, idx) => {
      const px = (idx / (history.length - 1)) * (w - 20) + 10;
      const py = h - 20 - ((pt.xenon - 1e12) / 5e13) * (h - 40);
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();

    // Draw Power History (Green dotted)
    ctx.strokeStyle = '#00ff88';
    ctx.setLineDash([4, 3]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    history.forEach((pt, idx) => {
      const px = (idx / (history.length - 1)) * (w - 20) + 10;
      const py = h - 20 - (pt.power / 450) * (h - 40);
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
    ctx.setLineDash([]);
  }

  renderCrossSection(physics) {
    if (!this.csCtx || !this.csCanvas) return;
    const ctx = this.csCtx;
    const w = this.csCanvas.width;
    const h = this.csCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // Vessel Boundaries
    ctx.strokeStyle = 'rgba(0, 180, 255, 0.4)';
    ctx.strokeRect(30, 15, w - 60, h - 30);

    // Fuel Pins Lattice (vertical lines)
    const pinCount = 18;
    const pinSpacing = (w - 90) / pinCount;
    for (let p = 0; p < pinCount; p++) {
      const px = 45 + p * pinSpacing;
      ctx.strokeStyle = physics.state === 'SUSTAINED' ? 'rgba(0, 229, 255, 0.6)' : 'rgba(0, 140, 200, 0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, 25);
      ctx.lineTo(px, h - 25);
      ctx.stroke();
    }

    // Control Rods (Vertical blades inserting from top)
    const rodCount = 10;
    const rodSpacing = (w - 100) / rodCount;
    physics.channels.forEach((ch, idx) => {
      const rx = 50 + idx * rodSpacing;
      const insertion = 1.0 - (ch.currentDepth / 100.0); // 1 = fully inserted (down), 0 = fully withdrawn (up)
      const rodHeight = 25 + insertion * (h - 50);

      // Rod blade
      ctx.fillStyle = ch.isCalibrated ? '#00e5ff' : (ch.isCalibrating ? '#ffaa00' : '#88aacc');
      ctx.fillRect(rx - 3, 20, 6, rodHeight - 20);

      // Tip
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(rx, rodHeight, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Axial Cosine Flux Curve (Cyan overlay)
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 30; x <= w - 30; x += 4) {
      const normX = (x - 30) / (w - 60);
      const fluxAmplitude = (physics.thermalPowerMw / 420.0) * (h - 60);
      const fy = (h / 2) - Math.sin(normX * Math.PI) * Math.max(10, fluxAmplitude / 2);
      if (x === 30) ctx.moveTo(x, fy);
      else ctx.lineTo(x, fy);
    }
    ctx.stroke();
  }
}

window.TelemetrySubsystem = TelemetrySubsystem;
