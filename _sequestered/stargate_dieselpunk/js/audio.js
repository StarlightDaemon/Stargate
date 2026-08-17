// audio.js — hall sound: diesel thump, alternator whine, beat note, coder
// sidetone, arc roar, lever thunks. Built lazily on first user gesture
// (autoplay policy); tannoy horn toggles the lot.

import { S, rpmAt, kcAt, beatAt, now, KEY_DUR_S } from './sim.js';
import { clamp } from './util.js';

let ctx = null, master = null, muted = false;
let diesel, whine, beatOsc, arcNoise, sidetone;

function noiseBuffer(seconds = 2) {
  const sr = ctx.sampleRate, buf = ctx.createBuffer(1, sr * seconds, sr);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;   // brown-ish
    d[i] = last * 3.5;
  }
  return buf;
}

export function unlock() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 0.9;
  master.connect(ctx.destination);

  // diesel: brown noise, lowpassed, gain chopped at firing rate
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(); src.loop = true;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 190; lp.Q.value = 0.8;
  const g = ctx.createGain(); g.gain.value = 0;
  const lfo = ctx.createOscillator(); lfo.type = 'triangle'; lfo.frequency.value = 10;
  const lfoG = ctx.createGain(); lfoG.gain.value = 0;
  lfo.connect(lfoG); lfoG.connect(g.gain);
  src.connect(lp); lp.connect(g); g.connect(master);
  src.start(); lfo.start();
  diesel = { g, lfo, lfoG, lp };

  // alternator whine: two sines, slightly detuned
  const w1 = ctx.createOscillator(), w2 = ctx.createOscillator();
  w1.type = 'sine'; w2.type = 'sine';
  const wg = ctx.createGain(); wg.gain.value = 0;
  w1.connect(wg); w2.connect(wg); wg.connect(master);
  w1.start(); w2.start();
  whine = { w1, w2, wg };

  // beat note (aural null indicator)
  const b = ctx.createOscillator(); b.type = 'sine';
  const bg = ctx.createGain(); bg.gain.value = 0;
  b.connect(bg); bg.connect(master);
  b.start();
  beatOsc = { b, bg };

  // arc: noise through bandpass, crackly
  const an = ctx.createBufferSource(); an.buffer = noiseBuffer(1.4); an.loop = true;
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 640; bp.Q.value = 0.6;
  const ag = ctx.createGain(); ag.gain.value = 0;
  an.connect(bp); bp.connect(ag); ag.connect(master);
  an.start();
  arcNoise = { ag, bp };

  // coder sidetone
  const st = ctx.createOscillator(); st.type = 'square'; st.frequency.value = 660;
  const stg = ctx.createGain(); stg.gain.value = 0;
  const stf = ctx.createBiquadFilter(); stf.type = 'lowpass'; stf.frequency.value = 1900;
  st.connect(stf); stf.connect(stg); stg.connect(master);
  st.start();
  sidetone = { st, stg };
}

export function thunk(kind = 'lever') {
  if (!ctx) return;
  const t0 = ctx.currentTime;
  const src = ctx.createBufferSource(); src.buffer = noiseBuffer(0.2);
  const f = ctx.createBiquadFilter(); f.type = 'lowpass';
  f.frequency.value = kind === 'trip' ? 900 : 320;
  const g = ctx.createGain();
  g.gain.setValueAtTime(kind === 'trip' ? 0.7 : 0.5, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + (kind === 'trip' ? 0.28 : 0.16));
  src.connect(f); f.connect(g); g.connect(master);
  src.start(t0); src.stop(t0 + 0.3);
}

export function setMuted(m) {
  muted = m;
  if (master) master.gain.setTargetAtTime(m ? 0 : 0.9, ctx.currentTime, 0.05);
}
export function isMuted() { return muted; }

// morse-ish coder pattern scheduled at key-down
export function keySidetone() {
  if (!ctx) return;
  const t0 = ctx.currentTime;
  const pat = [1,1,0,1,0,0,1,1,1,0,1,0,0,1,0,1,1,0];
  const step = KEY_DUR_S / pat.length;
  sidetone.stg.gain.cancelScheduledValues(t0);
  for (let i = 0; i < pat.length; i++) {
    sidetone.stg.gain.setValueAtTime(pat[i] ? 0.08 : 0.0001, t0 + i * step);
  }
  sidetone.stg.gain.setValueAtTime(0.0001, t0 + KEY_DUR_S);
}

export function updateAudio(t) {
  if (!ctx || ctx.state !== 'running') return;
  const ct = ctx.currentTime;
  const rpm = rpmAt(t);

  // diesel
  const on = S.dieselOn || S.cranking;
  const fire = clamp(rpm / 60 * 2.6, 2, 40);
  diesel.lfo.frequency.setTargetAtTime(fire, ct, 0.1);
  diesel.lfoG.gain.setTargetAtTime(on ? 0.45 : 0, ct, 0.15);
  diesel.g.gain.setTargetAtTime(on ? (S.cranking && !S.dieselOn ? 0.25 : 0.5) : 0, ct, 0.25);
  diesel.lp.frequency.setTargetAtTime(150 + rpm * 0.25, ct, 0.2);

  // whine when clutched
  const wf = 40 + (rpm / 840) * 300;
  whine.w1.frequency.setTargetAtTime(wf, ct, 0.1);
  whine.w2.frequency.setTargetAtTime(wf * 2.01, ct, 0.1);
  whine.wg.gain.setTargetAtTime(S.clutch && S.dieselOn ? 0.05 + (rpm / 840) * 0.07 : 0, ct, 0.3);

  // beat note: audible while hunting, silent at null (that IS the tuning aid)
  const beat = beatAt(t);
  if (beat !== null && S.clutch && S.dieselOn && !S.latched) {
    const bf = clamp(Math.abs(beat) * 150, 1, 1000);
    beatOsc.b.frequency.setTargetAtTime(bf, ct, 0.06);
    beatOsc.bg.gain.setTargetAtTime(clamp(0.06 - Math.abs(beat) * 0.004, 0.012, 0.06), ct, 0.1);
  } else {
    beatOsc.bg.gain.setTargetAtTime(0, ct, 0.1);
  }

  // arc
  let ai = 0;
  if (S.arc === 'striking') ai = 0.5;
  else if (S.arc === 'open') ai = 0.32 + Math.random() * 0.08;
  else if (S.arc === 'collapsing') ai = 0.2;
  arcNoise.ag.gain.setTargetAtTime(ai * 0.5, ct, 0.12);
  arcNoise.bp.frequency.setTargetAtTime(500 + Math.random() * 400, ct, 0.15);
}
