/**
 * AERIS Aperture Containment Shield / Iris Subsystem
 * High-grade 12-blade titanium mechanical diaphragm shield with safety interlocks.
 */

class AerisContainmentIris {
  constructor(canvasContainerId) {
    this.container = document.getElementById(canvasContainerId);
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.className = 'iris-canvas-overlay';
    this.container.appendChild(this.canvas);

    this.state = 'OPEN'; // 'OPEN', 'CLOSING', 'SEALED', 'OPENING'
    this.openProgress = 1.0; // 1.0 = fully open (retracted), 0.0 = fully sealed
    this.targetProgress = 1.0;
    this.bladeCount = 12;

    this.width = 720;
    this.height = 720;
    this.apertureRadius = 210;

    this.initCanvas();
    this.bindEvents();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.container.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height) || 720;

    this.width = size;
    this.height = size;
    this.canvas.width = size * dpr;
    this.canvas.height = size * dpr;
    this.canvas.style.width = `${size}px`;
    this.canvas.style.height = `${size}px`;
    this.ctx.scale(dpr, dpr);

    this.apertureRadius = size * 0.285;
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.initCanvas();
    });
  }

  toggle() {
    if (this.state === 'OPEN' || this.state === 'OPENING') {
      this.seal();
    } else {
      this.open();
    }
  }

  seal() {
    if (this.state === 'SEALED' || this.state === 'CLOSING') return;
    this.state = 'CLOSING';
    this.targetProgress = 0.0;
    if (window.aerisAudio) {
      window.aerisAudio.playIrisActuate(true);
    }
    if (window.aerisHistory) {
      window.aerisHistory.log('SHIELD', 'Containment Iris SEAL sequence initiated by operator.');
    }
  }

  open() {
    if (this.state === 'OPEN' || this.state === 'OPENING') return;
    this.state = 'OPENING';
    this.targetProgress = 1.0;
    if (window.aerisAudio) {
      window.aerisAudio.playIrisActuate(false);
    }
    if (window.aerisHistory) {
      window.aerisHistory.log('SHIELD', 'Containment Iris RETRACT sequence initiated by operator.');
    }
  }

  isSealed() {
    return this.openProgress < 0.1;
  }

  isOpen() {
    return this.openProgress > 0.9;
  }

  animate(timestamp) {
    this.ctx.clearRect(0, 0, this.width, this.height);

    const cx = this.width / 2;
    const cy = this.height / 2;
    const r = this.apertureRadius;

    // Smooth mechanical interpolation
    const speed = 0.045;
    if (this.state === 'CLOSING') {
      this.openProgress = Math.max(0.0, this.openProgress - speed);
      if (this.openProgress <= 0.0) {
        this.state = 'SEALED';
      }
    } else if (this.state === 'OPENING') {
      this.openProgress = Math.min(1.0, this.openProgress + speed);
      if (this.openProgress >= 1.0) {
        this.state = 'OPEN';
      }
    }

    // Only render blades if partially or fully closed
    if (this.openProgress < 0.99) {
      this.renderBlades(cx, cy, r);
    }

    requestAnimationFrame(this.animate);
  }

  renderBlades(cx, cy, r) {
    const ctx = this.ctx;
    const blades = this.bladeCount;
    const angleStep = (Math.PI * 2) / blades;

    ctx.save();
    // Clip strictly to aperture circle
    ctx.beginPath();
    ctx.arc(cx, cy, r - 2, 0, Math.PI * 2);
    ctx.clip();

    // Iris rotation based on progress (blades rotate as they slide inward)
    const irisRotation = (1 - this.openProgress) * 0.45;

    // Render each overlapping titanium blade
    for (let i = 0; i < blades; i++) {
      const baseAngle = i * angleStep + irisRotation;

      // Retracted blade offset
      const bladeSlide = (1 - this.openProgress) * r * 1.15;
      const pivotDist = r * 1.05;
      const px = cx + Math.cos(baseAngle) * pivotDist;
      const py = cy + Math.sin(baseAngle) * pivotDist;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(baseAngle + Math.PI / 2 + (1 - this.openProgress) * 0.5);

      // Blade polygon geometry
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(r * 1.3, -r * 0.4);
      ctx.lineTo(r * 1.4, r * 0.8);
      ctx.lineTo(0, r * 0.9);
      ctx.closePath();

      // Metallic blade gradient
      const bladeGrad = ctx.createLinearGradient(0, 0, r * 1.3, r * 0.8);
      bladeGrad.addColorStop(0, '#1e293b');
      bladeGrad.addColorStop(0.3, '#334155');
      bladeGrad.addColorStop(0.6, '#0f172a');
      bladeGrad.addColorStop(1, '#020617');
      ctx.fillStyle = bladeGrad;
      ctx.fill();

      // Blade edge highlight
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Rivet / Pivot bolt
      ctx.beginPath();
      ctx.arc(10, 10, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#64748b';
      ctx.fill();

      ctx.restore();
    }

    // Center interlocking seal hub
    if (this.openProgress < 0.15) {
      const sealAlpha = (0.15 - this.openProgress) / 0.15;
      ctx.beginPath();
      ctx.arc(cx, cy, 18, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(15, 23, 42, ${sealAlpha * 0.9})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(244, 63, 94, ${sealAlpha * 0.8})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Center lock icon
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(244, 63, 94, ${sealAlpha})`;
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }
}

window.AerisContainmentIris = AerisContainmentIris;
