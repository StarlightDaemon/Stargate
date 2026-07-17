/* Heliacal Ring — portal effects.
   Canvas 2D renderer for the event surface inside the ring: breach surge,
   open shimmering conduit, collapse — plus the fullscreen probe-transit
   tunnel. The portal canvas sits UNDER the gate SVG, visible through the
   ring's transparent centre. */

window.HG = window.HG || {};

HG.portal = (function () {
  "use strict";

  const canvas = document.getElementById("portal-canvas");
  const g2 = canvas.getContext("2d");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // opening radius in gate viewBox units (see gate.js) / 1000
  const R_FRAC = 0.31;

  let W = 0, dpr = 1, R = 0, C = 0;
  let mode = "off";        // off | surge | open | collapse
  let modeStart = 0;       // wall-clock start of current mode
  let t = 0;               // seconds since mode start
  let hue = 190;
  let hostile = false;
  let sparks = [];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    W = Math.max(2, Math.floor(rect.width));
    canvas.width = W * dpr;
    canvas.height = W * dpr;
    g2.setTransform(dpr, 0, 0, dpr, 0, 0);
    C = W / 2;
    R = W * R_FRAC;
  }

  function setDestination(h, isHostile) {
    hue = h;
    hostile = !!isHostile;
  }

  function begin(newMode) {
    mode = newMode;
    modeStart = performance.now();
    t = 0;
    if (newMode === "open") sparks = [];
  }

  function surgeStart() { begin("surge"); }
  function openNow()    { begin("open"); }
  function collapseStart() { begin("collapse"); }
  function off() { begin("off"); g2.clearRect(0, 0, W, W); }

  function isOpen() { return mode === "open"; }
  function currentMode() { return mode; }

  /* ---- drawing helpers ---------------------------------------------------- */

  function clipCircle(r) {
    g2.save();
    g2.beginPath();
    g2.arc(C, C, r, 0, Math.PI * 2);
    g2.clip();
  }

  function baseFill(r, bright) {
    const grad = g2.createRadialGradient(C, C, 0, C, C, r);
    grad.addColorStop(0, `hsla(${hue}, 85%, ${38 + bright * 22}%, 1)`);
    grad.addColorStop(0.55, `hsla(${hue}, 80%, ${20 + bright * 14}%, 1)`);
    grad.addColorStop(1, `hsla(${hue + 15}, 70%, ${8 + bright * 6}%, 1)`);
    g2.fillStyle = grad;
    g2.fillRect(C - r, C - r, r * 2, r * 2);
  }

  function ripples(r, time, strength) {
    g2.globalCompositeOperation = "lighter";
    const systems = [
      { freq: 0.16, speed: 2.6, off: 0.0, width: 2.5 },
      { freq: 0.30, speed: -1.7, off: 2.1, width: 1.8 },
      { freq: 0.08, speed: 1.1, off: 4.2, width: 4.0 }
    ];
    for (const s of systems) {
      for (let rr = 8; rr < r; rr += 11) {
        const a = 0.5 + 0.5 * Math.sin(rr * s.freq - time * s.speed + s.off);
        const alpha = a * a * 0.085 * strength;
        if (alpha < 0.012) continue;
        g2.strokeStyle = `hsla(${hue + 20 * Math.sin(rr * 0.03 + time * 0.4)}, 90%, 70%, ${alpha})`;
        g2.lineWidth = s.width;
        g2.beginPath();
        g2.arc(C, C, rr, 0, Math.PI * 2);
        g2.stroke();
      }
    }
    g2.globalCompositeOperation = "source-over";
  }

  function caustics(r, time, strength) {
    g2.globalCompositeOperation = "lighter";
    for (let i = 0; i < 7; i++) {
      const orbit = r * (0.25 + 0.45 * ((i * 0.37) % 1));
      const ang = time * (0.15 + i * 0.05) * (i % 2 ? 1 : -1) + i * 1.9;
      const bx = C + Math.cos(ang) * orbit;
      const by = C + Math.sin(ang) * orbit * (0.85 + 0.15 * Math.sin(time * 0.3 + i));
      const br = r * (0.12 + 0.10 * Math.sin(time * 0.5 + i * 2.2));
      const grad = g2.createRadialGradient(bx, by, 0, bx, by, Math.max(4, br));
      grad.addColorStop(0, `hsla(${hue + 10}, 95%, 82%, ${0.10 * strength})`);
      grad.addColorStop(1, "transparent");
      g2.fillStyle = grad;
      g2.fillRect(bx - br, by - br, br * 2, br * 2);
    }
    g2.globalCompositeOperation = "source-over";
  }

  function rimGlow(r, strength) {
    g2.globalCompositeOperation = "lighter";
    const grad = g2.createRadialGradient(C, C, r * 0.82, C, C, r);
    grad.addColorStop(0, "transparent");
    grad.addColorStop(0.85, `hsla(${hue}, 95%, 70%, ${0.22 * strength})`);
    grad.addColorStop(1, `hsla(${hue}, 100%, 85%, ${0.4 * strength})`);
    g2.fillStyle = grad;
    g2.fillRect(C - r, C - r, r * 2, r * 2);
    g2.globalCompositeOperation = "source-over";
  }

  function glints(r, dt) {
    if (!reduced && Math.random() < dt * 24) {
      const a = Math.random() * Math.PI * 2;
      const d = Math.sqrt(Math.random()) * r * 0.92;
      sparks.push({
        x: C + Math.cos(a) * d,
        y: C + Math.sin(a) * d,
        life: 0.35 + Math.random() * 0.4,
        max: 0.75
      });
    }
    g2.globalCompositeOperation = "lighter";
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.life -= dt;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }
      const k = s.life / s.max;
      g2.fillStyle = `hsla(${hue}, 100%, 92%, ${k * 0.7})`;
      g2.fillRect(s.x - 1, s.y - 1, 2.2, 2.2);
    }
    g2.globalCompositeOperation = "source-over";
  }

  /* ---- mode renderers ------------------------------------------------------ */

  function renderOpen(dt) {
    const breathe = 0.5 + 0.5 * Math.sin(t * 0.6);
    clipCircle(R);
    baseFill(R, 0.15 + breathe * 0.1);
    ripples(R, t, 1);
    caustics(R, t, 1);
    glints(R, dt);
    rimGlow(R, 0.8 + breathe * 0.3);
    g2.restore();
  }

  function renderSurge() {
    // 0.0–0.55s: eruption outward past the rim
    // 0.55–1.1s: overshoot bloom with radial spikes
    // 1.1–1.9s: retraction into the flat event surface
    const DUR = 1.9;
    const p = Math.min(1, t / DUR);

    let reach; // how far the plume extends past the opening
    if (p < 0.29) {
      reach = easeOut(p / 0.29) * 1.55;
    } else if (p < 0.58) {
      reach = 1.55 - easeInOut((p - 0.29) / 0.29) * 0.25;
    } else {
      reach = 1.3 - easeInOut((p - 0.58) / 0.42) * 0.3;
    }
    const rr = R * Math.max(0.2, reach);

    clipCircle(R * 1.6); // allow the plume to spill past the ring opening
    const coreL = 60 + 35 * Math.max(0, 1 - p * 1.4);
    const grad = g2.createRadialGradient(C, C, 0, C, C, rr);
    grad.addColorStop(0, `hsla(${hue}, 100%, ${coreL}%, 0.98)`);
    grad.addColorStop(0.6, `hsla(${hue}, 95%, ${coreL * 0.65}%, 0.9)`);
    grad.addColorStop(1, "transparent");
    g2.fillStyle = grad;
    g2.fillRect(C - rr, C - rr, rr * 2, rr * 2);

    // radial spikes during the bloom
    if (p > 0.12 && p < 0.75) {
      const spikeK = Math.sin(((p - 0.12) / 0.63) * Math.PI);
      g2.globalCompositeOperation = "lighter";
      for (let i = 0; i < 14; i++) {
        const a = i * (Math.PI * 2 / 14) + t * 2.2;
        const len = rr * (0.75 + 0.5 * Math.sin(i * 3.3 + t * 9));
        g2.strokeStyle = `hsla(${hue}, 100%, 88%, ${0.30 * spikeK})`;
        g2.lineWidth = 5 + 5 * spikeK;
        g2.lineCap = "round";
        g2.beginPath();
        g2.moveTo(C + Math.cos(a) * rr * 0.15, C + Math.sin(a) * rr * 0.15);
        g2.lineTo(C + Math.cos(a) * len, C + Math.sin(a) * len);
        g2.stroke();
      }
      g2.globalCompositeOperation = "source-over";
    }
    g2.restore();

    if (p >= 1) begin("open");
  }

  function renderCollapse(dt) {
    const DUR = 0.85;
    const p = Math.min(1, t / DUR);
    const rr = R * (1 - easeInOut(p));

    if (rr > 2) {
      clipCircle(R);
      baseFill(rr > R ? R : rr, 0.4 + p * 0.5);
      // draw only inside the shrinking disc
      g2.beginPath();
      g2.arc(C, C, rr, 0, Math.PI * 2);
      g2.clip();
      ripples(rr, t * 3, 1.3);
      rimGlow(rr, 1.4);
      g2.restore();

      // clear outside the shrinking disc
      g2.save();
      g2.beginPath();
      g2.arc(C, C, R + 2, 0, Math.PI * 2);
      g2.arc(C, C, Math.max(0, rr), 0, Math.PI * 2, true);
      g2.clip();
      g2.clearRect(0, 0, W, W);
      g2.restore();
    }

    if (p >= 1) {
      off();
      if (onCollapsed) { const f = onCollapsed; onCollapsed = null; f(); }
    }
  }

  let onCollapsed = null;
  function collapseThen(cb) { onCollapsed = cb; collapseStart(); }

  function easeOut(x)   { return 1 - Math.pow(1 - x, 3); }
  function easeInOut(x) { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }

  function render(dt) {
    if (mode === "off") return;
    t = (performance.now() - modeStart) / 1000;
    g2.clearRect(0, 0, W, W);
    if (mode === "open") renderOpen(dt);
    else if (mode === "surge") renderSurge();
    else if (mode === "collapse") renderCollapse(dt);
  }

  /* ---- probe transit tunnel (fullscreen overlay) --------------------------- */

  const overlay = document.getElementById("tunnel-overlay");
  const tCanvas = document.getElementById("tunnel-canvas");
  const tg = tCanvas.getContext("2d");
  const label = document.getElementById("tunnel-label");
  let tunnelActive = false;

  function tunnel(destName, destHue, onDone) {
    if (tunnelActive) return;
    tunnelActive = true;

    const TW = window.innerWidth, TH = window.innerHeight;
    tCanvas.width = TW; tCanvas.height = TH;
    const cx = TW / 2, cy = TH / 2;

    const streaks = [];
    for (let i = 0; i < 260; i++) {
      streaks.push({
        a: Math.random() * Math.PI * 2,
        d: Math.random() * 1,          // 0 = centre, 1 = edge
        speed: 0.5 + Math.random() * 1.6,
        w: 0.6 + Math.random() * 1.8
      });
    }

    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add("show"));
    label.textContent = `PROBE IN TRANSIT — ${destName}`;

    const DUR = reduced ? 1.2 : 2.6;
    const start = performance.now();

    // interval-driven (not rAF) so the transit still completes — and the
    // telemetry callback still fires — if the tab is hidden mid-flight
    const iv = setInterval(frame, 16);

    function frame() {
      const el = (performance.now() - start) / 1000;
      const p = Math.min(1, el / DUR);
      const accel = 0.4 + p * 2.4;

      tg.fillStyle = "rgba(0,2,6,0.32)";
      tg.fillRect(0, 0, TW, TH);

      const maxR = Math.hypot(cx, cy);
      for (const s of streaks) {
        s.d += s.speed * accel * 0.010;
        if (s.d > 1) { s.d = Math.random() * 0.15; s.a = Math.random() * Math.PI * 2; }
        const r0 = Math.pow(s.d, 2.2) * maxR;
        const r1 = Math.pow(Math.min(1, s.d + 0.05 * accel), 2.2) * maxR;
        const light = 60 + s.d * 35;
        tg.strokeStyle = `hsla(${destHue}, 90%, ${light}%, ${0.25 + s.d * 0.6})`;
        tg.lineWidth = s.w * (0.5 + s.d * 2);
        tg.beginPath();
        tg.moveTo(cx + Math.cos(s.a) * r0, cy + Math.sin(s.a) * r0);
        tg.lineTo(cx + Math.cos(s.a) * r1, cy + Math.sin(s.a) * r1);
        tg.stroke();
      }

      // core glow
      const glow = tg.createRadialGradient(cx, cy, 0, cx, cy, 130 + p * 60);
      glow.addColorStop(0, `hsla(${destHue}, 100%, 88%, 0.5)`);
      glow.addColorStop(1, "transparent");
      tg.fillStyle = glow;
      tg.fillRect(cx - 250, cy - 250, 500, 500);

      if (el >= DUR) {
        clearInterval(iv);
        overlay.classList.remove("show");
        setTimeout(() => {
          overlay.hidden = true;
          tunnelActive = false;
          if (onDone) onDone();
        }, 380);
      }
    }
  }

  window.addEventListener("resize", resize);
  resize();

  return {
    resize, render, setDestination,
    surgeStart, openNow, collapseThen, off,
    isOpen, currentMode, tunnel
  };
})();
