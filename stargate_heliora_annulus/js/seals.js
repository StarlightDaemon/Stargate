/* ============================================================
   seals.js — the seven Annular Seals.

   Seven pylons stand on the outer rim. As each sigil of a cant
   locks under the Meridian Claw, one pylon drives inward and its
   gem ignites. Seven lit seals arm the Sunstrike.
   ============================================================ */

const C = 500;
const N = 7;

export class Seals {
  constructor(svg) {
    this.svg = svg;
    this.group = svg.querySelector("#seals");
    this.locked = 0;
    this._build();
  }

  _build() {
    let html = "";
    for (let i = 0; i < N; i++) {
      // Even spread with a half-step offset so no seal sits under the Claw.
      const a = (i + 0.5) * (360 / N);
      html += `
        <g class="seal" data-seal="${i}" transform="rotate(${a.toFixed(3)} ${C} ${C})">
          <g class="seal-pylon" style="transform: translateY(0px)">
            <path d="M ${C - 26} ${C - 494} L ${C + 26} ${C - 494}
                     L ${C + 18} ${C - 452} L ${C - 18} ${C - 452} Z"
                  fill="#1c2624" stroke="#3d7068" stroke-width="1.5"/>
            <line x1="${C - 10}" y1="${C - 488}" x2="${C - 10}" y2="${C - 458}"
                  stroke="#2e5b54" stroke-width="1.2"/>
            <line x1="${C + 10}" y1="${C - 488}" x2="${C + 10}" y2="${C - 458}"
                  stroke="#2e5b54" stroke-width="1.2"/>
            <circle class="seal-gem" cx="${C}" cy="${C - 472}" r="9.5"
                  fill="#1a2422" stroke="#5aa397" stroke-width="1.6"/>
          </g>
        </g>`;
    }
    this.group.innerHTML = html;
  }

  _seal(i) { return this.group.querySelector(`.seal[data-seal="${i}"]`); }

  /* Drive seal i inward and ignite its gem. */
  lock(i) {
    const s = this._seal(i);
    if (!s) return;
    const pylon = s.querySelector(".seal-pylon");
    const gem = s.querySelector(".seal-gem");
    pylon.style.transform = "translateY(16px)";
    gem.style.fill = "#ffb85c";
    gem.style.stroke = "#ffe4ae";
    gem.style.filter = "drop-shadow(0 0 8px #ffb85c)";
    this.locked = Math.max(this.locked, i + 1);
  }

  /* Release one seal (used for staggered shutdown). */
  release(i) {
    const s = this._seal(i);
    if (!s) return;
    const pylon = s.querySelector(".seal-pylon");
    const gem = s.querySelector(".seal-gem");
    pylon.style.transform = "translateY(0px)";
    gem.style.fill = "#1a2422";
    gem.style.stroke = "#5aa397";
    gem.style.filter = "none";
  }

  releaseAll() {
    for (let i = 0; i < N; i++) this.release(i);
    this.locked = 0;
  }

  /* Staggered release, resolves when the last lets go. */
  releaseStaggered(stepMs = 130, onEach = null) {
    return new Promise((resolve) => {
      let k = 0;
      const tick = () => {
        const i = N - 1 - k;
        if (i < 0) { this.locked = 0; resolve(); return; }
        this.release(i);
        if (onEach) onEach(i);
        k++;
        setTimeout(tick, stepMs);
      };
      tick();
    });
  }
}
