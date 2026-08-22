/**
 * VXD-9000 Fulldome Projection Canvas Engine
 * High-resolution celestial starfield, volumetric nebulae, and laser fisheye simulation
 */

class FulldomeEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.width = 1920;
    this.height = 1080;
    this.centerX = 1920 / 2;
    this.centerY = 1080 / 2;

    this.state = 'IDLE'; // IDLE, DIALING, PENDING, BUILDUP, BREAKTHROUGH, ACTIVE
    this.buildupProgress = 0;
    this.activeIntensity = 0;
    this.rotationAngle = 0;

    this.stars = [];
    this.nebulae = [];
    this.meteors = [];
    this.lockedGlyphVectors = [];

    this.initStars(2500);
    this.initNebulae();
    this.startLoop();
  }

  initStars(count) {
    this.stars = [];
    const colors = [
      '#ffffff', '#ffffff', '#e0f7ff', '#b3ecff', // O/B Blue-White
      '#fff4e6', '#ffd280', // F/G Yellow-White
      '#ffaa5e', '#ff6b6b', // K/M Orange-Red
      '#00f0ff', '#9d4edd'  // Projector Laser Markers
    ];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.sqrt(Math.random()) * 850; // Hemispherical distribution
      const size = Math.random() < 0.9 ? Math.random() * 1.5 + 0.5 : Math.random() * 2.5 + 2.0;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const twinkleSpeed = Math.random() * 0.05 + 0.02;
      const twinkleOffset = Math.random() * Math.PI * 2;

      this.stars.push({
        x: this.centerX + Math.cos(angle) * radius,
        y: this.centerY + Math.sin(angle) * radius,
        baseX: this.centerX + Math.cos(angle) * radius,
        baseY: this.centerY + Math.sin(angle) * radius,
        angle,
        radius,
        size,
        color,
        twinkleSpeed,
        twinkleOffset,
        spectral: Math.random()
      });
    }
  }

  initNebulae() {
    this.nebulae = [
      { x: this.centerX - 240, y: this.centerY - 180, r: 420, color: 'rgba(0, 240, 255, ' },
      { x: this.centerX + 320, y: this.centerY + 160, r: 480, color: 'rgba(157, 78, 221, ' },
      { x: this.centerX - 100, y: this.centerY + 280, r: 350, color: 'rgba(255, 183, 0, ' },
      { x: this.centerX + 200, y: this.centerY - 220, r: 390, color: 'rgba(0, 255, 136, ' }
    ];
  }

  setState(state, extra = {}) {
    this.state = state;
    if (extra.lockedVectors) {
      this.lockedGlyphVectors = extra.lockedVectors;
    }
    if (state === 'BUILDUP') {
      this.buildupProgress = 0;
    }
  }

  setBuildupProgress(p) {
    this.buildupProgress = Math.max(0, Math.min(1, p));
  }

  spawnMeteor() {
    if (this.meteors.length > 5) return;
    const startX = Math.random() * this.width;
    const startY = Math.random() * (this.height * 0.5);
    const length = Math.random() * 150 + 100;
    const angle = (Math.random() * 45 + 30) * Math.PI / 180;
    const speed = Math.random() * 20 + 15;

    this.meteors.push({
      x: startX,
      y: startY,
      length,
      angle,
      speed,
      life: 1.0,
      decay: Math.random() * 0.03 + 0.02
    });
  }

  startLoop() {
    let lastTime = performance.now();

    const frame = (time) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      this.update(dt);
      this.render();

      requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);
  }

  update(dt) {
    this.rotationAngle += 0.02 * dt;

    if (this.state === 'ACTIVE') {
      this.activeIntensity = Math.min(1, this.activeIntensity + dt * 1.5);
      if (Math.random() < 0.06) {
        this.spawnMeteor();
      }
    } else {
      this.activeIntensity = Math.max(0, this.activeIntensity - dt * 2.0);
    }

    // Update meteors
    for (let i = this.meteors.length - 1; i >= 0; i--) {
      const m = this.meteors[i];
      m.x += Math.cos(m.angle) * m.speed;
      m.y += Math.sin(m.angle) * m.speed;
      m.life -= m.decay;
      if (m.life <= 0) {
        this.meteors.splice(i, 1);
      }
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    const isBuildup = this.state === 'BUILDUP';
    const isBreakthrough = this.state === 'BREAKTHROUGH';
    const isActive = this.state === 'ACTIVE';

    // 1. Nebulae Glow in Active / Breakthrough
    if (this.activeIntensity > 0 || isBreakthrough) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      this.nebulae.forEach(neb => {
        const alpha = (this.activeIntensity * 0.18);
        const grad = ctx.createRadialGradient(neb.x, neb.y, 10, neb.x, neb.y, neb.r);
        grad.addColorStop(0, neb.color + alpha + ')');
        grad.addColorStop(0.5, neb.color + (alpha * 0.4) + ')');
        grad.addColorStop(1, neb.color + '0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(neb.x, neb.y, neb.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    // 2. Celestial Coordinate Grid Lines (When Active / Pending)
    if (this.activeIntensity > 0 || this.state === 'PENDING') {
      ctx.save();
      ctx.strokeStyle = `rgba(0, 240, 255, ${this.activeIntensity * 0.2 + 0.05})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);

      // Concentric Declination Circles
      [180, 320, 460, 600, 740].forEach(r => {
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Hour Angle Radial Meridians
      for (let a = 0; a < 12; a++) {
        const rad = (a * 30 * Math.PI / 180) + this.rotationAngle * 0.2;
        ctx.beginPath();
        ctx.moveTo(this.centerX + Math.cos(rad) * 100, this.centerY + Math.sin(rad) * 100);
        ctx.lineTo(this.centerX + Math.cos(rad) * 800, this.centerY + Math.sin(rad) * 800);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 3. Render 2,500+ Multi-Spectral Stars
    ctx.save();
    const now = performance.now() * 0.001;

    this.stars.forEach(star => {
      let x = star.baseX;
      let y = star.baseY;
      let size = star.size;
      let alpha = 0.4 + Math.sin(now * star.twinkleSpeed * 30 + star.twinkleOffset) * 0.3;

      if (isActive) {
        alpha = Math.min(1.0, alpha + 0.4);
        size *= 1.2;
      } else if (isBuildup) {
        // Warp acceleration effect during buildup
        const distFromCenter = Math.hypot(x - this.centerX, y - this.centerY);
        const streak = distFromCenter * this.buildupProgress * 0.15;
        const angle = Math.atan2(y - this.centerY, x - this.centerX);
        
        ctx.strokeStyle = star.color;
        ctx.lineWidth = size * 0.8;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(angle) * streak, y + Math.sin(angle) * streak);
        ctx.stroke();
        return;
      }

      ctx.fillStyle = star.color;
      ctx.globalAlpha = Math.max(0.1, Math.min(1, alpha));
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // 4. Locked Vector Constellation Lines (Connecting dialed sectors)
    if (this.lockedGlyphVectors.length > 1) {
      ctx.save();
      ctx.strokeStyle = isActive ? 'rgba(0, 240, 255, 0.7)' : 'rgba(255, 183, 0, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.shadowColor = isActive ? '#00f0ff' : '#ffb700';
      ctx.shadowBlur = 10;

      ctx.beginPath();
      for (let i = 0; i < this.lockedGlyphVectors.length; i++) {
        const v = this.lockedGlyphVectors[i];
        if (i === 0) ctx.moveTo(v.x, v.y);
        else ctx.lineTo(v.x, v.y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 5. Meteors Rendering (Active state)
    if (this.meteors.length > 0) {
      ctx.save();
      this.meteors.forEach(m => {
        const tailX = m.x - Math.cos(m.angle) * m.length;
        const tailY = m.y - Math.sin(m.angle) * m.length;

        const grad = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
        grad.addColorStop(0, `rgba(255, 255, 255, ${m.life})`);
        grad.addColorStop(0.3, `rgba(0, 240, 255, ${m.life * 0.8})`);
        grad.addColorStop(1, 'rgba(0, 240, 255, 0)');

        ctx.strokeStyle = grad;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();

        // Meteor Head Sparkle
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(m.x, m.y, 2, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    // 6. Breakthrough Lens Flare Burst
    if (isBreakthrough) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const grad = ctx.createRadialGradient(this.centerX, this.centerY, 10, this.centerX, this.centerY, 700);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      grad.addColorStop(0.2, 'rgba(0, 240, 255, 0.8)');
      grad.addColorStop(0.6, 'rgba(157, 78, 221, 0.35)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, 700, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

window.FulldomeEngine = FulldomeEngine;
