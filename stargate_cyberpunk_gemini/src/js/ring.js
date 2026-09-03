/**
 * Khepri Cipher Terminal - The Rotating Firewall ICE Barrier Ring
 * High-performance 2D Canvas & 3D Cyberspace Aperture Engine
 */

class CipherGateRing {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.width = 720;
    this.height = 720;
    this.cx = 360;
    this.cy = 360;

    // 7 Firewall ICE Layers
    this.layers = [
      { id: 1, radius: 110, angle: 0, speed: -0.008, segments: 4, destabilized: false, peelProgress: 0, name: 'APERTURE-IRIS' },
      { id: 2, radius: 145, angle: 0, speed: 0.006, segments: 6, destabilized: false, peelProgress: 0, name: 'QUANTUM-PARITY' },
      { id: 3, radius: 180, angle: 0, speed: -0.005, segments: 8, destabilized: false, peelProgress: 0, name: 'ASYMMETRIC-CIPHER' },
      { id: 4, radius: 220, angle: 0, speed: 0.004, segments: 12, destabilized: false, peelProgress: 0, name: 'POLYMORPHIC-KEY' },
      { id: 5, radius: 260, angle: 0, speed: -0.003, segments: 10, destabilized: false, peelProgress: 0, name: 'FLUX-FIREWALL' },
      { id: 6, radius: 300, angle: 0, speed: 0.0025, segments: 16, destabilized: false, peelProgress: 0, name: 'LATTICE-ROTOR' },
      { id: 7, radius: 340, angle: 0, speed: -0.002, segments: 18, destabilized: false, peelProgress: 0, name: 'PACKET-PERIMETER' }
    ];

    this.stage = 'idle'; // 'idle', 'pending', 'buildup', 'breakthrough', 'active'
    this.buildupProgress = 0;
    this.sparks = [];
    this.tunnelParticles = [];
    this.shockwaves = [];
    this.activeTime = 0;
    this.lastTime = performance.now();

