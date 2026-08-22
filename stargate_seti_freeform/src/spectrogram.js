// Polar Waterfall Spectrogram Canvas Engine for VDATC

export class PolarWaterfallSpectrogram {
  constructor(canvas, candidateSignals) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.candidates = candidateSignals;

    // Active state tracking
    this.lockedCandidateIds = new Set(); // IDs of locked candidates
    this.systemState = 'IDLE'; // 'IDLE', 'DIALING', 'READY', 'BUILDUP', 'BREAKTHROUGH', 'ACTIVE'
    this.buildupProgress = 0; // 0 to 1 during buildup
    this.activeTime = 0;
    this.flashOpacity = 0;
    this.animFrameId = null;

    // Procedural noise buffer & radial history
    this.numSectors = 10;
    this.radialRings = 48; // Time history steps flowing radially
    this.noiseHistory = []; // [ring][sector] noise intensity values
    this.initNoiseHistory();

    // Visual particles for active aperture
    this.apertureParticles = [];
    this.initApertureParticles();

    // High-DPI Canvas sizing
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Start render loop
    this.render = this.render.bind(this);
    this.animFrameId = requestAnimationFrame(this.render);
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width || 560;
    this.height = rect.height || 560;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.resetTransform?.();
    this.ctx.scale(dpr, dpr);
    this.cx = this.width / 2;
    this.cy = this.height / 2;
    this.outerRadius = Math.min(this.cx, this.cy) - 12;
    this.innerRadius = this.outerRadius * 0.28;
  }

  initNoiseHistory() {
    this.noiseHistory = [];
    for (let r = 0; r < this.radialRings; r++) {
      const ringData = [];
      for (let s = 0; s < 120; s++) { // 120 fine angular bins around circumference
        ringData.push(0.1 + Math.random() * 0.35);
      }
      this.noiseHistory.push(ringData);
    }
  }

  initApertureParticles() {
    this.apertureParticles = [];
    for (let i = 0; i < 70; i++) {
      this.apertureParticles.push({
        angle: Math.random() * Math.PI * 2,
        dist: Math.random() * this.innerRadius,
        speed: 0.02 + Math.random() * 0.04,
        radialSpeed: 0.4 + Math.random() * 0.9,
        size: 1 + Math.random() * 2.5,
        alpha: 0.2 + Math.random() * 0.8,
        color: Math.random() > 0.3 ? '#00f0ff' : '#39ff14'
      });
    }
  }

  setLockedCandidates(ids) {
    this.lockedCandidateIds = new Set(ids);
  }

  setSystemState(state, progress = 0) {
    this.systemState = state;
    this.buildupProgress = progress;
    if (state === 'BREAKTHROUGH') {
      this.flashOpacity = 1.0;
    }
  }

  triggerFlash() {
    this.flashOpacity = 1.0;
  }

  updateNoiseHistory() {
    // Shift radial time history outward (inner = new time, outer = past time)
    const newRing = [];
    const time = this.activeTime;

    for (let s = 0; s < 120; s++) {
      const sectorIndex = Math.floor((s / 120) * this.numSectors);
      const candidate = this.candidates[sectorIndex];
      const isLocked = candidate && this.lockedCandidateIds.has(candidate.id);

      let val;
      if (isLocked) {
        // Coherent Narrowband Signal Arc: Clean, concentrated high intensity with Doppler drift
        const binInSector = (s % (120 / this.numSectors)) / (120 / this.numSectors);
        const centerOffset = Math.abs(binInSector - 0.5);
        if (centerOffset < 0.15) {
          // Sharp coherent peak
          val = 0.92 + Math.sin(time * 6 + s * 0.2) * 0.08;
        } else {
          // Cleared background in locked sector
          val = 0.02 + Math.random() * 0.06;
        }
      } else {
        // Ambiguous Noise: shifting textured noise field + faint random RFI spikes
        const rfiSpike = Math.random() > 0.96 ? 0.45 : 0;
        const noise = 0.12 + Math.random() * 0.28 + Math.sin(time * 1.5 + s * 0.5) * 0.08 + rfiSpike;
        val = Math.min(0.6, noise);
      }
      newRing.push(val);
    }

    this.noiseHistory.unshift(newRing);
    if (this.noiseHistory.length > this.radialRings) {
      this.noiseHistory.pop();
    }
  }

  render() {
    this.activeTime += 0.025;
    this.updateNoiseHistory();

    const ctx = this.ctx;
    const cx = this.cx;
    const cy = this.cy;
    const outerR = this.outerRadius;
    const innerR = this.innerRadius;

    // Clear Canvas
    ctx.clearRect(0, 0, this.width, this.height);

    // Render Deep Cosmic Background Radial Gradient
    const bgGrad = ctx.createRadialGradient(cx, cy, innerR * 0.5, cx, cy, outerR + 10);
    bgGrad.addColorStop(0, 'rgba(4, 10, 18, 0.95)');
    bgGrad.addColorStop(0.6, 'rgba(2, 6, 12, 0.92)');
    bgGrad.addColorStop(1, 'rgba(1, 3, 6, 0.98)');
    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, outerR + 8, 0, Math.PI * 2);
    ctx.fill();

    // 1. Draw Polar Waterfall Spectrogram Cells (Radial Time x Circumferential Frequency)
    const numBins = 120;
    const binAngle = (Math.PI * 2) / numBins;
    const ringStep = (outerR - innerR) / this.radialRings;

    for (let r = 0; r < this.noiseHistory.length; r++) {
      const radius = innerR + r * ringStep;
      const nextRadius = radius + ringStep + 0.5;
      const ringData = this.noiseHistory[r];

      for (let s = 0; s < numBins; s++) {
        const sectorIndex = Math.floor((s / numBins) * this.numSectors);
        const candidate = this.candidates[sectorIndex];
        const isLocked = candidate && this.lockedCandidateIds.has(candidate.id);

        const startAngle = s * binAngle - Math.PI / 2;
        const endAngle = (s + 1) * binAngle - Math.PI / 2;
        const val = ringData[s];

        let fillColor;
        if (isLocked) {
          // Sharp glowing cyan-green coherent arc
          if (val > 0.7) {
            const alpha = Math.min(1.0, val * (1 - r / (this.radialRings * 1.2)));
            fillColor = `rgba(0, 255, 230, ${alpha})`;
          } else {
            fillColor = `rgba(0, 40, 50, ${val * 0.3})`;
          }
        } else {
          // Shifting radio noise field (deep navy to emerald noise texture)
          const alpha = val * 0.55 * (1 - r / (this.radialRings * 1.5));
          const g = Math.floor(100 + val * 155);
          const b = Math.floor(160 + val * 95);
          fillColor = `rgba(0, ${g}, ${b}, ${alpha})`;
        }

        ctx.fillStyle = fillColor;
        ctx.beginPath();
        ctx.arc(cx, cy, nextRadius, startAngle, endAngle);
        ctx.arc(cx, cy, radius, endAngle, startAngle, true);
        ctx.closePath();
        ctx.fill();
      }
    }

    // 2. Draw Polar Radial Grid Lines & Concentric Time Rings
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
    ctx.lineWidth = 1;

    // Concentric Time Rings (e.g. t = -8s, -16s, -24s, -32s)
    const timeIntervals = 4;
    for (let i = 1; i <= timeIntervals; i++) {
      const tr = innerR + (outerR - innerR) * (i / timeIntervals);
      ctx.beginPath();
      ctx.arc(cx, cy, tr, 0, Math.PI * 2);
      ctx.stroke();

      // Timestamp labels along 45-degree angle to avoid horizontal clutter
      const a = Math.PI * 0.25;
      const lx = cx + Math.cos(a) * tr;
      const ly = cy + Math.sin(a) * tr;
      ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.fillText(`-${i * 10}s`, lx + 3, ly - 3);
    }

    // Frequency Sector Boundary Radial Rays
    for (let i = 0; i < this.numSectors; i++) {
      const angle = (i * 36 - 90) * (Math.PI / 180);
      const isSectorLocked = this.candidates[i] && this.lockedCandidateIds.has(this.candidates[i].id);

      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
      ctx.lineTo(cx + Math.cos(angle) * (outerR + 4), cy + Math.sin(angle) * (outerR + 4));
      ctx.strokeStyle = isSectorLocked ? 'rgba(0, 255, 230, 0.6)' : 'rgba(0, 240, 255, 0.18)';
      ctx.lineWidth = isSectorLocked ? 1.5 : 1;
      ctx.stroke();
    }

    // 3. Draw Outer Polar Frequency Bezel & Sector Tags
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    ctx.stroke();

    // Outer Sector Glow & Frequency Band Indicators
    for (let i = 0; i < this.numSectors; i++) {
      const cand = this.candidates[i];
      const isLocked = cand && this.lockedCandidateIds.has(cand.id);
      const startAngle = ((i * 36) - 90) * (Math.PI / 180);
      const midAngle = ((i * 36 + 18) - 90) * (Math.PI / 180);
      const endAngle = (((i + 1) * 36) - 90) * (Math.PI / 180);

      // Outer rim sector highlight
      if (isLocked) {
        ctx.strokeStyle = '#00ffc8';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#00ffc8';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(cx, cy, outerR, startAngle, endAngle);
        ctx.stroke();
        ctx.shadowBlur = 0; // reset
      }

      // Frequency label at outer edge
      const labelR = outerR - 14;
      const lx = cx + Math.cos(midAngle) * labelR;
      const ly = cy + Math.sin(midAngle) * labelR;

      ctx.fillStyle = isLocked ? '#00ffc8' : 'rgba(180, 220, 240, 0.55)';
      ctx.font = isLocked ? 'bold 10px "JetBrains Mono", monospace' : '9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(cand.tag.split('-')[1] || cand.tag, lx, ly);

      // If locked, draw an energy vector ray connecting to the center
      if (isLocked && (this.systemState === 'READY' || this.systemState === 'BUILDUP' || this.systemState === 'ACTIVE')) {
        const pulse = Math.sin(this.activeTime * 8 + i) * 0.3 + 0.7;
        ctx.strokeStyle = `rgba(0, 255, 200, ${0.4 * pulse})`;
        ctx.lineWidth = this.systemState === 'ACTIVE' ? 3 : 1.5;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(midAngle) * innerR, cy + Math.sin(midAngle) * innerR);
        ctx.lineTo(cx + Math.cos(midAngle) * outerR, cy + Math.sin(midAngle) * outerR);
        ctx.stroke();
      }
    }

    // 4. Center Aperture Core (Cryogenic Carrier / Wormhole Singularity)
    this.renderCenterAperture(ctx, cx, cy, innerR);

    // 5. Activation State Visuals (Buildup, Breakthrough Flash, Sustained Beam)
    if (this.systemState === 'BUILDUP') {
      this.renderBuildupEffects(ctx, cx, cy, innerR, outerR);
    } else if (this.systemState === 'ACTIVE') {
      this.renderActiveStateEffects(ctx, cx, cy, innerR, outerR);
    }

    // 6. Breakthrough Flash Overlay
    if (this.flashOpacity > 0.005) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.flashOpacity})`;
      ctx.beginPath();
      ctx.arc(cx, cy, outerR + 10, 0, Math.PI * 2);
      ctx.fill();
      this.flashOpacity *= 0.88; // decay
    }

    this.animFrameId = requestAnimationFrame(this.render);
  }

  renderCenterAperture(ctx, cx, cy, innerR) {
    const time = this.activeTime;

    // Inner Core Base
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.clip();

    // Dark Singularity Background
    const coreGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, innerR);
    if (this.systemState === 'ACTIVE') {
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.2, '#00f0ff');
      coreGrad.addColorStop(0.6, '#0d1b2a');
      coreGrad.addColorStop(1, '#000814');
    } else if (this.systemState === 'READY') {
      coreGrad.addColorStop(0, 'rgba(0, 240, 255, 0.4)');
      coreGrad.addColorStop(0.5, 'rgba(0, 40, 60, 0.8)');
      coreGrad.addColorStop(1, '#020b14');
    } else {
      coreGrad.addColorStop(0, 'rgba(0, 80, 110, 0.3)');
      coreGrad.addColorStop(0.7, 'rgba(2, 10, 20, 0.9)');
      coreGrad.addColorStop(1, '#01050a');
    }
    ctx.fillStyle = coreGrad;
    ctx.fill();

    // Rotating Carrier Interference Reticle
    const numRays = 8;
    const rot = time * (this.systemState === 'ACTIVE' ? 1.8 : 0.4);
    ctx.strokeStyle = this.systemState === 'ACTIVE' ? 'rgba(0, 255, 230, 0.8)' : 'rgba(0, 240, 255, 0.25)';
    ctx.lineWidth = 1;

    for (let i = 0; i < numRays; i++) {
      const a = rot + (i * Math.PI * 2) / numRays;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * innerR, cy + Math.sin(a) * innerR);
      ctx.stroke();
    }

    // Aperture Particles
    this.apertureParticles.forEach(p => {
      p.angle += p.speed * (this.systemState === 'ACTIVE' ? 2.5 : 1.0);
      if (this.systemState === 'ACTIVE') {
        p.dist += p.radialSpeed;
        if (p.dist > innerR) p.dist = 4;
      }
      const px = cx + Math.cos(p.angle) * p.dist;
      const py = cy + Math.sin(p.angle) * p.dist;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Center Core Beacon Ring
    ctx.strokeStyle = this.systemState === 'ACTIVE' ? '#00f0ff' : 'rgba(0, 240, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, innerR * 0.45, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();

    // Inner Ring Border
    ctx.strokeStyle = this.systemState === 'ACTIVE' ? '#00ffc8' : 'rgba(0, 240, 255, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.stroke();
  }

  renderBuildupEffects(ctx, cx, cy, innerR, outerR) {
    const prog = this.buildupProgress;
    const time = this.activeTime;

    // Expanding Resonance Rings
    const ringRadius = innerR + (outerR - innerR) * ((time * 2) % 1);
    ctx.strokeStyle = `rgba(0, 240, 255, ${0.7 * (1 - ((time * 2) % 1))})`;
    ctx.lineWidth = 2 + prog * 4;
    ctx.beginPath();
    ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Swirling Doppler Arc Streaks
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(time * 4 * (1 + prog));
    ctx.strokeStyle = `rgba(255, 200, 0, ${0.4 + prog * 0.5})`;
    ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, innerR + (outerR - innerR) * (0.3 + i * 0.2), i * Math.PI * 0.5, i * Math.PI * 0.5 + 0.8);
      ctx.stroke();
    }
    ctx.restore();
  }

  renderActiveStateEffects(ctx, cx, cy, innerR, outerR) {
    const time = this.activeTime;

    // High-Power Coherent Laser Beams connecting each locked sector to the center vortex
    this.lockedCandidateIds.forEach(id => {
      const cand = this.candidates.find(c => c.id === id);
      if (!cand) return;
      const angle = (cand.sectorAngle - 90) * (Math.PI / 180);

      // Main Coherent Beam
      const grad = ctx.createLinearGradient(
        cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR,
        cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR
      );
      grad.addColorStop(0, 'rgba(0, 255, 200, 0.9)');
      grad.addColorStop(0.5, 'rgba(0, 240, 255, 1.0)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 1.0)');

      ctx.strokeStyle = grad;
      ctx.lineWidth = 3.5 + Math.sin(time * 12 + id) * 1.5;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
      ctx.lineTo(cx + Math.cos(angle) * (innerR * 0.5), cy + Math.sin(angle) * (innerR * 0.5));
      ctx.stroke();
      ctx.shadowBlur = 0;
    });

    // Pulsing Aperture Singularity Halo
    const pulse = 1 + Math.sin(time * 10) * 0.08;
    ctx.strokeStyle = 'rgba(0, 255, 230, 0.85)';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00ffc8';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(cx, cy, innerR * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  destroy() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
  }
}
