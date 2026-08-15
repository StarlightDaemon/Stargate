/**
 * Axiom Audio Visualizers - Real-Time Audio Meters, Polar Vectorscopes, & Quantum Portal
 */

class AxiomVisualizers {
  constructor() {
    this.ringCanvas = null;
    this.ringCtx = null;
    this.centerCanvas = null;
    this.centerCtx = null;
    this.waveCanvas = null;
    this.waveCtx = null;
    this.vuCanvas = null;
    this.vuCtx = null;

    // State tracking
    this.activeChannels = new Set(); // set of channel indices [0..9]
    this.portalActive = false;
    this.portalEnergy = 0.0;
    this.rotationAngle = 0.0;

    // VU meter needle ballistics (L/R)
    this.needleL = 0.0;
    this.needleR = 0.0;
    this.needleL_target = 0.0;
    this.needleR_target = 0.0;
    this.peakHoldL = 0.0;
    this.peakHoldR = 0.0;

    // Particle system for portal aperture
    this.particles = [];
    this.initParticles();

    // Bind loop
    this.render = this.render.bind(this);
    this.animId = null;
  }

  init() {
    this.ringCanvas = document.getElementById('ring-canvas');
    if (this.ringCanvas) this.ringCtx = this.ringCanvas.getContext('2d');

    this.centerCanvas = document.getElementById('center-aperture-canvas');
    if (this.centerCanvas) this.centerCtx = this.centerCanvas.getContext('2d');

    this.waveCanvas = document.getElementById('master-waveform-canvas');
    if (this.waveCanvas) this.waveCtx = this.waveCanvas.getContext('2d');

    this.vuCanvas = document.getElementById('vu-meters-canvas');
    if (this.vuCanvas) this.vuCtx = this.vuCanvas.getContext('2d');

    this.resizeCanvases();
    window.addEventListener('resize', () => this.resizeCanvases());

    if (!this.animId) {
      this.animId = requestAnimationFrame(this.render);
    }
  }

  initParticles() {
    this.particles = [];
    for (let i = 0; i < 90; i++) {
      this.particles.push({
        r: Math.random() * 140 + 20,
        theta: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.02 + 0.01,
        radialSpeed: (Math.random() * 0.8 + 0.2) * (Math.random() > 0.5 ? 1 : -1),
        size: Math.random() * 2.5 + 1,
        hue: Math.random() > 0.4 ? 185 : 40 // Cyan vs Amber
      });
    }
  }

  resizeCanvases() {
    const list = [
      { c: this.ringCanvas, w: 700, h: 700 },
      { c: this.centerCanvas, w: 360, h: 360 },
      { c: this.waveCanvas, w: 420, h: 100 },
      { c: this.vuCanvas, w: 340, h: 140 }
    ];
    list.forEach(item => {
      if (item.c) {
        item.c.width = item.w;
        item.c.height = item.h;
      }
    });
  }

  setActiveChannels(channels) {
    this.activeChannels = new Set(channels);
  }

  setPortalActive(active) {
    this.portalActive = active;
  }

  render(timestamp) {
    this.animId = requestAnimationFrame(this.render);

    const telemetry = window.AxiomAudio ? window.AxiomAudio.getTelemetry() : {
      freqData: new Uint8Array(128).fill(10),
      timeData: new Uint8Array(128).fill(128),
      rms: 0.05,
      peak: 0.08
    };

    // Smooth portal energy ramp
    if (this.portalActive) {
      this.portalEnergy = Math.min(1.0, this.portalEnergy + 0.03);
    } else {
      this.portalEnergy = Math.max(0.0, this.portalEnergy - 0.04);
    }

    this.rotationAngle += (0.005 + (this.portalEnergy * 0.025));

    // Render components
    this.drawRadialRing(telemetry);
    this.drawCenterAperture(telemetry, timestamp);
    this.drawMasterWaveform(telemetry);
    this.drawVUMeters(telemetry);
    this.updateLEDLadders(telemetry);
  }

  /**
   * 1. Draw Functioning Circular Multi-Band Spectrum / Polar Meter Ring
   */
  drawRadialRing(telemetry) {
    if (!this.ringCtx || !this.ringCanvas) return;
    const ctx = this.ringCtx;
    const w = this.ringCanvas.width;
    const h = this.ringCanvas.height;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    const outerRadius = 310;
    const innerRadius = 195;
    const channelCount = 10;
    const angleStep = (Math.PI * 2) / channelCount;

    // Background track ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, outerRadius, 0, Math.PI * 2);
    ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2, true);
    ctx.fillStyle = 'rgba(10, 15, 25, 0.7)';
    ctx.fill();

