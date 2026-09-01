// PERPETUA — audio.js
// Densely layered synthesized Web Audio. Three mix layers under a master:
//   ambient   — boiler-room texture: breathing low noise, escapement tick,
//               occasional distant clank from the works
//   mechanism — card clacks, ratchet trains, mill whir, steam chuff
//   bell      — the proving bell (one low blow at breakthrough)
// Everything is defensive: with no AudioContext the page runs silent.
'use strict';

const PAUDIO = (() => {
  let ctx = null, master = null;
  const layers = {};          // ambient, mechanism, bell -> GainNode
  let noiseBuf = null;
  let ambientOn = false;
  let ambientNodes = [];
  let tickTimer = null, clankTimer = null;
  let buildupNodes = null, activeNodes = null;
  const levels = { master: 0.8, ambient: 0.6, mechanism: 0.8, bell: 0.9 };

  function makeNoise() {
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume().catch(() => {}); return true; }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = levels.master;
      master.connect(ctx.destination);
      for (const name of ['ambient', 'mechanism', 'bell']) {
        const g = ctx.createGain();
        g.gain.value = levels[name];
        g.connect(master);
        layers[name] = g;
      }
      noiseBuf = makeNoise();
      return true;
    } catch (e) { ctx = null; return false; }
  }

  function setLevels(vals) {
    Object.assign(levels, vals);
    if (!ctx) return;
    master.gain.value = levels.master;
    for (const k of ['ambient', 'mechanism', 'bell']) layers[k].gain.value = levels[k];
  }

  // -- small helpers ---------------------------------------------------------
  function burst(layer, { freq = 1800, q = 6, dur = 0.05, gain = 0.5, type = 'bandpass', when = 0 }) {
    if (!ctx) return;
    const t = ctx.currentTime + when;
    const src = ctx.createBufferSource(); src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f); f.connect(g); g.connect(layers[layer]);
    src.start(t); src.stop(t + dur + 0.05);
  }
  function blip(layer, { freq = 900, dur = 0.03, gain = 0.15, type = 'sine', when = 0 }) {
    if (!ctx) return;
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(layers[layer]);
    o.start(t); o.stop(t + dur + 0.05);
  }

  // -- ambient ---------------------------------------------------------------
  function startAmbient() {
    if (!ctx || ambientOn) return;
    ambientOn = true;
    // breathing boiler: looped noise -> lowpass -> slow LFO on gain
    const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 160; lp.Q.value = 0.5;
    const g = ctx.createGain(); g.gain.value = 0.10;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.11;
    const lfoG = ctx.createGain(); lfoG.gain.value = 0.035;
    lfo.connect(lfoG); lfoG.connect(g.gain);
    src.connect(lp); lp.connect(g); g.connect(layers.ambient);
    src.start(); lfo.start();
    ambientNodes = [src, lfo];
    // escapement tick, 72 to the minute, tick-tock alternation
    let tock = false;
    tickTimer = setInterval(() => {
      if (!ctx || ctx.state !== 'running') return;
      burst('ambient', { freq: tock ? 2600 : 3400, q: 9, dur: 0.018, gain: 0.16 });
      blip('ambient', { freq: tock ? 520 : 660, dur: 0.02, gain: 0.03 });
      tock = !tock;
    }, 833);
    // distant clank from the works, every 6–15 s
    const clank = () => {
      if (ctx && ctx.state === 'running') {
        burst('ambient', { freq: 420 + Math.random() * 500, q: 14, dur: 0.4, gain: 0.06, when: 0 });
        burst('ambient', { freq: 900 + Math.random() * 700, q: 10, dur: 0.25, gain: 0.03, when: 0.06 });
      }
      clankTimer = setTimeout(clank, 6000 + Math.random() * 9000);
    };
    clankTimer = setTimeout(clank, 4000);
  }

  // -- one-shots -------------------------------------------------------------
  // card feed: clack-CLACK (leading edge, then the punch stations passing the pins)
  function cardClack() {
    burst('mechanism', { freq: 1500, q: 5, dur: 0.03, gain: 0.5 });
    burst('mechanism', { freq: 2100, q: 6, dur: 0.05, gain: 0.65, when: 0.07 });
    blip('mechanism', { freq: 140, dur: 0.06, gain: 0.20, type: 'triangle', when: 0.07 });
  }
  // value-wheel ratchet: a short train of pawls seating
  function ratchet(n = 6, span = 0.30) {
    for (let i = 0; i < n; i++) {
      const frac = i / Math.max(1, n - 1);
      burst('mechanism', { freq: 2400 + 300 * (i % 3), q: 8, dur: 0.02, gain: 0.28, when: frac * span });
    }
    blip('mechanism', { freq: 220, dur: 0.08, gain: 0.12, type: 'triangle', when: span });
  }
  // steam relief on disengage
  function chuff() {
    if (!ctx) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource(); src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 0.7;
    f.frequency.setValueAtTime(1400, t);
    f.frequency.exponentialRampToValueAtTime(180, t + 0.7);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    src.connect(f); f.connect(g); g.connect(layers.mechanism);
    src.start(t); src.stop(t + 0.9);
    burst('mechanism', { freq: 800, q: 2, dur: 0.3, gain: 0.2, when: 0.5, type: 'highpass' });
  }
  // the proving bell: one low blow, inharmonic partials, long decay
  function bell() {
    if (!ctx) return;
    const t = ctx.currentTime;
    const partials = [[98, 0.5], [198, 0.28], [290, 0.16], [408, 0.10], [532, 0.05]];
    for (const [f0, a] of partials) {
      const o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.value = f0 * (1 + (Math.random() - 0.5) * 0.004);
      const g = ctx.createGain();
      g.gain.setValueAtTime(a, t);
      g.gain.exponentialRampToValueAtTime(0.0008, t + 3.2 + f0 / 400);
      o.connect(g); g.connect(layers.bell);
      o.start(t); o.stop(t + 4.5);
    }
    burst('bell', { freq: 2200, q: 1.5, dur: 0.02, gain: 0.35, type: 'highpass' });
  }
  // interlock refusal: a governor stuck against its stop, three dull knocks
  function refusal() {
    for (let i = 0; i < 3; i++) {
      blip('mechanism', { freq: 82, dur: 0.11, gain: 0.4, type: 'square', when: i * 0.16 });
      burst('mechanism', { freq: 600, q: 4, dur: 0.05, gain: 0.2, when: i * 0.16 });
    }
  }

  // -- mill run-up (buildup) -------------------------------------------------
  function buildupStart(durMs) {
    if (!ctx) return;
    stopBuildup();
    const t = ctx.currentTime, dur = durMs / 1000;
    const o = ctx.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(34, t);
    o.frequency.exponentialRampToValueAtTime(110, t + dur);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 3;
    f.frequency.setValueAtTime(160, t);
    f.frequency.exponentialRampToValueAtTime(1300, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.02, t);
    g.gain.linearRampToValueAtTime(0.30, t + dur);
    o.connect(f); f.connect(g); g.connect(layers.mechanism);
    o.start(t);
    // accelerating gear-tooth click train
    const clicks = [];
    let acc = 0, iv = 150;
    while (acc < durMs) { clicks.push(acc / 1000); acc += iv; iv = Math.max(34, iv * 0.86); }
    for (const w of clicks) burst('mechanism', { freq: 1900, q: 7, dur: 0.02, gain: 0.16, when: w });
    buildupNodes = { o, g, f };
  }
  function stopBuildup() {
    if (!buildupNodes || !ctx) { buildupNodes = null; return; }
    const t = ctx.currentTime;
    try {
      buildupNodes.g.gain.cancelScheduledValues(t);
      buildupNodes.g.gain.setValueAtTime(buildupNodes.g.gain.value, t);
      buildupNodes.g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      buildupNodes.o.stop(t + 0.3);
    } catch (e) {}
    buildupNodes = null;
  }

  // -- sustained active ------------------------------------------------------
  function activeStart() {
    if (!ctx || activeNodes) return;
    const t = ctx.currentTime;
    const o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = 55;
    const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = 55.8;
    const o3 = ctx.createOscillator(); o3.type = 'triangle'; o3.frequency.value = 110.3;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, t);
    g.gain.exponentialRampToValueAtTime(0.16, t + 0.6);
    const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 340; bp.Q.value = 2.5;
    const ng = ctx.createGain(); ng.gain.value = 0.05;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.4;
    const lfoG = ctx.createGain(); lfoG.gain.value = 0.02;
    lfo.connect(lfoG); lfoG.connect(ng.gain);
    o1.connect(g); o2.connect(g); o3.connect(g);
    src.connect(bp); bp.connect(ng); ng.connect(layers.mechanism);
    g.connect(layers.mechanism);
    o1.start(); o2.start(); o3.start(); src.start(); lfo.start();
    activeNodes = { stop() {
      const tt = ctx.currentTime;
      try {
        g.gain.cancelScheduledValues(tt); g.gain.setValueAtTime(g.gain.value, tt);
        g.gain.exponentialRampToValueAtTime(0.001, tt + 0.4);
        ng.gain.setValueAtTime(ng.gain.value, tt);
        ng.gain.linearRampToValueAtTime(0, tt + 0.4);
        for (const n of [o1, o2, o3, src, lfo]) n.stop(tt + 0.5);
      } catch (e) {}
    } };
  }
  function activeStop() { if (activeNodes) { activeNodes.stop(); activeNodes = null; } }

  return {
    init, setLevels, startAmbient,
    cardClack, ratchet, chuff, bell, refusal,
    buildupStart, stopBuildup, activeStart, activeStop,
    get ready() { return !!ctx; }
  };
})();
window.PAUDIO = PAUDIO;
