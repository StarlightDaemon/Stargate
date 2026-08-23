/**
 * Web Audio API Acoustic Cathedral Synthesizer for the Grand Vitrarium
 * Synthesizes glass chimes, lead soldering hiss, cathedral bells, and pipe organ drones.
 */
class CathedralAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isMuted = false;
    this.organGain = null;
    this.organOscs = [];
    this.ambientGain = null;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.startAmbient();
    } catch (e) {
      console.warn("AudioContext init error:", e);
    }
  }

  ensureContext() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  /**
   * Phase 1 of lock: Glass piece seating into tracery frame
   */
  playGlassSeat(glyphIndex = 0) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const baseFreqs = [523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 987.77, 1046.50, 1174.66, 1318.51, 1396.91, 1567.98];
    const freq = baseFreqs[glyphIndex % baseFreqs.length] || 660;

    // Dual pure crystal sine oscillators
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, t);
    osc1.frequency.exponentialRampToValueAtTime(freq * 1.004, t + 0.6);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2.002, t);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.22, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.75);
    osc2.stop(t + 0.75);

    // Stone seating clack
    this.playStoneClack(t);
  }

  /**
   * Phase 2 of lock: Lead came solder sealing around the pane
   */
  playLeadSolder(glyphIndex = 0) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;

    // Solder flux sizzle noise
    const bufferSize = this.ctx.sampleRate * 0.35;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.1));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(3200, t);
    bandpass.Q.setValueAtTime(4.0, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.18, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);

    noise.connect(bandpass);
    bandpass.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noise.start(t);

    // Harmonic lock ping
    const ping = this.ctx.createOscillator();
    const pingGain = this.ctx.createGain();
    ping.type = 'sine';
    const baseFreqs = [1046.50, 1174.66, 1318.51, 1396.91, 1567.98, 1760.00, 1975.53, 2093.00, 2349.32, 2637.02, 2793.83, 3135.96];
    ping.frequency.setValueAtTime(baseFreqs[glyphIndex % baseFreqs.length], t + 0.05);

    pingGain.gain.setValueAtTime(0.001, t);
    pingGain.gain.linearRampToValueAtTime(0.15, t + 0.06);
    pingGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);

    ping.connect(pingGain);
    pingGain.connect(this.masterGain);

    ping.start(t + 0.05);
    ping.stop(t + 0.55);
  }

  playStoneClack(t) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.08);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  /**
   * Pending State Sanctified Chime: 7 lights locked, awaiting manual activation
   */
  playSanctifiedPendingChime() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const freqs = [392.00, 523.25, 659.25, 783.99]; // G major radiant chord

    freqs.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t + i * 0.06);

      gain.gain.setValueAtTime(0.001, t + i * 0.06);
      gain.gain.linearRampToValueAtTime(0.12, t + i * 0.06 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t + i * 0.06);
      osc.stop(t + 1.7);
    });
  }

  /**
   * Activation Stage 1: Buildup (1.8s) - Organ pedal swell, rising sunlight shimmer
   */
  startBuildupAudio() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;

    // Organ Swell (Low C 65.4Hz + G 98Hz + E 164.8Hz + Octave)
    const organChord = [65.41, 98.00, 130.81, 196.00, 261.63, 329.63, 392.00];
    this.buildupNodes = [];

    const swellGain = this.ctx.createGain();
    swellGain.gain.setValueAtTime(0.01, t);
    swellGain.gain.linearRampToValueAtTime(0.28, t + 1.8);
    swellGain.connect(this.masterGain);

    organChord.forEach(f => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, t);

      // Lowpass pipe filter
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(250, t);
      filter.frequency.linearRampToValueAtTime(900, t + 1.8);

      osc.connect(filter);
      filter.connect(swellGain);
      osc.start(t);
      this.buildupNodes.push(osc);
    });
  }

  /**
   * Activation Stage 2: Breakthrough (1.2s) - Cathedral Great Bell toll, harmonic aperture blast
   */
  playBreakthroughBlast() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;

    // 1. Cathedral Great Bronze Bell (FM synthesis with authentic inharmonic ratios)
    const fundamental = 110; // A2 deep bell
    const ratios = [1.0, 2.76, 5.40, 8.93, 11.34];
    const amplitudes = [0.4, 0.25, 0.15, 0.08, 0.04];

    ratios.forEach((r, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(fundamental * r, t);

      gain.gain.setValueAtTime(amplitudes[idx] * 0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 3.5);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 3.6);
    });

    // 2. High Crystalline Aperture Flash (Soaring glass glissando)
    const glassOsc = this.ctx.createOscillator();
    const glassGain = this.ctx.createGain();
    glassOsc.type = 'triangle';
    glassOsc.frequency.setValueAtTime(880, t);
    glassOsc.frequency.exponentialRampToValueAtTime(3520, t + 0.4);

    glassGain.gain.setValueAtTime(0.2, t);
    glassGain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

    glassOsc.connect(glassGain);
    glassGain.connect(this.masterGain);
    glassOsc.start(t);
    glassOsc.stop(t + 1.25);
  }

  /**
   * Activation Stage 3: Sustained Active - Continuous pipe organ drone + radiant glass hum
   */
  startSustainedActiveDrone() {
    this.stopDrone();
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    this.organGain = this.ctx.createGain();
    this.organGain.gain.setValueAtTime(0.001, t);
    this.organGain.gain.linearRampToValueAtTime(0.22, t + 0.5);
    this.organGain.connect(this.masterGain);

    // Dodecagonal chord: C2 (65.4Hz), G2 (98Hz), C3 (130.8Hz), E3 (164.8Hz), G3 (196Hz), B3 (246.9Hz), D4 (293.7Hz)
    const chord = [65.41, 98.00, 130.81, 164.81, 196.00, 246.94, 293.66, 523.25];

    this.organOscs = chord.map((f, i) => {
      const osc = this.ctx.createOscillator();
      osc.type = i % 2 === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(f, t);

      // Subtle chorusing detune
      osc.detune.setValueAtTime((Math.random() - 0.5) * 8, t);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(550 + i * 40, t);

      osc.connect(filter);
      filter.connect(this.organGain);
      osc.start(t);
      return osc;
    });
  }

  stopDrone() {
    if (this.buildupNodes) {
      this.buildupNodes.forEach(node => {
        try { node.stop(); } catch(e){}
      });
      this.buildupNodes = [];
    }
    if (this.organGain && this.ctx) {
      this.organGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.2);
      setTimeout(() => {
        if (this.organOscs) {
          this.organOscs.forEach(osc => {
            try { osc.stop(); } catch(e){}
          });
          this.organOscs = [];
        }
      }, 300);
    }
  }

  /**
   * Disengage: Resonant down-sweep quenching
   */
  playDisengageSound() {
    this.stopDrone();
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(784, t);
    osc.frequency.exponentialRampToValueAtTime(82, t + 0.6);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.7);

    // Stone latch clack
    this.playStoneClack(t + 0.1);
  }

  /**
   * Safety Interlock toggle sound
   */
  playLatchToggle(engaged) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(engaged ? 180 : 320, t);
    osc.frequency.exponentialRampToValueAtTime(engaged ? 80 : 440, t + 0.18);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, t);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.22);
  }

  /**
   * Blocked / Anathema Warning Buzzer (Muffled dissonance chime)
   */
  playBlockedWarning() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    [220, 233.08].forEach(f => { // Minor second jarring dissonance
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, t);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(450, t);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.45);
    });
  }

  startAmbient() {
    if (!this.ctx) return;
    // Ultra soft low sanctuary reverberant air
  }
}

const AudioEngine = new CathedralAudioEngine();
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CathedralAudioEngine;
}
