// ============================================================
// glyphs.js — the Meridian sigil set.
// 36 original glyphs generated deterministically from a seed,
// each built from a small template family so the set reads as
// one coherent "written language" rather than random scribbles.
// ============================================================

export const GLYPH_COUNT = 36;

// Invented star-sigil names (purely fictional).
export const GLYPH_NAMES = [
  "Ashvar", "Belune", "Cindra", "Dorvet", "Elthis", "Feyra",
  "Golveth", "Hessin", "Ivorne", "Jeska", "Kaelet", "Lumeth",
  "Morvane", "Nyxel", "Ostrid", "Pelume", "Qirath", "Rendal",
  "Sorvyn", "Tessel", "Ulvane", "Vesrit", "Wyneth", "Xolara",
  "Ythren", "Zelvor", "Ankhal", "Brevos", "Corveth", "Drassa",
  "Eskene", "Fenwyr", "Ghorral", "Halvex", "Irridan", "Jorvun",
];

// Small deterministic PRNG (mulberry32).
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A glyph is a list of strokes in a [-1, 1] unit square.
//   { k:'line',   a:[x,y], b:[x,y] }
//   { k:'poly',   pts:[[x,y],...] }
//   { k:'circle', c:[x,y], r }
//   { k:'arc',    c:[x,y], r, a0, a1 }
//   { k:'dot',    c:[x,y], r }
function makeGlyph(rnd, template) {
  const s = [];
  const j = (m) => (rnd() * 2 - 1) * m; // jitter helper

  switch (template) {
    case 0: { // "orbital" — ring with a chord and satellite dot
      const r = 0.52 + rnd() * 0.14;
      const a = rnd() * Math.PI * 2;
      s.push({ k: "circle", c: [0, 0.06], r });
      s.push({ k: "line",
        a: [Math.cos(a) * r, 0.06 + Math.sin(a) * r],
        b: [Math.cos(a + Math.PI) * r, 0.06 + Math.sin(a + Math.PI) * r] });
      s.push({ k: "dot", c: [j(0.5), -0.78 + j(0.12)], r: 0.09 });
      break;
    }
    case 1: { // "spire" — vertical zigzag over a base bar
      const n = 3 + Math.floor(rnd() * 2);
      const pts = [];
      for (let i = 0; i <= n; i++) {
        pts.push([ (i % 2 === 0 ? -1 : 1) * (0.28 + rnd() * 0.18),
                   -0.85 + (1.55 * i) / n ]);
      }
      s.push({ k: "poly", pts });
      s.push({ k: "line", a: [-0.55 + j(0.1), 0.82], b: [0.55 + j(0.1), 0.82] });
      break;
    }
    case 2: { // "delta" — open triangle with interior mark
      const w = 0.6 + rnd() * 0.2;
      const top = [j(0.18), -0.8];
      s.push({ k: "poly", pts: [[-w, 0.68], top, [w, 0.68]] });
      if (rnd() < 0.5) s.push({ k: "dot", c: [0, 0.18 + j(0.15)], r: 0.1 });
      else s.push({ k: "line", a: [-w * 0.45, 0.3], b: [w * 0.45, 0.3] });
      break;
    }
    case 3: { // "tide" — two stacked arcs, opposite openings
      const r = 0.55 + rnd() * 0.15;
      s.push({ k: "arc", c: [0, -0.34], r: r * 0.72, a0: Math.PI, a1: Math.PI * 2 });
      s.push({ k: "arc", c: [0, 0.34], r, a0: 0, a1: Math.PI });
      s.push({ k: "dot", c: [j(0.2), 0.02], r: 0.08 });
      break;
    }
    case 4: { // "fork" — stem with radiating tines
      const ox = j(0.15), oy = 0.75;
      s.push({ k: "line", a: [ox, oy], b: [ox, -0.1] });
      const tines = 2 + Math.floor(rnd() * 2);
      for (let i = 0; i < tines; i++) {
        const a = -Math.PI / 2 + (i - (tines - 1) / 2) * (0.55 + rnd() * 0.2);
        s.push({ k: "line", a: [ox, -0.1],
          b: [ox + Math.cos(a) * 0.85, -0.1 + Math.sin(a) * 0.85] });
      }
      break;
    }
    default: { // "vault" — open box with a slash and corner dot
      const w = 0.6 + rnd() * 0.15, h = 0.55 + rnd() * 0.2;
      s.push({ k: "poly", pts: [[-w, -h], [-w, h], [w, h], [w, -h]] });
      s.push({ k: "line", a: [-w, -h], b: [w * (0.2 + rnd() * 0.6), h] });
      s.push({ k: "dot", c: [w * 0.55, -h - 0.18], r: 0.09 });
      break;
    }
  }
  return s;
}

export const GLYPHS = (() => {
  const out = [];
  for (let i = 0; i < GLYPH_COUNT; i++) {
    const rnd = mulberry32(0x5EED + i * 7919);
    out.push(makeGlyph(rnd, i % 6));
  }
  return out;
})();

// Draw glyph `idx` centred on (0,0) of the current transform,
// filling roughly a box of `size` x `size`.
export function drawGlyph(ctx, idx, size, color, glowBlur = 0) {
  const g = GLYPHS[idx];
  const u = size / 2.4; // unit scale, leaves breathing room
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(1.1, size * 0.075);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (glowBlur > 0) {
    ctx.shadowColor = color;
    ctx.shadowBlur = glowBlur;
  }
  for (const st of g) {
    ctx.beginPath();
    switch (st.k) {
      case "line":
        ctx.moveTo(st.a[0] * u, st.a[1] * u);
        ctx.lineTo(st.b[0] * u, st.b[1] * u);
        ctx.stroke();
        break;
      case "poly":
        ctx.moveTo(st.pts[0][0] * u, st.pts[0][1] * u);
        for (let i = 1; i < st.pts.length; i++)
          ctx.lineTo(st.pts[i][0] * u, st.pts[i][1] * u);
        ctx.stroke();
        break;
      case "circle":
        ctx.arc(st.c[0] * u, st.c[1] * u, st.r * u, 0, Math.PI * 2);
        ctx.stroke();
        break;
      case "arc":
        ctx.arc(st.c[0] * u, st.c[1] * u, st.r * u, st.a0, st.a1);
        ctx.stroke();
        break;
      case "dot":
        ctx.arc(st.c[0] * u, st.c[1] * u, st.r * u, 0, Math.PI * 2);
        ctx.fill();
        break;
    }
  }
  ctx.restore();
}

// Render a standalone mini-canvas for keypad / readout chips.
export function glyphCanvas(idx, px, color) {
  const c = document.createElement("canvas");
  c.width = c.height = px;
  const ctx = c.getContext("2d");
  ctx.translate(px / 2, px / 2);
  drawGlyph(ctx, idx, px * 0.92, color);
  return c;
}
