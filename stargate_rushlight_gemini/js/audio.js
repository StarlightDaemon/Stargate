// audio.js — Procedural folk soundscape for RUSHLIGHT
// Synthesizes wood dowels, wool plucks, flint strikes, hearth fire, and bells via Web Audio API.

class FolkAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isMuted = false;
    this.activeNodes = new Set();
    this.hearthAmbience = null;
    this.buildupNodes = null;
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return false;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.35, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return true;
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      const t = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(t);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, t);
      this.masterGain.gain.linearRampToValueAtTime(muted ? 0 : 0.35, t + 0.05);
    }
  }

  // Wooden dowel ratchet click for ring rotation
  playSpindleClick(pitchRatio = 1.0) {
    if (!this.ensureContext() || this.isMuted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = "sine";
    osc.frequency.setValueAtTime(420 * pitchRatio, t);
    osc.frequency.exponentialRampToValueAtTime(180 * pitchRatio, t + 0.04);

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(600 * pitchRatio, t);
    filter.Q.setValueAtTime(3.0, t);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.05);
  }

  // Taut spun-wool string pluck + bone pin tap
  playPinSeat(pinIndex = 0) {
    if (!this.ensureContext() || this.isMuted) return;
    const t = this.ctx.currentTime;

    // Resonant string fundamental
    const baseFreqs = [220, 247.5, 277.2, 329.6, 370, 415.3, 493.9];
    const freq = baseFreqs[pinIndex % baseFreqs.length];

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.98, t + 0.35);

    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

    // Subtle wooden tap transient
    const tapOsc = this.ctx.createOscillator();
    const tapGain = this.ctx.createGain();
    tapOsc.type = "square";
    tapOsc.frequency.setValueAtTime(950, t);
    tapGain.gain.setValueAtTime(0.25, t);
    tapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);

    osc.connect(gain);
    gain.connect(this.masterGain);

    tapOsc.connect(tapGain);
    tapGain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.4);
    tapOsc.start(t);
    tapOsc.stop(t + 0.03);
  }

  // Twine friction drawing sound
  playThreadDraw() {
    if (!this.ensureContext() || this.isMuted) return;
    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1400, t);
    filter.Q.setValueAtTime(2.5, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(t);
  }

  // Flint strike against cold iron striker
  playFlintStrike() {
    if (!this.ensureContext() || this.isMuted) return;
    const t = this.ctx.currentTime;

    // Metallic ping
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(2400, t);
    osc.frequency.exponentialRampToValueAtTime(1100, t + 0.08);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  // Stage 1: Buildup rising acoustic resonance (tallow kindling + thread hum)
  startBuildup(durationSeconds = 1.8) {
    this.stopBuildup();
    if (!this.ensureContext() || this.isMuted) return;
    const t = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc1.type = "triangle";
    osc1.frequency.setValueAtTime(110, t);
    osc1.frequency.exponentialRampToValueAtTime(220, t + durationSeconds);

    osc2.type = "sine";
    osc2.frequency.setValueAtTime(165, t);
    osc2.frequency.exponentialRampToValueAtTime(330, t + durationSeconds);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(280, t);
    filter.frequency.exponentialRampToValueAtTime(1400, t + durationSeconds);

    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.35, t + durationSeconds);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(t);
    osc2.start(t);

    this.buildupNodes = { osc1, osc2, gain, filter };
  }

  stopBuildup() {
    if (this.buildupNodes && this.ctx) {
      const t = this.ctx.currentTime;
      try {
        this.buildupNodes.gain.gain.cancelScheduledValues(t);
        this.buildupNodes.gain.gain.setValueAtTime(this.buildupNodes.gain.gain.value, t);
        this.buildupNodes.gain.gain.linearRampToValueAtTime(0.0001, t + 0.05);
        this.buildupNodes.osc1.stop(t + 0.06);
        this.buildupNodes.osc2.stop(t + 0.06);
      } catch (e) {
        // Safe discard
      }
      this.buildupNodes = null;
    }
  }

  // Stage 2: Breakthrough sudden rustic bell chime & salt snap
  playBreakthrough() {
    this.stopBuildup();
    if (!this.ensureContext() || this.isMuted) return;
    const t = this.ctx.currentTime;

    // Rustic iron bell chime (inharmonic partials)
    const partials = [440, 720, 1180, 1620];
    partials.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(f, t);

      const amp = 0.3 / (idx + 1);
      gain.gain.setValueAtTime(amp, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2 + idx * 0.2);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 1.5 + idx * 0.2);
    });

    // Crisp chalk salt crackle burst
    const bufLen = Math.floor(this.ctx.sampleRate * 0.25);
    const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufLen);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;
    const snapGain = this.ctx.createGain();
    snapGain.gain.setValueAtTime(0.2, t);
    snapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    noise.connect(snapGain);
    snapGain.connect(this.masterGain);
    noise.start(t);
  }

  // Stage 3: Sustained active peaceful fireplace ember hum and gentle drone
  startSustainedActive() {
    this.stopSustainedActive();
    if (!this.ensureContext() || this.isMuted) return;
    const t = this.ctx.currentTime;

    // Warm hearth base drone
    const droneOsc = this.ctx.createOscillator();
    const droneFilter = this.ctx.createBiquadFilter();
    const droneGain = this.ctx.createGain();

    droneOsc.type = "sawtooth";
    droneOsc.frequency.setValueAtTime(73.42, t); // D2 peaceful hearth tone

    droneFilter.type = "lowpass";
    droneFilter.frequency.setValueAtTime(260, t);

    droneGain.gain.setValueAtTime(0.01, t);
    droneGain.gain.linearRampToValueAtTime(0.18, t + 0.6);

    droneOsc.connect(droneFilter);
    droneFilter.connect(droneGain);
    droneGain.connect(this.masterGain);
    droneOsc.start(t);

    // Warm fireplace crackle (pinkish noise burst loop)
    const crackleLen = this.ctx.sampleRate * 2;
    const crackleBuf = this.ctx.createBuffer(1, crackleLen, this.ctx.sampleRate);
    const crackleData = crackleBuf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < crackleLen; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      let val = (b0 + b1 + b2) * 0.25;
      // Random ember pops
      if (Math.random() < 0.004) val += (Math.random() - 0.5) * 1.5;
      crackleData[i] = val;
    }

    const crackleSource = this.ctx.createBufferSource();
    crackleSource.buffer = crackleBuf;
    crackleSource.loop = true;

    const crackleGain = this.ctx.createGain();
    crackleGain.gain.setValueAtTime(0.01, t);
    crackleGain.gain.linearRampToValueAtTime(0.12, t + 0.8);

    const crackleFilter = this.ctx.createBiquadFilter();
    crackleFilter.type = "bandpass";
    crackleFilter.frequency.setValueAtTime(800, t);
    crackleFilter.Q.setValueAtTime(1.0, t);

    crackleSource.connect(crackleFilter);
    crackleFilter.connect(crackleGain);
    crackleGain.connect(this.masterGain);
    crackleSource.start(t);

    this.hearthAmbience = {
      droneOsc,
      droneGain,
      crackleSource,
      crackleGain
    };
  }

  stopSustainedActive() {
    if (this.hearthAmbience && this.ctx) {
      const t = this.ctx.currentTime;
      try {
        this.hearthAmbience.droneGain.gain.cancelScheduledValues(t);
        this.hearthAmbience.droneGain.gain.setValueAtTime(this.hearthAmbience.droneGain.gain.value, t);
        this.hearthAmbience.droneGain.gain.linearRampToValueAtTime(0.0001, t + 0.1);
        this.hearthAmbience.crackleGain.gain.cancelScheduledValues(t);
        this.hearthAmbience.crackleGain.gain.setValueAtTime(this.hearthAmbience.crackleGain.gain.value, t);
        this.hearthAmbience.crackleGain.gain.linearRampToValueAtTime(0.0001, t + 0.1);

        this.hearthAmbience.droneOsc.stop(t + 0.12);
        this.hearthAmbience.crackleSource.stop(t + 0.12);
      } catch (e) {
        // Safe discard
      }
      this.hearthAmbience = null;
    }
  }

  // Swift breath / candle blowout + loose thread unspooling
  playDisengage() {
    this.stopBuildup();
    this.stopSustainedActive();
    if (!this.ensureContext() || this.isMuted) return;
    const t = this.ctx.currentTime;

    // Breath / puff of air
    const bufLen = Math.floor(this.ctx.sampleRate * 0.28);
    const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufLen) * Math.PI);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(700, t);
    filter.frequency.linearRampToValueAtTime(200, t + 0.28);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(t);
  }

  // Safety interlock toggle sound
  playInterlock(latched = true) {
    if (!this.ensureContext() || this.isMuted) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(latched ? 140 : 280, t);
    osc.frequency.exponentialRampToValueAtTime(latched ? 70 : 350, t + 0.08);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  // Complete cancellation of all sounds and nodes
  stopAll() {
    this.stopBuildup();
    this.stopSustainedActive();
    if (this.masterGain && this.ctx) {
      const t = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(t);
      this.masterGain.gain.setValueAtTime(0, t);
      if (!this.isMuted) {
        this.masterGain.gain.setValueAtTime(0.35, t + 0.05);
      }
    }
  }
}

export const sound = new FolkAudioEngine();
