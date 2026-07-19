// The Meridian ring: three concentric counter-rotating glyph bands around a
// central aperture, with nine invariant anchors at the rim. Pure SVG, driven
// by a single rAF loop in main.js. The ring never stops entirely — the
// Artifact idles at a slow ambient drift.

import { GLYPHS, glyphPathEl } from './glyphs.js';

const NS = 'http://www.w3.org/2000/svg';
const C = 500; // center

function el(name, attrs = {}, parent = null) {
  const n = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (parent) parent.appendChild(n);
  return n;
}

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const easeOutBack = (t) => { const c = 1.35; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const BAND_SPECS = [
  { rGlyph: 432, rOuter: 464, rInner: 400, count: 36, scale: 1.7, drift: 1.55 },
  { rGlyph: 364, rOuter: 396, rInner: 332, count: 24, scale: 1.9, drift: -1.05 },
  { rGlyph: 296, rOuter: 328, rInner: 264, count: 18, scale: 2.05, drift: 0.7 },
];

const ANCHOR_R = 228;

export class Ring {
  constructor(svg, reducedMotion) {
    this.svg = svg;
    this.reduced = reducedMotion;
    this.bands = [];
    this.anchors = [];
    this.spin = 0; // normalized rotation intensity for audio, 0..1
    this.build();
  }

  build() {
    const rnd = mulberry32(0xA10);
    // static chassis: aperture rim + hairlines
    const chassis = el('g', {}, this.svg);
    el('circle', { cx: C, cy: C, r: 194, class: 'rim', 'stroke-width': 3 }, chassis);
    el('circle', { cx: C, cy: C, r: 203, class: 'band-outline', 'stroke-width': 0.7, opacity: 0.5 }, chassis);

    for (const spec of BAND_SPECS) {
      const g = el('g', { class: 'band' }, this.svg);
      el('circle', { cx: C, cy: C, r: spec.rOuter, class: 'band-outline', 'stroke-width': 1.4 }, g);
      el('circle', { cx: C, cy: C, r: spec.rInner, class: 'band-outline', 'stroke-width': 0.8, opacity: 0.7 }, g);
      // glyph selection: outer band carries the full alphabet; inner bands
      // carry seeded subsets (glyph 35 / ERIDU never rides a band — it is
      // the fixed local invariant, not a searchable mark)
      const pool = [...Array(35).keys()];
      let indices;
      if (spec.count === 36) {
        indices = [...pool, 35 - 1]; // full pool + repeat of one mark to fill 36
      } else {
        indices = [];
        const bag = [...pool];
        for (let i = 0; i < spec.count; i++) indices.push(bag.splice(Math.floor(rnd() * bag.length), 1)[0]);
      }
      for (let i = 0; i < spec.count; i++) {
        const theta = (i / spec.count) * 360;
        const gg = el('g', {
          transform: `rotate(${theta} ${C} ${C}) translate(${C} ${C - spec.rGlyph}) scale(${spec.scale})`,
        }, g);
        const p = glyphPathEl(indices[i]);
        p.setAttribute('class', 'band-glyph');
        p.setAttribute('vector-effect', 'non-scaling-stroke');
        gg.appendChild(p);
        // separator tick between glyph positions
        el('line', {
          x1: C, y1: C - spec.rOuter + 4, x2: C, y2: C - spec.rOuter + 14,
          class: 'band-tick', 'stroke-width': 1.2,
          transform: `rotate(${theta + 180 / spec.count} ${C} ${C})`,
        }, g);
      }
      this.bands.push({ el: g, spec, angle: rnd() * 360, anim: null, vel: 0 });
    }

    // nine invariant anchors
    const anchorLayer = el('g', {}, this.svg);
    for (let i = 0; i < 9; i++) {
      const angle = i * 40; // anchor 0 at top
      const g = el('g', {
        class: 'anchor',
        transform: `rotate(${angle} ${C} ${C}) translate(${C} ${C - ANCHOR_R})`,
      }, anchorLayer);
      // caliper brackets facing the glyph slot
      el('path', { d: 'M-13 -15 A20 20 0 0 0 -13 15', class: 'anchor-housing' }, g);
      el('path', { d: 'M13 -15 A20 20 0 0 1 13 15', class: 'anchor-housing' }, g);
      // directional pip pointing at the aperture
      el('path', { d: 'M0 24 l5 -6 l-5 -6 l-5 6 Z', class: 'anchor-node' }, g);
      const slot = el('g', { class: 'slot-glyph' }, g);
      this.anchors.push({ el: g, slot });
    }
  }

  /** eased band rotation toward a relative target; the dialer decides timing */
  seek(bandIdx, deltaDeg, durMs) {
    const b = this.bands[bandIdx];
    b.anim = {
      type: 'seek', from: b.angle, to: b.angle + deltaDeg,
      start: performance.now(), dur: durMs,
      ease: this.reduced ? easeInOutCubic : easeOutBack,
    };
  }

  /** lattice recall memory sweep: all bands, one synchronized fast revolution */
  sweepAll(durMs) {
    const now = performance.now();
    for (const b of this.bands) {
      b.anim = {
        type: 'seek', from: b.angle,
        to: b.angle + 360 * Math.sign(b.spec.drift || 1),
        start: now, dur: durMs, ease: easeInOutCubic,
      };
      b.el.classList.add('sweep');
    }
    setTimeout(() => this.bands.forEach(b => b.el.classList.remove('sweep')), durMs + 60);
  }

  /** divergence: bands shudder around their current position */
  wobble(durMs) {
    const now = performance.now();
    for (const b of this.bands) {
      b.anim = { type: 'wobble', base: b.angle, start: now, dur: durMs, mag: 2.5 + Math.random() * 1.5 };
    }
  }

  lockAnchor(i, glyphIndex, recalled = false) {
    const a = this.anchors[i];
    a.slot.replaceChildren();
    const p = glyphPathEl(glyphIndex);
    p.setAttribute('class', 'anchor-glyph');
    // counter-rotate so the glyph reads upright-ish relative to its anchor
    a.slot.setAttribute('transform', 'scale(1.05)');
    a.slot.appendChild(p);
    a.el.classList.add('locked');
    a.el.classList.toggle('recalled', recalled);
  }

  resetAnchors() {
    for (const a of this.anchors) {
      a.el.classList.remove('locked', 'recalled');
      a.slot.replaceChildren();
    }
  }

  setSolving(on) { this.svg.classList.toggle('solving', on); }
  setOpen(on) { this.svg.classList.toggle('open', on); }

  tick(dtMs) {
    const now = performance.now();
    const dt = dtMs / 1000;
    let totalVel = 0;
    for (const b of this.bands) {
      const prev = b.angle;
      if (b.anim) {
        const t = Math.min(1, (now - b.anim.start) / b.anim.dur);
        if (b.anim.type === 'seek') {
          b.angle = b.anim.from + (b.anim.to - b.anim.from) * b.anim.ease(t);
        } else { // wobble
          b.angle = b.anim.base + Math.sin(t * 34) * b.anim.mag * (1 - t);
        }
        if (t >= 1) b.anim = null;
      } else {
        b.angle += b.spec.drift * (this.reduced ? 0.35 : 1) * dt;
      }
      b.vel = (b.angle - prev) / Math.max(dt, 1e-4);
      totalVel += Math.abs(b.vel);
      b.el.setAttribute('transform', `rotate(${b.angle % 360} ${C} ${C})`);
    }
    // normalize: ambient drift ≈ 3 deg/s total, a hard seek can hit ~400
    this.spin = Math.min(1, totalVel / 320);
  }
}
