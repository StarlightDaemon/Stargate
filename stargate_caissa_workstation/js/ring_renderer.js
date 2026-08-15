/**
 * CAÏSSA NEURAL RECURSION WORKSTATION - SEARCH-TREE RING CANVAS RENDERER
 * Renders the genuine live minimax search-tree instrument and portal aperture.
 */

class CaissaRingRenderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext("2d") : null;
    this.width = 960;
    this.height = 800;
    this.cx = 480;
    this.cy = 400;

    this.plies = 7;
    this.baseRadius = 80;
    this.plyStep = 40; // 80 to 360px
    this.rotation = 0;
    this.pulseTime = 0;

    this.particles = [];
    this.pruneBursts = [];
    this.shockwaves = [];

    this.initParticles();
    this.bindLoop();
  }

  initParticles() {
    this.particles = [];
    for (let i = 0; i < 90; i++) {
      this.particles.push({
        angle: Math.random() * Math.PI * 2,
        dist: 70 + Math.random() * 300,
        speed: 0.003 + Math.random() * 0.008,
        radialSpeed: (Math.random() - 0.5) * 0.4,
        size: 1 + Math.random() * 2.5,
        alpha: 0.2 + Math.random() * 0.6,
        color: Math.random() > 0.3 ? "#00f0ff" : "#00ff88"
      });
    }
  }

  triggerPruneBurst(x, y, label = "α-cut") {
    for (let i = 0; i < 8; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 1.2 + Math.random() * 2.5;
      this.pruneBursts.push({
        x, y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 1.0,
        decay: 0.04 + Math.random() * 0.03,
        label: i === 0 ? label : null,
        color: Math.random() > 0.5 ? "#ff2a55" : "#ffb700"
      });
    }
  }

  triggerBreakthroughShockwave() {
    for (let i = 0; i < 3; i++) {
      this.shockwaves.push({
        radius: 30 + i * 20,
        maxRadius: 520,
        speed: 10 + i * 4,
        alpha: 1.0,
        lineWidth: 6 - i * 1.5,
        color: i === 0 ? "#ffffff" : (i === 1 ? "#00f0ff" : "#00ff88")
      });
    }
  }

  bindLoop() {
    const loop = (timestamp) => {
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  render() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const state = window.CaissaState;
    const history = state ? state.history : [];
    const status = state ? state.status : "IDLE";

    ctx.clearRect(0, 0, this.width, this.height);

    this.pulseTime += 0.025;
    const spinMult = status === "STAGE_BUILDUP" ? 4.5 : (status === "STAGE_SUSTAINED" ? 2.0 : 0.6);
    this.rotation += 0.005 * spinMult;

    // 1. Draw Concentric Search Depth Ply Rings
    this.drawDepthRings(ctx, history.length, status);

    // 2. Draw Branching Search-Tree (Sprouting & Alpha-Beta Pruning)
    this.drawSearchTreeSpokes(ctx, history, status);

    // 3. Draw Principal Variation Spine (Committed Optimal Path)
    this.drawPrincipalVariationSpine(ctx, history, status);

    // 4. Draw Floating Dynamic Particles & Pruning Bursts
    this.drawParticles(ctx, status);

    // 5. Draw Center Aperture (Event Horizon Vortex)
    this.drawCenterAperture(ctx, status, history.length);

    // 6. Draw Shockwaves
    this.drawShockwaves(ctx);
  }

  drawDepthRings(ctx, currentPly, status) {
    for (let ply = 1; ply <= this.plies; ply++) {
      const r = this.baseRadius + ply * this.plyStep;
      const isReached = ply <= currentPly;
      const isPending = ply === currentPly + 1;

      ctx.beginPath();
      ctx.arc(this.cx, this.cy, r, 0, Math.PI * 2);

      if (status === "STAGE_SUSTAINED") {
        ctx.strokeStyle = `rgba(0, 255, 136, ${0.35 + Math.sin(this.pulseTime + ply) * 0.15})`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([]);
      } else if (isReached) {
        ctx.strokeStyle = "rgba(0, 240, 255, 0.4)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 6]);
      } else if (isPending) {
        ctx.strokeStyle = `rgba(0, 240, 255, ${0.25 + Math.sin(this.pulseTime * 3) * 0.15})`;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([2, 4]);
      } else {
        ctx.strokeStyle = "rgba(0, 240, 255, 0.08)";
        ctx.lineWidth = 1;
        ctx.setLineDash([1, 8]);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Ply Depth Marker Label
      ctx.save();
      ctx.fillStyle = isReached ? "#00ff88" : (isPending ? "#00f0ff" : "rgba(77, 102, 130, 0.6)");
      ctx.font = "9px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`PLY ${ply} [D:${32 + ply * 6}]`, this.cx, this.cy - r - 6);
      ctx.restore();
    }
  }

  drawSearchTreeSpokes(ctx, history, status) {
    const totalCandidateAngles = 12;

    // Draw tree branches radiating from ply to ply
    for (let ply = 0; ply < this.plies; ply++) {
      const rInner = this.baseRadius + ply * this.plyStep;
      const rOuter = this.baseRadius + (ply + 1) * this.plyStep;

      const dialedMove = history[ply];
      const isDialed = Boolean(dialedMove);
      const isCurrentActivePly = ply === history.length;

      // Base branch angle for this ply
      const parentAngle = isDialed ? (this.getMoveAngle(dialedMove.move.id, ply)) : 0;

      for (let branch = 0; branch < totalCandidateAngles; branch++) {
        const branchAngle = (branch / totalCandidateAngles) * Math.PI * 2 + this.rotation * 0.2;
        const isOptimal = isDialed && this.isMatchingBranch(dialedMove.move.id, branch);

        ctx.beginPath();
        const startX = ply === 0 ? this.cx : this.cx + Math.cos(branchAngle) * rInner;
        const startY = ply === 0 ? this.cy : this.cy + Math.sin(branchAngle) * rInner;
        const endX = this.cx + Math.cos(branchAngle) * rOuter;
        const endY = this.cy + Math.sin(branchAngle) * rOuter;

        if (isOptimal) {
          // Locked PV branch
          ctx.strokeStyle = "rgba(0, 255, 136, 0.85)";
          ctx.lineWidth = 2.5;
          ctx.shadowColor = "rgba(0, 255, 136, 0.6)";
          ctx.shadowBlur = 8;
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
          ctx.shadowBlur = 0;
        } else if (isCurrentActivePly) {
          // Sprouting candidate branches at active search ply
          const sproutPulse = (Math.sin(this.pulseTime * 4 + branch) + 1) / 2;
          ctx.strokeStyle = `rgba(0, 240, 255, ${0.15 + sproutPulse * 0.3})`;
          ctx.lineWidth = 1;
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();

          // Mini candidate score annotation on branch end
          if (branch % 3 === 0) {
            ctx.save();
            ctx.font = "8px 'JetBrains Mono', monospace";
            ctx.fillStyle = "rgba(0, 240, 255, 0.6)";
            ctx.fillText(branch % 2 === 0 ? "+0.8" : "α-cut", endX + 4, endY + 2);
            ctx.restore();
          }
        } else if (ply < history.length) {
          // Pruned away branches on past plies (dim ghostly cutoffs)
          ctx.strokeStyle = "rgba(255, 42, 85, 0.08)";
          ctx.lineWidth = 0.8;
          ctx.setLineDash([2, 4]);
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
          ctx.setLineDash([]);
        } else {
          // Unexplored prospective future tree horizon
          ctx.strokeStyle = "rgba(0, 240, 255, 0.04)";
          ctx.lineWidth = 0.5;
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
      }
    }
  }

  getMoveAngle(moveId, plyIndex) {
    const moveIdx = window.CANDIDATE_MOVES ? window.CANDIDATE_MOVES.findIndex(m => m.id === moveId) : 0;
    return (moveIdx / 12) * Math.PI * 2 + (plyIndex * 0.15);
  }

  isMatchingBranch(moveId, branchIndex) {
    const moveIdx = window.CANDIDATE_MOVES ? window.CANDIDATE_MOVES.findIndex(m => m.id === moveId) : -1;
    return moveIdx === branchIndex;
  }

  drawPrincipalVariationSpine(ctx, history, status) {
    if (history.length === 0) return;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(this.cx, this.cy);

    const points = [{ x: this.cx, y: this.cy }];

    history.forEach((entry, idx) => {
      const r = this.baseRadius + (idx + 1) * this.plyStep;
      const angle = this.getMoveAngle(entry.move.id, idx);
      const px = this.cx + Math.cos(angle) * r;
      const py = this.cy + Math.sin(angle) * r;
      points.push({ x: px, y: py, entry });
      ctx.lineTo(px, py);
    });

    // Stroke the main spine
    ctx.strokeStyle = status === "STAGE_SUSTAINED" ? "#00ff88" : "#00f0ff";
    ctx.lineWidth = status === "STAGE_BUILDUP" ? 4.5 : 3;
    ctx.shadowColor = status === "STAGE_SUSTAINED" ? "rgba(0, 255, 136, 0.9)" : "rgba(0, 240, 255, 0.8)";
    ctx.shadowBlur = 15;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw Node Anchors along the spine
    points.forEach((pt, idx) => {
      if (idx === 0) return; // skip center
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#070c14";
      ctx.fill();
      ctx.strokeStyle = "#00ff88";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Node label
      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(pt.entry.move.shortName, pt.x, pt.y - 12);
    });

    ctx.restore();
  }

  drawParticles(ctx, status) {
    ctx.save();
    const speedMultiplier = status === "STAGE_BUILDUP" ? 4 : (status === "STAGE_SUSTAINED" ? 2.5 : 1);

    this.particles.forEach(p => {
      p.angle += p.speed * speedMultiplier;
      p.dist += p.radialSpeed * speedMultiplier;
      if (p.dist < 75) p.dist = 360;
      if (p.dist > 370) p.dist = 80;

      const px = this.cx + Math.cos(p.angle) * p.dist;
      const py = this.cy + Math.sin(p.angle) * p.dist;

      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
    });

    // Prune Particle Bursts
    for (let i = this.pruneBursts.length - 1; i >= 0; i--) {
      const b = this.pruneBursts[i];
      b.x += b.vx;
      b.y += b.vy;
      b.life -= b.decay;

      if (b.life <= 0) {
        this.pruneBursts.splice(i, 1);
        continue;
      }

      ctx.beginPath();
      ctx.arc(b.x, b.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = b.color;
      ctx.globalAlpha = b.life;
      ctx.fill();

      if (b.label) {
        ctx.font = "9px 'JetBrains Mono', monospace";
        ctx.fillStyle = b.color;
        ctx.fillText(b.label, b.x + 4, b.y - 4);
      }
    }

    ctx.restore();
  }

  drawCenterAperture(ctx, status, dialedCount) {
    ctx.save();
    const coreRadius = 70;

    // Outer Iris Ring
    ctx.beginPath();
    ctx.arc(this.cx, this.cy, coreRadius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(6, 11, 20, 0.92)";
    ctx.fill();
    ctx.strokeStyle = status === "STAGE_SUSTAINED" ? "#00ff88" : "#00f0ff";
    ctx.lineWidth = status === "STAGE_BUILDUP" ? 3 : 2;
    ctx.shadowColor = status === "STAGE_SUSTAINED" ? "rgba(0, 255, 136, 0.8)" : "rgba(0, 240, 255, 0.5)";
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Rotating Iris Blades / Minimax Ticks
    const bladeCount = 8;
    for (let i = 0; i < bladeCount; i++) {
      const bAngle = this.rotation * 1.5 + (i / bladeCount) * Math.PI * 2;
      const bInner = 35;
      const bOuter = coreRadius - 4;

      ctx.beginPath();
      ctx.moveTo(this.cx + Math.cos(bAngle) * bInner, this.cy + Math.sin(bAngle) * bInner);
      ctx.lineTo(this.cx + Math.cos(bAngle + 0.3) * bOuter, this.cy + Math.sin(bAngle + 0.3) * bOuter);
      ctx.strokeStyle = "rgba(0, 240, 255, 0.35)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Singularity Core (State-dependent)
    if (status === "STAGE_BREAKTHROUGH") {
      // DRAMATIC BREAKTHROUGH INSTANT: Blinding checkmate singularity & radiant sunburst
      const pulseSize = 65 + Math.sin(this.pulseTime * 20) * 10;
      const grad = ctx.createRadialGradient(this.cx, this.cy, 5, this.cx, this.cy, pulseSize);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.3, "#00ff88");
      grad.addColorStop(0.7, "rgba(0, 240, 255, 0.8)");
      grad.addColorStop(1, "transparent");

      ctx.beginPath();
      ctx.arc(this.cx, this.cy, pulseSize, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Radiant Breakthrough Energy Beams (Sunburst Lattice)
      const rayCount = 16;
      for (let r = 0; r < rayCount; r++) {
        const rayAngle = (r / rayCount) * Math.PI * 2 + this.rotation * 4;
        const rayLen = 220 + Math.sin(this.pulseTime * 15 + r) * 120;
        ctx.beginPath();
        ctx.moveTo(this.cx, this.cy);
        ctx.lineTo(this.cx + Math.cos(rayAngle) * rayLen, this.cy + Math.sin(rayAngle) * rayLen);
        ctx.strokeStyle = r % 2 === 0 ? "rgba(255, 255, 255, 0.75)" : "rgba(0, 255, 136, 0.6)";
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      // Checkmate Crown Hex Lattice
      ctx.save();
      ctx.font = "bold 24px 'JetBrains Mono', monospace";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "#00ff88";
      ctx.shadowBlur = 20;
      ctx.fillText("#M0", this.cx, this.cy);
      ctx.restore();

    } else if (status === "STAGE_BUILDUP") {
      // RAPID BUILDUP: High-speed charging core with electrical arcs
      const pulseSize = 35 + Math.sin(this.pulseTime * 18) * 12;
      const grad = ctx.createRadialGradient(this.cx, this.cy, 2, this.cx, this.cy, pulseSize);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.5, "#00f0ff");
      grad.addColorStop(1, "transparent");

      ctx.beginPath();
      ctx.arc(this.cx, this.cy, pulseSize, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Buildup Lightning Filaments
      for (let arc = 0; arc < 6; arc++) {
        const arcAngle = (arc / 6) * Math.PI * 2 + this.rotation * 6;
        ctx.beginPath();
        ctx.moveTo(this.cx, this.cy);
        const midX = this.cx + Math.cos(arcAngle) * 45 + (Math.random() - 0.5) * 20;
        const midY = this.cy + Math.sin(arcAngle) * 45 + (Math.random() - 0.5) * 20;
        const endX = this.cx + Math.cos(arcAngle) * 90;
        const endY = this.cy + Math.sin(arcAngle) * 90;
        ctx.quadraticCurveTo(midX, midY, endX, endY);
        ctx.strokeStyle = "rgba(0, 240, 255, 0.8)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

    } else if (status === "STAGE_SUSTAINED") {
      // SUSTAINED ACTIVE: Smooth stable wormhole singularity with coordinate vortex
      const grad = ctx.createRadialGradient(this.cx, this.cy, 5, this.cx, this.cy, 48);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(0.35, "#00ff88");
      grad.addColorStop(0.75, "#00f0ff");
      grad.addColorStop(1, "transparent");

      ctx.beginPath();
      ctx.arc(this.cx, this.cy, 48, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Swirling Streamline Rings
      ctx.beginPath();
      ctx.arc(this.cx, this.cy, 56, this.rotation * 2.5, this.rotation * 2.5 + Math.PI * 1.6);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(this.cx, this.cy, 64, -this.rotation * 1.8, -this.rotation * 1.8 + Math.PI * 1.2);
      ctx.strokeStyle = "rgba(0, 255, 136, 0.8)";
      ctx.lineWidth = 2;
      ctx.stroke();

    } else if (status === "LINE_PENDING_COMMIT") {
      // ARMED READY STATE
      const grad = ctx.createRadialGradient(this.cx, this.cy, 5, this.cx, this.cy, 35);
      grad.addColorStop(0, "#00ff88");
      grad.addColorStop(0.8, "rgba(0, 240, 255, 0.4)");
      grad.addColorStop(1, "transparent");

      ctx.beginPath();
      ctx.arc(this.cx, this.cy, 35, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    } else {
      // IDLE AMBIENT CORE
      ctx.beginPath();
      ctx.arc(this.cx, this.cy, 18, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 240, 255, 0.15)";
      ctx.fill();
    }

    ctx.restore();
  }

  drawShockwaves(ctx) {
    if (this.shockwaves.length === 0) return;

    ctx.save();
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += sw.speed;
      sw.alpha -= 0.025;

      if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
        this.shockwaves.splice(i, 1);
        continue;
      }

      ctx.beginPath();
      ctx.arc(this.cx, this.cy, sw.radius, 0, Math.PI * 2);
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = sw.lineWidth;
      ctx.globalAlpha = sw.alpha;
      ctx.shadowColor = sw.color;
      ctx.shadowBlur = 18;
      ctx.stroke();
    }
    ctx.restore();
  }
}

window.CaissaRing = CaissaRingRenderer;
