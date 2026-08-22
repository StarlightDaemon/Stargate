// Web Audio Engine for Vesper Deep-Aperture Technosignature Console

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.ambientGain = null;
    this.masterGain = null;
    this.activeDroneNodes = [];
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.startCryogenicHum();
      this.initialized = true;
    } catch (e) {
      console.warn('AudioContext initialization deferred until user interaction:', e);
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

  startCryogenicHum() {
    if (!this.ctx) return;

    // Ambient Cryogenic Receiver Hum (sub-bass 48Hz / 52.5Hz dual oscillator)
    const humGain = this.ctx.createGain();
    humGain.gain.setValueAtTime(0.06, this.ctx.currentTime);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(110, this.ctx.currentTime);

    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(48.0, this.ctx.currentTime);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(52.8, this.ctx.currentTime);

    // Subtle LFO modulation on hum
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.18, this.ctx.currentTime);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(0.015, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(humGain.gain);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(humGain);
    humGain.connect(this.masterGain);

    osc1.start();
    osc2.start();
    lfo.start();
    this.ambientGain = humGain;
  }

  // Play a candidate coincidence chirp + correlation lock tone
  playCandidateLock(index = 0) {
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const baseFreq = 380 + (index * 85);

    // 1. Multi-Dish Coincidence Sweep Chirp (FM Sweep)
    const chirpOsc = this.ctx.createOscillator();
    const chirpGain = this.ctx.createGain();
    chirpOsc.type = 'sine';
    
    // Chirp sweeps up sharply
    chirpOsc.frequency.setValueAtTime(baseFreq * 0.7, t);
    chirpOsc.frequency.exponentialRampToValueAtTime(baseFreq * 1.8, t + 0.18);
    
    chirpGain.gain.setValueAtTime(0.0, t);
    chirpGain.gain.linearRampToValueAtTime(0.22, t + 0.04);
    chirpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    chirpOsc.connect(chirpGain);
    chirpGain.connect(this.masterGain);

    chirpOsc.start(t);
    chirpOsc.stop(t + 0.23);

    // 2. Coincidence Phase-Lock Resonant Tone
    const lockT = t + 0.16;
    const lockOsc = this.ctx.createOscillator();
    const lockOsc2 = this.ctx.createOscillator();
    const lockGain = this.ctx.createGain();

    lockOsc.type = 'triangle';
    lockOsc.frequency.setValueAtTime(baseFreq * 1.5, lockT);
    
    lockOsc2.type = 'sine';
    lockOsc2.frequency.setValueAtTime(baseFreq * 3.0, lockT); // Harmonic overtone

    lockGain.gain.setValueAtTime(0.0, lockT);
    lockGain.gain.linearRampToValueAtTime(0.28, lockT + 0.03);
    lockGain.gain.exponentialRampToValueAtTime(0.0001, lockT + 0.75);

    lockOsc.connect(lockGain);
    lockOsc2.connect(lockGain);
    lockGain.connect(this.masterGain);

    lockOsc.start(lockT);
    lockOsc2.start(lockT);
    lockOsc.stop(lockT + 0.8);
    lockOsc2.stop(lockT + 0.8);
  }

  // Dish interrogation burst (fired during coincidence check)
  playDishSample() {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800 + Math.random() * 600, t);
    gain.gain.setValueAtTime(0.04, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.07);
  }

  // Stage 1: Buildup Sound Sequence (Doppler tracking ramp, rising SNR carrier)
  playActivationBuildup(durationSeconds = 2.6) {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Deep sub-bass ramping oscillator
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sawtooth';
    subOsc.frequency.setValueAtTime(42, t);
    subOsc.frequency.exponentialRampToValueAtTime(190, t + durationSeconds);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(90, t);
    filter.frequency.exponentialRampToValueAtTime(1400, t + durationSeconds);
    filter.Q.setValueAtTime(6.0, t);

    subGain.gain.setValueAtTime(0.01, t);
    subGain.gain.linearRampToValueAtTime(0.35, t + durationSeconds);

    subOsc.connect(filter);
    filter.connect(subGain);
    subGain.connect(this.masterGain);

    subOsc.start(t);
    subOsc.stop(t + durationSeconds);

    // Harmonic Doppler pulse train
    const carrierOsc = this.ctx.createOscillator();
    const carrierGain = this.ctx.createGain();
    carrierOsc.type = 'triangle';
    carrierOsc.frequency.setValueAtTime(440, t);
    carrierOsc.frequency.linearRampToValueAtTime(880, t + durationSeconds);

    carrierGain.gain.setValueAtTime(0.0, t);
    carrierGain.gain.linearRampToValueAtTime(0.20, t + durationSeconds);

    carrierOsc.connect(carrierGain);
    carrierGain.connect(this.masterGain);

    carrierOsc.start(t);
    carrierOsc.stop(t + durationSeconds);
  }

  // Stage 2: Breakthrough Burst (Instantaneous flash impact & portal rupture)
  playActivationBreakthrough() {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Resonant burst blast
    const blastOsc = this.ctx.createOscillator();
    const blastGain = this.ctx.createGain();
    blastOsc.type = 'triangle';
    blastOsc.frequency.setValueAtTime(1320, t);
    blastOsc.frequency.exponentialRampToValueAtTime(110, t + 0.9);

    blastGain.gain.setValueAtTime(0.5, t);
    blastGain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

    blastOsc.connect(blastGain);
    blastGain.connect(this.masterGain);
    blastOsc.start(t);
    blastOsc.stop(t + 1.3);

    // High crystalline shimmer ring
    const chord = [880, 1108.73, 1320, 1760];
    chord.forEach((f) => {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0.12, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
      o.connect(g);
      g.connect(this.masterGain);
      o.start(t);
      o.stop(t + 1.9);
    });
  }

  // Stage 3: Sustained Technosignature Active Link Drone
  startSustainedActiveDrone() {
    this.ensureContext();
    if (!this.ctx) return;
    this.stopActiveDrone();

    const t = this.ctx.currentTime;
    const freqs = [110, 164.81, 220, 330, 660];
    const droneGain = this.ctx.createGain();
    droneGain.gain.setValueAtTime(0.0, t);
    droneGain.gain.linearRampToValueAtTime(0.24, t + 1.0);
    droneGain.connect(this.masterGain);

    const nodes = [];

    freqs.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      // Add subtle vibrato / LFO to each harmonic
      const lfo = this.ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.2 + i * 0.15, t);
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(1.5 + i * 0.8, t);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      const oscGain = this.ctx.createGain();
      oscGain.gain.setValueAtTime(0.18 / (i + 1), t);

      osc.connect(oscGain);
      oscGain.connect(droneGain);

      osc.start(t);
      lfo.start(t);
      nodes.push(osc, lfo, oscGain, lfoGain);
    });

    nodes.push(droneGain);
    this.activeDroneNodes = nodes;
  }

  stopActiveDrone() {
    if (!this.ctx || !this.activeDroneNodes.length) return;
    const t = this.ctx.currentTime;
    const droneGain = this.activeDroneNodes[this.activeDroneNodes.length - 1];
    if (droneGain && droneGain.gain) {
      droneGain.gain.setValueAtTime(droneGain.gain.value, t);
      droneGain.gain.linearRampToValueAtTime(0.0001, t + 0.6);
    }
    setTimeout(() => {
      this.activeDroneNodes.forEach(node => {
        if (node.stop) {
          try { node.stop(); } catch (e) {}
        }
        if (node.disconnect) {
          try { node.disconnect(); } catch (e) {}
        }
      });
      this.activeDroneNodes = [];
    }, 700);
  }

  // Disengage / Reset Sound (Resonant frequency drop)
  playDisengage() {
    this.ensureContext();
    this.stopActiveDrone();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(540, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.7);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, t);
    filter.frequency.exponentialRampToValueAtTime(60, t + 0.7);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.linearRampToValueAtTime(0.001, t + 0.75);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.8);
  }

  // Safety Hold Blocking Warning Buzz
  playSafetyHoldWarning() {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    [0, 0.18].forEach(offset => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, t + offset);

      gain.gain.setValueAtTime(0.2, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.12);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + offset);
      osc.stop(t + offset + 0.14);
    });
  }

  // Generic UI blip
  playUiBlip() {
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(920, t);
    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.06);
  }
}

export const audioEngine = new AudioEngine();
