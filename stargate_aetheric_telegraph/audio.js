/**
 * HM Imperial Aetheric Telegraph & Pneumatic Dispatch Registry
 * Procedural Web Audio API Sound Synthesizer
 * 100% Procedural Synthesis: No External Audio Assets Required
 */

class AethericSoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isMuted = false;
    this.activeVortexDrone = null;
    this.activeGovernorWhirl = null;
  }

  init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.35, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  // Telegraph key dual-click (crisp metallic click + snappy harmonic blip)
  playTelegraphClick(pitchMultiplier = 1.0) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Fast transient click
    const osc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880 * pitchMultiplier, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.035);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400 * pitchMultiplier, now);
    filter.Q.setValueAtTime(4.0, now);

    clickGain.gain.setValueAtTime(0.4, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(filter);
    filter.connect(clickGain);
    clickGain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.04);

    // Micro mechanical contact bounce
    setTimeout(() => {
      if (!this.ctx || this.isMuted) return;
      const bounceNow = this.ctx.currentTime;
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(620 * pitchMultiplier, bounceNow);
      osc2.frequency.exponentialRampToValueAtTime(80, bounceNow + 0.02);

      gain2.gain.setValueAtTime(0.18, bounceNow);
      gain2.gain.exponentialRampToValueAtTime(0.001, bounceNow + 0.02);

      osc2.connect(gain2);
      gain2.connect(this.masterGain);
      osc2.start(bounceNow);
      osc2.stop(bounceNow + 0.025);
    }, 28);
  }

  // Heavy escapement solenoid clunk (low-frequency pitched thud + metallic resonance)
  playEscapementLock(nodeIndex = 1) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const baseFreq = 110 + (nodeIndex * 22);

    // 1. Heavy iron thud
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(baseFreq * 1.5, now);
    subOsc.frequency.exponentialRampToValueAtTime(45, now + 0.18);

    subGain.gain.setValueAtTime(0.7, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    subOsc.connect(subGain);
    subGain.connect(this.masterGain);
    subOsc.start(now);
    subOsc.stop(now + 0.19);

    // 2. Metallic bell/escapement chime resonance
    const chimeOsc = this.ctx.createOscillator();
    const chimeGain = this.ctx.createGain();
    chimeOsc.type = 'triangle';
    chimeOsc.frequency.setValueAtTime(baseFreq * 4.2, now);
    chimeOsc.frequency.exponentialRampToValueAtTime(baseFreq * 2.1, now + 0.35);

    chimeGain.gain.setValueAtTime(0.3, now);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    chimeOsc.connect(chimeGain);
    chimeGain.connect(this.masterGain);
    chimeOsc.start(now);
    chimeOsc.stop(now + 0.36);

    // 3. Steam relief puff
    this.playSteamPuff(0.2, 0.15);
  }

  // Steam pressure relief / valve hiss
  playSteamPuff(duration = 0.3, intensity = 0.25) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.45));
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, now);
    filter.Q.setValueAtTime(1.8, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(intensity, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noiseSource.start(now);
  }

  // Spark gap crackle discharge
  playSparkDischarge() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const count = 4 + Math.floor(Math.random() * 5);

    for (let i = 0; i < count; i++) {
      const sparkTime = now + (i * 0.022) + (Math.random() * 0.01);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(2400 + Math.random() * 1600, sparkTime);

      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1200, sparkTime);

      gain.gain.setValueAtTime(0.2, sparkTime);
      gain.gain.exponentialRampToValueAtTime(0.001, sparkTime + 0.025);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(sparkTime);
      osc.stop(sparkTime + 0.03);
    }
  }

  // Safety Hold lever toggle
  playInterlockSwitch(isEngaged) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Heavy mechanical lever latch
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(isEngaged ? 320 : 540, now);
    osc.frequency.exponentialRampToValueAtTime(isEngaged ? 160 : 720, now + 0.08);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.1);

    if (isEngaged) {
      // Cautionary dual-tone pip
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        const cautionNow = this.ctx.currentTime;
        const cOsc = this.ctx.createOscillator();
        const cGain = this.ctx.createGain();
        cOsc.type = 'sine';
        cOsc.frequency.setValueAtTime(440, cautionNow);
        cGain.gain.setValueAtTime(0.18, cautionNow);
        cGain.gain.exponentialRampToValueAtTime(0.001, cautionNow + 0.12);
        cOsc.connect(cGain);
        cGain.connect(this.masterGain);
        cOsc.start(cautionNow);
        cOsc.stop(cautionNow + 0.13);
      }, 70);
    }
  }

  // Governor flyball spin-up acceleration whirl
  startGovernorWhirl() {
    if (this.isMuted || this.activeGovernorWhirl) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(680, now + 1.8);

    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(4, now);
    lfo.frequency.exponentialRampToValueAtTime(18, now + 1.8);

    lfoGain.gain.setValueAtTime(35, now);
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, now);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.6);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    lfo.start(now);

    this.activeGovernorWhirl = { osc, lfo, gain, filter };
  }

  stopGovernorWhirl() {
    if (!this.activeGovernorWhirl || !this.ctx) return;
    const now = this.ctx.currentTime;
    const { osc, lfo, gain } = this.activeGovernorWhirl;

    gain.gain.linearRampToValueAtTime(0.001, now + 0.4);
    osc.stop(now + 0.45);
    lfo.stop(now + 0.45);
    this.activeGovernorWhirl = null;
  }

  // Conduit Vortex Singularity Ignition & Sustained Drone
  startConduitVortex() {
    if (this.isMuted || this.activeVortexDrone) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // 1. Initial powerful steam burst & ignition bang
    this.playSteamPuff(0.9, 0.45);
    this.playSparkDischarge();

    // 2. Dual deep harmonic resonant drone
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(55, now); // A1 bass
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(110.5, now); // Slightly detuned octave

    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(1.8, now); // Pulsing flux modulation
    lfoGain.gain.setValueAtTime(220, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, now);
    filter.Q.setValueAtTime(3.5, now);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.28, now + 1.2);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);
    lfo.start(now);

    this.activeVortexDrone = { osc1, osc2, lfo, gain, filter };
    this.startGovernorWhirl();
  }

  stopConduitVortex() {
    this.stopGovernorWhirl();
    if (!this.activeVortexDrone || !this.ctx) return;

    const now = this.ctx.currentTime;
    const { osc1, osc2, lfo, gain } = this.activeVortexDrone;

    gain.gain.linearRampToValueAtTime(0.001, now + 0.6);
    osc1.stop(now + 0.65);
    osc2.stop(now + 0.65);
    lfo.stop(now + 0.65);
    this.activeVortexDrone = null;
  }

  // Emergency Vent & Disengage
  playEmergencyVent() {
    this.stopConduitVortex();
    this.stopGovernorWhirl();

    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Immense steam dump
    this.playSteamPuff(1.2, 0.55);

    // Mechanical unlatch bang
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.25);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.26);
  }
}

export const soundEngine = new AethericSoundEngine();
