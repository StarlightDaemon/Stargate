/**
 * Stargate Orthographic CAD Terminal - Web Audio Engine
 * Bureau: Aethelgard-Voss Structural Telemetrics & CAD Engineering Bureau
 * Generates all CAD acoustic feedback procedurally via Web Audio API.
 */

class CadAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.activeDroneGain = null;
    this.activeOscillators = [];
    this.buildupOscillators = [];
    this.buildupGain = null;
    this.isMuted = false;
    this.hasInteracted = false;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      
      // Dynamic range compressor to prevent clipping during breakthrough
      const compressor = this.ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-12, this.ctx.currentTime);
      compressor.knee.setValueAtTime(8, this.ctx.currentTime);
      compressor.ratio.setValueAtTime(4, this.ctx.currentTime);
      compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      compressor.release.setValueAtTime(0.25, this.ctx.currentTime);

      this.masterGain.connect(compressor);
      compressor.connect(this.ctx.destination);
    } catch (e) {
      console.warn("AudioContext not supported or blocked", e);
    }
  }

  ensureContext() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  /**
   * Sound: Plotter-pen drafting inking line
   * High-frequency filtered noise burst + crisp acoustic scratch
   */
  playPlotterInk() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.04));
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(3200, t);
    filter.frequency.exponentialRampToValueAtTime(1400, t + 0.12);
    filter.Q.setValueAtTime(4.5, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    whiteNoise.start(t);

    // Micro chirp tone for vector cursor
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(1850, t);
    osc.frequency.exponentialRampToValueAtTime(2400, t + 0.08);
    
    oscGain.gain.setValueAtTime(0.12, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  /**
   * Sound: Precision Caliper Lock Clamp
   * Piezoelectric servo snap with resonant metallic body ping
   */
  playCaliperClamp(index = 0) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const baseFreq = 220 + index * 45;

    // Sub thump
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = "sine";
    subOsc.frequency.setValueAtTime(140, t);
    subOsc.frequency.exponentialRampToValueAtTime(40, t + 0.15);
    subGain.gain.setValueAtTime(0.6, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    subOsc.connect(subGain);
    subGain.connect(this.masterGain);
    subOsc.start(t);
    subOsc.stop(t + 0.16);

    // Metallic detent ping
    const pingOsc = this.ctx.createOscillator();
    const pingGain = this.ctx.createGain();
    pingOsc.type = "sine";
    pingOsc.frequency.setValueAtTime(baseFreq * 2.5, t);
    pingOsc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, t + 0.22);
    pingGain.gain.setValueAtTime(0.35, t);
    pingGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    pingOsc.connect(pingGain);
    pingGain.connect(this.masterGain);
    pingOsc.start(t);
    pingOsc.stop(t + 0.23);

    // Mechanical clamp friction
    const noiseLen = this.ctx.sampleRate * 0.06;
    const noiseBuffer = this.ctx.createBuffer(1, noiseLen, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) {
      data[i] = (Math.random() * 2 - 1);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const nFilter = this.ctx.createBiquadFilter();
    nFilter.type = "bandpass";
    nFilter.frequency.setValueAtTime(4500, t);
    nFilter.Q.setValueAtTime(6.0, t);
    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.2, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    noise.connect(nFilter);
    nFilter.connect(nGain);
    nGain.connect(this.masterGain);
    noise.start(t);
  }

  /**
   * Sound: Vector rotor indexing rotation
   */
  playRotorMove() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(65, t);
    osc.frequency.linearRampToValueAtTime(95, t + 0.15);
    osc.frequency.linearRampToValueAtTime(55, t + 0.35);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(350, t);
    filter.frequency.linearRampToValueAtTime(700, t + 0.15);
    filter.frequency.exponentialRampToValueAtTime(200, t + 0.35);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.36);
  }

  /**
   * Sound: Activation Stage 1 - Buildup (2.0s duration)
   * Rising dual-oscillator FM harmonic chord with resonant sweep
   */
  startBuildup(duration = 2.0) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    this.stopBuildup();

    const t = this.ctx.currentTime;
    this.buildupGain = this.ctx.createGain();
    this.buildupGain.gain.setValueAtTime(0.01, t);
    this.buildupGain.gain.exponentialRampToValueAtTime(0.45, t + duration * 0.85);
    this.buildupGain.gain.linearRampToValueAtTime(0.55, t + duration);
    this.buildupGain.connect(this.masterGain);

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(150, t);
    filter.frequency.exponentialRampToValueAtTime(3600, t + duration);
    filter.Q.setValueAtTime(5.5, t);
    filter.connect(this.buildupGain);

    // 3 harmonic sweep oscillators
    const freqs = [110, 164.81, 220]; // A2, E3, A3
    freqs.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      osc.type = idx === 0 ? "sawtooth" : "triangle";
      osc.frequency.setValueAtTime(f, t);
      osc.frequency.exponentialRampToValueAtTime(f * 4.5, t + duration);
      osc.connect(filter);
      osc.start(t);
      osc.stop(t + duration + 0.05);
      this.buildupOscillators.push(osc);
    });

    // Rapid CAD clock pulse / vector clock tick
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(8, t);
    lfo.frequency.exponentialRampToValueAtTime(48, t + duration);
    lfoGain.gain.setValueAtTime(0.15, t);
    lfo.connect(lfoGain.gain);
    this.buildupOscillators.push(lfo);
  }

  stopBuildup() {
    if (this.buildupGain && this.ctx) {
      try {
        this.buildupGain.gain.setValueAtTime(0, this.ctx.currentTime);
      } catch (e) {}
    }
    this.buildupOscillators.forEach(osc => {
      try { osc.stop(); } catch (e) {}
    });
    this.buildupOscillators = [];
  }

  /**
   * Sound: Activation Stage 2 - Breakthrough Instant
   * Sub-bass shockwave + white-noise burst + harmonic singularity resonance
   */
  playBreakthrough() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    this.stopBuildup();
    const t = this.ctx.currentTime;

    // 1. Heavy sub bass detonation
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = "sine";
    subOsc.frequency.setValueAtTime(180, t);
    subOsc.frequency.exponentialRampToValueAtTime(32, t + 0.6);
    subGain.gain.setValueAtTime(0.85, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
    subOsc.connect(subGain);
    subGain.connect(this.masterGain);
    subOsc.start(t);
    subOsc.stop(t + 1.25);

    // 2. White-noise shockwave burst
    const noiseDuration = 1.4;
    const noiseSize = Math.floor(this.ctx.sampleRate * noiseDuration);
    const buffer = this.ctx.createBuffer(1, noiseSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < noiseSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.35));
    }
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.setValueAtTime(4200, t);
    noiseFilter.frequency.exponentialRampToValueAtTime(450, t + noiseDuration);
    noiseFilter.Q.setValueAtTime(2.5, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.55, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + noiseDuration);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noiseSource.start(t);

    // 3. High radiant chime
    const chime = this.ctx.createOscillator();
    const chimeGain = this.ctx.createGain();
    chime.type = "sine";
    chime.frequency.setValueAtTime(1760, t);
    chime.frequency.exponentialRampToValueAtTime(880, t + 0.8);
    chimeGain.gain.setValueAtTime(0.4, t);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
    chime.connect(chimeGain);
    chimeGain.connect(this.masterGain);
    chime.start(t);
    chime.stop(t + 0.85);
  }

  /**
   * Sound: Activation Stage 3 - Sustained Active State
   * Continuous deep telemetric plasma hum with gentle dynamic modulation
   */
  startActiveDrone() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    this.stopActiveDrone();

    const t = this.ctx.currentTime;
    this.activeDroneGain = this.ctx.createGain();
    this.activeDroneGain.gain.setValueAtTime(0.001, t);
    this.activeDroneGain.gain.exponentialRampToValueAtTime(0.32, t + 0.8);
    this.activeDroneGain.connect(this.masterGain);

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(650, t);
    filter.Q.setValueAtTime(2.0, t);
    filter.connect(this.activeDroneGain);

    // Fundamental tones: 55Hz (A1), 110Hz (A2), 165Hz (E3)
    const tones = [55, 110, 164.81];
    tones.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      osc.type = i === 0 ? "sawtooth" : "sine";
      osc.frequency.setValueAtTime(f, t);

      // Subtle chorusing LFO
      const lfo = this.ctx.createOscillator();
      const lfoG = this.ctx.createGain();
      lfo.frequency.setValueAtTime(0.2 + i * 0.15, t);
      lfoG.gain.setValueAtTime(1.5, t);
      lfo.connect(osc.frequency);
      lfo.start(t);

      osc.connect(filter);
      osc.start(t);
      this.activeOscillators.push(osc, lfo);
    });
  }

  stopActiveDrone() {
    if (this.activeDroneGain && this.ctx) {
      try {
        this.activeDroneGain.gain.setValueAtTime(this.activeDroneGain.gain.value, this.ctx.currentTime);
        this.activeDroneGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.5);
      } catch (e) {}
    }
    setTimeout(() => {
      this.activeOscillators.forEach(osc => {
        try { osc.stop(); } catch (e) {}
      });
      this.activeOscillators = [];
    }, 550);
  }

  /**
   * Sound: Disengage Manifold Purge
   * Downward servo whine + pneumatic pressure release
   */
  playDisengage() {
    this.ensureContext();
    this.stopBuildup();
    this.stopActiveDrone();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;

    // Pitch drop
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(42, t + 0.6);
    
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(900, t);
    filter.frequency.exponentialRampToValueAtTime(100, t + 0.6);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.62);

    // Pneumatic release hiss
    const hissLen = this.ctx.sampleRate * 0.45;
    const buffer = this.ctx.createBuffer(1, hissLen, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < hissLen; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.18));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const nFilter = this.ctx.createBiquadFilter();
    nFilter.type = "bandpass";
    nFilter.frequency.setValueAtTime(2200, t);
    nFilter.frequency.exponentialRampToValueAtTime(400, t + 0.45);

    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.28, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    noise.connect(nFilter);
    nFilter.connect(nGain);
    nGain.connect(this.masterGain);
    noise.start(t);
  }

  /**
   * Sound: Safety Interlock Blocked Alarm
   * Staccato triple-square warning tone
   */
  playInterlockWarning() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const beeps = [880, 720, 580];
    
    beeps.forEach((freq, idx) => {
      const startTime = t + idx * 0.1;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.07);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + 0.08);
    });
  }

  /**
   * Sound: UI Micro Click
   */
  playClick() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1400, t);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.035);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.35, this.ctx.currentTime);
    }
    return this.isMuted;
  }
}

export const cadAudio = new CadAudioEngine();
