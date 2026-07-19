// The Meridian glyph alphabet: 36 "manifold class marks".
// Every glyph is generated deterministically from a fixed seed, so the
// alphabet is stable across sessions — original vector marks, six
// structural families with seeded variation. Glyph 35 is reserved as the
// ERIDU invariant (the Artifact's local anchor, always the 9th slot).

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SYL = ['KA', 'VEH', 'OM', 'SUL', 'THE', 'RIN', 'AX', 'OL', 'MIR',
  'DA', 'XEN', 'UR', 'PHI', 'NOC', 'TAL', 'EM', 'ZOR', 'ISH', 'QUE', 'AN'];

const R = (n) => Math.round(n * 100) / 100;

// small circle as a closed two-arc subpath (stroke-only node)
function nodeAt(x, y, r) {
  return `M${R(x - r)} ${R(y)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
}

function pt(angle, radius) {
  return [R(Math.cos(angle) * radius), R(Math.sin(angle) * radius)];
}

// Each family returns a path string inside a -12..12 box.
const FAMILIES = [
  // 0 orbital: ring + chord + satellite node
  (rnd) => {
    const rr = 5 + rnd() * 2.5;
    const a = rnd() * Math.PI * 2;
    const [x1, y1] = pt(a, rr), [x2, y2] = pt(a + Math.PI * (0.7 + rnd() * 0.5), rr);
    const [nx, ny] = pt(a + Math.PI * 1.5, rr + 3.2);
    return nodeAt(0, 0, rr) + `M${x1} ${y1}L${x2} ${y2}` + nodeAt(nx, ny, 1.6);
  },
  // 1 braid: two crossing arcs
  (rnd) => {
    const s = 5.5 + rnd() * 3, b = 4 + rnd() * 6;
    const flip = rnd() > 0.5 ? -1 : 1;
    return `M${-s} ${-s}Q${R(b * flip)} 0 ${-s} ${s}` +
           `M${s} ${-s}Q${R(-b * flip)} 0 ${s} ${s}` +
           (rnd() > 0.45 ? nodeAt(0, 0, 1.4) : `M${-s} 0H${R(-s + 3)}`);
  },
  // 2 delta: open triangle with one arced side + interior tick
  (rnd) => {
    const rot = rnd() * Math.PI * 2, rr = 7 + rnd() * 2;
    const p = [0, 1, 2].map(i => pt(rot + i * Math.PI * 2 / 3, rr));
    const bow = 3 + rnd() * 4;
    return `M${p[0][0]} ${p[0][1]}L${p[1][0]} ${p[1][1]}` +
           `Q${R((p[1][0] + p[2][0]) / 2 * (1 + bow / rr))} ${R((p[1][1] + p[2][1]) / 2 * (1 + bow / rr))} ${p[2][0]} ${p[2][1]}` +
           (rnd() > 0.4 ? `M0 0L${R(p[0][0] * 0.55)} ${R(p[0][1] * 0.55)}` : nodeAt(0, 0, 1.3));
  },
  // 3 sigma-fold: zigzag + grounding arc
  (rnd) => {
    const w = 6 + rnd() * 3, h = 3.5 + rnd() * 3;
    const dir = rnd() > 0.5 ? 1 : -1;
    return `M${-w} ${-h * dir}L${R(-w / 3)} ${h * dir}L${R(w / 3)} ${-h * dir}L${w} ${h * dir}` +
           `M${-w + 1} ${R(h + 3.5)}Q0 ${R(h + (rnd() > 0.5 ? 7 : 1))} ${w - 1} ${R(h + 3.5)}`;
  },
  // 4 bisect: axis line + two opposed half-arcs
  (rnd) => {
    const l = 7 + rnd() * 3, rr = 3.5 + rnd() * 2.5;
    const o = R(rnd() * 3 - 1.5);
    return `M0 ${-l}V${l}` +
           `M0 ${R(o - rr)}a${rr} ${rr} 0 0 0 0 ${2 * rr}` +
           `M0 ${R(o - rr)}a${rr} ${rr} 0 0 1 0 ${2 * rr}`.slice(0, rnd() > 0.35 ? undefined : 0) +
           (rnd() > 0.5 ? `M${-l * 0.6} ${-l}H${l * 0.6}` : nodeAt(0, l, 1.5));
  },
  // 5 lattice: node cluster with connective route
  (rnd) => {
    const g = 4.5 + rnd() * 2;
    const nodes = [[-g, -g], [g, -g], [g, g], [-g, g]];
    const skip = Math.floor(rnd() * 4);
    let d = '';
    nodes.forEach((n, i) => { if (i !== skip) d += nodeAt(n[0], n[1], 1.5); });
    const a = nodes[(skip + 1) % 4], b = nodes[(skip + 3) % 4];
    d += `M${a[0]} ${a[1]}L0 0L${b[0]} ${b[1]}`;
    if (rnd() > 0.5) d += `M0 0L${R(nodes[skip][0] * 0.5)} ${R(nodes[skip][1] * 0.5)}`;
    return d;
  },
];

function buildAlphabet() {
  const rnd = mulberry32(0x4D45524); // 'MER'
  const used = new Set();
  const glyphs = [];
  for (let i = 0; i < 36; i++) {
    const fam = i % FAMILIES.length;
    const path = FAMILIES[fam](rnd);
    let name;
    do {
      name = SYL[Math.floor(rnd() * SYL.length)] + SYL[Math.floor(rnd() * SYL.length)].toLowerCase();
      if (rnd() > 0.72) name += '-' + SYL[Math.floor(rnd() * SYL.length)].toLowerCase();
    } while (used.has(name));
    used.add(name);
    glyphs.push({ index: i, name, path, family: fam });
  }
  // Reserve 35 as the ERIDU invariant: a distinct concentric mark.
  glyphs[35] = {
    index: 35, name: 'ERIDU', family: -1,
    path: nodeAt(0, 0, 8) + nodeAt(0, 0, 3.4) + 'M0 -11.5V-8M0 8V11.5',
  };
  return glyphs;
}

export const GLYPHS = buildAlphabet();
export const ERIDU = 35;

/** Inline SVG markup for one glyph (palette buttons, slots, catalog previews). */
export function glyphSvg(index) {
  return `<svg viewBox="-13 -13 26 26" aria-hidden="true"><path d="${GLYPHS[index].path}"/></svg>`;
}

/** Create an SVG <path> element for use inside the ring. */
export function glyphPathEl(index) {
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p.setAttribute('d', GLYPHS[index].path);
  return p;
}
