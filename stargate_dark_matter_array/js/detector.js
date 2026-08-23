/**
 * BOREAS-IX PMT Sensor Ring & Aperture Canvas Renderer
 * Digital, glowing, schematic particle physics instrument display.
 */

class DetectorRenderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    
    this.width = 640;
    this.height = 640;
    this.centerX = 320;
    this.centerY = 320;
    this.radius = 260;

    this.activeApertureState = 'STANDBY'; // 'STANDBY', 'PENDING', 'BUILDUP', 'BREAKTHROUGH', 'ACTIVE'
    this.stageProgress = 0; // 0 to 1

    // Particles for sustained aperture vortex
    this.particles = [];
    this.numParticles = 240;
    this.initParticles();

    // Pulse trace data for oscilloscope
    this.tracePoints = [];
    this.traceActive = false;
    this.traceType = 'IDLE'; // 'IDLE', 'NR_CANDIDATE', 'ER_BACKGROUND', 'MUON_SPIKE'

    // Interactive channel hovering
    this.hoveredChannelIndex = -1;
    this.selectedChannelIndex = -1;
    this.animFrameId = null;

    if (this.canvas) {
      this.resize();
      this.bindEvents();
      this.startLoop();
    }
  }

  initParticles() {
    this.particles = [];
    for (let i = 0; i < this.numParticles; i++) {
      this.particles.push({
        angle: Math.random() * Math.PI * 2,
        distance: 20 + Math.random() * 220,
        speed: 0.02 + Math.random() * 0.04,
        size: 1 + Math.random() * 2.5,
        alpha: 0.2 + Math.random() * 0.8,
        colorType: Math.random() < 0.7 ? 'core' : 'accent',
        zOffset: Math.random() * 100
      });
    }
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width || 640;
    this.height = rect.height || 640;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.centerX = this.width / 2;
    this.centerY = this.height / 2;
    this.radius = Math.min(this.width, this.height) * 0.42;
  }

  bindEvents() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.x;
      const y = e.clientY - rect.y;
      this.handlePointerMove(x, y);
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.hoveredChannelIndex = -1;
    });

    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.x;
      const y = e.clientY - rect.y;
      this.handlePointerClick(x, y);
    });
  }

  handlePointerMove(x, y) {
    const dx = x - this.centerX;
    const dy = y - this.centerY;
    const dist = Math.hypot(dx, dy);

    // Check if within PMT ring band (radius - 35 to radius + 35)
    if (dist >= this.radius - 40 && dist <= this.radius + 40) {
      let angle = Math.atan2(dy, dx);
      if (angle < 0) angle += Math.PI * 2;
      
      const channels = window.dmDiscrimination ? window.dmDiscrimination.channels : [];
      const segAngle = (Math.PI * 2) / channels.length;
      const index = Math.floor((angle + segAngle / 2) % (Math.PI * 2) / segAngle);
      this.hoveredChannelIndex = index;
    } else {
      this.hoveredChannelIndex = -1;
    }
  }

  handlePointerClick(x, y) {
    if (this.hoveredChannelIndex >= 0 && window.dmApp) {
      const channels = window.dmDiscrimination.channels;
      if (channels[this.hoveredChannelIndex]) {
        window.dmApp.onChannelClicked(channels[this.hoveredChannelIndex].id);
      }
    }
  }

  setApertureState(state, progress = 0) {
    this.activeApertureState = state;
    this.stageProgress = progress;
  }

  triggerTrace(type = 'NR_CANDIDATE') {
    this.traceType = type;
    this.traceActive = true;
    this.tracePoints = [];
    
    // Generate S1 (prompt) + S2 (drift) pulse waveform points
    for (let i = 0; i < 100; i++) {
      let val = (Math.random() - 0.5) * 4; // baseline noise
      
      // S1 prompt peak around i = 18-24
      if (i >= 18 && i <= 24) {
        const s1Amp = type === 'ER_BACKGROUND' ? 25 : 45;
        val += Math.sin((i - 18) / 6 * Math.PI) * s1Amp;
      }
      
      // S2 ionization peak around i = 55-75
      if (i >= 55 && i <= 75) {
        const s2Amp = type === 'ER_BACKGROUND' ? 95 : 65;
        val += Math.sin((i - 55) / 20 * Math.PI) * s2Amp;
      }

      // Muon veto coincidence spike
      if (type === 'MUON_SPIKE' && i >= 35 && i <= 45) {
        val -= Math.sin((i - 35) / 10 * Math.PI) * 80;
      }

      this.tracePoints.push(val);
    }
  }

  startLoop() {
    let lastTime = performance.now();

    const loop = (now) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      this.render(now, dt);
      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  render(now, dt) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    const time = now * 0.001;

    // 1. Draw Target Chamber Grids & Boundary
    this.drawChamberGeometry(ctx, time);

    // 2. Draw Central TPC Visual (Oscilloscope or Dark Matter Vortex)
    if (this.activeApertureState === 'STANDBY' || this.activeApertureState === 'PENDING') {
      this.drawOscilloscope(ctx, time);
    } else if (this.activeApertureState === 'BUILDUP') {
      this.drawBuildupAperture(ctx, time);
    } else if (this.activeApertureState === 'BREAKTHROUGH') {
      this.drawBreakthroughAperture(ctx, time);
    } else if (this.activeApertureState === 'ACTIVE') {
      this.drawSustainedVortex(ctx, time, dt);
    }

    // 3. Draw PMT Sensor Array Ring (10 Channels)
    this.drawPmtRing(ctx, time);

    // 4. Draw Schematic Overlays (High-voltage drift lines & crosshairs)
    this.drawSchematicOverlays(ctx, time);
  }

  drawChamberGeometry(ctx, time) {
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    // Outer water Cherenkov shield circle
    ctx.beginPath();
    ctx.arc(0, 0, this.radius + 38, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 6]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Cryostat vacuum vessel outer perimeter
    ctx.beginPath();
    ctx.arc(0, 0, this.radius + 20, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.25)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner PTFE reflector wall (active liquid xenon boundary)
    ctx.beginPath();
    ctx.arc(0, 0, this.radius - 50, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Cathode drift field grid wires (horizontal subtle lines)
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.lineWidth = 1;
    const gridSpacing = 24;
    for (let y = -(this.radius - 55); y <= this.radius - 55; y += gridSpacing) {
      const halfWidth = Math.sqrt(Math.max(0, Math.pow(this.radius - 55, 2) - y * y));
      ctx.beginPath();
      ctx.moveTo(-halfWidth, y);
      ctx.lineTo(halfWidth, y);
      ctx.stroke();
    }

    ctx.restore();
  }

  drawOscilloscope(ctx, time) {
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    const oscRadius = this.radius - 65;

    // Reticle crosshair
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-oscRadius * 0.8, 0);
    ctx.lineTo(oscRadius * 0.8, 0);
    ctx.moveTo(0, -oscRadius * 0.8);
    ctx.lineTo(0, oscRadius * 0.8);
    ctx.stroke();

    // Concentric range rings
    [0.3, 0.6, 0.9].forEach(f => {
      ctx.beginPath();
      ctx.arc(0, 0, oscRadius * f, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.12)';
      ctx.stroke();
    });

    // Draw Live S1/S2 Waveform Trace
    ctx.beginPath();
    const traceW = oscRadius * 1.5;
    const startX = -traceW / 2;
    const pointsCount = 100;

    for (let i = 0; i < pointsCount; i++) {
      const x = startX + (i / (pointsCount - 1)) * traceW;
      let y = 0;

      if (this.traceActive && this.tracePoints.length === pointsCount) {
        y = -this.tracePoints[i] * 0.8;
      } else {
        // Ambient baseline noise
        y = Math.sin(i * 0.4 + time * 6) * 2.5 + (Math.sin(i * 1.2 - time * 8) * 1.5);
      }

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    // Glowing trace stroke
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.traceType === 'ER_BACKGROUND' ? '#ef4444' : '#38bdf8';
    ctx.strokeStyle = this.traceType === 'ER_BACKGROUND' ? '#f87171' : '#38bdf8';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // S1 & S2 Annotation labels on trace
    ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillText('S1: PROMPT SCINTILLATION [178nm]', -oscRadius * 0.6, -oscRadius * 0.45);
    ctx.fillText('S2: IONIZATION DRIFT CHARGE', oscRadius * 0.05, -oscRadius * 0.55);

    ctx.restore();
  }

  drawBuildupAperture(ctx, time) {
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    const progress = Math.min(1, this.stageProgress);
    const glowRadius = (this.radius - 50) * (0.3 + progress * 0.65);

    // Expanding Cherenkov blue/violet ionization radial gradient
    const grad = ctx.createRadialGradient(0, 0, 5, 0, 0, glowRadius);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    grad.addColorStop(0.2, 'rgba(168, 85, 247, 0.85)');
    grad.addColorStop(0.6, 'rgba(56, 189, 248, 0.5)');
    grad.addColorStop(1, 'rgba(15, 23, 42, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    // Spooling accelerator rings
    const ringCount = 5;
    for (let r = 0; r < ringCount; r++) {
      const ringR = 30 + r * 28 * (1 + progress * 0.4);
      const rot = time * (3 + r * 2) * (r % 2 === 0 ? 1 : -1);
      ctx.save();
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.arc(0, 0, ringR, 0, Math.PI * 1.5);
      ctx.strokeStyle = `rgba(192, 132, 252, ${0.4 + progress * 0.5})`;
      ctx.lineWidth = 2 + progress * 2;
      ctx.setLineDash([8 + r * 4, 12]);
      ctx.stroke();
      ctx.restore();
    }

    // High-energy ionization convergence tendrils
    const tendrilCount = 8;
    for (let t = 0; t < tendrilCount; t++) {
      const a = (t / tendrilCount) * Math.PI * 2 + time * 2;
      const startDist = glowRadius * 0.9;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * startDist, Math.sin(a) * startDist);
      ctx.quadraticCurveTo(
        Math.cos(a + 0.5) * (startDist * 0.5),
        Math.sin(a + 0.5) * (startDist * 0.5),
        0, 0
      );
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.restore();
  }

  drawBreakthroughAperture(ctx, time) {
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    // Shockwave pulse
    const maxR = this.radius + 30;
    const waveR = maxR * Math.min(1, this.stageProgress * 1.8);

    // Center flash
    const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, maxR);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(236, 72, 153, 0.9)');
    grad.addColorStop(0.7, 'rgba(56, 189, 248, 0.75)');
    grad.addColorStop(1, 'rgba(15, 23, 42, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, maxR, 0, Math.PI * 2);
    ctx.fill();

    // Shockwave boundary ring
    ctx.beginPath();
    ctx.arc(0, 0, waveR, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 25;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Relativistic dark matter burst rays
    const rays = 16;
    for (let i = 0; i < rays; i++) {
      const a = (i / rays) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * maxR * 1.1, Math.sin(a) * maxR * 1.1);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    ctx.restore();
  }

  drawSustainedVortex(ctx, time, dt) {
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    const vortexR = this.radius - 50;

    // Central core dark matter singularity vortex
    const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, vortexR);
    coreGrad.addColorStop(0, 'rgba(10, 14, 27, 0.95)');
    coreGrad.addColorStop(0.3, 'rgba(88, 28, 135, 0.6)');
    coreGrad.addColorStop(0.7, 'rgba(14, 165, 233, 0.35)');
    coreGrad.addColorStop(1, 'rgba(15, 23, 42, 0.1)');

    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, 0, vortexR, 0, Math.PI * 2);
    ctx.fill();

    // Swirling dark matter halo particles
    this.particles.forEach(p => {
      p.angle += p.speed * (1 + (vortexR - p.distance) / 100);
      p.distance -= 0.35;
      if (p.distance < 12) {
        p.distance = vortexR * 0.95;
        p.angle = Math.random() * Math.PI * 2;
      }

      const x = Math.cos(p.angle) * p.distance;
      const y = Math.sin(p.angle) * p.distance;

      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.colorType === 'core' 
        ? `rgba(56, 189, 248, ${p.alpha})`
        : `rgba(216, 180, 254, ${p.alpha})`;
      ctx.shadowBlur = 6;
      ctx.shadowColor = p.colorType === 'core' ? '#38bdf8' : '#c084fc';
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Outer vortex ionization spiral arms
    const arms = 3;
    for (let a = 0; a < arms; a++) {
      const armOffset = (a / arms) * Math.PI * 2;
      ctx.beginPath();
      for (let r = 15; r < vortexR; r += 5) {
        const theta = armOffset + (r * 0.04) - time * 3.5;
        const x = Math.cos(theta) * r;
        const y = Math.sin(theta) * r;
        if (r === 15) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.55)';
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#c084fc';
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // 7 Coordinate lock nodes orbiting with locked glyphs
    const lockedSlots = window.dmDiscrimination ? window.dmDiscrimination.lockedSlots : [];
    lockedSlots.forEach((slot, idx) => {
      if (!slot) return;
      const nodeAngle = (idx / 7) * Math.PI * 2 + time * 0.6;
      const nodeDist = vortexR * 0.72;
      const nx = Math.cos(nodeAngle) * nodeDist;
      const ny = Math.sin(nodeAngle) * nodeDist;

      // Glowing coordinate node
      ctx.beginPath();
      ctx.arc(nx, ny, 10, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#38bdf8';
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Coordinate glyph
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(slot.glyph, nx, ny);
    });

    ctx.restore();
  }

  drawPmtRing(ctx, time) {
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    const channels = window.dmDiscrimination ? window.dmDiscrimination.channels : [];
    const lockedSlots = window.dmDiscrimination ? window.dmDiscrimination.lockedSlots : [];
    const segCount = channels.length; // 10
    const segAngle = (Math.PI * 2) / segCount;
    const ringRadius = this.radius;

    channels.forEach((ch, idx) => {
      const midAngle = idx * segAngle;
      const isHovered = this.hoveredChannelIndex === idx;
      
      // Check if this channel is in locked slots
      const isLocked = lockedSlots.some(s => s && s.channel.id === ch.id);

      const px = Math.cos(midAngle) * ringRadius;
      const py = Math.sin(midAngle) * ringRadius;

      // PMT Sensor Housing Arc Segment
      const arcPadding = 0.08;
      const startAngle = midAngle - segAngle / 2 + arcPadding;
      const endAngle = midAngle + segAngle / 2 - arcPadding;

      ctx.beginPath();
      ctx.arc(0, 0, ringRadius, startAngle, endAngle);
      
      if (isLocked) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 14;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 14;
      } else if (isHovered) {
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 12;
        ctx.shadowColor = '#c084fc';
        ctx.shadowBlur = 10;
      } else {
        ctx.strokeStyle = 'rgba(71, 85, 105, 0.4)';
        ctx.lineWidth = 8;
        ctx.shadowBlur = 0;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // PMT Cathode Node Circle
      ctx.beginPath();
      ctx.arc(px, py, isHovered || isLocked ? 14 : 11, 0, Math.PI * 2);
      ctx.fillStyle = isLocked ? '#0284c7' : (isHovered ? '#7e22ce' : '#0f172a');
      ctx.fill();
      ctx.strokeStyle = isLocked ? '#e0f2fe' : (isHovered ? '#f3e8ff' : '#475569');
      ctx.lineWidth = 2;
      ctx.stroke();

      // Channel ID Text on node
      ctx.fillStyle = isLocked || isHovered ? '#ffffff' : '#94a3b8';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ch.id.replace('PMT-', ''), px, py);

      // Channel Label around perimeter
      const labelDist = ringRadius + 22;
      const lx = Math.cos(midAngle) * labelDist;
      const ly = Math.sin(midAngle) * labelDist;
      ctx.fillStyle = isLocked ? '#38bdf8' : (isHovered ? '#c084fc' : 'rgba(148, 163, 184, 0.7)');
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillText(ch.name, lx, ly);

      // Live Count-rate telemetry badge under label
      const rateDist = ringRadius - 24;
      const rx = Math.cos(midAngle) * rateDist;
      const ry = Math.sin(midAngle) * rateDist;
      const liveRate = (ch.baseRate + Math.sin(time * 2 + idx) * 0.6).toFixed(1);
      ctx.fillStyle = 'rgba(148, 163, 184, 0.55)';
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.fillText(`${liveRate} mHz`, rx, ry);
    });

    ctx.restore();
  }

  drawSchematicOverlays(ctx, time) {
    ctx.save();
    ctx.translate(this.centerX, this.centerY);

    // Corner alignment crosshairs
    const corners = [
      { x: -this.width * 0.44, y: -this.height * 0.44 },
      { x: this.width * 0.44, y: -this.height * 0.44 },
      { x: -this.width * 0.44, y: this.height * 0.44 },
      { x: this.width * 0.44, y: this.height * 0.44 }
    ];

    ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
    ctx.lineWidth = 1;
    corners.forEach(c => {
      ctx.beginPath();
      ctx.moveTo(c.x - 8, c.y);
      ctx.lineTo(c.x + 8, c.y);
      ctx.moveTo(c.x, c.y - 8);
      ctx.lineTo(c.x, c.y + 8);
      ctx.stroke();
    });

    ctx.restore();
  }
}

window.DetectorRenderer = DetectorRenderer;
