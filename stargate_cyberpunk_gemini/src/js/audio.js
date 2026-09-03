/**
 * Khepri Cipher Terminal - Procedural Web Audio API Engine
 * Pure synthesized soundscapes: carrier drones, FM bell chimes,
 * rising Shepard sweeps, sub-bass detonations, and packet jitter.
 */

class CipherAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.droneGain = null;
    this.sfxGain = null;
    this.noiseGain = null;
    
    this.droneOsc1 = null;
    this.droneOsc2 = null;
    this.droneFilter = null;
    
    this.isMuted = false;
    this.isInitialized = false;
    
    // Default Volume Levels
    this.volumes = {
      master: 0.7,
      drone: 0.35,
      sfx: 0.8,
      noise: 0.2
    };
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      
      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volumes.master, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      
      // Channel Gains
      this.droneGain = this.ctx.createGain();
      this.droneGain.gain.setValueAtTime(this.volumes.drone, this.ctx.currentTime);
      this.droneGain.connect(this.masterGain);
      
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.volumes.sfx, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);
      
      this.noiseGain = this.ctx.createGain();
      this.noiseGain.gain.setValueAtTime(this.volumes.noise, this.ctx.currentTime);
      this.noiseGain.connect(this.masterGain);
      
      this.startAmbientDrone();
      this.isInitialized = true;
    } catch (e) {
      console.warn('[AudioEngine] Web Audio not available or blocked:', e);
    }
  }

  resume() {
    if (!this.ctx) {
      this.init();
    } else if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  startAmbientDrone() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // Dual Detuned Low-Frequency Oscillators
    this.droneOsc1 = this.ctx.createOscillator();
    this.droneOsc2 = this.ctx.createOscillator();
    
    this.droneOsc1.type = 'sawtooth';
    this.droneOsc1.frequency.setValueAtTime(43.65, now); // F1
    
    this.droneOsc2.type = 'sawtooth';
    this.droneOsc2.frequency.setValueAtTime(44.20, now); // Detuned beat
    
    // Lowpass filter with subtle modulation
    this.droneFilter = this.ctx.createBiquadFilter();
    this.droneFilter.type = 'lowpass';
    this.droneFilter.frequency.setValueAtTime(140, now);
    this.droneFilter.Q.setValueAtTime(3.5, now);
    
    // Slow LFO for breathing filter
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.12, now);
    lfoGain.gain.setValueAtTime(45, now);
    lfo.connect(lfoGain);
    lfoGain.connect(this.droneFilter.frequency);
    lfo.start(now);
    
    this.droneOsc1.connect(this.droneFilter);
    this.droneOsc2.connect(this.droneFilter);
    this.droneFilter.connect(this.droneGain);
    
    this.droneOsc1.start(now);
    this.droneOsc2.start(now);
  }

  // 1. Vector Selection Candidate Tick
  playCandidateTick() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(1200 + Math.random() * 800, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.03);
    
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.03);
  }

  // 2. Cryptographic Handshake Parity Lock (FM Synth + Sub kick)
  playHandshakeLock(nodeIndex) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    
    // Base pitch scales with locked node count (pentatonic cyber scale)
    const baseFreqs = [220, 247.5, 277.2, 329.6, 370.0, 440.0, 495.0, 554.4, 659.2, 740.0];
    const rootFreq = baseFreqs[nodeIndex % baseFreqs.length];
    
    // FM Carrier & Modulator
    const carrier = this.ctx.createOscillator();
    const modulator = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    const carrierGain = this.ctx.createGain();
    
    carrier.type = 'sine';
    carrier.frequency.setValueAtTime(rootFreq, now);
    
    modulator.type = 'sine';
    modulator.frequency.setValueAtTime(rootFreq * 2.5, now);
    modGain.gain.setValueAtTime(rootFreq * 1.8, now);
    modGain.gain.exponentialRampToValueAtTime(1, now + 0.35);
    
    modulator.connect(modGain);
    modGain.connect(carrier.frequency);
    
    carrierGain.gain.setValueAtTime(0.4, now);
    carrierGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    
    carrier.connect(carrierGain);
    carrierGain.connect(this.sfxGain);
    
    // Sub-kick impulse
    const kick = this.ctx.createOscillator();
    const kickGain = this.ctx.createGain();
    kick.type = 'sine';
    kick.frequency.setValueAtTime(90, now);
    kick.frequency.exponentialRampToValueAtTime(30, now + 0.18);
    
    kickGain.gain.setValueAtTime(0.5, now);
    kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    
    kick.connect(kickGain);
    kickGain.connect(this.sfxGain);
    
    modulator.start(now);
    carrier.start(now);
    kick.start(now);
    
    modulator.stop(now + 0.5);
    carrier.stop(now + 0.5);
    kick.stop(now + 0.2);
  }

  // 3. Stage 1: Buildup Shepard/Resonant Sweep (1.8s)
  playBuildupSweep() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const duration = 1.8;
    
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(110, now);
    osc1.frequency.exponentialRampToValueAtTime(880, now + duration);
    
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(55, now);
    osc2.frequency.exponentialRampToValueAtTime(440, now + duration);
    
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(200, now);
    filter.frequency.exponentialRampToValueAtTime(6000, now + duration);
    filter.Q.setValueAtTime(5, now);
    
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0.65, now + duration);
    
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration);
    osc2.stop(now + duration);
  }

  // 4. Stage 2: Breakthrough Aperture Detonation & Resonance
  playBreakthroughBoom() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    
    // Sub Boom (35Hz)
    const boom = this.ctx.createOscillator();
    const boomGain = this.ctx.createGain();
    boom.type = 'sine';
    boom.frequency.setValueAtTime(120, now);
    boom.frequency.exponentialRampToValueAtTime(32, now + 0.8);
    boomGain.gain.setValueAtTime(0.8, now);
    boomGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    boom.connect(boomGain);
    boomGain.connect(this.sfxGain);
    boom.start(now);
    boom.stop(now + 1.2);
    
    // White Noise Burst
    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(4000, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(300, now + 0.4);
    
    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.6, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(nGain);
    nGain.connect(this.sfxGain);
    noise.start(now);
    
    // Resonant Major 9th Chord Flash
    const chordPitches = [349.23, 440.0, 523.25, 659.25, 783.99]; // F maj9
    chordPitches.forEach((freq) => {
      const cOsc = this.ctx.createOscillator();
      const cGain = this.ctx.createGain();
      cOsc.type = 'sine';
      cOsc.frequency.setValueAtTime(freq, now);
      cGain.gain.setValueAtTime(0.2, now);
      cGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      cOsc.connect(cGain);
      cGain.connect(this.sfxGain);
      cOsc.start(now);
      cOsc.stop(now + 1.5);
    });
  }

  // 5. Stage 3: Sustained Active Data Streaming Loop Chirp
  playPacketChirp() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    const freqs = [880, 1100, 1320, 1760, 2200];
    const f = freqs[Math.floor(Math.random() * freqs.length)];
    osc.frequency.setValueAtTime(f, now);
    osc.frequency.exponentialRampToValueAtTime(f * 1.5, now + 0.05);
    
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    
    osc.connect(gain);
    gain.connect(this.noiseGain);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  // 6. Disengage / Purge Sound (Downward dive + hiss)
  playPurge() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.5);
    
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  // 7. Counter-Trace Isolator Warning Alarm
  playInterlockAlarm() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc1.type = 'square';
    osc2.type = 'square';
    osc1.frequency.setValueAtTime(440, now);
    osc2.frequency.setValueAtTime(370, now); // Harsh tritone/dissonance
    
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);
    
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.3);
    osc2.stop(now + 0.3);
  }

  setVolume(channel, value) {
    this.volumes[channel] = value;
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (channel === 'master' && this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : value, now);
    } else if (channel === 'drone' && this.droneGain) {
      this.droneGain.gain.setValueAtTime(value, now);
    } else if (channel === 'sfx' && this.sfxGain) {
      this.sfxGain.gain.setValueAtTime(value, now);
    } else if (channel === 'noise' && this.noiseGain) {
      this.noiseGain.gain.setValueAtTime(value, now);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volumes.master, now);
    }
    return this.isMuted;
  }
}

// Global Singleton Export
window.CipherAudio = new CipherAudioEngine();
