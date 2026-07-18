/* ============================================================
   AETHERGATE — starfield backdrop
   Slow-drifting, twinkling stars plus the odd meteor streak.
   ============================================================ */
(function () {
  "use strict";
  window.AG = window.AG || {};

  AG.startStarfield = function (canvas) {
    const ctx = canvas.getContext("2d");
    let stars = [];
    let meteor = null;
    let nextMeteorAt = performance.now() + 6000;
    let w = 0, h = 0, dpr = 1;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round((w * h) / 3800);
      stars = [];
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 0.4 + Math.random() * 1.3,
          base: 0.25 + Math.random() * 0.55,
          amp: Math.random() * 0.35,
          spd: 0.4 + Math.random() * 1.6,
          ph: Math.random() * Math.PI * 2,
          hue: Math.random() < 0.12 ? 30 : 200 + Math.random() * 25
        });
      }
    }

    function frame(now) {
      requestAnimationFrame(frame);
      if (document.hidden) return;
      const t = now / 1000;
      ctx.clearRect(0, 0, w, h);

      for (const s of stars) {
        s.x -= 0.006 * s.r;
        if (s.x < -2) s.x = w + 2;
        const a = s.base + Math.sin(t * s.spd + s.ph) * s.amp;
        ctx.globalAlpha = Math.max(0.05, a);
        ctx.fillStyle = `hsl(${s.hue}, 70%, 82%)`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (!meteor && now > nextMeteorAt) {
        meteor = {
          x: Math.random() * w * 0.8 + w * 0.1,
          y: Math.random() * h * 0.3,
          vx: 6 + Math.random() * 5,
          vy: 2.5 + Math.random() * 2,
          life: 1
        };
        nextMeteorAt = now + 9000 + Math.random() * 16000;
      }
      if (meteor) {
        meteor.x += meteor.vx;
        meteor.y += meteor.vy;
        meteor.life -= 0.022;
        if (meteor.life <= 0 || meteor.x > w + 60) { meteor = null; }
        else {
          const g = ctx.createLinearGradient(
            meteor.x, meteor.y,
            meteor.x - meteor.vx * 9, meteor.y - meteor.vy * 9);
          g.addColorStop(0, `rgba(210, 240, 255, ${0.8 * meteor.life})`);
          g.addColorStop(1, "rgba(210, 240, 255, 0)");
          ctx.strokeStyle = g;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(meteor.x, meteor.y);
          ctx.lineTo(meteor.x - meteor.vx * 9, meteor.y - meteor.vy * 9);
          ctx.stroke();
        }
      }
    }

    window.addEventListener("resize", resize);
    resize();
    requestAnimationFrame(frame);
  };
})();
