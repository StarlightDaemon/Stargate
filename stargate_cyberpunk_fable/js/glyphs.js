/* NIGHTGLASS — the ten resonance glyphs of the Lume Lattice.
   Each glyph is an original abstract mark drawn in a 64x64 box. */
'use strict';

const GLYPHS = [
  { id: 'lume',  name: 'LUME',  hint: 'the lantern',
    marks: ['M32 6 V20', 'M32 44 V58'], rings: [[32, 32, 12]], dots: [] },
  { id: 'vesh',  name: 'VESH',  hint: 'the twin rise',
    marks: ['M16 40 L32 24 L48 40', 'M22 51 L32 41 L42 51'], rings: [], dots: [[32, 13]] },
  { id: 'orin',  name: 'ORIN',  hint: 'the still peak',
    marks: ['M32 12 L51 47 L13 47 Z'], rings: [[32, 37, 6]], dots: [] },
  { id: 'thren', name: 'THREN', hint: 'the three strands',
    marks: ['M12 21 H52', 'M12 32 H52', 'M12 43 H52', 'M19 53 L45 11'], rings: [], dots: [] },
  { id: 'sola',  name: 'SOLA',  hint: 'the burst',
    marks: ['M13 13 L23 23', 'M51 13 L41 23', 'M13 51 L23 41', 'M51 51 L41 41'], rings: [[32, 32, 7]], dots: [] },
  { id: 'nyss',  name: 'NYSS',  hint: 'the waning veil',
    marks: ['M41 10 A 22 22 0 1 0 41 54'], rings: [], dots: [[44, 32]] },
  { id: 'okta',  name: 'OKTA',  hint: 'the eight gate',
    marks: ['M25 10 L39 10 L54 25 L54 39 L39 54 L25 54 L10 39 L10 25 Z'], rings: [], dots: [[32, 32]] },
  { id: 'cael',  name: 'CAEL',  hint: 'the high bridge',
    marks: ['M12 45 Q 32 6 52 45', 'M32 27 V56'], rings: [], dots: [] },
  { id: 'rill',  name: 'RILL',  hint: 'the bright stream',
    marks: ['M8 32 C 16 15, 24 15, 32 32 S 48 49, 56 32'], rings: [], dots: [[16, 46], [48, 18]] },
  { id: 'vant',  name: 'VANT',  hint: 'the shard',
    marks: ['M32 10 L50 32 L32 54 L14 32 Z', 'M23 45 L41 19'], rings: [], dots: [] }
];

/* Render one glyph as an inline SVG string. */
function glyphSVG(g, cls) {
  const parts = [];
  for (const d of g.marks) parts.push('<path d="' + d + '"/>');
  for (const r of g.rings) parts.push('<circle cx="' + r[0] + '" cy="' + r[1] + '" r="' + r[2] + '"/>');
  for (const p of g.dots) parts.push('<circle class="dot" cx="' + p[0] + '" cy="' + p[1] + '" r="2.6"/>');
  return '<svg class="' + (cls || 'glyph') + '" viewBox="0 0 64 64" aria-hidden="true">' + parts.join('') + '</svg>';
}
