/**
 * VALENCE-9 Web Audio Synthesis Engine
 * 100% Procedural Web Audio API - Zero External Audio Files
 */

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.activeDroneOsc = null;
    this.activeDroneGain = null;
    this.activeTickInterval = null;
    this.isMuted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // High-frequency data routing packet chirp (on instrument/node click)
  playChirp(frequency = 1800) {
    this.init();
    if (this.isMuted || !this.ctx) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(frequency, now);
    osc1.frequency.exponentialRampToValueAtTime(frequency * 1.8, now + 0.04);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(frequency * 0.5, now);
    osc2.frequency.exponentialRampToValueAtTime(frequency * 1.2, now + 0.04);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.05);
    osc2.stop(now + 0.05);
  }

  // Crisp resonant metallic fill confirmation chime
  playFillChime(index = 0) {
    this.init();
    if (this.isMuted || !this.ctx) return;

    const now = this.ctx.currentTime;
    const baseFreqs = [523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 1046.50, 1174.66, 1318.51, 1567.98];
    const baseFreq = baseFreqs[index % baseFreqs.length];

    // Primary bell tone
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const bellGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(baseFreq, now);
    osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.02, now + 0.35);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(baseFreq * 2.76, now); // Metallic overtone

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(baseFreq * 2, now);
    filter.Q.setValueAtTime(4.0, now);

    bellGain.gain.setValueAtTime(0.28, now);
    bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc1.connect(bellGain);
    osc2.connect(filter);
    filter.connect(bellGain);
    bellGain.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.4);
    osc2.stop(now + 0.4);
  }

  // Buildup Stage: rising frequency turbine spool and acceleration pulses
  playBuildup(durationSeconds = 1.8) {
    this.init();
    if (this.isMuted || !this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const subOsc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + durationSeconds);

    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(55, now);
    subOsc.frequency.exponentialRampToValueAtTime(220, now + durationSeconds);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, now);
    filter.frequency.exponentialRampToValueAtTime(3500, now + durationSeconds);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.linearRampToValueAtTime(0.35, now + durationSeconds);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationSeconds + 0.05);

    osc.connect(filter);
    subOsc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    subOsc.start(now);
    osc.stop(now + durationSeconds + 0.05);
    subOsc.stop(now + durationSeconds + 0.05);
  }

  // Breakthrough Stage: execution bell chord + sub-bass blast + dispersion shimmer
  playBreakthrough() {
    this.init();
    if (this.isMuted || !this.ctx) return;

    const now = this.ctx.currentTime;

    // Sub-bass impact
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(140, now);
    subOsc.frequency.exponentialRampToValueAtTime(38, now + 0.6);
    subGain.gain.setValueAtTime(0.5, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    subOsc.connect(subGain);
    subGain.connect(this.masterGain);
    subOsc.start(now);
    subOsc.stop(now + 0.8);

    // Multi-voice execution bell chord (C major 9 / Lydian quantum chord)
    const chordNotes = [523.25, 659.25, 783.99, 987.77, 1174.66, 1567.98];
    chordNotes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.18 / (idx + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6 + idx * 0.15);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 2.0);
    });
  }

  // Sustained Active Ambient: quantum warp engine hum + micro-trade execution ticks
  startActiveAmbient() {
    this.stopActiveAmbient();
    this.init();
    if (this.isMuted || !this.ctx) return;

    const now = this.ctx.currentTime;
    this.activeDroneOsc = this.ctx.createOscillator();
    const subDrone = this.ctx.createOscillator();
    this.activeDroneGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    this.activeDroneOsc.type = 'sawtooth';
    this.activeDroneOsc.frequency.setValueAtTime(65.4, now); // C2

    subDrone.type = 'sine';
    subDrone.frequency.setValueAtTime(32.7, now); // C1

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(260, now);

    this.activeDroneGain.gain.setValueAtTime(0.001, now);
    this.activeDroneGain.gain.linearRampToValueAtTime(0.12, now + 0.8);

    this.activeDroneOsc.connect(filter);
    subDrone.connect(filter);
    filter.connect(this.activeDroneGain);
    this.activeDroneGain.connect(this.masterGain);

    this.activeDroneOsc.start(now);
    subDrone.start(now);
    this.activeSubDrone = subDrone;

    // Rhythmic micro-trade execution tick stream
    this.activeTickInterval = setInterval(() => {
      if (!this.ctx || this.isMuted) return;
      const tNow = this.ctx.currentTime;
      const tickOsc = this.ctx.createOscillator();
      const tickGain = this.ctx.createGain();
      const randFreq = 2400 + Math.random() * 800;
      tickOsc.type = 'sine';
      tickOsc.frequency.setValueAtTime(randFreq, tNow);
      tickGain.gain.setValueAtTime(0.03, tNow);
      tickGain.gain.exponentialRampToValueAtTime(0.0001, tNow + 0.02);
      tickOsc.connect(tickGain);
      tickGain.connect(this.masterGain);
      tickOsc.start(tNow);
      tickOsc.stop(tNow + 0.025);
    }, 180);
  }

  stopActiveAmbient() {
    if (this.activeTickInterval) {
      clearInterval(this.activeTickInterval);
      this.activeTickInterval = null;
    }
    if (this.activeDroneGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.activeDroneGain.gain.linearRampToValueAtTime(0.0001, now + 0.3);
      setTimeout(() => {
        if (this.activeDroneOsc) {
          try { this.activeDroneOsc.stop(); } catch (e) {}
          this.activeDroneOsc = null;
        }
        if (this.activeSubDrone) {
          try { this.activeSubDrone.stop(); } catch (e) {}
          this.activeSubDrone = null;
        }
      }, 350);
    }
  }

  // Disengage / Emergency Kill-Switch: downward resonant power clamp
  playDisengageDump() {
    this.stopActiveAmbient();
    this.init();
    if (this.isMuted || !this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.4);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(80, now + 0.4);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.45);
  }

  // Risk Interlock Alert / Rejection Tone
  playRiskAlert() {
    this.init();
    if (this.isMuted || !this.ctx) return;

    const now = this.ctx.currentTime;
    [0, 0.12].forEach((offset) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now + offset);
      osc.frequency.setValueAtTime(180, now + offset + 0.05);

      gain.gain.setValueAtTime(0.22, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.09);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now + offset);
      osc.stop(now + offset + 0.1);
    });
  }

  // Preset button click
  playPresetClick() {
    this.init();
    if (this.isMuted || !this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.03);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.04);
  }
}

window.soundEngine = new AudioEngine();
