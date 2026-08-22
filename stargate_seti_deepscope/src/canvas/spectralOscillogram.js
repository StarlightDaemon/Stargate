// Real-Time I/Q Phase Constellation & 128-Bin FFT Power Spectrum Oscillogram

export class SpectralOscillogram {
  constructor(iqCanvasId, powerCanvasId) {
    this.iqCanvas = document.getElementById(iqCanvasId);
    this.iqCtx = this.iqCanvas.getContext('2d');

    this.powerCanvas = document.getElementById(powerCanvasId);
    this.powerCtx = this.powerCanvas.getContext('2d');

    this.numBins = 128;
    this.fftData = new Float32Array(this.numBins);
    this.peakHold = new Float32Array(this.numBins);

    this.iqPoints = [];
    this.maxIqPoints = 140;

    this.time = 0;
    this.isActive = false;
    this.carrierLockedCount = 0;

    this.themeColor = '#00f0ff';
    this.accentRgb = '0, 240, 255';
  }

  setTheme(accentHex, accentRgb) {
    this.themeColor = accentHex;
    this.accentRgb = accentRgb;
  }

  setState(active, lockedCount) {
    this.isActive = active;
    this.carrierLockedCount = lockedCount;
  }

  update(dt) {
    this.time += dt * 0.001;

    // 1. Update FFT Power Bins
    for (let i = 0; i < this.numBins; i++) {
      // Base thermal noise floor
      let val = 0.08 + Math.random() * 0.12;

      // Add harmonic spikes if carriers are locked
      if (this.carrierLockedCount > 0) {
        for (let c = 0; c < this.carrierLockedCount; c++) {
          const targetBin = Math.floor((c + 1) * (this.numBins / 8.5)) % this.numBins;
          const dist = Math.abs(i - targetBin);
          if (dist < 3) {
            val += (1.0 - dist * 0.3) * (0.55 + Math.sin(this.time * 6 + c) * 0.15);
          }
        }
      }

      if (this.isActive) {
        val = Math.min(1.0, val * 1.5 + (Math.sin(this.time * 12 + i * 0.1) * 0.1));
      }

      this.fftData[i] = Math.min(0.95, val);

      // Peak Hold
      if (this.fftData[i] > this.peakHold[i]) {
        this.peakHold[i] = this.fftData[i];
      } else {
        this.peakHold[i] = Math.max(0.05, this.peakHold[i] - dt * 0.0004);
      }
    }

    // 2. Update I/Q Phase Constellation Points
    const coherence = Math.min(1.0, this.carrierLockedCount / 7.0);
    const newPointsCount = 6;
    for (let p = 0; p < newPointsCount; p++) {
      let iVal, qVal;
      if (this.isActive || coherence > 0.8) {
        // High phase coherence: clustered around discrete QPSK/BPSK constellation points
        const quadrant = Math.floor(Math.random() * 4);
        const targetI = (quadrant === 0 || quadrant === 3) ? 0.6 : -0.6;
        const targetQ = (quadrant === 0 || quadrant === 1) ? 0.6 : -0.6;
        iVal = targetI + (Math.random() - 0.5) * 0.15;
        qVal = targetQ + (Math.random() - 0.5) * 0.15;
      } else if (coherence > 0.3) {
        // Partial coherence
        const angle = Math.random() * Math.PI * 2;
        const r = 0.4 + (Math.random() - 0.5) * 0.3;
        iVal = Math.cos(angle) * r;
        qVal = Math.sin(angle) * r;
      } else {
        // Pure Gaussian noise scatter
        iVal = (Math.random() - 0.5) * 1.5;
        qVal = (Math.random() - 0.5) * 1.5;
      }

      this.iqPoints.push({ i: iVal, q: qVal, alpha: 1.0 });
    }

    // Age and prune I/Q points
    this.iqPoints.forEach(pt => pt.alpha -= dt * 0.002);
    this.iqPoints = this.iqPoints.filter(pt => pt.alpha > 0.05);
    if (this.iqPoints.length > this.maxIqPoints) {
      this.iqPoints.splice(0, this.iqPoints.length - this.maxIqPoints);
    }
  }

  draw() {
    this.drawIqScatter();
    this.drawPowerSpectrum();
  }

  // Draw I/Q Phase Constellation Scatter
  drawIqScatter() {
    const ctx = this.iqCtx;
    const w = this.iqCanvas.width;
    const h = this.iqCanvas.height;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    // Crosshair Grids
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, 0); ctx.lineTo(cx, h);
    ctx.moveTo(0, cy); ctx.lineTo(w, cy);
    ctx.stroke();

    // Unit Circle
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
    ctx.beginPath();
    ctx.arc(cx, cy, 45, 0, Math.PI * 2);
    ctx.stroke();

    // Points
    const scale = 55;
    this.iqPoints.forEach(pt => {
      const px = cx + pt.i * scale;
      const py = cy + pt.q * scale;

      ctx.fillStyle = (this.isActive || this.carrierLockedCount >= 7)
        ? `rgba(255, 255, 255, ${pt.alpha})`
        : `rgba(${this.accentRgb}, ${pt.alpha * 0.8})`;

      ctx.beginPath();
      ctx.arc(px, py, 1.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Draw 128-Bin FFT Power Spectrum
  drawPowerSpectrum() {
    const ctx = this.powerCtx;
    const w = this.powerCanvas.width;
    const h = this.powerCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // Horizontal Threshold Lines
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.1)';
    ctx.lineWidth = 1;
    [0.25, 0.5, 0.75].forEach(norm => {
      const y = h - norm * (h - 10) - 5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    });

    // Draw Spectrum Bars
    const barWidth = w / this.numBins;
    for (let i = 0; i < this.numBins; i++) {
      const val = this.fftData[i];
      const barHeight = val * (h - 12);
      const x = i * barWidth;
      const y = h - barHeight - 4;

      // Color based on height
      if (val > 0.6) {
        ctx.fillStyle = this.themeColor;
      } else {
        ctx.fillStyle = `rgba(${this.accentRgb}, 0.35)`;
      }

      ctx.fillRect(x, y, barWidth - 0.5, barHeight);

      // Peak Hold Marker
      const peakY = h - this.peakHold[i] * (h - 12) - 4;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, peakY, barWidth - 0.5, 1.5);
    }
  }
}
