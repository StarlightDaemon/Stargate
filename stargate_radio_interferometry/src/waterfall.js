// Polar Radial Waterfall Spectrogram & Aperture Portal Engine for HDSSA
// Frequency mapped around ring circumference (24 sectors); Time flows radially inward toward core

export class RadialWaterfallEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;
    this.centerX = this.width / 2;
    this.centerY = this.height / 2;

    this.numSectors = 24;
    this.innerRadius = 140; // Core aperture boundary
    this.outerRadius = 370; // Outer frequency ring
    this.historyRings = 48; // Radial time steps

    // 2D matrix [sector][timeRing] storing spectral power (0.0 to 1.0)
    this.powerMatrix = Array.from({ length: this.numSectors }, () =>
      new Float32Array(this.historyRings).fill(0.08)
    );

    // Locked sectors set (indexes 0..23)
    this.lockedSectors = new Set();
    // Currently checking sector (during coincidence check)
    this.checkingSector = null;
    this.checkingProgress = 0; // 0.0 to 1.0

    // Staged Activation State: 'IDLE' | 'BUILDUP' | 'BREAKTHROUGH' | 'ACTIVE'
    this.activationState = 'IDLE';
    this.buildupProgress = 0; // 0.0 to 1.0
    this.breakthroughFlash = 0; // 1.0 down to 0.0
    this.time = 0;
    this.activeParticleStream = [];

    // Array Station Baselines (9 Stations around ring)
    this.dishStations = [
      { id: 'M-01', name: 'Caldera Alpha', angle: 0 },
      { id: 'M-02', name: 'Ridge Beta', angle: (Math.PI * 2 * 1) / 9 },
      { id: 'M-03', name: 'Valley Gamma', angle: (Math.PI * 2 * 2) / 9 },
      { id: 'M-04', name: 'Peak Delta', angle: (Math.PI * 2 * 3) / 9 },
      { id: 'M-05', name: 'Plains Epsilon', angle: (Math.PI * 2 * 4) / 9 },
      { id: 'M-06', name: 'Outpost Zeta', angle: (Math.PI * 2 * 5) / 9 },
      { id: 'M-07', name: 'Dome Eta', angle: (Math.PI * 2 * 6) / 9 },
      { id: 'M-08', name: 'Canyon Theta', angle: (Math.PI * 2 * 7) / 9 },
      { id: 'M-09', name: 'Array Iota', angle: (Math.PI * 2 * 8) / 9 }
    ];

    this.initParticles();
    this.lastFrameTime = performance.now();
  }

  initParticles() {
    this.activeParticleStream = [];
    for (let i = 0; i < 90; i++) {
      this.activeParticleStream.push({
        angle: Math.random() * Math.PI * 2,
        dist: this.innerRadius + Math.random() * (this.outerRadius - this.innerRadius),
        speed: 1.2 + Math.random() * 2.5,
        size: 1.5 + Math.random() * 2.5,
        alpha: 0.2 + Math.random() * 0.8,
        hue: Math.random() > 0.4 ? 185 : 280
      });
    }
  }

  setLockedSectors(sectorsArray) {
    this.lockedSectors = new Set(sectorsArray);
  }

  setCheckingSector(sectorIndex, progress) {
    this.checkingSector = sectorIndex;
    this.checkingProgress = progress;
  }

  setActivationState(state, progress = 0) {
    this.activationState = state;
    this.buildupProgress = progress;
    if (state === 'BREAKTHROUGH') {
      this.breakthroughFlash = 1.0;
    }
  }

  // Update spectral waterfall step (inward radial time flow)
  updateWaterfallData() {
    for (let s = 0; s < this.numSectors; s++) {
      const ring = this.powerMatrix[s];
      // Shift history inward: ring[i] moves towards index 0 (inner radius)
      for (let i = 0; i < this.historyRings - 1; i++) {
        ring[i] = ring[i + 1];
      }

      // Generate newest spectral power reading at the outer boundary (index historyRings - 1)
      const isLocked = this.lockedSectors.has(s);
      const isChecking = this.checkingSector === s;

      if (isLocked) {
        // High SNR Coherent Narrowband Technosignature Carrier
        // Carrier peak + coherent Doppler drift phase modulation
        const phase = this.time * 4.5 + s * 1.618;
        const carrierSignal = 0.78 + 0.22 * Math.sin(phase);
        // Add subtle harmonic sidebands
        const sideband = 0.12 * Math.cos(phase * 2.3);
        ring[this.historyRings - 1] = Math.min(1.0, carrierSignal + sideband);
      } else if (isChecking) {
        // Resolving from noise: increasing coherent power as coincidence progress rises
        const noise = (Math.random() * 0.45);
        const resolvingCarrier = this.checkingProgress * (0.6 + 0.35 * Math.sin(this.time * 6.0));
        ring[this.historyRings - 1] = Math.min(1.0, (1 - this.checkingProgress) * noise + resolvingCarrier);
      } else {
        // Raw Cryogenic Thermal Noise Field (Rayleigh / Gaussian distribution ~ 0.05 to 0.28)
        const u1 = Math.max(0.0001, Math.random());
        const u2 = Math.random();
        const rayleighNoise = Math.sqrt(-2.0 * Math.log(u1)) * 0.09 * (0.8 + 0.4 * Math.sin(u2 * Math.PI * 2));
        ring[this.historyRings - 1] = Math.min(0.38, 0.05 + rayleighNoise);
      }
    }
  }

  render(timestamp) {
    const dt = (timestamp - this.lastFrameTime) / 1000;
    this.lastFrameTime = timestamp;
    this.time += dt || 0.016;

    this.updateWaterfallData();

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Deep space dark radial gradient
    const bgGrad = ctx.createRadialGradient(
      this.centerX, this.centerY, 40,
      this.centerX, this.centerY, this.outerRadius + 30
    );
    bgGrad.addColorStop(0, '#04070d');
    bgGrad.addColorStop(0.5, '#070b13');
    bgGrad.addColorStop(1, '#020306');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // 1. Draw polar waterfall sectors (Time flowing inward)
    this.renderPolarWaterfall();

    // 2. Draw sector radial grid lines, frequency labels & reticles
    this.renderGridAndReticles();

    // 3. Draw 9 Baseline Array Station Nodes
    this.renderDishNodes();

    // 4. Draw Central Stargate Portal Aperture (Idle / Buildup / Breakthrough / Active)
    this.renderCentralAperture();

    // 5. Draw Breakthrough Flash overlay if triggered
    if (this.breakthroughFlash > 0.01) {
      ctx.save();
      ctx.fillStyle = `rgba(220, 250, 255, ${this.breakthroughFlash * 0.88})`;
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.restore();
      this.breakthroughFlash = Math.max(0, this.breakthroughFlash - dt * 2.2);
    }
  }

  renderPolarWaterfall() {
    const ctx = this.ctx;
    const sectorAngle = (Math.PI * 2) / this.numSectors;
    const radialStep = (this.outerRadius - this.innerRadius) / this.historyRings;

    for (let s = 0; s < this.numSectors; s++) {
      const isLocked = this.lockedSectors.has(s);
      const isChecking = this.checkingSector === s;
      const startAngle = s * sectorAngle - Math.PI / 2;
      const endAngle = (s + 1) * sectorAngle - Math.PI / 2;
      const ringData = this.powerMatrix[s];

      for (let r = 0; r < this.historyRings; r++) {
        // r = 0 is innerRadius (older time), r = historyRings - 1 is outerRadius (newest)
        const rInner = this.innerRadius + r * radialStep;
        const rOuter = rInner + radialStep + 0.8;
        const power = ringData[r];

        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, rOuter, startAngle, endAngle);
        ctx.arc(this.centerX, this.centerY, rInner, endAngle, startAngle, true);
        ctx.closePath();

        // Color mapping based on power & state
        if (isLocked) {
          // Locked High-SNR Technosignature: Phosphor Cyan / Neon Emerald / Radiant White
          if (power > 0.85) {
            ctx.fillStyle = `rgba(235, 255, 255, ${0.85 + power * 0.15})`;
          } else if (power > 0.65) {
            ctx.fillStyle = `rgba(0, 240, 255, ${0.75 + power * 0.25})`;
          } else {
            ctx.fillStyle = `rgba(0, 255, 160, ${0.5 + power * 0.4})`;
          }
        } else if (isChecking) {
          // Resolving sector during coincidence check: Amber to Pulsar Violet
          const alpha = 0.3 + power * 0.6;
          ctx.fillStyle = `rgba(255, 176, 32, ${alpha})`;
        } else {
          // Raw Thermal Background Noise: Dark Indigo / Sub-millimeter Phosphor Noise
          const alpha = Math.max(0.04, power * 0.9);
          const blueVal = Math.floor(60 + power * 180);
          const greenVal = Math.floor(30 + power * 90);
          ctx.fillStyle = `rgba(15, ${greenVal}, ${blueVal}, ${alpha})`;
        }
        ctx.fill();
      }

      // If locked, draw high-definition Doppler drift arc line
      if (isLocked) {
        ctx.save();
        ctx.beginPath();
        const midAngle = startAngle + sectorAngle / 2;
        ctx.arc(this.centerX, this.centerY, this.outerRadius, startAngle, endAngle);
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 12;
        ctx.stroke();

        // Coherent radial pulse wave
        const pulseR = this.innerRadius + ((this.time * 40 + s * 15) % (this.outerRadius - this.innerRadius));
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, pulseR, startAngle + 0.02, endAngle - 0.02);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  renderGridAndReticles() {
    const ctx = this.ctx;
    const sectorAngle = (Math.PI * 2) / this.numSectors;

    ctx.save();
    // 1. Concentric Range / Time Rings
    for (let r = this.innerRadius; r <= this.outerRadius; r += 46) {
      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, r, 0, Math.PI * 2);
      ctx.strokeStyle = r === this.outerRadius ? 'rgba(0, 240, 255, 0.4)' : 'rgba(0, 180, 220, 0.12)';
      ctx.lineWidth = r === this.outerRadius ? 1.5 : 0.75;
      if (r !== this.outerRadius) {
        ctx.setLineDash([4, 6]);
      } else {
        ctx.setLineDash([]);
      }
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // 2. Sector Radial Dividers & Ticks
    for (let s = 0; s < this.numSectors; s++) {
      const angle = s * sectorAngle - Math.PI / 2;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      const x1 = this.centerX + cosA * this.innerRadius;
      const y1 = this.centerY + sinA * this.innerRadius;
      const x2 = this.centerX + cosA * this.outerRadius;
      const y2 = this.centerY + sinA * this.outerRadius;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = this.lockedSectors.has(s) ? 'rgba(0, 240, 255, 0.5)' : 'rgba(0, 150, 200, 0.18)';
      ctx.lineWidth = this.lockedSectors.has(s) ? 1.5 : 0.8;
      ctx.stroke();

      // Sector Perimeter Ticks & Frequency index
      const tickX2 = this.centerX + cosA * (this.outerRadius + 8);
      const tickY2 = this.centerY + sinA * (this.outerRadius + 8);
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(tickX2, tickY2);
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Label at sector center
      const labelAngle = angle + sectorAngle / 2;
      const labelR = this.outerRadius + 16;
      const lx = this.centerX + Math.cos(labelAngle) * labelR;
      const ly = this.centerY + Math.sin(labelAngle) * labelR;

      ctx.fillStyle = this.lockedSectors.has(s) ? '#00f0ff' : 'rgba(120, 180, 210, 0.6)';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`Ψ${(s + 1).toString().padStart(2, '0')}`, lx, ly);
    }

    // Outer Precision Protractor Ticks
    for (let deg = 0; deg < 360; deg += 3) {
      const rad = (deg * Math.PI) / 180 - Math.PI / 2;
      const isMajor = deg % 15 === 0;
      const len = isMajor ? 6 : 3;
      const r1 = this.outerRadius + 2;
      const r2 = r1 + len;

      ctx.beginPath();
      ctx.moveTo(this.centerX + Math.cos(rad) * r1, this.centerY + Math.sin(rad) * r1);
      ctx.lineTo(this.centerX + Math.cos(rad) * r2, this.centerY + Math.sin(rad) * r2);
      ctx.strokeStyle = isMajor ? 'rgba(0, 240, 255, 0.45)' : 'rgba(0, 200, 240, 0.2)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    ctx.restore();
  }

  renderDishNodes() {
    const ctx = this.ctx;
    const dishRadius = this.outerRadius + 32;

    this.dishStations.forEach((dish, idx) => {
      const angle = dish.angle - Math.PI / 2;
      const x = this.centerX + Math.cos(angle) * dishRadius;
      const y = this.centerY + Math.sin(angle) * dishRadius;

      ctx.save();
      // Beam line to center during coincidence check or active state
      if (this.checkingSector !== null || this.activationState === 'ACTIVE' || this.activationState === 'BUILDUP') {
        const isCheckingActive = this.checkingSector !== null && (idx / 9) <= this.checkingProgress;
        const isActive = this.activationState === 'ACTIVE' || this.activationState === 'BUILDUP' || isCheckingActive;

        if (isActive) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(this.centerX, this.centerY);
          ctx.strokeStyle = this.activationState === 'ACTIVE'
            ? 'rgba(0, 255, 170, 0.4)'
            : 'rgba(0, 240, 255, 0.3)';
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // Dish Station Node Circle
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#060a12';
      ctx.fill();
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Station inner active pip
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = this.activationState === 'ACTIVE' ? '#00ff9d' : '#00f0ff';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 6;
      ctx.fill();

      // Station label
      ctx.fillStyle = 'rgba(0, 240, 255, 0.85)';
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const labelX = this.centerX + Math.cos(angle) * (dishRadius + 14);
      const labelY = this.centerY + Math.sin(angle) * (dishRadius + 14);
      ctx.fillText(dish.id, labelX, labelY);

      ctx.restore();
    });
  }

  renderCentralAperture() {
    const ctx = this.ctx;
    ctx.save();

    // Central Core Base Circle
    const coreGrad = ctx.createRadialGradient(
      this.centerX, this.centerY, 0,
      this.centerX, this.centerY, this.innerRadius
    );

    if (this.activationState === 'ACTIVE') {
      // Sustained Active Stargate Event Horizon (Deep Wormhole Vortex)
      coreGrad.addColorStop(0, '#001a24');
      coreGrad.addColorStop(0.35, '#02384a');
      coreGrad.addColorStop(0.7, '#00e5ff');
      coreGrad.addColorStop(0.95, '#8a2be2');
      coreGrad.addColorStop(1.0, '#00f0ff');
    } else if (this.activationState === 'BUILDUP') {
      // Buildup Stage: Charging Energy Plasma
      const p = this.buildupProgress;
      coreGrad.addColorStop(0, '#0a101d');
      coreGrad.addColorStop(0.5, `rgba(0, 180, 240, ${0.2 + p * 0.5})`);
      coreGrad.addColorStop(0.85, `rgba(138, 43, 226, ${0.3 + p * 0.6})`);
      coreGrad.addColorStop(1.0, `rgba(0, 240, 255, ${0.4 + p * 0.6})`);
    } else {
      // Idle / Ready: Dark Cryogenic Core with reticle
      coreGrad.addColorStop(0, '#03060a');
      coreGrad.addColorStop(0.75, '#060d18');
      coreGrad.addColorStop(1, '#0c1a2d');
    }

    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.innerRadius - 2, 0, Math.PI * 2);
    ctx.fillStyle = coreGrad;
    ctx.fill();

    // Event Horizon Inner Ring Border
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.innerRadius - 2, 0, Math.PI * 2);
    ctx.strokeStyle = this.activationState === 'ACTIVE'
      ? '#00f0ff'
      : (this.lockedSectors.size === 7 ? '#00ff9d' : 'rgba(0, 240, 255, 0.4)');
    ctx.lineWidth = this.activationState === 'ACTIVE' ? 3 : 1.5;
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = this.activationState === 'ACTIVE' ? 18 : 6;
    ctx.stroke();

    // 1. Idle / Ready State Visuals
    if (this.activationState === 'IDLE') {
      // Rotating reticle rings
      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, 60, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
      ctx.setLineDash([6, 8]);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, 95, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 180, 240, 0.2)';
      ctx.setLineDash([4, 12]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Center crosshair
      ctx.beginPath();
      ctx.moveTo(this.centerX - 18, this.centerY);
      ctx.lineTo(this.centerX + 18, this.centerY);
      ctx.moveTo(this.centerX, this.centerY - 18);
      ctx.lineTo(this.centerX, this.centerY + 18);
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // If all 7 locked (READY for activation), show pulsing standby iris rings
      if (this.lockedSectors.size === 7) {
        const pulse = 0.5 + 0.5 * Math.sin(this.time * 4.0);
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, 75 + pulse * 10, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 255, 157, ${0.4 + pulse * 0.4})`;
        ctx.lineWidth = 2;
        ctx.shadowColor = '#00ff9d';
        ctx.shadowBlur = 12;
        ctx.stroke();
      }
    }

    // 2. Stage 1: Buildup State Visuals (Accelerating Doppler Plasma Vortex)
    if (this.activationState === 'BUILDUP') {
      const p = this.buildupProgress;
      const numSpokes = 12;
      const spokeRot = this.time * (2 + p * 8);

      for (let i = 0; i < numSpokes; i++) {
        const angle = spokeRot + (i * Math.PI * 2) / numSpokes;
        ctx.beginPath();
        ctx.moveTo(this.centerX, this.centerY);
        const spokeR = (this.innerRadius - 4) * (0.4 + p * 0.6);
        ctx.lineTo(this.centerX + Math.cos(angle) * spokeR, this.centerY + Math.sin(angle) * spokeR);
        ctx.strokeStyle = `rgba(0, 240, 255, ${0.2 + p * 0.7})`;
        ctx.lineWidth = 1.5 + p * 2;
        ctx.stroke();
      }

      // Constricting energy iris
      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, (this.innerRadius - 10) * (1 - p * 0.4), 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.5 + p * 0.5})`;
      ctx.lineWidth = 2 + p * 3;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 15 + p * 20;
      ctx.stroke();
    }

    // 3. Stage 3: Sustained Active State Visuals (Rotating Wormhole & Inflowing Carrier Stream)
    if (this.activationState === 'ACTIVE') {
      // Rotating event horizon spirals
      const spirals = 6;
      for (let i = 0; i < spirals; i++) {
        ctx.beginPath();
        const startA = this.time * 2.2 + (i * Math.PI * 2) / spirals;
        for (let r = 10; r < this.innerRadius - 4; r += 4) {
          const a = startA + (r * 0.045);
          const x = this.centerX + Math.cos(a) * r;
          const y = this.centerY + Math.sin(a) * r;
          if (r === 10) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = i % 2 === 0 ? 'rgba(0, 240, 255, 0.75)' : 'rgba(168, 85, 247, 0.65)';
        ctx.lineWidth = 2.2;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 10;
        ctx.stroke();
      }

      // Undulating Event Horizon Core
      ctx.beginPath();
      const coreR = 42 + Math.sin(this.time * 5.0) * 4;
      ctx.arc(this.centerX, this.centerY, coreR, 0, Math.PI * 2);
      ctx.fillStyle = '#000000';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 25;
      ctx.fill();

      // Glowing singularity core ring
      ctx.beginPath();
      ctx.arc(this.centerX, this.centerY, coreR + 3, 0, Math.PI * 2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Inflowing technosignature particle stream
      this.activeParticleStream.forEach((p) => {
        p.dist -= p.speed * 1.5;
        p.angle += 0.015;
        if (p.dist < 15) {
          p.dist = this.outerRadius;
          p.angle = Math.random() * Math.PI * 2;
        }
        const px = this.centerX + Math.cos(p.angle) * p.dist;
        const py = this.centerY + Math.sin(p.angle) * p.dist;

        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.hue === 185 ? `rgba(0, 240, 255, ${p.alpha})` : `rgba(168, 85, 247, ${p.alpha})`;
        ctx.fill();
      });
    }

    ctx.restore();
  }
}
