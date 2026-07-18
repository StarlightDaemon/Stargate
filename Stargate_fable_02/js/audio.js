/* Heliacal Ring — procedural sound engine.
   Everything is synthesized with the Web Audio API at runtime: no audio
   files, no fetches. The context is created lazily on the first user
   gesture (browser autoplay policy). */

window.HG = window.HG || {};

HG.audio = (function () {
  "use strict";

  let ctx = null;
  let master = null;
  let muted = true;

  // long-lived nodes
  let idleNodes = null;      // ambient station hum
  let servo = null;          // ring-rotation motor loop
  let portalNodes = null;    // open-conduit shimmer/drone
  let portalFilter = null;   // lowpass used to muffle behind the shield

  let noiseBuf = null;

  function ensure() {
    if (ctx) {
      if (ctx.state === "suspended") ctx.resume();
      return true;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.6;
    master.connect(ctx.destination);
    noiseBuf = makeNoise(2.0);
    startIdleHum();
    startServo();
    return true;
  }

  function makeNoise(seconds) {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  function noiseSource() {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    return src;
  }

  function env(gainNode, t0, points) {
    // points: [ [dt, value], ... ] linear ramps from t0
    const g = gainNode.gain;
    g.cancelScheduledValues(t0);
    g.setValueAtTime(points[0][1], t0 + points[0][0]);
    for (let i = 1; i < points.length; i++) {
      g.linearRampToValueAtTime(points[i][1], t0 + points[i][0]);
    }
  }

  /* ---- persistent layers ------------------------------------------------ */

  function startIdleHum() {
    const g = ctx.createGain();
    g.gain.value = 0.05;
    g.connect(master);

    const o1 = ctx.createOscillator();
    o1.type = "sine"; o1.frequency.value = 48;
    const g1 = ctx.createGain(); g1.gain.value = 0.7;
    o1.connect(g1).connect(g);

    const o2 = ctx.createOscillator();
    o2.type = "triangle"; o2.frequency.value = 96.3;
    const g2 = ctx.createGain(); g2.gain.value = 0.22;
    o2.connect(g2).connect(g);

    const n = noiseSource();
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 190; lp.Q.value = 0.5;
    const gn = ctx.createGain(); gn.gain.value = 0.16;
    n.connect(lp).connect(gn).connect(g);

    // slow breathing on the hum
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoG = ctx.createGain(); lfoG.gain.value = 0.014;
    lfo.connect(lfoG).connect(g.gain);

    o1.start(); o2.start(); n.start(); lfo.start();
    idleNodes = { g };
  }

  function startServo() {
    const g = ctx.createGain();
    g.gain.value = 0;
    g.connect(master);

    const o = ctx.createOscillator();
    o.type = "sawtooth"; o.frequency.value = 55;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass"; bp.frequency.value = 420; bp.Q.value = 2.2;
    o.connect(bp).connect(g);

    const n = noiseSource();
    const nf = ctx.createBiquadFilter();
    nf.type = "bandpass"; nf.frequency.value = 900; nf.Q.value = 1.2;
    const ng = ctx.createGain(); ng.gain.value = 0.3;
    n.connect(nf).connect(ng).connect(g);

    o.start(); n.start();
    servo = { g, o, bp };
  }

  /* speed: 0..1 angular speed of the ring; call every frame while dialing */
  function servoSet(speed) {
    if (!ctx || !servo) return;
    const t = ctx.currentTime;
    const target = Math.min(1, Math.max(0, speed));
    servo.g.gain.setTargetAtTime(target * 0.09, t, 0.06);
    servo.o.frequency.setTargetAtTime(45 + target * 60, t, 0.08);
    servo.bp.frequency.setTargetAtTime(320 + target * 700, t, 0.08);
  }

  function portalStart(hostile) {
    if (!ctx || portalNodes) return;
    const g = ctx.createGain();
    g.gain.value = 0;

    portalFilter = ctx.createBiquadFilter();
    portalFilter.type = "lowpass";
    portalFilter.frequency.value = 20000;
    g.connect(portalFilter).connect(master);

    // watery shimmer: high, slowly trembling filtered noise
    const n = noiseSource();
    const hp = ctx.createBiquadFilter();
    hp.type = "bandpass"; hp.frequency.value = hostile ? 700 : 1400; hp.Q.value = 0.8;
    const ng = ctx.createGain(); ng.gain.value = 0.20;
    n.connect(hp).connect(ng).connect(g);
    const trem = ctx.createOscillator(); trem.frequency.value = 0.9;
    const tremG = ctx.createGain(); tremG.gain.value = 0.08;
    trem.connect(tremG).connect(ng.gain);

    // chorused low drone
    const drone = ctx.createGain(); drone.gain.value = 0.32;
    for (const f of hostile ? [82, 82.7, 123] : [110, 110.6, 165.2]) {
      const o = ctx.createOscillator();
      o.type = "sine"; o.frequency.value = f;
      const og = ctx.createGain(); og.gain.value = 0.33;
      o.connect(og).connect(drone);
      o.start();
    }
    drone.connect(g);

    n.start(); trem.start();
    g.gain.setTargetAtTime(0.5, ctx.currentTime, 0.8);
    portalNodes = { g };
  }

  function portalStop() {
    if (!ctx || !portalNodes) return;
    const g = portalNodes.g;
    g.gain.setTargetAtTime(0, ctx.currentTime, 0.25);
    setTimeout(() => { try { g.disconnect(); } catch (e) {} }, 1500);
    portalNodes = null;
    portalFilter = null;
  }

  function portalMuffle(on) {
    if (!ctx || !portalFilter) return;
    portalFilter.frequency.setTargetAtTime(on ? 260 : 20000, ctx.currentTime, 0.2);
  }

  /* ---- one-shots --------------------------------------------------------- */

  function blip(freq, dur, vol, type) {
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = type || "square"; o.frequency.value = freq;
    const g = ctx.createGain();
    env(g, t, [[0, 0], [0.006, vol], [dur, 0]]);
    o.connect(g).connect(master);
    o.start(t); o.stop(t + dur + 0.05);
  }

  function uiClick()  { blip(3400, 0.035, 0.06, "square"); }
  function uiDeny()   { blip(220, 0.12, 0.08, "sawtooth"); }

  function chevronLock() {
    if (!ctx) return;
    const t = ctx.currentTime;

    // mechanical clank: bright noise burst
    const n = noiseSource();
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass"; bp.frequency.value = 1900; bp.Q.value = 1.4;
    const g1 = ctx.createGain();
    env(g1, t, [[0, 0], [0.004, 0.5], [0.14, 0]]);
    n.connect(bp).connect(g1).connect(master);
    n.start(t); n.stop(t + 0.25);

    // heavy thump underneath
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(95, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.22);
    const g2 = ctx.createGain();
    env(g2, t, [[0, 0], [0.008, 0.55], [0.28, 0]]);
    o.connect(g2).connect(master);
    o.start(t); o.stop(t + 0.35);

    // confirmation chime
    blip(880, 0.10, 0.05, "sine");
  }

  function dialFail() {
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(420, t);
    o.frequency.exponentialRampToValueAtTime(105, t + 0.7);
    const g = ctx.createGain();
    env(g, t, [[0, 0], [0.01, 0.14], [0.75, 0]]);
    o.connect(g).connect(master);
    o.start(t); o.stop(t + 0.8);
    for (let i = 0; i < 3; i++) {
      setTimeout(() => blip(190, 0.09, 0.09, "square"), 120 * i);
    }
  }

  function surge() {
    if (!ctx) return;
    const t = ctx.currentTime;

    // rushing noise sweep
    const n = noiseSource();
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.Q.value = 1.1;
    lp.frequency.setValueAtTime(180, t);
    lp.frequency.exponentialRampToValueAtTime(6800, t + 0.5);
    lp.frequency.exponentialRampToValueAtTime(900, t + 1.7);
    const g = ctx.createGain();
    env(g, t, [[0, 0], [0.35, 0.65], [0.8, 0.5], [1.9, 0]]);
    n.connect(lp).connect(g).connect(master);
    n.start(t); n.stop(t + 2.0);

    // sub-bass drop
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(130, t);
    o.frequency.exponentialRampToValueAtTime(28, t + 1.1);
    const g2 = ctx.createGain();
    env(g2, t, [[0, 0], [0.06, 0.6], [1.3, 0]]);
    o.connect(g2).connect(master);
    o.start(t); o.stop(t + 1.4);

    // crystalline strike
    for (const [f, d] of [[1320, 0.5], [1980, 0.7], [2640, 0.9]]) {
      const s = ctx.createOscillator();
      s.type = "sine"; s.frequency.value = f;
      const sg = ctx.createGain();
      env(sg, t + 0.12, [[0, 0], [0.01, 0.05], [d, 0]]);
      s.connect(sg).connect(master);
      s.start(t + 0.12); s.stop(t + 0.12 + d + 0.1);
    }
  }

  function collapse() {
    if (!ctx) return;
    const t = ctx.currentTime;
    const n = noiseSource();
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.Q.value = 1.5;
    lp.frequency.setValueAtTime(4200, t);
    lp.frequency.exponentialRampToValueAtTime(120, t + 0.85);
    const g = ctx.createGain();
    env(g, t, [[0, 0], [0.03, 0.45], [0.9, 0]]);
    n.connect(lp).connect(g).connect(master);
    n.start(t); n.stop(t + 1.0);

    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(300, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.8);
    const g2 = ctx.createGain();
    env(g2, t, [[0, 0], [0.02, 0.4], [0.85, 0]]);
    o.connect(g2).connect(master);
    o.start(t); o.stop(t + 0.9);
  }

  function irisMove() {
    if (!ctx) return;
    const t = ctx.currentTime;
    const n = noiseSource();
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass"; bp.Q.value = 2.5;
    bp.frequency.setValueAtTime(3000, t);
    bp.frequency.exponentialRampToValueAtTime(750, t + 0.85);
    const g = ctx.createGain();
    env(g, t, [[0, 0], [0.05, 0.22], [0.85, 0.14], [1.0, 0]]);
    n.connect(bp).connect(g).connect(master);
    n.start(t); n.stop(t + 1.1);
    setTimeout(() => {
      if (!ctx) return;
      const t2 = ctx.currentTime;
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(120, t2);
      o.frequency.exponentialRampToValueAtTime(60, t2 + 0.15);
      const g2 = ctx.createGain();
      env(g2, t2, [[0, 0], [0.006, 0.4], [0.18, 0]]);
      o.connect(g2).connect(master);
      o.start(t2); o.stop(t2 + 0.25);
    }, 900);
  }

  function irisThud() {
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(70, t);
    o.frequency.exponentialRampToValueAtTime(34, t + 0.3);
    const g = ctx.createGain();
    env(g, t, [[0, 0], [0.005, 0.7], [0.4, 0]]);
    o.connect(g).connect(master);
    o.start(t); o.stop(t + 0.5);

    const n = noiseSource();
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 500;
    const g2 = ctx.createGain();
    env(g2, t, [[0, 0], [0.004, 0.3], [0.16, 0]]);
    n.connect(lp).connect(g2).connect(master);
    n.start(t); n.stop(t + 0.25);
  }

  function probeLaunch() {
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(2200, t + 1.4);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = 3000; lp.Q.value = 3;
    const g = ctx.createGain();
    env(g, t, [[0, 0], [0.15, 0.12], [1.4, 0.18], [1.9, 0]]);
    o.connect(lp).connect(g).connect(master);
    o.start(t); o.stop(t + 2.0);

    const n = noiseSource();
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass"; hp.frequency.value = 1200;
    const g2 = ctx.createGain();
    env(g2, t, [[0, 0], [0.5, 0.1], [1.6, 0.22], [2.2, 0]]);
    n.connect(hp).connect(g2).connect(master);
    n.start(t); n.stop(t + 2.3);
  }

  function alarm() {
    if (!ctx) return;
    for (let i = 0; i < 4; i++) {
      setTimeout(() => { blip(660, 0.16, 0.1, "square"); }, i * 380);
      setTimeout(() => { blip(495, 0.16, 0.1, "square"); }, i * 380 + 190);
    }
  }

  function telemetryTick() { blip(1560, 0.04, 0.045, "sine"); }

  /* ---- control ----------------------------------------------------------- */

  function setMuted(m) {
    muted = m;
    if (ctx && master) {
      master.gain.setTargetAtTime(muted ? 0 : 0.6, ctx.currentTime, 0.1);
    }
  }
  function isMuted() { return muted; }

  return {
    ensure, setMuted, isMuted,
    servoSet, portalStart, portalStop, portalMuffle,
    uiClick, uiDeny, chevronLock, dialFail, surge, collapse,
    irisMove, irisThud, probeLaunch, alarm, telemetryTick
  };
})();
