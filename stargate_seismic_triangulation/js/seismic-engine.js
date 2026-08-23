/**
 * seismic-engine.js - Canvas Rendering Engine for Lithospheric Triangulation & Seismograms
 * Cascadia Lithospheric Seismo-Acoustic Array (CLSA-9)
 */

class SeismicVisualEngine {
  constructor(mainCanvasId, waterfallCanvasId) {
    this.canvas = document.getElementById(mainCanvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

    this.waterfallCanvas = document.getElementById(waterfallCanvasId);
    this.wfCtx = this.waterfallCanvas ? this.waterfallCanvas.getContext('2d') : null;

    this.lockedStations = []; // array of station indices
    this.syncingStation = -1;
    this.state = 'IDLE'; // IDLE, LOCKING, PENDING, BUILDUP, BREAKTHROUGH, ACTIVE

    this.center = { x: 0, y: 0 };
    this.arrayRadius = 260;

    // Animation state
    this.time = 0;
    this.waves = []; // expanding P & S wavefront circles
    this.ruptureRings = []; // breakthrough explosion rings
    this.particles = [];

    // Waterfall history buffer: 10 channels x 200 points
    this.channelData = Array.from({ length: 10 }, () => new Float32Array(220));

    // Shake offset for buildup
    this.shake = { x: 0, y: 0 };

    this.setupCanvas();
    window.addEventListener('resize', () => this.setupCanvas());
    this.startRenderLoop();
  }

  setupCanvas() {
    if (this.canvas) {
      const rect = this.canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      this.canvas.width = (this.canvas.clientWidth || 1160) * dpr;
      this.canvas.height = (this.canvas.clientHeight || 580) * dpr;
      this.center = {
        x: this.canvas.width / 2,
        y: this.canvas.height / 2 + 10
      };
      this.arrayRadius = Math.min(this.canvas.width, this.canvas.height) * 0.40;
    }

    if (this.waterfallCanvas) {
      const dpr = window.devicePixelRatio || 1;
      this.waterfallCanvas.width = (this.waterfallCanvas.clientWidth || 1130) * dpr;
      this.waterfallCanvas.height = (this.waterfallCanvas.clientHeight || 200) * dpr;
    }
  }

  setLockedStations(indices) {
    this.lockedStations = [...indices];
  }

  setState(state) {
    this.state = state;
    if (state === 'BREAKTHROUGH') {
      this.triggerBreakthroughShock();
    }
  }

  triggerBreakthroughShock() {
    // Generate massive shockwave expansion rings
    this.ruptureRings = [];
    for (let i = 0; i < 5; i++) {
      this.ruptureRings.push({
        radius: 5 + i * 20,
        maxRadius: this.canvas.width * 0.9,
        speed: 16 + i * 4,
        alpha: 1.0,
        color: i % 2 === 0 ? '#00e5ff' : '#ffffff'
      });
    }
  }

  startRenderLoop() {
    const loop = (timestamp) => {
      this.time = timestamp * 0.001;
      this.updateSimulation();
      this.renderMainArray();
      this.renderWaterfall();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  updateSimulation() {
    // Spawn wave fronts from locked stations
    if (this.lockedStations.length > 0 && Math.floor(this.time * 60) % 28 === 0) {
      this.lockedStations.forEach(stIdx => {
        const st = SEISMIC_STATIONS[stIdx];
        const rad = (st.angle - 90) * (Math.PI / 180);
        const stX = this.center.x + Math.cos(rad) * this.arrayRadius;
        const stY = this.center.y + Math.sin(rad) * this.arrayRadius;

        // P-wave (fast, cyan)
        this.waves.push({
          x: stX,
          y: stY,
          radius: 4,
          speed: 3.2,
          maxRadius: this.arrayRadius * 2.2,
          color: 'rgba(0, 229, 255, ',
          type: 'P'
        });

        // S-wave (slower, amber)
        this.waves.push({
          x: stX,
          y: stY,
          radius: 2,
          speed: 1.8,
          maxRadius: this.arrayRadius * 1.8,
          color: 'rgba(255, 179, 0, ',
          type: 'S'
        });
      });
    }

    // Update active wavefronts
    for (let i = this.waves.length - 1; i >= 0; i--) {
      const w = this.waves[i];
      w.radius += w.speed * (this.state === 'BUILDUP' ? 1.8 : 1.0);
      if (w.radius >= w.maxRadius) {
        this.waves.splice(i, 1);
      }
    }

    // Update rupture shockwave rings
    for (let i = this.ruptureRings.length - 1; i >= 0; i--) {
      const ring = this.ruptureRings[i];
      ring.radius += ring.speed;
      ring.alpha = Math.max(0, 1 - ring.radius / ring.maxRadius);
      if (ring.alpha <= 0 || ring.radius >= ring.maxRadius) {
        this.ruptureRings.splice(i, 1);
      }
    }

    // Camera shake during buildup
    if (this.state === 'BUILDUP') {
      this.shake.x = (Math.random() - 0.5) * 6;
      this.shake.y = (Math.random() - 0.5) * 6;
    } else if (this.state === 'BREAKTHROUGH') {
      this.shake.x = (Math.random() - 0.5) * 12;
      this.shake.y = (Math.random() - 0.5) * 12;
    } else {
      this.shake.x = 0;
      this.shake.y = 0;
    }

    // Update waterfall channel buffer
    this.updateWaterfallBuffers();
  }

  updateWaterfallBuffers() {
    for (let ch = 0; ch < 10; ch++) {
      const isLocked = this.lockedStations.includes(ch);
      const buf = this.channelData[ch];

      // Shift left
      for (let i = 0; i < buf.length - 1; i++) {
        buf[i] = buf[i + 1];
      }

      // Generate new point
      let val = 0;
      if (this.state === 'ACTIVE') {
        val = (Math.sin(this.time * 12 + ch * 1.5) * 0.75 + (Math.random() - 0.5) * 0.25);
      } else if (this.state === 'BUILDUP') {
        const amp = 0.4 + Math.sin(this.time * 20 + ch) * 0.6;
        val = (Math.sin(this.time * 25 + ch) * amp + (Math.random() - 0.5) * 0.5);
      } else if (isLocked) {
        val = (Math.sin(this.time * 8 + ch * 0.8) * 0.55 + (Math.random() - 0.5) * 0.15);
      } else {
        // Uncorrelated background microseismic noise
        val = (Math.random() - 0.5) * 0.22;
      }
      buf[buf.length - 1] = val;
    }
  }

  renderMainArray() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.save();
    ctx.clearRect(0, 0, w, h);
    ctx.translate(this.shake.x, this.shake.y);

    const cx = this.center.x;
    const cy = this.center.y;
    const radius = this.arrayRadius;

    // 1. Draw Polar Grid & Range Rings
    this.drawPolarGrid(ctx, cx, cy, radius);

    // 2. Draw Concentric Wavefront Rings propagating from locked stations
    this.drawWavefronts(ctx);

    // 3. Compute current Triangulation Coordinates
    const tri = window.seismicTelemetry.solveTriangulation(this.lockedStations, cx, cy, radius);

    // 4. Draw Triangulation Rays from locked stations to epicenter
    this.drawTriangulationRays(ctx, cx, cy, radius, tri);

    // 5. Draw Uncertainty Error Ellipse at Epicenter
    this.drawUncertaintyEllipse(ctx, tri);

    // 6. Draw Station Nodes along array perimeter
    this.drawStationNodes(ctx, cx, cy, radius);

    // 7. Draw Breakthrough / Active Aperture effects
    this.drawAperture(ctx, tri);

    ctx.restore();
  }

  drawPolarGrid(ctx, cx, cy, radius) {
    // Outer boundary circle
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Intermediate depth rings (100km, 250km, 500km)
    const ringRatios = [0.25, 0.5, 0.75];
    ctx.setLineDash([4, 6]);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(40, 110, 170, 0.3)';
    ringRatios.forEach(r => {
      ctx.beginPath();
      ctx.arc(cx, cy, radius * r, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    // Crosshairs
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.18)';
    ctx.beginPath();
    ctx.moveTo(cx - radius * 1.1, cy);
    ctx.lineTo(cx + radius * 1.1, cy);
    ctx.moveTo(cx, cy - radius * 1.1);
    ctx.lineTo(cx, cy + radius * 1.1);
    ctx.stroke();

    // Radial Azimuth Degree Tick Marks
    ctx.fillStyle = 'rgba(138, 180, 248, 0.6)';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let deg = 0; deg < 360; deg += 30) {
      const rad = (deg - 90) * (Math.PI / 180);
      const tickInner = radius - 8;
      const tickOuter = radius + 6;

      ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(rad) * tickInner, cy + Math.sin(rad) * tickInner);
      ctx.lineTo(cx + Math.cos(rad) * tickOuter, cy + Math.sin(rad) * tickOuter);
      ctx.stroke();

      const labelDist = radius + 22;
      const lx = cx + Math.cos(rad) * labelDist;
      const ly = cy + Math.sin(rad) * labelDist;
      ctx.fillText(`${deg.toString().padStart(3, '0')}°`, lx, ly);
    }
  }

  drawWavefronts(ctx) {
    this.waves.forEach(w => {
      const progress = w.radius / w.maxRadius;
      const alpha = Math.max(0, 0.6 * (1 - progress));
      ctx.strokeStyle = `${w.color}${alpha})`;
      ctx.lineWidth = w.type === 'P' ? 1.5 : 2;
      if (w.type === 'S') ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(w.x, w.y, w.radius, 0, Math.PI * 2);
      ctx.stroke();
      if (w.type === 'S') ctx.setLineDash([]);
    });
  }

  drawTriangulationRays(ctx, cx, cy, radius, tri) {
    if (this.lockedStations.length === 0) return;

    this.lockedStations.forEach((stIdx, i) => {
      const st = SEISMIC_STATIONS[stIdx];
      const rad = (st.angle - 90) * (Math.PI / 180);
      const stX = cx + Math.cos(rad) * radius;
      const stY = cy + Math.sin(rad) * radius;

      // Glowing Ray Vector line
      ctx.strokeStyle = this.state === 'ACTIVE'
        ? 'rgba(0, 229, 255, 0.85)'
        : 'rgba(0, 229, 255, 0.5)';
      ctx.lineWidth = this.state === 'ACTIVE' ? 2 : 1.5;
      ctx.beginPath();
      ctx.moveTo(stX, stY);
      ctx.lineTo(tri.x, tri.y);
      ctx.stroke();

      // Traveling phase wavelets along ray
      const pulseT = (this.time * 2.5 + i * 0.3) % 1.0;
      const px = stX + (tri.x - stX) * pulseT;
      const py = stY + (tri.y - stY) * pulseT;

      ctx.fillStyle = '#00ffb3';
      ctx.shadowColor = '#00ffb3';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }

  drawUncertaintyEllipse(ctx, tri) {
    if (this.lockedStations.length === 0) return;

    ctx.save();
    ctx.translate(tri.x, tri.y);
    ctx.rotate(tri.ellipseAngle * (Math.PI / 180));

    // Semi-transparent error ellipse interior
    ctx.fillStyle = tri.resolved
      ? 'rgba(255, 109, 0, 0.15)'
      : 'rgba(0, 229, 255, 0.08)';
    ctx.strokeStyle = tri.resolved
      ? 'rgba(255, 109, 0, 0.85)'
      : 'rgba(0, 229, 255, 0.6)';
    ctx.lineWidth = tri.resolved ? 2 : 1.5;
    ctx.setLineDash([4, 4]);

    ctx.beginPath();
    ctx.ellipse(0, 0, tri.ellipseA, tri.ellipseB, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);

    // Epicenter Focal Crosshair Target
    ctx.strokeStyle = tri.resolved ? '#ff6d00' : '#00e5ff';
    ctx.lineWidth = 2;
    const sz = tri.resolved ? 10 : 7;
    ctx.beginPath();
    ctx.moveTo(-sz, 0);
    ctx.lineTo(sz, 0);
    ctx.moveTo(0, -sz);
    ctx.lineTo(0, sz);
    ctx.stroke();

    ctx.restore();
  }

  drawStationNodes(ctx, cx, cy, radius) {
    SEISMIC_STATIONS.forEach((st, idx) => {
      const isLocked = this.lockedStations.includes(idx);
      const isSyncing = this.syncingStation === idx;
      const rad = (st.angle - 90) * (Math.PI / 180);
      const nx = cx + Math.cos(rad) * radius;
      const ny = cy + Math.sin(rad) * radius;

      // Outer Halo
      if (isLocked || isSyncing) {
        ctx.fillStyle = isLocked ? 'rgba(0, 229, 255, 0.25)' : 'rgba(0, 255, 179, 0.35)';
        ctx.beginPath();
        ctx.arc(nx, ny, 16, 0, Math.PI * 2);
        ctx.fill();
      }

      // Station Node Core
      ctx.fillStyle = isLocked ? '#00e5ff' : '#102238';
      ctx.strokeStyle = isLocked ? '#ffffff' : 'rgba(0, 229, 255, 0.6)';
      ctx.lineWidth = isLocked ? 2.5 : 1.5;

      ctx.beginPath();
      ctx.arc(nx, ny, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Mini waveform ring on station node
      if (isLocked) {
        const waveR = 10 + Math.sin(this.time * 6 + idx) * 3;
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(nx, ny, waveR, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Station Tag Label
      const tagRad = (st.angle - 90) * (Math.PI / 180);
      const tagDist = radius - 30;
      const tx = cx + Math.cos(tagRad) * tagDist;
      const ty = cy + Math.sin(tagRad) * tagDist;

      ctx.fillStyle = isLocked ? '#00e5ff' : 'rgba(138, 180, 248, 0.65)';
      ctx.font = isLocked ? 'bold 11px "JetBrains Mono", monospace' : '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(st.id, tx, ty);
    });
  }

  drawAperture(ctx, tri) {
    // 1. Breakthrough Shockwave Rings
    this.ruptureRings.forEach(ring => {
      ctx.strokeStyle = ring.color;
      ctx.lineWidth = 4 * ring.alpha;
      ctx.shadowColor = ring.color;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(tri.x, tri.y, ring.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    });

    // 2. Sustained Active State Vortex Aperture
    if (this.state === 'ACTIVE') {
      const apertureRadius = 38 + Math.sin(this.time * 5) * 6;

      // Outer plasma ring
      const grad = ctx.createRadialGradient(tri.x, tri.y, 2, tri.x, tri.y, apertureRadius);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, 'rgba(0, 229, 255, 0.9)');
      grad.addColorStop(0.7, 'rgba(255, 109, 0, 0.6)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(tri.x, tri.y, apertureRadius, 0, Math.PI * 2);
      ctx.fill();

      // Rupture fault fracture lines radiating from center
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 6; i++) {
        const fAngle = this.time * 2 + (i * Math.PI / 3);
        const fx = tri.x + Math.cos(fAngle) * (apertureRadius * 1.3);
        const fy = tri.y + Math.sin(fAngle) * (apertureRadius * 1.3);
        ctx.beginPath();
        ctx.moveTo(tri.x, tri.y);
        ctx.lineTo(fx, fy);
        ctx.stroke();
      }
    }
  }

  renderWaterfall() {
    if (!this.wfCtx) return;
    const ctx = this.wfCtx;
    const w = this.waterfallCanvas.width;
    const h = this.waterfallCanvas.height;

    ctx.clearRect(0, 0, w, h);

    const channelHeight = h / 10;

    for (let ch = 0; ch < 10; ch++) {
      const isLocked = this.lockedStations.includes(ch);
      const st = SEISMIC_STATIONS[ch];
      const yCenter = ch * channelHeight + channelHeight / 2;
      const buf = this.channelData[ch];

      // Channel divider line
      ctx.strokeStyle = 'rgba(30, 60, 95, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(70, yCenter + channelHeight / 2);
      ctx.lineTo(w, yCenter + channelHeight / 2);
      ctx.stroke();

      // Station ID Label on Left
      ctx.fillStyle = isLocked ? '#00e5ff' : 'rgba(138, 180, 248, 0.5)';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${st.id} [${isLocked ? 'SYNC' : 'IDLE'}]`, 8, yCenter);

      // Seismogram Trace
      ctx.strokeStyle = isLocked ? '#00e5ff' : 'rgba(0, 229, 255, 0.35)';
      if (this.state === 'ACTIVE' && isLocked) {
        ctx.strokeStyle = '#00ffb3';
        ctx.lineWidth = 2;
      } else {
        ctx.lineWidth = isLocked ? 1.8 : 1.0;
      }

      ctx.beginPath();
      const startX = 85;
      const traceWidth = w - startX - 10;
      const dx = traceWidth / (buf.length - 1);

      for (let i = 0; i < buf.length; i++) {
        const x = startX + i * dx;
        const amp = channelHeight * 0.42;
        const y = yCenter - buf[i] * amp;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
}

window.SeismicVisualEngine = SeismicVisualEngine;
