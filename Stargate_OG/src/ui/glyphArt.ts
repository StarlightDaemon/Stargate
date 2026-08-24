/**
 * Procedural glyph artwork. Each of the 39 ring symbols is an original,
 * deterministic mini-constellation generated from its index — no traced or
 * copied artwork anywhere. Glyph 0 (point of origin) gets a distinct motif.
 */

export interface GlyphArt {
  /** Star points in a 0–24 unit box. */
  points: Array<[number, number]>;
  /** SVG polyline `points` attribute connecting the stars. */
  polyline: string;
}

/** mulberry32 — tiny deterministic PRNG so glyph N is identical everywhere. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildGlyph(index: number): GlyphArt {
  if (index === 0) {
    // Point of origin: a hearth — chevron over a base star.
    const points: Array<[number, number]> = [
      [12, 4],
      [5, 14],
      [19, 14],
      [12, 20],
    ];
    return { points, polyline: '12,4 5,14 19,14 12,4 12,20' };
  }

  const rand = mulberry32(index * 2654435761);
  const count = 4 + Math.floor(rand() * 3); // 4–6 stars
  const points: Array<[number, number]> = [];
  for (let i = 0; i < count; i++) {
    // Spread stars across the box, biased away from the edges.
    const x = 3 + rand() * 18;
    const y = 3 + rand() * 18;
    points.push([Math.round(x * 10) / 10, Math.round(y * 10) / 10]);
  }
  // Connect in angular order around the centroid for a constellation stroke.
  const cx = points.reduce((s, p) => s + p[0], 0) / count;
  const cy = points.reduce((s, p) => s + p[1], 0) / count;
  const ordered = [...points].sort(
    (a, b) => Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx),
  );
  const polyline = ordered.map((p) => `${p[0]},${p[1]}`).join(' ');
  return { points: ordered, polyline };
}

export const GLYPHS: readonly GlyphArt[] = Array.from({ length: 39 }, (_, i) => buildGlyph(i));
