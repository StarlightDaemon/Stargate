// ============================================================================
// Aeolos Stagnation Plenum (ASP-9) — Wind Tunnel Canvas & Instrument Renderer
// Real-Time Vector Schlieren, Supersonic Streamlines, Shock Diamonds & Vane Ring
// ============================================================================

export class WindTunnelRenderer {
  constructor(canvas, sectors) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.sectors = sectors;

    // Simulation state
    this.state = 'STANDBY'; // 'STANDBY', 'ARMED', 'BUILDUP', 'BREAKTHROUGH', 'ACTIVE'
    this.lockedSectors = []; // array of sector objects
    this.selectedSector = sectors[0];
    this.azimuthDeg = 0;
    this.targetAzimuthDeg = 0;
    this.mach = 0.05;
    this.targetMach = 0.05;
    this.dynamicPressureQ = 1.2; // kPa
    this.stagnationP0 = 101.3; // kPa
    this.buildupProgress = 0; // 0 to 1
    this.breakthroughFlash = 0; // 1 to 0 decay

    // Streamline particles (flowing left to right along wind tunnel axis)
    this.numParticles = 90;
    this.particles = [];
    this.initParticles();

    // Shock diamond simulation
    this.shockDiamonds = [
      { xNorm: 0.54, width: 70, height: 45 },
      { xNorm: 0.65, width: 60, height: 38 },
      { xNorm: 0.75, width: 50, height: 30 },
      { xNorm: 0.84, width: 40, height: 24 }
    ];

    // Resize handling
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  initParticles() {
    this.particles = [];
    for (let i = 0; i < this.numParticles; i++) {
      this.particles.push({
        x: Math.random(),
        y: Math.random() * 0.7 + 0.15,
        speed: 0.002 + Math.random() * 0.003,
        length: 20 + Math.random() * 40,
        turbulence: Math.random() * 3,
        alpha: 0.25 + Math.random() * 0.55
      });
    }
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.width = rect.width;
    this.height = rect.height;
  }

  setState(newState) {
    this.state = newState;
    if (newState === 'STANDBY') {
      this.targetMach = 0.05;
      this.buildupProgress = 0;
      this.breakthroughFlash = 0;
    } else if (newState === 'ARMED') {
      this.targetMach = 0.08;
    } else if (newState === 'BUILDUP') {
      this.targetMach = 0.98;
      this.buildupProgress = 0;
    } else if (newState === 'BREAKTHROUGH') {
      this.targetMach = 1.05;
      this.breakthroughFlash = 1.0;
    } else if (newState === 'ACTIVE') {
      this.targetMach = 1.45;
      this.breakthroughFlash = 0;
    }
  }

  setLockedSectors(locked) {
    this.lockedSectors = [...locked];
  }

  setSelectedSector(sector) {
    this.selectedSector = sector;
    if (sector) {
      this.targetAzimuthDeg = sector.angleDeg;
    }
  }

