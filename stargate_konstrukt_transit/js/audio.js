/**
 * KONSTRUKT TRANSIT BUREAU
 * Machine-Age Functionalist Sound Engine (Web Audio API)
 * Mechanical stamps, printing-press clunks, squeegee friction, industrial rhythms
 */

class KonstruktAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.activeMotorNode = null;
    this.activeRhythmTimer = null;
    this.buildupInterval = null;
    this.isMuted = false;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this.initialized = true;
    } catch (e) {
      console.warn('AudioContext initialization failed', e);
    }
  }

  ensureContext() {
    if (!this.initialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Mechanical Detent / Stencil Alignment Click
  playDetent() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(650, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.035);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, t);
    filter.Q.setValueAtTime(4.0, t);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.04);

    // Subtle noise transient for mechanical tooth contact
    this.playNoiseTransient(0.02, 1200, 0.25);
  }

  // Noise transient helper
  playNoiseTransient(duration, filterFreq, volume) {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-3 * (i / bufferSize));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(filterFreq, t);
    filter.Q.setValueAtTime(2.0, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(t);
    noise.stop(t + duration);
  }

  // Squeegee Drag & Heavy Platen Stamp Lock
  playSqueegeePass() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const dragDuration = 0.28;

    // 1. Friction sweep (squeegee blade dragging across screen mesh)
    const bufferSize = Math.floor(this.ctx.sampleRate * dragDuration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, t);
    filter.frequency.exponentialRampToValueAtTime(320, t + dragDuration);
    filter.Q.setValueAtTime(3.5, t);

    const dragGain = this.ctx.createGain();
    dragGain.gain.setValueAtTime(0.05, t);
    dragGain.gain.linearRampToValueAtTime(0.35, t + 0.12);
    dragGain.gain.exponentialRampToValueAtTime(0.01, t + dragDuration);

    noise.connect(filter);
    filter.connect(dragGain);
    dragGain.connect(this.masterGain);

    noise.start(t);
    noise.stop(t + dragDuration);

    // 2. Heavy mechanical platen clamp thud at end of stroke
    setTimeout(() => {
      if (!this.ctx || this.isMuted) return;
      const tLock = this.ctx.currentTime;
      const thudOsc = this.ctx.createOscillator();
      const thudGain = this.ctx.createGain();

      thudOsc.type = 'sine';
      thudOsc.frequency.setValueAtTime(110, tLock);
      thudOsc.frequency.exponentialRampToValueAtTime(45, tLock + 0.12);

      thudGain.gain.setValueAtTime(0.6, tLock);
      thudGain.gain.exponentialRampToValueAtTime(0.001, tLock + 0.14);

      thudOsc.connect(thudGain);
      thudGain.connect(this.masterGain);

      thudOsc.start(tLock);
      thudOsc.stop(tLock + 0.14);

      this.playNoiseTransient(0.06, 400, 0.45);
    }, dragDuration * 800);
  }

  // Buildup Stage: Accelerating mechanical cadence & rising motor tension
  startBuildup(durationMs = 1800) {
    this.ensureContext();
    this.stopBuildup();
    if (!this.ctx || this.isMuted) return;

    let step = 0;
    const totalSteps = 14;
    const intervalTime = durationMs / totalSteps;

    this.buildupInterval = setInterval(() => {
      step++;
      const progress = step / totalSteps;
      const t = this.ctx.currentTime;

      // Accelerating rhythmic metronomic hammer
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80 + progress * 160, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.05);

      gain.gain.setValueAtTime(0.3 + progress * 0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300 + progress * 1200, t);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.06);

      this.playNoiseTransient(0.03, 800 + progress * 1500, 0.25 + progress * 0.35);

      if (step >= totalSteps) {
        this.stopBuildup();
      }
    }, intervalTime);
  }

  stopBuildup() {
    if (this.buildupInterval) {
      clearInterval(this.buildupInterval);
      this.buildupInterval = null;
    }
  }

  // Breakthrough: Massive mechanical release crash & portal ignition
  playBreakthrough() {
    this.ensureContext();
    this.stopBuildup();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;

    // Sub bass slam
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(140, t);
    subOsc.frequency.exponentialRampToValueAtTime(35, t + 0.5);

    subGain.gain.setValueAtTime(0.8, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    subOsc.connect(subGain);
    subGain.connect(this.masterGain);
    subOsc.start(t);
    subOsc.stop(t + 0.6);

    // Industrial crash noise burst
    const dur = 0.55;
    const bufSize = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - (i / bufSize), 1.5);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;

    const flt = this.ctx.createBiquadFilter();
    flt.type = 'bandpass';
    flt.frequency.setValueAtTime(600, t);
    flt.frequency.linearRampToValueAtTime(150, t + dur);
    flt.Q.setValueAtTime(1.5, t);

    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.7, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noise.connect(flt);
    flt.connect(nGain);
    nGain.connect(this.masterGain);

    noise.start(t);
    noise.stop(t + dur);

    // Harmonic power chord
    [220, 330, 440].forEach((freq) => {
      const hOsc = this.ctx.createOscillator();
      const hGain = this.ctx.createGain();
      hOsc.type = 'sawtooth';
      hOsc.frequency.setValueAtTime(freq, t);
      hGain.gain.setValueAtTime(0.18, t);
      hGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      hOsc.connect(hGain);
      hGain.connect(this.masterGain);
      hOsc.start(t);
      hOsc.stop(t + 0.45);
    });
  }

  // Sustained Active: Rhythmic 4-on-the-floor machine throb & motor drone
  startActiveDrone() {
    this.ensureContext();
    this.stopActiveDrone();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;

    // Harmonic low drone
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const droneGain = this.ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(55, t); // A1
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(110, t); // A2

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(260, t);

    droneGain.gain.setValueAtTime(0.001, t);
    droneGain.gain.linearRampToValueAtTime(0.22, t + 0.4);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(droneGain);
    droneGain.connect(this.masterGain);

    osc1.start(t);
    osc2.start(t);

    this.activeMotorNode = { osc1, osc2, droneGain, filter };

    // Rhythmic machine-age pulse (every 500ms = 120 BPM)
    this.activeRhythmTimer = setInterval(() => {
      if (!this.ctx || this.isMuted) return;
      const tp = this.ctx.currentTime;

      // Heavy piston punch
      const kick = this.ctx.createOscillator();
      const kickGain = this.ctx.createGain();
      kick.type = 'sine';
      kick.frequency.setValueAtTime(90, tp);
      kick.frequency.exponentialRampToValueAtTime(40, tp + 0.09);

      kickGain.gain.setValueAtTime(0.35, tp);
      kickGain.gain.exponentialRampToValueAtTime(0.001, tp + 0.1);

      kick.connect(kickGain);
      kickGain.connect(this.masterGain);
      kick.start(tp);
      kick.stop(tp + 0.1);

      // Light gear tick
      this.playNoiseTransient(0.015, 2200, 0.12);
    }, 500);
  }

  stopActiveDrone() {
    if (this.activeRhythmTimer) {
      clearInterval(this.activeRhythmTimer);
      this.activeRhythmTimer = null;
    }
    if (this.activeMotorNode && this.ctx) {
      try {
        const t = this.ctx.currentTime;
        this.activeMotorNode.droneGain.gain.linearRampToValueAtTime(0.001, t + 0.3);
        this.activeMotorNode.osc1.stop(t + 0.35);
        this.activeMotorNode.osc2.stop(t + 0.35);
      } catch (e) {
        // ignore
      }
      this.activeMotorNode = null;
    }
  }

  // Disengage / Hydraulic Purge
  playDisengage() {
    this.ensureContext();
    this.stopBuildup();
    this.stopActiveDrone();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const dur = 0.45;

    // Pneumatic air blast
    const bufSize = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - (i / bufSize), 1.2);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;

    const flt = this.ctx.createBiquadFilter();
    flt.type = 'highpass';
    flt.frequency.setValueAtTime(1200, t);
    flt.frequency.linearRampToValueAtTime(400, t + dur);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noise.connect(flt);
    flt.connect(gain);
    gain.connect(this.masterGain);

    noise.start(t);
    noise.stop(t + dur);

    // Mechanical latch release click
    setTimeout(() => {
      this.playDetent();
    }, 180);
  }

  // Safety Interlock Hazard Tone (Dissonant square-wave warning klaxon)
  playInterlockHazard() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'square';
    osc2.type = 'square';
    osc1.frequency.setValueAtTime(140, t);
    osc2.frequency.setValueAtTime(185, t);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.setValueAtTime(0.3, t + 0.15);
    gain.gain.setValueAtTime(0.01, t + 0.18);
    gain.gain.setValueAtTime(0.3, t + 0.22);
    gain.gain.setValueAtTime(0.3, t + 0.37);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.42);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.45);
    osc2.stop(t + 0.45);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
    }
    return this.isMuted;
  }
}

if (typeof window !== 'undefined') {
  window.KonstruktAudioEngine = KonstruktAudioEngine;
}
