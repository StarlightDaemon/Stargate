/**
 * TX-77 'AURA' Annular Fast-Neutron Resonator
 * Core Vector Scope & Dynamic Flux Diffusion Renderer (Canvas 2D)
 */

class CoreCanvasRenderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.centerX = this.width / 2;
    this.centerY = this.height / 2;

    this.outerRadius = 240;
    this.fuelOuterRadius = 220;
    this.fuelInnerRadius = 120;
    this.apertureRadius = 100;

    this.rotAngle = 0;
    this.shockwaveRadius = 0;
    this.particles = [];
    this.initParticles();

    this.onChannelClick = null;
    this.setupInteraction();
  }

  initParticles() {
    this.particles = [];
    for (let i = 0; i < 70; i++) {
      this.particles.push({
        r: this.fuelInnerRadius + Math.random() * (this.fuelOuterRadius - this.fuelInnerRadius),
        theta: Math.random() * Math.PI * 2,
        speed: 0.005 + Math.random() * 0.015,
        size: 1 + Math.random() * 2,
        alpha: 0.2 + Math.random() * 0.6
      });
    }
  }

  setupInteraction() {
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const mouseX = (e.clientX - rect.left) * scaleX;
      const mouseY = (e.clientY - rect.top) * scaleY;

      const dx = mouseX - this.centerX;
      const dy = mouseY - this.centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      let angleDeg = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;

      // Check click on radial channel nodes
      if (dist >= this.fuelInnerRadius - 20 && dist <= this.outerRadius + 30) {
        window.reactorPhysics.channels.forEach(ch => {
          let diff = Math.abs(ch.angle - angleDeg);
          if (diff > 180) diff = 360 - diff;
          if (diff < 18) {
            if (this.onChannelClick) {
              this.onChannelClick(ch.id);
            }
          }
        });
      }
    });
  }

  render(dt) {
    if (!this.ctx) return;
    const physics = window.reactorPhysics;
    this.rotAngle += dt * (0.2 + (physics.state === 'SUSTAINED' ? 1.2 : (physics.state === 'BUILDUP' ? 0.8 : 0.1)));

    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Draw Radar Scope Grid & Polar Concentric Rings
    this.drawBackgroundGrid();

    // 2. Draw 2D Dynamic Neutron Flux Heatmap Diffusion Field
    this.drawFluxDiffusionField(physics);

    // 3. Draw Annular Hexagonal Fuel Assembly Lattice
    this.drawFuelAssemblyLattice(physics);

    // 4. Draw Radial Control Rod Channels & Position Depth Meters
    this.drawRadialRodChannels(physics);

    // 5. Draw Central Aperture & Cherenkov Radiation Phenomena
    this.drawAperturePhenomena(physics, dt);

    // 6. Draw Outer Reflector & Calibrated Azimuth Ticks
    this.drawOuterReflectorRing(physics);
  }

  drawBackgroundGrid() {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 180, 255, 0.08)';
    ctx.lineWidth = 1;

    // Concentric polar grid
    [60, 120, 170, 220, 260].forEach(r => {
      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Radial spokes
    for (let i = 0; i < 360; i += 30) {
      const rad = i * Math.PI / 180;
      ctx.beginPath();
      ctx.moveTo(this.centerX + Math.cos(rad) * 40, this.centerY + Math.sin(rad) * 40);
      ctx.lineTo(this.centerX + Math.cos(rad) * 280, this.centerY + Math.sin(rad) * 280);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawFluxDiffusionField(physics) {
    const ctx = this.ctx;
    ctx.save();

    // Create radial flux gradient based on withdrawn rods
    const grad = ctx.createRadialGradient(
      this.centerX, this.centerY, this.fuelInnerRadius * 0.8,
      this.centerX, this.centerY, this.fuelOuterRadius * 1.1
    );

    let baseColor = 'rgba(0, 30, 60, 0.2)';
    let peakColor = 'rgba(0, 140, 255, 0.15)';

    if (physics.state === 'BUILDUP') {
      peakColor = `rgba(0, 190, 255, ${0.2 + physics.stageTimer * 0.15})`;
    } else if (physics.state === 'BREAKTHROUGH' || physics.state === 'SUSTAINED') {
      baseColor = 'rgba(0, 100, 255, 0.4)';
      peakColor = 'rgba(0, 230, 255, 0.65)';
    }

    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(0.3, baseColor);
    grad.addColorStop(0.7, peakColor);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.fuelOuterRadius + 15, 0, Math.PI * 2);
    ctx.fill();

    // Draw localized flux deformation plumes around withdrawn rods
    physics.channels.forEach(ch => {
      if (ch.currentDepth > 2) {
        const rad = ch.angle * Math.PI / 180;
        const dist = (this.fuelInnerRadius + this.fuelOuterRadius) / 2;
        const px = this.centerX + Math.cos(rad) * dist;
        const py = this.centerY + Math.sin(rad) * dist;
        const plumeRadius = 35 + (ch.currentDepth / 100) * 45;

        const pGrad = ctx.createRadialGradient(px, py, 2, px, py, plumeRadius);
        const alpha = (ch.currentDepth / 100) * (physics.state === 'SUSTAINED' ? 0.6 : 0.35);
        pGrad.addColorStop(0, `rgba(0, 229, 255, ${alpha})`);
        pGrad.addColorStop(0.5, `rgba(0, 119, 255, ${alpha * 0.5})`);
        pGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = pGrad;
        ctx.beginPath();
        ctx.arc(px, py, plumeRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    ctx.restore();
  }

  drawFuelAssemblyLattice(physics) {
    const ctx = this.ctx;
    ctx.save();

    // Hexagonal fuel pin dots arranged annularly
    const rings = 5;
    for (let rIdx = 0; rIdx < rings; rIdx++) {
      const radius = this.fuelInnerRadius + 15 + rIdx * 18;
      const count = 24 + rIdx * 6;
      for (let pIdx = 0; pIdx < count; pIdx++) {
        const ang = (pIdx / count) * Math.PI * 2 + (rIdx % 2 === 0 ? 0 : Math.PI / count);
        const fx = this.centerX + Math.cos(ang) * radius;
        const fy = this.centerY + Math.sin(ang) * radius;

        ctx.beginPath();
        ctx.arc(fx, fy, 2, 0, Math.PI * 2);
        if (physics.state === 'SUSTAINED') {
          ctx.fillStyle = 'rgba(0, 255, 255, 0.85)';
        } else if (physics.state === 'BREAKTHROUGH') {
          ctx.fillStyle = 'rgba(150, 220, 255, 0.9)';
        } else {
          ctx.fillStyle = 'rgba(0, 180, 255, 0.3)';
        }
        ctx.fill();
      }
    }
    ctx.restore();
  }

  drawRadialRodChannels(physics) {
    const ctx = this.ctx;
    ctx.save();

    physics.channels.forEach(ch => {
      const rad = ch.angle * Math.PI / 180;
      const rInner = this.fuelInnerRadius - 10;
      const rOuter = this.fuelOuterRadius + 20;

      const x1 = this.centerX + Math.cos(rad) * rInner;
      const y1 = this.centerY + Math.sin(rad) * rInner;
      const x2 = this.centerX + Math.cos(rad) * rOuter;
      const y2 = this.centerY + Math.sin(rad) * rOuter;

      // Guide Line
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = ch.isCalibrated ? 'rgba(0, 229, 255, 0.8)' : (ch.isCalibrating ? 'rgba(255, 170, 0, 0.8)' : 'rgba(0, 140, 200, 0.25)');
      ctx.lineWidth = ch.isCalibrated ? 3 : 1.5;
      ctx.stroke();

      // Current Rod Withdrawal Indicator Bead
      const currentR = rInner + (ch.currentDepth / 100) * (rOuter - rInner);
      const bx = this.centerX + Math.cos(rad) * currentR;
      const by = this.centerY + Math.sin(rad) * currentR;

      ctx.beginPath();
      ctx.arc(bx, by, ch.isCalibrated ? 6 : 4, 0, Math.PI * 2);
      ctx.fillStyle = ch.isCalibrated ? '#00f0ff' : (ch.isCalibrating ? '#ffaa00' : 'rgba(0, 180, 255, 0.6)');
      ctx.fill();
      if (ch.isCalibrated) {
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Outer Channel Target Badge
      const ox = this.centerX + Math.cos(rad) * (rOuter + 14);
      const oy = this.centerY + Math.sin(rad) * (rOuter + 14);

      ctx.beginPath();
      ctx.arc(ox, oy, 11, 0, Math.PI * 2);
      ctx.fillStyle = ch.isCalibrated ? 'rgba(0, 100, 160, 0.9)' : (ch.isCalibrating ? 'rgba(60, 40, 10, 0.9)' : 'rgba(10, 20, 36, 0.9)');
      ctx.strokeStyle = ch.isCalibrated ? '#00e5ff' : (ch.isCalibrating ? '#ffaa00' : 'rgba(0, 180, 255, 0.3)');
      ctx.lineWidth = 1.5;
      ctx.fill();
      ctx.stroke();

      // Symbol Label
      ctx.font = 'bold 11px Orbitron, sans-serif';
      ctx.fillStyle = ch.isCalibrated ? '#ffffff' : (ch.isCalibrating ? '#ffea00' : '#88bbdd');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ch.symbol, ox, oy);
    });

    ctx.restore();
  }

  drawAperturePhenomena(physics, dt) {
    const ctx = this.ctx;
    ctx.save();

    // Central Core Aperture Inner Circle
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.apertureRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#010308';
    ctx.fill();
    ctx.strokeStyle = physics.state === 'SUSTAINED' ? '#00e5ff' : 'rgba(0, 180, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (physics.state === 'BUILDUP') {
      // Expanding Cherenkov buildup rings
      const pulse = (Date.now() % 1000) / 1000;
      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, this.apertureRadius * pulse, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0, 229, 255, ${1 - pulse})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (physics.state === 'BREAKTHROUGH') {
      // Massive Cherenkov Blue Breakthrough Flash
      const radGrad = ctx.createRadialGradient(
        this.centerX, this.centerY, 0,
        this.centerX, this.centerY, this.outerRadius
      );
      radGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      radGrad.addColorStop(0.2, 'rgba(0, 229, 255, 0.85)');
      radGrad.addColorStop(0.6, 'rgba(0, 100, 255, 0.5)');
      radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, this.outerRadius, 0, Math.PI * 2);
      ctx.fill();
    } else if (physics.state === 'SUSTAINED') {
      // Swirling Cherenkov Vortex Portal
      const vortexGrad = ctx.createRadialGradient(
        this.centerX, this.centerY, 0,
        this.centerX, this.centerY, this.apertureRadius
      );
      vortexGrad.addColorStop(0, '#ffffff');
      vortexGrad.addColorStop(0.3, 'rgba(0, 229, 255, 0.9)');
      vortexGrad.addColorStop(0.8, 'rgba(0, 80, 220, 0.6)');
      vortexGrad.addColorStop(1, 'rgba(0, 20, 60, 0.1)');

      ctx.fillStyle = vortexGrad;
      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, this.apertureRadius, 0, Math.PI * 2);
      ctx.fill();

      // Swirling Energy Spirals
      for (let s = 0; s < 4; s++) {
        ctx.beginPath();
        const startAng = this.rotAngle * 2 + (s * Math.PI / 2);
        for (let r = 5; r < this.apertureRadius - 5; r += 4) {
          const ang = startAng + (r / 25);
          const x = this.centerX + Math.cos(ang) * r;
          const y = this.centerY + Math.sin(ang) * r;
          if (r === 5) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  drawOuterReflectorRing(physics) {
    const ctx = this.ctx;
    ctx.save();

    // Outer Beryllium Reflector Ring
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.outerRadius + 32, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 180, 255, 0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Calibrated Azimuth Angle Degree Ticks
    for (let d = 0; d < 360; d += 6) {
      const isMajor = d % 30 === 0;
      const rad = d * Math.PI / 180;
      const r1 = this.outerRadius + 32;
      const r2 = r1 + (isMajor ? 8 : 4);

      ctx.beginPath();
      ctx.moveTo(this.centerX + Math.cos(rad) * r1, this.centerY + Math.sin(rad) * r1);
      ctx.lineTo(this.centerX + Math.cos(rad) * r2, this.centerY + Math.sin(rad) * r2);
      ctx.strokeStyle = isMajor ? 'rgba(0, 229, 255, 0.8)' : 'rgba(0, 180, 255, 0.25)';
      ctx.lineWidth = isMajor ? 1.5 : 1;
      ctx.stroke();
    }

    ctx.restore();
  }
}

window.CoreCanvasRenderer = CoreCanvasRenderer;