    // Outer guide bevel ring
    ctx.strokeStyle = 'rgba(68, 89, 130, 0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 10-Channel Radial LED Meter Arcs
    for (let i = 0; i < channelCount; i++) {
      const angle = (i * angleStep) - (Math.PI / 2);
      const isPatched = this.activeChannels.has(i);
      
      // Calculate signal level for this frequency band
      const freqBin = Math.min(127, Math.floor((i / channelCount) * 64) + 2);
      const rawLevel = (telemetry.freqData[freqBin] || 0) / 255;
      const bandLevel = isPatched ? (rawLevel * 0.7 + (this.portalActive ? 0.35 : 0.15) + (Math.sin(Date.now() * 0.008 + i) * 0.08)) : 0.04;
      
      const segmentCount = 12;
      const startR = innerRadius + 14;
      const segmentSpan = (outerRadius - innerRadius - 28) / segmentCount;

      for (let s = 0; s < segmentCount; s++) {
        const segFrac = s / segmentCount;
        const isLit = segFrac <= bandLevel;
        const r1 = startR + (s * segmentSpan);
        const r2 = r1 + segmentSpan - 2.5;

        ctx.beginPath();
        const arcWidth = angleStep * 0.65;
        const aStart = angle - (arcWidth / 2);
        const aEnd = angle + (arcWidth / 2);

        ctx.arc(cx, cy, r2, aStart, aEnd);
        ctx.arc(cx, cy, r1, aEnd, aStart, true);
        ctx.closePath();

        if (isLit) {
          if (s >= 10) {
            ctx.fillStyle = '#ff2244'; // Red peak
            ctx.shadowColor = '#ff2244';
            ctx.shadowBlur = 6;
          } else if (s >= 8) {
            ctx.fillStyle = '#ffaa00'; // Amber warn
            ctx.shadowColor = '#ffaa00';
            ctx.shadowBlur = 4;
          } else {
            ctx.fillStyle = isPatched ? '#00f0ff' : 'rgba(0, 240, 255, 0.4)';
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = isPatched ? 4 : 0;
          }
        } else {
          ctx.fillStyle = 'rgba(25, 35, 55, 0.35)';
          ctx.shadowBlur = 0;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Channel divider tick mark
      const tickAngle = angle + (angleStep / 2);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(tickAngle) * (innerRadius + 4), cy + Math.sin(tickAngle) * (innerRadius + 4));
      ctx.lineTo(cx + Math.cos(tickAngle) * (outerRadius - 4), cy + Math.sin(tickAngle) * (outerRadius - 4));
      ctx.strokeStyle = 'rgba(68, 89, 130, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Rotating phase alignment reticle
    ctx.beginPath();
    const reticleX = cx + Math.cos(this.rotationAngle) * ((outerRadius + innerRadius) / 2);
    const reticleY = cy + Math.sin(this.rotationAngle) * ((outerRadius + innerRadius) / 2);
    ctx.arc(reticleX, reticleY, 5, 0, Math.PI * 2);
    ctx.fillStyle = this.portalActive ? '#ffaa00' : '#00f0ff';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  /**
   * 2. Draw Central Aperture: Vectorscope / Lissajous in Idle, Hyper-Luminal Wormhole when Active
   */
  drawCenterAperture(telemetry, timestamp) {
    if (!this.centerCtx || !this.centerCanvas) return;
    const ctx = this.centerCtx;
    const w = this.centerCanvas.width;
    const h = this.centerCanvas.height;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    // Vignette background
    const bgGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, cx);
    bgGrad.addColorStop(0, this.portalActive ? 'rgba(0, 20, 35, 0.95)' : 'rgba(5, 8, 14, 0.95)');
    bgGrad.addColorStop(1, 'rgba(3, 5, 8, 0.98)');
    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, cx - 2, 0, Math.PI * 2);
    ctx.fill();

    // Circular grid reticle
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
    ctx.lineWidth = 1;
    [40, 80, 120, 160].forEach(r => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(cx - 160, cy); ctx.lineTo(cx + 160, cy);
    ctx.moveTo(cx, cy - 160); ctx.lineTo(cx, cy + 160);
    ctx.stroke();

    // Mode A: IDLE / DIALING PHASE (Lissajous Vectorscope + Waveform)
    if (this.portalEnergy < 0.9) {
      const alpha = 1.0 - this.portalEnergy;
      ctx.globalAlpha = alpha;

      const timeData = telemetry.timeData;
      const len = timeData.length;

      // Phase Lissajous curve
      ctx.beginPath();
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 1.8;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 8;

      const baseR = 75;
      const harmonics = this.activeChannels.size || 1;

      for (let i = 0; i < len; i += 2) {
        const t = (i / len) * Math.PI * 2;
        const amp1 = (timeData[i] - 128) / 128;
        const amp2 = (timeData[(i + 32) % len] - 128) / 128;
        
        // Multi-frequency Lissajous equation
        const x = cx + Math.sin(t * harmonics + this.rotationAngle) * (baseR + amp1 * 40);
        const y = cy + Math.cos(t * 2 + (amp2 * 1.5)) * (baseR + amp2 * 40);
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Amber secondary resonance ring
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 170, 0, 0.6)';
      ctx.lineWidth = 1.2;
      for (let i = 0; i < len; i += 4) {
        const t = (i / len) * Math.PI * 2;
        const amp = (timeData[i] - 128) / 128;
        const r = 35 + amp * 30 + Math.sin(t * 5 + this.rotationAngle * 3) * 10;
        const x = cx + Math.cos(t) * r;
        const y = cy + Math.sin(t) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // Mode B: PORTAL MASTER SUMMING APERTURE (High-Energy Wormhole)
    if (this.portalEnergy > 0.05) {
      const e = this.portalEnergy;
      ctx.globalAlpha = e;

      // 1. Swirling Quantum Vortex Rings
      const ringCount = 7;
      for (let k = 0; k < ringCount; k++) {
        const kAngle = this.rotationAngle * (k % 2 === 0 ? 2.2 : -1.8) + (k * 0.9);
        const radius = 25 + (k * 18 * e);
        const points = 16;
        
        ctx.beginPath();
        for (let p = 0; p <= points; p++) {
          const pAngle = (p / points) * Math.PI * 2;
          const wobble = Math.sin(pAngle * 4 + timestamp * 0.005 + k) * (6 * e);
          const r = radius + wobble;
          const px = cx + Math.cos(pAngle + kAngle) * r;
          const py = cy + Math.sin(pAngle + kAngle) * r;
          if (p === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = k % 2 === 0 ? `rgba(0, 240, 255, ${0.4 + e * 0.5})` : `rgba(255, 170, 0, ${0.4 + e * 0.5})`;
        ctx.lineWidth = 2.0;
        ctx.shadowColor = k % 2 === 0 ? '#00f0ff' : '#ffaa00';
        ctx.shadowBlur = 12 * e;
        ctx.stroke();
      }

      // 2. Converging Particle Flux
      this.particles.forEach(p => {
        p.theta += p.speed * (1 + e * 3);
        p.r -= (p.radialSpeed * (1 + e * 2));
        if (p.r < 10) p.r = 155;
        if (p.r > 160) p.r = 15;

        const px = cx + Math.cos(p.theta) * p.r;
        const py = cy + Math.sin(p.theta) * p.r;

        ctx.beginPath();
        ctx.arc(px, py, p.size * (1 + e * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = p.hue === 185 ? `rgba(0, 240, 255, ${0.5 + e * 0.5})` : `rgba(255, 170, 0, ${0.5 + e * 0.5})`;
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 8;
        ctx.fill();
      });

      // 3. Central Harmonic Singularity Core (Pulsing Energy Beam)
      const coreR = (18 + Math.sin(timestamp * 0.012) * 6 + (telemetry.peak * 25)) * e;
      const coreGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, coreR);
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.3, '#00f0ff');
      coreGrad.addColorStop(0.7, '#ffaa00');
      coreGrad.addColorStop(1, 'rgba(255, 85, 34, 0)');

      ctx.beginPath();
      ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 24 * e;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }

  /**
   * 3. Draw Master Telemetry Continuous Waveform Oscilloscope
   */
  drawMasterWaveform(telemetry) {
    if (!this.waveCtx || !this.waveCanvas) return;
    const ctx = this.waveCtx;
    const w = this.waveCanvas.width;
    const h = this.waveCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // Dark grid background
    ctx.fillStyle = 'rgba(7, 10, 16, 0.9)';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(46, 61, 91, 0.3)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 20) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    // Center line
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
    ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke();

    const timeData = telemetry.timeData;
    const sliceWidth = w / (timeData.length - 1);

    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = this.portalActive ? '#ffaa00' : '#00f0ff';
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 6;

    for (let i = 0; i < timeData.length; i++) {
      const v = (timeData[i] - 128) / 128;
      const boost = this.portalActive ? 1.6 : (this.activeChannels.size > 0 ? 1.0 : 0.15);
      const y = (h / 2) + (v * (h / 2.2) * boost);
      const x = i * sliceWidth;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  /**
   * 4. Draw Analog Dual VU Meter Needles (Realistic Ballistics)
   */
  drawVUMeters(telemetry) {
    if (!this.vuCtx || !this.vuCanvas) return;
    const ctx = this.vuCtx;
    const w = this.vuCanvas.width;
    const h = this.vuCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // Target values based on audio RMS & peak
    const activeFactor = this.portalActive ? 0.92 : (this.activeChannels.size > 0 ? 0.45 : 0.05);
    const noiseL = (Math.random() * 0.04 - 0.02);
    const noiseR = (Math.random() * 0.04 - 0.02);
    
    this.needleL_target = Math.min(1.0, Math.max(0.0, (telemetry.rms * 1.8 + activeFactor + noiseL)));
    this.needleR_target = Math.min(1.0, Math.max(0.0, (telemetry.rms * 1.75 + activeFactor + noiseR)));

    // Ballistic physics smoothing
    this.needleL += (this.needleL_target - this.needleL) * 0.18;
    this.needleR += (this.needleR_target - this.needleR) * 0.18;

    const meterW = 160;
    const meterH = 130;

    // Draw Left VU Meter
    this.drawSingleVU(ctx, 5, 5, meterW, meterH, 'MASTER CH-L', this.needleL);
    // Draw Right VU Meter
    this.drawSingleVU(ctx, 175, 5, meterW, meterH, 'MASTER CH-R', this.needleR);
  }

  drawSingleVU(ctx, x, y, w, h, label, val) {
    ctx.save();
    ctx.translate(x, y);

    // Meter face plate
    ctx.fillStyle = '#0b0f17';
    ctx.strokeStyle = '#2a374f';
    ctx.lineWidth = 2;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeRect(0, 0, w, h);

    // Amber vintage backlight glow
    const glow = ctx.createRadialGradient(w / 2, h * 0.8, 10, w / 2, h * 0.8, w * 0.7);
    glow.addColorStop(0, 'rgba(255, 170, 0, 0.15)');
    glow.addColorStop(1, 'rgba(11, 15, 23, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(2, 2, w - 4, h - 4);

    // Scale Arc
    const cx = w / 2;
    const cy = h * 0.92;
    const r = 72;
    const minA = -Math.PI * 0.75;
    const maxA = -Math.PI * 0.25;

    // Normal zone (-20 to 0 dB)
    ctx.beginPath();
    ctx.arc(cx, cy, r, minA, minA + (maxA - minA) * 0.75);
    ctx.strokeStyle = '#7f93b5';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Red Overload zone (0 to +3 dB)
    ctx.beginPath();
    ctx.arc(cx, cy, r, minA + (maxA - minA) * 0.75, maxA);
    ctx.strokeStyle = '#ff2244';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Ticks
    for (let t = 0; t <= 10; t++) {
      const a = minA + (maxA - minA) * (t / 10);
      const isRed = t >= 8;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * (r - 4), cy + Math.sin(a) * (r - 4));
      ctx.lineTo(cx + Math.cos(a) * (r + 4), cy + Math.sin(a) * (r + 4));
      ctx.strokeStyle = isRed ? '#ff2244' : '#7f93b5';
      ctx.lineWidth = t % 2 === 0 ? 2 : 1;
      ctx.stroke();
    }

    // Label
    ctx.fillStyle = '#7f93b5';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, cx, 22);
    ctx.fillText('VU -20  -7  -3  0  +3', cx, 40);

    // Needle
    const needleAngle = minA + (maxA - minA) * val;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(needleAngle) * (r + 2), cy + Math.sin(needleAngle) * (r + 2));
    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 1.8;
    ctx.shadowColor = '#ffaa00';
    ctx.shadowBlur = 4;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Pivot cap
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#1c263b';
    ctx.strokeStyle = '#445982';
    ctx.lineWidth = 1.5;
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  /**
   * 5. Update Stereo Segmented Peak LED Ladders (DOM elements)
   */
  updateLEDLadders(telemetry) {
    const ledL = document.querySelectorAll('#led-ladder-l .led-seg');
    const ledR = document.querySelectorAll('#led-ladder-r .led-seg');
    if (!ledL.length) return;

    const totalSegs = ledL.length;
    const litCountL = Math.floor(this.needleL * totalSegs);
    const litCountR = Math.floor(this.needleR * totalSegs);

    ledL.forEach((seg, i) => {
      // Invert index so bottom lights first
      const segIndex = totalSegs - 1 - i;
      if (segIndex < litCountL) {
        seg.classList.add('lit');
      } else {
        seg.classList.remove('lit');
      }
    });

    ledR.forEach((seg, i) => {
      const segIndex = totalSegs - 1 - i;
      if (segIndex < litCountR) {
        seg.classList.add('lit');
      } else {
        seg.classList.remove('lit');
      }
    });
  }
}

window.AxiomVisuals = new AxiomVisualizers();
