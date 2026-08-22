/**
 * VXD-9000 Procedural Web Audio Synthesizer
 * 100% synthesized sound design for the Mount Tycho Fulldome Projector Console
 */

class VXDAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.muted = false;
    this.activeDrone = null;
    this.activeDroneGain = null;
    this.activeShimmer = null;
    this.buildupNodes = null;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  ensureContext() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.7, this.ctx.currentTime);
    }
    return !this.muted;
  }

  // Delicate micro-tick on glyph/button hover
  playHover() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.04);
  }

  // Optical Collimator Step Tick (Used in Auto-Dial slew)
  playSlewTick() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(620, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(320, this.ctx.currentTime + 0.06);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.06);
  }

  // Sector Vector Lock: Mechanical Stepper Latch + Glass Resonant Ping
  playLock(index = 0) {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const baseFreqs = [523.25, 587.33, 659.25, 783.99, 880.00]; // C5, D5, E5, G5, A5
    const pitch = baseFreqs[index % baseFreqs.length];

    // Mechanical Latch Impulse
    const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.03, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.008));
    }
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 1200;
    noiseFilter.Q.value = 4;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.25, now);
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noiseSource.start(now);

    // Resonant Glass Chime
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const chimeGain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(pitch, now);
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(pitch * 2.01, now);

    chimeGain.gain.setValueAtTime(0.2, now);
    chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    osc1.connect(chimeGain);
    osc2.connect(chimeGain);
    chimeGain.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.45);
    osc2.stop(now + 0.45);
  }

  // Stage 1: Buildup (~1.8s) - Rising high-voltage xenon hum & starball turbine acceleration
  playBuildup(duration = 1.8) {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    this.stopBuildup();

    const now = this.ctx.currentTime;
    
    // Low Sub Oscillator
    const oscSub = this.ctx.createOscillator();
    oscSub.type = 'sawtooth';
    oscSub.frequency.setValueAtTime(65, now);
    oscSub.frequency.exponentialRampToValueAtTime(220, now + duration);

    // High Whine Oscillator
    const oscHigh = this.ctx.createOscillator();
    oscHigh.type = 'sine';
    oscHigh.frequency.setValueAtTime(220, now);
    oscHigh.frequency.exponentialRampToValueAtTime(1400, now + duration);

    // Filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, now);
    filter.frequency.exponentialRampToValueAtTime(3500, now + duration);
    filter.Q.value = 6;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.linearRampToValueAtTime(0.4, now + duration);

    oscSub.connect(filter);
    oscHigh.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    oscSub.start(now);
    oscHigh.start(now);

    this.buildupNodes = { oscSub, oscHigh, gain };
  }

  stopBuildup() {
    if (this.buildupNodes && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.buildupNodes.gain.gain.linearRampToValueAtTime(0.0001, now + 0.05);
        this.buildupNodes.oscSub.stop(now + 0.05);
        this.buildupNodes.oscHigh.stop(now + 0.05);
      } catch (e) {}
      this.buildupNodes = null;
    }
  }

  // Stage 2: Breakthrough Instant (~0.4s) - Fulldome Zenith Iris Detonation + Harmonic Glass Chord
  playBreakthrough() {
    this.stopBuildup();
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Sub-Bass Explosion Shockwave
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(150, now);
    subOsc.frequency.exponentialRampToValueAtTime(30, now + 0.5);
    subGain.gain.setValueAtTime(0.6, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    subOsc.connect(subGain);
    subGain.connect(this.masterGain);
    subOsc.start(now);
    subOsc.stop(now + 0.6);

    // Harmonic Chord (Maj7 + 9th - celestial wonder)
    const freqs = [261.63, 329.63, 392.00, 493.88, 587.33, 987.77];
    freqs.forEach(f => {
      const chordOsc = this.ctx.createOscillator();
      const chordGain = this.ctx.createGain();
      chordOsc.type = 'sine';
      chordOsc.frequency.setValueAtTime(f, now);
      chordGain.gain.setValueAtTime(0.12, now);
      chordGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
      chordOsc.connect(chordGain);
      chordGain.connect(this.masterGain);
      chordOsc.start(now);
      chordOsc.stop(now + 1.2);
    });
  }

  // Stage 3: Sustained Celestial Atmosphere Drone
  startActiveDrone() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    this.stopActiveDrone();

    const now = this.ctx.currentTime;
    
    // Fundamental Warm Drone
    this.activeDrone = this.ctx.createOscillator();
    this.activeDrone.type = 'triangle';
    this.activeDrone.frequency.setValueAtTime(110, now); // A2

    // Shimmer Harmonic
    this.activeShimmer = this.ctx.createOscillator();
    this.activeShimmer.type = 'sine';
    this.activeShimmer.frequency.setValueAtTime(440, now);

    // LFO Modulation for subtle breathing celestial feel
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.3, now); // 0.3 Hz cycle
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(15, now);
    lfo.connect(this.activeShimmer.frequency);
    lfo.start(now);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);

    this.activeDroneGain = this.ctx.createGain();
    this.activeDroneGain.gain.setValueAtTime(0.001, now);
    this.activeDroneGain.gain.linearRampToValueAtTime(0.18, now + 1.0);

    this.activeDrone.connect(filter);
    this.activeShimmer.connect(filter);
    filter.connect(this.activeDroneGain);
    this.activeDroneGain.connect(this.masterGain);

    this.activeDrone.start(now);
    this.activeShimmer.start(now);
  }

  stopActiveDrone() {
    if (this.activeDrone && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.activeDroneGain.gain.linearRampToValueAtTime(0.0001, now + 0.4);
        this.activeDrone.stop(now + 0.4);
        this.activeShimmer.stop(now + 0.4);
      } catch (e) {}
      this.activeDrone = null;
      this.activeShimmer = null;
      this.activeDroneGain = null;
    }
  }

  // Disengage / Abort: Damper Release Clunk & Quick Sub-Drop
  playDisengage() {
    this.stopBuildup();
    this.stopActiveDrone();

    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Reject / Inhibit Tone (e.g. when Interlock blocks activation)
  playReject() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(160, now);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.15);
  }
}

window.vxdAudio = new VXDAudioEngine();
