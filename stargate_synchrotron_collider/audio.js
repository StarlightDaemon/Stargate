/**
 * Aethel-Ring Collider (ARC) Web Audio Synthesis Engine
 * Zero external asset files. 100% procedurally synthesized accelerator acoustics.
 */

class SynchrotronAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isMuted = false;
    this.masterVolume = 0.7;

    // Continuous sound nodes
    this.coilHumGain = null;
    this.coilOsc1 = null;
    this.coilOsc2 = null;
    this.coilFilter = null;
    this.coilLfo = null;

    this.geigerGain = null;
    this.geigerInterval = null;
    this.geigerRate = 4; // clicks per sec base

    this.initialized = false;
    this.audioEnabled = true;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();

      // Master output
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.setupCoilHum();
      this.setupGeigerNoise();

      this.initialized = true;
      console.log('ARC Synchrotron Audio Engine Initialized.');
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  ensureContext() {
    if (!this.initialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(val) {
    this.masterVolume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime, 0.05);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  // --- 1. CONTINUOUS SUPERCONDUCTING MAGNET COIL HUM ---
  setupCoilHum() {
    if (!this.ctx) return;

    this.coilHumGain = this.ctx.createGain();
    this.coilHumGain.gain.setValueAtTime(0.04, this.ctx.currentTime); // gentle ambient hum

    // Low-pass resonant filter
    this.coilFilter = this.ctx.createBiquadFilter();
    this.coilFilter.type = 'lowpass';
    this.coilFilter.frequency.setValueAtTime(140, this.ctx.currentTime);
    this.coilFilter.Q.setValueAtTime(4.0, this.ctx.currentTime);

    // 60Hz main harmonic (Mains / Dipole base)
    this.coilOsc1 = this.ctx.createOscillator();
    this.coilOsc1.type = 'sawtooth';
    this.coilOsc1.frequency.setValueAtTime(58.5, this.ctx.currentTime);

    // 120Hz secondary harmonic
    this.coilOsc2 = this.ctx.createOscillator();
    this.coilOsc2.type = 'sine';
    this.coilOsc2.frequency.setValueAtTime(117.0, this.ctx.currentTime);

    // Subtle LFO drift for magnet cooling flux
    this.coilLfo = this.ctx.createOscillator();
    this.coilLfo.frequency.setValueAtTime(0.35, this.ctx.currentTime);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(15, this.ctx.currentTime);
    this.coilLfo.connect(lfoGain);
    lfoGain.connect(this.coilFilter.frequency);

    this.coilOsc1.connect(this.coilFilter);
    this.coilOsc2.connect(this.coilFilter);
    this.coilFilter.connect(this.coilHumGain);
    this.coilHumGain.connect(this.masterGain);

    this.coilOsc1.start();
    this.coilOsc2.start();
    this.coilLfo.start();
  }

  updateCoilIntensity(energyFraction, lockedCount) {
    if (!this.ctx || !this.coilFilter || !this.coilHumGain) return;
    const now = this.ctx.currentTime;
    // As more sectors lock and energy rises, coil hum deepens and opens up
    const targetFreq = 140 + lockedCount * 60 + energyFraction * 220;
    const targetGain = 0.04 + lockedCount * 0.015 + energyFraction * 0.05;
    this.coilFilter.frequency.setTargetAtTime(targetFreq, now, 0.1);
    this.coilHumGain.gain.setTargetAtTime(this.isMuted ? 0 : targetGain, now, 0.1);
  }

  // --- 2. PARTICLE DETECTOR POISSON CLICKS ---
  setupGeigerNoise() {
    if (!this.ctx) return;
    this.geigerGain = this.ctx.createGain();
    this.geigerGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    this.geigerGain.connect(this.masterGain);

    this.scheduleGeigerClick();
  }

  scheduleGeigerClick() {
    if (!this.ctx) return;
    // Next click random interval (Poisson distribution)
    const meanInterval = 1000 / (this.geigerRate || 3);
    const delay = -Math.log(1.0 - Math.random()) * meanInterval;

    setTimeout(() => {
      this.playSingleGeigerClick();
      this.scheduleGeigerClick();
    }, Math.max(20, delay));
  }

  playSingleGeigerClick() {
    if (!this.ctx || this.isMuted || !this.initialized) return;
    try {
      const now = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.003); // 3ms tiny burst
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const clickFilter = this.ctx.createBiquadFilter();
      clickFilter.type = 'bandpass';
      clickFilter.frequency.setValueAtTime(2400 + Math.random() * 800, now);
      clickFilter.Q.setValueAtTime(8, now);

      const clickGain = this.ctx.createGain();
      clickGain.gain.setValueAtTime(0.07 + Math.random() * 0.05, now);

      noise.connect(clickFilter);
      clickFilter.connect(clickGain);
      clickGain.connect(this.geigerGain);

      noise.start(now);
    } catch (e) {}
  }

  setDetectorClickRate(rate) {
    this.geigerRate = Math.max(1, Math.min(80, rate));
  }

  // --- 3. SECTOR DIPOLE ENGAGE / LOCK TONE ---
  playSectorLock(sectorIndex, totalLocked) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;

    // Harmonic pentatonic pitch based on sector lock order
    const pitches = [220, 261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33];
    const baseFreq = pitches[(totalLocked - 1) % pitches.length] || 440;

    // 1. Magnetic solenoid snap (short low thump)
    const thump = this.ctx.createOscillator();
    const thumpGain = this.ctx.createGain();
    thump.type = 'triangle';
    thump.frequency.setValueAtTime(90, now);
    thump.frequency.exponentialRampToValueAtTime(30, now + 0.12);
    thumpGain.gain.setValueAtTime(0.3, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    thump.connect(thumpGain);
    thumpGain.connect(this.masterGain);
    thump.start(now);
    thump.stop(now + 0.13);

    // 2. High-energy resonant flux lock tone (pure sine + harmonic ring)
    const tone = this.ctx.createOscillator();
    const toneGain = this.ctx.createGain();
    tone.type = 'sine';
    tone.frequency.setValueAtTime(baseFreq, now);
    tone.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.08);

    toneGain.gain.setValueAtTime(0.22, now);
    toneGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    tone.connect(toneGain);
    toneGain.connect(this.masterGain);
    tone.start(now);
    tone.stop(now + 0.46);

    // 3. Crisp RF induction ping
    const ping = this.ctx.createOscillator();
    const pingGain = this.ctx.createGain();
    ping.type = 'sine';
    ping.frequency.setValueAtTime(baseFreq * 3, now);
    pingGain.gain.setValueAtTime(0.12, now);
    pingGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    ping.connect(pingGain);
    pingGain.connect(this.masterGain);
    ping.start(now);
    ping.stop(now + 0.21);
  }

  // --- 4. BEAM INJECTION & COLLISION CRESCENDO ---
  playBeamInjection() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const duration = 2.4;

    // Ramping RF cavity chirp
    const chirp = this.ctx.createOscillator();
    const chirpGain = this.ctx.createGain();
    chirp.type = 'sawtooth';
    chirp.frequency.setValueAtTime(110, now);
    chirp.frequency.exponentialRampToValueAtTime(1760, now + duration);

    const chirpFilter = this.ctx.createBiquadFilter();
    chirpFilter.type = 'bandpass';
    chirpFilter.frequency.setValueAtTime(220, now);
    chirpFilter.frequency.exponentialRampToValueAtTime(3200, now + duration);
    chirpFilter.Q.setValueAtTime(5, now);

    chirpGain.gain.setValueAtTime(0.01, now);
    chirpGain.gain.linearRampToValueAtTime(0.28, now + duration * 0.85);
    chirpGain.gain.exponentialRampToValueAtTime(0.001, now + duration + 0.1);

    chirp.connect(chirpFilter);
    chirpFilter.connect(chirpGain);
    chirpGain.connect(this.masterGain);

    chirp.start(now);
    chirp.stop(now + duration + 0.1);
  }

  playCollisionEvent() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;

    // 1. Massive Sub-Bass Collision Shockwave (32Hz drop)
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(90, now);
    subOsc.frequency.exponentialRampToValueAtTime(28, now + 1.2);

    subGain.gain.setValueAtTime(0.7, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);

    subOsc.connect(subGain);
    subGain.connect(this.masterGain);
    subOsc.start(now);
    subOsc.stop(now + 2.3);

    // 2. High-Energy Ionization Burst (White noise filtered sweep)
    const noiseLength = 1.8;
    const bufferSize = Math.floor(this.ctx.sampleRate * noiseLength);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.8);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1800, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(450, now + 1.5);
    noiseFilter.Q.setValueAtTime(3.5, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.45, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noise.start(now);

    // 3. Relativistic Inversion Shimmer (Harmonic Chord)
    [440, 554.37, 659.25, 880, 1108.7].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * 1.2, now);
      osc.frequency.exponentialRampToValueAtTime(freq, now + 0.4);

      g.gain.setValueAtTime(0.08 / (idx + 1), now);
      g.gain.linearRampToValueAtTime(0.12 / (idx + 1), now + 0.3);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(now + idx * 0.03);
      osc.stop(now + 2.6);
    });
  }

  // --- 5. BEAM DUMP / CRYOGENIC VENT ---
  playBeamDump() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;

    // 1. Heavy Dump Kicker Relay Thud
    const thud = this.ctx.createOscillator();
    const thudGain = this.ctx.createGain();
    thud.type = 'sawtooth';
    thud.frequency.setValueAtTime(120, now);
    thud.frequency.exponentialRampToValueAtTime(30, now + 0.25);
    thudGain.gain.setValueAtTime(0.4, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    thud.connect(thudGain);
    thudGain.connect(this.masterGain);
    thud.start(now);
    thud.stop(now + 0.26);

    // 2. Cryogenic Helium Exhaust Hiss
    const ventDuration = 1.2;
    const bufferSize = Math.floor(this.ctx.sampleRate * ventDuration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
    }

    const vent = this.ctx.createBufferSource();
    vent.buffer = buffer;

    const ventFilter = this.ctx.createBiquadFilter();
    ventFilter.type = 'lowpass';
    ventFilter.frequency.setValueAtTime(1200, now);
    ventFilter.frequency.linearRampToValueAtTime(300, now + ventDuration);

    const ventGain = this.ctx.createGain();
    ventGain.gain.setValueAtTime(0.35, now);
    ventGain.gain.exponentialRampToValueAtTime(0.001, now + ventDuration);

    vent.connect(ventFilter);
    ventFilter.connect(ventGain);
    ventGain.connect(this.masterGain);

    vent.start(now);
  }

  // --- 6. QUENCH INTERLOCK TRIP ALARM ---
  playQuenchAlarm() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const startTime = now + i * 0.16;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, startTime);
      osc.frequency.setValueAtTime(659.25, startTime + 0.07);

      g.gain.setValueAtTime(0.2, startTime);
      g.gain.exponentialRampToValueAtTime(0.001, startTime + 0.14);

      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(startTime);
      osc.stop(startTime + 0.15);
    }
  }

  // --- 7. TACTILE UI RELAY CLICK ---
  playUiClick() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.03);
    g.gain.setValueAtTime(0.12, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.04);
  }
}

// Export global instance
window.synchrotronAudio = new SynchrotronAudioEngine();
