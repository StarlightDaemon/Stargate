/* ============================================================
   AETHERGATE — audio engine
   All sound is synthesized live with the Web Audio API.
   No audio files, no network. Off by default; toggled by user.
   ============================================================ */
(function () {
  "use strict";
  window.AG = window.AG || {};

  class AudioEngine {
    constructor() {
      this.ctx = null;
      this.enabled = false;
      this._noiseBuf = null;
      this._spin = null;
      this._hum = null;
    }

    /* Create/resume the context. Must be called from a user gesture. */
    init() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return false;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.55;
        const comp = this.ctx.createDynamicsCompressor();
        comp.threshold.value = -18;
        comp.ratio.value = 6;
        this.master.connect(comp);
        comp.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
      return true;
    }

    setEnabled(on) {
      this.enabled = on && this.init();
      if (!this.enabled) { this.stopSpin(); this.stopHum(); }
      return this.enabled;
    }

    get _ok() { return this.enabled && this.ctx; }

    _noise() {
      if (!this._noiseBuf) {
        const len = this.ctx.sampleRate * 2;
        this._noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const ch = this._noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
      }
      const src = this.ctx.createBufferSource();
      src.buffer = this._noiseBuf;
      src.loop = true;
      return src;
    }

    /* short helper: oscillator with pitch + gain envelopes */
    _tone(type, f0, f1, dur, vol, when) {
      const t = (when || this.ctx.currentTime);
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f0, t);
      if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), t + dur);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(this.master);
      o.start(t); o.stop(t + dur + 0.05);
    }

    /* soft UI blip */
    blip() {
      if (!this._ok) return;
      this._tone("square", 660, 660, 0.055, 0.08);
    }

    uiDeny() {
      if (!this._ok) return;
      this._tone("square", 220, 150, 0.14, 0.1);
    }

    /* glyph passing the crown marker during a spin */
    tick() {
      if (!this._ok) return;
      const t = this.ctx.currentTime;
      const src = this._noise();
      const f = this.ctx.createBiquadFilter();
      f.type = "highpass"; f.frequency.value = 2400;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.12, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);
      src.connect(f); f.connect(g); g.connect(this.master);
      src.start(t); src.stop(t + 0.05);
    }

    /* rumbling track while the sigil ring rotates */
    startSpin() {
      if (!this._ok || this._spin) return;
      const t = this.ctx.currentTime;
      const src = this._noise();
      const f = this.ctx.createBiquadFilter();
      f.type = "bandpass"; f.frequency.value = 210; f.Q.value = 2.5;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.22, t + 0.25);
      const lfo = this.ctx.createOscillator();
      lfo.frequency.value = 9;
      const lfoG = this.ctx.createGain();
      lfoG.gain.value = 70;
      lfo.connect(lfoG); lfoG.connect(f.frequency);
      src.connect(f); f.connect(g); g.connect(this.master);
      src.start(t); lfo.start(t);
      this._spin = { src, lfo, g };
    }

    stopSpin() {
      if (!this._spin || !this.ctx) return;
      const t = this.ctx.currentTime;
      const s = this._spin; this._spin = null;
      try {
        s.g.gain.cancelScheduledValues(t);
        s.g.gain.setValueAtTime(Math.max(s.g.gain.value, 0.001), t);
        s.g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
        s.src.stop(t + 0.25); s.lfo.stop(t + 0.25);
      } catch (e) { /* nodes may already be stopped */ }
    }

    /* mechanical seal clamping shut */
    seal(prime) {
      if (!this._ok) return;
      const t = this.ctx.currentTime;
      const boost = prime ? 1.5 : 1;
      // heavy thunk
      this._tone("triangle", 170, 46, 0.3 * boost, 0.55 * boost, t);
      // metal ring
      this._tone("sine", prime ? 1500 : 1150, prime ? 900 : 800, 0.12, 0.1, t + 0.02);
      // clank noise
      const src = this._noise();
      const f = this.ctx.createBiquadFilter();
      f.type = "lowpass"; f.frequency.setValueAtTime(1600, t);
      f.frequency.exponentialRampToValueAtTime(200, t + 0.16);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.3 * boost, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      src.connect(f); f.connect(g); g.connect(this.master);
      src.start(t); src.stop(t + 0.25);
    }

    /* the activation surge */
    burst() {
      if (!this._ok) return;
      const t = this.ctx.currentTime;
      // rushing water/energy: filtered noise swell
      const src = this._noise();
      const f = this.ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.setValueAtTime(300, t);
      f.frequency.exponentialRampToValueAtTime(7000, t + 0.5);
      f.frequency.exponentialRampToValueAtTime(500, t + 2.1);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.65, t + 0.32);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.3);
      src.connect(f); f.connect(g); g.connect(this.master);
      src.start(t); src.stop(t + 2.5);
      // sub-bass boom
      this._tone("sine", 68, 30, 1.6, 0.8, t + 0.05);
      // shimmering overtones
      for (let i = 0; i < 4; i++) {
        this._tone("sine", 900 + i * 420, 1400 + i * 500, 0.6, 0.05, t + 0.15 + i * 0.08);
      }
    }

    /* standing event-horizon hum */
    startHum() {
      if (!this._ok || this._hum) return;
      const t = this.ctx.currentTime;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.2, t + 1.4);
      g.connect(this.master);

      const o1 = this.ctx.createOscillator();
      o1.type = "sawtooth"; o1.frequency.value = 46;
      const o2 = this.ctx.createOscillator();
      o2.type = "sawtooth"; o2.frequency.value = 46.6;
      const lp = this.ctx.createBiquadFilter();
      lp.type = "lowpass"; lp.frequency.value = 240; lp.Q.value = 1.2;
      o1.connect(lp); o2.connect(lp); lp.connect(g);

      // airy shimmer on top
      const src = this._noise();
      const bp = this.ctx.createBiquadFilter();
      bp.type = "bandpass"; bp.frequency.value = 1100; bp.Q.value = 9;
      const ng = this.ctx.createGain(); ng.gain.value = 0.16;
      const lfo = this.ctx.createOscillator();
      lfo.frequency.value = 0.23;
      const lfoG = this.ctx.createGain(); lfoG.gain.value = 350;
      lfo.connect(lfoG); lfoG.connect(bp.frequency);
      src.connect(bp); bp.connect(ng); ng.connect(g);

      o1.start(t); o2.start(t); src.start(t); lfo.start(t);
      this._hum = { g, stops: [o1, o2, src, lfo] };
    }

    stopHum(fast) {
      if (!this._hum || !this.ctx) return;
      const t = this.ctx.currentTime;
      const h = this._hum; this._hum = null;
      const dur = fast ? 0.2 : 1.1;
      try {
        h.g.gain.cancelScheduledValues(t);
        h.g.gain.setValueAtTime(Math.max(h.g.gain.value, 0.001), t);
        h.g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        h.stops.forEach(n => n.stop(t + dur + 0.1));
      } catch (e) { /* already stopped */ }
    }

    /* portal collapsing */
    shutdown() {
      if (!this._ok) return;
      const t = this.ctx.currentTime;
      const src = this._noise();
      const f = this.ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.setValueAtTime(5000, t);
      f.frequency.exponentialRampToValueAtTime(120, t + 1.3);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.4, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.35);
      src.connect(f); f.connect(g); g.connect(this.master);
      src.start(t); src.stop(t + 1.5);
      // final clamp
      this._tone("triangle", 140, 38, 0.4, 0.6, t + 1.05);
    }

    /* aborted dial */
    fail() {
      if (!this._ok) return;
      const t = this.ctx.currentTime;
      this._tone("square", 330, 180, 0.22, 0.16, t);
      this._tone("square", 250, 120, 0.3, 0.16, t + 0.16);
    }

    /* probe launch swoosh + telemetry ping */
    probe() {
      if (!this._ok) return;
      const t = this.ctx.currentTime;
      const src = this._noise();
      const f = this.ctx.createBiquadFilter();
      f.type = "bandpass"; f.Q.value = 3;
      f.frequency.setValueAtTime(400, t);
      f.frequency.exponentialRampToValueAtTime(3200, t + 0.4);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.25, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
      src.connect(f); f.connect(g); g.connect(this.master);
      src.start(t); src.stop(t + 0.5);
      this._tone("sine", 1320, 1320, 0.09, 0.12, t + 0.7);
      this._tone("sine", 1760, 1760, 0.09, 0.1, t + 0.85);
    }
  }

  AG.AudioEngine = AudioEngine;
})();
