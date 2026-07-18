/* ═══════════════════════════════════════════════════════════════════
   SIDEREUM · audio.js — the Voces Aetheris
   Entirely procedural Web Audio: dormant hum, ward chimes, the
   ignition swell, the open-way choir, and the sealing knell.
   Silent until the visitor grants the Ring its voice.
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  let ctx = null;
  let master = null;
  let enabled = false;

  let humNodes = null;     // dormant drone
  let choirNodes = null;   // open-way drone
  let sparkleTimer = null;

  function ensureCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return true;
  }

  function setEnabled(on) {
    enabled = on;
    if (on) {
      if (!ensureCtx()) { enabled = false; return false; }
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(0.85, ctx.currentTime, 0.4);
      startHum();
    } else if (ctx) {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
    }
    return enabled;
  }

  function isEnabled() { return enabled; }

  // ————— dormant hum: two detuned low oscillators, slow breathing —————

  function startHum() {
    if (!ctx || humNodes) return;
    const g = ctx.createGain();
    g.gain.value = 0.05;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 160;
    const o1 = ctx.createOscillator();
    o1.type = "sawtooth"; o1.frequency.value = 54;
    const o2 = ctx.createOscillator();
    o2.type = "sawtooth"; o2.frequency.value = 54.6;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.09;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.022;
    lfo.connect(lfoGain); lfoGain.connect(g.gain);
    o1.connect(lp); o2.connect(lp); lp.connect(g); g.connect(master);
    o1.start(); o2.start(); lfo.start();
    humNodes = { o1, o2, lfo, g, lp };
  }

  // ————— one bell-like chime per ward, pitch rising with ward index —————

  function chime(wardIndex, swift) {
    if (!enabled || !ensureCtx()) return;
    const t0 = ctx.currentTime;
    const base = 392 * Math.pow(2, wardIndex / 7); // rises across the seven wards
    const partials = swift ? [1, 2.31] : [1, 2.31, 3.72];
    const dur = swift ? 0.9 : 1.7;
    partials.forEach((ratio, i) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = base * ratio;
      const g = ctx.createGain();
      const peak = (swift ? 0.16 : 0.2) / (i + 1);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(peak, t0 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur / (i + 1));
      o.connect(g); g.connect(master);
      o.start(t0); o.stop(t0 + dur);
    });
    // a soft stone "thunk" beneath the chime
    const th = ctx.createOscillator();
    th.type = "sine"; th.frequency.setValueAtTime(95, t0);
    th.frequency.exponentialRampToValueAtTime(55, t0 + 0.18);
    const tg = ctx.createGain();
    tg.gain.setValueAtTime(0.14, t0);
    tg.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.28);
    th.connect(tg); tg.connect(master);
    th.start(t0); th.stop(t0 + 0.3);
  }

  // ————— band-turn whisper: filtered noise while the ring rotates —————

  function noiseBuffer(seconds) {
    const len = Math.max(1, Math.floor(ctx.sampleRate * seconds));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  function turnWhisper(seconds) {
    if (!enabled || !ensureCtx()) return;
    const t0 = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(seconds + 0.1);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass"; bp.frequency.value = 480; bp.Q.value = 2.2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.05, t0 + 0.15);
    g.gain.setValueAtTime(0.05, t0 + Math.max(0.15, seconds - 0.25));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
    src.connect(bp); bp.connect(g); g.connect(master);
    src.start(t0); src.stop(t0 + seconds + 0.1);
  }

  // ————— ignition: rising sweep + noise bloom, then the choir —————

  function ignition() {
    if (!enabled || !ensureCtx()) return;
    const t0 = ctx.currentTime;
    // rising glissando
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(160, t0);
    o.frequency.exponentialRampToValueAtTime(1180, t0 + 1.25);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.0001, t0);
    og.gain.exponentialRampToValueAtTime(0.22, t0 + 0.9);
    og.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.7);
    o.connect(og); og.connect(master);
    o.start(t0); o.stop(t0 + 1.8);
    // noise bloom
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(2);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass"; bp.Q.value = 1.1;
    bp.frequency.setValueAtTime(240, t0);
    bp.frequency.exponentialRampToValueAtTime(3800, t0 + 1.3);
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.0001, t0);
    ng.gain.exponentialRampToValueAtTime(0.3, t0 + 1.15);
    ng.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.9);
    src.connect(bp); bp.connect(ng); ng.connect(master);
    src.start(t0); src.stop(t0 + 2);
  }

  // ————— the open-way choir: a soft sustained triad with slow shimmer —————

  function startChoir() {
    if (!enabled || !ensureCtx() || choirNodes) return;
    const t0 = ctx.currentTime;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.075, t0 + 1.8);
    g.connect(master);
    const freqs = [220, 277.18, 329.63, 440]; // A3, C#4, E4, A4 — a raised, luminous chord
    const oscs = freqs.map((f, i) => {
      const o = ctx.createOscillator();
      o.type = i === 3 ? "triangle" : "sine";
      o.frequency.value = f;
      o.detune.value = (i - 1.5) * 4;
      const og = ctx.createGain();
      og.gain.value = 0.25 / (i * 0.6 + 1);
      o.connect(og); og.connect(g);
      o.start(t0);
      return { o, og };
    });
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.13;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.02;
    lfo.connect(lfoGain); lfoGain.connect(g.gain);
    lfo.start(t0);
    choirNodes = { g, oscs, lfo };

    sparkleTimer = setInterval(() => {
      if (!enabled || !choirNodes) return;
      if (Math.random() < 0.6) sparkle();
    }, 2600);
  }

  function sparkle() {
    const t0 = ctx.currentTime;
    const f = 1200 + Math.random() * 2200;
    const o = ctx.createOscillator();
    o.type = "sine"; o.frequency.value = f;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.05, t0 + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.9);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + 1);
  }

  function stopChoir() {
    if (sparkleTimer) { clearInterval(sparkleTimer); sparkleTimer = null; }
    if (!choirNodes || !ctx) { choirNodes = null; return; }
    const t0 = ctx.currentTime;
    const nodes = choirNodes;
    choirNodes = null;
    nodes.g.gain.cancelScheduledValues(t0);
    nodes.g.gain.setTargetAtTime(0.0001, t0, 0.35);
    setTimeout(() => {
      try {
        nodes.oscs.forEach(n => n.o.stop());
        nodes.lfo.stop();
        nodes.g.disconnect();
      } catch (e) { /* already stopped */ }
    }, 2000);
  }

  // ————— the sealing knell: descending sweep + low thud —————

  function sealing() {
    if (!enabled || !ensureCtx()) return;
    const t0 = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(880, t0);
    o.frequency.exponentialRampToValueAtTime(110, t0 + 1.15);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.0001, t0);
    og.gain.exponentialRampToValueAtTime(0.16, t0 + 0.12);
    og.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.3);
    o.connect(og); og.connect(master);
    o.start(t0); o.stop(t0 + 1.4);

    const th = ctx.createOscillator();
    th.type = "sine";
    th.frequency.setValueAtTime(72, t0 + 1.05);
    th.frequency.exponentialRampToValueAtTime(40, t0 + 1.5);
    const tg = ctx.createGain();
    tg.gain.setValueAtTime(0.0001, t0 + 1.05);
    tg.gain.exponentialRampToValueAtTime(0.3, t0 + 1.1);
    tg.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.9);
    th.connect(tg); tg.connect(master);
    th.start(t0 + 1.05); th.stop(t0 + 2);
  }

  // ————— soft error tone for a refused action —————

  function refusal() {
    if (!enabled || !ensureCtx()) return;
    const t0 = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = "triangle";
    o.frequency.setValueAtTime(196, t0);
    o.frequency.setValueAtTime(185, t0 + 0.12);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.07, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.4);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + 0.45);
  }

  window.SIDEREUM = window.SIDEREUM || {};
  window.SIDEREUM.audio = {
    setEnabled, isEnabled,
    chime, turnWhisper, ignition, startChoir, stopChoir, sealing, refusal,
  };
})();
