// ============================================================================
//  Web Audio engine — DSV-7 Cerulean Lantern
//  Sonic vocabulary: ballast flood hiss / vent blow, thruster whine, hull
//  creak & groan under pressure, electrical hum, scrubber fan, deep-water
//  ambience, and the ring-response crescendo. Deliberately NO sonar pings,
//  NO acoustic-detection sweeps — this is a piloting console.
// ============================================================================

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.started = false;
    this.layers = { ambient: true, vessel: true, effects: true, groans: true };
    this.master = 0.8;
    this.nodes = {};
    this._depthNorm = 0;
    this._activeDrone = null;
  }

  // Must be called from a user gesture.
  start() {
    if (this.started) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    this.ctx = new AC();
    const c = this.ctx;
    this.out = c.createGain();
    this.out.gain.value = this.master;
    this.comp = c.createDynamicsCompressor();
    this.comp.threshold.value = -14;
    this.comp.ratio.value = 4;
    this.out.connect(this.comp).connect(c.destination);

    this.buses = {};
    for (const k of ['ambient', 'vessel', 'effects', 'groans']) {
      const g = c.createGain();
      g.gain.value = this.layers[k] ? 1 : 0;
      g.connect(this.out);
      this.buses[k] = g;
    }
    this._noiseBuf = this._makeNoise(3);
    this._brownBuf = this._makeBrown(4);
    this._buildAmbient();
    this._buildVessel();
    this.started = true;
    if (c.state === 'suspended') c.resume();
    return true;
  }

  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); }

  setMaster(v) { this.master = v; if (this.out) this.out.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05); }

  setLayer(name, on) {
    this.layers[name] = on;
    if (this.buses && this.buses[name]) this.buses[name].gain.setTargetAtTime(on ? 1 : 0, this.ctx.currentTime, 0.1);
  }

  // ---- buffers -------------------------------------------------------------
  _makeNoise(sec) {
    const c = this.ctx, n = c.sampleRate * sec, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  _makeBrown(sec) {
    const c = this.ctx, n = c.sampleRate * sec, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < n; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
    return b;
  }
  _noiseSrc(buf, loop = false) {
    const s = this.ctx.createBufferSource(); s.buffer = buf; s.loop = loop; return s;
  }

  // ---- continuous layers ---------------------------------------------------
  _buildAmbient() {
    const c = this.ctx;
    // Deep-water body: brown noise, heavy low-pass, slow swell.
    const src = this._noiseSrc(this._brownBuf, true);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 160; lp.Q.value = 0.6;
    const g = c.createGain(); g.gain.value = 0.16;
    const lfo = c.createOscillator(); lfo.frequency.value = 0.07;
    const lfoG = c.createGain(); lfoG.gain.value = 0.06;
    lfo.connect(lfoG).connect(g.gain);
    src.connect(lp).connect(g).connect(this.buses.ambient);
    src.start(); lfo.start();
    // Distant water-column whisper: brown noise band around 400 Hz, very low.
    const src2 = this._noiseSrc(this._brownBuf, true);
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 420; bp.Q.value = 0.5;
    const g2 = c.createGain(); g2.gain.value = 0.035;
    const lfo2 = c.createOscillator(); lfo2.frequency.value = 0.13;
    const lfo2G = c.createGain(); lfo2G.gain.value = 0.02;
    lfo2.connect(lfo2G).connect(g2.gain);
    src2.connect(bp).connect(g2).connect(this.buses.ambient);
    src2.start(); lfo2.start();
    this.nodes.ambientLP = lp;
    this.nodes.ambientGain = g;
  }

  _buildVessel() {
    const c = this.ctx;
    // Electrical hum: 50 Hz fundamental with 2 quiet harmonics.
    const hum = c.createGain(); hum.gain.value = 0.05;
    [[50, 1], [100, 0.35], [150, 0.12]].forEach(([f, a]) => {
      const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const og = c.createGain(); og.gain.value = a;
      o.connect(og).connect(hum); o.start();
    });
    hum.connect(this.buses.vessel);
    // Scrubber fan: filtered white noise with a gentle 0.5 Hz wobble.
    const fan = this._noiseSrc(this._noiseBuf, true);
    const fbp = c.createBiquadFilter(); fbp.type = 'bandpass'; fbp.frequency.value = 900; fbp.Q.value = 1.4;
    const fg = c.createGain(); fg.gain.value = 0.018;
    const flfo = c.createOscillator(); flfo.frequency.value = 0.5;
    const flfoG = c.createGain(); flfoG.gain.value = 0.005;
    flfo.connect(flfoG).connect(fg.gain);
    fan.connect(fbp).connect(fg).connect(this.buses.vessel);
    fan.start(); flfo.start();
    // Pressure-hull body tone: very quiet, rises in pitch weight with depth.
    const body = c.createOscillator(); body.type = 'triangle'; body.frequency.value = 41;
    const bodyG = c.createGain(); bodyG.gain.value = 0.0;
    body.connect(bodyG).connect(this.buses.vessel); body.start();
    this.nodes.hum = hum; this.nodes.fanGain = fg; this.nodes.bodyGain = bodyG; this.nodes.body = body;
  }

  // Depth feeds back into the continuous layers: deeper = darker ambience,
  // more hull body tone.
  setDepthNorm(n) {
    if (!this.started) return;
    this._depthNorm = n;
    const t = this.ctx.currentTime;
    this.nodes.ambientLP.frequency.setTargetAtTime(160 - n * 90, t, 0.5);
    this.nodes.bodyGain.gain.setTargetAtTime(n * n * 0.03, t, 0.5);
    this.nodes.body.frequency.setTargetAtTime(41 + n * 6, t, 0.5);
  }

  // ---- one-shot events -----------------------------------------------------
  _env(g, t, a, peak, d, s, r, total) {
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.linearRampToValueAtTime(peak * s, t + a + d);
    g.gain.setValueAtTime(peak * s, t + total - r);
    g.gain.exponentialRampToValueAtTime(0.0001, t + total);
  }

  // Ballast tanks flooding: broad hiss that darkens as the tank fills.
  flood(duration = 1.4, intensity = 1) {
    if (!this.started || !this.layers.effects) return;
    const c = this.ctx, t = c.currentTime;
    const s = this._noiseSrc(this._noiseBuf);
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.8;
    bp.frequency.setValueAtTime(2600, t); bp.frequency.exponentialRampToValueAtTime(700, t + duration);
    const g = c.createGain();
    this._env(g, t, 0.08, 0.22 * intensity, duration * 0.3, 0.7, duration * 0.35, duration);
    s.connect(bp).connect(g).connect(this.buses.effects);
    s.start(t); s.stop(t + duration + 0.05);
  }

  // Vent valve: short brighter hiss with a relay click.
  vent(duration = 0.5) {
    if (!this.started || !this.layers.effects) return;
    const c = this.ctx, t = c.currentTime;
    this.click(0.6);
    const s = this._noiseSrc(this._noiseBuf);
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3200;
    const g = c.createGain();
    this._env(g, t, 0.02, 0.12, duration * 0.2, 0.5, duration * 0.5, duration);
    s.connect(hp).connect(g).connect(this.buses.effects);
    s.start(t); s.stop(t + duration + 0.05);
  }

  // Vertical thruster correction burn: rising sawtooth whine through a
  // low-pass, then decays as the vessel settles.
  thruster(duration = 1.1, power = 1) {
    if (!this.started || !this.layers.effects) return;
    const c = this.ctx, t = c.currentTime;
    const o = c.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(180, t);
    o.frequency.exponentialRampToValueAtTime(180 + 520 * power, t + duration * 0.35);
    o.frequency.exponentialRampToValueAtTime(140, t + duration);
    const o2 = c.createOscillator(); o2.type = 'square';
    o2.frequency.setValueAtTime(90, t);
    o2.frequency.exponentialRampToValueAtTime(90 + 260 * power, t + duration * 0.35);
    o2.frequency.exponentialRampToValueAtTime(70, t + duration);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400; lp.Q.value = 2;
    const g = c.createGain();
    this._env(g, t, 0.12, 0.07 * power, duration * 0.3, 0.6, duration * 0.4, duration);
    const g2 = c.createGain(); g2.gain.value = 0.25;
    o.connect(lp); o2.connect(g2).connect(lp); lp.connect(g).connect(this.buses.effects);
    o.start(t); o2.start(t); o.stop(t + duration + 0.05); o2.stop(t + duration + 0.05);
  }

  // Hull creak / groan: low FM-wobbled tone sliding down plus a rough noise
  // band. Intensity grows with depth.
  groan(intensity = 0.5) {
    if (!this.started || !this.layers.groans) return;
    const c = this.ctx, t = c.currentTime;
    const dur = 0.5 + intensity * 0.9;
    const f0 = 95 - intensity * 40 + Math.random() * 12;
    const o = c.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f0 * 0.55, t + dur);
    const wob = c.createOscillator(); wob.frequency.value = 7 + Math.random() * 5;
    const wobG = c.createGain(); wobG.gain.value = 6 + intensity * 10;
    wob.connect(wobG).connect(o.frequency);
    const shaper = c.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) { const x = (i / 128) - 1; curve[i] = Math.tanh(x * (1.5 + intensity * 3)); }
    shaper.curve = curve;
    const g = c.createGain();
    this._env(g, t, 0.05, 0.16 + intensity * 0.18, dur * 0.3, 0.6, dur * 0.4, dur);
    o.connect(shaper).connect(g).connect(this.buses.groans);
    o.start(t); wob.start(t); o.stop(t + dur + 0.05); wob.stop(t + dur + 0.05);
    // rough metallic noise component
    const s = this._noiseSrc(this._noiseBuf);
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 210 + Math.random() * 80; bp.Q.value = 6;
    const ng = c.createGain();
    this._env(ng, t, 0.03, 0.08 + intensity * 0.08, dur * 0.2, 0.4, dur * 0.5, dur);
    s.connect(bp).connect(ng).connect(this.buses.groans);
    s.start(t); s.stop(t + dur + 0.05);
  }

  // Short sharp creak (seat relaxation) — quick.
  creak() {
    if (!this.started || !this.layers.groans) return;
    const c = this.ctx, t = c.currentTime;
    const s = this._noiseSrc(this._noiseBuf);
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1400 + Math.random() * 900; bp.Q.value = 14;
    const g = c.createGain();
    this._env(g, t, 0.01, 0.09, 0.05, 0.3, 0.1, 0.22);
    s.connect(bp).connect(g).connect(this.buses.groans);
    s.start(t); s.stop(t + 0.3);
  }

  // Relay / valve click.
  click(vol = 1) {
    if (!this.started || !this.layers.effects) return;
    const c = this.ctx, t = c.currentTime;
    const s = this._noiseSrc(this._noiseBuf);
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 3;
    const g = c.createGain();
    g.gain.setValueAtTime(0.18 * vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);
    s.connect(bp).connect(g).connect(this.buses.effects);
    s.start(t); s.stop(t + 0.05);
  }

  // Neutral-buoyancy hold confirmed: a soft two-note pad with a relay clunk.
  // Low and rounded — nothing resembling a sonar ping.
  holdConfirm() {
    if (!this.started || !this.layers.effects) return;
    const c = this.ctx, t = c.currentTime;
    this.click(0.8);
    [[146.8, 0.11], [220, 0.08], [293.7, 0.05]].forEach(([f, a], i) => {
      const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const g = c.createGain();
      const st = t + i * 0.05;
      g.gain.setValueAtTime(0.0001, st);
      g.gain.linearRampToValueAtTime(a, st + 0.06);
      g.gain.exponentialRampToValueAtTime(0.0001, st + 0.55);
      o.connect(g).connect(this.buses.effects); o.start(st); o.stop(st + 0.6);
    });
  }

  // Profile rejected (non-descending glyph): dull double thud.
  reject() {
    if (!this.started || !this.layers.effects) return;
    const c = this.ctx, t = c.currentTime;
    for (let i = 0; i < 2; i++) {
      const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = 110;
      const g = c.createGain(); const st = t + i * 0.13;
      g.gain.setValueAtTime(0.0001, st); g.gain.linearRampToValueAtTime(0.12, st + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, st + 0.11);
      o.connect(g).connect(this.buses.effects); o.start(st); o.stop(st + 0.12);
    }
  }

  // Hull-integrity lockout alarm: alternating low square tones.
  lockoutAlarm() {
    if (!this.started || !this.layers.effects) return;
    const c = this.ctx, t = c.currentTime;
    for (let i = 0; i < 4; i++) {
      const o = c.createOscillator(); o.type = 'square'; o.frequency.value = i % 2 ? 262 : 196;
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
      const g = c.createGain(); const st = t + i * 0.19;
      g.gain.setValueAtTime(0.0001, st); g.gain.linearRampToValueAtTime(0.07, st + 0.01); g.gain.setValueAtTime(0.07, st + 0.15); g.gain.exponentialRampToValueAtTime(0.0001, st + 0.18);
      o.connect(lp).connect(g).connect(this.buses.effects); o.start(st); o.stop(st + 0.19);
    }
  }

  // BUILDUP: a rising pressure swell. Returns nothing; scheduled over `dur`.
  buildup(dur = 2.2) {
    if (!this.started || !this.layers.effects) return;
    const c = this.ctx, t = c.currentTime;
    const o = c.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(55, t); o.frequency.exponentialRampToValueAtTime(165, t + dur);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 6;
    lp.frequency.setValueAtTime(200, t); lp.frequency.exponentialRampToValueAtTime(2400, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.11, t + dur * 0.9); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.15);
    o.connect(lp).connect(g).connect(this.buses.effects); o.start(t); o.stop(t + dur + 0.2);
    // water rushing past the sphere
    const s = this._noiseSrc(this._noiseBuf);
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.5;
    bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(1800, t + dur);
    const ng = c.createGain();
    ng.gain.setValueAtTime(0.0001, t); ng.gain.linearRampToValueAtTime(0.14, t + dur); ng.gain.linearRampToValueAtTime(0.0001, t + dur + 0.2);
    s.connect(bp).connect(ng).connect(this.buses.effects); s.start(t); s.stop(t + dur + 0.3);
    // hull groans during the buildup
    setTimeout(() => this.groan(0.7), dur * 400);
    setTimeout(() => this.groan(0.95), dur * 800);
  }

  // BREAKTHROUGH: sub boom + whoosh + chord bloom, then hands off to the
  // sustained drone.
  breakthrough() {
    if (!this.started || !this.layers.effects) return;
    const c = this.ctx, t = c.currentTime;
    const boom = c.createOscillator(); boom.type = 'sine';
    boom.frequency.setValueAtTime(72, t); boom.frequency.exponentialRampToValueAtTime(28, t + 1.2);
    const bg = c.createGain();
    bg.gain.setValueAtTime(0.0001, t); bg.gain.linearRampToValueAtTime(0.5, t + 0.03); bg.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);
    boom.connect(bg).connect(this.buses.effects); boom.start(t); boom.stop(t + 1.5);
    const s = this._noiseSrc(this._noiseBuf);
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.setValueAtTime(400, t); hp.frequency.exponentialRampToValueAtTime(6000, t + 0.9);
    const ng = c.createGain();
    ng.gain.setValueAtTime(0.0001, t); ng.gain.linearRampToValueAtTime(0.22, t + 0.05); ng.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
    s.connect(hp).connect(ng).connect(this.buses.effects); s.start(t); s.stop(t + 1.2);
    // chord bloom — the ring's answer
    [[110, 0.09], [164.8, 0.07], [220, 0.06], [329.6, 0.04], [440, 0.025]].forEach(([f, a], i) => {
      const o = c.createOscillator(); o.type = i < 2 ? 'triangle' : 'sine'; o.frequency.value = f;
      const g = c.createGain(); const st = t + 0.15 + i * 0.07;
      g.gain.setValueAtTime(0.0001, st); g.gain.linearRampToValueAtTime(a, st + 0.4); g.gain.exponentialRampToValueAtTime(0.0001, st + 3.2);
      o.connect(g).connect(this.buses.effects); o.start(st); o.stop(st + 3.3);
    });
  }

  // SUSTAINED ACTIVE: detuned drone with slow tremolo, held until stopped.
  startActiveDrone() {
    if (!this.started || this._activeDrone) return;
    const c = this.ctx, t = c.currentTime;
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.07, t + 1.5);
    const oscs = [];
    [[110, 'triangle'], [110.7, 'triangle'], [165, 'sine'], [220.5, 'sine']].forEach(([f, type]) => {
      const o = c.createOscillator(); o.type = type; o.frequency.value = f;
      const og = c.createGain(); og.gain.value = f > 200 ? 0.3 : 0.6;
      o.connect(og).connect(g); o.start(t); oscs.push(o);
    });
    const trem = c.createOscillator(); trem.frequency.value = 0.35;
    const tremG = c.createGain(); tremG.gain.value = 0.02;
    trem.connect(tremG).connect(g.gain); trem.start(t);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 800;
    g.connect(lp).connect(this.buses.effects);
    this._activeDrone = { g, oscs, trem };
  }
  stopActiveDrone() {
    if (!this._activeDrone) return;
    const { g, oscs, trem } = this._activeDrone; const t = this.ctx.currentTime;
    g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(0.0001, t + 0.6);
    oscs.forEach(o => o.stop(t + 0.7)); trem.stop(t + 0.7);
    this._activeDrone = null;
  }

  // EMERGENCY ASCENT — blow all ballast: high-pressure air blast.
  blowBallast() {
    if (!this.started || !this.layers.effects) return;
    const c = this.ctx, t = c.currentTime;
    this.click(1.2);
    const s = this._noiseSrc(this._noiseBuf);
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.7;
    bp.frequency.setValueAtTime(1400, t); bp.frequency.exponentialRampToValueAtTime(500, t + 2.0);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.34, t + 0.04); g.gain.setValueAtTime(0.34, t + 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
    s.connect(bp).connect(g).connect(this.buses.effects); s.start(t); s.stop(t + 2.3);
    // ascent rush
    const s2 = this._noiseSrc(this._brownBuf);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(900, t); lp.frequency.exponentialRampToValueAtTime(200, t + 2.5);
    const g2 = c.createGain();
    g2.gain.setValueAtTime(0.0001, t + 0.3); g2.gain.linearRampToValueAtTime(0.2, t + 0.8); g2.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
    s2.connect(lp).connect(g2).connect(this.buses.effects); s2.start(t); s2.stop(t + 2.7);
  }

  uiTick() {
    if (!this.started || !this.layers.effects) return;
    const c = this.ctx, t = c.currentTime;
    const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = 520;
    const g = c.createGain(); g.gain.setValueAtTime(0.03, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
    o.connect(g).connect(this.buses.effects); o.start(t); o.stop(t + 0.04);
  }
}
