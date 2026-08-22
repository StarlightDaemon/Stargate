/**
 * CelestialAudio - Procedural Web Audio Synthesizer
 * Hyperion Astronavigation Institute // Series IX Digital Astrolabe
 * Zero external dependencies. All sound synthesized in real-time.
 */

class CelestialAudio {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterGain = null;
    this.compressor = null;
    this.ambientGain = null;
    this.ambientNodes = [];
    this.activePortalGain = null;
    this.activePortalNodes = [];
    this.servoOsc = null;
    this.servoGain = null;
    this.servoFilter = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      // Master Compressor to prevent distortion
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-12, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(40, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(12, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);

      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.ctx.destination);

      this.startAmbientHum();
      this.initServoSynth();
      this.initialized = true;

      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    } catch (e) {
      console.warn('Web Audio initialization error:', e);
    }
  }

  ensureContext() {
    if (!this.initialized) {
      this.init();
    } else if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMasterVolume(val) {
    if (!this.masterGain || !this.ctx) return;
    const gain = Math.max(0, Math.min(1, val));
    this.masterGain.gain.setTargetAtTime(gain, this.ctx.currentTime, 0.05);
  }

  setMute(mute) {
    this.isMuted = mute;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(mute ? 0 : 0.8, this.ctx.currentTime, 0.05);
    }
  }

  // Continuous background reactor & gyro hum
  startAmbientHum() {
    if (!this.ctx || this.isMuted) return;

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    this.ambientGain.connect(this.masterGain);

    // Deep sub drone (55Hz - A1)
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(55, this.ctx.currentTime);

    // Detuned second oscillator for subtle binaural beat (55.4Hz)
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(55.4, this.ctx.currentTime);

    // Low pass filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, this.ctx.currentTime);

    // LFO for slow atmospheric breathing
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.15, this.ctx.currentTime); // 0.15 Hz cycle
    lfoGain.gain.setValueAtTime(30, this.ctx.currentTime);

    lfo.connect(filter.frequency);
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(this.ambientGain);

    osc1.start();
    osc2.start();
    lfo.start();

    this.ambientNodes = [osc1, osc2, lfo, filter, this.ambientGain];
  }

  // Rete Gimbal Servo Sound
  initServoSynth() {
    if (!this.ctx) return;
    this.servoGain = this.ctx.createGain();
    this.servoGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.servoGain.connect(this.masterGain);

    this.servoFilter = this.ctx.createBiquadFilter();
    this.servoFilter.type = 'bandpass';
    this.servoFilter.frequency.setValueAtTime(480, this.ctx.currentTime);
    this.servoFilter.Q.setValueAtTime(4.0, this.ctx.currentTime);

    this.servoOsc = this.ctx.createOscillator();
    this.servoOsc.type = 'sawtooth';
    this.servoOsc.frequency.setValueAtTime(120, this.ctx.currentTime);

    this.servoOsc.connect(this.servoFilter);
    this.servoFilter.connect(this.servoGain);
    this.servoOsc.start();
  }

  updateServo(velocity) {
    if (!this.ctx || !this.servoGain || !this.servoOsc || this.isMuted) return;
    const speed = Math.abs(velocity);
    if (speed < 0.0001) {
      this.servoGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.08);
    } else {
      const targetGain = Math.min(0.25, speed * 2.5);
      const targetFreq = 120 + Math.min(600, speed * 2800);
      const filterFreq = 300 + Math.min(1800, speed * 6000);

      this.servoGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
      this.servoOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.05);
      this.servoFilter.frequency.setTargetAtTime(filterFreq, this.ctx.currentTime, 0.05);
    }
  }

  // UI Navigation / Star Selection click
  playSightSelect(index = 0) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const baseFreq = 440 * Math.pow(2, (index % 12) / 12);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, t + 0.08);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.13);
  }

  // ROTATIONAL ALIGNMENT LOCK CHIME
  // Unique crystalline multi-harmonic resonant ping when star aligns with altitude circle
  playAlignmentLock(starIndex = 0, altitude = 45) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const fundamental = 520 + (altitude * 6); // Grounded in star altitude
    const harmonics = [1.0, 1.498, 2.0, 2.756]; // Crystal harmonic ratio

    harmonics.forEach((ratio, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const freq = fundamental * ratio;

      osc.type = i === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.995, t + 0.6);

      const amp = (0.22 / (i + 1));
      gain.gain.setValueAtTime(amp, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.55 + (i * 0.1));

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.7);
    });

    // Optical Caliper Click Transient
    const clickOsc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    clickOsc.type = 'square';
    clickOsc.frequency.setValueAtTime(2400, t);
    clickOsc.frequency.exponentialRampToValueAtTime(300, t + 0.02);
    clickGain.gain.setValueAtTime(0.15, t);
    clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

    clickOsc.connect(clickGain);
    clickGain.connect(this.masterGain);
    clickOsc.start(t);
    clickOsc.stop(t + 0.04);
  }

  // Interlock Switch Toggle Click
  playInterlockClick(engaged = false) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(engaged ? 320 : 640, t);
    osc.frequency.exponentialRampToValueAtTime(engaged ? 160 : 480, t + 0.05);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.07);
  }

  // Ephemeris calculation data chirp
  playDataChirp() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const f1 = 1200 + Math.random() * 800;
    const f2 = f1 + (Math.random() > 0.5 ? 400 : -300);
    osc.frequency.setValueAtTime(f1, t);
    osc.frequency.setValueAtTime(f2, t + 0.02);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.05);
  }

  // STAGED ACTIVATION 1: BUILDUP RISER (1.8s)
  playBuildupRiser(duration = 1.8) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    
    // Sub bass swell
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sawtooth';
    subOsc.frequency.setValueAtTime(60, t);
    subOsc.frequency.exponentialRampToValueAtTime(240, t + duration);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(100, t);
    filter.frequency.exponentialRampToValueAtTime(1600, t + duration);

    subGain.gain.setValueAtTime(0.1, t);
    subGain.gain.linearRampToValueAtTime(0.4, t + duration);

    subOsc.connect(filter);
    filter.connect(subGain);
    subGain.connect(this.masterGain);

    subOsc.start(t);
    subOsc.stop(t + duration);

    // High frequency shimmering riser
    const shimmerOsc = this.ctx.createOscillator();
    const shimmerGain = this.ctx.createGain();
    shimmerOsc.type = 'sine';
    shimmerOsc.frequency.setValueAtTime(800, t);
    shimmerOsc.frequency.exponentialRampToValueAtTime(3600, t + duration);

    shimmerGain.gain.setValueAtTime(0.02, t);
    shimmerGain.gain.linearRampToValueAtTime(0.25, t + duration);

    shimmerOsc.connect(shimmerGain);
    shimmerGain.connect(this.masterGain);

    shimmerOsc.start(t);
    shimmerOsc.stop(t + duration);
  }

  // STAGED ACTIVATION 2: BREAKTHROUGH WARP DETONATION & SINGULARITY
  playBreakthrough() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;

    // Sub-bass singularity shockwave
    const boomOsc = this.ctx.createOscillator();
    const boomGain = this.ctx.createGain();
    boomOsc.type = 'sine';
    boomOsc.frequency.setValueAtTime(180, t);
    boomOsc.frequency.exponentialRampToValueAtTime(32, t + 0.8);

    boomGain.gain.setValueAtTime(0.7, t);
    boomGain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

    boomOsc.connect(boomGain);
    boomGain.connect(this.masterGain);

    boomOsc.start(t);
    boomOsc.stop(t + 1.25);

    // Resonant Gate Open Blast
    const bellOsc = this.ctx.createOscillator();
    const bellGain = this.ctx.createGain();
    bellOsc.type = 'triangle';
    bellOsc.frequency.setValueAtTime(880, t);
    bellOsc.frequency.exponentialRampToValueAtTime(440, t + 1.5);

    bellGain.gain.setValueAtTime(0.4, t);
    bellGain.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);

    bellOsc.connect(bellGain);
    bellGain.connect(this.masterGain);

    bellOsc.start(t);
    bellOsc.stop(t + 1.65);
  }

  // STAGED ACTIVATION 3: SUSTAINED PORTAL CONDUIT SOUND
  startSustainedPortal() {
    this.stopSustainedPortal();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    this.activePortalGain = this.ctx.createGain();
    this.activePortalGain.gain.setValueAtTime(0.01, t);
    this.activePortalGain.gain.linearRampToValueAtTime(0.28, t + 0.5);
    this.activePortalGain.connect(this.masterGain);

    // Warm chord vortex
    const freqs = [110, 164.81, 220, 329.63]; // A major 7th / cosmic resonance
    const nodes = [];

    freqs.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(f, t);

      // Add slight detune for fluid movement
      const detuneLFO = this.ctx.createOscillator();
      const detuneGain = this.ctx.createGain();
      detuneLFO.frequency.setValueAtTime(0.2 + (i * 0.1), t);
      detuneGain.gain.setValueAtTime(4 + (i * 2), t);
      detuneLFO.connect(detuneGain);
      detuneGain.connect(osc.detune);
      detuneLFO.start(t);

      gain.gain.setValueAtTime(0.25 / freqs.length, t);
      osc.connect(gain);
      gain.connect(this.activePortalGain);
      osc.start(t);

      nodes.push(osc, detuneLFO, detuneGain, gain);
    });

    // Pink noise shimmer buffer
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1200, t);
    noiseFilter.Q.setValueAtTime(3.0, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.15, t);

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.activePortalGain);
    whiteNoise.start(t);

    nodes.push(whiteNoise, noiseFilter, noiseGain);
    this.activePortalNodes = nodes;
  }

  stopSustainedPortal() {
    if (this.activePortalGain && this.ctx) {
      const t = this.ctx.currentTime;
      this.activePortalGain.gain.setTargetAtTime(0, t, 0.15);
      setTimeout(() => {
        this.activePortalNodes.forEach(n => {
          try { n.stop && n.stop(); n.disconnect && n.disconnect(); } catch(e){}
        });
        this.activePortalNodes = [];
        this.activePortalGain = null;
      }, 250);
    }
  }

  // DISENGAGE: Hydraulic Vent & Field Collapse
  playDisengage() {
    this.ensureContext();
    this.stopSustainedPortal();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;

    // Power down drop
    const dropOsc = this.ctx.createOscillator();
    const dropGain = this.ctx.createGain();
    dropOsc.type = 'sawtooth';
    dropOsc.frequency.setValueAtTime(340, t);
    dropOsc.frequency.exponentialRampToValueAtTime(40, t + 0.7);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(80, t + 0.7);

    dropGain.gain.setValueAtTime(0.35, t);
    dropGain.gain.exponentialRampToValueAtTime(0.001, t + 0.75);

    dropOsc.connect(filter);
    filter.connect(dropGain);
    dropGain.connect(this.masterGain);

    dropOsc.start(t);
    dropOsc.stop(t + 0.8);

    // Air release / hydraulic hiss
    const bufferSize = this.ctx.sampleRate * 0.5;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.1;
    }
    const hiss = this.ctx.createBufferSource();
    hiss.buffer = noiseBuffer;
    const hissGain = this.ctx.createGain();
    hissGain.gain.setValueAtTime(0.2, t);
    hissGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    hiss.connect(hissGain);
    hissGain.connect(this.masterGain);
    hiss.start(t);
  }
}

window.CelestialAudio = CelestialAudio;
