/* ═══════════════════════════════════════════════════════════════════
   audio.js — every sound is cooked up procedurally with Web Audio.
   Nothing grand: creaks, sputters, a kettle hiss, a hum like wind
   over a bottle. The rig sounds handmade because it is.
   ═══════════════════════════════════════════════════════════════════ */

class HearthAudio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.enabled = false;
    this.humNodes = null;
    this.portalNodes = null;
    this._noiseBuf = null;
  }

  /* must be called from a user gesture */
  wake() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.55;
      this.master.connect(this.ctx.destination);
      this._noiseBuf = this._makeNoise();
    }
    this.ctx.resume();
    this.enabled = true;
    this.startHum();
  }

  sleep() {
    this.enabled = false;
    this.stopHum();
    this.stopPortal();
    if (this.ctx) this.ctx.suspend();
  }

  _makeNoise() {
    const len = this.ctx.sampleRate * 2;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  _noiseSource() {
    const src = this.ctx.createBufferSource();
    src.buffer = this._noiseBuf;
    src.loop = true;
    return src;
  }

  _env(gainNode, t0, peaks) {
    /* peaks: [[dt, value], ...] */
    const g = gainNode.gain;
    g.setValueAtTime(0.0001, t0);
    for (const [dt, v] of peaks) g.exponentialRampToValueAtTime(Math.max(v, 0.0001), t0 + dt);
  }

  /* ── ambient: low bottle-hum + faint crackle of the watch-flame ── */
  startHum() {
    if (!this.enabled || this.humNodes) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = "sine"; osc.frequency.value = 54;
    const osc2 = this.ctx.createOscillator();
    osc2.type = "sine"; osc2.frequency.value = 81.4;
    const g = this.ctx.createGain(); g.gain.value = 0;
    g.gain.linearRampToValueAtTime(0.035, t + 2);
    const lfo = this.ctx.createOscillator(); lfo.frequency.value = 0.13;
    const lfoG = this.ctx.createGain(); lfoG.gain.value = 0.012;
    lfo.connect(lfoG); lfoG.connect(g.gain);
    /* crackle: filtered noise, very quiet */
    const n = this._noiseSource();
    const bp = this.ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 3200; bp.Q.value = 0.6;
    const ng = this.ctx.createGain(); ng.gain.value = 0.006;
    n.connect(bp); bp.connect(ng); ng.connect(this.master);
    osc.connect(g); osc2.connect(g); g.connect(this.master);
    osc.start(); osc2.start(); lfo.start(); n.start();
    this.humNodes = { osc, osc2, lfo, g, n, ng };
  }

  stopHum() {
    if (!this.humNodes) return;
    const { osc, osc2, lfo, g, n, ng } = this.humNodes;
    const t = this.ctx.currentTime;
    g.gain.linearRampToValueAtTime(0, t + 0.4);
    ng.gain.linearRampToValueAtTime(0, t + 0.4);
    setTimeout(() => { try { osc.stop(); osc2.stop(); lfo.stop(); n.stop(); } catch (e) {} }, 600);
    this.humNodes = null;
  }

  /* ── the wheel groaning round: pitched creak from filtered noise ── */
  creak(durSec = 1.4) {
    if (!this.enabled) return;
    const t = this.ctx.currentTime;
    const n = this._noiseSource();
    const bp = this.ctx.createBiquadFilter();
    bp.type = "bandpass"; bp.Q.value = 18;
    bp.frequency.setValueAtTime(280, t);
    bp.frequency.linearRampToValueAtTime(160 + Math.random() * 120, t + durSec * 0.6);
    bp.frequency.linearRampToValueAtTime(240, t + durSec);
    const g = this.ctx.createGain();
    this._env(g, t, [[0.1, 0.09], [durSec * 0.5, 0.05], [durSec * 0.8, 0.08], [durSec, 0.0001]]);
    n.connect(bp); bp.connect(g); g.connect(this.master);
    n.start(t); n.stop(t + durSec + 0.1);
  }

  /* ── the catch closing: a wooden thunk + twine zip ── */
  thunk() {
    if (!this.enabled) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.12);
    const g = this.ctx.createGain();
    this._env(g, t, [[0.008, 0.5], [0.18, 0.0001]]);
    osc.connect(g); g.connect(this.master);
    osc.start(t); osc.stop(t + 0.25);
    /* twine zip */
    const n = this._noiseSource();
    const hp = this.ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 2400;
    const ng = this.ctx.createGain();
    this._env(ng, t + 0.02, [[0.01, 0.06], [0.1, 0.0001]]);
    n.connect(hp); hp.connect(ng); ng.connect(this.master);
    n.start(t); n.stop(t + 0.2);
  }

  /* ── candle catching: sputter of noise bursts then soft bloom ── */
  sputter() {
    if (!this.enabled) return;
    const t = this.ctx.currentTime;
    for (let i = 0; i < 5; i++) {
      const n = this._noiseSource();
      const bp = this.ctx.createBiquadFilter(); bp.type = "bandpass";
      bp.frequency.value = 1800 + Math.random() * 2600; bp.Q.value = 2;
      const g = this.ctx.createGain();
      const st = t + i * 0.055 + Math.random() * 0.02;
      this._env(g, st, [[0.005, 0.12 - i * 0.015], [0.05, 0.0001]]);
      n.connect(bp); bp.connect(g); g.connect(this.master);
      n.start(st); n.stop(st + 0.1);
    }
    const osc = this.ctx.createOscillator();
    osc.type = "triangle"; osc.frequency.value = 520 + Math.random() * 60;
    const g2 = this.ctx.createGain();
    this._env(g2, t + 0.25, [[0.1, 0.05], [0.5, 0.0001]]);
    osc.connect(g2); g2.connect(this.master);
    osc.start(t + 0.25); osc.stop(t + 0.85);
  }

  /* ── moth flight: papery flutter darting up in pitch ── */
  mothFlit() {
    if (!this.enabled) return;
    const t = this.ctx.currentTime;
    const n = this._noiseSource();
    const bp = this.ctx.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 4;
    bp.frequency.setValueAtTime(900, t);
    bp.frequency.exponentialRampToValueAtTime(3200, t + 0.3);
    const g = this.ctx.createGain();
    const lfo = this.ctx.createOscillator(); lfo.frequency.value = 26;
    const lg = this.ctx.createGain(); lg.gain.value = 0.05;
    lfo.connect(lg); lg.connect(g.gain);
    this._env(g, t, [[0.03, 0.08], [0.28, 0.02], [0.4, 0.0001]]);
    n.connect(bp); bp.connect(g); g.connect(this.master);
    n.start(t); n.stop(t + 0.5); lfo.start(t); lfo.stop(t + 0.5);
  }

  /* ── ladle tip: slosh + kettle hiss ── */
  ladle() {
    if (!this.enabled) return;
    const t = this.ctx.currentTime;
    const n = this._noiseSource();
    const lp = this.ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 800;
    const g = this.ctx.createGain();
    this._env(g, t, [[0.08, 0.25], [0.5, 0.05], [0.9, 0.0001]]);
    n.connect(lp); lp.connect(g); g.connect(this.master);
    n.start(t); n.stop(t + 1);
    const n2 = this._noiseSource();
    const hp = this.ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 4500;
    const g2 = this.ctx.createGain();
    this._env(g2, t + 0.35, [[0.2, 0.12], [1.4, 0.0001]]);
    n2.connect(hp); hp.connect(g2); g2.connect(this.master);
    n2.start(t + 0.3); n2.stop(t + 2);
  }

  /* ── the way opening: rising shimmer chord ── */
  openWhoosh() {
    if (!this.enabled) return;
    const t = this.ctx.currentTime;
    [110, 165, 220, 277].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(f * 0.5, t);
      osc.frequency.exponentialRampToValueAtTime(f, t + 1.4);
      const g = this.ctx.createGain();
      this._env(g, t + i * 0.12, [[0.6, 0.07], [2.2, 0.0001]]);
      osc.connect(g); g.connect(this.master);
      osc.start(t); osc.stop(t + 2.6);
    });
    const n = this._noiseSource();
    const bp = this.ctx.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(400, t);
    bp.frequency.exponentialRampToValueAtTime(2400, t + 1.5);
    const g = this.ctx.createGain();
    this._env(g, t, [[0.8, 0.2], [2, 0.0001]]);
    n.connect(bp); bp.connect(g); g.connect(this.master);
    n.start(t); n.stop(t + 2.2);
  }

  /* ── open-portal bed: watery shimmer loop ── */
  startPortal(unstable = false) {
    if (!this.enabled || this.portalNodes) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator(); osc.type = "sine"; osc.frequency.value = 110;
    const osc2 = this.ctx.createOscillator(); osc2.type = "sine"; osc2.frequency.value = 164.8;
    const g = this.ctx.createGain(); g.gain.value = 0;
    g.gain.linearRampToValueAtTime(0.05, t + 1);
    const lfo = this.ctx.createOscillator(); lfo.frequency.value = unstable ? 6.5 : 0.4;
    const lg = this.ctx.createGain(); lg.gain.value = unstable ? 0.03 : 0.015;
    lfo.connect(lg); lg.connect(g.gain);
    const n = this._noiseSource();
    const bp = this.ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1200; bp.Q.value = 0.8;
    const ng = this.ctx.createGain(); ng.gain.value = 0.018;
    n.connect(bp); bp.connect(ng); ng.connect(this.master);
    osc.connect(g); osc2.connect(g); g.connect(this.master);
    osc.start(); osc2.start(); lfo.start(); n.start();
    this.portalNodes = { osc, osc2, lfo, g, n, ng };
  }

  stopPortal() {
    if (!this.portalNodes) return;
    const { osc, osc2, lfo, g, n, ng } = this.portalNodes;
    const t = this.ctx.currentTime;
    g.gain.linearRampToValueAtTime(0, t + 0.6);
    ng.gain.linearRampToValueAtTime(0, t + 0.6);
    setTimeout(() => { try { osc.stop(); osc2.stop(); lfo.stop(); n.stop(); } catch (e) {} }, 800);
    this.portalNodes = null;
  }

  /* ── snuff: iron scrape, candle puffs, falling sigh ── */
  seal() {
    if (!this.enabled) return;
    const t = this.ctx.currentTime;
    /* iron scrape */
    const n = this._noiseSource();
    const bp = this.ctx.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 9;
    bp.frequency.setValueAtTime(1900, t);
    bp.frequency.linearRampToValueAtTime(700, t + 0.4);
    const g = this.ctx.createGain();
    this._env(g, t, [[0.03, 0.16], [0.45, 0.0001]]);
    n.connect(bp); bp.connect(g); g.connect(this.master);
    n.start(t); n.stop(t + 0.5);
    /* falling sigh */
    [220, 164.8, 110].forEach((f, i) => {
      const osc = this.ctx.createOscillator(); osc.type = "sine";
      osc.frequency.setValueAtTime(f, t + 0.3);
      osc.frequency.exponentialRampToValueAtTime(f * 0.5, t + 1.6);
      const gg = this.ctx.createGain();
      this._env(gg, t + 0.3 + i * 0.1, [[0.2, 0.06], [1.4, 0.0001]]);
      osc.connect(gg); gg.connect(this.master);
      osc.start(t + 0.3); osc.stop(t + 2);
    });
  }

  puff() {
    if (!this.enabled) return;
    const t = this.ctx.currentTime;
    const n = this._noiseSource();
    const lp = this.ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1600;
    const g = this.ctx.createGain();
    this._env(g, t, [[0.015, 0.14], [0.16, 0.0001]]);
    n.connect(lp); lp.connect(g); g.connect(this.master);
    n.start(t); n.stop(t + 0.2);
  }

  /* ── fizzle: the way refusing — hiss down + sour interval ── */
  fizzle() {
    if (!this.enabled) return;
    const t = this.ctx.currentTime;
    const n = this._noiseSource();
    const bp = this.ctx.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = 1.5;
    bp.frequency.setValueAtTime(2800, t);
    bp.frequency.exponentialRampToValueAtTime(300, t + 1.2);
    const g = this.ctx.createGain();
    this._env(g, t, [[0.05, 0.2], [1.2, 0.0001]]);
    n.connect(bp); bp.connect(g); g.connect(this.master);
    n.start(t); n.stop(t + 1.3);
    [196, 185].forEach((f) => {
      const osc = this.ctx.createOscillator(); osc.type = "triangle"; osc.frequency.value = f;
      const gg = this.ctx.createGain();
      this._env(gg, t + 0.15, [[0.1, 0.05], [0.9, 0.0001]]);
      osc.connect(gg); gg.connect(this.master);
      osc.start(t + 0.15); osc.stop(t + 1.1);
    });
  }

  /* ── the crossed-out road: a low wrong presence, then a slam ── */
  dread() {
    if (!this.enabled) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator(); osc.type = "sawtooth";
    osc.frequency.setValueAtTime(36, t);
    osc.frequency.linearRampToValueAtTime(31, t + 1.6);
    const lp = this.ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 220;
    const g = this.ctx.createGain();
    this._env(g, t, [[0.8, 0.14], [1.6, 0.1], [1.9, 0.0001]]);
    osc.connect(lp); lp.connect(g); g.connect(this.master);
    osc.start(t); osc.stop(t + 2);
    /* slam */
    const t2 = t + 1.75;
    const osc2 = this.ctx.createOscillator(); osc2.type = "sine";
    osc2.frequency.setValueAtTime(120, t2);
    osc2.frequency.exponentialRampToValueAtTime(38, t2 + 0.2);
    const g2 = this.ctx.createGain();
    this._env(g2, t2, [[0.01, 0.7], [0.5, 0.0001]]);
    osc2.connect(g2); g2.connect(this.master);
    osc2.start(t2); osc2.stop(t2 + 0.6);
  }

  /* ── small paper/click for UI ── */
  tick() {
    if (!this.enabled) return;
    const t = this.ctx.currentTime;
    const n = this._noiseSource();
    const hp = this.ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 3000;
    const g = this.ctx.createGain();
    this._env(g, t, [[0.004, 0.08], [0.05, 0.0001]]);
    n.connect(hp); hp.connect(g); g.connect(this.master);
    n.start(t); n.stop(t + 0.08);
  }
}

const hearthAudio = new HearthAudio();
