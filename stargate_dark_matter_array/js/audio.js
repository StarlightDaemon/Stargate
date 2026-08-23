/**
 * BOREAS-IX Procedural Web Audio Engine
 * Pure synthesized Web Audio API - zero external audio asset dependencies.
 */

class DarkMatterAudio {
  constructor() {
    this.ctx = null;
    this.isInitialized = false;
    this.isMuted = false;
    
    // Gain nodes for mixing buses
    this.masterGain = null;
    this.cryoGain = null;
    this.pmtGain = null;
    this.chimeGain = null;
    this.vetoGain = null;
    this.apertureGain = null;

    // Ongoing sound sources
    this.cryoOsc1 = null;
    this.cryoOsc2 = null;
    this.cryoFilter = null;
    this.apertureOscNodes = [];
    this.pmtInterval = null;

    // Volumes
    this.volumes = {
      master: 0.7,
      cryo: 0.35,
      pmt: 0.25,
      chime: 0.6,
      veto: 0.5,
      aperture: 0.65
    };
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContextClass();

      // Master bus
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volumes.master, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Cryostat ambient bus
      this.cryoGain = this.ctx.createGain();
      this.cryoGain.gain.setValueAtTime(this.volumes.cryo, this.ctx.currentTime);
      this.cryoGain.connect(this.masterGain);

      // PMT clicks bus
      this.pmtGain = this.ctx.createGain();
      this.pmtGain.gain.setValueAtTime(this.volumes.pmt, this.ctx.currentTime);
      this.pmtGain.connect(this.masterGain);

      // Discrimination chime bus
      this.chimeGain = this.ctx.createGain();
      this.chimeGain.gain.setValueAtTime(this.volumes.chime, this.ctx.currentTime);
      this.chimeGain.connect(this.masterGain);

      // Veto alert bus
      this.vetoGain = this.ctx.createGain();
      this.vetoGain.gain.setValueAtTime(this.volumes.veto, this.ctx.currentTime);
      this.vetoGain.connect(this.masterGain);

      // Aperture vortex bus
      this.apertureGain = this.ctx.createGain();
      this.apertureGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.apertureGain.connect(this.masterGain);

      this.startCryostatAmbience();
      this.startPmtBackgroundClicks();

      this.isInitialized = true;
    } catch (e) {
      console.warn('AudioContext initialization failed or blocked:', e);
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

  startCryostatAmbience() {
    if (!this.ctx) return;
    try {
      // 55Hz primary cryo-pump hum + 110Hz harmonic with lowpass filter
      this.cryoOsc1 = this.ctx.createOscillator();
      this.cryoOsc2 = this.ctx.createOscillator();
      this.cryoFilter = this.ctx.createBiquadFilter();

      this.cryoOsc1.type = 'sine';
      this.cryoOsc1.frequency.setValueAtTime(55, this.ctx.currentTime); // 55Hz (A1)

      this.cryoOsc2.type = 'triangle';
      this.cryoOsc2.frequency.setValueAtTime(110.2, this.ctx.currentTime); // subtle beating

      this.cryoFilter.type = 'lowpass';
      this.cryoFilter.frequency.setValueAtTime(160, this.ctx.currentTime);
      this.cryoFilter.Q.setValueAtTime(3, this.ctx.currentTime);

      this.cryoOsc1.connect(this.cryoFilter);
      this.cryoOsc2.connect(this.cryoFilter);
      this.cryoFilter.connect(this.cryoGain);

      this.cryoOsc1.start();
      this.cryoOsc2.start();
    } catch (e) {
      console.warn('Cryostat audio start error:', e);
    }
  }

  startPmtBackgroundClicks() {
    if (this.pmtInterval) clearInterval(this.pmtInterval);
    // Random geiger-like PMT clicks every 200-800ms
    const scheduleNext = () => {
      if (!this.ctx || this.isMuted) {
        this.pmtInterval = setTimeout(scheduleNext, 500);
        return;
      }
      this.playPmtTick();
      const nextDelay = 150 + Math.random() * 650;
      this.pmtInterval = setTimeout(scheduleNext, nextDelay);
    };
    this.pmtInterval = setTimeout(scheduleNext, 300);
  }

  playPmtTick() {
    if (!this.ctx || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Soft high-frequency resonant click
      osc.type = 'triangle';
      const freq = 1800 + Math.random() * 1200;
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(300, t + 0.015);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(freq, t);
      filter.Q.setValueAtTime(8, t);

      gain.gain.setValueAtTime(0.04 * (0.5 + Math.random() * 0.5), t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.015);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.pmtGain);

      osc.start(t);
      osc.stop(t + 0.02);
    } catch (e) {}
  }

