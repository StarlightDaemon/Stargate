/* ============================================================
   audio.js — the voice of the Annulus.

   Everything is synthesized with the Web Audio API at runtime:
   bronze bell strikes, clockwork ratchet ticks, the standing
   drone of the vault, the Sunstrike, and the open Wellglass.
   No samples, no files, no network.
   ============================================================ */

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this._portal = null;   // handles for the open-well loop
    this._ambient = null;
  }

  /* Must be called from a user gesture. Safe to call repeatedly. */
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.9;
      this.master.connect(this.ctx.destination);
      this._startAmbient();
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    return true;
  }

  setMuted(m) {
    this.muted = m;
    if (this.master) {
      const t = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(t);
      this.master.gain.linearRampToValueAtTime(m ? 0 : 0.9, t + 0.15);
    }
  }

  get ready() { return !!this.ctx; }

  // ---------- primitives ----------

  _env(gainNode, t0, attack, peak, decay, sustain = 0) {
    const g = gainNode.gain;
    g.setValueAtTime(0.0001, t0);
    g.linearRampToValueAtTime(peak, t0 + attack);
    g.exponentialRampToValueAtTime(Math.max(sustain, 0.0001), t0 + attack + decay);
  }

  _noiseBuffer(seconds = 1) {
    if (!this._nb || this._nbLen !== seconds) {
      const len = Math.floor(this.ctx.sampleRate * seconds);
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this._nb = buf; this._nbLen = seconds;
    }
    return this._nb;
  }

  _noise(t0, dur, { type = "bandpass", freq = 1000, q = 1, peak = 0.3, attack = 0.005, sweepTo = null } = {}) {
    const src = this.ctx.createBufferSource();
    src.buffer = this._noiseBuffer(Math.max(1, dur + 0.1));
    const f = this.ctx.createBiquadFilter();
    f.type = type; f.frequency.setValueAtTime(freq, t0); f.Q.value = q;
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t0 + dur);
    const g = this.ctx.createGain();
    this._env(g, t0, attack, peak, dur - attack);
    src.connect(f).connect(g).connect(this.master);
    src.start(t0); src.stop(t0 + dur + 0.1);
  }

  _tone(t0, dur, { type = "sine", freq = 440, drop = null, peak = 0.2, attack = 0.005, detune = 0 } = {}) {
    const o = this.ctx.createOscillator();
    o.type = type; o.frequency.setValueAtTime(freq, t0); o.detune.value = detune;
    if (drop) o.frequency.exponentialRampToValueAtTime(drop, t0 + dur);
    const g = this.ctx.createGain();
    this._env(g, t0, attack, peak, dur - attack);
    o.connect(g).connect(this.master);
    o.start(t0); o.stop(t0 + dur + 0.1);
  }

  /* A struck bronze bell: a few inharmonic partials with long decay. */
  _bell(t0, base, peak = 0.14, dur = 2.2) {
    const partials = [1, 2.03, 2.94, 4.4];
    const amps = [1, 0.55, 0.3, 0.14];
    for (let i = 0; i < partials.length; i++) {
      this._tone(t0, dur * (1 - i * 0.16), {
        type: "sine", freq: base * partials[i],
        peak: peak * amps[i], attack: 0.004,
      });
    }
  }

  // ---------- ambient vault drone ----------

  _startAmbient() {
    const t = this.ctx.currentTime;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.05, t + 3);
    g.connect(this.master);

    const o1 = this.ctx.createOscillator();
    o1.type = "sine"; o1.frequency.value = 54;
    const o2 = this.ctx.createOscillator();
    o2.type = "sine"; o2.frequency.value = 54 * 1.5 + 0.7;
    const g2 = this.ctx.createGain(); g2.gain.value = 0.35;

    // Slow breathing of the drone.
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoG = this.ctx.createGain(); lfoG.gain.value = 0.02;
    lfo.connect(lfoG).connect(g.gain);

    o1.connect(g); o2.connect(g2).connect(g);
    o1.start(); o2.start(); lfo.start();
    this._ambient = { g, nodes: [o1, o2, lfo] };
  }

  // ---------- gestures of the instrument ----------

  uiTap() {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    this._noise(t, 0.06, { freq: 2600, q: 6, peak: 0.08 });
    this._tone(t, 0.09, { type: "triangle", freq: 1180, peak: 0.05 });
  }

  /* One clockwork tooth of ring rotation. `i` varies the pitch. */
  ratchet(i = 0) {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    const f = 1500 + (i % 5) * 130;
    this._noise(t, 0.045, { freq: f, q: 9, peak: 0.09 });
    this._tone(t, 0.05, { type: "square", freq: 240, drop: 140, peak: 0.03 });
  }

  /* Ring begins to turn: a heavy release of the brake. */
  ringStart() {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    this._tone(t, 0.3, { type: "sine", freq: 90, drop: 45, peak: 0.22 });
    this._noise(t, 0.25, { freq: 500, q: 2, peak: 0.06, sweepTo: 200 });
  }

  /* Annular Seal n (0..6) locks. Rises slightly with each seal. */
  sealLock(n = 0) {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    // The thud of the pylon,
    this._tone(t, 0.35, { type: "sine", freq: 150, drop: 48, peak: 0.5 });
    this._noise(t, 0.12, { freq: 300, q: 1.5, peak: 0.2 });
    // then the bell of the seal — climbing a strange scale.
    const scale = [220, 247, 262, 294, 330, 371, 415];
    this._bell(t + 0.09, scale[n % 7], 0.12, 2.4);
  }

  refuse() {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    this._tone(t, 0.22, { type: "sawtooth", freq: 130, drop: 88, peak: 0.1 });
    this._tone(t, 0.22, { type: "sawtooth", freq: 136, drop: 92, peak: 0.1 });
  }

  /* The seventh seal is in: pressure rises toward the Sunstrike. */
  primeSwell(dur = 1.1) {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(46, t);
    o.frequency.exponentialRampToValueAtTime(210, t + dur);
    const f = this.ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(240, t);
    f.frequency.exponentialRampToValueAtTime(2600, t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.34, t + dur);
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.08);
    o.connect(f).connect(g).connect(this.master);
    o.start(t); o.stop(t + dur + 0.15);
    this._noise(t, dur, { freq: 800, q: 0.8, peak: 0.1, sweepTo: 4000 });
  }

  /* The Sunstrike itself. */
  burst() {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    this._noise(t, 1.6, { type: "lowpass", freq: 6000, peak: 0.55, attack: 0.002, sweepTo: 300 });
    this._tone(t, 1.2, { type: "sine", freq: 110, drop: 30, peak: 0.6, attack: 0.002 });
    // A spray of bright bell shards.
    const shards = [1244, 932, 1567, 740, 1865];
    shards.forEach((f, i) => this._bell(t + 0.05 + i * 0.06, f, 0.05, 1.4));
    this._bell(t + 0.12, 311, 0.2, 3.5);
  }

  /* The standing hum of the open Wellglass. Runs until wellClose(). */
  wellOpen() {
    if (!this.ready || this._portal) return;
    const c = this.ctx, t = c.currentTime;
    const out = c.createGain();
    out.gain.setValueAtTime(0.0001, t);
    out.gain.linearRampToValueAtTime(0.16, t + 1.4);
    out.connect(this.master);

    const nodes = [];
    // Golden fifth drone, slowly shimmering against itself.
    [98, 147, 196.5, 294.8].forEach((f, i) => {
      const o = c.createOscillator();
      o.type = i < 2 ? "sine" : "triangle";
      o.frequency.value = f;
      const g = c.createGain(); g.gain.value = [0.5, 0.34, 0.2, 0.1][i];
      const lfo = c.createOscillator();
      lfo.frequency.value = 0.13 + i * 0.09;
      const lg = c.createGain(); lg.gain.value = f * 0.004;
      lfo.connect(lg).connect(o.frequency);
      o.connect(g).connect(out);
      o.start(); lfo.start();
      nodes.push(o, lfo);
    });
    // Molten surface: slow filtered noise wash.
    const n = c.createBufferSource();
    n.buffer = this._noiseBuffer(2); n.loop = true;
    const nf = c.createBiquadFilter();
    nf.type = "bandpass"; nf.frequency.value = 1400; nf.Q.value = 0.6;
    const ng = c.createGain(); ng.gain.value = 0.05;
    const nlfo = c.createOscillator(); nlfo.frequency.value = 0.21;
    const nlg = c.createGain(); nlg.gain.value = 700;
    nlfo.connect(nlg).connect(nf.frequency);
    n.connect(nf).connect(ng).connect(out);
    n.start(); nlfo.start();
    nodes.push(n, nlfo);

    this._portal = { out, nodes };
  }

  wellClose(fast = false) {
    if (!this._portal) return;
    const t = this.ctx.currentTime;
    const dur = fast ? 0.25 : 1.1;
    this._portal.out.gain.cancelScheduledValues(t);
    this._portal.out.gain.linearRampToValueAtTime(0.0001, t + dur);
    const nodes = this._portal.nodes;
    setTimeout(() => nodes.forEach((n) => { try { n.stop(); } catch (_) {} }), (dur + 0.2) * 1000);
    this._portal = null;
  }

  /* Warning pulse as stability runs out. */
  warn() {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    this._tone(t, 0.3, { type: "sine", freq: 660, peak: 0.06 });
    this._tone(t, 0.3, { type: "sine", freq: 662, peak: 0.06 });
  }

  /* The Umbral Occulter grinding across the well. */
  occluderMove(dur = 1.5) {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    this._noise(t, dur, { freq: 160, q: 3, peak: 0.22, attack: 0.15, sweepTo: 70 });
    this._tone(t, dur, { type: "triangle", freq: 44, peak: 0.12, attack: 0.2 });
  }

  occluderSeat() {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    this._tone(t, 0.5, { type: "sine", freq: 96, drop: 34, peak: 0.55, attack: 0.003 });
    this._noise(t, 0.2, { freq: 240, q: 1, peak: 0.25 });
    this._bell(t + 0.1, 155, 0.1, 3.2);
  }

  /* Seals letting go, one soft bell each. */
  sealRelease(n = 0) {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    this._tone(t, 0.2, { type: "sine", freq: 200, drop: 90, peak: 0.14 });
    this._bell(t + 0.03, 415 - n * 28, 0.045, 1.1);
  }

  /* A cant that reaches nothing: the well sputters and dies. */
  fizzle() {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    this._noise(t, 1.3, { freq: 2000, q: 0.7, peak: 0.3, sweepTo: 120 });
    const o = this.ctx.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(180, t);
    o.frequency.exponentialRampToValueAtTime(28, t + 1.2);
    const g = this.ctx.createGain();
    // Sputtering: chop the gain.
    g.gain.setValueAtTime(0.18, t);
    for (let i = 0; i < 9; i++) {
      g.gain.setValueAtTime(i % 2 ? 0.16 - i * 0.015 : 0.01, t + 0.09 * i + 0.2);
    }
    g.gain.linearRampToValueAtTime(0.0001, t + 1.25);
    o.connect(g).connect(this.master);
    o.start(t); o.stop(t + 1.3);
  }

  /* Unstable auto-collapse: the well is sucked shut. */
  collapse() {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    this._noise(t, 0.9, { freq: 300, q: 1, peak: 0.4, sweepTo: 3500 });
    this._tone(t, 0.9, { type: "sine", freq: 160, drop: 36, peak: 0.5 });
    this._bell(t + 0.55, 208, 0.12, 2.6);
  }
}
