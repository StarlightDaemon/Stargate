/**
 * DigitalAstrolabe - Canvas Stereographic Projection & Rete Engine
 * Hyperion Astronavigation Institute // Series IX Digital Astrolabe
 * Features physical Rete star wheel rotation, altitude almucantar locks,
 * and 3-stage central portal warp singularity aperture.
 */

class DigitalAstrolabe {
  constructor(canvas, audio, navEngine) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.audio = audio;
    this.navEngine = navEngine;

    // Dimensions & DPR
    this.width = 0;
    this.height = 0;
    this.cx = 0;
    this.cy = 0;
    this.radius = 0;

    // Rete Physics & Rotation
    this.reteAngle = 0; // Current Rete rotation (radians)
    this.targetReteAngle = 0; // Target Rete angle (radians)
    this.reteAngularVel = 0;
    this.isRotating = false;
    this.lastAlignedStarIndex = null;
    this.alignmentPulseTimer = 0;
    this.lockedAlmucantarAlt = null;

    // Portal Aperture State
    // 'idle' | 'buildup' | 'breakthrough' | 'sustained'
    this.portalState = 'idle';
    this.buildupProgress = 0; // 0 to 1
    this.breakthroughTime = 0;
    this.apertureIrisOpen = 0.15; // 0.15 idle -> 0.85 active
    this.portalParticles = [];

    // Background Dust / Nebula Particles
    this.ambientParticles = [];
    this.initParticles();

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.startLoop();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width > 0 ? rect.width : (this.canvas.parentElement ? this.canvas.parentElement.clientWidth : 700) || 700;
    this.height = rect.height > 0 ? rect.height : (this.canvas.parentElement ? this.canvas.parentElement.clientHeight : 700) || 700;

    this.canvas.width = Math.floor(this.width * dpr);
    this.canvas.height = Math.floor(this.height * dpr);
    this.ctx.scale(dpr, dpr);

