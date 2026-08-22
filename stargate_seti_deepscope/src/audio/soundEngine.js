// Procedural Web Audio Engine for Argos DeepScope Technosignature Console

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.ambientGain = null;
    this.activeDroneGain = null;
    this.activeDroneNodes = [];
    this.isMuted = false;
    this.volume = 0.75;
    this.ambientEnabled = true;
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Ambient Gain
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(this.ambientEnabled ? 0.25 : 0, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);

      // Active Drone Gain
      this.activeDroneGain = this.ctx.createGain();
      this.activeDroneGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.activeDroneGain.connect(this.masterGain);

      this.startAmbientCryoLoop();
      this.setupActiveDroneLoop();

      this.isInitialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  ensureContext() {
    if (!this.isInitialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime, 0.05);
    }
  }

  toggleMute(muted) {
    this.isMuted = muted !== undefined ? muted : !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  setAmbientEnabled(enabled) {
    this.ambientEnabled = enabled;
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setTargetAtTime(enabled ? 0.25 : 0, this.ctx.currentTime, 0.1);
    }
  }

  // 1. Ambient Cryogenic Receiver Hum & Cosmic Noise Floor
  startAmbientCryoLoop() {
    if (!this.ctx) return;

    // Sub-bass 42 Hz Cryo-Cooler Pump
    const cryoOsc = this.ctx.createOscillator();
    cryoOsc.type = 'sine';
    cryoOsc.frequency.setValueAtTime(42, this.ctx.currentTime);

    const cryoFilter = this.ctx.createBiquadFilter();
    cryoFilter.type = 'lowpass';
    cryoFilter.frequency.setValueAtTime(90, this.ctx.currentTime);

    // LFO to modulate pump rhythm
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.35, this.ctx.currentTime);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(8, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(cryoOsc.frequency);

    cryoOsc.connect(cryoFilter);
    cryoFilter.connect(this.ambientGain);

    cryoOsc.start();
    lfo.start();

    // Cosmic Noise Generator (Pink/Brown noise filter)
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      output[i] = (b0 + b1 + b2 + white * 0.1) * 0.04;
    }

    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = noiseBuffer;
    noiseNode.loop = true;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(850, this.ctx.currentTime);
    noiseFilter.Q.setValueAtTime(1.2, this.ctx.currentTime);

    noiseNode.connect(noiseFilter);
    noiseFilter.connect(this.ambientGain);
    noiseNode.start();
  }

  // 2. Continuous Active Technosignature Drone Loop (for Sustained Active stage)
  setupActiveDroneLoop() {
    if (!this.ctx) return;

    // Harmonic chords: 432 Hz fundamental, 864 Hz oct, 1296 Hz 5th
    const freqs = [216, 432, 648, 864, 1296];
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(freq, this.ctx.currentTime);
      filter.Q.setValueAtTime(4.0, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.12 / freqs.length, this.ctx.currentTime);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.activeDroneGain);
      osc.start();
      this.activeDroneNodes.push({ osc, filter, gain });
    });
  }

  startActiveDrone() {
    if (!this.ctx || !this.activeDroneGain) return;
    this.activeDroneGain.gain.setTargetAtTime(0.55, this.ctx.currentTime, 0.4);
  }

  stopActiveDrone() {
    if (!this.ctx || !this.activeDroneGain) return;
    this.activeDroneGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
  }

  // 3. Coincidence Verification Dish Step Tick (10-dish cascade)
  playCoincidenceStep(dishIndex) {
    this.ensureContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // Ascending harmonic frequency per dish 0..9 (700Hz to 1600Hz)
    const baseFreq = 720 + dishIndex * 95;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
    filter.Q.setValueAtTime(8, this.ctx.currentTime);

    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  // 4. Confirmed Coordinate Lock Resonant Chime
  playLockChime(slotIndex) {
    this.ensureContext();
    if (!this.ctx) return;

    const baseNotes = [523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 1046.50]; // C5 to C6
    const fundamental = baseNotes[slotIndex % baseNotes.length] || 880;

    const now = this.ctx.currentTime;

    // Dual-sine crystalline chime
    [fundamental, fundamental * 2, fundamental * 3].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);

      const amp = 0.22 / (i + 1);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(amp, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8 + i * 0.2);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 1.2);
    });
  }

  // 5. RFI Rejection Buzz / Clack (Distinct rejection acoustic)
  playRfiRejection() {
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Low dual-saw tooth dissonant buzz
    [110, 116.54].forEach(f => {
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(380, now);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.3);
    });
  }

  // 6. Stage 1: Buildup Shepard Sweep & Cryo Surge (1.8s duration)
  playBuildupSound() {
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const duration = 1.8;

    // Rising sweep oscillator
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + duration);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(180, now);
    filter.frequency.exponentialRampToValueAtTime(3200, now + duration);
    filter.Q.setValueAtTime(6.0, now);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.linearRampToValueAtTime(0.4, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration + 0.05);

    // Sub-bass power surge
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(35, now);
    subOsc.frequency.linearRampToValueAtTime(75, now + duration);

    subGain.gain.setValueAtTime(0.1, now);
    subGain.gain.linearRampToValueAtTime(0.45, now + duration);

    subOsc.connect(subGain);
    subGain.connect(this.masterGain);

    subOsc.start(now);
    subOsc.stop(now + duration + 0.05);
  }

  // 7. Stage 2: Breakthrough Singularity Chord Flash
  playBreakthroughSound() {
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Explosive white-noise burst with fast filter sweep
    const bufferSize = this.ctx.sampleRate * 0.8;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(3000, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(300, now + 0.7);
    noiseFilter.Q.setValueAtTime(4.0, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.6, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noise.start(now);

    // Brilliant harmonic chord
    [432, 648, 864, 1296, 1728].forEach(freq => {
      const chordOsc = this.ctx.createOscillator();
      const chordGain = this.ctx.createGain();

      chordOsc.type = 'sine';
      chordOsc.frequency.setValueAtTime(freq, now);

      chordGain.gain.setValueAtTime(0.2, now);
      chordGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      chordOsc.connect(chordGain);
      chordGain.connect(this.masterGain);

      chordOsc.start(now);
      chordOsc.stop(now + 1.3);
    });

    this.startActiveDrone();
  }

  // 8. Disengage Purge & Wind-Down
  playDisengageSound() {
    this.ensureContext();
    this.stopActiveDrone();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Descending pitch wind-down
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.8);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(80, now + 0.8);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.9);

    // Pressure release hiss
    const bufferSize = this.ctx.sampleRate * 0.5;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.2;
    }

    const hiss = this.ctx.createBufferSource();
    hiss.buffer = noiseBuffer;

    const hissFilter = this.ctx.createBiquadFilter();
    hissFilter.type = 'highpass';
    hissFilter.frequency.setValueAtTime(2400, now);

    const hissGain = this.ctx.createGain();
    hissGain.gain.setValueAtTime(0.2, now);
    hissGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    hiss.connect(hissFilter);
    hissFilter.connect(hissGain);
    hissGain.connect(this.masterGain);

    hiss.start(now);
  }

  // 9. Safety Hold Alert Beep
  playSafetyHoldAlert() {
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [0, 0.14].forEach(offset => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(987.77, now + offset); // B5

      gain.gain.setValueAtTime(0.18, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.09);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + offset);
      osc.stop(now + offset + 0.1);
    });
  }

  // 10. Generic UI Click
  playUiClick() {
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, now);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.05);
  }
}

export const soundEngine = new SoundEngine();
