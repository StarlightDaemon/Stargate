/* ═══════════════════════════════════════════════════════════════════
   SIDEREUM · glyphs.js
   The twenty-one star-sigils of the Astrolith Order.

   Each sigil is a small constellation: star-points joined by graven
   lines, generated deterministically from a curated seed so every
   visitor sees the same sky. All sigils live in a 100×100 box.
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  // Frame scheduler: requestAnimationFrame raced against a timeout so
  // animations keep progressing (coarsely) in hidden/background tabs
  // instead of stalling mid-rite and desyncing from the audio clock.
  function frameTick(cb) {
    let done = false;
    const finish = t => { if (done) return; done = true; cb(t); };
    const id = requestAnimationFrame(t => { clearTimeout(to); finish(t); });
    const to = setTimeout(() => { cancelAnimationFrame(id); finish(performance.now()); }, 100);
  }

  window.SIDEREUM = window.SIDEREUM || {};
  window.SIDEREUM.frameTick = frameTick;

  // Deterministic PRNG (mulberry32) so sigils are stable across loads.
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Name, epithet, seed. Seeds were curated by eye so each constellation
  // reads distinctly at small sizes.
  const SIGIL_DEFS = [
    ["Auren",    "the First Light",      11],
    ["Vhaless",  "the Hidden Tide",      23],
    ["Corim",    "the Anchor Star",      37],
    ["Sethe",    "the Quiet Blade",      41],
    ["Ylune",    "the Pale Mirror",      53],
    ["Morvane",  "the Deep Road",        67],
    ["Ithra",    "the Burning Crown",    71],
    ["Peryl",    "the Wandering Eye",    83],
    ["Ondrel",   "the Broken Choir",     97],
    ["Thessa",   "the Gentle Warden",   101],
    ["Ulmareth", "the Sunken Throne",   113],
    ["Quenne",   "the Silver Thorn",    127],
    ["Sorval",   "the Ash Beacon",      139],
    ["Ashenne",  "the Veiled Sister",   149],
    ["Tirisse",  "the High Lantern",    157],
    ["Ombrast",  "the Long Shadow",     167],
    ["Ecliv",    "the Swallowed Sun",   179],
    ["Harrowen", "the Ninth Furrow",    191],
    ["Selverin", "the Sleeping River",  193],
    ["Duneth",   "the Last Doorpost",   199],
    ["Ophrane",  "the Unnamed Herald",  211],
  ];

  // Build one constellation: 4–6 star points spread in the box, a spine
  // joining them in sequence, sometimes one extra chord, plus one
  // "major" star drawn larger.
  function buildSigil(seed) {
    const rnd = mulberry32(seed);
    const count = 4 + Math.floor(rnd() * 3); // 4–6 stars
    const pts = [];
    let guard = 0;
    while (pts.length < count && guard < 400) {
      guard++;
      const p = { x: 14 + rnd() * 72, y: 14 + rnd() * 72 };
      if (pts.every(q => Math.hypot(q.x - p.x, q.y - p.y) > 24)) pts.push(p);
    }
    while (pts.length < count) {
      pts.push({ x: 14 + rnd() * 72, y: 14 + rnd() * 72 });
    }

    // Spine path through all stars.
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      d += ` L ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`;
    }
    // Occasional extra chord for variety.
    if (rnd() < 0.55 && pts.length >= 5) {
      const a = pts[0], b = pts[pts.length - 2];
      d += ` M ${a.x.toFixed(1)} ${a.y.toFixed(1)} L ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
    }

    const major = Math.floor(rnd() * pts.length);
    const stars = pts.map((p, i) => ({
      x: +p.x.toFixed(1),
      y: +p.y.toFixed(1),
      r: i === major ? 5.5 : 3,
    }));

    return { path: d, stars };
  }

  const SIGILS = SIGIL_DEFS.map(([name, epithet, seed], index) => {
    const art = buildSigil(seed);
    return { index, name, epithet, seed, path: art.path, stars: art.stars };
  });

  /**
   * Render sigil `i` as an SVG markup string (for HTML panels).
   * `size` is the rendered box in px.
   */
  function sigilMarkup(i, size, cls) {
    const s = SIGILS[i];
    const stars = s.stars
      .map(p => `<circle cx="${p.x}" cy="${p.y}" r="${p.r * 1.6}" fill="currentColor"/>`)
      .join("");
    return (
      `<svg class="${cls || "sigil-chip"}" width="${size}" height="${size}" viewBox="0 0 100 100" ` +
      `role="img" aria-label="Sigil of ${s.name}">` +
      `<path d="${s.path}" fill="none" stroke="currentColor" stroke-width="5" ` +
      `stroke-linecap="round" stroke-linejoin="round"/>` + stars + `</svg>`
    );
  }

  /**
   * Append sigil art (path + stars) into an existing SVG group element.
   * Coordinates stay in the 100×100 sigil box; callers scale the group.
   * Returns the created child elements.
   */
  function sigilInto(group, i, artClass, starClass) {
    const NS = "http://www.w3.org/2000/svg";
    const s = SIGILS[i];
    const path = document.createElementNS(NS, "path");
    path.setAttribute("d", s.path);
    path.setAttribute("class", artClass);
    group.appendChild(path);
    for (const p of s.stars) {
      const c = document.createElementNS(NS, "circle");
      c.setAttribute("cx", p.x);
      c.setAttribute("cy", p.y);
      c.setAttribute("r", p.r);
      c.setAttribute("class", starClass);
      group.appendChild(c);
    }
  }

  window.SIDEREUM = window.SIDEREUM || {};
  window.SIDEREUM.glyphs = { SIGILS, sigilMarkup, sigilInto };
})();