  update(deltaMs) {
    const dt = deltaMs / 1000;

    // Smooth azimuth tracking
    let diff = this.targetAzimuthDeg - this.azimuthDeg;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    this.azimuthDeg += diff * Math.min(1, dt * 8);

    // Smooth Mach tracking
    this.mach += (this.targetMach - this.mach) * Math.min(1, dt * (this.state === 'BUILDUP' ? 1.5 : 4));

    // Dynamic pressure Q derived from Mach
    this.dynamicPressureQ = 101.3 * (0.7 * this.mach * this.mach);

    if (this.state === 'BUILDUP') {
      this.buildupProgress = Math.min(1, this.buildupProgress + dt / 2.2);
    }

    if (this.breakthroughFlash > 0) {
      this.breakthroughFlash = Math.max(0, this.breakthroughFlash - dt * 2.0);
    }

    // Update streamline particles
    const flowVelocity = (this.mach * 2.8 + 0.15);
    for (const p of this.particles) {
      p.x += p.speed * flowVelocity * (deltaMs / 16.67);
      if (p.x > 1.1) {
        p.x = -0.1;
        p.y = Math.random() * 0.74 + 0.13;
      }
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    // 1. Render Wind Tunnel Wall Contours (Contraction -> Throat -> Diffuser)
    this.renderTunnelContours(ctx, w, h);

    // 2. Render Streamlines (Laminar vs Turbulent vs Supersonic)
    this.renderStreamlines(ctx, w, h);

    // 3. Render Schlieren Density Gradient Field / Shock Waves
    this.renderSchlierenField(ctx, w, h);

    // 4. If active, render Supersonic Diamond Shock Lattice in diffuser
    if (this.state === 'ACTIVE' || (this.state === 'BUILDUP' && this.buildupProgress > 0.8)) {
      this.renderShockDiamonds(ctx, w, h);
    }

    // 5. Render Central Stagnation Dial Ring & Variable-Pitch Guide Vanes
    const ringCenterX = w * 0.44;
    const ringCenterY = h * 0.50;
    const ringRadius = Math.min(w * 0.28, h * 0.38);

    this.renderDialRing(ctx, ringCenterX, ringCenterY, ringRadius);

    // 6. Render Breakthrough Flash (Prandtl-Glauert Optical Surge)
    if (this.breakthroughFlash > 0.01) {
      ctx.save();
      ctx.fillStyle = `rgba(255, 255, 255, ${this.breakthroughFlash * 0.75})`;
      ctx.fillRect(0, 0, w, h);

      // Expanding shockwave circle
      const shockR = ringRadius * (2.2 - this.breakthroughFlash * 1.2);
      ctx.strokeStyle = `rgba(0, 229, 255, ${this.breakthroughFlash})`;
      ctx.lineWidth = 6 * this.breakthroughFlash;
      ctx.beginPath();
      ctx.arc(ringCenterX, ringCenterY, shockR, 0, Math.PI * 2);
      ctx.stroke();

      // Transonic vapor cone lines
      ctx.strokeStyle = `rgba(255, 255, 255, ${this.breakthroughFlash * 0.9})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(ringCenterX - shockR, ringCenterY - shockR * 0.6);
      ctx.lineTo(ringCenterX, ringCenterY);
      ctx.lineTo(ringCenterX - shockR, ringCenterY + shockR * 0.6);
      ctx.stroke();
      ctx.restore();
    }
  }

  renderTunnelContours(ctx, w, h) {
    ctx.save();
    // Subtle schematic grid
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.04)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Wind Tunnel Solid Boundaries (Top and Bottom Contours)
    // Left: Contraction cone (tapering inward)
    // Center: Test section / throat (narrowest constriction)
    // Right: Supersonic expansion diffuser (tapering outward)
    const topPoints = [
      { x: 0, y: h * 0.06 },
      { x: w * 0.25, y: h * 0.12 },
      { x: w * 0.44, y: h * 0.15 }, // throat constriction
      { x: w * 0.72, y: h * 0.11 },
      { x: w, y: h * 0.08 }
    ];

    const botPoints = [
      { x: 0, y: h * 0.94 },
      { x: w * 0.25, y: h * 0.88 },
      { x: w * 0.44, y: h * 0.85 }, // throat constriction
      { x: w * 0.72, y: h * 0.89 },
      { x: w, y: h * 0.92 }
    ];

    ctx.strokeStyle = 'rgba(0, 229, 255, 0.35)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);

    // Top contour
    ctx.beginPath();
    ctx.moveTo(topPoints[0].x, topPoints[0].y);
    for (let i = 1; i < topPoints.length; i++) {
      ctx.lineTo(topPoints[i].x, topPoints[i].y);
    }
    ctx.stroke();

    // Bottom contour
    ctx.beginPath();
    ctx.moveTo(botPoints[0].x, botPoints[0].y);
    for (let i = 1; i < botPoints.length; i++) {
      ctx.lineTo(botPoints[i].x, botPoints[i].y);
    }
    ctx.stroke();

    // Mach station boundary tick marks
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(0, 229, 255, 0.4)';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillText('STA-00: SETTLING PLENUM', 14, h * 0.05);
    ctx.fillText('STA-04: CONTRACTION', w * 0.22, h * 0.10);
    ctx.fillText('STA-08: THROAT NOZZLE', w * 0.41, h * 0.13);
    ctx.fillText('STA-12: SUPERSONIC DIFFUSER', w * 0.72, h * 0.09);

    ctx.restore();
  }

  renderStreamlines(ctx, w, h) {
    ctx.save();
    const isSupersonic = this.mach >= 1.0;
    const isBuildup = this.state === 'BUILDUP';
    const isActive = this.state === 'ACTIVE';

    for (const p of this.particles) {
      const px = p.x * w;
      // Streamline y follows wind tunnel wall contraction
      let contourFactor = 1.0;
      if (p.x < 0.44) {
        contourFactor = 1.0 - (0.44 - p.x) * 0.25;
      } else {
        contourFactor = 1.0 - (p.x - 0.44) * 0.2;
      }
      const py = (h * 0.5) + (p.y - 0.5) * h * 0.72 * contourFactor;

      let strokeColor = 'rgba(0, 229, 255, ';
      let lineWidth = 1.5;

      // Jitter or wave based on laminar vs turbulent state
      let yOffset = 0;
      if (this.lockedSectors.length < 6 && !isActive) {
        // More turbulence when fewer sectors are locked
        const turbFactor = (6 - this.lockedSectors.length) / 6;
        yOffset = Math.sin(p.x * 25 + p.turbulence) * (3.5 * turbFactor);
        strokeColor = turbFactor > 0.5 ? 'rgba(255, 179, 0, ' : 'rgba(0, 229, 255, ';
      } else if (isActive) {
        // Hyper-coherent laminar streaks
        strokeColor = 'rgba(0, 230, 118, ';
        lineWidth = 2.0;
      }

      ctx.strokeStyle = `${strokeColor}${p.alpha * (isSupersonic ? 0.85 : 0.45)})`;
      ctx.lineWidth = lineWidth;

      const pLen = p.length * (isSupersonic ? 2.5 : (isBuildup ? 1.6 : 1.0));

      ctx.beginPath();
      ctx.moveTo(px, py + yOffset);
      ctx.lineTo(px + pLen, py + yOffset);
      ctx.stroke();

      // Particle stagnation head dot
      ctx.fillStyle = `${strokeColor}${p.alpha * 0.9})`;
      ctx.beginPath();
      ctx.arc(px + pLen, py + yOffset, isSupersonic ? 2 : 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  renderSchlierenField(ctx, w, h) {
    ctx.save();
    // Render optical Schlieren density gradient fringes
    const ringCenterX = w * 0.44;
    const ringCenterY = h * 0.50;

    if (this.state === 'ACTIVE' || this.state === 'BUILDUP') {
      const intensity = this.state === 'ACTIVE' ? 1.0 : this.buildupProgress;

      // Oblique shock wave lines emanating from nozzle throat
      ctx.strokeStyle = `rgba(255, 23, 68, ${0.45 * intensity})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);

