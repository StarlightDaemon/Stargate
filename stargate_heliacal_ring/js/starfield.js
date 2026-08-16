/* Heliacal Ring — ambient starfield background with nebula wash,
   twinkling stars, mouse parallax and occasional meteors. */

window.HG = window.HG || {};

HG.starfield = (function () {
  "use strict";

  const canvas = document.getElementById("starfield");
  const cx2d = canvas.getContext("2d");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let W = 0, H = 0, dpr = 1;
  let stars = [];
  let nebula = null; // offscreen canvas
  let mouseX = 0.5, mouseY = 0.5;
  let meteor = null;
  let nextMeteorAt = 6 + Math.random() * 10;
  let elapsed = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    cx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }

  function seed() {
    const count = Math.floor((W * H) / 3800);
    stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        depth: 0.3 + Math.random() * 0.7,       // parallax factor
        size: Math.random() < 0.12 ? 1.7 : 1.0,
        base: 0.25 + Math.random() * 0.6,
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 1.4
      });
    }
    // nebula painted once at low alpha
    nebula = document.createElement("canvas");
    nebula.width = W; nebula.height = H;
    const n = nebula.getContext("2d");
    const blobs = [
      { x: 0.18, y: 0.3, r: 0.5, h: 200 },
      { x: 0.85, y: 0.7, r: 0.55, h: 260 },
      { x: 0.6, y: 0.12, r: 0.4, h: 180 }
    ];
    for (const b of blobs) {
      const g = n.createRadialGradient(b.x * W, b.y * H, 0, b.x * W, b.y * H, b.r * Math.min(W, H));
      g.addColorStop(0, `hsla(${b.h}, 70%, 30%, 0.10)`);
      g.addColorStop(1, "transparent");
      n.fillStyle = g;
      n.fillRect(0, 0, W, H);
    }
  }

  function tick(dt) {
    elapsed += dt;
    cx2d.clearRect(0, 0, W, H);
    if (nebula) cx2d.drawImage(nebula, 0, 0);

    const px = (mouseX - 0.5) * 14;
    const py = (mouseY - 0.5) * 10;

    cx2d.fillStyle = "#fff";
    for (const s of stars) {
      const tw = reduced ? 1 : 0.65 + 0.35 * Math.sin(s.phase + elapsed * s.speed);
      cx2d.globalAlpha = s.base * tw;
      cx2d.fillRect(s.x - px * s.depth, s.y - py * s.depth, s.size, s.size);
    }
    cx2d.globalAlpha = 1;

    if (!reduced) {
      if (!meteor && elapsed > nextMeteorAt) {
        const fromLeft = Math.random() < 0.5;
        meteor = {
          x: fromLeft ? -40 : W + 40,
          y: Math.random() * H * 0.45,
          vx: (fromLeft ? 1 : -1) * (420 + Math.random() * 260),
          vy: 140 + Math.random() * 90,
          life: 1.4
        };
        nextMeteorAt = elapsed + 9 + Math.random() * 16;
      }
      if (meteor) {
        meteor.x += meteor.vx * dt;
        meteor.y += meteor.vy * dt;
        meteor.life -= dt;
        const tail = 70;
        const nx = meteor.vx, ny = meteor.vy;
        const len = Math.hypot(nx, ny) || 1;
        const g = cx2d.createLinearGradient(
          meteor.x, meteor.y,
          meteor.x - (nx / len) * tail, meteor.y - (ny / len) * tail
        );
        g.addColorStop(0, "rgba(210,240,255,0.85)");
        g.addColorStop(1, "transparent");
        cx2d.strokeStyle = g;
        cx2d.lineWidth = 1.6;
        cx2d.beginPath();
        cx2d.moveTo(meteor.x, meteor.y);
        cx2d.lineTo(meteor.x - (nx / len) * tail, meteor.y - (ny / len) * tail);
        cx2d.stroke();
        if (meteor.life <= 0 || meteor.x < -80 || meteor.x > W + 80 || meteor.y > H + 80) {
          meteor = null;
        }
      }
    }
  }

  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", (e) => {
    mouseX = e.clientX / Math.max(1, W);
    mouseY = e.clientY / Math.max(1, H);
  });

  resize();

  return { tick };
})();
