/* ============================================================
   ring.js — the rotating sigil band of the Annulus.

   Geometry lives in a 1000×1000 viewBox, centre (500,500):
     aperture (portal canvas underneath)  r ≤ 330
     inner bezel                          r 330..352
     rotating sigil band                  r 356..452  (plaques at 404)
     outer rim + Annular Seals            r 456..498
     the Meridian Claw (top pointer)      drawn above everything
   ============================================================ */

import { SIGIL_COUNT, sigilMarkup } from "./sigils.js";

const C = 500;
const STEP = 360 / SIGIL_COUNT; // 12°
const SPEED = 66;               // deg/sec cruise speed of the band

const rad = (d) => (d * Math.PI) / 180;
const pt = (r, deg) => [C + r * Math.sin(rad(deg)), C - r * Math.cos(rad(deg))];

function circlePath(r) {
  // A full circle as two half-arcs (a single near-360° arc is
  // numerically ill-defined and picks the wrong centre).
  return (
    `M ${C} ${C - r} A ${r} ${r} 0 1 1 ${C} ${C + r} ` +
    `A ${r} ${r} 0 1 1 ${C} ${C - r} Z`
  );
}

function ringPath(r0, r1) {
  // An annulus as two concentric circles with evenodd fill.
  return `${circlePath(r1)} ${circlePath(r0)}`;
}

const easeInOut = (x) =>
  x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;

export class Ring {
  constructor(svg, { onSigilClick } = {}) {
    this.svg = svg;
    this.onSigilClick = onSigilClick || (() => {});
    this.angle = 0;        // current band rotation, degrees
    this.dir = 1;          // alternates each dial
    this.animating = false;
    this._raf = null;
    this._build();
  }

  _build() {
    const ns = "http://www.w3.org/2000/svg";
    const svg = this.svg;
    svg.innerHTML = `
      <defs>
        <radialGradient id="bandMetal" cx="50%" cy="42%" r="65%">
          <stop offset="0%"  stop-color="#3a3226"/>
          <stop offset="55%" stop-color="#2a2318"/>
          <stop offset="100%" stop-color="#1a1510"/>
        </radialGradient>
        <radialGradient id="rimMetal" cx="50%" cy="40%" r="70%">
          <stop offset="0%"  stop-color="#243230"/>
          <stop offset="60%" stop-color="#18211f"/>
          <stop offset="100%" stop-color="#0e1413"/>
        </radialGradient>
        <radialGradient id="bezelGlow" cx="50%" cy="50%" r="50%">
          <stop offset="78%" stop-color="#ffb85c" stop-opacity="0"/>
          <stop offset="97%" stop-color="#ffb85c" stop-opacity="0.55"/>
          <stop offset="100%" stop-color="#ffe4ae" stop-opacity="0.9"/>
        </radialGradient>
      </defs>
      <g id="rim-static"></g>
      <g id="band"></g>
      <g id="bezel-static"></g>
      <g id="seals"></g>
      <g id="occluder"></g>
      <g id="claw"></g>
    `;

    // --- outer rim (static, verdigris-dark) ---
    const rim = svg.querySelector("#rim-static");
    rim.innerHTML =
      `<path d="${ringPath(456, 498)}" fill="url(#rimMetal)" fill-rule="evenodd"
         stroke="#3d7068" stroke-width="1.6"/>` +
      `<circle cx="${C}" cy="${C}" r="456" fill="none" stroke="#5aa39744" stroke-width="0.8"/>`;

    // --- rotating band ---
    const band = svg.querySelector("#band");
    let bandInner =
      `<path d="${ringPath(356, 452)}" fill="url(#bandMetal)" fill-rule="evenodd"
         stroke="#6d5432" stroke-width="1.6"/>`;
    // engraved tooth marks between plaques
    for (let i = 0; i < SIGIL_COUNT; i++) {
      const a = i * STEP + STEP / 2;
      const [x1, y1] = pt(358, a);
      const [x2, y2] = pt(376, a);
      bandInner += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}"
        x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#6d543288" stroke-width="2"/>`;
    }
    // plaques
    for (let i = 0; i < SIGIL_COUNT; i++) {
      const a = i * STEP;
      const [x, y] = pt(404, a);
      bandInner += `
        <g class="plaque${i === 0 ? " origin" : ""}" data-sigil="${i}"
           transform="translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${a})">
          <circle class="plaque-bed" r="27"/>
          <g class="plaque-sigil" fill="none" stroke="currentColor"
             stroke-width="6" stroke-linecap="round" transform="scale(0.42)">
            ${sigilMarkup(i)}
          </g>
        </g>`;
    }
    band.innerHTML = bandInner;
    this.band = band;
    this._applyAngle();

    band.addEventListener("click", (ev) => {
      const plaque = ev.target.closest(".plaque");
      if (!plaque) return;
      this.onSigilClick(Number(plaque.dataset.sigil));
    });

