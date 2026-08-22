/**
 * IPATC APICULTURE TELEMETRY NETWORK — RADIAL ARRAY CANVAS RENDERER
 * Renders the 10-node instrumented circular hive monitoring array,
 * live bio-acoustic waveforms, thermal contour arcs, and the central 3-stage aperture vortex.
 */

class RingArrayCanvasRenderer {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.animationId = null;
    this.time = 0;

    // State bindings
    this.nodeCount = 10;
    this.dialedNodeIndices = []; // array of node indices (0..9) currently locked
    this.currentDialingIndex = null; // node currently acquiring correlation
    this.dialingConfidence = 0; // 0..1
    this.activationState = 'IDLE'; // 'IDLE' | 'PENDING' | 'BUILDUP' | 'BREAKTHROUGH' | 'ACTIVE'
    this.activationProgress = 0; // 0..1 for buildup / breakthrough
    this.particles = [];

    this.initParticles(80);
    this.setupResize();
    this.startLoop();
  }

  setupResize() {
    const resize = () => {
      const rect = this.canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      this.ctx.scale(dpr, dpr);
      this.width = rect.width;
      this.height = rect.height;
    };
    window.addEventListener('resize', resize);
    setTimeout(resize, 50);
  }

  initParticles(count) {
    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        angle: Math.random() * Math.PI * 2,
        radius: 30 + Math.random() * 240,
        speed: 0.005 + Math.random() * 0.015,
        size: 1 + Math.random() * 2,
        color: Math.random() > 0.3 ? '#00f0ff' : '#00ff88',
        alpha: 0.2 + Math.random() * 0.6
      });
    }
  }

  setDialState(dialedIndices, dialingIdx = null, confidence = 0, activation = 'IDLE') {
    this.dialedNodeIndices = [...dialedIndices];
    this.currentDialingIndex = dialingIdx;
    this.dialingConfidence = confidence;
    this.activationState = activation;
  }

  startLoop() {
    const render = () => {
      this.time += 0.018;
      this.draw();
      this.animationId = requestAnimationFrame(render);
    };
    render();
  }

  draw() {
    const ctx = this.ctx;
    const w = this.width || this.canvas.clientWidth || 800;
    const h = this.height || this.canvas.clientHeight || 700;
    ctx.clearRect(0, 0, w, h);

    const cx = w * 0.5;
    const cy = h * 0.5;
    const arrayRadius = Math.min(w, h) * 0.38;
    const centerApertureRadius = Math.min(w, h) * 0.18;

    // 1. Draw Background Concentric Calibration Grid & Compass Reticle
    this.drawBackgroundGrid(cx, cy, arrayRadius);

    // 2. Draw Central Telemetry Aperture (Idle / Pending / Buildup / Breakthrough / Active)
    this.drawCentralAperture(cx, cy, centerApertureRadius);

    // 3. Draw Radial Instrumented Hive Nodes (10 Nodes)
    this.drawRadialNodes(cx, cy, arrayRadius, centerApertureRadius);
  }

  drawBackgroundGrid(cx, cy, radius) {
    const ctx = this.ctx;
    ctx.save();

    // Concentric guideline rings
    [0.35, 0.65, 1.0, 1.15].forEach((scale) => {
      ctx.beginPath();
      ctx.arc(cx, cy, radius * scale, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.stroke();
    });

    // Radial crosshair ticks
    for (let i = 0; i < 36; i++) {
      const angle = (i * Math.PI * 2) / 36;
      const r1 = radius * 1.12;
      const r2 = i % 3 === 0 ? radius * 1.18 : radius * 1.15;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
      ctx.lineTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2);
      ctx.strokeStyle = i % 3 === 0 ? 'rgba(0, 240, 255, 0.35)' : 'rgba(0, 240, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      ctx.stroke();
    }

    ctx.restore();
  }

  drawRadialNodes(cx, cy, arrayRadius, apertureRadius) {
    const ctx = this.ctx;
    const nodeLabels = ['α-01', 'β-02', 'γ-03', 'δ-04', 'ε-05', 'ζ-06', 'η-07', 'θ-08', 'ι-09', 'κ-10'];

    for (let i = 0; i < this.nodeCount; i++) {
      const angle = (i * Math.PI * 2) / this.nodeCount - Math.PI / 2;
      const nx = cx + Math.cos(angle) * arrayRadius;
      const ny = cy + Math.sin(angle) * arrayRadius;

      const isLocked = this.dialedNodeIndices.includes(i);
      const isDialing = this.currentDialingIndex === i;

      // Draw vector link line between node and aperture if locked or dialing
      if (isLocked || isDialing) {
        ctx.save();
        const ax = cx + Math.cos(angle) * apertureRadius;
        const ay = cy + Math.sin(angle) * apertureRadius;
        const grad = ctx.createLinearGradient(nx, ny, ax, ay);
        if (isLocked) {
          grad.addColorStop(0, '#00ff88');
          grad.addColorStop(1, 'rgba(0, 255, 136, 0.1)');
          ctx.strokeStyle = grad;
          ctx.lineWidth = 2;
          ctx.shadowColor = 'rgba(0, 255, 136, 0.6)';
          ctx.shadowBlur = 8;
        } else {
          grad.addColorStop(0, '#ffaa00');
          grad.addColorStop(1, 'rgba(255, 170, 0, 0.05)');
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
        }
        ctx.beginPath();
        ctx.moveTo(nx, ny);
        ctx.lineTo(ax, ay);
        ctx.stroke();
        ctx.restore();
      }

      // Draw Node Outer Ring & Bio-Acoustic Waveform Arc
      this.drawNodeAcousticWave(nx, ny, i, isLocked, isDialing);

      // Node Central Disc
      ctx.save();
      ctx.beginPath();
      ctx.arc(nx, ny, 20, 0, Math.PI * 2);
      ctx.fillStyle = isLocked ? 'rgba(0, 255, 136, 0.2)' : isDialing ? 'rgba(255, 170, 0, 0.2)' : 'rgba(8, 16, 26, 0.9)';
      ctx.fill();
      ctx.strokeStyle = isLocked ? '#00ff88' : isDialing ? '#ffaa00' : 'rgba(0, 240, 255, 0.4)';
      ctx.lineWidth = isLocked ? 2.5 : 1.5;
      if (isLocked) {
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 12;
      }
      ctx.stroke();

      // Node Label
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isLocked ? '#00ff88' : isDialing ? '#ffaa00' : '#d0e4f2';
      ctx.fillText(nodeLabels[i], nx, ny);

      // Status indicator ring below
      if (isDialing) {
        ctx.beginPath();
        ctx.arc(nx, ny, 24, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * this.dialingConfidence);
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  drawNodeAcousticWave(nx, ny, nodeIdx, isLocked, isDialing) {
    const ctx = this.ctx;
    const wave = window.telemetryEngine ? window.telemetryEngine.getNodeWaveform(nodeIdx, isLocked, isDialing) : new Float32Array(64);
    const waveRadius = 32;

    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < wave.length; i++) {
      const angle = (i / wave.length) * Math.PI * 2;
      const r = waveRadius + wave[i] * (isLocked ? 7 : 4);
      const wx = nx + Math.cos(angle) * r;
      const wy = ny + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(wx, wy);
      else ctx.lineTo(wx, wy);
    }
    ctx.closePath();
    ctx.strokeStyle = isLocked ? 'rgba(0, 255, 136, 0.7)' : isDialing ? 'rgba(255, 170, 0, 0.7)' : 'rgba(0, 240, 255, 0.25)';
    ctx.lineWidth = isLocked ? 1.8 : 1;
    ctx.stroke();
    ctx.restore();
  }

  drawCentralAperture(cx, cy, baseRadius) {
    const ctx = this.ctx;
    const state = this.activationState;
    ctx.save();

    // 1. Particle Vortex around center
    this.particles.forEach((p) => {
      p.angle += p.speed * (state === 'ACTIVE' ? 3.5 : state === 'BUILDUP' ? 2.5 : 1);
      const px = cx + Math.cos(p.angle) * p.radius;
      const py = cy + Math.sin(p.angle) * p.radius;
      ctx.beginPath();
      ctx.arc(px, py, p.size * (state === 'ACTIVE' ? 1.5 : 1), 0, Math.PI * 2);
      ctx.fillStyle = state === 'ACTIVE' ? '#00ff88' : p.color;
      ctx.globalAlpha = p.alpha * (state === 'ACTIVE' ? 1 : 0.6);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // 2. State-Specific Central Aperture Core
    if (state === 'IDLE') {
      // Idle rotating iris & faint baseline hum glow
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(4, 9, 16, 0.85)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 8]);
      ctx.stroke();

      // Inner faint reticle
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius * 0.45, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
      ctx.setLineDash([]);
      ctx.stroke();

    } else if (state === 'PENDING') {
      // Pending state: All 7 colonies locked, radiant amber/emerald pre-ionization
      const pulse = 1 + Math.sin(this.time * 6) * 0.05;
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius * pulse, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(cx, cy, 5, cx, cy, baseRadius * pulse);
      grad.addColorStop(0, 'rgba(0, 255, 136, 0.25)');
      grad.addColorStop(0.7, 'rgba(0, 240, 255, 0.15)');
      grad.addColorStop(1, 'rgba(4, 9, 16, 0.9)');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 18;
      ctx.stroke();

    } else if (state === 'BUILDUP') {
      // Stage 1: Buildup — high-speed spinning iris, expanding ionization rings
      const spin = this.time * 8;
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius * (0.8 + this.activationProgress * 0.4), 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius * 1.2);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
      grad.addColorStop(0.4, 'rgba(0, 240, 255, 0.5)');
      grad.addColorStop(1, 'rgba(0, 255, 136, 0.1)');
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 25;
      ctx.stroke();

      // Spinning iris teeth
      for (let i = 0; i < 8; i++) {
        const a = spin + (i * Math.PI * 2) / 8;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * baseRadius * 1.1, cy + Math.sin(a) * baseRadius * 1.1);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

    } else if (state === 'BREAKTHROUGH') {
      // Stage 2: Breakthrough — explosive white-cyan optical flare & shockwave
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius * 1.6, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius * 1.6);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, '#00f0ff');
      grad.addColorStop(0.8, '#00ff88');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fill();

    } else if (state === 'ACTIVE') {
      // Stage 3: Sustained Active — continuous bio-photonic vortex, undulating plasma fluid
      const vortexRot = this.time * 2.5;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(vortexRot);

      // Plasma layers
      for (let i = 4; i >= 1; i--) {
        ctx.beginPath();
        const r = baseRadius * (0.35 + i * 0.2) + Math.sin(this.time * 4 + i) * 8;
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = i % 2 === 0 ? '#00ff88' : '#00f0ff';
        ctx.lineWidth = 3 + i;
        ctx.shadowColor = i % 2 === 0 ? '#00ff88' : '#00f0ff';
        ctx.shadowBlur = 20;
        ctx.stroke();
      }

      // Radiant Core Center
      const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, baseRadius * 0.9);
      coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      coreGrad.addColorStop(0.3, 'rgba(0, 255, 136, 0.6)');
      coreGrad.addColorStop(0.7, 'rgba(0, 240, 255, 0.3)');
      coreGrad.addColorStop(1, 'rgba(4, 9, 16, 0.2)');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(0, 0, baseRadius * 0.9, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    ctx.restore();
  }
}

window.RingArrayCanvasRenderer = RingArrayCanvasRenderer;
