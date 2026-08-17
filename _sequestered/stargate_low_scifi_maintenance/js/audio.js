// All sound is synthesized with Web Audio — no assets.
// The palette is mechanical: detents, relays, motors, air.

let ctx = null;
let master = null;
let noiseBuf = null;

// continuous layers
let busHum = null;
let compLayer = null;
let carrierLayer = null;

export function ensureAudio() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);

    const len = ctx.sampleRate * 1.5;
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function haveCtx() { return ctx && ctx.state === 'running'; }

function noiseHit({ dur = 0.05, freq = 3000, q = 1, gain = 0.2, type = 'bandpass', when = 0 }) {
  if (!haveCtx()) return;
  const t = ctx.currentTime + when;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(master);
  src.start(t); src.stop(t + dur + 0.02);
}

function thump({ freq = 90, dur = 0.09, gain = 0.3, when = 0 }) {
  if (!haveCtx()) return;
  const t = ctx.currentTime + when;
  const o = ctx.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(freq, t);
  o.frequency.exponentialRampToValueAtTime(freq * 0.55, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master);
  o.start(t); o.stop(t + dur + 0.02);
}

export const audio = {
  init: ensureAudio,

  // -- one-shots ------------------------------------------------
  tick(when = 0) {           // thumbwheel / relay wiper detent
    noiseHit({ dur: 0.018, freq: 4200, q: 2.5, gain: 0.14, when });
  },
  snap() {                   // toggle bat
    noiseHit({ dur: 0.03, freq: 2600, q: 1.5, gain: 0.22 });
    thump({ freq: 160, dur: 0.04, gain: 0.12 });
  },
  keyClunk() {               // key switch
    thump({ freq: 120, dur: 0.08, gain: 0.3 });
    noiseHit({ dur: 0.05, freq: 1800, q: 1, gain: 0.16, when: 0.01 });
  },
  seat(when = 0) {           // stepping relay seating
    thump({ freq: 85, dur: 0.09, gain: 0.32, when });
    noiseHit({ dur: 0.07, freq: 2400, q: 6, gain: 0.1, when: when + 0.005 });
  },
  release() {                // relay bank dropping out — fast ratchet
    for (let i = 0; i < 8; i++) this.tick(i * 0.032);
    thump({ freq: 70, dur: 0.1, gain: 0.25, when: 0.28 });
  },
  buzz() {                   // interlock refusal
    if (!haveCtx()) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'square'; o.frequency.value = 118;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.05, t);
    g.gain.setValueAtTime(0.05, t + 0.16);
    g.gain.linearRampToValueAtTime(0.0001, t + 0.19);
    o.connect(g).connect(master);
    o.start(t); o.stop(t + 0.2);
  },
  stamp() {                  // certification stamp
    thump({ freq: 65, dur: 0.11, gain: 0.34 });
    noiseHit({ dur: 0.09, freq: 900, q: 0.8, gain: 0.14, when: 0.005 });
  },
  cardSlide() {
    noiseHit({ dur: 0.16, freq: 1100, q: 0.7, gain: 0.12 });
    thump({ freq: 140, dur: 0.05, gain: 0.14, when: 0.15 });
  },
  pop() {                    // carrier film letting go
    noiseHit({ dur: 0.05, freq: 700, q: 0.8, gain: 0.2 });
    thump({ freq: 220, dur: 0.05, gain: 0.1 });
  },
  motor(dur = 0.7) {         // gang-release slew motor
    if (!haveCtx()) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(48, t);
    o.frequency.linearRampToValueAtTime(130, t + dur * 0.55);
    o.frequency.linearRampToValueAtTime(60, t + dur);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 620;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.09, t + 0.06);
    g.gain.setValueAtTime(0.09, t + dur - 0.08);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(f).connect(g).connect(master);
    o.start(t); o.stop(t + dur + 0.02);
  },
  grind(dur = 2.2) {         // gate valve travelling
    if (!haveCtx()) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf; src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 260; f.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.16, t + 0.15);
    g.gain.setValueAtTime(0.16, t + dur - 0.25);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    // slow amplitude wobble — worm gear
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 7.5;
    const lg = ctx.createGain(); lg.gain.value = 0.05;
    lfo.connect(lg).connect(g.gain);
    src.connect(f).connect(g).connect(master);
    src.start(t); src.stop(t + dur + 0.05);
    lfo.start(t); lfo.stop(t + dur + 0.05);
    thump({ freq: 60, dur: 0.12, gain: 0.28, when: dur });
  },

  // -- continuous layers ---------------------------------------
  setBusHum(on) {
    if (!haveCtx()) return;
    if (on && !busHum) {
      const g = ctx.createGain(); g.gain.value = 0;
      g.gain.linearRampToValueAtTime(0.016, ctx.currentTime + 0.6);
      const o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = 100;
      const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = 200;
      const g2 = ctx.createGain(); g2.gain.value = 0.35;
      o1.connect(g); o2.connect(g2).connect(g);
      g.connect(master);
      o1.start(); o2.start();
      busHum = { g, stop: () => { o1.stop(ctx.currentTime + 0.4); o2.stop(ctx.currentTime + 0.4); } };
    } else if (!on && busHum) {
      busHum.g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
      busHum.stop();
      busHum = null;
    }
  },
  setCompressor(on) {
    if (!haveCtx()) return;
    if (on && !compLayer) {
      const g = ctx.createGain(); g.gain.value = 0;
      g.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 1.8);
      const src = ctx.createBufferSource();
      src.buffer = noiseBuf; src.loop = true;
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.value = 420; f.Q.value = 1.2;
      const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = 46;
      const og = ctx.createGain(); og.gain.value = 0.5;
      src.connect(f).connect(g);
      o.connect(og).connect(g);
      g.connect(master);
      src.start(); o.start();
      compLayer = { g, stop: () => { src.stop(ctx.currentTime + 0.8); o.stop(ctx.currentTime + 0.8); } };
    } else if (!on && compLayer) {
      compLayer.g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.7);
      compLayer.stop();
      compLayer = null;
    }
  },
  setCarrier(on) {
    if (!haveCtx()) return;
    if (on && !carrierLayer) {
      const g = ctx.createGain(); g.gain.value = 0;
      g.gain.linearRampToValueAtTime(0.012, ctx.currentTime + 1.4);
      const src = ctx.createBufferSource();
      src.buffer = noiseBuf; src.loop = true;
      const f = ctx.createBiquadFilter();
      f.type = 'highpass'; f.frequency.value = 2400;
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.23;
      const lg = ctx.createGain(); lg.gain.value = 0.005;
      lfo.connect(lg).connect(g.gain);
      src.connect(f).connect(g).connect(master);
      src.start(); lfo.start();
      carrierLayer = { g, stop: () => { src.stop(ctx.currentTime + 0.6); lfo.stop(ctx.currentTime + 0.6); } };
    } else if (!on && carrierLayer) {
      carrierLayer.g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
      carrierLayer.stop();
      carrierLayer = null;
    }
  },
};
