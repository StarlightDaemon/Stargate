/**
 * AERIS Harmonic Vector Annulus (HVA-900 / The Vector Ring)
 * Literal functioning mechanism: Rotating glyph disc with inertial physics,
 * 7 animated harmonic stator clamps with electric arcs, radial Fourier oscilloscope,
 * and high-fidelity event horizon vortex particle system.
 */

class VectorRingEngine {
  constructor(canvasContainerId) {
    this.container = document.getElementById(canvasContainerId);
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.container.appendChild(this.canvas);

    // State
    this.powerOnline = false;
    this.gateState = 'IDLE'; // 'IDLE', 'ROTATING', 'ALIGNING', 'LOCKED', 'IGNITING', 'ACTIVE', 'DISENGAGING'
    this.ringAngle = 0; // Current rotation in radians
    this.targetRingAngle = 0;
    this.angularVelocity = 0;
    this.isSpinning = false;
    
    // 7 Harmonic Stator Clamps
    // Radial angles (0 is top apex, going clockwise)
    this.clampAngles = [
      0,                       // Apex Stator (Top / 12 o'clock)
      (51.43 * Math.PI) / 180, // Alpha
      (102.86 * Math.PI) / 180,// Beta
      (154.29 * Math.PI) / 180,// Gamma
      (205.71 * Math.PI) / 180,// Delta
      (257.14 * Math.PI) / 180,// Epsilon
      (308.57 * Math.PI) / 180 // Zeta
    ];

    this.clampStates = [
      'IDLE', 'IDLE', 'IDLE', 'IDLE', 'IDLE', 'IDLE', 'IDLE'
    ]; // 'IDLE', 'STROBE', 'ENGAGING', 'LOCKED'

    this.clampGlows = [0, 0, 0, 0, 0, 0, 0]; // 0.0 to 1.0
    this.clampDepths = [0, 0, 0, 0, 0, 0, 0]; // Mechanical clamp slide offset

    // Particles & FX
    this.particles = [];
    this.arcs = [];
    this.shockwave = null;
    this.oscilloscopePhase = 0;
    this.vortexRotation = 0;
    this.vortexPulse = 0;

    // Dimensions
    this.width = 720;
    this.height = 720;
    this.radius = 330;
    this.innerRadius = 210;

    this.initCanvas();
    this.bindEvents();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initCanvas() {
    // clientWidth/Height are layout px, unaffected by the 4K stage scale
    // transform (getBoundingClientRect would return visually-scaled sizes
    // and blow the canvas up out of its container).
    const dpr = (window.devicePixelRatio || 1) * (window.__aerisStageScale || 1);
    const size = Math.min(this.container.clientWidth, this.container.clientHeight) || 720;

    this.width = size;
    this.height = size;
    this.canvas.width = size * dpr;
    this.canvas.height = size * dpr;
    this.canvas.style.width = `${size}px`;
    this.canvas.style.height = `${size}px`;
    this.ctx.scale(dpr, dpr);

    this.radius = size * 0.44;
    this.innerRadius = size * 0.285;
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.initCanvas();
    });
  }

  setPower(online) {
    this.powerOnline = online;
    if (!online) {
      this.disengage();
    }
  }

  // Rotate ring to align a specific glyph ID under the Apex Stator (Angle 0)
  rotateToGlyph(glyphId, onComplete) {
    if (!this.powerOnline) return;
    
    const glyphCount = 20;
    const glyphAngleStep = (2 * Math.PI) / glyphCount;
    // Calculate target angle to place glyph at top (0 radians)
    // Glyph i is at angle: ringAngle + i * step = 0 => ringAngle = -i * step
    let desiredAngle = -(glyphId * glyphAngleStep);

    // Normalize relative to current angle to minimize or force cinematic multi-spin
    // Always do at least one full spin + offset for cinematic mechanical effect
    // (skip the extra spins entirely in Reduced Motion mode)
    const reducedMotion = document.body.classList.contains('reduced-motion');
    const spinCount = reducedMotion ? 0 : 1 + Math.floor(Math.random() * 2);
    const direction = (Math.random() > 0.5 ? 1 : -1);
    
    let delta = desiredAngle - (this.ringAngle % (2 * Math.PI));
    if (direction > 0 && delta <= 0) delta += 2 * Math.PI;
    if (direction < 0 && delta >= 0) delta -= 2 * Math.PI;

    this.targetRingAngle = this.ringAngle + delta + (direction * spinCount * 2 * Math.PI);
    this.isSpinning = true;
    this.gateState = 'ROTATING';

    if (window.aerisAudio) {
      window.aerisAudio.startMotorSound();
    }

    this.onSpinComplete = onComplete;
  }

  // Lock a clamp in sequence
  lockClamp(clampIndex, onDone) {
    if (clampIndex < 0 || clampIndex >= 7) return;

    this.clampStates[clampIndex] = 'STROBE';
    
    // Create pre-lock electric arcs from stator to ring
    for (let i = 0; i < 4; i++) {
      this.createArc(this.clampAngles[clampIndex]);
    }

    setTimeout(() => {
      // A disengage/reset may have cleared this clamp while the lock impulse
      // was still in flight - do not resurrect a stale lock.
      if (this.clampStates[clampIndex] !== 'STROBE') return;
      this.clampStates[clampIndex] = 'LOCKED';
      this.clampGlows[clampIndex] = 1.0;
      this.clampDepths[clampIndex] = 1.0;

      // Burst particles at clamp location
      const angle = this.clampAngles[clampIndex] - Math.PI / 2;
      const cx = this.width / 2 + Math.cos(angle) * (this.radius * 0.96);
      const cy = this.height / 2 + Math.sin(angle) * (this.radius * 0.96);
      this.emitBurst(cx, cy, 25, '#ff4b72');

      if (window.aerisAudio) {
        window.aerisAudio.playClampLock(clampIndex);
      }

      if (onDone) onDone();
    }, 450);
  }

  // Unlock all clamps
  resetClamps() {
    this.clampStates = ['IDLE', 'IDLE', 'IDLE', 'IDLE', 'IDLE', 'IDLE', 'IDLE'];
    this.clampGlows = [0, 0, 0, 0, 0, 0, 0];
    this.clampDepths = [0, 0, 0, 0, 0, 0, 0];
    this.gateState = 'IDLE';
  }

  // Ignite aperture event horizon
  igniteAperture() {
    this.gateState = 'IGNITING';
    if (window.aerisAudio) {
      window.aerisAudio.playVortexIgnition();
    }

    // Trigger explosive shockwave
    this.shockwave = {
      radius: 5,
      maxRadius: this.radius * 1.35,
      alpha: 1.0,
      expansion: 14,
      chromaticOffset: 8
    };

    // Burst massive particle field
    this.emitBurst(this.width / 2, this.height / 2, 90, '#00f0ff');
    this.emitBurst(this.width / 2, this.height / 2, 45, '#a855f7');

    setTimeout(() => {
      this.gateState = 'ACTIVE';
    }, 1100);
  }

  // Disengage aperture
  disengage() {
    if (this.gateState === 'ACTIVE' || this.gateState === 'IGNITING') {
      if (window.aerisAudio) {
        window.aerisAudio.playDisengage();
      }
      this.gateState = 'DISENGAGING';
      // Inward collapse shockwave
      this.shockwave = {
        radius: this.innerRadius,
        maxRadius: 0,
        alpha: 1.0,
        expansion: -10,
        chromaticOffset: 4
      };
      setTimeout(() => {
        // Only settle to IDLE if nothing new (e.g. a fast-dial redial)
        // has taken over the gate in the meantime.
        if (this.gateState !== 'DISENGAGING') return;
        this.resetClamps();
        this.gateState = 'IDLE';
      }, 700);
    } else {
      this.resetClamps();
      this.gateState = 'IDLE';
    }
  }

  createArc(targetAngle) {
    const angle = targetAngle - Math.PI / 2;
    const r1 = this.radius * 0.7;
    const r2 = this.radius * 0.98;
    this.arcs.push({
      startAngle: angle + (Math.random() - 0.5) * 0.15,
      endAngle: angle,
      r1,
      r2,
      life: 1.0,
      color: Math.random() > 0.4 ? '#00f0ff' : '#a855f7'
    });
  }

  emitBurst(x, y, count = 20, color = '#00f0ff') {
    for (let i = 0; i < count; i++) {
      const speed = 1.5 + Math.random() * 5.5;
      const angle = Math.random() * 2 * Math.PI;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1.5 + Math.random() * 3.5,
        alpha: 1.0,
        decay: 0.015 + Math.random() * 0.03,
        color
      });
    }
  }

  // Physics & Animation Loop
  animate(timestamp) {
    this.ctx.clearRect(0, 0, this.width, this.height);

    const cx = this.width / 2;
    const cy = this.height / 2;

    // 1. Update Ring Rotation Physics with inertial deceleration
    if (this.isSpinning) {
      const diff = this.targetRingAngle - this.ringAngle;
      const absDiff = Math.abs(diff);
      // Dynamic acceleration/braking. Snap once the remaining distance is
      // within one step, otherwise a fixed minimum step can orbit the target
      // forever without ever entering a smaller snap window.
      const speed = Math.max(0.015, Math.min(0.085, absDiff * 0.065));

      if (absDiff > speed) {
        this.angularVelocity = Math.sign(diff) * speed;
        this.ringAngle += this.angularVelocity;

        if (window.aerisAudio) {
          window.aerisAudio.updateMotorPitch(Math.min(1.0, absDiff / 3.0));
        }
      } else {
        this.ringAngle = this.targetRingAngle;
        this.isSpinning = false;
        this.angularVelocity = 0;
        if (window.aerisAudio) {
          window.aerisAudio.stopMotorSound();
        }
        if (this.onSpinComplete) {
          const cb = this.onSpinComplete;
          this.onSpinComplete = null;
          cb();
        }
      }
    }

    // 2. Render Layer 1: Event Horizon / Vortex / Singularity
    this.renderEventHorizon(cx, cy, timestamp);

    // 3. Render Layer 2: Radial Oscilloscope Harmonic Waveform
    this.renderRadialOscilloscope(cx, cy, timestamp);

    // 4. Render Layer 3: Mechanical Annular Chassis & Outer Stator Ring
    this.renderChassisRing(cx, cy);

    // 5. Render Layer 4: Rotating Glyph Track
    this.renderGlyphTrack(cx, cy);

    // 6. Render Layer 5: 7 Harmonic Stator Clamps & Vector Nodes
    this.renderStatorClamps(cx, cy, timestamp);

    // 7. Render Layer 6: Dynamic Electric Arcs, Particles & Shockwaves
    this.renderFX(cx, cy);

    requestAnimationFrame(this.animate);
  }

  // Center Event Horizon Vortex Rendering
  renderEventHorizon(cx, cy, timestamp) {
    const ctx = this.ctx;
    const r = this.innerRadius;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r - 2, 0, 2 * Math.PI);
    ctx.clip();

    // Dark quantum vacuum base
    const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    bgGrad.addColorStop(0, '#020409');
    bgGrad.addColorStop(0.7, '#070d1a');
    bgGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

    if (this.gateState === 'ACTIVE' || this.gateState === 'IGNITING') {
      this.vortexRotation += 0.025;
      this.vortexPulse = Math.sin(timestamp * 0.003) * 0.15 + 0.85;

      // Active Superluminal Spatial Vortex
      const activeGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, r);
      activeGrad.addColorStop(0, '#ffffff');
      activeGrad.addColorStop(0.15, '#00f0ff');
      activeGrad.addColorStop(0.45, '#1e40af');
      activeGrad.addColorStop(0.8, '#4c1d95');
      activeGrad.addColorStop(1, '#050811');

      ctx.fillStyle = activeGrad;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

      // Rotating plasma vortex arms (Canvas procedural wave spirals)
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(this.vortexRotation);
      for (let arm = 0; arm < 4; arm++) {
        ctx.rotate((Math.PI * 2) / 4);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        for (let rad = 5; rad < r; rad += 8) {
          const a = (rad / r) * Math.PI * 1.8 + Math.sin(timestamp * 0.004 + rad * 0.05) * 0.2;
          const px = Math.cos(a) * rad;
          const py = Math.sin(a) * rad;
          ctx.lineTo(px, py);
        }
        ctx.strokeStyle = arm % 2 === 0 ? 'rgba(0, 240, 255, 0.45)' : 'rgba(168, 85, 247, 0.4)';
        ctx.lineWidth = 12 * (1 - arm * 0.1);
        ctx.stroke();
      }
      ctx.restore();

      // Fluid caustic ripples
      for (let i = 0; i < 3; i++) {
        const rippleR = ((timestamp * 0.05 + i * (r / 3)) % r);
        const rippleAlpha = (1 - rippleR / r) * 0.6;
        ctx.beginPath();
        ctx.arc(cx, cy, rippleR, 0, 2 * Math.PI);
        ctx.strokeStyle = `rgba(255, 255, 255, ${rippleAlpha})`;
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      // Gravitational Singularity Core
      ctx.beginPath();
      ctx.arc(cx, cy, 22 * this.vortexPulse, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 25;
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      // Idle Quantum Foam & Gravitational Distortion Grid
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.lineWidth = 1;
      const gridCount = 8;
      for (let i = 1; i <= gridCount; i++) {
        const gridR = (r / gridCount) * i;
        ctx.beginPath();
        ctx.arc(cx, cy, gridR, 0, 2 * Math.PI);
        ctx.stroke();
      }
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
        ctx.stroke();
      }

      // Subtle center singularity beacon
      if (this.powerOnline) {
        const beaconPulse = Math.sin(timestamp * 0.002) * 0.3 + 0.7;
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(0, 240, 255, ${beaconPulse * 0.6})`;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    ctx.restore();
  }

  // Radial Fourier Oscilloscope Waveform on inner rim
  renderRadialOscilloscope(cx, cy, timestamp) {
    const ctx = this.ctx;
    const baseR = this.innerRadius + 6;
    const points = 180;
    const isLocked = this.clampStates.some(s => s === 'LOCKED');
    const isActive = this.gateState === 'ACTIVE';

    this.oscilloscopePhase += 0.04;

    ctx.save();
    ctx.beginPath();

    for (let i = 0; i <= points; i++) {
      const theta = (i / points) * Math.PI * 2;
      let amp = 0;

      if (this.powerOnline) {
        // Base carrier wave
        amp += Math.sin(theta * 8 + this.oscilloscopePhase) * 2.5;
        amp += Math.cos(theta * 14 - this.oscilloscopePhase * 1.5) * 1.5;

        // Harmonic spikes at locked clamp angles
        if (isLocked) {
          for (let c = 0; c < 7; c++) {
            if (this.clampStates[c] === 'LOCKED') {
              const diff = Math.abs(theta - this.clampAngles[c]);
              const clampDist = Math.min(diff, Math.PI * 2 - diff);
              if (clampDist < 0.2) {
                amp += Math.cos((clampDist / 0.2) * (Math.PI / 2)) * 9;
              }
            }
          }
        }

        if (isActive) {
          amp += (Math.random() - 0.5) * 4.5;
        }
      }

      const r = baseR + amp;
      const px = cx + Math.cos(theta - Math.PI / 2) * r;
      const py = cy + Math.sin(theta - Math.PI / 2) * r;

      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }

    ctx.closePath();
    ctx.strokeStyle = isActive
      ? 'rgba(0, 240, 255, 0.85)'
      : isLocked
      ? 'rgba(255, 75, 114, 0.75)'
      : this.powerOnline
      ? 'rgba(56, 189, 248, 0.4)'
      : 'rgba(56, 189, 248, 0.15)';
    ctx.lineWidth = 1.8;
    ctx.shadowColor = isActive ? '#00f0ff' : '#ff4b72';
    ctx.shadowBlur = isActive || isLocked ? 8 : 0;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // Mechanical Annular Chassis Ring
  renderChassisRing(cx, cy) {
    const ctx = this.ctx;
    const rOuter = this.radius;
    const rInner = this.innerRadius;

    ctx.save();

    // 1. Heavy dark titanium chassis background
    ctx.beginPath();
    ctx.arc(cx, cy, rOuter, 0, Math.PI * 2);
    ctx.arc(cx, cy, rInner, 0, Math.PI * 2, true);
    
    const chassisGrad = ctx.createRadialGradient(cx, cy, rInner, cx, cy, rOuter);
    chassisGrad.addColorStop(0, '#090e17');
    chassisGrad.addColorStop(0.3, '#131b2e');
    chassisGrad.addColorStop(0.7, '#0b1120');
    chassisGrad.addColorStop(1, '#030712');
    ctx.fillStyle = chassisGrad;
    ctx.fill();

    // 2. Beveled metallic borders with top-left directional light sheen
    ctx.beginPath();
    ctx.arc(cx, cy, rOuter, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, rInner, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 3. Precision degree calibration marks (000° to 350°)
    for (let deg = 0; deg < 360; deg += 5) {
      const rad = (deg * Math.PI) / 180 - Math.PI / 2;
      const isMajor = deg % 30 === 0;
      const isSub = deg % 15 === 0;
      const len = isMajor ? 12 : isSub ? 7 : 4;
      const r1 = rOuter - 8;
      const r2 = r1 - len;

      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(rad) * r1, cy + Math.sin(rad) * r1);
      ctx.lineTo(cx + Math.cos(rad) * r2, cy + Math.sin(rad) * r2);
      ctx.strokeStyle = isMajor
        ? 'rgba(56, 189, 248, 0.7)'
        : 'rgba(56, 189, 248, 0.25)';
      ctx.lineWidth = isMajor ? 1.5 : 1;
      ctx.stroke();

      // Degree numeric labels on major markers
      if (isMajor && this.width >= 500) {
        const textR = r2 - 9;
        const tx = cx + Math.cos(rad) * textR;
        const ty = cy + Math.sin(rad) * textR;
        ctx.font = '8px "JetBrains Mono", monospace';
        ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${deg.toString().padStart(3, '0')}°`, tx, ty);
      }
    }

    // 4. Hex Socket Fasteners around perimeter (authentic hardware detail)
    const boltCount = 28;
    for (let b = 0; b < boltCount; b++) {
      const bAngle = (b / boltCount) * Math.PI * 2;
      const bx = cx + Math.cos(bAngle) * (rOuter - 4);
      const by = cy + Math.sin(bAngle) * (rOuter - 4);

      ctx.beginPath();
      ctx.arc(bx, by, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = '#1e293b';
      ctx.fill();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 0.75;
      ctx.stroke();
    }

    ctx.restore();
  }

  // Rotating Glyph Track with 20 Vector Glyphs
  renderGlyphTrack(cx, cy) {
    const ctx = this.ctx;
    const trackR = (this.radius + this.innerRadius) / 2 + 6;
    const glyphCount = 20;
    const step = (Math.PI * 2) / glyphCount;

    ctx.save();

    // Track groove line
    ctx.beginPath();
    ctx.arc(cx, cy, trackR, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.lineWidth = 26;
    ctx.stroke();

    // Render each glyph around the track at (ringAngle + index * step)
    for (let i = 0; i < glyphCount; i++) {
      const glyph = window.aerisDB ? window.aerisDB.getGlyph(i) : null;
      if (!glyph) continue;

      const angle = this.ringAngle + i * step - Math.PI / 2;
      const gx = cx + Math.cos(angle) * trackR;
      const gy = cy + Math.sin(angle) * trackR;

      // Check if this glyph is currently under the top Apex stator (angle near -Math.PI/2)
      const normAngle = ((this.ringAngle + i * step) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
      const isUnderApex = normAngle < 0.15 || normAngle > (Math.PI * 2 - 0.15);

      ctx.save();
      ctx.translate(gx, gy);
      ctx.rotate(angle + Math.PI / 2); // Orient outward radially

      // Glyph housing badge
      ctx.beginPath();
      ctx.rect(-14, -14, 28, 28);
      ctx.fillStyle = isUnderApex
        ? 'rgba(0, 240, 255, 0.2)'
        : 'rgba(15, 23, 42, 0.6)';
      ctx.fill();
      ctx.strokeStyle = isUnderApex
        ? 'rgba(0, 240, 255, 0.9)'
        : 'rgba(56, 189, 248, 0.3)';
      ctx.lineWidth = isUnderApex ? 1.5 : 1;
      ctx.stroke();

      // Render Glyph Symbol
      this.drawVectorGlyph(ctx, glyph.id, isUnderApex);

      // 3-letter code
      ctx.font = '7px "JetBrains Mono", monospace';
      ctx.fillStyle = isUnderApex ? '#00f0ff' : 'rgba(148, 163, 184, 0.7)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(glyph.code, 0, 15);

      ctx.restore();
    }

    ctx.restore();
  }

  // Draw clean vector glyph path on 2D context
  drawVectorGlyph(ctx, id, isHighlighted) {
    ctx.save();
    ctx.scale(0.24, 0.24); // Scale 100x100 path to ~24x24 box
    ctx.translate(-50, -50);

    ctx.strokeStyle = isHighlighted ? '#ffffff' : '#38bdf8';
    ctx.fillStyle = isHighlighted ? '#00f0ff' : 'rgba(56, 189, 248, 0.6)';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (isHighlighted) {
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 10;
    }

    // Procedural geometric glyph vectors
    switch (id) {
      case 0: // ALPHA
        ctx.beginPath();
        ctx.moveTo(50, 15); ctx.lineTo(85, 80); ctx.lineTo(15, 80); ctx.closePath();
        ctx.stroke();
        ctx.beginPath(); ctx.arc(50, 55, 10, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(50, 15); ctx.lineTo(50, 45); ctx.stroke();
        break;
      case 1: // HELIX
        ctx.beginPath();
        ctx.moveTo(25, 25); ctx.quadraticCurveTo(50, 50, 25, 75);
        ctx.moveTo(75, 25); ctx.quadraticCurveTo(50, 50, 75, 75);
        ctx.moveTo(25, 50); ctx.lineTo(75, 50);
        ctx.stroke();
        break;
      case 2: // PRISM
        ctx.beginPath();
        ctx.moveTo(50, 15); ctx.lineTo(85, 75); ctx.lineTo(15, 75); ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(15, 75); ctx.lineTo(50, 50);
        ctx.moveTo(85, 75); ctx.lineTo(50, 50);
        ctx.moveTo(50, 15); ctx.lineTo(50, 50);
        ctx.stroke();
        break;
      case 3: // NOVA
        ctx.beginPath(); ctx.arc(50, 50, 16, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(50, 12); ctx.lineTo(50, 88);
        ctx.moveTo(12, 50); ctx.lineTo(88, 50);
        ctx.moveTo(23, 23); ctx.lineTo(77, 77);
        ctx.moveTo(77, 23); ctx.lineTo(23, 77);
        ctx.stroke();
        break;
      case 4: // ZENITH
        ctx.beginPath();
        ctx.moveTo(20, 60); ctx.lineTo(50, 20); ctx.lineTo(80, 60);
        ctx.moveTo(50, 20); ctx.lineTo(50, 85);
        ctx.moveTo(25, 85); ctx.lineTo(75, 85);
        ctx.stroke();
        break;
      case 5: // FLUX
        ctx.beginPath();
        ctx.moveTo(15, 50); ctx.quadraticCurveTo(32, 15, 50, 50); ctx.quadraticCurveTo(68, 85, 85, 50);
        ctx.stroke();
        break;
      case 6: // HORIZON
        ctx.beginPath();
        ctx.moveTo(15, 50); ctx.lineTo(85, 50);
        ctx.arc(50, 50, 25, Math.PI, 0);
        ctx.stroke();
        ctx.beginPath(); ctx.arc(50, 32, 6, 0, Math.PI * 2); ctx.fill();
        break;
      case 7: // PULSAR
        ctx.beginPath(); ctx.arc(50, 50, 14, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(50, 50, 30, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(50, 10); ctx.lineTo(50, 20);
        ctx.moveTo(50, 80); ctx.lineTo(50, 90);
        ctx.stroke();
        break;
      case 8: // MERIDIAN
        ctx.beginPath(); ctx.arc(50, 50, 35, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(50, 15); ctx.lineTo(50, 85);
        ctx.moveTo(30, 50); ctx.lineTo(70, 50);
        ctx.stroke();
        break;
      case 9: // VERTEX
        ctx.beginPath();
        ctx.moveTo(50, 15); ctx.lineTo(85, 45); ctx.lineTo(85, 75); ctx.lineTo(50, 90); ctx.lineTo(15, 75); ctx.lineTo(15, 45); ctx.closePath();
        ctx.stroke();
        ctx.beginPath(); ctx.arc(50, 52, 8, 0, Math.PI * 2); ctx.fill();
        break;
      default:
        // Generic high-tech polygon for other IDs
        ctx.beginPath();
        const sides = 3 + (id % 5);
        for (let s = 0; s < sides; s++) {
          const a = (s / sides) * Math.PI * 2 - Math.PI / 2;
          const px = 50 + Math.cos(a) * 32;
          const py = 50 + Math.sin(a) * 32;
          if (s === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath(); ctx.arc(50, 50, 7, 0, Math.PI * 2); ctx.fill();
        break;
    }

    ctx.restore();
  }

  // 7 Harmonic Stator Clamps & Vector Interlocks
  renderStatorClamps(cx, cy, timestamp) {
    const ctx = this.ctx;
    const rOuter = this.radius;

    for (let c = 0; c < 7; c++) {
      const angle = this.clampAngles[c] - Math.PI / 2;
      const state = this.clampStates[c];
      const isLocked = state === 'LOCKED';
      const isStrobe = state === 'STROBE';

      // Clamp mechanical slide inward on lock
      const depth = this.clampDepths[c] * 10;
      const clampR = rOuter + 6 - depth;
      const kx = cx + Math.cos(angle) * clampR;
      const ky = cy + Math.sin(angle) * clampR;

      ctx.save();
      ctx.translate(kx, ky);
      ctx.rotate(angle + Math.PI / 2);

      // Clamp Chevron Housing (Beveled wedge cap)
      ctx.beginPath();
      ctx.moveTo(-18, -12);
      ctx.lineTo(18, -12);
      ctx.lineTo(24, 18);
      ctx.lineTo(0, 28);
      ctx.lineTo(-24, 18);
      ctx.closePath();

      const clampGrad = ctx.createLinearGradient(0, -12, 0, 28);
      clampGrad.addColorStop(0, '#1e293b');
      clampGrad.addColorStop(0.6, '#0f172a');
      clampGrad.addColorStop(1, '#020617');
      ctx.fillStyle = clampGrad;
      ctx.fill();

      ctx.strokeStyle = isLocked
        ? '#ff4b72'
        : isStrobe
        ? '#f59e0b'
        : 'rgba(56, 189, 248, 0.5)';
      ctx.lineWidth = isLocked ? 2.5 : 1.5;
      if (isLocked) {
        ctx.shadowColor = '#ff4b72';
        ctx.shadowBlur = 15;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Illuminated Vector Core Diode
      ctx.beginPath();
      ctx.moveTo(-8, -2);
      ctx.lineTo(8, -2);
      ctx.lineTo(0, 14);
      ctx.closePath();

      let diodeAlpha = 0.4;
      if (isLocked) diodeAlpha = 1.0;
      else if (isStrobe) diodeAlpha = Math.sin(timestamp * 0.02) * 0.5 + 0.5;

      ctx.fillStyle = isLocked
        ? `rgba(255, 75, 114, ${diodeAlpha})`
        : isStrobe
        ? `rgba(245, 158, 11, ${diodeAlpha})`
        : this.powerOnline
        ? 'rgba(0, 240, 255, 0.4)'
        : 'rgba(100, 116, 139, 0.2)';
      if (isLocked || isStrobe) {
        ctx.shadowColor = isLocked ? '#ff4b72' : '#f59e0b';
        ctx.shadowBlur = 12;
      }
      ctx.fill();
      ctx.shadowBlur = 0;

      // Stator node label
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.fillStyle = isLocked ? '#ff4b72' : 'rgba(148, 163, 184, 0.8)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = c === 0 ? 'APEX' : `V-0${c}`;
      ctx.fillText(label, 0, -5);

      ctx.restore();
    }
  }

  // Dynamic Particles, Arcs & Shockwaves
  renderFX(cx, cy) {
    const ctx = this.ctx;

    // 1. Shockwaves
    if (this.shockwave) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, this.shockwave.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0, 240, 255, ${this.shockwave.alpha * 0.8})`;
      ctx.lineWidth = 6;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 20;
      ctx.stroke();

      this.shockwave.radius += this.shockwave.expansion;
      this.shockwave.alpha -= 0.02;
      if (this.shockwave.alpha <= 0 || this.shockwave.radius > this.shockwave.maxRadius) {
        this.shockwave = null;
      }
      ctx.restore();
    }

    // 2. Electric Arcs
    for (let i = this.arcs.length - 1; i >= 0; i--) {
      const arc = this.arcs[i];
      ctx.save();
      ctx.beginPath();
      const p1x = cx + Math.cos(arc.startAngle) * arc.r1;
      const p1y = cy + Math.sin(arc.startAngle) * arc.r1;
      const p2x = cx + Math.cos(arc.endAngle) * arc.r2;
      const p2y = cy + Math.sin(arc.endAngle) * arc.r2;

      ctx.moveTo(p1x, p1y);
      const segments = 4;
      for (let s = 1; s < segments; s++) {
        const t = s / segments;
        const mx = p1x + (p2x - p1x) * t + (Math.random() - 0.5) * 16;
        const my = p1y + (p2y - p1y) * t + (Math.random() - 0.5) * 16;
        ctx.lineTo(mx, my);
      }
      ctx.lineTo(p2x, p2y);

      ctx.strokeStyle = arc.color;
      ctx.lineWidth = 2 * arc.life;
      ctx.shadowColor = arc.color;
      ctx.shadowBlur = 8;
      ctx.stroke();

      arc.life -= 0.12;
      if (arc.life <= 0) {
        this.arcs.splice(i, 1);
      }
      ctx.restore();
    }

    // 3. Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.restore();
    }
  }
}

window.VectorRingEngine = VectorRingEngine;
