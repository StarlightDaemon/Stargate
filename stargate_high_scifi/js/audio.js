// All sound is synthesized with the Web Audio API — no samples, no assets.
// The AudioContext is created lazily on the first user gesture and the
// console is silent until the operator turns sound on.

const LOCK_SCALE = [0, 2, 4, 6, 7, 9, 11, 12, 14]; // lydian ascent, one degree per invariant

class MeridianAudio {
  constructor() {
    this.ctx = null;
    this.muted = true;
    this.master = null;
    this.humGain = null;
    this.spinGain = null;
    this.spinFilter = null;
  }

  init() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    const c = this.ctx;

    this.master = c.createGain();
    this.master.gain.value = 0;
    const comp = c.createDynamicsCompressor();
    this.master.connect(comp).connect(c.destination);

    // --- artifact hum: two detuned deep sines + filtered noise bed
    this.humGain = c.createGain();
    this.humGain.gain.value = 0.14;
    this.humGain.connect(this.master);
    for (const f of [46, 46.7, 92.3]) {
      const o = c.createOscillator();
      o.frequency.value = f;
      const g = c.createGain();
      g.gain.value = f > 90 ? 0.012 : 0.05;
      o.connect(g).connect(this.humGain);
      o.start();
    }
    const noise = this.noiseSource();
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 180;
    const ng = c.createGain(); ng.gain.value = 0.02;
    noise.connect(lp).connect(ng).connect(this.humGain);

    // --- band rotation: bandpassed noise, gain driven by spin intensity
    const spinNoise = this.noiseSource();
    this.spinFilter = c.createBiquadFilter();
    this.spinFilter.type = 'bandpass';
    this.spinFilter.frequency.value = 620;
    this.spinFilter.Q.value = 2.2;
    this.spinGain = c.createGain();
    this.spinGain.gain.value = 0;
    spinNoise.connect(this.spinFilter).connect(this.spinGain).connect(this.master);
  }

  noiseSource() {
    const c = this.ctx;
    const buf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf; src.loop = true; src.start();
    return src;
  }

  setMuted(m) {
    this.muted = m;
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.15);
  }

  /** hum intensity: 0 idle .. 1 aperture open */
  setHum(v) {
    if (this.ctx) this.humGain.gain.setTargetAtTime(0.1 + v * 0.22, this.ctx.currentTime, 0.4);
  }

  /** band rotation loudness/brightness, 0..1 */
  setSpin(v) {
    if (!this.ctx) return;
    this.spinGain.gain.setTargetAtTime(v * 0.045, this.ctx.currentTime, 0.12);
    this.spinFilter.frequency.setTargetAtTime(500 + v * 1100, this.ctx.currentTime, 0.12);
  }

  env(t0, a, hold, rel, peak) {
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + a);
    g.gain.setValueAtTime(peak, t0 + a + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + hold + rel);
    g.connect(this.master);
    return g;
  }

  /** FM convergence chime for invariant i (0..8); recalled=true uses the playback timbre */
  chime(i, recalled = false) {
    if (!this.ctx || this.muted) return;
    const c = this.ctx, t = c.currentTime;
    const base = (recalled ? 523.25 : 392) * Math.pow(2, LOCK_SCALE[i] / 12);
    const car = c.createOscillator();
    car.frequency.value = base;
    const mod = c.createOscillator();
    mod.frequency.value = base * (recalled ? 3.01 : 2.01);
    const mg = c.createGain();
    mg.gain.value = recalled ? 40 : 130;
    mod.connect(mg).connect(car.frequency);
    const out = this.env(t, 0.006, recalled ? 0.01 : 0.05, recalled ? 0.18 : 0.55, recalled ? 0.12 : 0.2);
    car.connect(out);
    car.start(t); mod.start(t);
    car.stop(t + 1); mod.stop(t + 1);
  }

  /** recall memory sweep: fast shimmering gliss */
  sweep() {
    if (!this.ctx || this.muted) return;
    const c = this.ctx, t = c.currentTime;
    const o = c.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(180, t);
    o.frequency.exponentialRampToValueAtTime(2400, t + 0.9);
    const f = c.createBiquadFilter();
    f.type = 'bandpass'; f.Q.value = 9;
    f.frequency.setValueAtTime(300, t);
    f.frequency.exponentialRampToValueAtTime(3200, t + 0.9);
    const out = this.env(t, 0.03, 0.6, 0.35, 0.09);
    o.connect(f).connect(out);
    o.start(t); o.stop(t + 1.2);
  }

  ignite() {
    if (!this.ctx || this.muted) return;
    const c = this.ctx, t = c.currentTime;
    const sub = c.createOscillator();
    sub.frequency.setValueAtTime(72, t);
    sub.frequency.exponentialRampToValueAtTime(30, t + 0.9);
    sub.connect(this.env(t, 0.02, 0.25, 0.8, 0.5));
    sub.start(t); sub.stop(t + 1.3);
    const gliss = c.createOscillator();
    gliss.frequency.setValueAtTime(400, t);
    gliss.frequency.exponentialRampToValueAtTime(1900, t + 0.7);
    gliss.connect(this.env(t, 0.05, 0.2, 0.6, 0.06));
    gliss.start(t); gliss.stop(t + 1.1);
    const noise = this.noiseSource();
    const hp = c.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 900;
    const out = this.env(t, 0.25, 0.1, 0.7, 0.12);
    noise.connect(hp).connect(out);
    noise.stop(t + 1.2);
  }

  diverge() {
    if (!this.ctx || this.muted) return;
    const c = this.ctx, t = c.currentTime;
    for (const det of [0, 7]) {
      const o = c.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(196 + det, t);
      o.frequency.exponentialRampToValueAtTime(62 + det, t + 0.95);
      o.connect(this.env(t, 0.02, 0.4, 0.5, 0.11));
      o.start(t); o.stop(t + 1.1);
    }
  }

  refuse() {
    if (!this.ctx || this.muted) return;
    const c = this.ctx, t = c.currentTime;
    // three level, patient tones — the Artifact saying no, politely
    [329.6, 329.6, 246.9].forEach((f, i) => {
      const o = c.createOscillator();
      o.frequency.value = f;
      o.connect(this.env(t + i * 0.28, 0.01, 0.12, 0.2, 0.1));
      o.start(t + i * 0.28); o.stop(t + i * 0.28 + 0.5);
    });
  }

  collapse() {
    if (!this.ctx || this.muted) return;
    const c = this.ctx, t = c.currentTime;
    const o = c.createOscillator();
    o.frequency.setValueAtTime(1200, t);
    o.frequency.exponentialRampToValueAtTime(90, t + 0.55);
    o.connect(this.env(t, 0.01, 0.1, 0.5, 0.14));
    o.start(t); o.stop(t + 0.8);
  }

  click() {
    if (!this.ctx || this.muted) return;
    const c = this.ctx, t = c.currentTime;
    const o = c.createOscillator();
    o.frequency.value = 1400;
    o.connect(this.env(t, 0.001, 0.004, 0.03, 0.05));
    o.start(t); o.stop(t + 0.06);
  }

  probeBeep(n = 0) {
    if (!this.ctx || this.muted) return;
    const c = this.ctx, t = c.currentTime;
    const o = c.createOscillator();
    o.frequency.value = 880 + (n % 3) * 220;
    o.connect(this.env(t, 0.004, 0.02, 0.08, 0.06));
    o.start(t); o.stop(t + 0.15);
  }
}

export const audio = new MeridianAudio();