  playChannelSelect() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, t);
      osc.frequency.exponentialRampToValueAtTime(780, t + 0.06);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.09);
    } catch (e) {}
  }

  playDiscriminationCheck() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      // Fast high-tech analysis blip sequence
      const freqs = [350, 480, 620];
      freqs.forEach((f, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startT = t + idx * 0.04;
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, startT);
        
        gain.gain.setValueAtTime(0.12, startT);
        gain.gain.exponentialRampToValueAtTime(0.001, startT + 0.035);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(startT);
        osc.stop(startT + 0.04);
      });
    } catch (e) {}
  }

  playDiscriminationSuccess(slotIndex = 0) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      
      // S1 Prompt Scintillation Pulse (rapid high ping)
      const s1Osc = this.ctx.createOscillator();
      const s1Gain = this.ctx.createGain();
      s1Osc.type = 'sine';
      s1Osc.frequency.setValueAtTime(1046.5, t); // C6
      s1Gain.gain.setValueAtTime(0.25, t);
      s1Gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      s1Osc.connect(s1Gain);
      s1Gain.connect(this.chimeGain);
      s1Osc.start(t);
      s1Osc.stop(t + 0.07);

      // S2 Ionization Drift Pulse (resonant crystal chime + harmonic 80ms later)
      const s2Base = 440 * Math.pow(1.12246, slotIndex % 7); // Scale note based on slot
      const s2Osc1 = this.ctx.createOscillator();
      const s2Osc2 = this.ctx.createOscillator();
      const s2Gain = this.ctx.createGain();

      s2Osc1.type = 'sine';
      s2Osc1.frequency.setValueAtTime(s2Base, t + 0.08);
      s2Osc1.frequency.exponentialRampToValueAtTime(s2Base * 1.5, t + 0.4);

      s2Osc2.type = 'triangle';
      s2Osc2.frequency.setValueAtTime(s2Base * 2, t + 0.08);

      s2Gain.gain.setValueAtTime(0.001, t);
      s2Gain.gain.setValueAtTime(0.35, t + 0.08);
      s2Gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.65);

      s2Osc1.connect(s2Gain);
      s2Osc2.connect(s2Gain);
      s2Gain.connect(this.chimeGain);

      s2Osc1.start(t + 0.08);
      s2Osc2.start(t + 0.08);
      s2Osc1.stop(t + 0.7);
      s2Osc2.stop(t + 0.7);
    } catch (e) {}
  }

  playDiscriminationFailed() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      // Dissonant low alert / background rejection buzz
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(164.8, t); // E3

      osc2.type = 'square';
      osc2.frequency.setValueAtTime(174.6, t); // F3 (tritone/minor second dissonance)

      gain.gain.setValueAtTime(0.28, t);
      gain.gain.setValueAtTime(0.25, t + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.vetoGain);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.36);
      osc2.stop(t + 0.36);
    } catch (e) {}
  }

  playVetoAlert() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.setValueAtTime(440, t + 0.08);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

      osc.connect(gain);
      gain.connect(this.vetoGain);

      osc.start(t);
      osc.stop(t + 0.22);
    } catch (e) {}
  }

  startActivationBuildup() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      
      // Rising drone over 2.5 seconds
      const buildOsc = this.ctx.createOscillator();
      const buildFilter = this.ctx.createBiquadFilter();
      const buildGain = this.ctx.createGain();

      buildOsc.type = 'sawtooth';
      buildOsc.frequency.setValueAtTime(65.4, t); // C2
      buildOsc.frequency.exponentialRampToValueAtTime(261.6, t + 2.5); // Ramps up to C4

      buildFilter.type = 'lowpass';
      buildFilter.frequency.setValueAtTime(150, t);
      buildFilter.frequency.exponentialRampToValueAtTime(2400, t + 2.5);
      buildFilter.Q.setValueAtTime(6, t);

      buildGain.gain.setValueAtTime(0.01, t);
      buildGain.gain.linearRampToValueAtTime(0.45, t + 2.4);
      buildGain.gain.exponentialRampToValueAtTime(0.001, t + 2.6);

      buildOsc.connect(buildFilter);
      buildFilter.connect(buildGain);
      buildGain.connect(this.masterGain);

      buildOsc.start(t);
      buildOsc.stop(t + 2.65);
    } catch (e) {}
  }

  playBreakthroughBlast() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;

      // Heavy sub-bass drop (40Hz)
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(120, t);
      subOsc.frequency.exponentialRampToValueAtTime(36, t + 0.8);
      subGain.gain.setValueAtTime(0.8, t);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
      subOsc.connect(subGain);
      subGain.connect(this.masterGain);
      subOsc.start(t);
      subOsc.stop(t + 1.3);

      // Noise burst for ionization flash
      const bufferSize = this.ctx.sampleRate * 0.5;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(1400, t);
      noiseFilter.frequency.exponentialRampToValueAtTime(200, t + 0.5);
      noiseFilter.Q.setValueAtTime(2, t);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.4, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.masterGain);

      noise.start(t);
      noise.stop(t + 0.55);

      // Start sustained aperture hum
      this.startSustainedApertureAudio();
    } catch (e) {}
  }

  startSustainedApertureAudio() {
    if (!this.ctx) return;
    this.stopSustainedApertureAudio();
    try {
      const t = this.ctx.currentTime;
      this.apertureGain.gain.cancelScheduledValues(t);
      this.apertureGain.gain.setValueAtTime(0, t);
      this.apertureGain.gain.linearRampToValueAtTime(this.volumes.aperture, t + 0.5);

      // Multi-harmonic dark matter flux chord: Root (65.4Hz), Fifth (98.0Hz), Octave (130.8Hz)
      const freqs = [65.4, 98.0, 130.8, 196.0];
      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        // Subtle LFO vibrato
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.frequency.setValueAtTime(0.5 + idx * 0.2, t);
        lfoGain.gain.setValueAtTime(1.5, t);
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start(t);

        gain.gain.setValueAtTime(0.18 / (idx + 1), t);
        osc.connect(gain);
        gain.connect(this.apertureGain);
        osc.start(t);

        this.apertureOscNodes.push({ osc, lfo });
      });
    } catch (e) {}
  }

  stopSustainedApertureAudio() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    if (this.apertureGain) {
      this.apertureGain.gain.cancelScheduledValues(t);
      this.apertureGain.gain.linearRampToValueAtTime(0, t + 0.4);
    }
    setTimeout(() => {
      this.apertureOscNodes.forEach(item => {
        try {
          item.osc.stop();
          item.lfo.stop();
        } catch (e) {}
      });
      this.apertureOscNodes = [];
    }, 450);
  }

  playDisengageSound() {
    this.ensureContext();
    this.stopSustainedApertureAudio();
    if (!this.ctx || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.6);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, t);
      filter.frequency.exponentialRampToValueAtTime(90, t + 0.6);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.7);
    } catch (e) {}
  }

  setVolume(channel, val) {
    this.volumes[channel] = Math.max(0, Math.min(1, val));
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    switch (channel) {
      case 'master':
        if (this.masterGain) this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volumes.master, t);
        break;
      case 'cryo':
        if (this.cryoGain) this.cryoGain.gain.setValueAtTime(this.volumes.cryo, t);
        break;
      case 'pmt':
        if (this.pmtGain) this.pmtGain.gain.setValueAtTime(this.volumes.pmt, t);
        break;
      case 'chime':
        if (this.chimeGain) this.chimeGain.gain.setValueAtTime(this.volumes.chime, t);
        break;
      case 'veto':
        if (this.vetoGain) this.vetoGain.gain.setValueAtTime(this.volumes.veto, t);
        break;
      case 'aperture':
        if (this.apertureGain && this.apertureOscNodes.length > 0) {
          this.apertureGain.gain.setValueAtTime(this.volumes.aperture, t);
        }
        break;
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volumes.master, this.ctx.currentTime);
    }
    return this.isMuted;
  }
}

window.dmAudio = new DarkMatterAudio();
