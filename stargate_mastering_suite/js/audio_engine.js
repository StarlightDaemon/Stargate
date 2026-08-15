/**
 * Axiom Audio Engine - Web Audio API Synthesis & Telemetry
 * Provides procedural audio synthesis, realistic relay clicks, polyphonic summing,
 * real-time harmonic analysis, and dynamic limiter saturation.
 */

class AxiomAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.analyser = null;
    this.limiterNode = null;
    this.humGain = null;
    this.humOsc = null;
    this.isMuted = false;
    this.isInitialized = false;

    // Harmonic frequencies (C1 to C10 tuned harmonic steps)
    this.channelFrequencies = [
      32.70,   // Ch 0: Sub-Bass
      65.41,   // Ch 1: Bass Resonance
      130.81,  // Ch 2: Low Mid
      261.63,  // Ch 3: Mid Core
      523.25,  // Ch 4: Upper Mid
      1046.50, // Ch 5: Presence
      2093.00, // Ch 6: Brilliance
      4186.01, // Ch 7: Air Band
      8372.02, // Ch 8: Hyper-Harmonic
      12543.85 // Ch 9: Quantum Ultra-Band
    ];

    // Active channel voices
    this.activeVoices = new Map();
    // Portal master summing oscillators
    this.portalVoices = [];
    this.portalFilter = null;
    this.portalLFO = null;
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      
      // Master limiter compressor (safety ceiling)
      this.limiterNode = this.ctx.createDynamicsCompressor();
      this.limiterNode.threshold.setValueAtTime(-1.0, this.ctx.currentTime);
      this.limiterNode.knee.setValueAtTime(0.0, this.ctx.currentTime);
      this.limiterNode.ratio.setValueAtTime(20.0, this.ctx.currentTime);
      this.limiterNode.attack.setValueAtTime(0.001, this.ctx.currentTime);
      this.limiterNode.release.setValueAtTime(0.05, this.ctx.currentTime);

      // Master Analyser Node
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 1024;
      this.analyser.smoothingTimeConstant = 0.8;

      // Master Volume Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.5, this.ctx.currentTime);

      // Routing graph: Voice/Portal -> Limiter -> Analyser -> MasterGain -> Destination
      this.limiterNode.connect(this.analyser);
      this.analyser.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      // Ambient 60Hz transformer hum (idle studio warmth)
      this.initAnalogHum();

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

  initAnalogHum() {
    if (!this.ctx) return;
    const osc60 = this.ctx.createOscillator();
    const osc120 = this.ctx.createOscillator();
    const humFilter = this.ctx.createBiquadFilter();
    
    this.humGain = this.ctx.createGain();
    this.humGain.gain.setValueAtTime(0.015, this.ctx.currentTime);

    humFilter.type = 'lowpass';
    humFilter.frequency.setValueAtTime(150, this.ctx.currentTime);

    osc60.type = 'sine';
    osc60.frequency.setValueAtTime(60, this.ctx.currentTime);
    osc120.type = 'sine';
    osc120.frequency.setValueAtTime(120, this.ctx.currentTime);

    osc60.connect(humFilter);
    osc120.connect(humFilter);
    humFilter.connect(this.humGain);
    this.humGain.connect(this.limiterNode);

    osc60.start();
    osc120.start();
  }

  setMute(mute) {
    this.isMuted = mute;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(mute ? 0 : 0.5, this.ctx.currentTime, 0.03);
    }
  }

  setVolume(vol) {
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.03);
    }
  }

  /**
   * Sound: Physical patch jack snap / mechanical relay engagement
   */
  playPatchSnap(pitch = 1.0) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    
    // Noise burst for jack contact friction
    const bufferSize = this.ctx.sampleRate * 0.03;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800 * pitch, t);
    filter.Q.setValueAtTime(3.0, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.limiterNode);
    noise.start(t);

    // Relay contact solenoid clunk (low-frequency impulse)
    const relayOsc = this.ctx.createOscillator();
    const relayGain = this.ctx.createGain();
    relayOsc.type = 'triangle';
    relayOsc.frequency.setValueAtTime(120 * pitch, t);
    relayOsc.frequency.exponentialRampToValueAtTime(35, t + 0.05);

    relayGain.gain.setValueAtTime(0.4, t);
    relayGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    relayOsc.connect(relayGain);
    relayGain.connect(this.limiterNode);
    relayOsc.start(t);
    relayOsc.stop(t + 0.06);
  }

  /**
   * Sound: Channel Lock Harmonic Confirmation Tone
   */
  playChannelLock(channelIndex, busIndex) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const freq = this.channelFrequencies[channelIndex] || 440;
    const t = this.ctx.currentTime;

    // Harmonic Sine + Saw Ping
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, t);
    
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 1.5, t); // Perfect fifth overtone

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.min(freq * 4, 12000), t);
    filter.frequency.exponentialRampToValueAtTime(Math.max(freq * 1.2, 200), t + 0.35);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.limiterNode);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.45);
    osc2.stop(t + 0.45);

    this.playPatchSnap(1.0 + (busIndex * 0.08));
  }

  /**
   * Sound: Limiter Clamped Alert / Safety Interlock Warning
   */
  playLimiterWarning() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.setValueAtTime(165, t + 0.08);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

    osc.connect(gain);
    gain.connect(this.limiterNode);
    osc.start(t);
    osc.stop(t + 0.26);
  }

  /**
   * Start Master Portal Summing Harmonic Engine
   * Sums all 7 patched channels into a massive resonant chord with chorus modulation
   */
  startMasterSumming(channelIndices) {
    this.ensureContext();
    if (!this.ctx) return;

    this.stopMasterSumming();

    const t = this.ctx.currentTime;

    // Resonant sweep filter
    this.portalFilter = this.ctx.createBiquadFilter();
    this.portalFilter.type = 'lowpass';
    this.portalFilter.frequency.setValueAtTime(200, t);
    this.portalFilter.frequency.exponentialRampToValueAtTime(14000, t + 2.5);
    this.portalFilter.Q.setValueAtTime(4.0, t);

    // Filter LFO
    this.portalLFO = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    this.portalLFO.frequency.setValueAtTime(1.5, t);
    lfoGain.gain.setValueAtTime(400, t);
    this.portalLFO.connect(lfoGain);
    lfoGain.connect(this.portalFilter.frequency);
    this.portalLFO.start(t);

    const masterSumGain = this.ctx.createGain();
    masterSumGain.gain.setValueAtTime(0.01, t);
    masterSumGain.gain.linearRampToValueAtTime(0.4, t + 1.2);

    this.portalFilter.connect(masterSumGain);
    masterSumGain.connect(this.limiterNode);

    // Summing voices for each patched channel
    channelIndices.forEach((chIdx, i) => {
      const baseFreq = this.channelFrequencies[chIdx] || 220;
      
      // Main oscillator
      const oscA = this.ctx.createOscillator();
      const oscB = this.ctx.createOscillator();
      const voiceGain = this.ctx.createGain();
      const panNode = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;

      oscA.type = i % 2 === 0 ? 'sawtooth' : 'sine';
      oscB.type = 'triangle';

      oscA.frequency.setValueAtTime(baseFreq, t);
      // Detuned chorus
      oscB.frequency.setValueAtTime(baseFreq * 1.004, t);

      voiceGain.gain.setValueAtTime(0.12, t);

      oscA.connect(voiceGain);
      oscB.connect(voiceGain);

      if (panNode) {
        // Spread channels across stereo field (-0.8 to +0.8)
        const panPos = -0.7 + (1.4 * (i / Math.max(1, channelIndices.length - 1)));
        panNode.pan.setValueAtTime(panPos, t);
        voiceGain.connect(panNode);
        panNode.connect(this.portalFilter);
      } else {
        voiceGain.connect(this.portalFilter);
      }

      oscA.start(t);
      oscB.start(t);

      this.portalVoices.push({ oscA, oscB, voiceGain });
    });

    // Sub-bass resonance rumble
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(45, t);
    subGain.gain.setValueAtTime(0.25, t);
    subOsc.connect(subGain);
    subGain.connect(this.portalFilter);
    subOsc.start(t);
    this.portalVoices.push({ oscA: subOsc, voiceGain: subGain });
  }

  /**
   * Stop Master Portal Summing Harmonic Engine
   */
  stopMasterSumming() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    if (this.portalVoices.length > 0) {
      this.portalVoices.forEach(v => {
        if (v.voiceGain) {
          v.voiceGain.gain.setTargetAtTime(0.0001, t, 0.08);
        }
        if (v.oscA) {
          try { v.oscA.stop(t + 0.15); } catch(e) {}
        }
        if (v.oscB) {
          try { v.oscB.stop(t + 0.15); } catch(e) {}
        }
      });
      this.portalVoices = [];
    }

    if (this.portalLFO) {
      try { this.portalLFO.stop(t + 0.15); } catch(e) {}
      this.portalLFO = null;
    }
  }

  /**
   * Sound: Emergency Master Feed Cut / Tape Stop Disengage
   */
  playDisengageSound() {
    this.ensureContext();
    this.stopMasterSumming();

    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;

    // Pitch drop deceleration (tape stop)
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + 0.28);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(this.limiterNode);
    osc.start(t);
    osc.stop(t + 0.32);

    // Mechanical master breaker clack
    this.playPatchSnap(0.6);
  }

  /**
   * Get Real-Time Audio Telemetry for Visualizers
   */
  getTelemetry() {
    if (!this.analyser) {
      return {
        freqData: new Uint8Array(128).fill(0),
        timeData: new Uint8Array(128).fill(128),
        rms: 0,
        peak: 0
      };
    }

    const freqData = new Uint8Array(this.analyser.frequencyBinCount);
    const timeData = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(freqData);
    this.analyser.getByteTimeDomainData(timeData);

    // Calculate RMS & Peak
    let sumSquares = 0;
    let maxAmp = 0;
    for (let i = 0; i < timeData.length; i++) {
      const norm = (timeData[i] - 128) / 128;
      sumSquares += norm * norm;
      const absAmp = Math.abs(norm);
      if (absAmp > maxAmp) maxAmp = absAmp;
    }
    const rms = Math.sqrt(sumSquares / timeData.length);
    const peak = maxAmp;

    return { freqData, timeData, rms, peak };
  }
}

window.AxiomAudio = new AxiomAudioEngine();
