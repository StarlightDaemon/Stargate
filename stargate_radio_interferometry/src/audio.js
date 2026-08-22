// Web Audio API procedural sound engine for Hesperus Deep-Space Synthesis Array

let audioCtx = null;
let humNodes = null;
let sustainedNodes = null;
let isMuted = false;

export function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function startAmbientHum() {
  const ctx = getAudioContext();
  if (!ctx || humNodes) return;

  try {
    const now = ctx.currentTime;

    // Dual low-frequency cryogenic receiver oscillators
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const subOsc = ctx.createOscillator();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(48, now); // 48 Hz sub hum

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(51.5, now); // 51.5 Hz subtle binaural beat

    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(96, now); // 96 Hz second harmonic

    // Low-pass resonant filter
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, now);
    filter.Q.setValueAtTime(3.5, now);

    // Thermal noise buffer generator
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.04;
    }
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1200, now);
    noiseFilter.Q.setValueAtTime(2.0, now);

    const masterHumGain = ctx.createGain();
    masterHumGain.gain.setValueAtTime(0.001, now);
    masterHumGain.gain.exponentialRampToValueAtTime(0.08, now + 2.0);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.015, now);

    osc1.connect(filter);
    osc2.connect(filter);
    subOsc.connect(filter);
    filter.connect(masterHumGain);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterHumGain);

    masterHumGain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    subOsc.start(now);
    noiseSource.start(now);

    humNodes = { osc1, osc2, subOsc, noiseSource, masterHumGain, filter };
  } catch (e) {
    console.warn('Audio hum initialization deferred:', e);
  }
}

// Frequency chirp rising in pitch and clarity as coincidence is established
export function playCoincidenceChirp(stationIdx, totalStations, sectorFreqHz) {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const progress = (stationIdx + 1) / totalStations;

    // Rapid dish pulse
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = progress > 0.8 ? 'sine' : 'triangle';
    // Frequency ramps up smoothly based on station index and sector frequency
    const basePitch = 440 + (sectorFreqHz % 400);
    const pitch = basePitch * (0.8 + progress * 0.9);

    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(pitch * 1.15, now + 0.05);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(pitch, now);
    filter.Q.setValueAtTime(5 + progress * 10, now);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.08 * (0.4 + 0.6 * progress), now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  } catch (e) {}
}

// Full Coincidence Lock Confirmation (Crisp multi-tone phase-closure chime)
export function playSectorLockConfirmed(sectorIndex) {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 harmonic chord

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * (1 + (sectorIndex % 5) * 0.08), now + i * 0.025);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.setValueAtTime(0.07 / (i + 1), now + i * 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.025 + 0.45);

      if (pan) {
        pan.pan.setValueAtTime((i - 1.5) * 0.4, now);
        osc.connect(gain);
        gain.connect(pan);
        pan.connect(ctx.destination);
      } else {
        osc.connect(gain);
        gain.connect(ctx.destination);
      }

      osc.start(now + i * 0.025);
      osc.stop(now + i * 0.025 + 0.5);
    });
  } catch (e) {}
}

// Stage 1: Buildup sound (Doppler tracking sweep, rising SNR drone, accelerating lock pulses)
let buildupTimer = null;
export function playBuildupSound(durationMs = 2000) {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const durSec = durationMs / 1000;

    // Rising Doppler drone
    const droneOsc = ctx.createOscillator();
    const droneGain = ctx.createGain();
    const droneFilter = ctx.createBiquadFilter();

    droneOsc.type = 'sawtooth';
    droneOsc.frequency.setValueAtTime(73.42, now); // D2
    droneOsc.frequency.exponentialRampToValueAtTime(293.66, now + durSec); // D4

    droneFilter.type = 'lowpass';
    droneFilter.frequency.setValueAtTime(200, now);
    droneFilter.frequency.exponentialRampToValueAtTime(3200, now + durSec);
    droneFilter.Q.setValueAtTime(6.0, now);

    droneGain.gain.setValueAtTime(0.01, now);
    droneGain.gain.linearRampToValueAtTime(0.14, now + durSec);

    droneOsc.connect(droneFilter);
    droneFilter.connect(droneGain);
    droneGain.connect(ctx.destination);

    droneOsc.start(now);
    droneOsc.stop(now + durSec);

    // Accelerating sync pulses during buildup
    let pulseCount = 12;
    for (let i = 0; i < pulseCount; i++) {
      const pulseTime = now + (Math.pow(i / pulseCount, 1.6) * durSec * 0.92);
      const pOsc = ctx.createOscillator();
      const pGain = ctx.createGain();

      pOsc.type = 'square';
      pOsc.frequency.setValueAtTime(880 + i * 80, pulseTime);

      pGain.gain.setValueAtTime(0.001, pulseTime);
      pGain.gain.linearRampToValueAtTime(0.05 + (i / pulseCount) * 0.06, pulseTime + 0.005);
      pGain.gain.exponentialRampToValueAtTime(0.0001, pulseTime + 0.04);

      pOsc.connect(pGain);
      pGain.connect(ctx.destination);

      pOsc.start(pulseTime);
      pOsc.stop(pulseTime + 0.05);
    }
  } catch (e) {}
}

