/**
 * CAÏSSA NEURAL RECURSION WORKSTATION - PROCEDURAL WEB AUDIO SYNTHESIZER
 * Synthesizes all acoustic feedback procedurally without external audio assets.
 */

class CaissaAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.activeDrone = null;
    this.buildupNodes = null;
    this.isMuted = false;
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
      console.warn("Web Audio API not supported or blocked", e);
    }
  }

  ensureContext() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  /**
   * Sound 1: Clock-Press Plunge (Tactile Dual-Layer Impact)
   * Deep transient plunge + crisp mechanical top tick
   */
  playClockPlunge() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Layer 1: Sub Plunge
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = "sine";
    subOsc.frequency.setValueAtTime(140, now);
    subOsc.frequency.exponentialRampToValueAtTime(42, now + 0.12);

    subGain.gain.setValueAtTime(0.5, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    subOsc.connect(subGain);
    subGain.connect(this.masterGain);
    subOsc.start(now);
    subOsc.stop(now + 0.15);

    // Layer 2: Mechanical Plunge Tick
    const tickOsc = this.ctx.createOscillator();
    const tickGain = this.ctx.createGain();
    tickOsc.type = "triangle";
    tickOsc.frequency.setValueAtTime(2200, now);
    tickOsc.frequency.exponentialRampToValueAtTime(350, now + 0.04);

    tickGain.gain.setValueAtTime(0.35, now);
    tickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    tickOsc.connect(tickGain);
    tickGain.connect(this.masterGain);
    tickOsc.start(now);
    tickOsc.stop(now + 0.06);
  }

  /**
   * Sound 2: Notation-Pencil Tick
   * High-frequency acoustic impulse simulating rapid algebraic notation stamp
   */
  playNotationTick() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(3400, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.035);

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(2800, now);
    filter.Q.setValueAtTime(6.0, now);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  /**
   * Sound 3: Engine Confirm Blip
   * Pure FM synthesized frequency micro-sweep confirming node evaluation
   */
  playConfirmBlip(freqMultiplier = 1.0) {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    const baseFreq = 880 * freqMultiplier;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.08);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.11);
  }

  /**
   * Sound 4: Pruning Cutoff Zap
   * Filtered noise / rapid downward chirps indicating alpha-beta branch cutoff
   */
  playCutoffZap() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(640, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.06);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  /**
   * Sound 5: Stage 1 Buildup Siren / Engine Deepening Search Whine
   * Ascending frequency ramp with rising harmonic resonance (duration: ~2.5s)
   */
  startBuildupWhine(duration = 2.5) {
    this.ensureContext();
    if (!this.ctx) return;
    this.stopBuildupWhine();

    const now = this.ctx.currentTime;

    // Carrier 1
    const osc1 = this.ctx.createOscillator();
    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(110, now);
    osc1.frequency.exponentialRampToValueAtTime(780, now + duration);

    // Carrier 2
    const osc2 = this.ctx.createOscillator();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(165, now);
    osc2.frequency.exponentialRampToValueAtTime(1170, now + duration);

    // Filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(300, now);
    filter.frequency.exponentialRampToValueAtTime(3600, now + duration);

    // Gain
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0.5, now + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);

    this.buildupNodes = { osc1, osc2, gain, filter };
  }

  stopBuildupWhine() {
    if (this.buildupNodes && this.ctx) {
      const now = this.ctx.currentTime;
      try {
        this.buildupNodes.gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        this.buildupNodes.osc1.stop(now + 0.06);
        this.buildupNodes.osc2.stop(now + 0.06);
      } catch (e) {}
      this.buildupNodes = null;
    }
  }

  /**
   * Sound 6: Stage 2 Breakthrough Shockwave
   * Checkmate impact: sub-bass pulse + crystalline chord surge
   */
  playBreakthroughCrescendo() {
    this.stopBuildupWhine();
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Sub-bass Drop
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = "sine";
    subOsc.frequency.setValueAtTime(110, now);
    subOsc.frequency.exponentialRampToValueAtTime(36, now + 0.8);
    subGain.gain.setValueAtTime(0.7, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    subOsc.connect(subGain);
    subGain.connect(this.masterGain);
    subOsc.start(now);
    subOsc.stop(now + 1.3);

    // Crystalline Chord Burst (E Major 9th: E4, G#4, B4, D#5, F#5)
    const chordFreqs = [329.63, 415.30, 493.88, 622.25, 739.99];
    chordFreqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + idx * 0.02);

      gain.gain.setValueAtTime(0.18, now + idx * 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + idx * 0.02);
      osc.stop(now + 1.7);
    });
  }

  /**
   * Sound 7: Stage 3 Sustained Active Portal Drone
   * Harmonic wormhole resonance
   */
  startSustainedDrone() {
    this.stopSustainedDrone();
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(82.41, now); // E2

    osc2.type = "sine";
    osc2.frequency.setValueAtTime(164.81, now); // E3

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(450, now);

    // LFO for filter breath
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(0.4, now);
    lfoGain.gain.setValueAtTime(150, now);
    lfo.connect(filter.frequency);
    lfo.start(now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.24, now + 0.5);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);

    this.activeDrone = { osc1, osc2, lfo, gain, filter };
  }

  stopSustainedDrone() {
    if (this.activeDrone && this.ctx) {
      const now = this.ctx.currentTime;
      try {
        this.activeDrone.gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        this.activeDrone.osc1.stop(now + 0.35);
        this.activeDrone.osc2.stop(now + 0.35);
        this.activeDrone.lfo.stop(now + 0.35);
      } catch (e) {}
      this.activeDrone = null;
    }
  }

  /**
   * Sound 8: Blunder Warning Buzzer
   * Dissonant tritone alarm indicating interlock obstruction
   */
  playBlunderAlarm() {
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = "sawtooth";
    osc2.type = "square";
    osc1.frequency.setValueAtTime(140, now);
    osc2.frequency.setValueAtTime(198, now); // Tritone interval

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.3);
    osc2.stop(now + 0.3);
  }

  /**
   * Sound 9: Resign / Abort Deactivation
   * Downward filter sweep resolving to quiet idle
   */
  playResignSwoosh() {
    this.stopBuildupWhine();
    this.stopSustainedDrone();
    this.ensureContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.35);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + 0.35);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.4);
  }
}

window.CaissaAudio = new CaissaAudioEngine();
