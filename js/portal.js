/* ═══════════════════════════════════════════════════════════════════
   portal.js — the open way, painted on canvas.
   Not a grand event horizon: this is moon-milk in a rain barrel.
   Verdigris and tallow light, ripples, drifting motes, and — when
   the way was bought with a moth-taper — a nervous flicker.
   ═══════════════════════════════════════════════════════════════════ */

class PortalFX {
  constructor(canvas) {
    this.cv = canvas;
    this.ctx = canvas.getContext("2d");
    this.state = "closed";       // closed | opening | open | closing | fizzle | dread
    this.progress = 0;           // 0..1 for opening/closing
    this.unstable = false;       // moth-lit
    this.t = 0;
    this.motes = [];
    this.ripples = [];
    this.flicker = 1;
    this.candleAngles = [];
    this._last = performance.now();
    this._raf = null;
    this._loop = this._loop.bind(this);
  }

  begin() { if (!this._raf) { this._last = performance.now(); this._raf = requestAnimationFrame(this._loop); } }

  setState(s, opts = {}) {
    this.state = s;
    if (s === "opening") {
      this.progress = 0;
      this.unstable = !!opts.unstable;
      this.motes = [];
      for (let i = 0; i < 70; i++) this.motes.push(this._newMote(true));
      this.ripples = [];
    }
    if (s === "closing" || s === "fizzle") this.progress = 1;
    if (s === "dread") { this.progress = Math.max(this.progress, 0.55); }
    this.begin();
  }

  splash() {
    this.ripples.push({ r: 0.05, a: 0.5 });
  }

  _newMote(anywhere) {
    const ang = Math.random() * Math.PI * 2;
    return {
      a: ang,
      r: anywhere ? Math.random() : 0.1 + Math.random() * 0.2,
      spd: 0.02 + Math.random() * 0.06,
      drift: (Math.random() - 0.5) * 0.4,
      size: 0.6 + Math.random() * 1.8,
      tw: Math.random() * Math.PI * 2,
    };
  }

  _loop(now) {
    const dt = Math.min((now - this._last) / 1000, 0.05);
    this._last = now;
    this.t += dt;

    const s = this.state;
    if (s === "opening") {
      this.progress = Math.min(1, this.progress + dt / 1.8);
      if (this.progress >= 1) this.state = "open";
    } else if (s === "closing") {
      this.progress = Math.max(0, this.progress - dt / 1.4);
      if (this.progress <= 0) this.state = "closed";
    } else if (s === "fizzle") {
      this.progress = Math.max(0, this.progress - dt / 0.7);
      if (this.progress <= 0) this.state = "closed";
    } else if (s === "dread") {
      this.progress = Math.max(0, this.progress - dt / 0.25);
      if (this.progress <= 0) this.state = "closed";
    }

    /* flicker: steady breathing normally; nervous when moth-lit */
    const base = 0.92 + 0.08 * Math.sin(this.t * 1.7);
    if (this.unstable) {
      const jitter = Math.sin(this.t * 23) * Math.sin(this.t * 7.3);
      this.flicker = base * (0.82 + 0.18 * Math.abs(jitter));
      if (Math.random() < dt * 1.2) this.flicker *= 0.55; // gutter blink
    } else {
      this.flicker = base;
    }

    this._draw();

    if (this.state === "closed" && this.ripples.length === 0) {
      this.ctx.clearRect(0, 0, this.cv.width, this.cv.height);
      this._raf = null;
      return;
    }
    this._raf = requestAnimationFrame(this._loop);
  }

