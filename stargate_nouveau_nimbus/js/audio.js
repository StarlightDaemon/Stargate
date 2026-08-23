/**
 * STARGATE: LE NIMBUS FLORIÉ
 * Belle Époque Web Audio Synthesizer Engine
 * Lithographic Crayon Friction, Crystal Glass Chimes, Stone-Press Thuds, and Harmonium Drone
 */

class NimbusAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterGain = null;
    this.ambientGain = null;
    this.sfxGain = null;
    this.ambientOsc1 = null;
    this.ambientOsc2 = null;
    this.ambientLfo = null;
    this.isAmbientPlaying = false;

    // Volume channels
    this.volumes = {
      master: 0.8,
      ambient: 0.45,
      crayon: 0.7,
      glass: 0.8,
      stone: 0.85
    };
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volumes.master, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(this.volumes.ambient, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);

      this.startAmbientDrone();
    } catch (e) {
      console.warn("Web Audio init delayed until user interaction:", e);
    }
  }

  ensureContext() {
    if (!this.ctx) {
      this.init();
    } else if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  setVolume(channel, value) {
    this.volumes[channel] = Math.max(0, Math.min(1, value));
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    if (channel === "master" && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.volumes.master, t, 0.05);
    } else if (channel === "ambient" && this.ambientGain) {
      this.ambientGain.gain.setTargetAtTime(this.volumes.ambient, t, 0.05);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.volumes.master, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  // --- PASS 1: GREASY LITHOGRAPHIC CRAYON DRAWING SOUND ---
  playLithoCrayonStroke(duration = 0.28) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    try {
      const t = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      // Generate pink/brownish textured friction noise
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        const pink = b0 + b1 + b2 + white * 0.5362;
        // Introduce small micro-scratches
        const scratch = Math.random() > 0.97 ? (Math.random() * 1.5 - 0.75) : 0;
        output[i] = (pink * 0.15 + scratch * 0.2);
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      // Bandpass filter centered at resonant limestone frequency (1800Hz - 2400Hz)
      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(2200, t);
      filter.frequency.exponentialRampToValueAtTime(1400, t + duration);
      filter.Q.setValueAtTime(3.5, t);

      const gain = this.ctx.createGain();
      const vol = this.volumes.crayon * 0.6;
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      whiteNoise.start(t);
      whiteNoise.stop(t + duration);
    } catch (e) {
      console.warn("Crayon audio error:", e);
    }
  }

  // --- PASS 2: CRYSTAL GLASS BEAD CHIME (Mineral Color Wash Settling) ---
  playGlassBeadChime(baseFreq = 528) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    try {
      const t = this.ctx.currentTime;
      const vol = this.volumes.glass * 0.5;

      // Fundamental crystal tone
      const osc1 = this.ctx.createOscillator();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(baseFreq, t);

      // Glass harmonic overtone (pure crystal octave + 5th)
      const osc2 = this.ctx.createOscillator();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(baseFreq * 2.76, t);

      // High metallic chime overtone
      const osc3 = this.ctx.createOscillator();
      osc3.type = "triangle";
      osc3.frequency.setValueAtTime(baseFreq * 5.4, t);

      const gain1 = this.ctx.createGain();
      gain1.gain.setValueAtTime(0, t);
      gain1.gain.linearRampToValueAtTime(vol, t + 0.008);
      gain1.gain.exponentialRampToValueAtTime(0.0001, t + 1.4);

      const gain2 = this.ctx.createGain();
      gain2.gain.setValueAtTime(0, t);
      gain2.gain.linearRampToValueAtTime(vol * 0.35, t + 0.005);
      gain2.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);

      const gain3 = this.ctx.createGain();
      gain3.gain.setValueAtTime(0, t);
      gain3.gain.linearRampToValueAtTime(vol * 0.15, t + 0.003);
      gain3.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);

      osc1.connect(gain1);
      osc2.connect(gain2);
      osc3.connect(gain3);

      gain1.connect(this.sfxGain);
      gain2.connect(this.sfxGain);
      gain3.connect(this.sfxGain);

      osc1.start(t);
      osc2.start(t);
      osc3.start(t);

      osc1.stop(t + 1.45);
      osc2.stop(t + 0.95);
      osc3.stop(t + 0.55);
    } catch (e) {
      console.warn("Glass chime audio error:", e);
    }
  }

  // --- PASS 3: LITHOGRAPHIC PRINT-STONE SETTLING THUD ---
  playStoneSettle() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    try {
      const t = this.ctx.currentTime;
      const vol = this.volumes.stone * 0.7;

      // Sub-bass heavy impact (hydraulic bed settling)
      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(110, t);
      osc.frequency.exponentialRampToValueAtTime(42, t + 0.22);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);

      // Muffled mechanical clunk
      const oscClunk = this.ctx.createOscillator();
      oscClunk.type = "triangle";
      oscClunk.frequency.setValueAtTime(280, t);
      oscClunk.frequency.exponentialRampToValueAtTime(80, t + 0.08);

      const gainClunk = this.ctx.createGain();
      gainClunk.gain.setValueAtTime(vol * 0.4, t);
      gainClunk.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);

      osc.connect(gain);
      oscClunk.connect(gainClunk);
      gain.connect(this.sfxGain);
      gainClunk.connect(this.sfxGain);

      osc.start(t);
      oscClunk.start(t);
      osc.stop(t + 0.38);
      oscClunk.stop(t + 0.1);
    } catch (e) {
      console.warn("Stone settle audio error:", e);
    }
  }

  // --- SAFETY LATCH SOUND (Antique Gilded Brass Mechanism) ---
  playSafetyClick(isEngaged) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    try {
      const t = this.ctx.currentTime;
      const baseFreq = isEngaged ? 780 : 920;

      const osc = this.ctx.createOscillator();
      osc.type = "square";
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.exponentialRampToValueAtTime(isEngaged ? 450 : 1200, t + 0.04);

      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1600, t);
      filter.Q.setValueAtTime(4.0, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.35 * this.volumes.master, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.07);
    } catch (e) {
      console.warn("Safety click audio error:", e);
    }
  }

  // --- STAGE 1: ACTIVATION BUILDUP (Blooming Tendrils & Harmonic Swell) ---
  playBuildupSound(duration = 2.0) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    try {
      const t = this.ctx.currentTime;

      // Swelling warm chord (Aetheric gaslights warming up)
      const chordNotes = [216, 288, 324, 432, 576];
      chordNotes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        osc.type = idx % 2 === 0 ? "triangle" : "sine";
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.08, t + duration);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.08 * (1 - idx * 0.12), t + duration * 0.7);
        gain.gain.linearRampToValueAtTime(0.18, t + duration);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + duration + 0.3);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t);
        osc.stop(t + duration + 0.35);
      });
    } catch (e) {
      console.warn("Buildup audio error:", e);
    }
  }

  // --- STAGE 2: BREAKTHROUGH INSTANT (Radiant Golden Bloom Chord) ---
  playBreakthroughChord() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    try {
      const t = this.ctx.currentTime;
      const vol = this.volumes.master * 0.65;

      // Radiant Belle Époque Major 9th chord with glass overtones (D - F# - A - C# - E)
      const breakthroughNotes = [146.83, 220.0, 293.66, 369.99, 440.0, 554.37, 659.25, 880.0, 1108.73];

      breakthroughNotes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        osc.type = i < 2 ? "sawtooth" : (i < 5 ? "triangle" : "sine");
        osc.frequency.setValueAtTime(freq, t);

        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(300, t);
        filter.frequency.exponentialRampToValueAtTime(4500, t + 0.15);
        filter.frequency.exponentialRampToValueAtTime(1800, t + 3.5);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(vol / (i * 0.4 + 1.2), t + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 3.8);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t);
        osc.stop(t + 4.0);
      });

      // Shimmering crystalline chime sweep
      for (let s = 0; s < 6; s++) {
        setTimeout(() => {
          if (!this.isMuted) this.playGlassBeadChime(600 + s * 140);
        }, s * 60);
      }
    } catch (e) {
      console.warn("Breakthrough audio error:", e);
    }
  }

  // --- DISENGAGE SOUND (Soft Mineral Decrescendo) ---
  playDisengageSound() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(640, t);
      osc.frequency.exponentialRampToValueAtTime(110, t + 0.8);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.35 * this.volumes.glass, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.9);
    } catch (e) {
      console.warn("Disengage audio error:", e);
    }
  }

  // --- AMBIENT DRONE: BELLE ÉPOQUE HARMONIUM & GLASS HARMONICA ---
  startAmbientDrone() {
    if (this.isAmbientPlaying || !this.ctx) return;
    try {
      const t = this.ctx.currentTime;

      // Base warm drone (Root 108 Hz & 162 Hz fifth)
      this.ambientOsc1 = this.ctx.createOscillator();
      this.ambientOsc1.type = "sine";
      this.ambientOsc1.frequency.setValueAtTime(108, t);

      this.ambientOsc2 = this.ctx.createOscillator();
      this.ambientOsc2.type = "triangle";
      this.ambientOsc2.frequency.setValueAtTime(162, t);

      // Slow breathing LFO for subtle harmonic flutter
      this.ambientLfo = this.ctx.createOscillator();
      this.ambientLfo.frequency.setValueAtTime(0.12, t); // 8-second gentle cycle
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(1.5, t);

      this.ambientLfo.connect(this.ambientOsc1.frequency);
      this.ambientLfo.connect(this.ambientOsc2.frequency);

      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(420, t);

      this.ambientOsc1.connect(filter);
      this.ambientOsc2.connect(filter);
      filter.connect(this.ambientGain);

      this.ambientOsc1.start(t);
      this.ambientOsc2.start(t);
      this.ambientLfo.start(t);

      this.isAmbientPlaying = true;
    } catch (e) {
      console.warn("Ambient drone start error:", e);
    }
  }
}

const nimbusAudio = new NimbusAudioEngine();
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NimbusAudioEngine, nimbusAudio };
}
