/**
 * AERIS Audio Engine - Procedural Web Audio API Synthesizer
 * Zero external audio files required. Generates all clicks, servo hums,
 * harmonic clamp chimes, vortex plasma drones, and iris hydraulics on the fly.
 */

class AerisAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.enabled = true;
    this.volume = 0.75;
    
    // Sub-gains for mixing
    this.fxGain = null;
    this.ambientGain = null;
    this.motorGain = null;
    
    // Active nodes
    this.vortexDroneNode = null;
    this.vortexGainNode = null;
    this.vortexHumTimer = null;
    this.motorOsc = null;
    this.motorFilter = null;
    
    // Clamp harmonic scale (Astraea Vector Scale: D minor pentatonic / celestial harmonic)
    this.clampFrequencies = [293.66, 349.23, 392.00, 440.00, 523.25, 587.33, 698.46];
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.fxGain = this.ctx.createGain();
      this.fxGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
      this.fxGain.connect(this.masterGain);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.6, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);

      this.motorGain = this.ctx.createGain();
      this.motorGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      this.motorGain.connect(this.masterGain);
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  ensureContext() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  setMasterVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.enabled ? this.volume : 0, this.ctx.currentTime, 0.05);
    }
  }

  setEnabled(bool) {
    this.enabled = bool;
    this.setMasterVolume(this.volume);
    if (!this.enabled && this.vortexGainNode && this.ctx) {
      this.vortexGainNode.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    }
  }

  // Generic clean UI click
  playClick(pitch = 1800, duration = 0.03) {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(pitch, t);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.4, t + duration);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(gain);
    gain.connect(this.fxGain);

    osc.start(t);
    osc.stop(t + duration + 0.01);
  }

  // Glyph selection tone
  playGlyphTone(index = 0) {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const baseFreq = 330;
    const freq = baseFreq * Math.pow(2, (index % 20) / 12);
    const t = this.ctx.currentTime;
    const dur = 0.12;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.05, t + dur);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(gain);
    gain.connect(this.fxGain);

    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  // Motor spin sound (servo drive for the ring)
  startMotorSound() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx || this.motorOsc) return;

    const t = this.ctx.currentTime;
    this.motorOsc = this.ctx.createOscillator();
    this.motorFilter = this.ctx.createBiquadFilter();
    const subGain = this.ctx.createGain();

    this.motorOsc.type = 'sawtooth';
    this.motorOsc.frequency.setValueAtTime(75, t);

    this.motorFilter.type = 'lowpass';
    this.motorFilter.frequency.setValueAtTime(320, t);
    this.motorFilter.Q.setValueAtTime(3.0, t);

    subGain.gain.setValueAtTime(0.01, t);
    subGain.gain.linearRampToValueAtTime(0.22, t + 0.2);

    this.motorOsc.connect(this.motorFilter);
    this.motorFilter.connect(subGain);
    subGain.connect(this.motorGain);

    this.motorSubGain = subGain;
    this.motorOsc.start(t);
  }

  updateMotorPitch(speedNorm = 0.5) {
    if (!this.motorOsc || !this.ctx) return;
    const t = this.ctx.currentTime;
    const freq = 60 + speedNorm * 180;
    this.motorOsc.frequency.setTargetAtTime(freq, t, 0.05);
    if (this.motorFilter) {
      this.motorFilter.frequency.setTargetAtTime(250 + speedNorm * 500, t, 0.05);
    }
  }

  stopMotorSound() {
    if (!this.motorOsc || !this.ctx) return;
    const t = this.ctx.currentTime;
    if (this.motorSubGain) {
      this.motorSubGain.gain.linearRampToValueAtTime(0.001, t + 0.15);
    }
    const osc = this.motorOsc;
    setTimeout(() => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {}
    }, 180);
    this.motorOsc = null;
    this.motorFilter = null;
    this.motorSubGain = null;
  }

  // Harmonic Stator Clamp Lock sound (resonant mechanical clamp + chord tone)
  playClampLock(clampIndex = 0) {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const chimeFreq = this.clampFrequencies[clampIndex % this.clampFrequencies.length] || 440;

    // 1. Mechanical Clank (noise impact)
    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1400, t);
    noiseFilter.Q.setValueAtTime(2.0, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.35, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.fxGain);
    noise.start(t);

    // 2. Heavy Sub Bass Thud
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(120, t);
    subOsc.frequency.exponentialRampToValueAtTime(38, t + 0.18);
    subGain.gain.setValueAtTime(0.45, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    subOsc.connect(subGain);
    subGain.connect(this.fxGain);
    subOsc.start(t);
    subOsc.stop(t + 0.25);

    // 3. Resonant Stator Harmonic Bell
    const bellOsc = this.ctx.createOscillator();
    const bellGain = this.ctx.createGain();
    bellOsc.type = 'sine';
    bellOsc.frequency.setValueAtTime(chimeFreq, t);

    const bellHarmonic = this.ctx.createOscillator();
    const bellHarmonicGain = this.ctx.createGain();
    bellHarmonic.type = 'triangle';
    bellHarmonic.frequency.setValueAtTime(chimeFreq * 2.005, t);

    bellGain.gain.setValueAtTime(0.28, t);
    bellGain.gain.exponentialRampToValueAtTime(0.001, t + 0.85);

    bellHarmonicGain.gain.setValueAtTime(0.12, t);
    bellHarmonicGain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    bellOsc.connect(bellGain);
    bellGain.connect(this.fxGain);
    bellHarmonic.connect(bellHarmonicGain);
    bellHarmonicGain.connect(this.fxGain);

    bellOsc.start(t);
    bellHarmonic.start(t);
    bellOsc.stop(t + 0.9);
    bellHarmonic.stop(t + 0.9);
  }

  // Vortex Ignition Blast (Kawoosh shockwave)
  playVortexIgnition() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // 1. Massive Sub-bass impact
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(95, t);
    subOsc.frequency.exponentialRampToValueAtTime(25, t + 0.9);
    subGain.gain.setValueAtTime(0.65, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
    subOsc.connect(subGain);
    subGain.connect(this.fxGain);
    subOsc.start(t);
    subOsc.stop(t + 1.3);

    // 2. Expanding plasma shockwave noise sweep
    const bufferSize = this.ctx.sampleRate * 1.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, t);
    filter.frequency.exponentialRampToValueAtTime(3200, t + 0.4);
    filter.frequency.exponentialRampToValueAtTime(450, t + 1.4);
    filter.Q.setValueAtTime(3.5, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.01, t);
    noiseGain.gain.linearRampToValueAtTime(0.5, t + 0.35);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.fxGain);
    noise.start(t);

    // Start sustained vortex hum after ignition
    this.vortexHumTimer = setTimeout(() => {
      this.vortexHumTimer = null;
      this.startVortexHum();
    }, 900);
  }

  // Sustained Active Vortex Drone
  startVortexHum() {
    if (!this.enabled || this.vortexDroneNode || !this.ctx) return;
    const t = this.ctx.currentTime;

    // Dual detuned oscillators for rich spatial phase hum
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const osc3 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(55, t); // A1

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(110.3, t); // Detuned A2

    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(164.8, t); // E3 fifth

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(280, t);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.28, t + 0.8);

    osc1.connect(filter);
    osc2.connect(filter);
    osc3.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambientGain);

    osc1.start(t);
    osc2.start(t);
    osc3.start(t);

    this.vortexDroneNode = { osc1, osc2, osc3, filter };
    this.vortexGainNode = gain;
  }

  stopVortexHum() {
    // Cancel a hum that ignition scheduled but that has not started yet
    if (this.vortexHumTimer) {
      clearTimeout(this.vortexHumTimer);
      this.vortexHumTimer = null;
    }
    if (!this.vortexDroneNode || !this.ctx) return;
    const t = this.ctx.currentTime;
    if (this.vortexGainNode) {
      this.vortexGainNode.gain.linearRampToValueAtTime(0.001, t + 0.4);
    }
    const drone = this.vortexDroneNode;
    setTimeout(() => {
      try {
        drone.osc1.stop();
        drone.osc2.stop();
        drone.osc3.stop();
        drone.osc1.disconnect();
        drone.osc2.disconnect();
        drone.osc3.disconnect();
      } catch (e) {}
    }, 450);
    this.vortexDroneNode = null;
    this.vortexGainNode = null;
  }

  // Disengage / Aperture Collapse Sound
  playDisengage() {
    if (!this.enabled) return;
    this.ensureContext();
    this.stopVortexHum();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(28, t + 0.6);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(80, t + 0.6);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.fxGain);

    osc.start(t);
    osc.stop(t + 0.7);
  }

  // Containment Iris Hydraulic actuation sound
  playIrisActuate(isSealing = true) {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const dur = 0.55;

    // Pneumatic hiss
    const bufferSize = this.ctx.sampleRate * dur;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(isSealing ? 1200 : 800, t);
    filter.frequency.exponentialRampToValueAtTime(isSealing ? 400 : 1600, t + dur);
    filter.Q.setValueAtTime(2.5, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.fxGain);
    noise.start(t);

    // Mechanical lock thump at end of travel
    setTimeout(() => {
      if (!this.ctx) return;
      const tEnd = this.ctx.currentTime;
      const thud = this.ctx.createOscillator();
      const thudGain = this.ctx.createGain();
      thud.type = 'triangle';
      thud.frequency.setValueAtTime(90, tEnd);
      thud.frequency.exponentialRampToValueAtTime(30, tEnd + 0.1);
      thudGain.gain.setValueAtTime(0.3, tEnd);
      thudGain.gain.exponentialRampToValueAtTime(0.001, tEnd + 0.12);
      thud.connect(thudGain);
      thudGain.connect(this.fxGain);
      thud.start(tEnd);
      thud.stop(tEnd + 0.15);
    }, (dur - 0.1) * 1000);
  }

  // System warning / alert chime
  playAlert(type = 'warn') {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';

    if (type === 'warn') {
      osc1.frequency.setValueAtTime(880, t);
      osc2.frequency.setValueAtTime(1174.66, t);
    } else {
      osc1.frequency.setValueAtTime(587.33, t);
      osc2.frequency.setValueAtTime(659.25, t);
    }

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.fxGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.3);
    osc2.stop(t + 0.3);
  }

  // Negative error buzzer
  playError() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(130, t);
    osc.frequency.setValueAtTime(120, t + 0.12);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.setValueAtTime(0.01, t + 0.1);
    gain.gain.setValueAtTime(0.2, t + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc.connect(gain);
    gain.connect(this.fxGain);

    osc.start(t);
    osc.stop(t + 0.3);
  }
}

// Export singleton
window.aerisAudio = new AerisAudioEngine();