    // --- inner bezel (static) with an ignition glow ring ---
    const bezel = svg.querySelector("#bezel-static");
    bezel.innerHTML =
      `<path d="${ringPath(330, 352)}" fill="url(#rimMetal)" fill-rule="evenodd"
         stroke="#3d7068" stroke-width="1.4"/>` +
      `<circle cx="${C}" cy="${C}" r="331" fill="none" stroke="#b08d57" stroke-width="1"
         opacity="0.5"/>` +
      `<circle id="bezel-fire" cx="${C}" cy="${C}" r="341" fill="none"
         stroke="#ffb85c" stroke-width="15" opacity="0"
         style="transition: opacity 1.2s ease"/>`;

    // --- the Meridian Claw: top pointer that reads the band ---
    const claw = svg.querySelector("#claw");
    const [ax, ay] = pt(352, 0);
    claw.innerHTML = `
      <g id="claw-g">
        <path d="M ${C - 30} ${C - 470} L ${C + 30} ${C - 470}
                 L ${C + 12} ${ay + 6} L ${C - 12} ${ay + 6} Z"
              fill="#242a28" stroke="#5aa397" stroke-width="1.6"/>
        <path d="M ${C - 12} ${ay + 6} L ${C} ${ay + 26} L ${C + 12} ${ay + 6} Z"
              fill="#2c2417" stroke="#b08d57" stroke-width="1.4"/>
        <circle id="claw-eye" cx="${C}" cy="${C - 442}" r="8"
              fill="#213432" stroke="#5aa397" stroke-width="1.4"
              style="transition: fill 0.3s, filter 0.3s"/>
      </g>`;
    this.clawEye = svg.querySelector("#claw-eye");
    this.bezelFire = svg.querySelector("#bezel-fire");
  }

  _applyAngle() {
    this.band.setAttribute("transform", `rotate(${this.angle} ${C} ${C})`);
  }

  setBusy(b) { this.svg.classList.toggle("busy", b); }

  setClawLit(on) {
    this.clawEye.style.fill = on ? "#ffe4ae" : "#213432";
    this.clawEye.style.filter = on ? "drop-shadow(0 0 7px #ffb85c)" : "none";
  }

  setBezelFire(on) { this.bezelFire.style.opacity = on ? "0.9" : "0"; }

  plaque(i) { return this.svg.querySelector(`.plaque[data-sigil="${i}"]`); }

  litSigil(i, on = true) { this.plaque(i)?.classList.toggle("lit", on); }

  clearLit() {
    this.svg.querySelectorAll(".plaque.lit").forEach((p) => p.classList.remove("lit"));
  }

  refuseSigil(i) {
    const p = this.plaque(i);
    if (!p) return;
    p.classList.remove("refused");
    void p.getBBox; // force reflow-ish; classList re-add restarts animation
    requestAnimationFrame(() => p.classList.add("refused"));
    setTimeout(() => p.classList.remove("refused"), 600);
  }

  glintRandom() {
    const i = Math.floor(Math.random() * SIGIL_COUNT);
    const p = this.plaque(i);
    if (!p || p.classList.contains("lit")) return;
    p.classList.add("glint");
    setTimeout(() => p.classList.remove("glint"), 1700);
  }

  /* Rotate the band so sigil `index` sits under the Meridian Claw.
     Direction alternates per call. Resolves when the band settles. */
  rotateToSigil(index, { onTick } = {}) {
    this.plaque(index)?.classList.add("seeking");
    return new Promise((resolve) => {
      const target0 = -index * STEP; // θ ≡ target0 (mod 360)
      const dir = this.dir;
      this.dir = -this.dir;

      let delta = ((target0 - this.angle) * dir % 360 + 360) % 360 * dir;
      // delta now has sign of dir; ensure a satisfying minimum sweep.
      if (Math.abs(delta) < 40) delta += dir * 360;

      const from = this.angle;
      const dur = Math.min(5200, Math.max(1000, (Math.abs(delta) / SPEED) * 1000));
      const t0 = performance.now();
      let lastNotch = Math.floor(from / STEP);
      this.animating = true;

      const frame = (now) => {
        const u = Math.min(1, (now - t0) / dur);
        this.angle = from + delta * easeInOut(u);
        this._applyAngle();
        const notch = Math.floor(this.angle / STEP);
        if (notch !== lastNotch) {
          const n = Math.abs(notch - lastNotch);
          lastNotch = notch;
          if (onTick) onTick(n);
        }
        if (u < 1) {
          this._raf = requestAnimationFrame(frame);
        } else {
          // settle wobble
          const w0 = performance.now();
          const base = this.angle;
          const wobble = (now2) => {
            const v = (now2 - w0) / 340;
            if (v >= 1) {
              this.angle = base; this._applyAngle();
              this.animating = false;
              this.plaque(index)?.classList.remove("seeking");
              resolve();
              return;
            }
            this.angle = base + Math.sin(v * Math.PI * 3) * 1.3 * (1 - v);
            this._applyAngle();
            this._raf = requestAnimationFrame(wobble);
          };
          this._raf = requestAnimationFrame(wobble);
        }
      };
      this._raf = requestAnimationFrame(frame);
    });
  }

  stop() {
    if (this._raf) cancelAnimationFrame(this._raf);
    this.animating = false;
  }
}
