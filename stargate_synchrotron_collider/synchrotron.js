/**
 * Aethel-Ring Collider (ARC) Synchrotron Physics & Visual Simulation Engine
 * Renders the superconducting magnet ring, circulating beam bunches,
 * dynamic magnetic flux excitation, and active particle collision shower portal.
 */

class SynchrotronPhysicsCanvas {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.width = 0;
    this.height = 0;
    this.dpr = window.devicePixelRatio || 1;

    // Simulation State
    this.sectorCount = 16;
    this.lockedSectors = []; // Array of sector indices (0-15)
    this.activeSectorHover = -1;
    this.state = 'STANDBY'; // 'STANDBY', 'ARMED', 'ACTIVATING', 'ACTIVE_COLLISION', 'QUENCH_TRIPPED', 'BEAM_DUMPED'

    // Beam physics parameters
    this.beamEnergy = 0.45; // Base injection energy in TeV
    this.targetBeamEnergy = 0.45;
    this.beamLuminosity = 0.12e34;
    this.targetLuminosity = 0.12e34;
    this.beamPhaseCW = 0;
    this.beamPhaseCCW = Math.PI;
    this.beamSpeed = 0.04;
    this.wakefieldParticles = [];
    this.maxWakefield = 80;

    // Collision Event & Particle Shower Tracker
    this.collisionTracks = [];
    this.calorimeterHits = [];
    this.portalHorizonRadius = 0;
    this.portalHorizonTarget = 0;
    this.portalVortexAngle = 0;
    this.distortionWaveRadius = 0;
    this.collisionFlash = 0;

