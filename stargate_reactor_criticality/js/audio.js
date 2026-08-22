/**
 * TX-77 'AURA' Nuclear Reactor Criticality HMI
 * Procedural Web Audio Engine (100% Native Web Audio API)
 */

class HMIAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.humGain = null;
    this.fxGain = null;
    this.isMuted = false;

    this.masterVol = 0.75;
    this.humVol = 0.50;
    this.fxVol = 0.80;

    this.humNodes = [];
    this.apertureHumNode = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.masterVol, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Hum Sub-Bus
      this.humGain = this.ctx.createGain();
      this.humGain.gain.setValueAtTime(this.humVol, this.ctx.currentTime);
      this.humGain.connect(this.masterGain);

      // FX Sub-Bus
      this.fxGain = this.ctx.createGain();
      this.fxGain.gain.setValueAtTime(this.fxVol, this.ctx.currentTime);
      this.fxGain.connect(this.masterGain);

      this.startCoolantHum();
      this.initialized = true;
    } catch (e) {
      console.warn('AudioContext initialization failed or blocked:', e);
    }
  }

  resumeIfSuspended() {
    if (!this.initialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  startCoolantHum() {
    if (!this.ctx) return;
    try {
      // 55Hz Base Sub-Pump
      const osc1 = this.ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(55.0, this.ctx.currentTime);

      // 110Hz Harmonic
      const osc2 = this.ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(110.2, this.ctx.currentTime);

      // LFO for slow coolant flow pulsation
      const lfo = this.ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.35, this.ctx.currentTime);
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(4.0, this.ctx.currentTime);
      lfo.connect(osc1.frequency);

      // Lowpass filter to muffle and create heavy mechanical cabinet acoustic
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(180, this.ctx.currentTime);

      const subGain = this.ctx.createGain();
      subGain.gain.setValueAtTime(0.35, this.ctx.currentTime);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(subGain);
      subGain.connect(this.humGain);

      osc1.start();
      osc2.start();
      lfo.start();

      this.humNodes = [osc1, osc2, lfo, subGain];
    } catch (e) {
      console.warn('Could not start coolant hum:', e);
    }
  }

  playRodServo(durationMs = 600) {
    this.resumeIfSuspended();
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const dur = durationMs / 1000;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(480, now + dur);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(400, now);
      filter.Q.setValueAtTime(3.0, now);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.fxGain);

      osc.start(now);
      osc.stop(now + dur);
    } catch (e) {}
  }

  playFluxStabilizedChime() {
    this.resumeIfSuspended();
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;

      // Resonant harmonic pair: 528Hz (Harmonic Solfeggio) + 792Hz (Perfect 5th)
      const freqs = [528.0, 792.0, 1056.0];
      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        const decay = 1.2 + idx * 0.3;
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.18 / (idx + 1), now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

        osc.connect(gain);
        gain.connect(this.fxGain);

        osc.start(now);
        osc.stop(now + decay);
      });
    } catch (e) {}
  }

  playBuildupSound(durationMs = 2200) {
    this.resumeIfSuspended();
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const dur = durationMs / 1000;

      // Ascending prompt neutron resonance tone
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + dur);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.4, now + dur);

      osc.connect(gain);
      gain.connect(this.fxGain);

      osc.start(now);
      osc.stop(now + dur);
    } catch (e) {}
  }

  playCherenkovBreakthrough() {
    this.resumeIfSuspended();
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;

      // 1. White noise burst (Cherenkov radiation shockwave)
      const bufferSize = this.ctx.sampleRate * 1.5;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3000, now);
      filter.frequency.exponentialRampToValueAtTime(300, now + 1.5);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.4, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.fxGain);

      whiteNoise.start(now);

      // 2. High-energy harmonic chord surge (D Major 9: 587.33Hz, 739.99Hz, 880Hz, 1108.73Hz)
      const chord = [587.33, 739.99, 880.0, 1108.73];
      chord.forEach(f => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now);

        g.gain.setValueAtTime(0.01, now);
        g.gain.linearRampToValueAtTime(0.2, now + 0.08);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);

        osc.connect(g);
        g.connect(this.fxGain);

        osc.start(now);
        osc.stop(now + 2.0);
      });
    } catch (e) {}
  }

  playScramKlaxon() {
    this.resumeIfSuspended();
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;

      // Heavy pneumatic rod slam thump
      const thumpOsc = this.ctx.createOscillator();
      const thumpGain = this.ctx.createGain();
      thumpOsc.type = 'sine';
      thumpOsc.frequency.setValueAtTime(140, now);
      thumpOsc.frequency.exponentialRampToValueAtTime(30, now + 0.3);

      thumpGain.gain.setValueAtTime(0.8, now);
      thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      thumpOsc.connect(thumpGain);
      thumpGain.connect(this.fxGain);
      thumpOsc.start(now);
      thumpOsc.stop(now + 0.35);

      // Dual-tone SCRAM warning alarm burst (440Hz / 350Hz alternating)
      for (let i = 0; i < 2; i++) {
        const start = now + 0.15 + i * 0.4;
        const alarmOsc = this.ctx.createOscillator();
        const alarmGain = this.ctx.createGain();
        alarmOsc.type = 'sawtooth';
        alarmOsc.frequency.setValueAtTime(i % 2 === 0 ? 520 : 415, start);

        alarmGain.gain.setValueAtTime(0.25, start);
        alarmGain.gain.exponentialRampToValueAtTime(0.01, start + 0.25);

        alarmOsc.connect(alarmGain);
        alarmGain.connect(this.fxGain);
        alarmOsc.start(start);
        alarmOsc.stop(start + 0.25);
      }
    } catch (e) {}
  }

  playInterlockWarning() {
    this.resumeIfSuspended();
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(180, now);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.fxGain);
      osc.start(now);
      osc.stop(now + 0.22);
    } catch (e) {}
  }

  playClick() {
    this.resumeIfSuspended();
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.03);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.connect(gain);
      gain.connect(this.fxGain);
      osc.start(now);
      osc.stop(now + 0.03);
    } catch (e) {}
  }

  setMasterVolume(val) {
    this.masterVol = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVol, this.ctx.currentTime);
    }
  }

  setHumVolume(val) {
    this.humVol = Math.max(0, Math.min(1, val));
    if (this.humGain && this.ctx) {
      this.humGain.gain.setValueAtTime(this.humVol, this.ctx.currentTime);
    }
  }

  setFxVolume(val) {
    this.fxVol = Math.max(0, Math.min(1, val));
    if (this.fxGain && this.ctx) {
      this.fxGain.gain.setValueAtTime(this.fxVol, this.ctx.currentTime);
    }
  }

  toggleMute() {
    this.resumeIfSuspended();
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVol, this.ctx.currentTime);
    }
    return !this.isMuted;
  }
}

// Singleton Instance
window.HMIAudioEngine = HMIAudioEngine;
window.hmiAudio = new HMIAudioEngine();
