/* Heliacal Ring — the gate machine.
   Builds the entire ring as SVG (outer housing, nine lock lugs, rotating
   38-glyph inner ring, aperture shield) and animates its mechanics:
   ring rotation with servo audio, chevron engagement, shield open/close.

   Geometry (viewBox 1000×1000, centre 500):
     478..400  outer housing band with tick marks and lock lugs
     400..330  rotating glyph ring
     330..310  inner rim
       <310    opening — transparent, the portal canvas shows through */

window.HG = window.HG || {};

HG.gate = (function () {
  "use strict";

  const SVG_NS = "http://www.w3.org/2000/svg";
  const svg = document.getElementById("gate-svg");
  const CX = 500, CY = 500;
  const GLYPH_COUNT = 38;
  const STEP = 360 / GLYPH_COUNT;
  const CHEVRON_COUNT = 9;
  const IRIS_R = 326;

  let glyphRing = null;
  let ringAngle = 0;
  let chevronEls = [];
  let glyphEls = [];
  let irisBlades = [];

  // active animations
  let rot = null;   // { from, to, t, dur, resolve, reject }
  let iris = { progress: 0, target: 0, moving: false, resolvers: [] };

  function el(name, attrs, parent) {
    const e = document.createElementNS(SVG_NS, name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  /* ---- construction -------------------------------------------------------- */

  function build() {
    svg.textContent = "";

    // ---- aperture shield (painted first, under everything) ----
    const irisClip = el("clipPath", { id: "iris-clip" }, el("defs", {}, svg));
    el("circle", { cx: CX, cy: CY, r: IRIS_R }, irisClip);
    const irisG = el("g", { "clip-path": "url(#iris-clip)" }, svg);
    for (let i = 0; i < 12; i++) {
      const blade = el("path", { class: "iris-blade", d: "" }, irisG);
      irisBlades.push(blade);
    }

    // ---- rotating glyph ring ----
    glyphRing = el("g", { id: "glyph-ring" }, svg);
    el("circle", {
      cx: CX, cy: CY, r: 365, class: "glyph-band", "stroke-width": 70
    }, glyphRing);

    for (let i = 0; i < GLYPH_COUNT; i++) {
      // slot separators, offset half a step from glyph centres
      const sepA = ((i + 0.5) * STEP - 90) * Math.PI / 180;
      el("line", {
        class: "glyph-sep",
        x1: CX + Math.cos(sepA) * 332, y1: CY + Math.sin(sepA) * 332,
        x2: CX + Math.cos(sepA) * 398, y2: CY + Math.sin(sepA) * 398
      }, glyphRing);

      // glyph i drawn at the top slot, then rotated into place
      const slot = el("g", {
        class: "glyph" + (i === HG.data.ORIGIN ? " origin-mark" : ""),
        "data-index": i,
        transform: `rotate(${i * STEP} ${CX} ${CY})`
      }, glyphRing);
      const inner = el("g", {
        transform: `translate(${CX - 26} ${135 - 26}) scale(0.52)`
      }, slot);
      HG.glyphs.drawInto(inner, i, 8);
      glyphEls.push(slot);
    }

    // ---- static housing ----
    const stat = el("g", { id: "gate-static" }, svg);

    el("circle", { cx: CX, cy: CY, r: 439, class: "ring-metal", "stroke-width": 78 }, stat);
    el("circle", { cx: CX, cy: CY, r: 478, class: "ring-edge" }, stat);
    el("circle", { cx: CX, cy: CY, r: 400, class: "ring-edge" }, stat);

    // tick marks around the outer band
    for (let i = 0; i < 76; i++) {
      const a = (i / 76) * Math.PI * 2;
      const long = i % 4 === 0;
      el("line", {
        class: "ring-tick",
        x1: CX + Math.cos(a) * (long ? 458 : 464),
        y1: CY + Math.sin(a) * (long ? 458 : 464),
        x2: CX + Math.cos(a) * 474,
        y2: CY + Math.sin(a) * 474
      }, stat);
    }

    // inner rim
    el("circle", { cx: CX, cy: CY, r: 320, class: "ring-metal", "stroke-width": 20 }, stat);
    el("circle", { cx: CX, cy: CY, r: 330, class: "ring-edge" }, stat);
    el("circle", { cx: CX, cy: CY, r: 310, class: "ring-edge" }, stat);

    // nine lock lugs, primary at top
    for (let k = 0; k < CHEVRON_COUNT; k++) {
      const g = el("g", {
        class: "chevron",
        "data-chev": k,
        transform: `rotate(${k * 40} ${CX} ${CY})`
      }, stat);
      const scale = k === 0 ? 1.18 : 1.0;
      const cg = el("g", {
        transform: `translate(${CX} 0) scale(${scale}) translate(${-CX} 0)`
      }, g);
      el("path", { class: "chev-plate", d: "M454,22 L546,22 L540,42 L460,42 Z" }, cg);
      el("path", {
        class: "chev-housing",
        d: "M462,28 L538,28 L526,82 L500,104 L474,82 Z"
      }, cg);
      const moving = el("g", { class: "chev-moving" }, cg);
      el("path", {
        class: "chev-jewel",
        d: "M479,44 L521,44 L513,74 L500,86 L487,74 Z"
      }, moving);
      chevronEls.push(g);
    }

    // top alignment marker just outside the primary lug
    el("path", {
      class: "top-marker",
      d: `M${CX - 9},8 L${CX + 9},8 L${CX},22 Z`
    }, stat);

    updateIrisBlades();
    applyRingAngle();
  }

  /* ---- ring rotation --------------------------------------------------------- */

  function applyRingAngle() {
    glyphRing.setAttribute("transform", `rotate(${ringAngle} ${CX} ${CY})`);
  }

  function easeInOut(x) {
    return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  }

  /* Rotate glyph `index` under the primary lug. Direction alternates with
     each lock for the classic mechanical back-and-forth. */
  function rotateToGlyph(index, lockNumber) {
    return new Promise((resolve, reject) => {
      const desired = -index * STEP;            // target angle mod 360
      const dir = lockNumber % 2 === 0 ? 1 : -1;

      let delta = (desired - ringAngle) % 360;
      if (dir > 0 && delta <= 0) delta += 360;
      if (dir < 0 && delta >= 0) delta -= 360;
      if (Math.abs(delta) < 30) delta += dir * 360; // guarantee real travel

      const travel = Math.abs(delta);
      const dur = Math.min(4.2, Math.max(1.0, travel / 65));
      rot = { from: ringAngle, to: ringAngle + delta, start: performance.now(), dur, resolve, reject };
    });
  }

  /* Slow return to home position (abort / failure spin-down). */
  function resetRing() {
    return new Promise((resolve) => {
      let delta = -(ringAngle % 360);
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      if (Math.abs(delta) < 0.5) { ringAngle = 0; applyRingAngle(); resolve(); return; }
      const dur = Math.min(2.5, Math.max(0.8, Math.abs(delta) / 90));
      rot = { from: ringAngle, to: ringAngle + delta, start: performance.now(), dur, resolve, reject: () => {} };
    });
  }

  function cancelMotion() {
    if (rot) {
      const r = rot;
      rot = null;
      HG.audio.servoSet(0);
      r.reject(new Error("aborted"));
    }
  }

  function isTurning() { return rot !== null; }

  /* ---- chevrons ---------------------------------------------------------------- */

  function engageChevron(k, hostile) {
    return new Promise((resolve) => {
      const c = chevronEls[k];
      c.classList.add("engaging");
      setTimeout(() => {
        c.classList.add(hostile ? "hostile" : "locked");
        HG.audio.chevronLock();
      }, 300);
      setTimeout(() => {
        c.classList.remove("engaging");
        resolve();
      }, 640);
    });
  }

  function releaseChevrons() {
    chevronEls.forEach((c, i) => {
      setTimeout(() => c.classList.remove("locked", "hostile"), i * 70);
    });
  }

  function chevronsFlicker() {
    let on = false;
    let n = 0;
    const iv = setInterval(() => {
      on = !on;
      chevronEls.forEach(c => c.classList.toggle("locked", on));
      if (++n >= 6) {
        clearInterval(iv);
        chevronEls.forEach(c => c.classList.remove("locked", "hostile"));
      }
    }, 110);
  }

  function lockedCount() {
    return chevronEls.filter(c =>
      c.classList.contains("locked") || c.classList.contains("hostile")).length;
  }

  /* ---- glyph highlights ----------------------------------------------------------- */

  function setGlyphLit(index, on) {
    if (glyphEls[index]) glyphEls[index].classList.toggle("lit", on);
  }
  function clearGlyphLights() {
    glyphEls.forEach(g => g.classList.remove("lit"));
  }

  /* ---- aperture shield -------------------------------------------------------------- */

  function updateIrisBlades() {
    const p = iris.progress;
    if (p <= 0.001) {
      for (const b of irisBlades) b.setAttribute("d", "");
      return;
    }
    const rOut = IRIS_R;
    const rIn = Math.max(0, rOut * (1 - p));
    const n = irisBlades.length;
    const overlap = 2.2 * (Math.PI / 180);

    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2 - overlap;
      const a1 = ((i + 1) / n) * Math.PI * 2 + overlap;
      // each blade's leading edge twists slightly as it closes
      const twist = p * 0.35;
      const x0o = CX + Math.cos(a0) * rOut, y0o = CY + Math.sin(a0) * rOut;
      const x1o = CX + Math.cos(a1) * rOut, y1o = CY + Math.sin(a1) * rOut;
      let d;
      if (rIn < 1) {
        d = `M${x0o},${y0o} A${rOut},${rOut} 0 0 1 ${x1o},${y1o} L${CX},${CY} Z`;
      } else {
        const x0i = CX + Math.cos(a0 + twist) * rIn, y0i = CY + Math.sin(a0 + twist) * rIn;
        const x1i = CX + Math.cos(a1 + twist) * rIn, y1i = CY + Math.sin(a1 + twist) * rIn;
        d = `M${x0o},${y0o} A${rOut},${rOut} 0 0 1 ${x1o},${y1o} ` +
            `L${x1i},${y1i} A${rIn},${rIn} 0 0 0 ${x0i},${y0i} Z`;
      }
      irisBlades[i].setAttribute("d", d);
    }
  }

  function setIris(closed) {
    return new Promise((resolve) => {
      const target = closed ? 1 : 0;
      if (Math.abs(iris.progress - target) < 0.001) { resolve(); return; }
      iris.target = target;
      iris.from = iris.progress;
      iris.start = performance.now();
      iris.dur = Math.max(0.05, Math.abs(target - iris.progress) * 1.15);
      iris.moving = true;
      iris.resolvers.push(resolve);
      HG.audio.irisMove();
    });
  }

  function isIrisClosed() { return iris.progress > 0.95; }
  function isIrisMoving() { return iris.moving; }

  /* ---- frame tick --------------------------------------------------------------------- */

  function tick(dt) {
    // Mechanical motion is driven by wall-clock time, not accumulated dt,
    // so throttled ticks (hidden tab) never desynchronise the sequence.
    if (rot) {
      const p = Math.min(1, (performance.now() - rot.start) / 1000 / rot.dur);
      const eased = easeInOut(p);
      const prev = ringAngle;
      ringAngle = rot.from + (rot.to - rot.from) * eased;
      applyRingAngle();

      // servo pitch follows actual angular speed
      const speed = Math.abs(ringAngle - prev) / Math.max(dt, 0.001) / 220;
      HG.audio.servoSet(Math.min(1, speed));

      if (p >= 1) {
        const r = rot;
        rot = null;
        HG.audio.servoSet(0);
        r.resolve();
      }
    }

    if (iris.moving) {
      const p = Math.min(1, (performance.now() - iris.start) / 1000 / iris.dur);
      iris.progress = iris.from + (iris.target - iris.from) * easeInOut(p);
      if (p >= 1) {
        iris.progress = iris.target;
        iris.moving = false;
        const rs = iris.resolvers.splice(0);
        rs.forEach(f => f());
      }
      updateIrisBlades();
    }
  }

  /* Instant state setters for the ?vis= deep-link gallery (no animation). */
  function debugLockAll(hostile) {
    chevronEls.forEach(c => c.classList.add(hostile ? "hostile" : "locked"));
  }
  function debugIris(progress) {
    iris.progress = progress;
    iris.target = progress;
    iris.moving = false;
    updateIrisBlades();
  }

  build();

  return {
    rotateToGlyph, resetRing, cancelMotion, isTurning,
    engageChevron, releaseChevrons, chevronsFlicker, lockedCount,
    setGlyphLit, clearGlyphLights,
    setIris, isIrisClosed, isIrisMoving,
    debugLockAll, debugIris,
    tick
  };
})();