    this.cx = this.width / 2;
    this.cy = this.height / 2;
    this.radius = Math.max(50, Math.min(this.cx, this.cy) * 0.94);
  }

  initParticles() {
    this.ambientParticles = [];
    for (let i = 0; i < 70; i++) {
      this.ambientParticles.push({
        x: (Math.random() - 0.5) * 600,
        y: (Math.random() - 0.5) * 600,
        r: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.7 + 0.2,
        speed: (Math.random() * 0.2 + 0.05) * (Math.random() > 0.5 ? 1 : -1)
      });
    }

    this.portalParticles = [];
    for (let i = 0; i < 180; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 80 + 10;
      this.portalParticles.push({
        angle,
        dist,
        speed: Math.random() * 0.03 + 0.01,
        radialSpeed: Math.random() * 0.4 + 0.1,
        size: Math.random() * 2.2 + 0.8,
        color: Math.random() > 0.4 ? '#00f0ff' : '#ffaa00',
        alpha: Math.random() * 0.8 + 0.2
      });
    }
  }

  rotateToStar(star) {
    if (!star) return;
    // Calculate angle required to align this star's polar position to the top Sighting Meridian (at -PI/2)
    const starReteRad = (star.reteAngle * Math.PI) / 180;
    // We want (starReteRad + reteAngle) % 2PI == -PI/2 (top alidade)
    let target = -Math.PI / 2 - starReteRad;

    // Normalize shortest rotation direction
    let diff = (target - this.reteAngle) % (Math.PI * 2);
    if (diff > Math.PI) diff -= Math.PI * 2;
    if (diff < -Math.PI) diff += Math.PI * 2;

    this.targetReteAngle = this.reteAngle + diff;
    this.isRotating = true;
    this.lastAlignedStarIndex = star.index;
    this.lockedAlmucantarAlt = star.targetAlt;
  }

  setPortalState(state, buildupProgress = 0) {
    const prevState = this.portalState;
    this.portalState = state;
    this.buildupProgress = buildupProgress;

    if (state === 'breakthrough') {
      this.breakthroughTime = 0;
    }
  }

  startLoop() {
    let lastTime = performance.now();

    const loop = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      this.update(dt);
      this.render();

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  update(dt) {
    // 1. Rete Rotation Physics (Damped Harmonic Rotational Motion)
    if (this.isRotating) {
      const angleDiff = this.targetReteAngle - this.reteAngle;
      const spring = 14.0;
      const damping = 0.82;

      this.reteAngularVel += angleDiff * spring * dt;
      this.reteAngularVel *= Math.pow(damping, dt * 60);
      this.reteAngle += this.reteAngularVel * dt;

      // Update Audio Servo pitch based on rotational velocity
      if (this.audio) {
        this.audio.updateServo(this.reteAngularVel);
      }

      // Check for alignment lock completion
      if (Math.abs(angleDiff) < 0.005 && Math.abs(this.reteAngularVel) < 0.01) {
        this.reteAngle = this.targetReteAngle;
        this.reteAngularVel = 0;
        this.isRotating = false;
        this.alignmentPulseTimer = 1.0; // Trigger visual lock pulse

        if (this.audio && this.lastAlignedStarIndex !== null) {
          const star = NAV_STARS[this.lastAlignedStarIndex];
          this.audio.playAlignmentLock(star.index, star.targetAlt);
        }
      }
    } else {
      if (this.audio) {
        this.audio.updateServo(0);
      }
    }

    // Alignment pulse decay
    if (this.alignmentPulseTimer > 0) {
      this.alignmentPulseTimer = Math.max(0, this.alignmentPulseTimer - dt * 2.2);
    }

    // 2. Portal Aperture Transitions
    if (this.portalState === 'idle') {
      this.apertureIrisOpen += (0.15 - this.apertureIrisOpen) * dt * 4;
    } else if (this.portalState === 'buildup') {
      const targetIris = 0.15 + (this.buildupProgress * 0.45);
      this.apertureIrisOpen += (targetIris - this.apertureIrisOpen) * dt * 8;
      // Add slight agitation jitter
      this.reteAngle += (Math.sin(performance.now() * 0.03) * 0.0008 * this.buildupProgress);
    } else if (this.portalState === 'breakthrough') {
      this.breakthroughTime += dt;
      this.apertureIrisOpen += (0.92 - this.apertureIrisOpen) * dt * 12;
    } else if (this.portalState === 'sustained') {
      this.apertureIrisOpen += (0.85 - this.apertureIrisOpen) * dt * 4;
    }

    // 3. Portal Particle Dynamics
    if (this.portalState === 'sustained' || this.portalState === 'buildup' || this.portalState === 'breakthrough') {
      this.portalParticles.forEach(p => {
        p.angle += p.speed * (this.portalState === 'sustained' ? 2.5 : 1.2);
        p.dist -= p.radialSpeed * (this.portalState === 'sustained' ? 3.0 : 1.5);
        if (p.dist < 8) {
          p.dist = (this.radius * this.apertureIrisOpen * 0.5) + Math.random() * 30;
          p.angle = Math.random() * Math.PI * 2;
        }
      });
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Coordinate Center
    this.ctx.save();
    this.ctx.translate(this.cx, this.cy);

    // 1. Ambient Background Grid & Stars
    this.renderBackgroundGrid();

    // 2. Fixed Plate: The Tympan (Stereographic Almucantars & Azimuth Arcs)
    this.renderTympan();

    // 3. Rotating Star Wheel: The Rete
    this.renderRete();

    // 4. Sighting Meridian & Alidade Alignment Line
    this.renderSightingAlidade();

    // 5. Central Event Horizon Portal Aperture (The Gateway Iris)
    this.renderPortalAperture();

    // 6. Outer Precision Degree Limb / Limb Bezel
    this.renderOuterLimb();

    this.ctx.restore();
  }

  renderBackgroundGrid() {
    // Subtle background radar reticle & drift particles
    this.ctx.save();
    this.ctx.fillStyle = '#03060f';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    this.ctx.fill();

    // Ambient dust
    this.ctx.fillStyle = '#00f0ff';
    this.ambientParticles.forEach(p => {
      this.ctx.globalAlpha = p.alpha * 0.4;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.globalAlpha = 1.0;
    this.ctx.restore();
  }

  renderTympan() {
    this.ctx.save();

    // Altitude Circles: Almucantars (0° horizon at outer edge to 90° zenith at center)
    // Real stereographic projection circles
    const altitudes = [0, 15, 30, 45, 60, 75, 85];
    const maxR = this.radius * 0.88;
    const minR = this.radius * 0.16;

    altitudes.forEach(alt => {
      // Linear or stereographic radius factor
      const t = 1 - (alt / 90);
      const r = minR + (maxR - minR) * t;

      this.ctx.beginPath();
      this.ctx.arc(0, 0, r, 0, Math.PI * 2);

      // If this almucantar matches currently locked star altitude and is pulsing
      const isLockedAlt = this.lockedAlmucantarAlt !== null && Math.abs(this.lockedAlmucantarAlt - alt) < 8;
      
      if (isLockedAlt && this.alignmentPulseTimer > 0) {
        this.ctx.strokeStyle = `rgba(0, 240, 255, ${0.4 + this.alignmentPulseTimer * 0.6})`;
        this.ctx.lineWidth = 2.5 + this.alignmentPulseTimer * 2;
        this.ctx.shadowColor = '#00f0ff';
        this.ctx.shadowBlur = 12 * this.alignmentPulseTimer;
      } else {
        this.ctx.strokeStyle = alt === 0 ? 'rgba(0, 240, 255, 0.45)' : 'rgba(0, 240, 255, 0.15)';
        this.ctx.lineWidth = alt === 0 ? 1.8 : 1.0;
        this.ctx.shadowBlur = 0;
      }
      this.ctx.stroke();

      // Almucantar Altitude Label
      if (alt > 0) {
        this.ctx.fillStyle = 'rgba(0, 240, 255, 0.55)';
        this.ctx.font = '9px "JetBrains Mono", monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`${alt}° ALT`, r + 4, -4);
      }
    });

    // Azimuth Radials (Arcs radiating from zenith to horizon)
    const azimuths = [0, 45, 90, 135, 180, 225, 270, 315];
    azimuths.forEach(az => {
      const rad = ((az - 90) * Math.PI) / 180;
      this.ctx.beginPath();
      this.ctx.moveTo(Math.cos(rad) * minR, Math.sin(rad) * minR);
      this.ctx.lineTo(Math.cos(rad) * maxR, Math.sin(rad) * maxR);
      this.ctx.strokeStyle = (az % 90 === 0) ? 'rgba(0, 240, 255, 0.25)' : 'rgba(0, 240, 255, 0.10)';
      this.ctx.lineWidth = 1;
      this.ctx.setLineDash([2, 4]);
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    });

    // Ecliptic / Oblique Meridian Arc
    this.ctx.beginPath();
    this.ctx.ellipse(0, maxR * 0.2, maxR * 0.75, maxR * 0.45, Math.PI / 6, 0, Math.PI * 2);
    this.ctx.strokeStyle = 'rgba(255, 170, 0, 0.22)';
    this.ctx.lineWidth = 1.2;
    this.ctx.stroke();

    this.ctx.restore();
  }

  renderRete() {
    this.ctx.save();
    this.ctx.rotate(this.reteAngle);

    const maxR = this.radius * 0.88;
    const minR = this.radius * 0.16;

    // Rete Structure Framework (Delicate openwork filigree vector arcs)
    this.ctx.beginPath();
    this.ctx.arc(0, 0, maxR * 0.82, 0, Math.PI * 2);
    this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
    this.ctx.lineWidth = 1.2;
    this.ctx.stroke();

    // Rete connecting arms
    for (let i = 0; i < 6; i++) {
      const armAngle = (i * Math.PI) / 3;
      this.ctx.beginPath();
      this.ctx.moveTo(Math.cos(armAngle) * minR * 1.5, Math.sin(armAngle) * minR * 1.5);
      this.ctx.lineTo(Math.cos(armAngle) * maxR * 0.82, Math.sin(armAngle) * maxR * 0.82);
      this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.18)';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    }

    // Render 12 Navigational Stars and their Pointers on Rete
    NAV_STARS.forEach((star) => {
      const isSelected = this.navEngine.isSightSelected(star.id);
      const isCurrentlyAligned = this.lastAlignedStarIndex === star.index && !this.isRotating;

      const angleRad = (star.reteAngle * Math.PI) / 180;
      // Radial position calibrated by target altitude
      const altFactor = 1 - (star.targetAlt / 90);
      const r = minR + (maxR - minR) * altFactor;

      const sx = Math.cos(angleRad) * r;
      const sy = Math.sin(angleRad) * r;

      // Pointer Line from Rete Frame
      this.ctx.beginPath();
      this.ctx.moveTo(Math.cos(angleRad) * (maxR * 0.82), Math.sin(angleRad) * (maxR * 0.82));
      this.ctx.lineTo(sx, sy);
      this.ctx.strokeStyle = isSelected ? 'rgba(255, 170, 0, 0.7)' : 'rgba(0, 240, 255, 0.25)';
      this.ctx.lineWidth = isSelected ? 1.5 : 0.8;
      this.ctx.stroke();

      // Star Pointer Glyph / Reticle
      this.ctx.save();
      this.ctx.translate(sx, sy);

      if (isSelected) {
        // Glowing Active Pointer
        this.ctx.shadowColor = '#ffaa00';
        this.ctx.shadowBlur = 10;

        this.ctx.fillStyle = '#ffaa00';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
        this.ctx.fill();

        // Outer Reticle Calipers
        this.ctx.strokeStyle = '#00f0ff';
        this.ctx.lineWidth = 1.2;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 9, 0, Math.PI * 2);
        this.ctx.stroke();

        // Crosshairs
        this.ctx.beginPath();
        this.ctx.moveTo(-12, 0); this.ctx.lineTo(-7, 0);
        this.ctx.moveTo(7, 0); this.ctx.lineTo(12, 0);
        this.ctx.moveTo(0, -12); this.ctx.lineTo(0, -7);
        this.ctx.moveTo(0, 7); this.ctx.lineTo(0, 12);
        this.ctx.stroke();
      } else {
        // Inactive Star Node
        this.ctx.fillStyle = star.color || '#00f0ff';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 3, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
        this.ctx.lineWidth = 0.8;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 6, 0, Math.PI * 2);
        this.ctx.stroke();
      }

      // Star Label & Designation
      this.ctx.shadowBlur = 0;
      this.ctx.font = '8px "JetBrains Mono", monospace';
      this.ctx.fillStyle = isSelected ? '#ffdd88' : 'rgba(200, 230, 255, 0.65)';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(star.name, 0, 16);
      this.ctx.fillStyle = isSelected ? '#00f0ff' : 'rgba(0, 240, 255, 0.4)';
      this.ctx.fillText(`[${star.designation}]`, 0, 25);

      this.ctx.restore();
    });

    this.ctx.restore();
  }

  renderSightingAlidade() {
    this.ctx.save();
    const maxR = this.radius * 0.90;
    const minR = this.radius * 0.16;

    // Primary Sighting Meridian (Top vertical alignment axis at 0° / 360° North)
    this.ctx.beginPath();
    this.ctx.moveTo(0, -maxR);
    this.ctx.lineTo(0, -minR);
    this.ctx.strokeStyle = 'rgba(255, 51, 102, 0.85)';
    this.ctx.lineWidth = 1.8;
    this.ctx.shadowColor = '#ff3366';
    this.ctx.shadowBlur = 8;
    this.ctx.stroke();

    // Alignment Reticle Sights at Top
    this.ctx.fillStyle = '#ff3366';
    this.ctx.beginPath();
    this.ctx.moveTo(0, -maxR - 2);
    this.ctx.lineTo(-6, -maxR - 12);
    this.ctx.lineTo(6, -maxR - 12);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.font = '9px "Orbitron", sans-serif';
    this.ctx.fillStyle = '#ff3366';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('ZENITH SIGHTING ALIDADE', 0, -maxR - 16);

    this.ctx.restore();
  }

  renderPortalAperture() {
    this.ctx.save();
    const irisR = this.radius * this.apertureIrisOpen * 0.42;

    // 1. Central Event Horizon Dark Core
    const grad = this.ctx.createRadialGradient(0, 0, 2, 0, 0, Math.max(10, irisR));
    if (this.portalState === 'sustained') {
      grad.addColorStop(0, '#000000');
      grad.addColorStop(0.3, '#001a33');
      grad.addColorStop(0.7, '#005580');
      grad.addColorStop(0.92, '#00f0ff');
      grad.addColorStop(1, 'rgba(0, 240, 255, 0)');
    } else if (this.portalState === 'buildup') {
      grad.addColorStop(0, '#020510');
      grad.addColorStop(0.5, '#0a2233');
      grad.addColorStop(0.85, '#ffaa00');
      grad.addColorStop(1, 'rgba(255, 170, 0, 0)');
    } else {
      grad.addColorStop(0, '#02050c');
      grad.addColorStop(0.7, '#05111a');
      grad.addColorStop(1, 'rgba(0, 240, 255, 0.15)');
    }

    this.ctx.fillStyle = grad;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, Math.max(10, irisR * 1.15), 0, Math.PI * 2);
    this.ctx.fill();

    // 2. Breakthrough Shockwave Event
    if (this.portalState === 'breakthrough') {
      const progress = Math.min(1.0, this.breakthroughTime / 0.8);
      const shockR = irisR + (progress * 120);

      this.ctx.beginPath();
      this.ctx.arc(0, 0, shockR, 0, Math.PI * 2);
      this.ctx.strokeStyle = `rgba(255, 255, 255, ${1 - progress})`;
      this.ctx.lineWidth = 6 * (1 - progress);
      this.ctx.shadowColor = '#00f0ff';
      this.ctx.shadowBlur = 25;
      this.ctx.stroke();

      // Radiant light rays
      for (let i = 0; i < 16; i++) {
        const rayAngle = (i * Math.PI) / 8 + (this.breakthroughTime * 2);
        this.ctx.beginPath();
        this.ctx.moveTo(Math.cos(rayAngle) * irisR * 0.5, Math.sin(rayAngle) * irisR * 0.5);
        this.ctx.lineTo(Math.cos(rayAngle) * shockR * 1.3, Math.sin(rayAngle) * shockR * 1.3);
        this.ctx.strokeStyle = `rgba(0, 240, 255, ${(1 - progress) * 0.6})`;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
      }
    }

    // 3. Sustained Active Stellar Conduit Vortex Particles
    if (this.portalState === 'sustained' || this.portalState === 'buildup') {
      this.portalParticles.forEach(p => {
        const px = Math.cos(p.angle) * p.dist;
        const py = Math.sin(p.angle) * p.dist;

        this.ctx.fillStyle = p.color;
        this.ctx.globalAlpha = p.alpha;
        this.ctx.shadowColor = p.color;
        this.ctx.shadowBlur = 6;

        this.ctx.beginPath();
        this.ctx.arc(px, py, p.size, 0, Math.PI * 2);
        this.ctx.fill();
      });
      this.ctx.globalAlpha = 1.0;
      this.ctx.shadowBlur = 0;

      // Rotating Conduit Iris Blades
      const blades = 8;
      const bladeRot = performance.now() * 0.0012;
      this.ctx.save();
      this.ctx.rotate(bladeRot);
      for (let i = 0; i < blades; i++) {
        const bAngle = (i * Math.PI * 2) / blades;
        this.ctx.beginPath();
        this.ctx.arc(Math.cos(bAngle) * irisR * 0.6, Math.sin(bAngle) * irisR * 0.6, irisR * 0.45, 0, Math.PI);
        this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();
      }
      this.ctx.restore();
    }

    // Iris Collar Rim
    this.ctx.beginPath();
    this.ctx.arc(0, 0, irisR, 0, Math.PI * 2);
    this.ctx.strokeStyle = this.portalState === 'sustained' ? '#00f0ff' : 'rgba(0, 240, 255, 0.6)';
    this.ctx.lineWidth = this.portalState === 'sustained' ? 3 : 1.5;
    if (this.portalState === 'sustained') {
      this.ctx.shadowColor = '#00f0ff';
      this.ctx.shadowBlur = 15;
    }
    this.ctx.stroke();

    // Center Core Symbol / Status
    this.ctx.font = '9px "Orbitron", sans-serif';
    this.ctx.fillStyle = this.portalState === 'sustained' ? '#00f0ff' : 'rgba(0, 240, 255, 0.7)';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(this.portalState === 'sustained' ? 'CONDUIT ACTIVE' : (this.portalState === 'buildup' ? 'WARP CONVERGING' : 'GATEWAY CORE'), 0, 3);

    this.ctx.restore();
  }

  renderOuterLimb() {
    this.ctx.save();
    const r = this.radius;

    // Outer Bezel Ring
    this.ctx.beginPath();
    this.ctx.arc(0, 0, r, 0, Math.PI * 2);
    this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
    this.ctx.lineWidth = 2.0;
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.arc(0, 0, r * 0.94, 0, Math.PI * 2);
    this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
    this.ctx.lineWidth = 1.0;
    this.ctx.stroke();

    // Degree Ticks & Graduations (0° to 360°)
    for (let deg = 0; deg < 360; deg += 5) {
      const rad = (deg * Math.PI) / 180;
      const isMajor = deg % 30 === 0;
      const isTen = deg % 10 === 0;
      const len = isMajor ? 10 : (isTen ? 6 : 3);

      const r1 = r;
      const r2 = r - len;

      this.ctx.beginPath();
      this.ctx.moveTo(Math.cos(rad) * r1, Math.sin(rad) * r1);
      this.ctx.lineTo(Math.cos(rad) * r2, Math.sin(rad) * r2);
      this.ctx.strokeStyle = isMajor ? 'rgba(0, 240, 255, 0.85)' : 'rgba(0, 240, 255, 0.35)';
      this.ctx.lineWidth = isMajor ? 1.4 : 0.8;
      this.ctx.stroke();

      if (isMajor) {
        const textR = Math.max(10, r - 16);
        this.ctx.font = '8px "JetBrains Mono", monospace';
        this.ctx.fillStyle = 'rgba(0, 240, 255, 0.75)';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`${deg}°`, Math.cos(rad) * textR, Math.sin(rad) * textR);
      }
    }

    this.ctx.restore();
  }
}

window.DigitalAstrolabe = DigitalAstrolabe;
