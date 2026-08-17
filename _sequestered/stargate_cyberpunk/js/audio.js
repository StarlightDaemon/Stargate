// Optional noise. Off by default; the AUD toggle is the only way in.
// Mains hum that follows ring energy, relay clunks on events, CRT blips on lines.

import { S, on, energy } from './state.js';
import { now } from './clock.js';

let ac = null, humGain = null, humOsc2 = null;

function ensure() {
  if (ac) return;
  ac = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ac.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = 50;
  const osc2 = ac.createOscillator(); osc2.type = 'sine'; osc2.frequency.value = 100.4; // beat against the fundamental
  const flt = ac.createBiquadFilter(); flt.type = 'lowpass'; flt.frequency.value = 240; flt.Q.value = 2;
  humGain = ac.createGain(); humGain.gain.value = 0;
  osc.connect(flt); osc2.connect(flt); flt.connect(humGain); humGain.connect(ac.destination);
  osc.start(); osc2.start();
  humOsc2 = osc2;
}

function blip(freq = 880, dur = 0.05, vol = 0.05, type = 'square') {
  if (!ac || !S.audio) return;
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(vol, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
  o.connect(g); g.connect(ac.destination);
  o.start(); o.stop(ac.currentTime + dur + 0.02);
}

function clunk() {
  if (!ac || !S.audio) return;
  const len = ac.sampleRate * 0.09;
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  const src = ac.createBufferSource(); src.buffer = buf;
  const flt = ac.createBiquadFilter(); flt.type = 'lowpass'; flt.frequency.value = 300;
  const g = ac.createGain(); g.gain.value = 0.5;
  src.connect(flt); flt.connect(g); g.connect(ac.destination);
  src.start();
}

export function initAudio() {
  on('audio', (enabled) => {
    if (enabled) { ensure(); ac.resume(); blip(660, 0.08, 0.06); }
  });
  on('line', (text, cls) => {
    if (cls === 'warn') blip(220, 0.1, 0.06, 'sawtooth');
    else if (cls === 'hot') blip(1320, 0.12, 0.07);
    else if (cls !== 'dim') blip(980, 0.03, 0.03);
  });
  on('phase', (p) => {
    if (p === 'spool' || p === 'resume') clunk();
    if (p === 'open') { clunk(); blip(1760, 0.4, 0.05, 'sine'); }
    if (p === 'sever' || p === 'abort') clunk();
  });
}

export function renderAudio(t = now()) {
  if (!ac || !humGain) return;
  const target = S.audio ? energy(t) * 0.045 : 0;
  humGain.gain.setTargetAtTime(target, ac.currentTime, 0.15);
  if (humOsc2) humOsc2.frequency.setValueAtTime(100.4 + 3 * Math.sin(t / 700), ac.currentTime);
}