      // Top oblique shock
      ctx.beginPath();
      ctx.moveTo(ringCenterX, ringCenterY - h * 0.28);
      ctx.lineTo(w * 0.76, ringCenterY);
      ctx.stroke();

      // Bottom oblique shock
      ctx.beginPath();
      ctx.moveTo(ringCenterX, ringCenterY + h * 0.28);
      ctx.lineTo(w * 0.76, ringCenterY);
      ctx.stroke();

      // Reflected expansion shocks
      ctx.strokeStyle = `rgba(0, 229, 255, ${0.35 * intensity})`;
      ctx.beginPath();
      ctx.moveTo(w * 0.76, ringCenterY);
      ctx.lineTo(w * 0.98, ringCenterY - h * 0.22);
      ctx.moveTo(w * 0.76, ringCenterY);
      ctx.lineTo(w * 0.98, ringCenterY + h * 0.22);
      ctx.stroke();

      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  renderShockDiamonds(ctx, w, h) {
    ctx.save();
    const ringCenterY = h * 0.50;
    const t = performance.now() * 0.003;

    for (let i = 0; i < this.shockDiamonds.length; i++) {
      const d = this.shockDiamonds[i];
      const cx = w * d.xNorm;
      const hw = d.width * 0.5;
      const hh = d.height * 0.5 * (1 + Math.sin(t + i) * 0.06);

      // Glowing diamond polygon
      ctx.strokeStyle = `rgba(0, 229, 255, ${0.6 - i * 0.1})`;
      ctx.lineWidth = 2;
      ctx.fillStyle = `rgba(0, 229, 255, ${0.08 - i * 0.015})`;

      ctx.beginPath();
      ctx.moveTo(cx - hw, ringCenterY);
      ctx.lineTo(cx, ringCenterY - hh);
      ctx.lineTo(cx + hw, ringCenterY);
      ctx.lineTo(cx, ringCenterY + hh);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Shock intersection core node
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, ringCenterY, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  renderDialRing(ctx, cx, cy, r) {
    ctx.save();

    // 1. Outer Compass Rim with Azimuth Angle Markings
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    // Secondary concentric calibration ring
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.88, 0, Math.PI * 2);
    ctx.stroke();

    // Stagnation reference ring
    ctx.strokeStyle = 'rgba(0, 230, 118, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.65, 0, Math.PI * 2);
    ctx.stroke();

    // Inner throat aperture ring
    const apertureRadius = r * 0.42;
    ctx.strokeStyle = this.state === 'ACTIVE'
      ? 'rgba(0, 230, 118, 0.85)'
      : (this.state === 'ARMED' ? 'rgba(255, 179, 0, 0.8)' : 'rgba(0, 229, 255, 0.5)');
    ctx.lineWidth = this.state === 'ACTIVE' ? 3.5 : 2;
    ctx.beginPath();
    ctx.arc(cx, cy, apertureRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Aperture interior backdrop
    ctx.fillStyle = this.state === 'ACTIVE'
      ? 'rgba(0, 230, 118, 0.08)'
      : (this.state === 'ARMED' ? 'rgba(255, 179, 0, 0.06)' : 'rgba(7, 11, 16, 0.7)');
    ctx.beginPath();
    ctx.arc(cx, cy, apertureRadius, 0, Math.PI * 2);
    ctx.fill();

    // 2. Azimuth graduation ticks (every 5° and 30°)
    for (let deg = 0; deg < 360; deg += 5) {
      const rad = (deg - 90) * Math.PI / 180;
      const isMajor = deg % 30 === 0;
      const rInner = isMajor ? r * 0.92 : r * 0.96;
      const x1 = cx + Math.cos(rad) * r;
      const y1 = cy + Math.sin(rad) * r;
      const x2 = cx + Math.cos(rad) * rInner;
      const y2 = cy + Math.sin(rad) * rInner;

      ctx.strokeStyle = isMajor ? 'rgba(0, 229, 255, 0.7)' : 'rgba(0, 229, 255, 0.25)';
      ctx.lineWidth = isMajor ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // 3. Render 12 Aerodynamic Vane Sectors
    this.sectors.forEach((sector, idx) => {
      const isLocked = this.lockedSectors.some(s => s.id === sector.id);
      const isSelected = this.selectedSector && this.selectedSector.id === sector.id;
      const sectorRad = (sector.angleDeg - 90) * Math.PI / 180;

      // Radial sector line
      ctx.strokeStyle = isLocked
        ? 'rgba(0, 230, 118, 0.6)'
        : (isSelected ? 'rgba(0, 229, 255, 0.8)' : 'rgba(0, 229, 255, 0.15)');
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(sectorRad) * apertureRadius, cy + Math.sin(sectorRad) * apertureRadius);
      ctx.lineTo(cx + Math.cos(sectorRad) * r * 0.88, cy + Math.sin(sectorRad) * r * 0.88);
      ctx.stroke();

      // Sector node position (between aperture and rim)
      const nodeR = r * 0.76;
      const nodeX = cx + Math.cos(sectorRad) * nodeR;
      const nodeY = cy + Math.sin(sectorRad) * nodeR;

      // Sector backing pip
      ctx.fillStyle = isLocked
        ? 'rgba(0, 230, 118, 0.2)'
        : (isSelected ? 'rgba(0, 229, 255, 0.25)' : 'rgba(12, 18, 25, 0.6)');
      ctx.strokeStyle = isLocked
        ? '#00e676'
        : (isSelected ? '#00e5ff' : 'rgba(0, 229, 255, 0.4)');
      ctx.lineWidth = isLocked || isSelected ? 2 : 1;

      ctx.beginPath();
      ctx.arc(nodeX, nodeY, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // VARIABLE-PITCH GUIDE VANE INDICATOR (Doing real physical work!)
      // Vane pivots based on locked state and calibrated pitch angle
      ctx.save();
      ctx.translate(nodeX, nodeY);
      // If locked: vane is oriented at its exact calibrated pitch angle
      // If unlocked: vane sits at neutral radial or jitters with turbulence
      const vaneAngle = isLocked
        ? sectorRad + (sector.vanePitchVal * Math.PI / 180)
        : sectorRad + (isSelected ? Math.sin(performance.now() * 0.005) * 0.15 : 0);

      ctx.rotate(vaneAngle);
      ctx.strokeStyle = isLocked ? '#00e676' : (isSelected ? '#00e5ff' : 'rgba(255, 179, 0, 0.6)');
      ctx.lineWidth = 2.5;

      // Draw aerodynamic guide vane airfoil blade
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.quadraticCurveTo(0, -3, 10, 0);
      ctx.quadraticCurveTo(0, 3, -10, 0);
      ctx.stroke();

      // Vane hinge pivot dot
      ctx.fillStyle = isLocked ? '#00e676' : '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Sector Code Label
      ctx.fillStyle = isLocked ? '#00e676' : (isSelected ? '#00e5ff' : 'rgba(0, 229, 255, 0.6)');
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const labelR = r * 0.98;
      const lx = cx + Math.cos(sectorRad) * labelR;
      const ly = cy + Math.sin(sectorRad) * labelR;
      ctx.fillText(sector.code, lx, ly);

      // Pitot Dynamic Pressure Status Pip
      const pitotR = r * 0.65;
      const px = cx + Math.cos(sectorRad) * pitotR;
      const py = cy + Math.sin(sectorRad) * pitotR;

      ctx.fillStyle = isLocked ? '#00e676' : (isSelected ? '#00e5ff' : 'rgba(255, 179, 0, 0.4)');
      ctx.beginPath();
      ctx.arc(px, py, isLocked ? 3.5 : 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // 4. Steer Cursor / Azimuth Alignment Vector
    const steerRad = (this.azimuthDeg - 90) * Math.PI / 180;
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.85)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 2]);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(steerRad) * (r * 1.05), cy + Math.sin(steerRad) * (r * 1.05));
    ctx.stroke();
    ctx.setLineDash([]);

    // Steer Azimuth Reticle Head
    const retX = cx + Math.cos(steerRad) * (r * 1.05);
    const retY = cy + Math.sin(steerRad) * (r * 1.05);
    ctx.fillStyle = '#00e5ff';
    ctx.beginPath();
    ctx.arc(retX, retY, 5, 0, Math.PI * 2);
    ctx.fill();

    // 5. Central Throat Core Interior
    this.renderCentralApertureCore(ctx, cx, cy, apertureRadius);

    ctx.restore();
  }

  renderCentralApertureCore(ctx, cx, cy, apertureRadius) {
    ctx.save();
    const t = performance.now() * 0.002;

    if (this.state === 'ACTIVE') {
      // Supersonic Gateway Vortex Ring
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, apertureRadius);
      grad.addColorStop(0, 'rgba(0, 230, 118, 0.95)');
      grad.addColorStop(0.4, 'rgba(0, 229, 255, 0.6)');
      grad.addColorStop(0.8, 'rgba(0, 18, 25, 0.8)');
      grad.addColorStop(1, 'rgba(0, 230, 118, 0.4)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, apertureRadius * 0.95, 0, Math.PI * 2);
      ctx.fill();

      // Rotating supersonic streamline vortex spirals
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      for (let s = 0; s < 4; s++) {
        ctx.beginPath();
        const startA = t * 2 + s * (Math.PI / 2);
        for (let a = 0; a < Math.PI * 2; a += 0.15) {
          const curR = (a / (Math.PI * 2)) * apertureRadius * 0.85;
          const sx = cx + Math.cos(startA + a) * curR;
          const sy = cy + Math.sin(startA + a) * curR;
          if (a === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.stroke();
      }

      // Shock center node
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fill();

      // Status text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('INVERSION ACTIVE', cx, cy + apertureRadius * 0.45);
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillText(`M ${this.mach.toFixed(2)} // SUPERSONIC`, cx, cy + apertureRadius * 0.62);

    } else if (this.state === 'ARMED') {
      // Armed pulsing circle
      const pulse = 0.5 + Math.sin(t * 4) * 0.4;
      ctx.fillStyle = `rgba(255, 179, 0, ${0.12 * pulse})`;
      ctx.beginPath();
      ctx.arc(cx, cy, apertureRadius * 0.85, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(255, 179, 0, ${0.8 * pulse})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, cy, apertureRadius * 0.75, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#ffb300';
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PLENUM ARMED', cx, cy - 8);
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillText('READY TO FIRE', cx, cy + 10);
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.fillText('STANDBY FOR INITIATION', cx, cy + 24);

    } else if (this.state === 'BUILDUP') {
      // Buildup spooling rings
      const spoolA = t * (4 + this.buildupProgress * 12);
      ctx.strokeStyle = 'rgba(255, 179, 0, 0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, apertureRadius * (0.3 + this.buildupProgress * 0.5), 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#ffb300';
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('COMPRESSOR SPOOL', cx, cy - 10);
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.fillText(`M ${this.mach.toFixed(2)}`, cx, cy + 8);
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.fillText(`P0 RAMP: ${(this.buildupProgress * 100).toFixed(0)}%`, cx, cy + 24);

    } else {
      // Standby / Dialing state
      // Crosshairs & Pitot Rake lines
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - apertureRadius * 0.7, cy);
      ctx.lineTo(cx + apertureRadius * 0.7, cy);
      ctx.moveTo(cx, cy - apertureRadius * 0.7);
      ctx.lineTo(cx, cy + apertureRadius * 0.7);
      ctx.stroke();

      // Stagnation pressure circles
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.18)';
      ctx.beginPath();
      ctx.arc(cx, cy, apertureRadius * 0.35, 0, Math.PI * 2);
      ctx.arc(cx, cy, apertureRadius * 0.65, 0, Math.PI * 2);
      ctx.stroke();

      // Lock progress count
      const lockedCount = this.lockedSectors.length;
      ctx.fillStyle = lockedCount === 0 ? 'rgba(0, 229, 255, 0.5)' : '#00e5ff';
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`VANES: ${lockedCount} / 6`, cx, cy - 8);

      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillStyle = lockedCount === 6 ? '#00e676' : 'rgba(0, 229, 255, 0.7)';
      ctx.fillText(lockedCount === 6 ? 'SEAL ACHIEVED' : (lockedCount === 0 ? 'TUNNEL IDLE' : 'ALIGNING...'), cx, cy + 10);
    }
    ctx.restore();
  }
}
