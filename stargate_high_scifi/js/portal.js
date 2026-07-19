// The aperture surface. Closed, it is the Artifact's grey glass — near-black,
// with faint vacuum speckle. Open, it is not a liquid and not a tunnel: it is
// a lens. You are looking at the destination's sky through a compiled metric,
// complete with photon ring and chromatic fringing at the rim.

export class Portal {
  constructor(canvas, reducedMotion) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.reduced = reducedMotion;
    this.mode = 'closed';        // closed | ignite | open | collapse
    this.modeT = 0;              // seconds in current mode
    this.strain = 0;             // 0..1, driven by the dialer during a solve
    this.palette = null;
    this.stars = [];
    this.nebula = null;          // offscreen canvas
    this.rot = 0;
    this.speckles = [];
    this.rippleAt = 8 + Math.random() * 8;
    this.rippleAge = -1;
    this.size = 0;

    const ro = new ResizeObserver(() => this.resize());
    ro.observe(canvas);
    this.resize();

    for (let i = 0; i < 42; i++) {
      this.speckles.push({
        a: Math.random() * Math.PI * 2,
        r: Math.sqrt(Math.random()),
        tw: Math.random() * Math.PI * 2,
        sp: 0.02 + Math.random() * 0.05,
      });
    }
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.width) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.size = rect.width;
    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (this.palette) this.buildNebula();
  }

  setMode(mode) { this.mode = mode; this.modeT = 0; }
  setStrain(v) { this.strain = v; }

  ignite(palette) {
    this.palette = palette;
    this.buildStars();
    this.buildNebula();
    this.rot = 0;
    this.setMode(this.reduced ? 'open' : 'ignite');
  }

  collapse() {
    if (!this.palette || this.mode === 'closed') { this.setMode('closed'); return; }
    this.setMode(this.reduced ? 'closed' : 'collapse');
  }

  buildStars() {
    this.stars = [];
    const n = this.reduced ? 120 : 230;
    for (let i = 0; i < n; i++) {
      this.stars.push({
        r: Math.sqrt(Math.random()),          // 0..1 of radius
        a: Math.random() * Math.PI * 2,
        s: 0.4 + Math.random() * 1.4,         // size px
        b: 0.35 + Math.random() * 0.65,       // brightness
        tw: Math.random() * Math.PI * 2,
      });
    }
  }

  buildNebula() {
    const s = Math.max(64, Math.round(this.size));
    const off = document.createElement('canvas');
    off.width = off.height = s;
    const c = off.getContext('2d');
    c.fillStyle = '#02040a';
    c.fillRect(0, 0, s, s);
    const spots = [[0.32, 0.4, 0.55], [0.68, 0.62, 0.45], [0.5, 0.25, 0.6]];
    this.palette.nebula.forEach((col, i) => {
      const [fx, fy, fr] = spots[i % spots.length];
      const g = c.createRadialGradient(fx * s, fy * s, 0, fx * s, fy * s, fr * s);
      g.addColorStop(0, col + 'cc');
      g.addColorStop(1, col + '00');
      c.fillStyle = g;
      c.fillRect(0, 0, s, s);
    });
    this.nebula = off;
  }

  tick(dtMs) {
    const dt = Math.min(dtMs, 100) / 1000;
    this.modeT += dt;
    const ctx = this.ctx, S = this.size, R = S / 2;
    if (!S) return;
    ctx.clearRect(0, 0, S, S);

    switch (this.mode) {
      case 'closed': this.drawClosed(ctx, R, dt); break;
      case 'ignite': {
        this.drawClosed(ctx, R, dt);
        const p = Math.min(1, this.modeT / 0.8);
        this.drawIgnition(ctx, R, p);
        if (p >= 1) this.setMode('open');
        break;
      }
      case 'open': this.drawOpen(ctx, R, dt, 1); break;
      case 'collapse': {
        const p = Math.min(1, this.modeT / 0.65);
        this.drawClosed(ctx, R, dt);
        ctx.save();
        ctx.translate(R, R);
        ctx.scale(1 - p, 1 - p);
        ctx.translate(-R, -R);
        this.drawOpen(ctx, R, dt, 1 - p);
        ctx.restore();
        // collapse flash ring
        ctx.strokeStyle = `rgba(240,250,255,${0.7 * Math.sin(p * Math.PI)})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(R, R, Math.max(1, R * (1 - p)), 0, Math.PI * 2);
        ctx.stroke();
        if (p >= 1) this.setMode('closed');
        break;
      }
    }
  }

  drawClosed(ctx, R, dt) {
    const t = performance.now() / 1000;
    ctx.fillStyle = '#030508';
    ctx.fillRect(0, 0, R * 2, R * 2);

    // vacuum speckle — ambient only
    for (const sp of this.speckles) {
      sp.a += sp.sp * dt * (this.reduced ? 0.3 : 1);
      const tw = 0.5 + 0.5 * Math.sin(t * 0.8 + sp.tw);
      const x = R + Math.cos(sp.a) * sp.r * R * 0.92;
      const y = R + Math.sin(sp.a) * sp.r * R * 0.92;
      ctx.fillStyle = `rgba(160,200,220,${0.04 + tw * 0.09})`;
      ctx.fillRect(x, y, 1.4, 1.4);
    }

    // rare ambient ripple in the glass (skipped under reduced motion)
    if (!this.reduced) {
      this.rippleAt -= dt;
      if (this.rippleAt <= 0 && this.rippleAge < 0) {
        this.rippleAge = 0;
        this.rippleAt = 9 + Math.random() * 9;
      }
      if (this.rippleAge >= 0) {
        this.rippleAge += dt;
        const p = this.rippleAge / 3;
        if (p >= 1) this.rippleAge = -1;
        else {
          ctx.strokeStyle = `rgba(150,190,210,${0.10 * (1 - p)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(R, R, p * R * 0.95, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }

    // solve strain: interference rings + waking center glow
    if (this.strain > 0.01) {
      const n = 5;
      for (let k = 0; k < n; k++) {
        const rr = ((t * 26 + k * (R / n)) % R) * 0.96;
        ctx.strokeStyle = `rgba(170,210,230,${this.strain * 0.13 * (1 - rr / R)})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(R, R, rr, 0, Math.PI * 2);
        ctx.stroke();
      }
      const g = ctx.createRadialGradient(R, R, 0, R, R, R * 0.5);
      g.addColorStop(0, `rgba(190,225,245,${this.strain * 0.16})`);
      g.addColorStop(1, 'rgba(190,225,245,0)');
      ctx.fillStyle = g;
      ctx.fillRect(R * 0.5, R * 0.5, R, R);
    }
  }

  /** the Null Bloom: a white geodesic grid flashes and folds inward */
  drawIgnition(ctx, R, p) {
    const alpha = Math.sin(p * Math.PI);
    const scale = 1.12 - p * 1.1;
    ctx.save();
    ctx.translate(R, R);
    ctx.scale(Math.max(scale, 0.02), Math.max(scale, 0.02));
    ctx.strokeStyle = `rgba(245,252,255,${alpha * 0.9})`;
    ctx.lineWidth = 1.4 / Math.max(scale, 0.1);
    for (let k = 1; k <= 5; k++) {
      ctx.beginPath();
      ctx.arc(0, 0, (k / 5) * R * 0.95, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (let s = 0; s < 12; s++) {
      const a = (s / 12) * Math.PI * 2 + p * 0.6;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * R * 0.95, Math.sin(a) * R * 0.95);
      ctx.stroke();
    }
    ctx.restore();
    // whiteout at the fold
    ctx.fillStyle = `rgba(235,248,255,${Math.max(0, alpha - 0.55) * 1.4})`;
    ctx.fillRect(0, 0, R * 2, R * 2);
  }

  drawOpen(ctx, R, dt, fade) {
    const t = performance.now() / 1000;
    const speed = this.reduced ? 0.15 : 1;
    this.rot += dt * 0.02 * speed;

    // destination sky (nebula), slowly rotating
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.translate(R, R);
    ctx.rotate(this.rot);
    ctx.drawImage(this.nebula, -R * 1.45, -R * 1.45, R * 2.9, R * 2.9);
    ctx.rotate(-this.rot);
    ctx.translate(-R, -R);

    // starfield with slow differential swirl + inward drift
    for (const st of this.stars) {
      st.a += dt * speed * 0.05 * (1.6 - st.r);
      st.r -= dt * speed * 0.004;
      if (st.r < 0.03) { st.r = 0.98; st.a = Math.random() * Math.PI * 2; }
      const rr = st.r * R * 0.94;
      const x = R + Math.cos(st.a) * rr;
      const y = R + Math.sin(st.a) * rr;
      const tw = this.reduced ? 1 : 0.7 + 0.3 * Math.sin(t * 2.2 + st.tw);
      // chromatic fringe near the rim: the lens disperses
      if (st.r > 0.74 && !this.reduced) {
        const fringe = (st.r - 0.74) * 6;
        const tx = -Math.sin(st.a), ty = Math.cos(st.a);
        ctx.fillStyle = `rgba(255,110,110,${0.35 * st.b * tw})`;
        ctx.fillRect(x + tx * fringe, y + ty * fringe, st.s, st.s);
        ctx.fillStyle = `rgba(120,150,255,${0.35 * st.b * tw})`;
        ctx.fillRect(x - tx * fringe, y - ty * fringe, st.s, st.s);
      }
      ctx.fillStyle = `rgba(235,245,255,${st.b * tw})`;
      ctx.fillRect(x, y, st.s, st.s);
    }

    // central glow — the far side is lit
    const g = ctx.createRadialGradient(R, R, 0, R, R, R * 0.75);
    g.addColorStop(0, this.hexA(this.palette.glow, 0.34));
    g.addColorStop(0.5, this.hexA(this.palette.glow, 0.08));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, R * 2, R * 2);

    // photon ring just inside the rim
    const flick = this.reduced ? 0.85 : 0.72 + 0.18 * Math.sin(t * 12.7) + 0.1 * Math.sin(t * 31.1);
    ctx.strokeStyle = `rgba(240,250,255,${0.55 * flick})`;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(R, R, R * 0.93, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = this.hexA(this.palette.glow, 0.35 * flick);
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(R, R, R * 0.955, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  hexA(hex, a) {
    const v = parseInt(hex.slice(1), 16);
    const r = (v >> 16) & 255, g = (v >> 8) & 255, b = v & 255;
    return `rgba(${r},${g},${b},${a})`;
  }
}
