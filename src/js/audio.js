/**
 * DSV-9 ARCHELON - Web Audio API Soundscape Synthesizer
 * Generates realistic submersible piloting acoustics in real-time:
 * - Ballast tank flood / vent high-pressure hiss (filtered noise sweep)
 * - Vectored thruster whine (detuned multi-oscillator frequency glide)
 * - Deep titanium hull pressure creak / groan (FM synthesis with stress modulation)
 * - Deep hadal ambient drone (sub-bass multi-wave resonance)
 * - Hydraulic solenoid click impulses
 * - Staged aperture breach crescendo
 * Explicitly excludes sonar pings / acoustic-detection sounds.
 */

const SoundEngine = (() => {
  let audioCtx = null;
  let isInitialized = false;
  let isMuted = false;

  // Master & Subsystem Gain Nodes
  let masterGain = null;
  let ballastGain = null;
  let thrusterGain = null;
  let hullGain = null;
  let droneGain = null;

  // Persistent Ambient Drone Nodes
  let droneOsc1 = null;
  let droneOsc2 = null;
  let droneFilter = null;

  // Dynamic sound loops / interval trackers
  let hullCreakTimer = null;

  const init = () => {
    if (isInitialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();

      // Master Gain
      masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(0.8, audioCtx.currentTime);
      masterGain.connect(audioCtx.destination);

      // Subsystem Gain Nodes
      ballastGain = audioCtx.createGain();
      ballastGain.gain.setValueAtTime(0.85, audioCtx.currentTime);
      ballastGain.connect(masterGain);

      thrusterGain = audioCtx.createGain();
      thrusterGain.gain.setValueAtTime(0.75, audioCtx.currentTime);
      thrusterGain.connect(masterGain);

      hullGain = audioCtx.createGain();
      hullGain.gain.setValueAtTime(0.9, audioCtx.currentTime);
      hullGain.connect(masterGain);

      droneGain = audioCtx.createGain();
      droneGain.gain.setValueAtTime(0.65, audioCtx.currentTime);
      droneGain.connect(masterGain);

      startAmbientDrone();
      startHullCreakLoop();

      isInitialized = true;
      Storage.logEvent('AUDIO_SYS', 'Web Audio API synthesis engine initialized');
    } catch (e) {
      console.warn('Web Audio API not supported or user gesture required:', e);
    }
  };

  const resumeContext = () => {
    if (!audioCtx) {
      init();
    } else if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  };

  /**
   * Deep Hadal Ambient Drone
   * Multi-oscillator sub-bass rumble (42Hz - 84Hz) with lowpass filter
   */
  const startAmbientDrone = () => {
    if (!audioCtx) return;

    droneOsc1 = audioCtx.createOscillator();
    droneOsc2 = audioCtx.createOscillator();
    droneFilter = audioCtx.createBiquadFilter();

    droneOsc1.type = 'sine';
    droneOsc1.frequency.setValueAtTime(44, audioCtx.currentTime); // Sub-bass low rumble

    droneOsc2.type = 'triangle';
    droneOsc2.frequency.setValueAtTime(65.4, audioCtx.currentTime); // Low C

    droneFilter.type = 'lowpass';
    droneFilter.frequency.setValueAtTime(140, audioCtx.currentTime);

    droneOsc1.connect(droneFilter);
    droneOsc2.connect(droneFilter);
    droneFilter.connect(droneGain);

    droneOsc1.start();
    droneOsc2.start();
  };

  /**
   * Ballast Tank Flood / Vent Hiss
   * White/pink noise through resonant bandpass filter sweep
   */
  const playBallastHiss = (duration = 0.6, isFlooding = true) => {
    if (!audioCtx || isMuted) return;
    resumeContext();

    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1; // White noise
    }

    const noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = buffer;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 4.5;

    const startFreq = isFlooding ? 1800 : 800;
    const endFreq = isFlooding ? 500 : 2200;

    filter.frequency.setValueAtTime(startFreq, audioCtx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(endFreq, audioCtx.currentTime + duration);

    const hissEnvelope = audioCtx.createGain();
    hissEnvelope.gain.setValueAtTime(0.01, audioCtx.currentTime);
    hissEnvelope.gain.linearRampToValueAtTime(0.4, audioCtx.currentTime + 0.08);
    hissEnvelope.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

    noiseSource.connect(filter);
    filter.connect(hissEnvelope);
    hissEnvelope.connect(ballastGain);

    noiseSource.start();
    noiseSource.stop(audioCtx.currentTime + duration);
  };

  /**
   * Vectored Thruster Whine
   * Detuned dual sawtooth oscillators with pitch ramping
   */
  const playThrusterWhine = (duration = 0.5, power = 1.0) => {
    if (!audioCtx || isMuted) return;
    resumeContext();

    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const filter = audioCtx.createBiquadFilter();
    const env = audioCtx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'triangle';

    const baseFreq = 160 + (power * 120);
    osc1.frequency.setValueAtTime(baseFreq, audioCtx.currentTime);
    osc1.frequency.linearRampToValueAtTime(baseFreq * 1.3, audioCtx.currentTime + duration * 0.4);
    osc1.frequency.linearRampToValueAtTime(baseFreq * 0.9, audioCtx.currentTime + duration);

    osc2.frequency.setValueAtTime(baseFreq * 1.01, audioCtx.currentTime);
    osc2.frequency.linearRampToValueAtTime(baseFreq * 1.31, audioCtx.currentTime + duration * 0.4);
    osc2.frequency.linearRampToValueAtTime(baseFreq * 0.91, audioCtx.currentTime + duration);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, audioCtx.currentTime);

    env.gain.setValueAtTime(0.01, audioCtx.currentTime);
    env.gain.linearRampToValueAtTime(0.3 * power, audioCtx.currentTime + 0.05);
    env.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(env);
    env.connect(thrusterGain);

    osc1.start();
    osc2.start();
    osc1.stop(audioCtx.currentTime + duration);
    osc2.stop(audioCtx.currentTime + duration);
  };

  /**
   * Titanium Hull Creak / Groan
   * FM synthesis simulating heavy metallic compressive stress under 1000+ bar
   */
  const playHullCreak = (intensity = 1.0) => {
    if (!audioCtx || isMuted) return;
    resumeContext();

    const carrier = audioCtx.createOscillator();
    const modulator = audioCtx.createOscillator();
    const modGain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    const env = audioCtx.createGain();

    const dur = 0.8 + Math.random() * 0.6;
    carrier.type = 'sawtooth';
    carrier.frequency.setValueAtTime(85 + Math.random() * 30, audioCtx.currentTime);
    carrier.frequency.exponentialRampToValueAtTime(55 + Math.random() * 20, audioCtx.currentTime + dur);

    modulator.type = 'sine';
    modulator.frequency.setValueAtTime(14 + Math.random() * 12, audioCtx.currentTime);
    modGain.gain.setValueAtTime(70 * intensity, audioCtx.currentTime);

    modulator.connect(modGain);
    modGain.connect(carrier.frequency);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(320, audioCtx.currentTime);
    filter.Q.value = 6.0;

    env.gain.setValueAtTime(0.01, audioCtx.currentTime);
    env.gain.linearRampToValueAtTime(0.35 * intensity, audioCtx.currentTime + 0.15);
    env.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + dur);

    carrier.connect(filter);
    filter.connect(env);
    env.connect(hullGain);

    carrier.start();
    modulator.start();
    carrier.stop(audioCtx.currentTime + dur);
    modulator.stop(audioCtx.currentTime + dur);
  };

  /**
   * Random Periodic Hull Creak based on current depth
   */
  const startHullCreakLoop = () => {
    if (hullCreakTimer) clearInterval(hullCreakTimer);
    hullCreakTimer = setInterval(() => {
      const currentDepth = (window.Physics && window.Physics.getState().depth) || 0;
      if (currentDepth > 2000 && Math.random() < 0.35) {
        const stressIntensity = Math.min(1.5, currentDepth / 6000);
        playHullCreak(stressIntensity);
      }
    }, 4500);
  };

  /**
   * Hydraulic Solenoid Valve Click
   */
  const playSolenoidClick = () => {
    if (!audioCtx || isMuted) return;
    resumeContext();

    const osc = audioCtx.createOscillator();
    const env = audioCtx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(900, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.03);

    env.gain.setValueAtTime(0.2, audioCtx.currentTime);
    env.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03);

    osc.connect(env);
    env.connect(masterGain);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.03);
  };

  /**
   * Staged Aperture Activation Boom & Hydraulic Surge
   */
  const playApertureBoom = (stage = 1) => {
    if (!audioCtx || isMuted) return;
    resumeContext();

    if (stage === 1) {
      // Stage 1: Buildup surge
      playBallastHiss(1.8, true);
      playThrusterWhine(1.8, 1.4);
      playHullCreak(1.3);
    } else if (stage === 2) {
      // Stage 2: Breakthrough shockwave
      const osc = audioCtx.createOscillator();
      const filter = audioCtx.createBiquadFilter();
      const env = audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(32, audioCtx.currentTime + 1.2);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, audioCtx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 1.2);

      env.gain.setValueAtTime(0.6, audioCtx.currentTime);
      env.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.2);

      osc.connect(filter);
      filter.connect(env);
      env.connect(masterGain);

      osc.start();
      osc.stop(audioCtx.currentTime + 1.2);
    } else if (stage === 3) {
      // Stage 3: Sustained active gate resonance
      if (droneFilter) {
        droneFilter.frequency.setTargetAtTime(350, audioCtx.currentTime, 0.5);
      }
    }
  };

  const setMasterVolume = (val) => {
    if (!masterGain) return;
    masterGain.gain.setTargetAtTime((val / 100) * 0.8, audioCtx.currentTime, 0.05);
  };

  const setChannelVolume = (channel, val) => {
    if (!audioCtx) return;
    const targetGain = (val / 100);
    if (channel === 'ballast' && ballastGain) ballastGain.gain.setTargetAtTime(targetGain, audioCtx.currentTime, 0.05);
    if (channel === 'thruster' && thrusterGain) thrusterGain.gain.setTargetAtTime(targetGain, audioCtx.currentTime, 0.05);
    if (channel === 'hull' && hullGain) hullGain.gain.setTargetAtTime(targetGain, audioCtx.currentTime, 0.05);
    if (channel === 'drone' && droneGain) droneGain.gain.setTargetAtTime(targetGain, audioCtx.currentTime, 0.05);
  };

  const toggleMute = () => {
    isMuted = !isMuted;
    if (masterGain && audioCtx) {
      masterGain.gain.setTargetAtTime(isMuted ? 0 : 0.8, audioCtx.currentTime, 0.05);
    }
    return isMuted;
  };

  const getMuted = () => isMuted;

  return {
    init,
    resumeContext,
    playBallastHiss,
    playThrusterWhine,
    playHullCreak,
    playSolenoidClick,
    playApertureBoom,
    setMasterVolume,
    setChannelVolume,
    toggleMute,
    getMuted
  };
})();

window.SoundEngine = SoundEngine;
