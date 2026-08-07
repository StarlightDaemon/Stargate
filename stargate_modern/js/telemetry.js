/**
 * AERIS Live Telemetry & Subspace Physics Engine
 * Genuinely updating live telemetry metrics, capacitor charge state,
 * sparkline graphing, and in-universe Astraea flavor alerts.
 */

class AerisTelemetryEngine {
  constructor() {
    this.powerOnline = false;
    this.gateState = 'IDLE';

    // Metrics
    this.powerDraw = 4.2; // MW
    this.targetPowerDraw = 4.2;
    this.capacitorCharge = 100; // %
    this.vectorStability = 99.84; // %
    this.harmonicDelta = 0.002; // Hz
    this.manifoldTension = 101.3; // kPa
    this.containmentIntegrity = 100.0; // %
    this.cryoTemp = 18.2; // Kelvin

    // Sparkline History Buffer
    this.sparklineHistory = new Array(50).fill(99.8);
    this.sparklineCanvas = document.getElementById('telemetry-sparkline');
    this.sparklineCtx = this.sparklineCanvas ? this.sparklineCanvas.getContext('2d') : null;

    // Periodic flavor alerts
    this.flavorAlerts = [
      { text: 'Subspace carrier wave locked on 1420.405 MHz baseline.', type: 'info' },
      { text: 'Capacitor Bank 3 thermal cycle nominal at 18.2 K.', type: 'info' },
      { text: 'Perseus Sector subspace beacon ping verified (ACK-771).', type: 'info' },
      { text: 'Minor solar flare detected in Sector Cygnus; harmonic drift +0.02%.', type: 'warn' },
      { text: 'Magnetic containment coils operating at 4.8 Tesla.', type: 'info' },
      { text: 'Aperture frame alignment tolerances within 0.003 mm.', type: 'info' },
      { text: 'Quantum vacuum foam flux nominal; zero parasitic leakage.', type: 'info' }
    ];

    this.initSparkline();
    this.startLoop();
    this.startFlavorTimer();
  }

