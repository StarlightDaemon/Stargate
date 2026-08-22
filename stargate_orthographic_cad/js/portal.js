/**
 * Stargate Orthographic CAD Terminal - 3-Stage Vector Aperture Engine
 * Bureau: Aethelgard-Voss Structural Telemetrics & CAD Engineering Bureau
 * Spec: AV-CAD-STG-9042-REV-D
 * Renders high-fidelity Canvas-driven vector aperture through three distinct stages:
 * Stage 1: BUILDUP (2.0s duration - wireframe rasterization, ray collimation, rising energy)
 * Stage 2: BREAKTHROUGH INSTANT (Radiant photon shockwave, isobar ripples, aperture breach)
 * Stage 3: SUSTAINED ACTIVE STATE (Energetic plasma vortex, orbiting flux streamlines, stable telemetry)
 */

import { cadAudio } from './audio.js';

export const PORTAL_STATES = {
  IDLE: "IDLE",
  BUILDUP: "BUILDUP",
  BREAKTHROUGH: "BREAKTHROUGH",
  ACTIVE: "ACTIVE",
  DISENGAGING: "DISENGAGING"
};

export class CadPortalEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.state = PORTAL_STATES.IDLE;
    this.startTime = 0;
    this.animFrameId = null;
    this.particles = [];
    this.shockwaves = [];
    this.buildupDuration = 2000; // 2.0 seconds buildup
    this.breakthroughDuration = 600; // 0.6s dramatic breakthrough transition
    this.width = 1100;
    this.height = 1100;

    this.initCanvas();
    this.initParticles();
  }

  initCanvas() {
    if (!this.canvas) return;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  initParticles() {
    this.particles = [];
    for (let i = 0; i < 150; i++) {
      const radius = 30 + Math.random() * 215;
      const angle = Math.random() * Math.PI * 2;
      this.particles.push({
        radius,
        angle,
        speed: 0.015 + (1 - radius / 250) * 0.035,
        radialSpeed: 0.3 + Math.random() * 0.7,
        size: 1 + Math.random() * 2.2,
        alpha: 0.2 + Math.random() * 0.8,
        color: Math.random() > 0.3 ? "#5de6ff" : "#e0f7ff"
      });
    }
  }

  /**
   * Start 3-stage activation sequence
   */
  startActivation(onCompleteStage1, onCompleteStage2, onActiveState) {
    if (this.state !== PORTAL_STATES.IDLE && this.state !== PORTAL_STATES.DISENGAGING) return;

    this.state = PORTAL_STATES.BUILDUP;
    this.startTime = performance.now();
    
    // Web Audio: Buildup sound
    cadAudio.startBuildup(this.buildupDuration / 1000);

    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.loop();

    // Stage 1 -> Stage 2 Callback trigger at 2.0s
    setTimeout(() => {
      if (this.state === PORTAL_STATES.BUILDUP) {
        this.triggerBreakthrough(onCompleteStage2, onActiveState);
        if (onCompleteStage1) onCompleteStage1();
      }
    }, this.buildupDuration);
  }

  triggerBreakthrough(onCompleteStage2, onActiveState) {
    this.state = PORTAL_STATES.BREAKTHROUGH;
    const btStartTime = performance.now();

    // Spawn dramatic shockwaves
    this.shockwaves = [
      { radius: 20, maxRadius: 480, speed: 12, alpha: 1.0, color: "#ffffff", width: 4 },
      { radius: 10, maxRadius: 420, speed: 9, alpha: 0.9, color: "#5de6ff", width: 3 },
      { radius: 5,  maxRadius: 360, speed: 7, alpha: 0.7, color: "#22a6db", width: 2 }
    ];

    // Web Audio: Breakthrough boom & flash
    cadAudio.playBreakthrough();

    // Transition to Stage 3 (Sustained Active) after breakthrough duration
    setTimeout(() => {
      if (this.state === PORTAL_STATES.BREAKTHROUGH) {
        this.state = PORTAL_STATES.ACTIVE;
        cadAudio.startActiveDrone();
        if (onCompleteStage2) onCompleteStage2();
        if (onActiveState) onActiveState();
      }
    }, this.breakthroughDuration);
  }

  disengage() {
    this.state = PORTAL_STATES.DISENGAGING;
    cadAudio.playDisengage();

    const disengageStart = performance.now();
    const duration = 400;

    const fadeStep = () => {
      const elapsed = performance.now() - disengageStart;
      if (elapsed < duration && this.state === PORTAL_STATES.DISENGAGING) {
        // Let loop render collapsing aperture
        requestAnimationFrame(fadeStep);
      } else {
        this.state = PORTAL_STATES.IDLE;
        if (this.ctx) {
          this.ctx.clearRect(0, 0, this.width, this.height);
        }
      }
    };
    fadeStep();
  }

  loop() {
    if (this.state === PORTAL_STATES.IDLE) {
      if (this.ctx) this.ctx.clearRect(0, 0, this.width, this.height);
      return;
    }

    this.render();
    this.animFrameId = requestAnimationFrame(() => this.loop());
  }

  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const now = performance.now();
    const cx = this.width / 2;
    const cy = this.height / 2;

    ctx.clearRect(0, 0, this.width, this.height);
    ctx.save();
    ctx.translate(cx, cy);

    if (this.state === PORTAL_STATES.BUILDUP) {
      this.renderBuildup(ctx, now);
    } else if (this.state === PORTAL_STATES.BREAKTHROUGH) {
      this.renderBreakthrough(ctx, now);
    } else if (this.state === PORTAL_STATES.ACTIVE) {
      this.renderActive(ctx, now);
    } else if (this.state === PORTAL_STATES.DISENGAGING) {
      this.renderDisengage(ctx, now);
    }

    ctx.restore();
  }

  /**
   * Stage 1: Buildup Rendering (Draft wireframe, collimating beams, rising oscillation)
   */
  renderBuildup(ctx, now) {
    const elapsed = now - this.startTime;
    const progress = Math.min(elapsed / this.buildupDuration, 1.0);

    // 1. Oscillating CAD Coordinate Grid in Aperture
    const gridSpacing = 24 - progress * 8;
    ctx.strokeStyle = `rgba(93, 230, 255, ${0.1 + progress * 0.35})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    for (let x = -240; x <= 240; x += gridSpacing) {
      ctx.moveTo(x, -240);
      ctx.lineTo(x, 240);
    }
    for (let y = -240; y <= 240; y += gridSpacing) {
      ctx.moveTo(-240, y);
      ctx.lineTo(240, y);
    }
    ctx.stroke();

    // 2. Collimating Vector Beams from 8 Caliper directions to center
    const beamCount = 8;
    for (let i = 0; i < beamCount; i++) {
      const angle = (i * Math.PI * 2) / beamCount;
      const rOuter = 380;
      const rInner = 240 * (1 - progress * 0.9);
      
      const x1 = Math.cos(angle) * rOuter;
      const y1 = Math.sin(angle) * rOuter;
      const x2 = Math.cos(angle) * rInner;
      const y2 = Math.sin(angle) * rInner;

      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      grad.addColorStop(0, "rgba(93, 230, 255, 0.8)");
      grad.addColorStop(1, "rgba(255, 255, 255, 0.9)");

      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5 + progress * 2.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Laser focus point
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(x2, y2, 2 + progress * 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Rotating Wireframe Polygonal Contour Rings
    const ringCount = 5;
    for (let r = 1; r <= ringCount; r++) {
      const radius = (r / ringCount) * 230 * progress;
      const rotAngle = (now * 0.002 * (r % 2 === 0 ? 1 : -1)) + r;
      
      ctx.save();
      ctx.rotate(rotAngle);
      ctx.strokeStyle = `rgba(93, 230, 255, ${0.3 + progress * 0.5})`;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([8, 4, 2, 4]);
      
      ctx.beginPath();
      const sides = 6 + r * 2;
      for (let s = 0; s < sides; s++) {
        const theta = (s * Math.PI * 2) / sides;
        const px = Math.cos(theta) * radius;
        const py = Math.sin(theta) * radius;
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }

    // 4. Central Singularity Core Ignition Dot
    const coreRadius = 4 + progress * 28;
    const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, coreRadius);
    coreGrad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
    coreGrad.addColorStop(0.5, "rgba(93, 230, 255, 0.8)");
    coreGrad.addColorStop(1, "rgba(7, 20, 38, 0)");
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, 0, coreRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Stage 2: Breakthrough Instant Rendering (Radiant photon flash, expanding shockwave isobars)
   */
  renderBreakthrough(ctx, now) {
    // 1. Radiant Background Flare
    const flareGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 360);
    flareGrad.addColorStop(0, "rgba(255, 255, 255, 0.98)");
    flareGrad.addColorStop(0.2, "rgba(224, 247, 255, 0.92)");
    flareGrad.addColorStop(0.5, "rgba(93, 230, 255, 0.65)");
    flareGrad.addColorStop(0.8, "rgba(34, 166, 219, 0.35)");
    flareGrad.addColorStop(1, "rgba(7, 20, 38, 0)");
    ctx.fillStyle = flareGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 360, 0, Math.PI * 2);
    ctx.fill();

    // 2. Expanding Shockwave Isobar Ripples
    for (let sw of this.shockwaves) {
      sw.radius += sw.speed;
      sw.alpha *= 0.96;

      if (sw.alpha > 0.02) {
        ctx.strokeStyle = sw.color;
        ctx.globalAlpha = sw.alpha;
        ctx.lineWidth = sw.width;
        ctx.beginPath();
        ctx.arc(0, 0, sw.radius, 0, Math.PI * 2);
        ctx.stroke();

        // Cross-hair tick marks on isobar wave
        for (let a = 0; a < 8; a++) {
          const ang = (a * Math.PI * 2) / 8;
          const tx1 = Math.cos(ang) * (sw.radius - 8);
          const ty1 = Math.sin(ang) * (sw.radius - 8);
          const tx2 = Math.cos(ang) * (sw.radius + 8);
          const ty2 = Math.sin(ang) * (sw.radius + 8);
          ctx.beginPath();
          ctx.moveTo(tx1, ty1);
          ctx.lineTo(tx2, ty2);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1.0;

    // 3. Dense Incandescent Plasma Core
    const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 240);
    coreGrad.addColorStop(0, "#ffffff");
    coreGrad.addColorStop(0.3, "#e0f7ff");
    coreGrad.addColorStop(0.7, "#5de6ff");
    coreGrad.addColorStop(1, "rgba(7, 20, 38, 0.9)");
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 240, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Stage 3: Sustained Active State Rendering (Vibrant plasma vortex, particle streamlines, orbiting vectors)
   */
  renderActive(ctx, now) {
    const t = now * 0.001;

    // 1. Deep Radiant Manifold Disk with Concentric Shimmer
    const diskGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 250);
    diskGrad.addColorStop(0, "#040b14");
    diskGrad.addColorStop(0.2, "#08213f");
    diskGrad.addColorStop(0.6, "#0f4270");
    diskGrad.addColorStop(0.85, "#1aa5d8");
    diskGrad.addColorStop(0.98, "#75ebff");
    diskGrad.addColorStop(1, "rgba(93, 230, 255, 0.2)");
    ctx.fillStyle = diskGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 250, 0, Math.PI * 2);
    ctx.fill();

    // 2. Multi-Arm Logarithmic Vector Spiral
    const arms = 6;
    for (let i = 0; i < arms; i++) {
      const baseAngle = (i * Math.PI * 2) / arms + t * 0.8;
      ctx.strokeStyle = i % 2 === 0 ? "rgba(93, 230, 255, 0.45)" : "rgba(224, 247, 255, 0.35)";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      
      for (let r = 240; r >= 15; r -= 4) {
        const theta = baseAngle + Math.log(r / 240 + 0.1) * 3.2;
        const x = Math.cos(theta) * r;
        const y = Math.sin(theta) * r;
        if (r === 240) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // 3. Orbiting Streamline Particles spiraling into center
    for (let p of this.particles) {
      p.angle += p.speed;
      p.radius -= p.radialSpeed;
      if (p.radius <= 12) {
        p.radius = 245;
        p.angle = Math.random() * Math.PI * 2;
      }

      const px = Math.cos(p.angle) * p.radius;
      const py = Math.sin(p.angle) * p.radius;

      // Particle Trail
      const tailX = Math.cos(p.angle - p.speed * 2) * (p.radius + 2);
      const tailY = Math.sin(p.angle - p.speed * 2) * (p.radius + 2);

      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.size;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(px, py);
      ctx.stroke();

      // Particle Head
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(px, py, p.size * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // 4. Orbiting Isometric Magnetic Field Lines
    const rings = 4;
    for (let r = 0; r < rings; r++) {
      const radius = 60 + r * 50;
      const rot = t * (0.3 + r * 0.15) * (r % 2 === 0 ? 1 : -1);
      ctx.save();
      ctx.rotate(rot);
      ctx.strokeStyle = "rgba(93, 230, 255, 0.4)";
      ctx.lineWidth = 1.0;
      ctx.setLineDash([12, 6, 3, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 5. Central Singularity Eye (Infinite Depth Core)
    const eyeGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 32);
    eyeGrad.addColorStop(0, "#ffffff");
    eyeGrad.addColorStop(0.3, "#5de6ff");
    eyeGrad.addColorStop(0.7, "#040e1b");
    eyeGrad.addColorStop(1, "rgba(4, 14, 27, 0)");
    ctx.fillStyle = eyeGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 32, 0, Math.PI * 2);
    ctx.fill();

    // 6. Radiant Aperture Rim Glow Ring
    ctx.strokeStyle = "#e0f7ff";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 250, 0, Math.PI * 2);
    ctx.stroke();
  }

  /**
   * Disengage Rendering (Collapsing Singularity)
   */
  renderDisengage(ctx, now) {
    const collapseGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 180);
    collapseGrad.addColorStop(0, "#ffffff");
    collapseGrad.addColorStop(0.5, "rgba(93, 230, 255, 0.5)");
    collapseGrad.addColorStop(1, "rgba(7, 20, 38, 0)");
    ctx.fillStyle = collapseGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 140, 0, Math.PI * 2);
    ctx.fill();
  }
}
