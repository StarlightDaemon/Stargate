/**
 * ISTITUTO DINAMICO DI PROPULSIONE E TRASLAZIONE (IDPT)
 * Procedural Web Audio Synthesis Engine
 * Pure synthesized machine-age acoustic textures: Chronophotographic shutters,
 * turbine acceleration sweeps, radial resonance hums, and pneumatic disengage.
 */

class FuturistAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.turbineGain = null;
    this.shutterGain = null;
    this.fluxGain = null;
    
    this.activeTurbineOsc = null;
    this.activeDroneOsc = null;
    this.activeLfo = null;
    this.isInitialized = false;

    // Volume levels
    this.volumes = {
      master: 0.7,
      turbine: 0.6,
      shutter: 0.8,
      flux: 0.5
    };
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();

      // Master bus
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volumes.master, this.ctx.currentTime);

      // Dynamics compressor for clean machine crunch
      const compressor = this.ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-18, this.ctx.currentTime);
      compressor.knee.setValueAtTime(12, this.ctx.currentTime);
      compressor.ratio.setValueAtTime(6, this.ctx.currentTime);
      compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      compressor.release.setValueAtTime(0.15, this.ctx.currentTime);

      this.masterGain.connect(compressor);
      compressor.connect(this.ctx.destination);

      // Sub-buses
      this.turbineGain = this.ctx.createGain();
      this.turbineGain.gain.setValueAtTime(this.volumes.turbine, this.ctx.currentTime);
      this.turbineGain.connect(this.masterGain);

      this.shutterGain = this.ctx.createGain();
      this.shutterGain.gain.setValueAtTime(this.volumes.shutter, this.ctx.currentTime);
      this.shutterGain.connect(this.masterGain);

      this.fluxGain = this.ctx.createGain();
      this.fluxGain.gain.setValueAtTime(this.volumes.flux, this.ctx.currentTime);
      this.fluxGain.connect(this.masterGain);

      this.isInitialized = true;
      this.startIdleHum();
    } catch (e) {
      console.warn('[AudioEngine] Web Audio init deferred or not supported:', e);
    }
  }

  ensureContext() {
    if (!this.isInitialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(channel, val) {
    this.volumes[channel] = Math.max(0, Math.min(1, val));
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (channel === 'master' && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.volumes.master, now, 0.05);
    } else if (channel === 'turbine' && this.turbineGain) {
      this.turbineGain.gain.setTargetAtTime(this.volumes.turbine, now, 0.05);
    } else if (channel === 'shutter' && this.shutterGain) {
      this.shutterGain.gain.setTargetAtTime(this.volumes.shutter, now, 0.05);
    } else if (channel === 'flux' && this.fluxGain) {
      this.fluxGain.gain.setTargetAtTime(this.volumes.flux, now, 0.05);
    }
  }

  // Idle Machine Hum
  startIdleHum() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(45, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(110, now);
    filter.Q.setValueAtTime(2, now);

    gain.gain.setValueAtTime(0.08, now);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.turbineGain);
    osc.start(now);
  }

  // Chronophotographic Shutter & Stator Lock
  playStatorLock(statorIndex) {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // 1. Triple Stroboscopic Shutter Clicks (Chronophotography burst)
    for (let i = 0; i < 3; i++) {
      const clickTime = now + (i * 0.045);
      const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.015, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let j = 0; j < noiseBuffer.length; j++) {
        output[j] = (Math.random() * 2 - 1) * Math.exp(-j / (noiseBuffer.length * 0.3));
      }
      const noiseNode = this.ctx.createBufferSource();
      noiseNode.buffer = noiseBuffer;

      const clickFilter = this.ctx.createBiquadFilter();
      clickFilter.type = 'bandpass';
      clickFilter.frequency.setValueAtTime(2400 + (i * 400), clickTime);
      clickFilter.Q.setValueAtTime(5, clickTime);

      const clickGain = this.ctx.createGain();
      clickGain.gain.setValueAtTime(0.5, clickTime);
      clickGain.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.015);

      noiseNode.connect(clickFilter);
      clickFilter.connect(clickGain);
      clickGain.connect(this.shutterGain);
      noiseNode.start(clickTime);
    }

    // 2. Harmonic Resonant Metallic Bell (Pitched by Stator Index)
    const baseFreq = 220 * Math.pow(1.08, statorIndex);
    const osc = this.ctx.createOscillator();
    const bellGain = this.ctx.createGain();
    const bellFilter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, now + 0.12);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.35);

    bellFilter.type = 'bandpass';
    bellFilter.frequency.setValueAtTime(baseFreq * 2, now + 0.12);
    bellFilter.Q.setValueAtTime(4, now + 0.12);

    bellGain.gain.setValueAtTime(0.001, now);
    bellGain.gain.setValueAtTime(0.35, now + 0.12);
    bellGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

    osc.connect(bellFilter);
    bellFilter.connect(bellGain);
    bellGain.connect(this.shutterGain);
    osc.start(now + 0.12);
    osc.stop(now + 0.65);
  }

  // Activation Stage 1: Buildup (Accelerazione)
  playBuildupSweep(duration = 1.8) {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Dual FM Accelerating Turbine
    const carrier = this.ctx.createOscillator();
    const modulator = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    const mainGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    carrier.type = 'sawtooth';
    carrier.frequency.setValueAtTime(70, now);
    carrier.frequency.exponentialRampToValueAtTime(680, now + duration);

    modulator.type = 'sine';
    modulator.frequency.setValueAtTime(12, now);
    modulator.frequency.exponentialRampToValueAtTime(75, now + duration);

    modGain.gain.setValueAtTime(40, now);
    modGain.gain.exponentialRampToValueAtTime(320, now + duration);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, now);
    filter.frequency.exponentialRampToValueAtTime(3800, now + duration);
    filter.Q.setValueAtTime(4, now);

    mainGain.gain.setValueAtTime(0.1, now);
    mainGain.gain.linearRampToValueAtTime(0.6, now + duration);

    modulator.connect(modGain);
    modGain.connect(carrier.frequency);
    carrier.connect(filter);
    filter.connect(mainGain);
    mainGain.connect(this.turbineGain);

    modulator.start(now);
    carrier.start(now);
    modulator.stop(now + duration + 0.1);
    carrier.stop(now + duration + 0.1);
  }

  // Activation Stage 2: Breakthrough (Frattura Cinematica)
  playBreakthroughDetonation() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Sub-bass detonation boom
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(140, now);
    subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.8);

    subGain.gain.setValueAtTime(0.8, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

    subOsc.connect(subGain);
    subGain.connect(this.fluxGain);
    subOsc.start(now);
    subOsc.stop(now + 0.95);

    // Radiant Noise Shockwave Burst
    const bufferSize = this.ctx.sampleRate * 0.6;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1800, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(400, now + 0.6);
    noiseFilter.Q.setValueAtTime(3, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.6, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.fluxGain);
    noise.start(now);
  }

  // Activation Stage 3: Sustained Active Hypersonic Drone
  startActiveDrone() {
    this.ensureContext();
    if (!this.ctx || this.activeDroneOsc) return;
    const now = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(164.81, now); // E3
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(246.94, now); // B3 (Fifth)

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.Q.setValueAtTime(3, now);

    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(4.5, now);
    lfoGain.gain.setValueAtTime(350, now);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.4);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.fluxGain);

    osc1.start(now);
    osc2.start(now);
    lfo.start(now);

    this.activeDroneOsc = { osc1, osc2, lfo, gain };
  }

  stopActiveDrone() {
    if (!this.ctx || !this.activeDroneOsc) return;
    const now = this.ctx.currentTime;
    const { osc1, osc2, lfo, gain } = this.activeDroneOsc;
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
    setTimeout(() => {
      try {
        osc1.stop();
        osc2.stop();
        lfo.stop();
      } catch (e) {}
      this.activeDroneOsc = null;
    }, 550);
  }

  // Disengage Brake & Deceleration
  playDisengage() {
    this.ensureContext();
    this.stopActiveDrone();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Pneumatic Release Hiss
    const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.4, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (noiseBuffer.length * 0.25));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(3200, now);
    filter.frequency.exponentialRampToValueAtTime(600, now + 0.4);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(now);

    // Mechanical Clunk & Spin-down tone
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.6);

    oscGain.gain.setValueAtTime(0.3, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(oscGain);
    oscGain.connect(this.turbineGain);
    osc.start(now);
    osc.stop(now + 0.65);
  }

  // Governor Hazard Alarm
  playGovernorWarning() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    for (let i = 0; i < 2; i++) {
      const t = now + (i * 0.14);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, t);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.11);
    }
  }

  // Generic Tactile Switch Click
  playClick() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.03);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.035);
  }
}

window.idptAudio = new FuturistAudioEngine();
