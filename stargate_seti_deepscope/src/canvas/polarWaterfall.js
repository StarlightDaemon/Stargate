// Polar / Radial Waterfall Spectrogram & Aperture Portal Canvas Engine

export class PolarWaterfall {
  constructor(canvasId, apertureCanvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    
    this.apertureCanvas = document.getElementById(apertureCanvasId);
    this.apertureCtx = this.apertureCanvas.getContext('2d');

    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.centerX = this.width / 2;
    this.centerY = this.height / 2;

    this.innerRadius = 135;
    this.outerRadius = 275;

    // Simulation State
    this.time = 0;
    this.activeSectors = new Set(); // Sector indices currently locked (0..17)
    this.pendingSectors = new Set();
    this.systemState = 'IDLE'; // IDLE, DIALING, PENDING, BUILDUP, BREAKTHROUGH, ACTIVE
    this.buildupProgress = 0;
    this.breakthroughFlash = 0;
    this.activeTime = 0;

    // Cosmic Noise Particles & Radial Rings
    this.noiseRings = 40;
    this.noiseSlices = 120;
    this.noiseHistory = [];
    this.initNoiseHistory();

    // Singularity Particles
    this.particles = [];
    this.initParticles();

    this.themeColor = '#00f0ff';
    this.accentRgb = '0, 240, 255';
  }

  setTheme(accentHex, accentRgb) {
    this.themeColor = accentHex;
    this.accentRgb = accentRgb;
  }

  initNoiseHistory() {
    this.noiseHistory = [];
    for (let r = 0; r < this.noiseRings; r++) {
      const row = new Float32Array(this.noiseSlices);
      for (let s = 0; s < this.noiseSlices; s++) {
        row[s] = Math.random() * 0.45;
      }
      this.noiseHistory.push(row);
    }
  }

  initParticles() {
    this.particles = [];
    for (let i = 0; i < 90; i++) {
      this.particles.push({
        r: 15 + Math.random() * 95,
        theta: Math.random() * Math.PI * 2,
        speed: 0.02 + Math.random() * 0.04,
        radialSpeed: (Math.random() - 0.5) * 0.4,
        size: 1 + Math.random() * 2.5,
        alpha: 0.3 + Math.random() * 0.7
      });
    }
  }

  setLockedSectors(sectorIndices) {
    this.activeSectors = new Set(sectorIndices);
  }

  setSystemState(state) {
    this.systemState = state;
    if (state === 'BREAKTHROUGH') {
      this.breakthroughFlash = 1.0;
    }
  }

  update(dt) {
    this.time += dt * 0.001;

    if (this.systemState === 'BUILDUP') {
      this.buildupProgress = Math.min(1.0, this.buildupProgress + dt / 1800);
    } else if (this.systemState === 'BREAKTHROUGH') {
      this.breakthroughFlash = Math.max(0, this.breakthroughFlash - dt / 800);
    } else if (this.systemState === 'ACTIVE') {
      this.activeTime += dt * 0.001;
      this.buildupProgress = 1.0;
    } else {
      this.buildupProgress = Math.max(0, this.buildupProgress - dt / 500);
    }

    // Advance noise history (radial time flow)
    if (Math.random() < 0.8) {
      const newRow = new Float32Array(this.noiseSlices);
      for (let s = 0; s < this.noiseSlices; s++) {
        // Base cosmic noise floor
        let val = Math.random() * 0.35;
        
        // Add subtle background candidate hums
        const angleNorm = s / this.noiseSlices;
        if (Math.abs(angleNorm - 0.33) < 0.02 || Math.abs(angleNorm - 0.72) < 0.02) {
          val += 0.3 + Math.sin(this.time * 4 + s) * 0.15;
        }

        // Boost active locked sectors
        this.activeSectors.forEach(secIdx => {
          const secAngle = (secIdx * 20) % 360;
          const targetSlice = Math.floor((secAngle / 360) * this.noiseSlices);
          const dist = Math.min(
            Math.abs(s - targetSlice),
            Math.abs(s - (targetSlice + this.noiseSlices)),
            Math.abs(s - (targetSlice - this.noiseSlices))
          );
          if (dist < 3) {
            val += (1.0 - dist * 0.28) * (0.7 + Math.sin(this.time * 8) * 0.2);
          }
        });

        newRow[s] = Math.min(1.2, val);
      }
      this.noiseHistory.pop();
      this.noiseHistory.unshift(newRow);
    }

    // Update Singularity Particles
    this.particles.forEach(p => {
      if (this.systemState === 'ACTIVE' || this.systemState === 'BUILDUP') {
        p.speed = 0.08 + Math.random() * 0.08;
        p.radialSpeed = -0.6; // Inward acceleration
      } else {
        p.speed = 0.02 + Math.random() * 0.03;
        p.radialSpeed = (Math.random() - 0.5) * 0.3;
      }
      p.theta += p.speed;
      p.r += p.radialSpeed;
      if (p.r < 10) p.r = 110;
      if (p.r > 120) p.r = 15;
    });
  }

