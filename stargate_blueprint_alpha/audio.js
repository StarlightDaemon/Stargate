/**
 * VOSSEN-KLEIN TOPOLOGICAL DRAFTING STATION // PROCEDURAL AUDIO ENGINE
 * Custom Web Audio API synthesizer for CAD drafting plotter, Rapidograph pen,
 * mechanical caliper locks, and harmonic manifold resonance.
 */

class BlueprintAudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.ambientHumGain = null;
    this.ambientHumNodes = [];
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleAudio() {
    this.enabled = !this.enabled;
    if (!this.enabled && this.ambientHumGain) {
      this.ambientHumGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
    return this.enabled;
  }

  // Stepper Motor Step Sound (Plotter positioning pulse)
  playPlotterStep() {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'square';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(700, now + 0.03);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.Q.setValueAtTime(5, now);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  // Rapidograph Technical Pen / Mechanical Pencil Inking Scratch
  playPenScratch() {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;
    const duration = 0.14;

    // Buffer of white noise
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(3200, now);
    filter.frequency.linearRampToValueAtTime(4800, now + duration);

    const bandFilter = this.ctx.createBiquadFilter();
    bandFilter.type = 'peaking';
    bandFilter.frequency.setValueAtTime(4200, now);
    bandFilter.gain.setValueAtTime(12, now);
    bandFilter.Q.setValueAtTime(8, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(bandFilter);
    bandFilter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
  }

  // Caliper Clamp Snap (Locking gesture sound)
  playCaliperSnap() {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;

    // Sharp metallic transient
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(2600, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.08);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);

    // Complementary rapidograph pen stroke
    setTimeout(() => {
      this.playPenScratch();
    }, 40);
  }

  // Structural Review Hold Warning Buzzer & Pips
  playReviewHoldAlert() {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;

    // Low alert buzz
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.36);

    // 2 high warning pips
    [0.08, 0.18].forEach(offset => {
      const pip = this.ctx.createOscillator();
      const pipGain = this.ctx.createGain();
      pip.type = 'sine';
      pip.frequency.setValueAtTime(1900, now + offset);
      pipGain.gain.setValueAtTime(0.1, now + offset);
      pipGain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.05);

      pip.connect(pipGain);
      pipGain.connect(this.ctx.destination);
      pip.start(now + offset);
      pip.stop(now + offset + 0.06);
    });
  }

  // Drawing Approval Stamp Impact & Harmonic Manifold Swell
  playApprovalAndActivation() {
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;

    // Heavy stamp thump (punch)
    const thump = this.ctx.createOscillator();
    const thumpGain = this.ctx.createGain();
    thump.type = 'triangle';
    thump.frequency.setValueAtTime(120, now);
    thump.frequency.exponentialRampToValueAtTime(35, now + 0.25);
    thumpGain.gain.setValueAtTime(0.35, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    thump.connect(thumpGain);
    thumpGain.connect(this.ctx.destination);
    thump.start(now);
    thump.stop(now + 0.3);

    // Harmonic chords
    const freqs = [164.81, 220.00, 329.63, 440.00, 659.25]; // E major chord
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + 0.1);
      osc.frequency.linearRampToValueAtTime(freq * 1.01, now + 1.2);

      gain.gain.setValueAtTime(0, now + 0.1);
      gain.gain.linearRampToValueAtTime(0.06 / (idx + 1), now + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + 0.1);
      osc.stop(now + 1.7);
    });

    // Start continuous topological ambient hum
    this.startAmbientHum();
  }

  // Continuous Topological Aperture Hum
  startAmbientHum() {
    this.stopAmbientHum();
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;

    this.ambientHumGain = this.ctx.createGain();
    this.ambientHumGain.gain.setValueAtTime(0, now);
    this.ambientHumGain.gain.linearRampToValueAtTime(0.08, now + 1.0);
    this.ambientHumGain.connect(this.ctx.destination);

    // Base sub-sine
    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(55, now); // A1 note
    subOsc.connect(this.ambientHumGain);
    subOsc.start(now);
    this.ambientHumNodes.push(subOsc);

    // Fifth overtone with subtle vibrato
    const fifthOsc = this.ctx.createOscillator();
    fifthOsc.type = 'sine';
    fifthOsc.frequency.setValueAtTime(82.5, now);
    fifthOsc.connect(this.ambientHumGain);
    fifthOsc.start(now);
    this.ambientHumNodes.push(fifthOsc);

    // Filtered air noise
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.05;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(320, now);
    noiseFilter.Q.setValueAtTime(4, now);

    noise.connect(noiseFilter);
    noiseFilter.connect(this.ambientHumGain);
    noise.start(now);
    this.ambientHumNodes.push(noise);
  }

  stopAmbientHum() {
    if (this.ambientHumGain) {
      try {
        const now = this.ctx ? this.ctx.currentTime : 0;
        this.ambientHumGain.gain.linearRampToValueAtTime(0.001, now + 0.5);
        setTimeout(() => {
          this.ambientHumNodes.forEach(node => {
            try { node.stop(); } catch(e){}
            try { node.disconnect(); } catch(e){}
          });
          this.ambientHumNodes = [];
          if (this.ambientHumGain) {
            this.ambientHumGain.disconnect();
            this.ambientHumGain = null;
          }
        }, 550);
      } catch(e) {
        this.ambientHumNodes = [];
        this.ambientHumGain = null;
      }
    }
  }

  // Plotter Sweep & Line Erase / Disengage sound
  playDisengage() {
    this.stopAmbientHum();
    if (!this.enabled) return;
    this.init();
    const now = this.ctx.currentTime;

    // High sweep downward (carriage return)
    const sweep = this.ctx.createOscillator();
    const sweepGain = this.ctx.createGain();
    sweep.type = 'sawtooth';
    sweep.frequency.setValueAtTime(800, now);
    sweep.frequency.exponentialRampToValueAtTime(180, now + 0.4);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.linearRampToValueAtTime(200, now + 0.4);

    sweepGain.gain.setValueAtTime(0.12, now);
    sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    sweep.connect(filter);
    filter.connect(sweepGain);
    sweepGain.connect(this.ctx.destination);

    sweep.start(now);
    sweep.stop(now + 0.46);

    // Pneumatic release hiss
    const duration = 0.35;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const hiss = this.ctx.createBufferSource();
    hiss.buffer = buffer;

    const hissFilter = this.ctx.createBiquadFilter();
    hissFilter.type = 'bandpass';
    hissFilter.frequency.setValueAtTime(1800, now);
    hissFilter.Q.setValueAtTime(2, now);

    const hissGain = this.ctx.createGain();
    hissGain.gain.setValueAtTime(0.1, now + 0.1);
    hissGain.gain.exponentialRampToValueAtTime(0.001, now + duration + 0.1);

    hiss.connect(hissFilter);
    hissFilter.connect(hissGain);
    hissGain.connect(this.ctx.destination);

    hiss.start(now + 0.1);
  }
}

window.blueprintAudio = new BlueprintAudioEngine();
