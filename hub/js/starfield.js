// ============================================================
// starfield.js — subtle animated starfield backdrop, kept dim so
// it never competes with the card grid in front of it.
// ============================================================

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
    const count = Math.floor((innerWidth * innerHeight) / 9000);
    this.stars = Array.from({ length: count }, () => ({
      x: Math.random() * innerWidth,
      y: Math.random() * innerHeight,
      r: Math.random() * 1.1 + 0.25,
      ph: Math.random() * Math.PI * 2,
      sp: 0.25 + Math.random() * 0.7,
    }));
  }

  render(t) {
    const { ctx, canvas, stars } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#cfe2f3";
    for (const s of stars) {
      const a = 0.12 + 0.22 * (0.5 + 0.5 * Math.sin(t * s.sp + s.ph));
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}