  draw() {
    this.drawPolarWaterfall();
    this.drawApertureSingularity();
  }

  // 1. Draw Polar Waterfall Spectrogram Canvas
  drawPolarWaterfall() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    // Background Gradient Ring Housing
    const bgGrad = ctx.createRadialGradient(0, 0, this.innerRadius - 5, 0, 0, this.outerRadius + 10);
    bgGrad.addColorStop(0, 'rgba(4, 7, 13, 0.95)');
    bgGrad.addColorStop(0.5, 'rgba(7, 14, 26, 0.85)');
    bgGrad.addColorStop(1, 'rgba(2, 4, 8, 0.98)');
    
    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    ctx.arc(0, 0, this.outerRadius + 8, 0, Math.PI * 2);
    ctx.arc(0, 0, this.innerRadius - 8, 0, Math.PI * 2, true);
    ctx.fill();

    // Render Radial Waterfall Noise Slices
    const numRings = this.noiseHistory.length;
    const ringStep = (this.outerRadius - this.innerRadius) / numRings;
    const sliceAngle = (Math.PI * 2) / this.noiseSlices;

    for (let r = 0; r < numRings; r++) {
      const row = this.noiseHistory[r];
      const rInner = this.innerRadius + r * ringStep;
      const rOuter = rInner + ringStep + 0.5;

      for (let s = 0; s < this.noiseSlices; s++) {
        const val = row[s];
        if (val < 0.08) continue;

        const thetaStart = s * sliceAngle - Math.PI / 2;
        const thetaEnd = thetaStart + sliceAngle + 0.01;

        // Check if sector is locked
        const secAngleDeg = ((s / this.noiseSlices) * 360) % 360;
        let isSectorLocked = false;
        this.activeSectors.forEach(secIdx => {
          const targetDeg = (secIdx * 20) % 360;
          let diff = Math.abs(secAngleDeg - targetDeg);
          if (diff > 180) diff = 360 - diff;
          if (diff < 8) isSectorLocked = true;
        });

        let alpha = Math.min(0.9, val * 0.7);
        if (isSectorLocked) {
          alpha = Math.min(1.0, val * 1.3);
          ctx.fillStyle = `rgba(${this.accentRgb}, ${alpha})`;
        } else {
          ctx.fillStyle = `rgba(0, 160, 220, ${alpha * 0.45})`;
        }

        ctx.beginPath();
        ctx.arc(0, 0, rOuter, thetaStart, thetaEnd);
        ctx.arc(0, 0, rInner, thetaEnd, thetaStart, true);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Outer & Inner Scale Reticles & Grid Lines
    this.drawScaleReticles(ctx);

    // Active Sector Beams & Coherent Narrowband Arcs
    this.drawActiveSectorBeams(ctx);

    // Sweeping Radar/Phase Tracker
    const sweepAngle = (this.time * 0.8) % (Math.PI * 2) - Math.PI / 2;
    const sweepGrad = ctx.createLinearGradient(
      Math.cos(sweepAngle) * this.innerRadius,
      Math.sin(sweepAngle) * this.innerRadius,
      Math.cos(sweepAngle) * this.outerRadius,
      Math.sin(sweepAngle) * this.outerRadius
    );
    sweepGrad.addColorStop(0, 'rgba(0, 240, 255, 0.4)');
    sweepGrad.addColorStop(1, 'rgba(0, 240, 255, 0.0)');

    ctx.strokeStyle = sweepGrad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(sweepAngle) * this.innerRadius, Math.sin(sweepAngle) * this.innerRadius);
    ctx.lineTo(Math.cos(sweepAngle) * this.outerRadius, Math.sin(sweepAngle) * this.outerRadius);
    ctx.stroke();

    ctx.restore();
  }