    // Animation loop
    this.lastTime = performance.now();
    this.running = true;

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.initLoop();
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width || 800;
    this.height = rect.height || 800;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(this.dpr, this.dpr);
  }

  setLockedSectors(sectors) {
    this.lockedSectors = sectors;
    // When locked, ramp energy and luminosity
    const count = sectors.length;
    this.targetBeamEnergy = 0.45 + (count / 6) * 6.5;
    this.targetLuminosity = (0.12 + (count / 6) * 3.4) * 1e34;
    this.beamSpeed = 0.04 + count * 0.012;
  }

  setState(newState, targetData = null) {
    this.state = newState;
    if (targetData) {
      this.targetBeamEnergy = targetData.beamEnergyTeV || 7.25;
      this.targetLuminosity = targetData.luminosity || 3.8e34;
    }

    if (newState === 'STANDBY') {
      this.portalHorizonTarget = 0;
      this.collisionTracks = [];
      this.calorimeterHits = [];
      this.collisionFlash = 0;
      this.targetBeamEnergy = 0.45 + (this.lockedSectors.length / 6) * 6.5;
    } else if (newState === 'ARMED') {
      this.portalHorizonTarget = 0;
      this.collisionFlash = 0;
    } else if (newState === 'ACTIVATING') {
      this.collisionFlash = 1.0;
      this.portalHorizonTarget = 85;
      this.spawnCollisionVertex(targetData);
    } else if (newState === 'ACTIVE_COLLISION') {
      this.portalHorizonTarget = 85;
    } else if (newState === 'BEAM_DUMPED') {
      this.portalHorizonTarget = 0;
      this.collisionTracks = [];
      this.calorimeterHits = [];
      this.collisionFlash = 0;
      this.targetBeamEnergy = 0.0;
      this.targetLuminosity = 0.0;
    }
  }

  spawnCollisionVertex(targetData) {
    // Generate relativistic particle shower tracks
    this.collisionTracks = [];
    this.calorimeterHits = [];
    const trackCount = 45 + Math.floor(Math.random() * 25);
    const energy = targetData ? targetData.beamEnergyTeV : 8.5;

    for (let i = 0; i < trackCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4.5;
      const curvature = (Math.random() - 0.5) * 0.015; // Lorentz force bending in solenoid B-field
      const maxAge = 50 + Math.random() * 90;
      const type = Math.random() < 0.25 ? 'muon' : (Math.random() < 0.6 ? 'hadron' : 'electron');

      this.collisionTracks.push({
        x: 0,
        y: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        angle: angle,
        curvature: curvature,
        age: 0,
        maxAge: maxAge,
        type: type,
        energyGev: (energy / trackCount) * (0.5 + Math.random()),
        points: [{ x: 0, y: 0 }]
      });
    }

    // Calorimeter energy deposition hit towers (around aperture edge)
    for (let i = 0; i < 32; i++) {
      const hitAngle = (i / 32) * Math.PI * 2;
      const energyDep = Math.random() < 0.65 ? Math.random() * 0.9 : 0;
      this.calorimeterHits.push({
        angle: hitAngle,
        energy: energyDep,
        decay: 1.0
      });
    }
  }

  initLoop() {
    const loop = (now) => {
      const dt = Math.min((now - this.lastTime) / 1000, 0.1);
      this.lastTime = now;

      this.update(dt);
      this.render();

      if (this.running) {
        requestAnimationFrame(loop);
      }
    };
    requestAnimationFrame(loop);
  }

  update(dt) {
    // Smooth telemetry interpolation
    this.beamEnergy += (this.targetBeamEnergy - this.beamEnergy) * Math.min(1, dt * 4);
    this.beamLuminosity += (this.targetLuminosity - this.beamLuminosity) * Math.min(1, dt * 4);

    // Circulating bunches
    this.beamPhaseCW += this.beamSpeed;
    if (this.beamPhaseCW > Math.PI * 2) this.beamPhaseCW -= Math.PI * 2;

    this.beamPhaseCCW -= this.beamSpeed;
    if (this.beamPhaseCCW < 0) this.beamPhaseCCW += Math.PI * 2;

    // Wake field synchrotron radiation trail
    if (this.beamEnergy > 0.05) {
      const centerX = this.width / 2;
      const centerY = this.height / 2;
      const radius = Math.min(this.width, this.height) * 0.38;

      // CW bunch wake
      const cwX = centerX + Math.cos(this.beamPhaseCW - Math.PI / 2) * radius;
      const cwY = centerY + Math.sin(this.beamPhaseCW - Math.PI / 2) * radius;
      this.wakefieldParticles.push({
        x: cwX + (Math.random() - 0.5) * 6,
        y: cwY + (Math.random() - 0.5) * 6,
        life: 1.0,
        decay: 0.04 + Math.random() * 0.04,
        size: 1.5 + Math.random() * 2,
        color: '#00f0ff'
      });

      // If ARMED or ACTIVE, counter-rotating CCW bunch wake
      if (this.state === 'ARMED' || this.state === 'ACTIVATING' || this.state === 'ACTIVE_COLLISION') {
        const ccwX = centerX + Math.cos(this.beamPhaseCCW - Math.PI / 2) * radius;
        const ccwY = centerY + Math.sin(this.beamPhaseCCW - Math.PI / 2) * radius;
        this.wakefieldParticles.push({
          x: ccwX + (Math.random() - 0.5) * 6,
          y: ccwY + (Math.random() - 0.5) * 6,
          life: 1.0,
          decay: 0.04 + Math.random() * 0.04,
          size: 1.5 + Math.random() * 2,
          color: '#bf55ec'
        });
      }
    }

    // Update wakefield
    for (let i = this.wakefieldParticles.length - 1; i >= 0; i--) {
      const p = this.wakefieldParticles[i];
      p.life -= p.decay;
      if (p.life <= 0) {
        this.wakefieldParticles.splice(i, 1);
      }
    }

    // Portal horizon expansion & collision vertex
    this.portalHorizonRadius += (this.portalHorizonTarget - this.portalHorizonRadius) * Math.min(1, dt * 5);
    this.portalVortexAngle += dt * 1.8;

    if (this.collisionFlash > 0) {
      this.collisionFlash = Math.max(0, this.collisionFlash - dt * 1.5);
    }

    // Update collision tracks
    if (this.state === 'ACTIVE_COLLISION' || this.state === 'ACTIVATING') {
      // Continuous emission in active state
      if (this.collisionTracks.length < 50 && Math.random() < 0.4) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.2 + Math.random() * 3.8;
        const curvature = (Math.random() - 0.5) * 0.02;
        const type = Math.random() < 0.3 ? 'muon' : 'hadron';
        this.collisionTracks.push({
          x: 0,
          y: 0,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          angle: angle,
          curvature: curvature,
          age: 0,
          maxAge: 40 + Math.random() * 70,
          type: type,
          energyGev: 12 + Math.random() * 45,
          points: [{ x: 0, y: 0 }]
        });
      }

      for (let i = this.collisionTracks.length - 1; i >= 0; i--) {
        const tr = this.collisionTracks[i];
        tr.age++;

        // Curvature deflection (Lorentz force in detector solenoid)
        const currentSpeed = Math.hypot(tr.vx, tr.vy);
        const currentAngle = Math.atan2(tr.vy, tr.vx) + tr.curvature;
        tr.vx = Math.cos(currentAngle) * currentSpeed;
        tr.vy = Math.sin(currentAngle) * currentSpeed;

        tr.x += tr.vx;
        tr.y += tr.vy;
        tr.points.push({ x: tr.x, y: tr.y });
        if (tr.points.length > 20) tr.points.shift();

        if (tr.age >= tr.maxAge) {
          this.collisionTracks.splice(i, 1);
        }
      }
    }
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const cx = w / 2;
    const cy = h / 2;
    const ringRadius = Math.min(w, h) * 0.38;
    const apertureRadius = Math.min(w, h) * 0.14;

    ctx.clearRect(0, 0, w, h);

    // 1. Vacuum Chamber Deep Background Grid & Polar Guides
    this.renderPolarGrid(cx, cy, ringRadius, apertureRadius);

    // 2. Superconducting Magnet Sectors (16 Ring Dipole/Quadrupole cells)
    this.renderMagnetSectors(cx, cy, ringRadius);

    // 3. Ultra-High Vacuum Beam Pipe Channel
    this.renderBeamPipe(cx, cy, ringRadius);

    // 4. Wakefield Synchrotron Photons & Circulating Relativistic Bunches
    this.renderBeamBunches(cx, cy, ringRadius);

    // 5. Central Interaction Point (IP) Detector Solenoid & Aperture Chamber
    this.renderInteractionAperture(cx, cy, apertureRadius);

    // 6. Collision Particle Shower Reconstruction & Inversion Portal Horizon
    if (this.state === 'ACTIVATING' || this.state === 'ACTIVE_COLLISION' || this.portalHorizonRadius > 1) {
      this.renderCollisionPortal(cx, cy, apertureRadius);
    }

    // 7. Initial Collision Ionization Flash
    if (this.collisionFlash > 0.01) {
      ctx.save();
      const flashGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, ringRadius * 1.2);
      flashGrad.addColorStop(0, `rgba(255, 255, 255, ${this.collisionFlash * 0.85})`);
      flashGrad.addColorStop(0.3, `rgba(0, 240, 255, ${this.collisionFlash * 0.6})`);
      flashGrad.addColorStop(0.7, `rgba(191, 85, 236, ${this.collisionFlash * 0.3})`);
      flashGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = flashGrad;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
  }

  renderPolarGrid(cx, cy, ringRadius, apertureRadius) {
    const ctx = this.ctx;
    ctx.save();

    // Concentric guide rings
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.06)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);

    [apertureRadius * 1.5, ringRadius * 0.65, ringRadius * 0.85, ringRadius * 1.15].forEach(r => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Radial azimuthal cross-hairs
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * (apertureRadius * 1.2), cy + Math.sin(angle) * (apertureRadius * 1.2));
      ctx.lineTo(cx + Math.cos(angle) * (ringRadius * 1.22), cy + Math.sin(angle) * (ringRadius * 1.22));
      ctx.stroke();
    }

    ctx.setLineDash([]);
    ctx.restore();
  }

  renderBeamPipe(cx, cy, ringRadius) {
    const ctx = this.ctx;
    ctx.save();

    const pipeWidth = 14;

    // Outer Cryostat Vacuum Shield
    ctx.beginPath();
    ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(20, 45, 75, 0.85)';
    ctx.lineWidth = pipeWidth + 8;
    ctx.stroke();

    // Inner Beam Channel Pipe
    ctx.beginPath();
    ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(8, 20, 35, 0.95)';
    ctx.lineWidth = pipeWidth;
    ctx.stroke();

    // High-Vacuum Core Guide Line
    ctx.beginPath();
    ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.22)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }

  renderMagnetSectors(cx, cy, ringRadius) {
    const ctx = this.ctx;
    ctx.save();

    for (let i = 0; i < this.sectorCount; i++) {
      const angle = (i / this.sectorCount) * Math.PI * 2 - Math.PI / 2;
      const isLocked = this.lockedSectors.includes(i);
      const isHovered = this.activeSectorHover === i;
      const orderIndex = this.lockedSectors.indexOf(i);

      const secX = cx + Math.cos(angle) * ringRadius;
      const secY = cy + Math.sin(angle) * ringRadius;

      // Sector Magnet Housing Width & Arc
      const arcSpan = (Math.PI * 2 / this.sectorCount) * 0.72;
      const startArc = angle - arcSpan / 2;
      const endArc = angle + arcSpan / 2;

      // Draw Magnet Body Arc
      ctx.beginPath();
      ctx.arc(cx, cy, ringRadius, startArc, endArc);
      ctx.lineWidth = 24;

      if (isLocked) {
        // Superconducting Dipole Active Field
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.85)';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 16;
      } else if (isHovered) {
        ctx.strokeStyle = 'rgba(255, 170, 0, 0.75)';
        ctx.shadowColor = '#ffaa00';
        ctx.shadowBlur = 12;
      } else {
        ctx.strokeStyle = 'rgba(24, 48, 72, 0.7)';
        ctx.shadowBlur = 0;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Sector Magnet Pole Ends (Quadrupole Doublet Caps)
      const capInnerR = ringRadius - 16;
      const capOuterR = ringRadius + 16;
      ctx.strokeStyle = isLocked ? '#00f0ff' : 'rgba(70, 110, 150, 0.4)';
      ctx.lineWidth = 2;

      [-arcSpan / 2, arcSpan / 2].forEach(dAng => {
        const ca = angle + dAng;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ca) * capInnerR, cy + Math.sin(ca) * capInnerR);
        ctx.lineTo(cx + Math.cos(ca) * capOuterR, cy + Math.sin(ca) * capOuterR);
        ctx.stroke();
      });

      // Sector Center Coil Pin & Order Indicator
      const pinRadius = isLocked ? 7 : (isHovered ? 6 : 4);
      ctx.beginPath();
      ctx.arc(secX, secY, pinRadius, 0, Math.PI * 2);
      ctx.fillStyle = isLocked ? '#ffffff' : (isHovered ? '#ffaa00' : 'rgba(0, 240, 255, 0.4)');
      if (isLocked) {
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 10;
      }
      ctx.fill();
      ctx.shadowBlur = 0;

      // Sector Label (S-01 to S-16) outer radial text
      const labelR = ringRadius + 32;
      const lx = cx + Math.cos(angle) * labelR;
      const ly = cy + Math.sin(angle) * labelR;
      const secLabel = `S-${String(i + 1).padStart(2, '0')}`;

      ctx.font = isLocked ? 'bold 11px "JetBrains Mono", monospace' : '9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isLocked ? '#00f0ff' : (isHovered ? '#ffaa00' : 'rgba(120, 160, 200, 0.6)');
      ctx.fillText(secLabel, lx, ly);

      // Order Badge if Locked (e.g. #1, #2...)
      if (isLocked && orderIndex !== -1) {
        const badgeR = ringRadius - 30;
        const bx = cx + Math.cos(angle) * badgeR;
        const by = cy + Math.sin(angle) * badgeR;

        ctx.beginPath();
        ctx.arc(bx, by, 9, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 240, 255, 0.2)';
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 1.5;
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`${orderIndex + 1}`, bx, by);

        // Magnetic Flux Correction Lines toward Aperture
        ctx.beginPath();
        ctx.moveTo(secX, secY);
        ctx.lineTo(bx, by);
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    ctx.restore();
  }

  renderBeamBunches(cx, cy, ringRadius) {
    const ctx = this.ctx;
    ctx.save();

    // 1. Wakefield Photons
    for (let p of this.wakefieldParticles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life * 0.7;
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    if (this.beamEnergy > 0.05) {
      // 2. Primary CW Beam Bunch (Clockwise - Leptons / Protons)
      const cwAngle = this.beamPhaseCW - Math.PI / 2;
      const cwX = cx + Math.cos(cwAngle) * ringRadius;
      const cwY = cy + Math.sin(cwAngle) * ringRadius;

      // Glow Core
      const cwGrad = ctx.createRadialGradient(cwX, cwY, 0, cwX, cwY, 18);
      cwGrad.addColorStop(0, '#ffffff');
      cwGrad.addColorStop(0.3, '#00f0ff');
      cwGrad.addColorStop(0.7, 'rgba(0, 240, 255, 0.4)');
      cwGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');

      ctx.fillStyle = cwGrad;
      ctx.beginPath();
      ctx.arc(cwX, cwY, 18, 0, Math.PI * 2);
      ctx.fill();

      // Sharp Relativistic Core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cwX, cwY, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // 3. Counter-Rotating CCW Beam Bunch (Armed / Active Collision State)
      if (this.state === 'ARMED' || this.state === 'ACTIVATING' || this.state === 'ACTIVE_COLLISION') {
        const ccwAngle = this.beamPhaseCCW - Math.PI / 2;
        const ccwX = cx + Math.cos(ccwAngle) * ringRadius;
        const ccwY = cy + Math.sin(ccwAngle) * ringRadius;

        const ccwGrad = ctx.createRadialGradient(ccwX, ccwY, 0, ccwX, ccwY, 18);
        ccwGrad.addColorStop(0, '#ffffff');
        ccwGrad.addColorStop(0.3, '#bf55ec');
        ccwGrad.addColorStop(0.7, 'rgba(191, 85, 236, 0.4)');
        ccwGrad.addColorStop(1, 'rgba(191, 85, 236, 0)');

        ctx.fillStyle = ccwGrad;
        ctx.beginPath();
        ctx.arc(ccwX, ccwY, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ccwX, ccwY, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  renderInteractionAperture(cx, cy, apertureRadius) {
    const ctx = this.ctx;
    ctx.save();

    // Solenoid Tracker Outer Ring
    ctx.beginPath();
    ctx.arc(cx, cy, apertureRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Drift Chamber Concentric Layers
    [0.35, 0.6, 0.85].forEach(frac => {
      ctx.beginPath();
      ctx.arc(cx, cy, apertureRadius * frac, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(40, 80, 120, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 5]);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    // Solenoid Calorimeter Segments (32 wedges around aperture)
    for (let i = 0; i < 32; i++) {
      const startA = (i / 32) * Math.PI * 2;
      const endA = ((i + 0.8) / 32) * Math.PI * 2;
      const hit = this.calorimeterHits[i];

      ctx.beginPath();
      ctx.arc(cx, cy, apertureRadius + 6, startA, endA);
      ctx.lineWidth = 6;

      if (hit && hit.energy > 0) {
        ctx.strokeStyle = `rgba(255, ${Math.floor(120 + hit.energy * 100)}, 0, ${0.4 + hit.energy * 0.5})`;
      } else {
        ctx.strokeStyle = 'rgba(20, 40, 65, 0.6)';
      }
      ctx.stroke();
    }

    // Focal Reticle Cross-Hairs
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = 1;
    const rLen = apertureRadius * 0.25;

    ctx.beginPath();
    ctx.moveTo(cx - rLen, cy); ctx.lineTo(cx + rLen, cy);
    ctx.moveTo(cx, cy - rLen); ctx.lineTo(cx, cy + rLen);
    ctx.stroke();

    ctx.restore();
  }

  renderCollisionPortal(cx, cy, apertureRadius) {
    const ctx = this.ctx;
    ctx.save();

    const r = this.portalHorizonRadius;
    if (r <= 0.5) {
      ctx.restore();
      return;
    }

    // 1. Quantum Inversion Wormhole Swirl (Cherenkov Singularity Horizon)
    const portalGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    portalGrad.addColorStop(0, '#03050a'); // Singularity center
    portalGrad.addColorStop(0.45, 'rgba(0, 40, 80, 0.95)');
    portalGrad.addColorStop(0.75, 'rgba(0, 240, 255, 0.85)');
    portalGrad.addColorStop(0.92, 'rgba(191, 85, 236, 0.9)');
    portalGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');

    ctx.fillStyle = portalGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // 2. Gravitational Lensing & Vortex Flux Spiral Arms
    const spiralArms = 4;
    for (let i = 0; i < spiralArms; i++) {
      const armOffset = (i / spiralArms) * Math.PI * 2 + this.portalVortexAngle;
      ctx.beginPath();
      for (let step = 0; step <= 30; step++) {
        const frac = step / 30;
        const spiralR = frac * r * 0.95;
        const spiralA = armOffset + frac * Math.PI * 2.5;
        const sx = cx + Math.cos(spiralA) * spiralR;
        const sy = cy + Math.sin(spiralA) * spiralR;
        if (step === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(0, 240, 255, 0.65)' : 'rgba(191, 85, 236, 0.65)';
      ctx.lineWidth = 1.8;
      ctx.stroke();
    }

    // 3. Relativistic Particle Shower Tracks (Muon drift & Hadronic jets)
    for (let tr of this.collisionTracks) {
      if (tr.points.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(cx + tr.points[0].x, cy + tr.points[0].y);
      for (let p of tr.points) {
        ctx.lineTo(cx + p.x, cy + p.y);
      }

      const alpha = 1.0 - (tr.age / tr.maxAge);
      if (tr.type === 'muon') {
        ctx.strokeStyle = `rgba(0, 240, 255, ${alpha * 0.9})`;
        ctx.lineWidth = 2.0;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 6;
      } else if (tr.type === 'hadron') {
        ctx.strokeStyle = `rgba(255, 170, 0, ${alpha * 0.85})`;
        ctx.lineWidth = 1.4;
        ctx.shadowBlur = 0;
      } else {
        ctx.strokeStyle = `rgba(191, 85, 236, ${alpha * 0.85})`;
        ctx.lineWidth = 1.2;
        ctx.shadowBlur = 0;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Track Head Spark
      const lastP = tr.points[tr.points.length - 1];
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx + lastP.x, cy + lastP.y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Luminous Cherenkov Event Horizon Ring
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.95, 0, Math.PI * 2);
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 14;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.restore();
  }
}

// -------------------------------------------------------------
// Alternate Synoptic Tunnel Schematic Canvas (Tunnel Map View)
// -------------------------------------------------------------
class SynopticTunnelCanvas {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.width = 0;
    this.height = 0;
    this.dpr = window.devicePixelRatio || 1;
    this.phaseAngle = 0;

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.startLoop();
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width || 700;
    this.height = rect.height || 400;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(this.dpr, this.dpr);
  }

  startLoop() {
    const loop = () => {
      this.phaseAngle += 0.035;
      if (this.phaseAngle > Math.PI * 2) this.phaseAngle -= Math.PI * 2;
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    // Dark technical schematic background
    ctx.fillStyle = '#060a10';
    ctx.fillRect(0, 0, w, h);

    // Schematic Grid
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 20; x < w; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 20; y < h; y += 30) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // --- 1. LINEAR PRE-INJECTOR (LINAC) ---
    const linacY = 70;
    ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
    ctx.fillRect(30, linacY - 12, 140, 24);
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(30, linacY - 12, 140, 24);

    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#00f0ff';
    ctx.textAlign = 'center';
    ctx.fillText('LINAC-4 (160 MeV)', 100, linacY + 4);

    // Beam transfer line to Booster
    ctx.beginPath();
    ctx.moveTo(170, linacY);
    ctx.lineTo(230, linacY);
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.stroke();

    // --- 2. BOOSTER SYNCHROTRON (PSB) ---
    const boosterCX = 290;
    const boosterCY = linacY;
    const boosterR = 40;

    ctx.beginPath();
    ctx.arc(boosterCX, boosterCY, boosterR, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 170, 0, 0.8)';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#ffaa00';
    ctx.fillText('PSB (2.0 GeV)', boosterCX, boosterCY);

    // Transfer line to Main Collider
    ctx.beginPath();
    ctx.moveTo(boosterCX + boosterR, boosterCY);
    ctx.bezierCurveTo(380, boosterCY, 400, 180, 430, 200);
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.stroke();

    // --- 3. MAIN AETHEL-RING COLLIDER (ARC) TUNNEL ---
    const ringCX = w * 0.68;
    const ringCY = h * 0.58;
    const ringR = Math.min(w * 0.28, h * 0.36);

    // Ring Outer Tunnel Wall
    ctx.beginPath();
    ctx.arc(ringCX, ringCY, ringR, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = 12;
    ctx.stroke();

    // Ring Vacuum Tube
    ctx.beginPath();
    ctx.arc(ringCX, ringCY, ringR, 0, Math.PI * 2);
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Interaction Point IR-1 (Aperture Zero)
    const ipX = ringCX + Math.cos(0) * ringR;
    const ipY = ringCY + Math.sin(0) * ringR;
    ctx.beginPath();
    ctx.arc(ipX, ipY, 10, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(191, 85, 236, 0.4)';
    ctx.strokeStyle = '#bf55ec';
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('IR-1', ipX, ipY - 14);

    // RF Cavities (Acceleration sectors)
    const rfAngle = Math.PI;
    const rfX = ringCX + Math.cos(rfAngle) * ringR;
    const rfY = ringCY + Math.sin(rfAngle) * ringR;
    ctx.fillStyle = '#ffaa00';
    ctx.fillRect(rfX - 8, rfY - 10, 16, 20);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('RF-CAV', rfX, rfY + 20);

    // --- 4. LIVE BETATRON PHASE-SPACE ELLIPSE (Bottom Left) ---
    const phaseBoxX = 30;
    const phaseBoxY = h - 140;
    const phaseBoxW = 190;
    const phaseBoxH = 120;

    ctx.fillStyle = 'rgba(5, 15, 25, 0.85)';
    ctx.fillRect(phaseBoxX, phaseBoxY, phaseBoxW, phaseBoxH);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(phaseBoxX, phaseBoxY, phaseBoxW, phaseBoxH);

    ctx.font = 'bold 9px "JetBrains Mono", monospace';
    ctx.fillStyle = '#00f0ff';
    ctx.textAlign = 'left';
    ctx.fillText('BETATRON PHASE SPACE (x, x\')', phaseBoxX + 8, phaseBoxY + 16);

    // Coordinate Axes
    const pCX = phaseBoxX + phaseBoxW / 2;
    const pCY = phaseBoxY + phaseBoxH / 2 + 6;
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
    ctx.beginPath();
    ctx.moveTo(phaseBoxX + 10, pCY); ctx.lineTo(phaseBoxX + phaseBoxW - 10, pCY);
    ctx.moveTo(pCX, phaseBoxY + 24); ctx.lineTo(pCX, phaseBoxY + phaseBoxH - 8);
    ctx.stroke();

    // Dynamic Phase Ellipse
    ctx.beginPath();
    const emittanceA = 40;
    const emittanceB = 22;
    ctx.ellipse(pCX, pCY, emittanceA, emittanceB, -Math.PI / 6, 0, Math.PI * 2);
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Orbiting particle in phase space
    const particlePhase = this.phaseAngle * 2.5;
    const partPX = pCX + Math.cos(particlePhase) * emittanceA * Math.cos(-Math.PI / 6) - Math.sin(particlePhase) * emittanceB * Math.sin(-Math.PI / 6);
    const partPY = pCY + Math.cos(particlePhase) * emittanceA * Math.sin(-Math.PI / 6) + Math.sin(particlePhase) * emittanceB * Math.cos(-Math.PI / 6);

    ctx.beginPath();
    ctx.arc(partPX, partPY, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }
}

window.SynchrotronPhysicsCanvas = SynchrotronPhysicsCanvas;
window.SynopticTunnelCanvas = SynopticTunnelCanvas;
