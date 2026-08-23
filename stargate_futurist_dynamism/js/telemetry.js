/**
 * ISTITUTO DINAMICO DI PROPULSIONE E TRASLAZIONE (IDPT)
 * Live Computed Physics Telemetry & Dynamic Diagnostics Engine
 */

class FuturistTelemetryEngine {
  constructor() {
    this.rpm = 140;             // Angular Velocity (RPM)
    this.targetRpm = 140;
    this.gForce = 0.2;          // Centrifugal G-Load (g)
    this.vibration = 4.2;       // Oscillation Amplitude (um)
    this.temperature = 22.4;    // Stator Temperature (°C)
    this.forceFlux = 1.2;       // Radial Force Flux (MJ)
    this.harmonicResonance = 0; // Harmonic Peak Factor

    this.waveformBuffer = new Array(60).fill(0);
    this.subscribers = new Set();
    this.isRunning = false;
    this.lastTime = performance.now();
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  setTargetState(gateState, lockedCount = 0) {
    switch (gateState) {
      case 'idle':
        this.targetRpm = 140 + (lockedCount * 380);
        break;
      case 'pending':
        this.targetRpm = 4250;
        break;
      case 'buildup':
        this.targetRpm = 18600;
        break;
      case 'breakthrough':
        this.targetRpm = 24800;
        break;
      case 'active':
        this.targetRpm = 23900 + (Math.sin(performance.now() * 0.003) * 450);
        break;
    }
  }

  loop(currentTime) {
    if (!this.isRunning) return;
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    // 1. Angular Velocity (RPM) with smooth dynamic inertia
    const accelRate = this.rpm < this.targetRpm ? 4.5 : 2.5;
    this.rpm += (this.targetRpm - this.rpm) * accelRate * dt;

    // 2. Centrifugal G-Force (Physically coupled: G = w^2 * r / C)
    const normalizedOmega = this.rpm / 1000;
    this.gForce = Math.max(0.1, (normalizedOmega * normalizedOmega * 0.082));

    // 3. Dynamic Vibration Amplitude (Spikes at critical harmonic resonances)
    // Critical resonance bands: 3,400 RPM, 11,500 RPM, 19,200 RPM
    const res1 = Math.exp(-Math.pow((this.rpm - 3400) / 400, 2)) * 35;
    const res2 = Math.exp(-Math.pow((this.rpm - 11500) / 600, 2)) * 75;
    const res3 = Math.exp(-Math.pow((this.rpm - 19200) / 800, 2)) * 120;
    const baseVibe = (normalizedOmega * 2.1) + (Math.sin(currentTime * 0.02) * 1.8);
    this.vibration = Math.max(1.5, baseVibe + res1 + res2 + res3);
    this.harmonicResonance = (res1 + res2 + res3) / 120;

    // 4. Stator Core Temperature (°C)
    const ambientTemp = 21.5;
    const heatGen = Math.pow(normalizedOmega, 1.35) * 0.045;
    const heatDissipation = (this.temperature - ambientTemp) * 0.02;
    this.temperature = Math.max(ambientTemp, this.temperature + (heatGen - heatDissipation) * dt);

    // 5. Radial Force Flux (Mega-Joules / Tensor units)
    const fluxBase = Math.pow(normalizedOmega / 3, 1.8);
    const fluxNoise = (Math.sin(currentTime * 0.015) + Math.cos(currentTime * 0.038)) * 0.8;
    this.forceFlux = Math.max(0.2, fluxBase + fluxNoise + (this.harmonicResonance * 15));

    // Update Waveform Buffer
    this.waveformBuffer.shift();
    this.waveformBuffer.push(this.vibration);

    // Broadcast to UI
    this.notify();

    requestAnimationFrame(this.loop);
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notify() {
    const data = {
      rpm: Math.round(this.rpm),
      gForce: this.gForce.toFixed(2),
      vibration: this.vibration.toFixed(1),
      temperature: this.temperature.toFixed(1),
      forceFlux: this.forceFlux.toFixed(2),
      harmonicResonance: this.harmonicResonance,
      waveform: this.waveformBuffer
    };
    this.subscribers.forEach(cb => cb(data));
  }
}

window.idptTelemetry = new FuturistTelemetryEngine();
