// Sound: mains hum, heterodyne search whistle, mechanical clicks,
// presel servo whirr, doorway bloom. AudioContext is created only on the
// first real user gesture; everything degrades silently without it.

let ac = null, master = null;
let hum = null, humGain = null;
let het = null, hetGain = null;
let whirr = null, whirrGain = null;

export function ensureAudio() {
  if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
  try { ac = new (window.AudioContext || window.webkitAudioContext)(); }
  catch { return; }
  master = ac.createGain();
  master.gain.value = 0.5;
  master.connect(ac.destination);

  hum = ac.createOscillator(); hum.type = 'sine'; hum.frequency.value = 60;
  const hum2 = ac.createOscillator(); hum2.type = 'sine'; hum2.frequency.value = 120;
  humGain = ac.createGain(); humGain.gain.value = 0;
  const hum2g = ac.createGain(); hum2g.gain.value = 0.35;
  hum.connect(humGain); hum2.connect(hum2g).connect(humGain);
  humGain.connect(master);
  hum.start(); hum2.start();

  het = ac.createOscillator(); het.type = 'triangle'; het.frequency.value = 200;
  hetGain = ac.createGain(); hetGain.gain.value = 0;
  het.connect(hetGain).connect(master);
  het.start();

  whirr = ac.createOscillator(); whirr.type = 'sawtooth'; whirr.frequency.value = 84;
  whirrGain = ac.createGain(); whirrGain.gain.value = 0;
  const whirrFilt = ac.createBiquadFilter();
  whirrFilt.type = 'lowpass'; whirrFilt.frequency.value = 500;
  whirr.connect(whirrFilt).connect(whirrGain).connect(master);
  whirr.start();
}

// called every render tick with current sim reads
export function updateContinuous({ lineFrac, err, searching, slewing }) {
  if (!ac) return;
  const T = ac.currentTime;
  humGain.gain.setTargetAtTime(0.014 * lineFrac, T, 0.15);
  if (searching && err < 1.6) {
    het.frequency.setTargetAtTime(36 + err * 430, T, 0.03);
    hetGain.gain.setTargetAtTime(0.016 * (1 - err / 1.6), T, 0.06);
  } else {
    hetGain.gain.setTargetAtTime(0, T, 0.08);
  }
  whirrGain.gain.setTargetAtTime(slewing ? 0.03 : 0, T, 0.05);
  if (slewing) whirr.frequency.setTargetAtTime(84 + Math.sin(T * 30) * 8, T, 0.05);
}

function noiseBurst(dur, freq, q, gain) {
  if (!ac) return;
  const n = ac.sampleRate * dur;
  const buf = ac.createBuffer(1, n, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = ac.createBufferSource(); src.buffer = buf;
  const f = ac.createBiquadFilter(); f.type = 'bandpass';
  f.frequency.value = freq; f.Q.value = q;
  const g = ac.createGain(); g.gain.value = gain;
  src.connect(f).connect(g).connect(master);
  src.start();
}

export const clickSmall = () => noiseBurst(0.05, 2400, 2.5, 0.5);
export const clickKey   = () => noiseBurst(0.08, 1300, 3.5, 0.65);
export const clunk      = () => noiseBurst(0.14, 300, 2.2, 0.9);
export const balkThud   = () => noiseBurst(0.1, 160, 3, 0.8);

export function bloom(open) {
  if (!ac) return;
  const T = ac.currentTime;
  const o = ac.createOscillator(); o.type = 'sine';
  const g = ac.createGain();
  o.connect(g).connect(master);
  if (open) {
    o.frequency.setValueAtTime(66, T);
    o.frequency.exponentialRampToValueAtTime(170, T + 1.4);
    g.gain.setValueAtTime(0.0001, T);
    g.gain.exponentialRampToValueAtTime(0.06, T + 0.5);
    g.gain.exponentialRampToValueAtTime(0.018, T + 1.6);
    o.stop(T + 1.7);
  } else {
    o.frequency.setValueAtTime(150, T);
    o.frequency.exponentialRampToValueAtTime(56, T + 1.0);
    g.gain.setValueAtTime(0.05, T);
    g.gain.exponentialRampToValueAtTime(0.0001, T + 1.1);
    o.stop(T + 1.2);
  }
  o.start(T);
  noiseBurst(open ? 1.2 : 0.8, open ? 800 : 500, 0.8, 0.14);
}

// steady open-doorway wash, retriggered by render while portal is open
let washUntil = 0;
export function washTick(phase) {
  if (!ac || phase < 0.5) return;
  const t = performance.now();
  if (t < washUntil) return;
  washUntil = t + 900;
  noiseBurst(1.1, 420 + Math.random() * 120, 0.6, 0.035 * phase);
}