  _draw() {
    const ctx = this.ctx;
    const W = this.cv.width, H = this.cv.height;
    const cx = W / 2, cy = H / 2;
    const R = W * 0.5;
    const p = this.progress;
    const ease = p * p * (3 - 2 * p);
    const rad = R * ease;

    ctx.clearRect(0, 0, W, H);
    if (rad < 1) return;

    ctx.save();
    ctx.beginPath();
    /* slightly wobbly rim — nothing Wren makes is a true circle */
    const wob = 4 + (this.unstable ? 5 : 0);
    ctx.moveTo(cx + rad, cy);
    for (let a = 0; a <= Math.PI * 2 + 0.01; a += Math.PI / 48) {
      const w = Math.sin(a * 5 + this.t * 1.3) * wob * ease + Math.sin(a * 9 - this.t * 0.8) * wob * 0.5 * ease;
      ctx.lineTo(cx + Math.cos(a) * (rad + w), cy + Math.sin(a) * (rad + w));
    }
    ctx.closePath();
    ctx.clip();

    const f = this.flicker;

    /* ── base pool: deep fen-water green-black ── */
    const g0 = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
    if (this.unstable) {
      g0.addColorStop(0, `rgba(64, 88, 52, ${0.95 * f})`);
      g0.addColorStop(0.55, `rgba(38, 58, 40, ${0.97 * f})`);
      g0.addColorStop(1, `rgba(16, 26, 20, 1)`);
    } else {
      g0.addColorStop(0, `rgba(58, 96, 88, ${0.95 * f})`);
      g0.addColorStop(0.55, `rgba(32, 62, 60, ${0.97 * f})`);
      g0.addColorStop(1, `rgba(12, 24, 26, 1)`);
    }
    ctx.fillStyle = g0;
    ctx.fillRect(0, 0, W, H);

    /* ── concentric ripple bands, breathing ── */
    ctx.lineWidth = 2;
    const bands = 9;
    for (let i = 1; i <= bands; i++) {
      const rr = (i / bands) * rad;
      const breathe = Math.sin(this.t * (0.7 + i * 0.13) + i * 1.7) * rad * 0.02;
      const alpha = 0.05 + 0.05 * Math.sin(this.t * 1.1 + i) ;
      ctx.beginPath();
      for (let a = 0; a <= Math.PI * 2 + 0.01; a += Math.PI / 36) {
        const w = Math.sin(a * 3 + this.t * 0.9 + i) * rad * 0.015;
        const x = cx + Math.cos(a) * (rr + breathe + w);
        const y = cy + Math.sin(a) * (rr + breathe + w) * 0.98;
        a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = this.unstable
        ? `rgba(210, 200, 120, ${alpha * f})`
        : `rgba(170, 230, 215, ${alpha * f})`;
      ctx.stroke();
    }

    /* ── event splashes (priming water, moth landings) ── */
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const rp = this.ripples[i];
      rp.r += 0.02; rp.a -= 0.012;
      if (rp.a <= 0) { this.ripples.splice(i, 1); continue; }
      ctx.beginPath();
      ctx.arc(cx, cy, rp.r * rad, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(230, 245, 235, ${rp.a * f})`;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    /* ── slow sheen: two soft rotating light patches ── */
    for (let k = 0; k < 2; k++) {
      const ang = this.t * (k ? -0.17 : 0.11) + k * 2.4;
      const px = cx + Math.cos(ang) * rad * 0.4;
      const py = cy + Math.sin(ang) * rad * 0.4;
      const gs = ctx.createRadialGradient(px, py, 0, px, py, rad * 0.55);
      const c = this.unstable ? "224, 210, 140" : "190, 240, 225";
      gs.addColorStop(0, `rgba(${c}, ${0.10 * f})`);
      gs.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gs;
      ctx.fillRect(0, 0, W, H);
    }

    /* ── candle reflections shimmering on the surface ── */
    for (const a of this.candleAngles) {
      const px = cx + Math.cos(a) * rad * 0.8;
      const py = cy + Math.sin(a) * rad * 0.8;
      const shimmer = 0.5 + 0.5 * Math.sin(this.t * 5 + a * 13);
      const gr = ctx.createRadialGradient(px, py, 0, px, py, rad * 0.13);
      gr.addColorStop(0, `rgba(255, 214, 140, ${0.12 * shimmer * f})`);
      gr.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, W, H);
    }

    /* ── drifting motes: fen-dust caught in the light ── */
    ctx.fillStyle = "#fff";
    for (const m of this.motes) {
      m.a += m.drift * 0.016;
      m.r += m.spd * 0.016 * (this.unstable ? 2.2 : 1);
      m.tw += 0.1;
      if (m.r > 1) { Object.assign(m, this._newMote(false)); }
      const mx = cx + Math.cos(m.a) * m.r * rad;
      const my = cy + Math.sin(m.a) * m.r * rad;
      const tw = 0.35 + 0.65 * Math.abs(Math.sin(m.tw));
      ctx.globalAlpha = tw * 0.5 * f * ease;
      ctx.beginPath();
      ctx.arc(mx, my, m.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    /* ── dread tint for the crossed-out road ── */
    if (this.state === "dread") {
      const gd = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
      gd.addColorStop(0, "rgba(30, 8, 8, 0.55)");
      gd.addColorStop(1, "rgba(5, 0, 0, 0.85)");
      ctx.fillStyle = gd;
      ctx.fillRect(0, 0, W, H);
    }

    /* ── rim: chalk-and-wax edge light ── */
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.strokeStyle = this.unstable
      ? `rgba(235, 214, 150, ${0.5 * f * ease})`
      : `rgba(214, 240, 230, ${0.5 * f * ease})`;
    ctx.lineWidth = 3;
    ctx.setLineDash([9, 6, 3, 7]); /* chalk line, broken where the thumb smudged it */
    ctx.lineDashOffset = this.t * 4;
    ctx.stroke();
    ctx.restore();
  }
}
