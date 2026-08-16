/* ============================================================
   AETHERGATE — the transit ring
   Builds the SVG gate: metal housing, rotating 36-sigil track,
   eight locking seals (the top one is the prime seal), crown
   marker, decorative bolts. Drives the spin animation and the
   seal engage/release choreography.

   Geometry (viewBox 1000x1000, center 500,500):
     housing ......... radius 408..496
     sigil track ..... radius 336..408 (glyph centers at 372)
     inner rim ....... radius 318..336
     aperture ........ inside 318 (portal canvas sits beneath)
   ============================================================ */
(function () {
  "use strict";
  window.AG = window.AG || {};

  const N = 36;                       // sigils on the track
  const STEP = 360 / N;               // 10 degrees
  const SEAL_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];
  // engagement order fans out from the crown, prime (index 0) last
  const ENGAGE_ORDER = [1, 7, 2, 6, 3, 5, 4];

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function sealMarkup(angle, prime) {
    const cls = prime ? "seal prime" : "seal";
    const pod = prime
      ? `<rect class="seal-pod" x="468" y="2"  width="64" height="86" rx="10"/>`
      : `<rect class="seal-pod" x="473" y="8"  width="54" height="76" rx="9"/>`;
    const light = prime
      ? `<rect class="seal-light" x="478" y="18" width="44" height="15" rx="5"/>`
      : `<rect class="seal-light" x="481" y="22" width="38" height="13" rx="4"/>`;
    const claw = prime
      ? `<polygon class="seal-claw" points="500,108 476,80 524,80"/>`
      : `<polygon class="seal-claw" points="500,100 480,76 520,76"/>`;
    return `<g class="${cls}" data-angle="${angle}" transform="rotate(${angle} 500 500)">
      ${pod}${light}${claw}
    </g>`;
  }

  class Ring {
    constructor(svg, sigils, audio) {
      this.svg = svg;
      this.sigils = sigils;
      this.audio = audio;
      this.angle = 0;
      this._anim = null;
      this._build();
    }

    _build() {
      const ticks = [];
      for (let i = 0; i < N; i++) {
        ticks.push(
          `<line class="tickmark" x1="500" y1="98" x2="500" y2="112"
                 transform="rotate(${i * STEP + STEP / 2} 500 500)"/>`);
      }

      const bolts = [];
      for (let i = 0; i < 16; i++) {
        bolts.push(
          `<circle cx="500" cy="66" r="6" fill="#0a121e"
                   stroke="#020409" stroke-width="1.5"
                   transform="rotate(${i * 22.5 + 11.25} 500 500)"/>`);
      }

      const glyphs = this.sigils.map((s, i) => {
        const dots = s.dots
          .map(p => `<circle cx="${p.x}" cy="${p.y}" r="${p.r}"/>`)
          .join("");
        return `<g class="sigil" data-i="${i}" transform="rotate(${i * STEP} 500 500)">
          <g transform="translate(500 128) scale(0.62) translate(-50 -50)">
            <path d="${s.d}"/>${dots}
          </g>
        </g>`;
      }).join("");

      const seals = SEAL_ANGLES
        .map((a, i) => sealMarkup(a, i === 0))
        .join("");

      this.svg.innerHTML = `
        <defs>
          <linearGradient id="g-metal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0"    stop-color="#33455e"/>
            <stop offset="0.35" stop-color="#16202f"/>
            <stop offset="0.7"  stop-color="#25344a"/>
            <stop offset="1"    stop-color="#0c1320"/>
          </linearGradient>
          <linearGradient id="g-pod" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#2e3f58"/>
            <stop offset="1" stop-color="#111a29"/>
          </linearGradient>
          <filter id="f-glow-amber" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="4" result="b"/>
            <feMerge>
              <feMergeNode in="b"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <circle class="housing-edge" cx="500" cy="500" r="496" stroke-width="8"/>
        <circle class="housing-face" cx="500" cy="500" r="452" stroke-width="88"/>
        <circle class="idle-sheen"   cx="500" cy="500" r="452"/>
        ${bolts.join("")}

        <g id="glyph-ring">
          <circle class="glyph-band" cx="500" cy="500" r="372" stroke-width="72"/>
          <circle class="band-groove" cx="500" cy="500" r="338" stroke-width="2"/>
          <circle class="band-groove" cx="500" cy="500" r="406" stroke-width="2"/>
          ${ticks.join("")}
          ${glyphs}
        </g>

        <circle class="inner-rim"  cx="500" cy="500" r="327" stroke-width="18"/>
        <circle class="housing-edge" cx="500" cy="500" r="318" stroke-width="5"/>
        <polygon class="crown-marker" points="487,162 513,162 500,180"/>

        ${seals}
      `;

      this.track = this.svg.querySelector("#glyph-ring");
      this.crown = this.svg.querySelector(".crown-marker");
      this.sealEls = Array.from(this.svg.querySelectorAll(".seal"));
      this.sigilEls = Array.from(this.svg.querySelectorAll(".sigil"));
    }

    _setAngle(a) {
      this.angle = a;
      this.track.setAttribute("transform", `rotate(${a} 500 500)`);
    }

    /* which sigil currently sits under the crown marker */
    _topSlot() {
      return ((Math.round(-this.angle / STEP) % N) + N) % N;
    }

    _flashCrown(sigilIdx) {
      this.crown.classList.add("hot");
      const el = this.sigilEls[sigilIdx];
      if (el && !el.classList.contains("locked")) {
        el.classList.add("passing");
        setTimeout(() => el.classList.remove("passing"), 130);
      }
      clearTimeout(this._crownT);
      this._crownT = setTimeout(() => this.crown.classList.remove("hot"), 130);
    }

    /* Rotate sigil `idx` under the crown. Alternates direction per
       slot and always travels at least ~140 degrees for drama.
       Resolves { aborted } when the glyph arrives or the dial dies. */
    spinTo(idx, slotIndex) {
      this.cancel();
      const target = -idx * STEP;
      const dir = (slotIndex % 2 === 0) ? -1 : 1;
      let d = ((target - this.angle) % 360 + 360) % 360;   // 0..359 going +
      let delta;
      if (dir > 0) delta = d < 140 ? d + 360 : d;
      else { delta = d - 360; if (delta > -140) delta -= 360; }

      const from = this.angle;
      const dur = 750 + Math.abs(delta) * 6.2;
      const t0 = performance.now();
      let lastTop = this._topSlot();

      this.svg.classList.add("spinning");
      this.audio.startSpin();

      return new Promise(resolve => {
        const step = (now) => {
          if (!this._anim || this._anim.token !== token) return; // cancelled
          const p = Math.min((now - t0) / dur, 1);
          this._setAngle(from + delta * easeInOutCubic(p));
          const top = this._topSlot();
          if (top !== lastTop) {
            lastTop = top;
            this.audio.tick();
            this._flashCrown(top);
          }
          if (p < 1) {
            AG.raf(step);
          } else {
            this._anim = null;
            this.svg.classList.remove("spinning");
            this.audio.stopSpin();
            resolve({ aborted: false });
          }
        };
        const token = Symbol("spin");
        this._anim = { token, abort: () => resolve({ aborted: true }) };
        AG.raf(step);
      });
    }

    cancel() {
      if (this._anim) {
        const a = this._anim;
        this._anim = null;
        this.svg.classList.remove("spinning");
        this.audio.stopSpin();
        a.abort();
      }
    }

    /* clamp seal for address position k (0..6) onto sigil idx */
    engageSeal(k, sigilIdx) {
      const seal = this.sealEls[ENGAGE_ORDER[k]];
      seal.classList.add("engaged");
      const g = this.sigilEls[sigilIdx];
      if (g) g.classList.add("locked");
      this.audio.seal(false);
      this._flashCrown(sigilIdx);
      return new Promise(res => setTimeout(res, 480));
    }

    engagePrime() {
      this.sealEls[0].classList.add("engaged");
      this.audio.seal(true);
      return new Promise(res => setTimeout(res, 550));
    }

    /* pop the seals back open, staggered outward from the bottom;
       driven by elapsed time so background-tab throttling can only
       compress the stagger, never strand a seal shut */
    releaseAll() {
      const engaged = this.sealEls
        .filter(s => s.classList.contains("engaged"))
        .reverse();
      if (engaged.length) {
        const t0 = performance.now();
        const step = (now) => {
          const k = Math.min(
            Math.floor((now - t0) / 90) + 1, engaged.length);
          for (let i = 0; i < k; i++) engaged[i].classList.remove("engaged");
          if (k < engaged.length) AG.raf(step);
        };
        AG.raf(step);
      }
      this.sigilEls.forEach(s => s.classList.remove("locked"));
    }

    sheen() {
      this.svg.classList.remove("sheen");
      // force a reflow so the animation can restart
      void this.svg.getBoundingClientRect();
      this.svg.classList.add("sheen");
      setTimeout(() => this.svg.classList.remove("sheen"), 3400);
    }
  }

  AG.Ring = Ring;
})();
