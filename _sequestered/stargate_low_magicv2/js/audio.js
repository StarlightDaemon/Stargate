// All sound synthesized with Web Audio. No assets, no network.
// Every call is safe to make before the context exists or while suspended:
// the state machine never depends on sound having played.

let ctx = null;
let master = null;
let wayHum = null;

export function wake() {
  // Call from a real user gesture. Harmless to call repeatedly.
  try {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.55;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  } catch (e) { /* audio unavailable; the tower keeps working */ }
}

function now() { return ctx ? ctx.currentTime : 0; }
function ok() { return ctx && ctx.state === 'running'; }

// A bell is a stack of inharmonic partials. The tierce sits a minor third
// over the prime, which is what makes a bell sound like a bell.
const PARTIALS = [
  { r: 0.5,  g: 0.55, d: 4.5 },  // hum
  { r: 1.0,  g: 1.0,  d: 2.8 },  // prime
  { r: 1.19, g: 0.65, d: 1.9 },  // tierce
  { r: 1.51, g: 0.3,  d: 1.3 },  // quint
  { r: 2.0,  g: 0.45, d: 1.1 },  // nominal
  { r: 2.66, g: 0.18, d: 0.6 },
];

export function bell(freq, { gain = 1, decay = 1, detune = 0 } = {}) {
  if (!ok()) return;
  const t = now();
  const out = ctx.createGain();
  out.gain.value = 0.34 * gain;
  out.connect(master);
  for (const p of PARTIALS) {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = freq * p.r * (1 + detune * (Math.random() - 0.5) * 0.004);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(p.g, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0004, t + p.d * decay);
    o.connect(g); g.connect(out);
    o.start(t); o.stop(t + p.d * decay + 0.1);
  }
  // strike transient
  const n = noiseBurst(0.04, 0.5 * gain);
  if (n) n.connect(out);
}

export function chimeStrike(freq) {
  // A clapper tap against a hanging bell: brighter, shorter, quieter.
  bell(freq, { gain: 0.7, decay: 0.45, detune: 1 });
}

export function toll(freq) { bell(freq, { gain: 1.25, decay: 1.5 }); }

export function jow() {
  // A false change: the near-unison beat of bells struck out of turn.
  if (!ok()) return;
  [196, 202.5, 246.9, 251.1].forEach((f, i) =>
    setTimeout(() => bell(f, { gain: 0.5, decay: 0.9 }), i * 55));
}

function noiseBurst(dur, gain) {
  if (!ok()) return null;
  const t = now();
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const g = ctx.createGain();
  g.gain.value = gain;
  src.connect(g);
  src.start(t);
  return g;
}

export function clunk() {
  if (!ok()) return;
  const t = now();
  const o = ctx.createOscillator();
  o.type = 'triangle';
  o.frequency.setValueAtTime(140, t);
  o.frequency.exponentialRampToValueAtTime(55, t + 0.09);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.5, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
  o.connect(g); g.connect(master);
  o.start(t); o.stop(t + 0.2);
  const n = noiseBurst(0.03, 0.35); if (n) n.connect(master);
}

export function ratchet() {
  if (!ok()) return;
  const n = noiseBurst(0.02, 0.5); if (!n) return;
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass'; f.frequency.value = 2400; f.Q.value = 2;
  n.disconnect(); n.connect(f); f.connect(master);
  clunkLow(0.12);
}

function clunkLow(g) {
  const t = now();
  const o = ctx.createOscillator();
  o.type = 'square'; o.frequency.value = 95;
  const gg = ctx.createGain();
  gg.gain.setValueAtTime(g, t);
  gg.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
  o.connect(gg); gg.connect(master);
  o.start(t); o.stop(t + 0.08);
}

export function creak(len = 0.7) {
  if (!ok()) return;
  const t = now();
  const o = ctx.createOscillator();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(310, t);
  o.frequency.linearRampToValueAtTime(180 + Math.random() * 90, t + len);
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass'; f.frequency.value = 700; f.Q.value = 9;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.05, t + len * 0.3);
  g.gain.linearRampToValueAtTime(0.0001, t + len);
  o.connect(f); f.connect(g); g.connect(master);
  o.start(t); o.stop(t + len + 0.05);
}

export function slam() {
  if (!ok()) return;
  const t = now();
  const o = ctx.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(70, t);
  o.frequency.exponentialRampToValueAtTime(32, t + 0.25);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.9, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
  o.connect(g); g.connect(master);
  o.start(t); o.stop(t + 0.6);
  const n = noiseBurst(0.1, 0.6); if (n) n.connect(master);
}

export function humStart(dark = false) {
  if (!ok() || wayHum) return;
  const o1 = ctx.createOscillator();
  const o2 = ctx.createOscillator();
  o1.type = 'sine'; o2.type = 'sine';
  o1.frequency.value = dark ? 49 : 98;
  o2.frequency.value = dark ? 49.7 : 99.1; // slow beat between the pair
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, now());
  g.gain.linearRampToValueAtTime(dark ? 0.12 : 0.07, now() + 2);
  o1.connect(g); o2.connect(g); g.connect(master);
  o1.start(); o2.start();
  wayHum = { o1, o2, g };
}

export function humStop() {
  if (!wayHum) return;
  const { o1, o2, g } = wayHum;
  wayHum = null;
  try {
    g.gain.linearRampToValueAtTime(0.0001, now() + 1.2);
    o1.stop(now() + 1.4); o2.stop(now() + 1.4);
  } catch (e) { /* already gone */ }
}
