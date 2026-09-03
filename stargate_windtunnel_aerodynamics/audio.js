// ============================================================================
// Aeolos Stagnation Plenum (ASP-9) — Aerodynamic Audio Synthesis Engine
// Pure Web Audio API — Zero External Audio Assets
// ============================================================================

class AerodynamicAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isMuted = false;
    this.activeSpool = null;
    this.activeTunnelRoar = null;
    this.interlockAlarm = null;
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(this.isMuted ? 0 : 0.7, now + 0.05);
    }
    return this.isMuted;
  }

  // Create a buffer of pink/brownian noise for airflow simulation
  createNoiseBuffer(seconds = 3.0) {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * seconds;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  // Azimuth step click / vane ratchet
  playVaneSteerTick() {
    const ctx = this.ensureContext();
    if (!ctx || this.isMuted) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.025);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.028);
  }

  // Grounded Vane-Lock & Pitot Stagnation Lock sound
  playVaneLockSound(sectorIndex = 0) {
    const ctx = this.ensureContext();
    if (!ctx || this.isMuted) return;
    const now = ctx.currentTime;

    // 1. Pneumatic micro-solenoid mechanical snap
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = 'square';
    clickOsc.frequency.setValueAtTime(800, now);
    clickOsc.frequency.exponentialRampToValueAtTime(120, now + 0.04);
    clickGain.gain.setValueAtTime(0.35, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    clickOsc.connect(clickGain);
    clickGain.connect(this.masterGain);
    clickOsc.start(now);
    clickOsc.stop(now + 0.045);

    // 2. High-pressure boundary suction hiss puff
    const noiseBuf = this.createNoiseBuffer(0.25);
    if (noiseBuf) {
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuf;
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(2400, now);
      noiseFilter.Q.setValueAtTime(3.0, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.28, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      noiseSource.start(now);
      noiseSource.stop(now + 0.20);
    }

    // 3. Stagnation acoustic resonance ring (scales per sector)
    const baseFreq = 440 * Math.pow(1.06, sectorIndex);
    const ringOsc = ctx.createOscillator();
    const ringGain = ctx.createGain();
    ringOsc.type = 'sine';
    ringOsc.frequency.setValueAtTime(baseFreq, now);
    ringGain.gain.setValueAtTime(0.25, now + 0.01);
    ringGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    ringOsc.connect(ringGain);
    ringGain.connect(this.masterGain);
    ringOsc.start(now);
    ringOsc.stop(now + 0.36);
  }

  // Vane release / reset clunk
  playSectorUnlockSound() {
    const ctx = this.ensureContext();
    if (!ctx || this.isMuted) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.12);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  // Stage 1: Compressor Spool-Up & Plenum Pressurization (2.2s buildup)
  startCompressorSpool(durationSec = 2.2) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    this.stopContinuousSounds();

    const now = ctx.currentTime;

    // Turbine whine oscillator
    const turbineOsc = ctx.createOscillator();
    const turbineGain = ctx.createGain();
    turbineOsc.type = 'sawtooth';
    turbineOsc.frequency.setValueAtTime(140, now);
    turbineOsc.frequency.exponentialRampToValueAtTime(2600, now + durationSec);

    turbineGain.gain.setValueAtTime(0.05, now);
    turbineGain.gain.linearRampToValueAtTime(0.38, now + durationSec);

    // Harmonic blade-pass frequency
    const bladeOsc = ctx.createOscillator();
    const bladeGain = ctx.createGain();
    bladeOsc.type = 'sine';
    bladeOsc.frequency.setValueAtTime(280, now);
    bladeOsc.frequency.exponentialRampToValueAtTime(5200, now + durationSec);
    bladeGain.gain.setValueAtTime(0.02, now);
    bladeGain.gain.linearRampToValueAtTime(0.18, now + durationSec);

    // Airflow noise ramping up
    const noiseBuf = this.createNoiseBuffer(durationSec + 0.5);
    let noiseSource = null;
    let noiseFilter = null;
    let noiseGain = null;
    if (noiseBuf) {
      noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuf;
      noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(300, now);
      noiseFilter.frequency.exponentialRampToValueAtTime(3500, now + durationSec);
      noiseFilter.Q.setValueAtTime(2.0, now);

      noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.05, now);
      noiseGain.gain.linearRampToValueAtTime(0.45, now + durationSec);

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      noiseSource.start(now);
      noiseSource.stop(now + durationSec + 0.1);
    }

    turbineOsc.connect(turbineGain);
    turbineGain.connect(this.masterGain);
    bladeOsc.connect(bladeGain);
    bladeGain.connect(this.masterGain);

    turbineOsc.start(now);
    turbineOsc.stop(now + durationSec + 0.1);
    bladeOsc.start(now);
    bladeOsc.stop(now + durationSec + 0.1);

    this.activeSpool = { turbineOsc, turbineGain, bladeOsc, bladeGain, noiseSource };
  }

  // Stage 2: Breakthrough Instant (Mach 1.0 Sonic Boom & Shock Wave Snap)
  playSonicBoomBreakthrough() {
    const ctx = this.ensureContext();
    if (!ctx || this.isMuted) return;
    const now = ctx.currentTime;

    // 1. Deep Sub-bass shock thump (40 Hz impulse)
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(120, now);
    subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.4);
    subGain.gain.setValueAtTime(0.9, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    subOsc.connect(subGain);
    subGain.connect(this.masterGain);
    subOsc.start(now);
    subOsc.stop(now + 0.6);

    // 2. Sonic boom crack / shock-wave burst
    const noiseBuf = this.createNoiseBuffer(0.8);
    if (noiseBuf) {
      const crackSource = ctx.createBufferSource();
      crackSource.buffer = noiseBuf;
      const crackFilter = ctx.createBiquadFilter();
      crackFilter.type = 'lowpass';
      crackFilter.frequency.setValueAtTime(6000, now);
      crackFilter.frequency.exponentialRampToValueAtTime(200, now + 0.5);

      const crackGain = ctx.createGain();
      crackGain.gain.setValueAtTime(0.8, now);
      crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      crackSource.connect(crackFilter);
      crackFilter.connect(crackGain);
      crackGain.connect(this.masterGain);
      crackSource.start(now);
      crackSource.stop(now + 0.7);
    }

    // 3. Resonant optical shockwave flash chime
    const chimeOsc = ctx.createOscillator();
    const chimeGain = ctx.createGain();
    chimeOsc.type = 'sine';
    chimeOsc.frequency.setValueAtTime(1760, now);
    chimeOsc.frequency.exponentialRampToValueAtTime(880, now + 0.8);
    chimeGain.gain.setValueAtTime(0.35, now);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

    chimeOsc.connect(chimeGain);
    chimeGain.connect(this.masterGain);
    chimeOsc.start(now);
    chimeOsc.stop(now + 0.9);
  }

  // Stage 3: Sustained Supersonic Flow Roar
  startSustainedTunnelRoar() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    this.stopContinuousSounds();

    const now = ctx.currentTime;

    // Continuous broadband supersonic flow noise
    const noiseBuf = this.createNoiseBuffer(5.0);
    if (!noiseBuf) return;

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuf;
    noiseSource.loop = true;

    // Resonant supersonic duct modes
    const filter1 = ctx.createBiquadFilter();
    filter1.type = 'bandpass';
    filter1.frequency.setValueAtTime(450, now);
    filter1.Q.setValueAtTime(1.8, now);

    const filter2 = ctx.createBiquadFilter();
    filter2.type = 'lowpass';
    filter2.frequency.setValueAtTime(1200, now);

    const roarGain = ctx.createGain();
    roarGain.gain.setValueAtTime(0.01, now);
    roarGain.gain.linearRampToValueAtTime(0.32, now + 0.6);

    // Deep cyclic standing-wave hum
    const humOsc = ctx.createOscillator();
    const humGain = ctx.createGain();
    humOsc.type = 'sine';
    humOsc.frequency.setValueAtTime(58.5, now); // ASP-9 plenum fundamental duct mode
    humGain.gain.setValueAtTime(0.01, now);
    humGain.gain.linearRampToValueAtTime(0.22, now + 0.6);

    noiseSource.connect(filter1);
    filter1.connect(filter2);
    filter2.connect(roarGain);
    roarGain.connect(this.masterGain);

    humOsc.connect(humGain);
    humGain.connect(this.masterGain);

    noiseSource.start(now);
    humOsc.start(now);

    this.activeTunnelRoar = { noiseSource, roarGain, humOsc, humGain };
  }

  // Emergency Blowdown Dump: high-pressure vent blast
  playEmergencyDumpSound() {
    const ctx = this.ensureContext();
    this.stopContinuousSounds();
    if (!ctx || this.isMuted) return;
    const now = ctx.currentTime;

    // Sudden pneumatic exhaust dump
    const noiseBuf = this.createNoiseBuffer(1.4);
    if (noiseBuf) {
      const ventSource = ctx.createBufferSource();
      ventSource.buffer = noiseBuf;
      const ventFilter = ctx.createBiquadFilter();
      ventFilter.type = 'bandpass';
      ventFilter.frequency.setValueAtTime(1800, now);
      ventFilter.frequency.exponentialRampToValueAtTime(160, now + 1.2);
      ventFilter.Q.setValueAtTime(1.2, now);

      const ventGain = ctx.createGain();
      ventGain.gain.setValueAtTime(0.65, now);
      ventGain.gain.exponentialRampToValueAtTime(0.001, now + 1.35);

      ventSource.connect(ventFilter);
      ventFilter.connect(ventGain);
      ventGain.connect(this.masterGain);
      ventSource.start(now);
      ventSource.stop(now + 1.4);
    }

    // Heavy mechanical solenoid release
    const solOsc = ctx.createOscillator();
    const solGain = ctx.createGain();
    solOsc.type = 'square';
    solOsc.frequency.setValueAtTime(260, now);
    solOsc.frequency.exponentialRampToValueAtTime(45, now + 0.15);
    solGain.gain.setValueAtTime(0.4, now);
    solGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    solOsc.connect(solGain);
    solGain.connect(this.masterGain);
    solOsc.start(now);
    solOsc.stop(now + 0.18);
  }

  // Choke Gate Interlock warning siren
  playInterlockKlaxon() {
    const ctx = this.ensureContext();
    if (!ctx || this.isMuted) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(660, now + 0.12);
    osc.frequency.setValueAtTime(880, now + 0.24);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  playInterlockToggle(isEngaged) {
    const ctx = this.ensureContext();
    if (!ctx || this.isMuted) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(isEngaged ? 320 : 540, now);
    osc.frequency.exponentialRampToValueAtTime(isEngaged ? 160 : 720, now + 0.08);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  stopContinuousSounds() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.activeSpool) {
      try {
        this.activeSpool.turbineGain.gain.linearRampToValueAtTime(0.001, now + 0.1);
        this.activeSpool.bladeGain.gain.linearRampToValueAtTime(0.001, now + 0.1);
        if (this.activeSpool.noiseSource) this.activeSpool.noiseSource.stop(now + 0.12);
        this.activeSpool.turbineOsc.stop(now + 0.12);
        this.activeSpool.bladeOsc.stop(now + 0.12);
      } catch (e) {}
      this.activeSpool = null;
    }
    if (this.activeTunnelRoar) {
      try {
        this.activeTunnelRoar.roarGain.gain.linearRampToValueAtTime(0.001, now + 0.15);
        this.activeTunnelRoar.humGain.gain.linearRampToValueAtTime(0.001, now + 0.15);
        this.activeTunnelRoar.noiseSource.stop(now + 0.18);
        this.activeTunnelRoar.humOsc.stop(now + 0.18);
      } catch (e) {}
      this.activeTunnelRoar = null;
    }
  }
}

export const audio = new AerodynamicAudioEngine();