    this.init();
  }

  init() {
    if (!this.canvas) return;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Seed tunnel particles for active state
    for (let i = 0; i < 70; i++) {
      this.tunnelParticles.push({
        x: (Math.random() - 0.5) * 400,
        y: (Math.random() - 0.5) * 400,
        z: Math.random() * 800 + 10,
        speed: Math.random() * 8 + 4,
        char: ['0', '1', 'F', 'X', 'A', '9', 'C', 'Q'][Math.floor(Math.random() * 8)],
        color: Math.random() > 0.3 ? '#00ff9d' : '#00e1ff'
      });
    }

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  setLayerDestabilized(index, destabilized = true) {
    if (index >= 0 && index < this.layers.length) {
      this.layers[index].destabilized = destabilized;
      if (destabilized) {
        // Emit sparks at this layer's radius
        const r = this.layers[index].radius;
        for (let i = 0; i < 28; i++) {
          const theta = Math.random() * Math.PI * 2;
          this.sparks.push({
            x: this.cx + Math.cos(theta) * r,
            y: this.cy + Math.sin(theta) * r,
            vx: (Math.random() - 0.5) * 5 + Math.cos(theta) * 2,
            vy: (Math.random() - 0.5) * 5 + Math.sin(theta) * 2,
            life: 1.0,
            decay: Math.random() * 0.03 + 0.02,
            color: Math.random() > 0.5 ? '#ffffff' : '#00ff9d'
          });
        }
      }
    }
  }

  resetAllLayers() {
    this.layers.forEach(layer => {
      layer.destabilized = false;
      layer.peelProgress = 0;
    });
    this.stage = 'idle';
    this.buildupProgress = 0;
    this.sparks = [];
    this.shockwaves = [];
  }

  setStage(newStage) {
    this.stage = newStage;
    if (newStage === 'breakthrough') {
      // Trigger shockwave
      this.shockwaves.push({ radius: 20, maxRadius: 360, alpha: 1.0, speed: 12 });
      this.shockwaves.push({ radius: 10, maxRadius: 300, alpha: 0.8, speed: 9 });
      
      // Massive spark blast
      for (let i = 0; i < 90; i++) {
        const theta = Math.random() * Math.PI * 2;
        const v = Math.random() * 12 + 4;
        this.sparks.push({
          x: this.cx,
          y: this.cy,
          vx: Math.cos(theta) * v,
          vy: Math.sin(theta) * v,
          life: 1.0,
          decay: Math.random() * 0.02 + 0.015,
          color: Math.random() > 0.4 ? '#ffffff' : '#00e1ff'
        });
      }
    }
  }

  animate(now) {
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;
    this.activeTime += dt;

    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.width, this.height);
      this.updatePhysics(dt);
      this.render();
    }

    requestAnimationFrame(this.animate);
  }

  updatePhysics(dt) {
    // Determine speed multiplier based on stage
    let speedMult = 1.0;
    if (this.stage === 'buildup') {
      speedMult = 1.0 + (this.buildupProgress * 6.5);
    } else if (this.stage === 'breakthrough') {
      speedMult = 9.0;
    } else if (this.stage === 'active') {
      speedMult = 2.2;
    }

    // Update ring angles & layer peel progress
    this.layers.forEach((layer) => {
      layer.angle += layer.speed * speedMult;

      if (layer.destabilized) {
        layer.peelProgress = Math.min(layer.peelProgress + dt * 2.2, 1.0);
      } else {
        layer.peelProgress = Math.max(layer.peelProgress - dt * 2.5, 0.0);
      }
    });

    // Update sparks
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.x += s.vx;
      s.y += s.vy;
      s.life -= s.decay;
      if (s.life <= 0) {
        this.sparks.splice(i, 1);
      }
    }

    // Update shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += sw.speed;
      sw.alpha = Math.max(0, 1.0 - (sw.radius / sw.maxRadius));
      if (sw.radius >= sw.maxRadius || sw.alpha <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }

    // Update tunnel particles for active state
    if (this.stage === 'active') {
      this.tunnelParticles.forEach((p) => {
        p.z -= p.speed * 20 * dt;
        if (p.z <= 10) {
          p.z = 800;
          p.x = (Math.random() - 0.5) * 400;
          p.y = (Math.random() - 0.5) * 400;
        }
      });
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.save();

    // 1. Central Cyberspace Aperture Core (Tunnel when Active)
    this.renderApertureCore(ctx);

    // 2. Render the 7 Rotating ICE Barrier Rings
    this.renderFirewallRings(ctx);

    // 3. Render Shockwaves
    this.renderShockwaves(ctx);

    // 4. Render Particle Sparks
    this.renderSparks(ctx);

    // 5. Render Reticles & Locking Ticks
    this.renderReticles(ctx);

    ctx.restore();
  }

  renderApertureCore(ctx) {
    const apertureRadius = this.layers[0].radius;

    ctx.save();
    ctx.beginPath();
    ctx.arc(this.cx, this.cy, apertureRadius, 0, Math.PI * 2);
    ctx.clip();

    // Deep background void
    ctx.fillStyle = '#02060b';
    ctx.fillRect(this.cx - apertureRadius, this.cy - apertureRadius, apertureRadius * 2, apertureRadius * 2);

    if (this.stage === 'active') {
      // Perspective Cyberspace Tunnel
      const fov = 180;
      this.tunnelParticles.forEach((p) => {
        const scale = fov / (fov + p.z);
        const px = this.cx + p.x * scale;
        const py = this.cy + p.y * scale;

        if (px >= this.cx - apertureRadius && px <= this.cx + apertureRadius &&
            py >= this.cy - apertureRadius && py <= this.cy + apertureRadius) {
          ctx.font = `${Math.max(8, Math.floor(14 * scale))}px monospace`;
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.min(1.0, (1.0 - p.z / 800) * 1.5);
          ctx.fillText(p.char, px, py);
        }
      });

      // Swirling center light vortex
      const grad = ctx.createRadialGradient(this.cx, this.cy, 5, this.cx, this.cy, apertureRadius);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
      grad.addColorStop(0.3, 'rgba(0, 225, 255, 0.4)');
      grad.addColorStop(0.7, 'rgba(0, 255, 157, 0.2)');
      grad.addColorStop(1, 'rgba(2, 6, 11, 0.8)');
      ctx.fillStyle = grad;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(this.cx, this.cy, apertureRadius, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.stage === 'buildup') {
      // Swirling buildup energy
      const pRatio = this.buildupProgress;
      const grad = ctx.createRadialGradient(this.cx, this.cy, 0, this.cx, this.cy, apertureRadius);
      grad.addColorStop(0, `rgba(255, 255, 255, ${0.4 + pRatio * 0.5})`);
      grad.addColorStop(0.5, `rgba(0, 225, 255, ${0.2 + pRatio * 0.4})`);
      grad.addColorStop(1, 'rgba(2, 6, 11, 0.9)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.cx, this.cy, apertureRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  renderFirewallRings(ctx) {
    this.layers.forEach((layer) => {
      const r = layer.radius;
      const segs = layer.segments;
      const segAngle = (Math.PI * 2) / segs;
      const peel = layer.peelProgress;

      ctx.save();
      ctx.translate(this.cx, this.cy);
      ctx.rotate(layer.angle);

      for (let s = 0; s < segs; s++) {
        const startA = s * segAngle + (peel * 0.15); // Gap widens as layer destabilizes
        const endA = (s + 1) * segAngle - (0.08 + peel * 0.25);

        ctx.beginPath();
        ctx.arc(0, 0, r, startA, endA);

        if (layer.destabilized) {
          // Destabilized, peeled barrier look
          const flash = Math.sin(this.activeTime * 8 + s) * 0.2;
          ctx.strokeStyle = `rgba(0, 225, 255, ${0.6 + flash + peel * 0.3})`;
          ctx.lineWidth = 3 + peel * 3;
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 8 + peel * 12;
        } else {
          // Stable intact ICE barrier segment
          ctx.strokeStyle = 'rgba(0, 255, 157, 0.35)';
          ctx.lineWidth = 2;
          ctx.shadowColor = '#00ff9d';
          ctx.shadowBlur = 4;
        }

        ctx.stroke();

        // Little sector notch ticks at arc boundaries
        const tickX = Math.cos(startA) * r;
        const tickY = Math.sin(startA) * r;
        ctx.fillStyle = layer.destabilized ? '#ffffff' : 'rgba(0, 255, 157, 0.6)';
        ctx.beginPath();
        ctx.arc(tickX, tickY, layer.destabilized ? 2.5 : 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }

  renderShockwaves(ctx) {
    this.shockwaves.forEach((sw) => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.cx, this.cy, sw.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 255, 255, ${sw.alpha})`;
      ctx.lineWidth = 4 * sw.alpha;
      ctx.shadowColor = '#00e1ff';
      ctx.shadowBlur = 18;
      ctx.stroke();
      ctx.restore();
    });
  }

  renderSparks(ctx) {
    this.sparks.forEach((s) => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.life * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.globalAlpha = s.life;
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.restore();
    });
  }

  renderReticles(ctx) {
    ctx.save();
    ctx.translate(this.cx, this.cy);

    // Subtle crosshair lines
    ctx.strokeStyle = 'rgba(0, 255, 157, 0.12)';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(-350, 0); ctx.lineTo(-120, 0);
    ctx.moveTo(120, 0); ctx.lineTo(350, 0);
    ctx.moveTo(0, -350); ctx.lineTo(0, -120);
    ctx.moveTo(0, 120); ctx.lineTo(0, 350);
    ctx.stroke();

    // 4 Corner Alignment brackets
    const bracketSize = 25;
    const bOffset = 330;
    const corners = [
      { x: bOffset, y: bOffset, sx: -1, sy: -1 },
      { x: -bOffset, y: bOffset, sx: 1, sy: -1 },
      { x: bOffset, y: -bOffset, sx: -1, sy: 1 },
      { x: -bOffset, y: -bOffset, sx: 1, sy: 1 }
    ];

    ctx.strokeStyle = 'rgba(0, 255, 157, 0.35)';
    ctx.lineWidth = 1.5;
    corners.forEach(c => {
      ctx.beginPath();
      ctx.moveTo(c.x, c.y + c.sy * bracketSize);
      ctx.lineTo(c.x, c.y);
      ctx.lineTo(c.x + c.sx * bracketSize, c.y);
      ctx.stroke();
    });

    ctx.restore();
  }
}

// Global Export
window.CipherGateRing = CipherGateRing;
