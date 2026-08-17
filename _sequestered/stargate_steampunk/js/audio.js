/* Synthesized workshop sound. No samples, no chimes — hiss, clank,
   thunk and ratchet only. Context is created on the first genuine
   user gesture; synthetic (harness) events leave it suspended, and
   every call guards for that. */

let ctx = null, master = null, hissGain = null, shimmerGain = null;
let enabled = true;

function noiseBuffer(c) {
  const b = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

export function ensureCtx() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch (e) { return; }
    master = ctx.createGain();
    master.gain.value = enabled ? 0.5 : 0;
    master.connect(ctx.destination);

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer(ctx); noise.loop = true;

    const hf = ctx.createBiquadFilter();
    hf.type = 'lowpass'; hf.frequency.value = 1400;
    hissGain = ctx.createGain(); hissGain.gain.value = 0;
    noise.connect(hf); hf.connect(hissGain); hissGain.connect(master);

    const noise2 = ctx.createBufferSource();
    noise2.buffer = noiseBuffer(ctx); noise2.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 520; bp.Q.value = 2.2;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.23;
    const lfoG = ctx.createGain(); lfoG.gain.value = 160;
    lfo.connect(lfoG); lfoG.connect(bp.frequency); lfo.start();
    shimmerGain = ctx.createGain(); shimmerGain.gain.value = 0;
    noise2.connect(bp); bp.connect(shimmerGain); shimmerGain.connect(master);

    noise.start(); noise2.start();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
}

const ready = () => ctx && ctx.state === 'running';

export function setEnabled(on) {
  enabled = on;
  if (master) master.gain.setTargetAtTime(on ? 0.5 : 0, ctx.currentTime, 0.05);
}
export function isEnabled() { return enabled; }

export function setHiss(level) {
  if (!ready()) return;
  hissGain.gain.setTargetAtTime(Math.min(level, 1) * 0.22, ctx.currentTime, 0.15);
}
export function setShimmer(level) {
  if (!ready()) return;
  shimmerGain.gain.setTargetAtTime(Math.min(level, 1) * 0.12, ctx.currentTime, 0.2);
}

function burst(dur, freq, gain, type = 'lowpass', q = 1) {
  if (!ready()) return;
  const t = ctx.currentTime;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);
  const f = ctx.createBiquadFilter();
  f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f); f.connect(g); g.connect(master);
  src.start(t); src.stop(t + dur + 0.05);
}

function tone(freq, dur, gain, type = 'sine') {
  if (!ready()) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  o.type = type; o.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master);
  o.start(t); o.stop(t + dur + 0.05);
}

export const clank    = () => { burst(0.09, 900, 0.5, 'bandpass', 3); tone(180, 0.12, 0.18, 'triangle'); };
export const thunk    = () => { burst(0.12, 300, 0.8); tone(70, 0.15, 0.35, 'sine'); };
export const tick     = () => burst(0.03, 2400, 0.22, 'bandpass', 4);
export const flagTak  = () => { burst(0.05, 1500, 0.3, 'bandpass', 5); tone(340, 0.06, 0.1, 'square'); };
export const whoomph  = () => { tone(46, 0.9, 0.5, 'sawtooth'); burst(0.8, 220, 0.45); };
export const ventBurst= () => burst(1.4, 1000, 0.6);
export const sadThud  = () => { tone(60, 0.5, 0.4, 'sine'); burst(0.4, 160, 0.3); };
