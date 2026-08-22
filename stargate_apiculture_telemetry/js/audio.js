/**
 * IPATC APICULTURE TELEMETRY NETWORK — SYNTHESIZED WEB AUDIO ENGINE
 * Pure Web Audio API synthesized audio:
 * - Ambient harmonic comb hive drone (180Hz - 450Hz natural bio-acoustic spectra)
 * - Two-part correlation sweep tone & crystalline resonance confirm chime
 * - Distinct anomaly/biosecurity warning klaxon
 * - 3-stage activation audio (Buildup harmonic riser, Breakthrough shockwave transient, Sustained active aperture hum)
 * - Disengage power-down decay
 */

class TelemetryAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.droneGain = null;
    this.droneOscillators = [];
    this.isMuted = false;
    this.isInitialized = false;
    this.activeApertureNodes = [];
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.initAmbientDrone();
      this.isInitialized = true;
      console.log('[AudioEngine] Web Audio context initialized successfully.');
    } catch (e) {
      console.warn('[AudioEngine] AudioContext initialization failed or blocked:', e);
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

  initAmbientDrone() {
    if (!this.ctx) return;
    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    this.droneGain.connect(this.masterGain);

    // Natural hive acoustic harmonic comb frequencies: 180Hz base, 240Hz queen-right harmonic, 360Hz buzz
    const freqs = [180, 240, 360, 480];
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = idx % 2 === 0 ? 'triangle' : 'sawtooth';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      // Add gentle LFO frequency modulation to simulate natural colony acoustic breathing
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(0.2 + idx * 0.1, this.ctx.currentTime);
      lfoGain.gain.setValueAtTime(2.5, this.ctx.currentTime);
      lfo.connect(osc.frequency);
      lfo.start();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.12 / (idx + 1), this.ctx.currentTime);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.droneGain);

      osc.start();
      this.droneOscillators.push({ osc, lfo });
    });
  }

  // Part 1: Correlation Sweep Chirp (when colony symbol clicked)
  playSweepChirp(freq = 240) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq * 0.7, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.18);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(freq, t);
    filter.Q.setValueAtTime(4.0, t);

    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.15, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  // Part 2: Correlation Confirm Crystalline Resonance Chime (when confidence reaches lock)
  playLockConfirm(freq = 520) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const freqs = [freq, freq * 1.5, freq * 2.0];

    freqs.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t);
      osc.frequency.exponentialRampToValueAtTime(f * 1.02, t + 0.4);

      gain.gain.setValueAtTime(0.18 / (i + 1), t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6 + i * 0.1);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.8);
    });
  }

  // Biosecurity Warning Klaxon
  playBiosecurityAlert() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.linearRampToValueAtTime(440, t + 0.15);
    osc.frequency.linearRampToValueAtTime(320, t + 0.3);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.38);
  }

  // 3-Stage Activation: Stage 1 — Buildup Harmonic Riser
  playBuildupRiser(durationSec = 2.0) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = 'sawtooth';
    osc2.type = 'triangle';

    osc1.frequency.setValueAtTime(110, t);
    osc1.frequency.exponentialRampToValueAtTime(880, t + durationSec);

    osc2.frequency.setValueAtTime(165, t);
    osc2.frequency.exponentialRampToValueAtTime(1320, t + durationSec);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, t);
    filter.frequency.exponentialRampToValueAtTime(3500, t + durationSec);

    gain.gain.setValueAtTime(0.05, t);
    gain.gain.linearRampToValueAtTime(0.35, t + durationSec * 0.9);
    gain.gain.linearRampToValueAtTime(0.45, t + durationSec);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + durationSec + 0.05);
    osc2.stop(t + durationSec + 0.05);
  }

  // 3-Stage Activation: Stage 2 — Breakthrough Shockwave Transient
  playBreakthroughShockwave() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;

    // Sub-bass thump
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(140, t);
    subOsc.frequency.exponentialRampToValueAtTime(35, t + 0.5);
    subGain.gain.setValueAtTime(0.5, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    subOsc.connect(subGain);
    subGain.connect(this.masterGain);
    subOsc.start(t);
    subOsc.stop(t + 0.65);

    // High shimmer burst
    const chord = [880, 1108.73, 1318.51, 1760];
    chord.forEach((freq) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.95);
    });
  }

  // 3-Stage Activation: Stage 3 — Sustained Active Bio-Photonic Drone
  startApertureDrone() {
    this.stopApertureDrone();
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const droneNodes = [];
    const freqs = [110, 220, 277.18, 330, 440];

    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      // Subtle slow detuning chorus
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(0.15 + idx * 0.08, t);
      lfoGain.gain.setValueAtTime(1.8, t);
      lfo.connect(osc.frequency);
      lfo.start();

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.06 / (idx * 0.6 + 1), t + 1.2);

      if (panner) {
        panner.pan.setValueAtTime((idx - 2) * 0.4, t);
        osc.connect(gain);
        gain.connect(panner);
        panner.connect(this.masterGain);
      } else {
        osc.connect(gain);
        gain.connect(this.masterGain);
      }

      osc.start(t);
      droneNodes.push({ osc, lfo, gain });
    });

    this.activeApertureNodes = droneNodes;
  }

  stopApertureDrone() {
    if (!this.ctx || !this.activeApertureNodes.length) return;
    const t = this.ctx.currentTime;
    this.activeApertureNodes.forEach(({ osc, lfo, gain }) => {
      try {
        gain.gain.linearRampToValueAtTime(0.001, t + 0.4);
        setTimeout(() => {
          try {
            osc.stop();
            lfo.stop();
          } catch (_) {}
        }, 450);
      } catch (_) {}
    });
    this.activeApertureNodes = [];
  }

  // Disengage Power-down Sonic Decay
  playDisengageSound() {
    this.stopApertureDrone();
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.45);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.55);
  }

  setVolume(val) {
    if (!this.masterGain || !this.ctx) return;
    const clamped = Math.max(0, Math.min(1, val));
    this.masterGain.gain.setValueAtTime(clamped * 0.4, this.ctx.currentTime);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.35, this.ctx.currentTime);
    }
    return this.isMuted;
  }
}

// Global singleton instance
window.telemetryAudio = new TelemetryAudioEngine();
