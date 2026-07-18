/* Heliacal Ring — procedural glyph generator.
   Each of the 38 glyphs is a small constellation-like sigil built from a
   seeded PRNG, so the set is original, deterministic, and consistent
   everywhere it is drawn (ring, keypad, register slots). */

window.HG = window.HG || {};

HG.glyphs = (function () {
  "use strict";

  const SVG_NS = "http://www.w3.org/2000/svg";
  const BOX = 100; // local design box for every glyph

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Build the stroke recipe for glyph `index`: a handful of nodes placed on
  // a loose polar lattice, a connecting spine, and one or two accents.
  function buildRecipe(index) {
    const rnd = mulberry32(index * 7349 + 1013);
    const cx = BOX / 2, cy = BOX / 2;

    const nodeCount = 4 + Math.floor(rnd() * 3); // 4..6
    const nodes = [];
    for (let i = 0; i < nodeCount; i++) {
      const ang = (i / nodeCount) * Math.PI * 2 + rnd() * 1.1 - 0.55;
      const rad = 14 + rnd() * 30;
      nodes.push({
        x: cx + Math.cos(ang) * rad,
        y: cy + Math.sin(ang) * rad
      });
    }

    // spine: visit every node once in a shuffled order
    const order = nodes.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    const spine = order.map(i => nodes[i]);

    // one extra chord for visual density
    const chords = [];
    if (nodeCount >= 5 && rnd() < 0.8) {
      const a = Math.floor(rnd() * nodeCount);
      let b = Math.floor(rnd() * nodeCount);
      if (b === a) b = (b + 2) % nodeCount;
      chords.push([nodes[a], nodes[b]]);
    }

    // dot accents on 1–2 nodes
    const dots = [];
    const dotCount = 1 + Math.floor(rnd() * 2);
    for (let i = 0; i < dotCount; i++) {
      dots.push(spine[Math.floor(rnd() * spine.length)]);
    }

    // occasional open arc around the centre
    let arc = null;
    if (rnd() < 0.45) {
      const start = rnd() * Math.PI * 2;
      const sweep = 1.1 + rnd() * 1.6;
      arc = { r: 34 + rnd() * 9, start, end: start + sweep };
    }

    return { spine, chords, dots, arc };
  }

  const recipes = [];
  function recipe(index) {
    if (!recipes[index]) recipes[index] = buildRecipe(index);
    return recipes[index];
  }

  function polyPath(points) {
    return points
      .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(" ");
  }

  function arcPath(a) {
    const cx = BOX / 2, cy = BOX / 2;
    const x1 = cx + Math.cos(a.start) * a.r, y1 = cy + Math.sin(a.start) * a.r;
    const x2 = cx + Math.cos(a.end) * a.r,   y2 = cy + Math.sin(a.end) * a.r;
    const large = a.end - a.start > Math.PI ? 1 : 0;
    return `M${x1.toFixed(1)},${y1.toFixed(1)} A${a.r},${a.r} 0 ${large} 1 ${x2.toFixed(1)},${y2.toFixed(1)}`;
  }

  /* Populate an existing <g> (or <svg>) element with glyph strokes drawn in
     the 100×100 local box. strokeWidth is in local units. */
  function drawInto(el, index, strokeWidth) {
    const r = recipe(index);
    const sw = strokeWidth || 7;

    function path(d, w) {
      const p = document.createElementNS(SVG_NS, "path");
      p.setAttribute("d", d);
      p.setAttribute("fill", "none");
      p.setAttribute("stroke", "currentColor");
      p.setAttribute("stroke-width", w);
      p.setAttribute("stroke-linecap", "round");
      p.setAttribute("stroke-linejoin", "round");
      el.appendChild(p);
    }

    path(polyPath(r.spine), sw);
    for (const [a, b] of r.chords) path(polyPath([a, b]), sw * 0.75);
    if (r.arc) path(arcPath(r.arc), sw * 0.6);
    for (const d of r.dots) {
      const c = document.createElementNS(SVG_NS, "circle");
      c.setAttribute("cx", d.x.toFixed(1));
      c.setAttribute("cy", d.y.toFixed(1));
      c.setAttribute("r", sw * 0.9);
      c.setAttribute("fill", "currentColor");
      el.appendChild(c);
    }
  }

  /* Standalone <svg> element for keypad buttons and register slots. */
  function makeSVG(index, strokeWidth) {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", `0 0 ${BOX} ${BOX}`);
    svg.setAttribute("aria-hidden", "true");
    drawInto(svg, index, strokeWidth || 9);
    return svg;
  }

  return { drawInto, makeSVG, BOX };
})();
