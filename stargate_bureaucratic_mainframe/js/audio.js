/**
 * D.S.T.C.L. TERMINAL OS/88-V - SYNTHESIZED WEB AUDIO ENGINE
 * Pure client-side Web Audio synthesis for authentic CRT hum, mechanical relays,
 * solenoid chevron clamps, vortex drone, fast stamps, and thermal printer sounds.
 */

class TerminalAudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.crtHumGain = null;
    this.vortexGain = null;
    this.vortexOsc1 = null;
    this.vortexOsc2 = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.setupAmbientHum();
      this.initialized = true;
    } catch (e) {
      console.warn("Web Audio initialization blocked or unsupported:", e);
    }
  }

  ensureContext() {
    if (!this.initialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleAudio() {
    this.enabled = !this.enabled;
    if (this.crtHumGain) {
      this.crtHumGain.gain.setValueAtTime(this.enabled ? 0.015 : 0, this.ctx.currentTime);
    }
    if (this.vortexGain && !this.enabled) {
      this.vortexGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
    return this.enabled;
  }

  setupAmbientHum() {
    if (!this.ctx) return;
    try {
      // 60Hz CRT Mains Hum + 120Hz Harmonic
      const osc60 = this.ctx.createOscillator();
      const osc120 = this.ctx.createOscillator();
      this.crtHumGain = this.ctx.createGain();

      osc60.type = 'sine';
      osc60.frequency.setValueAtTime(60, this.ctx.currentTime);
      osc120.type = 'sine';
      osc120.frequency.setValueAtTime(120, this.ctx.currentTime);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, this.ctx.currentTime);

      osc60.connect(filter);
      osc120.connect(filter);
      filter.connect(this.crtHumGain);
      this.crtHumGain.connect(this.ctx.destination);

      this.crtHumGain.gain.setValueAtTime(this.enabled ? 0.012 : 0, this.ctx.currentTime);
      osc60.start();
      osc120.start();
    } catch (e) {
      // Ignore background audio errors
    }
  }

  // Keyboard / Form Keypress Clack
  playKeyClick() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(1800 + Math.random() * 600, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.03);

    gain.gain.setValueAtTime(0.04, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.035);
  }

  // Commutator Stepping Ratchet Tick
  playCommutatorStep() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(620, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.04);

    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.045);
  }

  // Solenoid Hydraulic Chevron Lock (Heavy Mechanical Thud + High Click)
  playChevronLock(index = 0) {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    
    // Deep Solenoid Thud
    const oscLow = this.ctx.createOscillator();
    const gainLow = this.ctx.createGain();
    const baseFreq = 140 - index * 6;

    oscLow.type = 'sine';
    oscLow.frequency.setValueAtTime(baseFreq, t);
    oscLow.frequency.exponentialRampToValueAtTime(45, t + 0.14);

    gainLow.gain.setValueAtTime(0.18, t);
    gainLow.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    oscLow.connect(gainLow);
    gainLow.connect(this.ctx.destination);
    oscLow.start(t);
    oscLow.stop(t + 0.16);

    // High Mechanical Clamp Click
    const oscHigh = this.ctx.createOscillator();
    const gainHigh = this.ctx.createGain();
    oscHigh.type = 'sawtooth';
    oscHigh.frequency.setValueAtTime(1200 + index * 100, t);
    oscHigh.frequency.exponentialRampToValueAtTime(350, t + 0.08);

    gainHigh.gain.setValueAtTime(0.08, t);
    gainHigh.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    oscHigh.connect(gainHigh);
    gainHigh.connect(this.ctx.destination);
    oscHigh.start(t);
    oscHigh.stop(t + 0.09);
  }

  // Final 7th Gate Lock & Sub-Aetheric Horizon Dilation
  playApertureOpen() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // Harmonic Swell (Chime)
    const pitches = [220, 277.18, 329.63, 440, 554.37];
    pitches.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.05);

      gain.gain.setValueAtTime(0.08, t + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + idx * 0.05);
      osc.stop(t + 1.3);
    });

    this.startVortexRumble();
  }

  // Sub-Aetheric Vortex Continuous Drone
  startVortexRumble() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    if (this.vortexGain) {
      this.vortexGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      return;
    }

    const t = this.ctx.currentTime;
    this.vortexOsc1 = this.ctx.createOscillator();
    this.vortexOsc2 = this.ctx.createOscillator();
    this.vortexGain = this.ctx.createGain();

    this.vortexOsc1.type = 'sawtooth';
    this.vortexOsc1.frequency.setValueAtTime(55, t);

    this.vortexOsc2.type = 'sine';
    this.vortexOsc2.frequency.setValueAtTime(110.5, t);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(260, t);

    this.vortexOsc1.connect(filter);
    this.vortexOsc2.connect(filter);
    filter.connect(this.vortexGain);
    this.vortexGain.connect(this.ctx.destination);

    this.vortexGain.gain.setValueAtTime(0.01, t);
    this.vortexGain.gain.exponentialRampToValueAtTime(0.14, t + 0.8);

    this.vortexOsc1.start(t);
    this.vortexOsc2.start(t);
  }

  stopVortexRumble() {
    if (this.vortexGain && this.ctx) {
      const t = this.ctx.currentTime;
      this.vortexGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      setTimeout(() => {
        if (this.vortexOsc1) {
          try { this.vortexOsc1.stop(); this.vortexOsc2.stop(); } catch(e){}
          this.vortexOsc1 = null;
          this.vortexOsc2 = null;
          this.vortexGain = null;
        }
      }, 550);
    }
  }

  // Fast-Dial Pneumatic Stamp & Rapid Chime
  playFastDialStamp() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // Pneumatic Thump
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.2);

    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.25);

    // Two-Tone Approval Bell
    [660, 880].forEach((freq, i) => {
      const bell = this.ctx.createOscillator();
      const bellGain = this.ctx.createGain();
      bell.type = 'sine';
      bell.frequency.setValueAtTime(freq, t + 0.08 + i * 0.08);

      bellGain.gain.setValueAtTime(0.1, t + 0.08 + i * 0.08);
      bellGain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

      bell.connect(bellGain);
      bellGain.connect(this.ctx.destination);
      bell.start(t + 0.08 + i * 0.08);
      bell.stop(t + 0.7);
    });
  }

  // Bureaucratic Error / Rejection Buzzer
  playBuzzer() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(145, t);

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(152, t);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.36);
    osc2.stop(t + 0.36);
  }

  // Thermal Printer Chatter
  playThermalPrint() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    for (let i = 0; i < 8; i++) {
      const stepTime = t + i * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(2400 + Math.random() * 800, stepTime);
      gain.gain.setValueAtTime(0.03, stepTime);
      gain.gain.exponentialRampToValueAtTime(0.001, stepTime + 0.03);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(stepTime);
      osc.stop(stepTime + 0.035);
    }
  }
}

window.terminalAudio = new TerminalAudioEngine();
