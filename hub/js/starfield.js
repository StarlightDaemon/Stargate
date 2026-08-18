// ============================================================
// starfield.js — subtle animated starfield backdrop, kept dim so
// it never competes with the card grid in front of it.
// Points are a dim mix of the phosphor-amber live accent and
// neutral gray tones (was uniform blue-white), at roughly half the
// old density and brightness. The twinkle math and the rAF-driven
// render cadence are unchanged.
// ============================================================

const TONES = ["#a08a5f", "#8a7a5f", "#7d7a72", "#6f6d66"];

export class Starfield {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.stars = [];
    this._resize = this._resize.bind(this);
    this._resize();
    addEventListener("resize", this._resize);
  }

  _resize() {
    this.canvas.width = innerWidth;
    this.canvas.height = innerHeight;
    const count = Math.floor((innerWidth * innerHeight) / 16000);
    this.stars = Array.from({ length: count }, () => ({
      x: Math.random() * innerWidth,
      y: Math.random() * innerHeight,
      r: Math.random() * 1.1 + 0.25,
      ph: Math.random() * Math.PI * 2,
      sp: 0.25 + Math.random() * 0.7,
      c: TONES[Math.floor(Math.random() * TONES.length)],
    }));
  }

  render(t) {
    const { ctx, canvas, stars } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of stars) {
      const a = 0.06 + 0.12 * (0.5 + 0.5 * Math.sin(t * s.sp + s.ph));
      ctx.globalAlpha = a;
      ctx.fillStyle = s.c;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
