/* ============================================================
   occluder.js — the Umbral Occulter.

   Heliora is not sealed by petals or a hatch but by an eclipse:
   a dark occulting disc that transits across the open well from
   the west, quenching it behind a burning corona. It is the
   instrument's closing mechanism.
   ============================================================ */

const C = 500;
const APERTURE = 332;   // clip radius: the disc travels behind the bezel
const OFF_X = -720;     // parked position, fully clear of the aperture

const easeInOut = (x) =>
  x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;

export class Occluder {
  constructor(svg) {
    this.svg = svg;
    this.group = svg.querySelector("#occluder");
    this.x = OFF_X;
    this._raf = null;
    this._build();
  }

  _build() {
    // Concentric engraving on the disc face.
    let rings = "";
    for (const r of [70, 130, 190, 250, 305]) {
      rings += `<circle r="${r}" fill="none" stroke="#2b3331" stroke-width="1.6"/>`;
    }
    this.group.innerHTML = `
      <defs>
        <clipPath id="aperture-clip">
          <circle cx="${C}" cy="${C}" r="${APERTURE}"/>
        </clipPath>
        <radialGradient id="occFace" cx="38%" cy="34%" r="80%">
          <stop offset="0%"  stop-color="#232b29"/>
          <stop offset="60%" stop-color="#141a19"/>
          <stop offset="100%" stop-color="#0a0d0d"/>
        </radialGradient>
        <filter id="coronaBlur" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="14"/>
        </filter>
      </defs>
      <g clip-path="url(#aperture-clip)">
        <g id="occ-disc" transform="translate(${OFF_X} 0)">
          <circle id="occ-corona" cx="${C}" cy="${C}" r="338" fill="none"
                  stroke="#ffb85c" stroke-width="10" opacity="0"
                  filter="url(#coronaBlur)"/>
          <circle cx="${C}" cy="${C}" r="336" fill="url(#occFace)"
                  stroke="#3d7068" stroke-width="2"/>
          <g transform="translate(${C} ${C})">
            ${rings}
            <circle r="30" fill="none" stroke="#3d7068" stroke-width="2"
                    opacity="0.8"/>
            <circle r="9" fill="#3d7068" opacity="0.8"/>
            <path d="M 0 30 L 0 54" stroke="#3d7068" stroke-width="2"/>
          </g>
        </g>
      </g>`;
    this.disc = this.group.querySelector("#occ-disc");
    this.corona = this.group.querySelector("#occ-corona");
  }

  _slide(toX, dur) {
    if (this._raf) cancelAnimationFrame(this._raf);
    return new Promise((resolve) => {
      const from = this.x;
      const t0 = performance.now();
      const frame = (now) => {
        const u = Math.min(1, (now - t0) / dur);
        this.x = from + (toX - from) * easeInOut(u);
        this.disc.setAttribute("transform", `translate(${this.x.toFixed(1)} 0)`);
        if (u < 1) this._raf = requestAnimationFrame(frame);
        else resolve();
      };
      this._raf = requestAnimationFrame(frame);
    });
  }

  /* Transit across the open well. Corona burns while it covers fire. */
  async close(dur = 1600) {
    this.corona.style.transition = "opacity 0.5s";
    this.corona.style.opacity = "0.85";
    await this._slide(0, dur);
  }

  /* Corona dies once the well behind is quenched. */
  douseCorona() {
    this.corona.style.transition = "opacity 1.4s";
    this.corona.style.opacity = "0";
  }

  /* Slide back to the parked position, revealing the aperture. */
  async retract(dur = 1500) {
    this.douseCorona();
    await this._slide(OFF_X, dur);
  }

  get engaged() { return this.x > OFF_X + 1; }
}
