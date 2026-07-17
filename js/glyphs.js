/* ============================================================
   AETHERGATE — sigil generator
   36 original glyphs, procedurally generated from fixed seeds
   so they are identical on every visit. Each sigil is a small
   constellation of strokes inside a 100x100 box.
   ============================================================ */
(function () {
  "use strict";
  window.AG = window.AG || {};

  /* deterministic PRNG (mulberry32) */
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const SYLLABLES = [
    "ka", "vel", "sho", "rin", "tha", "os", "mir", "dun",
    "ael", "kor", "ny", "sett", "ura", "bel", "quo", "zan",
    "ith", "mar", "ess", "tor", "hal", "vey", "un", "ciir"
  ];

  function makeName(rng) {
    const pick = () => SYLLABLES[Math.floor(rng() * SYLLABLES.length)];
    let n = pick() + pick();
    if (rng() < 0.3) n = pick() + "'" + pick();
    else if (rng() < 0.35) n += pick();
    return n.charAt(0).toUpperCase() + n.slice(1);
  }

  /* Build one glyph: 3-5 anchor points on snapped angles, joined by
     lines/quadratics, plus optional chord and dots. */
  function makeGlyph(rng) {
    const count = 3 + Math.floor(rng() * 3);
    const slots = [];
    while (slots.length < count) {
      const s = Math.floor(rng() * 24);            // 15-degree snap
      if (!slots.includes(s)) slots.push(s);
    }
    const pts = slots.map(s => {
      const ang = (s * 15) * Math.PI / 180;
      const rad = 16 + rng() * 20;
      return {
        x: +(50 + Math.cos(ang) * rad).toFixed(1),
        y: +(50 + Math.sin(ang) * rad).toFixed(1)
      };
    });

    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i], q = pts[i - 1];
      if (rng() < 0.45) {
        // bow the segment toward or away from the glyph center
        const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
        const k = (rng() < 0.5 ? 0.55 : 1.5);
        const cx = +(50 + (mx - 50) * k).toFixed(1);
        const cy = +(50 + (my - 50) * k).toFixed(1);
        d += ` Q ${cx} ${cy} ${p.x} ${p.y}`;
      } else {
        d += ` L ${p.x} ${p.y}`;
      }
    }
    if (rng() < 0.4) d += " Z";

    // optional crossing chord between two non-adjacent points
    if (pts.length >= 4 && rng() < 0.55) {
      const a = pts[0], b = pts[2];
      d += ` M ${a.x} ${a.y} L ${b.x} ${b.y}`;
    }

    const dots = [];
    const nDots = rng() < 0.7 ? 1 : 2;
    for (let i = 0; i < nDots; i++) {
      if (rng() < 0.4) {
        dots.push({ x: 50, y: 50, r: 3.4 });
      } else {
        const p = pts[Math.floor(rng() * pts.length)];
        const dx = (50 - p.x), dy = (50 - p.y);
        const len = Math.hypot(dx, dy) || 1;
        dots.push({
          x: +(p.x - (dx / len) * 8).toFixed(1),
          y: +(p.y - (dy / len) * 8).toFixed(1),
          r: 3
        });
      }
    }
    return { d, dots };
  }

  AG.makeSigils = function (count) {
    count = count || 36;
    const sigils = [];
    const usedNames = new Set();
    for (let i = 0; i < count; i++) {
      const rng = mulberry32(0x9e3779b9 ^ (i * 7919 + 101));
      const g = makeGlyph(rng);
      let name = makeName(rng);
      while (usedNames.has(name)) name += SYLLABLES[Math.floor(rng() * SYLLABLES.length)];
      usedNames.add(name);
      sigils.push({ index: i, d: g.d, dots: g.dots, name });
    }
    return sigils;
  };

  /* Inline SVG markup for one sigil (pad keys, address slots). */
  AG.sigilSVG = function (sigil) {
    const dots = sigil.dots
      .map(p => `<circle cx="${p.x}" cy="${p.y}" r="${p.r}"/>`)
      .join("");
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="${sigil.d}"/>${dots}</svg>`;
  };

  AG.mulberry32 = mulberry32;

  /* Animation scheduler: requestAnimationFrame while the page is
     visible, a ~30fps setTimeout fallback while it is hidden so the
     dialing sequence and portal envelope keep advancing when the
     tab is backgrounded. */
  AG.raf = function (cb) {
    if (document.hidden) {
      setTimeout(() => cb(performance.now()), 33);
    } else {
      requestAnimationFrame(cb);
    }
  };
})();