  initSparkline() {
    if (!this.sparklineCanvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = this.sparklineCanvas.getBoundingClientRect();
    this.sparklineCanvas.width = (rect.width || 220) * dpr;
    this.sparklineCanvas.height = (rect.height || 45) * dpr;
    if (this.sparklineCtx) {
      this.sparklineCtx.scale(dpr, dpr);
    }
  }

  setPower(online) {
    this.powerOnline = online;
    if (!online) {
      this.targetPowerDraw = 0.0;
      this.vectorStability = 0.0;
    } else {
      this.targetPowerDraw = 4.2;
      this.vectorStability = 99.84;
    }
  }

  setGateState(state) {
    this.gateState = state;
    switch (state) {
      case 'IDLE':
        this.targetPowerDraw = this.powerOnline ? 4.2 : 0.0;
        break;
      case 'ROTATING':
      case 'ALIGNING':
        this.targetPowerDraw = 18.6;
        break;
      case 'LOCKED':
        this.targetPowerDraw = 36.4;
        break;
      case 'IGNITING':
        this.targetPowerDraw = 142.8;
        break;
      case 'ACTIVE':
        this.targetPowerDraw = 84.2;
        break;
      case 'DISENGAGING':
        this.targetPowerDraw = 12.0;
        break;
    }
  }

  startLoop() {
    setInterval(() => {
      this.updatePhysics();
      this.updateDOM();
      this.renderSparkline();
    }, 120);
  }

  updatePhysics() {
    if (!this.powerOnline) {
      this.powerDraw += (0.0 - this.powerDraw) * 0.15;
      this.vectorStability += (0.0 - this.vectorStability) * 0.2;
      this.harmonicDelta = 0.0;
      this.manifoldTension = 101.3;
      return;
    }

    // Power draw smooth approach with realistic generator fluctuation
    const noise = (Math.random() - 0.5) * 0.3;
    this.powerDraw += (this.targetPowerDraw + noise - this.powerDraw) * 0.18;

    // Stability calculation
    if (this.gateState === 'ACTIVE') {
      this.vectorStability = 99.92 + (Math.random() - 0.5) * 0.08;
      this.manifoldTension = 452.4 + (Math.random() - 0.5) * 6.0;
      this.harmonicDelta = 0.001 + (Math.random() - 0.5) * 0.002;
      this.containmentIntegrity = 99.98 + (Math.random() - 0.5) * 0.04;
    } else if (this.gateState === 'IGNITING') {
      this.vectorStability = 94.2 + (Math.random() - 0.5) * 4.0;
      this.manifoldTension = 680.0 + (Math.random() - 0.5) * 20.0;
      this.harmonicDelta = 0.045 + (Math.random() - 0.5) * 0.02;
    } else if (this.gateState === 'ROTATING' || this.gateState === 'ALIGNING') {
      this.vectorStability = 98.6 + (Math.random() - 0.5) * 0.6;
      this.manifoldTension = 145.0 + (Math.random() - 0.5) * 5.0;
      this.harmonicDelta = 0.012 + (Math.random() - 0.5) * 0.005;
    } else {
      this.vectorStability = 99.84 + (Math.random() - 0.5) * 0.06;
      this.manifoldTension = 101.3 + (Math.random() - 0.5) * 0.4;
      this.harmonicDelta = 0.002 + (Math.random() - 0.5) * 0.001;
      this.containmentIntegrity = 100.0;
    }

    // Push to sparkline buffer
    this.sparklineHistory.push(this.vectorStability);
    if (this.sparklineHistory.length > 50) {
      this.sparklineHistory.shift();
    }
  }

  updateDOM() {
    const elPower = document.getElementById('tel-power-val');
    const elCap = document.getElementById('tel-cap-val');
    const elStab = document.getElementById('tel-stab-val');
    const elDelta = document.getElementById('tel-delta-val');
    const elTension = document.getElementById('tel-tension-val');
    const elCryo = document.getElementById('tel-cryo-val');

    if (elPower) elPower.textContent = `${this.powerDraw.toFixed(1)} MW`;
    if (elCap) elCap.textContent = `${this.capacitorCharge}%`;
    if (elStab) elStab.textContent = `${this.vectorStability.toFixed(2)}%`;
    if (elDelta) elDelta.textContent = `${this.harmonicDelta >= 0 ? '+' : ''}${this.harmonicDelta.toFixed(3)} Hz`;
    if (elTension) elTension.textContent = `${this.manifoldTension.toFixed(1)} kPa`;
    if (elCryo) elCryo.textContent = `${this.cryoTemp.toFixed(1)} K`;
  }

  renderSparkline() {
    if (!this.sparklineCtx || !this.sparklineCanvas) return;
    const ctx = this.sparklineCtx;
    const w = this.sparklineCanvas.width / (window.devicePixelRatio || 1);
    const h = this.sparklineCanvas.height / (window.devicePixelRatio || 1);

    ctx.clearRect(0, 0, w, h);

    // Background grid
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2);
    ctx.stroke();

    if (!this.powerOnline) return;

    // Plot line
    const data = this.sparklineHistory;
    const step = w / (data.length - 1);
    const minVal = 90;
    const maxVal = 100;

    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const norm = Math.max(0, Math.min(1, (data[i] - minVal) / (maxVal - minVal)));
      const x = i * step;
      const y = h - norm * (h - 6) - 3;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.strokeStyle = this.gateState === 'ACTIVE'
      ? '#00f0ff'
      : this.gateState === 'IGNITING'
      ? '#f43f5e'
      : '#38bdf8';
    ctx.lineWidth = 2;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 6;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  startFlavorTimer() {
    setInterval(() => {
      if (Math.random() > 0.4 && this.powerOnline) {
        const item = this.flavorAlerts[Math.floor(Math.random() * this.flavorAlerts.length)];
        this.showAlert(item.text, item.type);
      }
    }, 28000);
  }

  showAlert(msg, type = 'info') {
    const feed = document.getElementById('alerts-feed');
    if (!feed) return;

    const toast = document.createElement('div');
    toast.className = `alert-toast alert-${type}`;
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    toast.innerHTML = `
      <span class="alert-time">[${time}]</span>
      <span class="alert-msg">${msg}</span>
      <button class="alert-close" onclick="this.parentElement.remove()">✕</button>
    `;

    feed.prepend(toast);

    if (window.aerisHistory) {
      window.aerisHistory.log(type.toUpperCase(), msg);
    }

    // Auto dismiss after 10s
    setTimeout(() => {
      if (toast.parentElement) {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 400);
      }
    }, 10000);
  }
}

window.aerisTelemetry = new AerisTelemetryEngine();
