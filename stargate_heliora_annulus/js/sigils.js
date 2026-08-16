/* ============================================================
   sigils.js — the thirty heliographic sigils of the Annulus.

   Every sigil is generated deterministically from its index, so
   the whole script ships as code, not artwork. The generator is
   constrained (mirror symmetry, arcs + rays + eclipse dots,
   uniform stroke) so the set reads as one written language.
   ============================================================ */

export const SIGIL_COUNT = 30;

// Constructed syllabary. Index 0 is Solyn, the Standing Sun — the
// origin sigil every cant must close with.
export const SIGIL_NAMES = [
  "Solyn",  "Aurel",  "Veska",  "Tharis", "Nyrra",  "Selheim",
  "Ombra",  "Kirel",  "Duthan", "Maro",   "Ilex",   "Corval",
  "Ephra",  "Lunneth","Osk",    "Ravian", "Sindra", "Tessek",
  "Uldan",  "Vhalis", "Wyrra",  "Xanthe", "Ymir",   "Zerath",
  "Belloc", "Cindra", "Ferun",  "Ghal",   "Hessia", "Iona",
];

// --- deterministic PRNG (mulberry32) ---
function prng(seed) {
  let a = (seed * 2654435761) >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rad = (deg) => (deg * Math.PI) / 180;
const px = (r, deg) => (r * Math.sin(rad(deg))).toFixed(2);
const py = (r, deg) => (-r * Math.cos(rad(deg))).toFixed(2);

// Arc of `span` degrees centred on `deg` at radius r (angles measured
// clockwise from straight up).
function arcPath(r, deg, span) {
  const a0 = deg - span / 2;
  const a1 = deg + span / 2;
  const large = span > 180 ? 1 : 0;
  return `M ${px(r, a0)} ${py(r, a0)} A ${r} ${r} 0 ${large} 1 ${px(r, a1)} ${py(r, a1)}`;
}

function ray(r0, r1, deg) {
  return `M ${px(r0, deg)} ${py(r0, deg)} L ${px(r1, deg)} ${py(r1, deg)}`;
}

/* Build the inner markup of one sigil. Coordinate space: -50..50,
   stroke drawn in currentColor. Returns a string of SVG elements. */
function buildSigil(index) {
  // Sigil 0, Solyn: hand-set. A standing sun — ring, core, and a
  // grounded ray. Everything else is generated.
  if (index === 0) {
    return (
      `<circle r="24" class="s-line"/>` +
      `<circle r="7" class="s-fill"/>` +
      `<path d="M 0 24 L 0 44" class="s-line"/>` +
      `<path d="${arcPath(38, 0, 130)}" class="s-line"/>`
    );
  }

  const rnd = prng(index + 7);
  const parts = [];

  // 1. Outer arc work: one to two mirrored arc pairs near the rim.
  const arcPairs = 1 + Math.floor(rnd() * 2);
  for (let i = 0; i < arcPairs; i++) {
    const r = 30 + rnd() * 12;                 // 30..42
    const centre = 25 + rnd() * 95;            // 25..120 deg from top
    const span = 28 + rnd() * 55;              // 28..83 deg
    parts.push(`<path d="${arcPath(r, centre, span)}" class="s-line"/>`);
    parts.push(`<path d="${arcPath(r, -centre, span)}" class="s-line"/>`);
  }

  // 2. A crown or keel arc on the axis, sometimes.
  if (rnd() < 0.6) {
    const r = 30 + rnd() * 12;
    const at = rnd() < 0.5 ? 0 : 180;
    parts.push(`<path d="${arcPath(r, at, 40 + rnd() * 50)}" class="s-line"/>`);
  }

  // 3. Rays: mirrored radial strokes, occasionally one on the axis.
  const rayPairs = 1 + Math.floor(rnd() * 2);
  for (let i = 0; i < rayPairs; i++) {
    const a = 20 + rnd() * 115;
    const r0 = 8 + rnd() * 10;
    const r1 = r0 + 14 + rnd() * 18;
    parts.push(`<path d="${ray(r0, r1, a)}" class="s-line"/>`);
    parts.push(`<path d="${ray(r0, r1, -a)}" class="s-line"/>`);
  }
  if (rnd() < 0.55) {
    const up = rnd() < 0.5;
    const r0 = 10 + rnd() * 8, r1 = r0 + 16 + rnd() * 16;
    parts.push(`<path d="${ray(r0, r1, up ? 0 : 180)}" class="s-line"/>`);
  }

  // 4. Core motif: a full disc, an open ring, or an eclipse (ring
  //    with an offset occluding dot).
  const core = rnd();
  if (core < 0.36) {
    parts.push(`<circle r="${(4 + rnd() * 4).toFixed(1)}" class="s-fill"/>`);
  } else if (core < 0.72) {
    parts.push(`<circle r="${(6 + rnd() * 6).toFixed(1)}" class="s-line"/>`);
  } else {
    const r = 7 + rnd() * 5;
    parts.push(`<circle r="${r.toFixed(1)}" class="s-line"/>`);
    parts.push(`<circle cy="${(-r / 2).toFixed(1)}" r="${(r / 2.6).toFixed(1)}" class="s-fill"/>`);
  }

  // 5. Satellite dots, mirrored.
  if (rnd() < 0.65) {
    const a = 25 + rnd() * 110;
    const r = 20 + rnd() * 18;
    const dr = (1.8 + rnd() * 1.6).toFixed(1);
    parts.push(`<circle cx="${px(r, a)}" cy="${py(r, a)}" r="${dr}" class="s-fill"/>`);
    parts.push(`<circle cx="${px(r, -a)}" cy="${py(r, -a)}" r="${dr}" class="s-fill"/>`);
  }

  return parts.join("");
}

const cache = new Map();

/* Inner SVG markup for sigil `index`, in a -50..50 coordinate box. */
export function sigilMarkup(index) {
  if (!cache.has(index)) cache.set(index, buildSigil(index));
  return cache.get(index);
}

/* A self-contained <svg> element string for use in HTML (sockets,
   codex). `size` in px. */
export function sigilSvg(index, size) {
  return (
    `<svg viewBox="-50 -50 100 100" width="${size}" height="${size}" ` +
    `style="display:block" aria-hidden="true">` +
    `<g fill="none" stroke="currentColor" stroke-width="6" ` +
    `stroke-linecap="round">${sigilMarkup(index)
      .replaceAll('class="s-line"', 'fill="none"')
      .replaceAll('class="s-fill"', 'fill="currentColor" stroke="none"')}` +
    `</g></svg>`
  );
}