// Stage 2: Breakthrough Instant Sound (Sub-bass impact punch, bright iris flash chime)
export function playBreakthroughSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // 1. Sub-bass acoustic impact
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();

    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(120, now);
    subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.6);

    subGain.gain.setValueAtTime(0.35, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

    subOsc.connect(subGain);
    subGain.connect(ctx.destination);

    subOsc.start(now);
    subOsc.stop(now + 1.0);

    // 2. High-energy aperture opening sweep
    const sweepOsc = ctx.createOscillator();
    const sweepFilter = ctx.createBiquadFilter();
    const sweepGain = ctx.createGain();

    sweepOsc.type = 'sawtooth';
    sweepOsc.frequency.setValueAtTime(220, now);
    sweepOsc.frequency.exponentialRampToValueAtTime(1760, now + 0.4);

    sweepFilter.type = 'bandpass';
    sweepFilter.frequency.setValueAtTime(880, now);
    sweepFilter.frequency.exponentialRampToValueAtTime(4500, now + 0.5);
    sweepFilter.Q.setValueAtTime(4.0, now);

    sweepGain.gain.setValueAtTime(0.18, now);
    sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    sweepOsc.connect(sweepFilter);
    sweepFilter.connect(sweepGain);
    sweepGain.connect(ctx.destination);

    sweepOsc.start(now);
    sweepOsc.stop(now + 0.8);
  } catch (e) {}
}

// Stage 3: Sustained Active State Harmonic Carrier Loop
export function startSustainedActiveAudio() {
  stopSustainedActiveAudio();
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Harmonic multi-oscillator technosignature carrier chord
    const frequencies = [261.63, 392.00, 523.25, 659.25, 1046.5]; // C4, G4, C5, E5, C6
    const oscillators = [];
    const mainGain = ctx.createGain();
    mainGain.gain.setValueAtTime(0.001, now);
    mainGain.gain.linearRampToValueAtTime(0.10, now + 0.8);

    // LFO for rotating carrier modulation
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(1.42, now); // 1.42 Hz interstellar pulsation
    lfoGain.gain.setValueAtTime(0.03, now);

    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      // Subtle detune for rich celestial chorus
      osc.detune.setValueAtTime((idx - 2) * 6, now);

      oscGain.gain.setValueAtTime(0.04 / (idx + 1), now);

      osc.connect(oscGain);
      oscGain.connect(mainGain);
      osc.start(now);
      oscillators.push(osc);
    });

    lfo.connect(mainGain.gain);
    lfo.start(now);

    mainGain.connect(ctx.destination);

    sustainedNodes = { oscillators, lfo, mainGain };
  } catch (e) {}
}

export function stopSustainedActiveAudio() {
  if (!sustainedNodes) return;
  const ctx = getAudioContext();
  if (ctx && sustainedNodes.mainGain) {
    try {
      const now = ctx.currentTime;
      sustainedNodes.mainGain.gain.linearRampToValueAtTime(0.0001, now + 0.3);
      setTimeout(() => {
        if (sustainedNodes) {
          sustainedNodes.oscillators.forEach(osc => {
            try { osc.stop(); } catch(e) {}
          });
          try { sustainedNodes.lfo.stop(); } catch(e) {}
          sustainedNodes = null;
        }
      }, 350);
    } catch(e) {
      sustainedNodes = null;
    }
  } else {
    sustainedNodes = null;
  }
}

// Disengage sound (Power-down sweep & vacuum decay)
export function playDisengageSound() {
  stopSustainedActiveAudio();
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.45);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.55);
  } catch (e) {}
}

// Post-Detection Verification Hold (PDVH) Interlock Warning Tone
export function playInterlockWarning() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(440, now + 0.08);
    osc.frequency.setValueAtTime(880, now + 0.16);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.setValueAtTime(0.001, now + 0.07);
    gain.gain.setValueAtTime(0.14, now + 0.08);
    gain.gain.setValueAtTime(0.001, now + 0.15);
    gain.gain.setValueAtTime(0.14, now + 0.16);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  } catch (e) {}
}
