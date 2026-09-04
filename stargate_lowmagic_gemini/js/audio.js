/**
 * audio.js — Procedural Web Audio Engine for Stargate Low Magic ("RUSHLIGHT")
 * Synthesizes folk acoustics: plucked linen cords, twine snaps, salt scrapes,
 * hearth bellows, tallow rushlight crackle, bronze hearth bell, and iron shears.
 * Zero external audio files or network requests.
 */

class FolkAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isMuted = false;
    this.activeDrone = null;
    this.activeCrackle = null;
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.35, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  // 1. Plucked Linen Cord (Karplus-Strong / modal twine pluck)
  playCordPluck(stepIndex = 0) {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // Pentatonic folk scale: D, F, G, A, C
    const baseFreqs = [146.83, 174.61, 196.00, 220.00, 261.63, 293.66, 349.23];
    const freq = baseFreqs[stepIndex % baseFreqs.length];

    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, t);
    // Slight initial pitch slip as twine draws tight
    osc.frequency.exponentialRampToValueAtTime(freq * 1.02, t + 0.04);
    osc.frequency.exponentialRampToValueAtTime(freq, t + 0.3);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1400, t);
    filter.frequency.exponentialRampToValueAtTime(300, t + 0.4);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.45, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.55);

    // Add a tiny noise transient (friction of cord over wood)
    this.playCordFriction(t);
  }

  playCordFriction(t) {
    const bufferSize = this.ctx.sampleRate * 0.04;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1800, t);
    filter.Q.setValueAtTime(3, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(t);
  }

  // 2. Knot Cinch & Pin Snap
  playKnotCinch() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(420, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.08);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  // 3. Salt & Chalk Line Scrape
  playChalkScrape() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const dur = 0.18;
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(2400, t);
    filter.Q.setValueAtTime(4, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(t);
  }

  // 4. Hearth Bellows Breath (Buildup start)
  playBellows() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const dur = 1.4;
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(220, t);
    filter.frequency.linearRampToValueAtTime(780, t + 0.7);
    filter.frequency.exponentialRampToValueAtTime(180, t + dur);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.28, t + 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(t);
  }

  // 5. Tallow Rushlight Flame Ignition & Crackle
  startTallowHiss() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx || this.activeCrackle) return;

    const t = this.ctx.currentTime;
    // Low noise loop + micro clicks
    const dur = 3.0;
    const bufferSize = this.ctx.sampleRate * dur;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const isPop = Math.random() < 0.002;
      data[i] = isPop ? (Math.random() * 2 - 1) * 0.8 : (Math.random() * 2 - 1) * 0.08;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(3200, t);
    filter.Q.setValueAtTime(2.5, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.12, t + 0.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(t);
    this.activeCrackle = { noise, gain };
  }

  stopTallowHiss() {
    if (this.activeCrackle && this.ctx) {
      const t = this.ctx.currentTime;
      this.activeCrackle.gain.gain.linearRampToValueAtTime(0.001, t + 0.2);
      setTimeout(() => {
        try {
          this.activeCrackle?.noise.stop();
          this.activeCrackle?.noise.disconnect();
          this.activeCrackle = null;
        } catch (_) {}
      }, 250);
    }
  }

  // 6. Resonant Bronze Hearth Bell (Breakthrough moment)
  playHearthBell() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Bell partials: fundamental 440Hz, minor third 528Hz, fifth 660Hz, octave 880Hz, twelfth 1320Hz
    const partials = [
      { freq: 440, gain: 0.35, decay: 3.2 },
      { freq: 528, gain: 0.25, decay: 2.5 },
      { freq: 659.25, gain: 0.2, decay: 2.1 },
      { freq: 880, gain: 0.15, decay: 1.6 },
      { freq: 1318.5, gain: 0.08, decay: 0.9 }
    ];

    partials.forEach(p => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(p.freq, t);

      gain.gain.setValueAtTime(p.gain, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + p.decay);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + p.decay + 0.1);
    });

    // Metallic strike transient
    this.playChalkScrape();
  }

  // 7. Sustained Hearth Drone (Active portal ambience)
  startHearthDrone() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx || this.activeDrone) return;

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const gain = this.ctx.createGain();

    // Warm D root: 73.42Hz (D2) + 110.00Hz (A2 fifth)
    osc1.type = "triangle";
    osc1.frequency.setValueAtTime(73.42, t);

    osc2.type = "sine";
    osc2.frequency.setValueAtTime(110.00, t);

    // Subtle gentle hearth tremor
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(1.2, t); // 1.2Hz gentle flame flutter
    lfoGain.gain.setValueAtTime(0.04, t);

    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);

    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 1.2);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(t);
    osc2.start(t);
    lfo.start(t);

    this.activeDrone = { osc1, osc2, lfo, gain };
  }

  stopHearthDrone() {
    if (this.activeDrone && this.ctx) {
      const t = this.ctx.currentTime;
      this.activeDrone.gain.gain.linearRampToValueAtTime(0.001, t + 0.3);
      setTimeout(() => {
        try {
          this.activeDrone?.osc1.stop();
          this.activeDrone?.osc2.stop();
          this.activeDrone?.lfo.stop();
          this.activeDrone?.osc1.disconnect();
          this.activeDrone?.osc2.disconnect();
          this.activeDrone?.gain.disconnect();
          this.activeDrone = null;
        } catch (_) {}
      }, 350);
    }
  }

  // 8. Wool Shears Snip (Disengage cut)
  playShearSnip() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Fast double metallic click
    [0, 0.035].forEach((offset) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(3200, t + offset);
      osc.frequency.exponentialRampToValueAtTime(800, t + offset + 0.025);

      gain.gain.setValueAtTime(0.25, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.03);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t + offset);
      osc.stop(t + offset + 0.04);
    });
  }

  // 9. Ash Snuff Puff
  playSnuffAsh() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const dur = 0.25;
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(380, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(t);
  }

  // 10. Barred Cold-Iron Clang (Safety interlock strike)
  playBarredClang() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.15);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.22);
  }

  // Complete silence & teardown on disengage
  silenceAll() {
    this.stopTallowHiss();
    this.stopHearthDrone();
  }
}

window.FolkAudio = new FolkAudioEngine();
