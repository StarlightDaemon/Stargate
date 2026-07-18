/* ═══════════════════════════════════════════════════════════════════
   SIDEREUM · portal.js — the Veil
   Canvas renderer for the Ring's aperture. Coordinates use the same
   900×900 space as the SVG so the veil sits exactly inside the rim.

   Modes: dormant (faint motes), blooming, open (full veil),
   sealing (collapse). The veil itself is layered: ripple rings
   flowing outward, angular streams of starlight, orbiting star
   particles, a breathing core, and a wobbling event-horizon rim.
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  const SIZE = 900;          // logical coordinate space (matches SVG viewBox)
  const CX = 450, CY = 450;
  const APERTURE = 236;      // veil radius inside the ring's inner rim

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Palettes: [core, mid, streak, rim]
  const PALETTES = {
    charted: {
      core: "255, 244, 214", mid: "232, 192, 106",
      streak: "207, 216, 255", rim: "255, 233, 176",
    },
    uncharted: {
      core: "236, 222, 255", mid: "143, 108, 255",
      streak: "255, 158, 206", rim: "185, 165, 255",
    },
  };

  function Portal(canvas) {
    const ctx = canvas.getContext("2d");
    let dpr = 1;
    let mode = "dormant";     // dormant | blooming | open | sealing
    let modeStart = 0;        // seconds at mode entry
    let bloomDur = 1.8;
    let sealDur = 1.6;
    let palette = PALETTES.charted;
    let onSealed = null;
    let t = 0;
    let last = performance.now() / 1000;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
    }
    resize();
    window.addEventListener("resize", resize);

    // Dormant motes: slow drifting embers of starlight inside the aperture.
    const motes = [];
    for (let i = 0; i < 42; i++) {
      motes.push({
        a: Math.random() * Math.PI * 2,
        r: 20 + Math.random() * (APERTURE - 50),
        speed: 0.02 + Math.random() * 0.05,
        rise: 2 + Math.random() * 6,
        size: 0.8 + Math.random() * 1.7,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // Open-veil star particles: orbiting points with twinkle.
    const stars = [];
    for (let i = 0; i < 110; i++) {
      stars.push({
        a: Math.random() * Math.PI * 2,
        r: 18 + Math.pow(Math.random(), 0.7) * (APERTURE - 34),
        speed: (0.04 + Math.random() * 0.12) * (Math.random() < 0.5 ? 1 : -1),
        size: 0.7 + Math.random() * 2.1,
        tw: 1 + Math.random() * 3,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // Event-horizon wobble: sum of three incommensurate sines.
    function rimWobble(theta, time) {
      return (
        Math.sin(theta * 5 + time * 1.9) * 1.9 +
        Math.sin(theta * 9 - time * 1.3) * 1.2 +
        Math.sin(theta * 13 + time * 0.7) * 0.8
      );
    }

    // Veil intensity 0..1 across mode transitions.
    function veilAlpha(now) {
      if (mode === "open") return 1;
      if (mode === "blooming") {
        const k = Math.min(1, (now - modeStart) / bloomDur);
        return k * k * (3 - 2 * k); // smoothstep
      }
      if (mode === "sealing") {
        const k = Math.min(1, (now - modeStart) / sealDur);
        return 1 - k * k * (3 - 2 * k);
      }
      return 0;
    }

    // Sealing also pulls the veil inward.
    function veilScale(now) {
      if (mode === "sealing") {
        const k = Math.min(1, (now - modeStart) / sealDur);
        return 1 - 0.85 * k * k;
      }
      if (mode === "blooming") {
        const k = Math.min(1, (now - modeStart) / bloomDur);
        return 0.25 + 0.75 * (k * k * (3 - 2 * k));
      }
      return 1;
    }

    function drawDormant(scale) {
      // faint breathing pool of night at the center
      const breath = 0.5 + 0.5 * Math.sin(t * 0.45);
      const grad = ctx.createRadialGradient(CX, CY, 10, CX, CY, APERTURE);
      grad.addColorStop(0, `rgba(30, 24, 60, ${0.55 + breath * 0.12})`);
      grad.addColorStop(0.75, "rgba(13, 10, 30, 0.5)");
      grad.addColorStop(1, "rgba(7, 5, 16, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(CX, CY, APERTURE, 0, Math.PI * 2);
      ctx.fill();

      // drifting motes
      for (const m of motes) {
        const wob = Math.sin(t * m.speed * 6 + m.phase) * m.rise;
        const x = CX + Math.cos(m.a + t * m.speed) * m.r;
        const y = CY + Math.sin(m.a + t * m.speed) * m.r + wob;
        const a = 0.1 + 0.14 * (0.5 + 0.5 * Math.sin(t * 0.8 + m.phase));
        ctx.fillStyle = `rgba(207, 216, 255, ${a * scale})`;
        ctx.beginPath();
        ctx.arc(x, y, m.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function drawVeil(alpha, scale) {
      const P = palette;
      const R = APERTURE * scale;

      ctx.save();
      ctx.beginPath();
      ctx.arc(CX, CY, APERTURE, 0, Math.PI * 2);
      ctx.clip();

      // base pool
      let grad = ctx.createRadialGradient(CX, CY, 4, CX, CY, R);
      grad.addColorStop(0, `rgba(${P.core}, ${0.85 * alpha})`);
      grad.addColorStop(0.28, `rgba(${P.mid}, ${0.35 * alpha})`);
      grad.addColorStop(0.8, `rgba(20, 14, 44, ${0.85 * alpha})`);
      grad.addColorStop(1, `rgba(9, 6, 22, ${0.9 * alpha})`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(CX, CY, R, 0, Math.PI * 2);
      ctx.fill();

      if (!reducedMotion) {
        ctx.globalCompositeOperation = "lighter";

        // outward-flowing ripple rings
        const RINGS = 5;
        for (let k = 0; k < RINGS; k++) {
          const ph = ((t * 0.12 + k / RINGS) % 1);
          const rr = 20 + ph * (R - 26);
          const fade = Math.sin(ph * Math.PI); // in then out
          ctx.strokeStyle = `rgba(${P.streak}, ${0.1 * fade * alpha})`;
          ctx.lineWidth = 7 - ph * 4;
          ctx.beginPath();
          ctx.arc(CX, CY, rr, 0, Math.PI * 2);
          ctx.stroke();
        }

        // angular streams of starlight
        const STREAMS = 46;
        for (let i = 0; i < STREAMS; i++) {
          const base = (i / STREAMS) * Math.PI * 2 + t * 0.05;
          const sway = Math.sin(t * 0.9 + i * 1.7) * 0.1;
          const len = R * (0.42 + 0.5 * (0.5 + 0.5 * Math.sin(t * 0.6 + i * 2.3)));
          const a0 = base + sway;
          const inner = R * 0.1;
          const g2 = ctx.createLinearGradient(
            CX + Math.cos(a0) * inner, CY + Math.sin(a0) * inner,
            CX + Math.cos(a0) * len, CY + Math.sin(a0) * len
          );
          g2.addColorStop(0, `rgba(${P.core}, ${0.12 * alpha})`);
          g2.addColorStop(1, `rgba(${P.streak}, 0)`);
          ctx.strokeStyle = g2;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(CX + Math.cos(a0) * inner, CY + Math.sin(a0) * inner);
          const midA = a0 + sway * 1.6;
          ctx.quadraticCurveTo(
            CX + Math.cos(midA) * len * 0.55, CY + Math.sin(midA) * len * 0.55,
            CX + Math.cos(a0) * len, CY + Math.sin(a0) * len
          );
          ctx.stroke();
        }

        // orbiting stars with twinkle
        for (const s of stars) {
          if (s.r > R) continue;
          const a = s.a + t * s.speed;
          const x = CX + Math.cos(a) * s.r;
          const y = CY + Math.sin(a) * s.r;
          const twk = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * s.tw + s.phase));
          ctx.fillStyle = `rgba(${P.streak}, ${0.55 * twk * alpha})`;
          ctx.beginPath();
          ctx.arc(x, y, s.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalCompositeOperation = "source-over";
      }

      // breathing core
      const coreR = R * (0.13 + 0.02 * Math.sin(t * 1.7));
      grad = ctx.createRadialGradient(CX, CY, 0, CX, CY, coreR * 2.6);
      grad.addColorStop(0, `rgba(${P.core}, ${0.95 * alpha})`);
      grad.addColorStop(0.4, `rgba(${P.mid}, ${0.4 * alpha})`);
      grad.addColorStop(1, `rgba(${P.mid}, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(CX, CY, coreR * 2.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // event-horizon rim, wobbling
      const SEG = reducedMotion ? 40 : 96;
      ctx.strokeStyle = `rgba(${P.rim}, ${0.75 * alpha})`;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      for (let i = 0; i <= SEG; i++) {
        const th = (i / SEG) * Math.PI * 2;
        const rw = R + (reducedMotion ? 0 : rimWobble(th, t));
        const x = CX + Math.cos(th) * rw;
        const y = CY + Math.sin(th) * rw;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    let frozen = false; // dev-only: lets verification tooling halt repainting

    function frame(nowMs) {
      if (frozen) return;
      const now = nowMs / 1000;
      const dt = Math.min(0.05, now - last);
      last = now;
      t += reducedMotion ? dt * 0.35 : dt;

      const scaleToCanvas = canvas.width / SIZE;
      ctx.setTransform(scaleToCanvas, 0, 0, scaleToCanvas, 0, 0);
      ctx.clearRect(0, 0, SIZE, SIZE);

      const alpha = veilAlpha(now);
      const scale = veilScale(now);

      if (alpha <= 0.01 && mode !== "dormant") {
        if (mode === "sealing") {
          mode = "dormant";
          if (onSealed) { const cb = onSealed; onSealed = null; cb(); }
        }
      }

      if (mode === "dormant") {
        drawDormant(1);
      } else {
        // keep a hint of the dormant pool beneath the veil while it fades
        if (alpha < 0.6) drawDormant(1 - alpha);
        drawVeil(alpha, scale);
      }

      if (mode === "blooming" && now - modeStart >= bloomDur) mode = "open";

      window.SIDEREUM.frameTick(frame);
    }
    window.SIDEREUM.frameTick(frame);

    return {
      bloom(kind, dur) {
        palette = PALETTES[kind] || PALETTES.charted;
        bloomDur = reducedMotion ? Math.min(dur || 1.8, 0.8) : (dur || 1.8);
        mode = "blooming";
        modeStart = performance.now() / 1000;
      },
      freeze() { frozen = true; },
      presentOpen(kind) {
        // dev-only: jump straight to the fully open veil (no bloom)
        palette = PALETTES[kind] || PALETTES.charted;
        mode = "open";
        modeStart = 0;
      },
      seal(dur, cb) {
        sealDur = reducedMotion ? Math.min(dur || 1.6, 0.8) : (dur || 1.6);
        onSealed = cb || null;
        mode = "sealing";
        modeStart = performance.now() / 1000;
      },
      isOpen() { return mode === "open" || mode === "blooming"; },
      mode() { return mode; },
    };
  }

  // ————— page-background starfield, drawn once to a data URL —————

  function paintStarfield(el) {
    const c = document.createElement("canvas");
    c.width = 480; c.height = 480;
    const g = c.getContext("2d");
    // deterministic layout so the sky is the same on every visit
    let seed = 777;
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let i = 0; i < 130; i++) {
      const x = rnd() * 480, y = rnd() * 480;
      const r = rnd() * 1.1 + 0.2;
      const a = 0.12 + rnd() * 0.5;
      const warm = rnd() < 0.18;
      g.fillStyle = warm ? `rgba(232, 192, 106, ${a})` : `rgba(207, 216, 255, ${a})`;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
    }
    el.style.backgroundImage = `url(${c.toDataURL()})`;
  }

  window.SIDEREUM = window.SIDEREUM || {};
  window.SIDEREUM.portal = { Portal, paintStarfield, APERTURE };
})();