  // Draw Reticle Rings and Frequency Scale Markers
  drawScaleReticles(ctx) {
    // Concentric Circular Grids (Time Isochrones)
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
    ctx.lineWidth = 1;
    [this.innerRadius, this.innerRadius + 45, this.innerRadius + 90, this.outerRadius].forEach(r => {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Outer Ring Bezel
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, this.outerRadius + 2, 0, Math.PI * 2);
    ctx.stroke();

    // 18 Frequency Sector Radial Lines & Tick Marks
    for (let i = 0; i < 18; i++) {
      const angle = (i * 20 * Math.PI) / 180 - Math.PI / 2;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      // Radial Line
      ctx.strokeStyle = this.activeSectors.has(i) ? `rgba(${this.accentRgb}, 0.8)` : 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = this.activeSectors.has(i) ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(cosA * (this.innerRadius - 4), sinA * (this.innerRadius - 4));
      ctx.lineTo(cosA * (this.outerRadius + 6), sinA * (this.outerRadius + 6));
      ctx.stroke();

      // Outer Tick
      ctx.strokeStyle = this.activeSectors.has(i) ? this.themeColor : 'rgba(0, 240, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cosA * this.outerRadius, sinA * this.outerRadius);
      ctx.lineTo(cosA * (this.outerRadius + 10), sinA * (this.outerRadius + 10));
      ctx.stroke();
    }
  }

  // Draw Coherent Laser-Narrowband Signal Arcs for Locked Sectors
  drawActiveSectorBeams(ctx) {
    this.activeSectors.forEach(secIdx => {
      const centerAngle = (secIdx * 20 * Math.PI) / 180 - Math.PI / 2;
      const spanAngle = (16 * Math.PI) / 180;

      // Glow Arc
      ctx.save();
      ctx.shadowColor = this.themeColor;
      ctx.shadowBlur = 15;

      ctx.strokeStyle = this.themeColor;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(0, 0, (this.innerRadius + this.outerRadius) / 2, centerAngle - spanAngle / 2, centerAngle + spanAngle / 2);
      ctx.stroke();

      // Harmonic Sidebands
      ctx.strokeStyle = `rgba(${this.accentRgb}, 0.5)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, this.outerRadius - 20, centerAngle - spanAngle / 3, centerAngle + spanAngle / 3);
      ctx.arc(0, 0, this.innerRadius + 20, centerAngle - spanAngle / 3, centerAngle + spanAngle / 3);
      ctx.stroke();

      ctx.restore();
    });
  }

  // 2. Draw Aperture Singularity Lens Hub (Center)
  drawApertureSingularity() {
    const ctx = this.apertureCtx;
    const w = this.apertureCanvas.width;
    const h = this.apertureCanvas.height;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(cx, cy);

    // Singularity Core Event Horizon
    const coreRadius = 85;
    const coreGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, coreRadius);
    
    if (this.systemState === 'ACTIVE') {
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.2, `rgba(${this.accentRgb}, 0.9)`);
      coreGrad.addColorStop(0.6, '#0f0524');
      coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
    } else if (this.systemState === 'BUILDUP') {
      const p = this.buildupProgress;
      coreGrad.addColorStop(0, `rgba(255, 183, 0, ${0.4 + p * 0.6})`);
      coreGrad.addColorStop(0.5, `rgba(${this.accentRgb}, ${0.3 + p * 0.4})`);
      coreGrad.addColorStop(1, 'rgba(4, 7, 13, 0.95)');
    } else {
      coreGrad.addColorStop(0, 'rgba(0, 240, 255, 0.15)');
      coreGrad.addColorStop(0.7, 'rgba(9, 15, 26, 0.85)');
      coreGrad.addColorStop(1, 'rgba(4, 7, 13, 0.98)');
    }

    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, 0, coreRadius, 0, Math.PI * 2);
    ctx.fill();

    // Gravitational Lensing Distortion Rings
    ctx.strokeStyle = `rgba(${this.accentRgb}, ${0.2 + this.buildupProgress * 0.5})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, coreRadius - 10, 0, Math.PI * 2);
    ctx.arc(0, 0, coreRadius - 30, 0, Math.PI * 2);
    ctx.stroke();

    // Swirling Particle Accretion Disk
    this.particles.forEach(p => {
      const x = Math.cos(p.theta) * p.r;
      const y = Math.sin(p.theta) * p.r;

      ctx.fillStyle = (this.systemState === 'ACTIVE') 
        ? `rgba(255, 255, 255, ${p.alpha})`
        : `rgba(${this.accentRgb}, ${p.alpha})`;

      ctx.beginPath();
      ctx.arc(x, y, p.size * (this.systemState === 'ACTIVE' ? 1.5 : 1), 0, Math.PI * 2);
      ctx.fill();
    });

    // Stage 2 Breakthrough Optical Shockwave Flash
    if (this.breakthroughFlash > 0.01) {
      const f = this.breakthroughFlash;
      ctx.fillStyle = `rgba(255, 255, 255, ${f * 0.95})`;
      ctx.beginPath();
      ctx.arc(0, 0, coreRadius * 1.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(${this.accentRgb}, ${f})`;
      ctx.lineWidth = 8 * f;
      ctx.beginPath();
      ctx.arc(0, 0, (1 - f) * 120 + 20, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Stage 3 Sustained Active Relativistic Plasma Wormhole
    if (this.systemState === 'ACTIVE') {
      ctx.save();
      ctx.rotate(this.activeTime * 1.5);
      
      // Multi-arm spiral plasma filaments
      for (let arm = 0; arm < 4; arm++) {
        ctx.beginPath();
        ctx.strokeStyle = (arm % 2 === 0) ? `rgba(${this.accentRgb}, 0.8)` : 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 2.5;
        for (let t = 0; t < 50; t++) {
          const r = t * 1.6;
          const a = (arm * Math.PI / 2) + t * 0.12;
          const px = Math.cos(a) * r;
          const py = Math.sin(a) * r;
          if (t === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.restore();
  }
}
