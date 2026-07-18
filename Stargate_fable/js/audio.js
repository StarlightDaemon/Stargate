// ============================================================
// audio.js — fully synthesized sound design (Web Audio API).
// No audio files, no network fetches: every sound is built from
// oscillators and shaped noise at runtime.
// ============================================================

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this._noise = null;      // shared noise buffer
    this._hum = null;        // idle machine hum {nodes, gain}
    this._spin = null;       // ring-rotation servo loop
    this._horizon = null;    // open-conduit shimmer loop
  }

  // Must be called from a user gesture at least once.
  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.9;
      this.master.connect(this.ctx.destination);
      this._noise = this._makeNoise();
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    return true;
  }

  setMuted(m) {
    this.muted = m;
    if (this.master)
      this.master.gain.linearRampToValueAtTime(m ? 0 : 0.9, this.ctx.currentTime + 0.1);
  }

  _makeNoise() {
    const len = this.ctx.sampleRate * 2;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  _noiseSource(loop = true) {
    const src = this.ctx.createBufferSource();
    src.buffer = this._noise;
    src.loop = loop;
    return src;
  }

  // ---------- ambient hum (idle machinery) ----------
  humStart() {
    if (!this.ensure() || this._hum) return;
    const t = this.ctx.currentTime;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.05, t + 2);
    const o1 = this.ctx.createOscillator();
    o1.type = "sine"; o1.frequency.value = 54;
    const o2 = this.ctx.createOscillator();
    o2.type = "triangle"; o2.frequency.value = 108.5;
    const og2 = this.ctx.createGain(); og2.gain.value = 0.35;
    const n = this._noiseSource();
    const nf = this.ctx.createBiquadFilter();
    nf.type = "lowpass"; nf.frequency.value = 220;
    const ng = this.ctx.createGain(); ng.gain.value = 0.25;
    // slow breathing on the hum level
    const lfo = this.ctx.createOscillator(); lfo.frequency.value = 0.11;
    const lfoG = this.ctx.createGain(); lfoG.gain.value = 0.015;
    lfo.connect(lfoG); lfoG.connect(g.gain);
    o1.connect(g); o2.connect(og2); og2.connect(g);
    n.connect(nf); nf.connect(ng); ng.connect(g);
    g.connect(this.master);
    o1.start(); o2.start(); n.start(); lfo.start();
    this._hum = { g, stopAll: () => { o1.stop(); o2.stop(); n.stop(); lfo.stop(); } };
  }

  // ---------- ring rotation servo ----------
  spinStart() {
    if (!this.ensure() || this._spin) return;
    const t = this.ctx.currentTime;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.11, t + 0.18);
    const o = this.ctx.createOscillator();
    o.type = "sawtooth"; o.frequency.value = 46;
    const of = this.ctx.createBiquadFilter();
    of.type = "lowpass"; of.frequency.value = 320; of.Q.value = 4;
    const n = this._noiseSource();
    const nf = this.ctx.createBiquadFilter();
    nf.type = "bandpass"; nf.frequency.value = 700; nf.Q.value = 1.2;
    const ng = this.ctx.createGain(); ng.gain.value = 0.5;
    // grinding LFO on the bandpass
    const lfo = this.ctx.createOscillator(); lfo.frequency.value = 9;
    const lfoG = this.ctx.createGain(); lfoG.gain.value = 180;
    lfo.connect(lfoG); lfoG.connect(nf.frequency);
    o.connect(of); of.connect(g);
    n.connect(nf); nf.connect(ng); ng.connect(g);
    g.connect(this.master);
    o.start(); n.start(); lfo.start();
    this._spin = { g, stopAll: () => { o.stop(); n.stop(); lfo.stop(); } };
  }

  spinStop() {
    if (!this._spin) return;
    const s = this._spin; this._spin = null;
    const t = this.ctx.currentTime;
    s.g.gain.cancelScheduledValues(t);
    s.g.gain.setValueAtTime(s.g.gain.value, t);
    s.g.gain.linearRampToValueAtTime(0, t + 0.22);
    setTimeout(() => s.stopAll(), 400);
  }

  // ---------- clamp seating: heavy thunk ----------
  clunk() {
    if (!this.ensure()) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(170, t);
    o.frequency.exponentialRampToValueAtTime(38, t + 0.22);
    const og = this.ctx.createGain();
    og.gain.setValueAtTime(0.55, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    const n = this._noiseSource(false);
    const nf = this.ctx.createBiquadFilter();
    nf.type = "lowpass"; nf.frequency.value = 900;
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.3, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    o.connect(og); og.connect(this.master);
    n.connect(nf); nf.connect(ng); ng.connect(this.master);
    o.start(t); o.stop(t + 0.35); n.start(t); n.stop(t + 0.15);
  }

  // ---------- per-sigil confirmation chime ----------
  chime(step) {
    if (!this.ensure()) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = 470 + step * 55;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + 0.55);
  }

  // ---------- conduit ignition surge ----------
  burst() {
    if (!this.ensure()) return;
    const t = this.ctx.currentTime;
    // rushing noise sweep
    const n = this._noiseSource(false);
    const f = this.ctx.createBiquadFilter();
    f.type = "lowpass"; f.Q.value = 1.4;
    f.frequency.setValueAtTime(160, t);
    f.frequency.exponentialRampToValueAtTime(7500, t + 0.55);
    f.frequency.exponentialRampToValueAtTime(500, t + 1.7);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.7, t + 0.35);
    g.gain.exponentialRampToValueAtTime(0.001, t + 1.9);
    n.connect(f); f.connect(g); g.connect(this.master);
    n.start(t); n.stop(t + 2);
    // sub-bass bloom
    const o = this.ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(72, t);
    o.frequency.exponentialRampToValueAtTime(34, t + 1.2);
    const og = this.ctx.createGain();
    og.gain.setValueAtTime(0.0001, t);
    og.gain.exponentialRampToValueAtTime(0.5, t + 0.25);
    og.gain.exponentialRampToValueAtTime(0.001, t + 1.6);
    o.connect(og); og.connect(this.master);
    o.start(t); o.stop(t + 1.7);
  }

  // ---------- open conduit shimmer loop ----------
  horizonStart() {
    if (!this.ensure() || this._horizon) return;
    const t = this.ctx.currentTime;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.09, t + 1.2);
    const n = this._noiseSource();
    const nf = this.ctx.createBiquadFilter();
    nf.type = "bandpass"; nf.frequency.value = 820; nf.Q.value = 0.6;
    const lfo = this.ctx.createOscillator(); lfo.frequency.value = 0.23;
    const lfoG = this.ctx.createGain(); lfoG.gain.value = 260;
    lfo.connect(lfoG); lfoG.connect(nf.frequency);
    const o1 = this.ctx.createOscillator();
    o1.type = "sine"; o1.frequency.value = 196;
    const o2 = this.ctx.createOscillator();
    o2.type = "sine"; o2.frequency.value = 197.6; // slow beat vs o1
    const og = this.ctx.createGain(); og.gain.value = 0.22;
    n.connect(nf); nf.connect(g);
    o1.connect(og); o2.connect(og); og.connect(g);
    g.connect(this.master);
    n.start(); o1.start(); o2.start(); lfo.start();
    this._horizon = { g, stopAll: () => { n.stop(); o1.stop(); o2.stop(); lfo.stop(); } };
  }

  horizonStop() {
    if (!this._horizon) return;
    const h = this._horizon; this._horizon = null;
    const t = this.ctx.currentTime;
    h.g.gain.cancelScheduledValues(t);
    h.g.gain.setValueAtTime(h.g.gain.value, t);
    h.g.gain.linearRampToValueAtTime(0, t + 0.8);
    setTimeout(() => h.stopAll(), 1000);
  }

  // ---------- collapse / seal ----------
  seal() {
    if (!this.ensure()) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(420, t);
    o.frequency.exponentialRampToValueAtTime(36, t + 0.9);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.35, t + 0.08);
    g.gain.exponentialRampToValueAtTime(0.001, t + 1.1);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + 1.2);
    const n = this._noiseSource(false);
    const f = this.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(4000, t);
    f.frequency.exponentialRampToValueAtTime(120, t + 1);
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.25, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 1);
    n.connect(f); f.connect(ng); ng.connect(this.master);
    n.start(t); n.stop(t + 1.1);
  }

  // ---------- misc UI ----------
  click() {
    if (!this.ensure()) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    o.type = "square"; o.frequency.value = 1250;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.05, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + 0.06);
  }

  fail() {
    if (!this.ensure()) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    o.type = "square"; o.frequency.value = 96;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.12, t);
    g.gain.setValueAtTime(0.12, t + 0.3);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    const trem = this.ctx.createOscillator(); trem.frequency.value = 13;
    const tremG = this.ctx.createGain(); tremG.gain.value = 0.08;
    trem.connect(tremG); tremG.connect(g.gain);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + 0.5); trem.start(t); trem.stop(t + 0.5);
  }

  // probe entering the horizon
  plunge() {
    if (!this.ensure()) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(640, t);
    o.frequency.exponentialRampToValueAtTime(150, t + 0.35);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.2, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + 0.5);
    const n = this._noiseSource(false);
    const f = this.ctx.createBiquadFilter();
    f.type = "bandpass"; f.frequency.value = 1400; f.Q.value = 0.8;
    const ng = this.ctx.createGain();
    ng.gain.setValueAtTime(0.12, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    n.connect(f); f.connect(ng); ng.connect(this.master);
    n.start(t); n.stop(t + 0.45);
  }
}
