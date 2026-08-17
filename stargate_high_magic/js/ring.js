/* ═══════════════════════════════════════════════════════════════════
   SIDEREUM · ring.js — the artifact itself
   Builds the SVG: engraved outer rim with the Ring's law written
   around it, seven wards in heptagonal array, the turning band of
   twenty-one sigils, the Crown Lens at the zenith, and the Keystone.

   Exposes an API for the rite: rotate the band, ignite and dim
   wards, flash the lens, wake and hide the Keystone.
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";
  const CX = 450, CY = 450;
  const WARD_R = 356;        // radius of ward centers
  const BAND_R = 288;        // radius of sigil centers
  const SLOTS = 21;
  const WARDS = 7;
  const SLOT_DEG = 360 / SLOTS;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function el(name, attrs, parent) {
    const n = document.createElementNS(NS, name);
    if (attrs) for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  function polar(r, deg) {
    const a = (deg * Math.PI) / 180;
    return [CX + Math.cos(a) * r, CY + Math.sin(a) * r];
  }

  // {7/3} heptagram path used on the Keystone.
  function heptagramPath(r) {
    const pts = [];
    for (let i = 0; i < 7; i++) {
      pts.push(polar(r, -90 + (i * 3 * 360) / 7));
    }
    return "M " + pts.map(p => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L ") + " Z";
  }

  function Ring(svg) {
    const glyphs = window.SIDEREUM.glyphs;

    // ————— defs: glows and the engraving path —————
    const defs = el("defs", null, svg);

    const wardGlow = el("filter", { id: "wardGlow", x: "-80%", y: "-80%", width: "260%", height: "260%" }, defs);
    el("feGaussianBlur", { stdDeviation: "5", result: "b" }, wardGlow);
    const wgm = el("feMerge", null, wardGlow);
    el("feMergeNode", { in: "b" }, wgm);
    el("feMergeNode", { in: "SourceGraphic" }, wgm);

    const sigilGlow = el("filter", { id: "sigilGlow", x: "-60%", y: "-60%", width: "220%", height: "220%" }, defs);
    el("feGaussianBlur", { stdDeviation: "2.6", result: "b" }, sigilGlow);
    const sgm = el("feMerge", null, sigilGlow);
    el("feMergeNode", { in: "b" }, sgm);
    el("feMergeNode", { in: "SourceGraphic" }, sgm);

    // Keystone bevel: a mounted boss catching light from the same upper-left
    // source as the rest of the ring, rather than a flat mandala fill.
    const bevel = el("radialGradient", { id: "keystoneBevel", cx: "34%", cy: "28%", r: "78%" }, defs);
    el("stop", { offset: "0%", "stop-color": "#3c3468" }, bevel);
    el("stop", { offset: "55%", "stop-color": "#211a3f" }, bevel);
    el("stop", { offset: "100%", "stop-color": "#0c0918" }, bevel);
    const bevelAwake = el("radialGradient", { id: "keystoneBevelAwake", cx: "34%", cy: "28%", r: "78%" }, defs);
    el("stop", { offset: "0%", "stop-color": "#5c4f98" }, bevelAwake);
    el("stop", { offset: "55%", "stop-color": "#332a5c" }, bevelAwake);
    el("stop", { offset: "100%", "stop-color": "#130f26" }, bevelAwake);

    // One directional light source across the whole ring: a warm glare
    // upper-left, a soft shadow lower-right — so the stonework reads with
    // real highlight/shadow contrast instead of flat, even illumination.
    const ringHi = el("radialGradient", { id: "ringHighlight", cx: "50%", cy: "50%", r: "50%" }, defs);
    el("stop", { offset: "0%", "stop-color": "rgba(255,238,196,0.4)" }, ringHi);
    el("stop", { offset: "100%", "stop-color": "rgba(255,238,196,0)" }, ringHi);
    const ringSh = el("radialGradient", { id: "ringShadow", cx: "50%", cy: "50%", r: "50%" }, defs);
    el("stop", { offset: "0%", "stop-color": "rgba(0,0,0,0.5)" }, ringSh);
    el("stop", { offset: "100%", "stop-color": "rgba(0,0,0,0)" }, ringSh);

    // circular path for the engraved law (rendered twice, top and bottom arcs)
    el("path", {
      id: "lawArc",
      d: `M ${CX - 411} ${CY} A 411 411 0 1 1 ${CX + 411} ${CY} A 411 411 0 1 1 ${CX - 411} ${CY}`,
      fill: "none",
    }, defs);

    // Aperture mask: the stonework below is painted as solid filled discs
    // (simplest way to layer concentric rims), but plain circles have no
    // hole — left unmasked they blot out the veil canvas entirely, since
    // #ringSvg paints over #portalCanvas. Punch a hole matching the veil's
    // aperture (portal.js APERTURE = 236) so the stone reads as a true
    // ring with an open center, not a solid disc sitting over the veil.
    const apertureMask = el("mask", { id: "apertureMask", maskUnits: "userSpaceOnUse", x: "0", y: "0", width: "900", height: "900" }, defs);
    el("rect", { x: 0, y: 0, width: 900, height: 900, fill: "#fff" }, apertureMask);
    el("circle", { cx: CX, cy: CY, r: 237, fill: "#000" }, apertureMask);

    // ————— stonework: concentric rims —————
    const stone = el("g", { class: "decor", mask: "url(#apertureMask)" }, svg);
    el("circle", { cx: CX, cy: CY, r: 434, fill: "none", stroke: "rgba(232,192,106,0.22)", "stroke-width": 3 }, stone);
    el("circle", { cx: CX, cy: CY, r: 424, fill: "rgba(20,16,38,0.92)", stroke: "rgba(207,216,255,0.14)", "stroke-width": 1.5 }, stone);
    el("circle", { cx: CX, cy: CY, r: 386, fill: "none", stroke: "rgba(232,192,106,0.3)", "stroke-width": 2 }, stone);
    // band channel
    el("circle", { cx: CX, cy: CY, r: 322, fill: "rgba(13,10,30,0.9)", stroke: "rgba(207,216,255,0.12)", "stroke-width": 1.5 }, stone);
    el("circle", { cx: CX, cy: CY, r: 254, fill: "rgba(20,16,38,0.95)", stroke: "rgba(232,192,106,0.35)", "stroke-width": 2 }, stone);
    // inner rim around the aperture — the veil (canvas) lies beneath this hole
    el("circle", { cx: CX, cy: CY, r: 244, fill: "none", stroke: "rgba(232,192,106,0.5)", "stroke-width": 3 }, stone);
    el("circle", { cx: CX, cy: CY, r: 237, fill: "none", stroke: "rgba(207,216,255,0.2)", "stroke-width": 1 }, stone);

    // fine tick marks on the outer rim — 84 graduations, every 4th gilded
    for (let i = 0; i < 84; i++) {
      const deg = (i * 360) / 84;
      const [x1, y1] = polar(414, deg);
      const [x2, y2] = polar(i % 4 === 0 ? 398 : 406, deg);
      el("line", {
        x1: x1.toFixed(1), y1: y1.toFixed(1), x2: x2.toFixed(1), y2: y2.toFixed(1),
        stroke: i % 4 === 0 ? "rgba(232,192,106,0.4)" : "rgba(207,216,255,0.18)",
        "stroke-width": i % 4 === 0 ? 2 : 1,
      }, stone);
    }

    // seven faint spokes of the heptagonal geometry, engraved in the stone
    for (let k = 0; k < WARDS; k++) {
      const deg = -90 + ((k + 0.5) * 360) / WARDS;
      const [x1, y1] = polar(330, deg);
      const [x2, y2] = polar(384, deg);
      el("line", {
        x1: x1.toFixed(1), y1: y1.toFixed(1), x2: x2.toFixed(1), y2: y2.toFixed(1),
        stroke: "rgba(207,216,255,0.1)", "stroke-width": 6,
      }, stone);
    }

    // mounting rivets bolting the outer plate down — functional hardware,
    // not just ornament, evenly set but reading as engineered fastenings
    for (let i = 0; i < 16; i++) {
      const deg = (i * 360) / 16 + 11;
      const [x, y] = polar(409, deg);
      el("circle", { cx: x.toFixed(1), cy: y.toFixed(1), r: 3.2, class: "rim-rivet" }, stone);
    }

    // irregular tarnish: a handful of localized, unevenly-sized blotches —
    // never a uniform tint — scattered on the outer plate as if age and
    // handling settled unevenly across the stone
    const TARNISH = [
      [40, 405, 30, 0.16], [205, 396, 22, 0.12], [260, 418, 34, 0.14],
      [318, 402, 18, 0.1], [140, 420, 26, 0.13], [-30, 398, 20, 0.11],
      [-110, 412, 28, 0.15], [172, 388, 16, 0.09],
    ];
    for (const [deg, r, size, a] of TARNISH) {
      const [x, y] = polar(r, deg);
      el("ellipse", {
        cx: x.toFixed(1), cy: y.toFixed(1),
        rx: size.toFixed(1), ry: (size * 0.62).toFixed(1),
        transform: `rotate(${(deg * 1.7).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})`,
        fill: `rgba(18,22,14,${a})`,
      }, stone);
    }

    // ————— the engraved law —————
    const law = el("text", { class: "ring-engraving decor" }, svg);
    const tp = el("textPath", { href: "#lawArc", startOffset: "0%" }, law);
    tp.textContent =
      "· UNDER THE SEVEN WARDS THE WAY IS WRITTEN · WHAT THE RING REMEMBERS THE RING MAY RECALL ";

    // ————— the seven wards —————
    const wards = [];
    const wardLayer = el("g", { class: "decor" }, svg);
    for (let k = 0; k < WARDS; k++) {
      const deg = -90 + ((k + 0.5) * 360) / WARDS;
      const [x, y] = polar(WARD_R, deg);
      const g = el("g", { class: "ward", transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(deg + 90).toFixed(1)})` }, wardLayer);
      // pointed lozenge frame (a warded "eye" of cut stone)
      el("path", { class: "ward-frame", d: "M 0 -30 L 17 0 L 0 30 L -17 0 Z" }, g);
      el("path", { class: "ward-frame", d: "M 0 -22 L 12 0 L 0 22 L -12 0 Z", "stroke-width": "1" }, g);
      const gem = el("circle", { class: "ward-gem", cx: 0, cy: 0, r: 8.5 }, g);
      el("circle", { class: "ward-flare", cx: 0, cy: 0, r: 16, fill: "rgba(255,233,176,0.85)", stroke: "none" }, g);
      wards.push({ g, gem });
    }

    // ————— the turning band of sigils —————
    const band = el("g", { id: "band" }, svg);
    const sigilNodes = [];
    for (let i = 0; i < SLOTS; i++) {
      const deg = -90 + i * SLOT_DEG;
      const [x, y] = polar(BAND_R, deg);
      // orient each sigil radially so whichever stands at the zenith reads upright
      const g = el("g", {
        class: "sigil",
        "data-index": i,
        transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(deg + 90).toFixed(1)}) scale(0.52) translate(-50 -50)`,
      }, band);
      el("circle", { class: "sigil-hit", cx: 50, cy: 50, r: 52 }, g);
      glyphs.sigilInto(g, i, "sigil-art", "sigil-star");
      const title = el("title", null, g);
      title.textContent = `${glyphs.SIGILS[i].name}, ${glyphs.SIGILS[i].epithet}`;
      sigilNodes.push(g);
    }

    // slot separators on the band channel
    const bandDecor = el("g", { class: "decor" }, band);
    for (let i = 0; i < SLOTS; i++) {
      const deg = -90 + (i + 0.5) * SLOT_DEG;
      const [x1, y1] = polar(262, deg);
      const [x2, y2] = polar(316, deg);
      el("line", {
        x1: x1.toFixed(1), y1: y1.toFixed(1), x2: x2.toFixed(1), y2: y2.toFixed(1),
        stroke: "rgba(207,216,255,0.1)", "stroke-width": 1.5,
      }, bandDecor);
    }

    // ————— the Crown Lens (fixed, at the zenith) —————
    const lensLayer = el("g", { class: "decor" }, svg);
    const [lx, ly] = polar(BAND_R, -90);
    // pointed gothic frame around the zenith slot
    el("path", {
      class: "lens-frame",
      d: `M ${lx - 40} ${ly + 12} Q ${lx - 40} ${ly - 34} ${lx} ${ly - 52} Q ${lx + 40} ${ly - 34} ${lx + 40} ${ly + 12} Q ${lx + 40} ${ly + 44} ${lx} ${ly + 50} Q ${lx - 40} ${ly + 44} ${lx - 40} ${ly + 12} Z`,
      "fill-opacity": 0,
    }, lensLayer);
    el("circle", { cx: lx, cy: ly - 60, r: 4, fill: "#e8c06a" }, lensLayer);

    // lens flash group: shows a bright copy of the just-graven sigil
    const lensFlash = el("g", {
      id: "lensFlash",
      class: "decor",
      transform: `translate(${lx} ${ly}) scale(0.62) translate(-50 -50)`,
    }, svg);

    // ————— one directional light across the whole plate —————
    // Sits above the stone/wards/band so highlight and shadow read
    // consistently across every mounted piece, not just the base rim.
    const lightLayer = el("g", { class: "decor", mask: "url(#apertureMask)" }, svg);
    el("ellipse", {
      cx: CX - 150, cy: CY - 170, rx: 300, ry: 260,
      fill: "url(#ringHighlight)", style: "mix-blend-mode:screen",
    }, lightLayer);
    el("ellipse", {
      cx: CX + 160, cy: CY + 180, rx: 320, ry: 270,
      fill: "url(#ringShadow)", style: "mix-blend-mode:multiply",
    }, lightLayer);

    // ————— the Keystone —————
    const keystone = el("g", { id: "keystone", role: "button", tabindex: "-1" }, svg);
    el("circle", { class: "keystone-boss", cx: CX, cy: CY, r: 86 }, keystone);
    for (let i = 0; i < 6; i++) {
      const [rx, ry] = polar(78, i * 60 - 90);
      el("circle", { cx: rx.toFixed(1), cy: ry.toFixed(1), r: 3, class: "keystone-rivet" }, keystone);
    }
    el("circle", { class: "keystone-star", cx: CX, cy: CY, r: 70, "stroke-width": 1 }, keystone);
    el("path", { class: "keystone-star", d: heptagramPath(62) }, keystone);
    el("circle", { class: "keystone-star", cx: CX, cy: CY, r: 12 }, keystone);
    const ktitle = el("title", null, keystone);
    ktitle.textContent = "The Keystone";

    // ————— band rotation —————
    let bandRot = 0;
    let animating = false;

    function setBandRot(deg) {
      bandRot = deg;
      band.setAttribute("transform", `rotate(${deg.toFixed(3)} ${CX} ${CY})`);
    }

    function easeInOutCubic(k) {
      return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    }

    /** Rotate the band so sigil `index` stands beneath the Crown Lens. */
    function rotateToSigil(index, opts) {
      opts = opts || {};
      const target = -index * SLOT_DEG; // slot i at zenith when rot ≡ −i·slot
      let delta = ((target - bandRot) % 360 + 540) % 360 - 180; // shortest path
      if (Math.abs(delta) < 0.01) return Promise.resolve(0);
      const dist = Math.abs(delta);
      let dur = opts.duration != null ? opts.duration : 0.85 + dist / 120; // seconds
      if (reducedMotion) dur = Math.min(dur, 0.4);
      return new Promise(resolve => {
        const from = bandRot;
        const start = performance.now();
        animating = true;
        function step(now) {
          const k = Math.min(1, (now - start) / (dur * 1000));
          setBandRot(from + delta * easeInOutCubic(k));
          if (k < 1) window.SIDEREUM.frameTick(step);
          else { animating = false; resolve(dur); }
        }
        window.SIDEREUM.frameTick(step);
      });
    }

    // ————— wards —————
    function igniteWard(k, swift) {
      const w = wards[k];
      w.g.classList.remove("is-swift");
      if (swift) w.g.classList.add("is-swift");
      // retrigger the flare animation
      w.g.classList.remove("is-lit");
      void w.g.getBoundingClientRect();
      w.g.classList.add("is-lit");
    }

    function dimWard(k) {
      wards[k].g.classList.remove("is-lit", "is-swift");
    }

    function litCount() {
      return wards.filter(w => w.g.classList.contains("is-lit")).length;
    }

    // ————— lens flash —————
    function flashLens(sigilIndex, swift) {
      while (lensFlash.firstChild) lensFlash.removeChild(lensFlash.firstChild);
      glyphs.sigilInto(lensFlash, sigilIndex, "lens-flash-art", "lens-flash-star");
      lensFlash.classList.remove("flare", "flare-swift");
      void lensFlash.getBoundingClientRect();
      lensFlash.classList.add(swift ? "flare-swift" : "flare");
    }

    // ————— keystone —————
    function keystoneAwake(on) { keystone.classList.toggle("is-awake", !!on); }
    function keystoneHidden(on) { keystone.classList.toggle("is-hidden", !!on); }

    return {
      wards, sigilNodes, keystone,
      rotateToSigil, igniteWard, dimWard, litCount,
      flashLens, keystoneAwake, keystoneHidden,
      isAnimating: () => animating,
    };
  }

  window.SIDEREUM = window.SIDEREUM || {};
  window.SIDEREUM.ring = { Ring };
})();
