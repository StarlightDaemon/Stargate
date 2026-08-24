/**
 * Gate Audio Engine
 *
 * Procedural Web Audio sound generator for the Stargate dialing interface.
 * Every sound is synthesized in code as an AudioBuffer (no audio files) —
 * ported from the legacy vanilla-JS AudioManager approach: lazy context
 * creation on user gesture, a single master GainNode for global volume, an
 * enable toggle that stops everything, and a handle-based map of in-flight
 * sources so individual plays can be stopped.
 *
 * The module is safe to import under Node (no top-level DOM access) and
 * every public method is a no-op until `unlock()` has been called from a
 * real user gesture (or if Web Audio simply isn't available).
 */

export type GateSound =
  | 'dhdPress'
  | 'chevronLock'
  | 'ringRotate'
  | 'kawoosh'
  | 'engage'
  | 'abort'
  | 'irisClose'
  | 'irisOpen'
  | 'wormholeHum';

export interface PlayOptions {
  /** Linear gain multiplier applied on top of the master volume. Defaults to 1. */
  volume?: number;
  /** Loop the buffer (used for ringRotate / wormholeHum). Defaults to false. */
  loop?: boolean;
  /** Playback rate multiplier (also detunes pitch), applied via source.playbackRate. */
  pitch?: number;
}

interface PlayingHandle {
  source: AudioBufferSourceNode;
  gain: GainNode;
}

interface WindowWithWebkitAudio {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
}

function resolveAudioContextCtor(): typeof AudioContext | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const w = window as unknown as WindowWithWebkitAudio;
  if (typeof w.AudioContext === 'function') {
    return w.AudioContext;
  }
  if (typeof w.webkitAudioContext === 'function') {
    return w.webkitAudioContext;
  }
  return null;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export class GateAudio {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private buffers: Partial<Record<GateSound, AudioBuffer>> = {};
  private playing = new Map<number, PlayingHandle>();
  private nextHandle = 1;
  private masterVolume = 0.5;
  private _enabled = true;
  private _unlocked = false;

  /** Whether sound playback is currently enabled. */
  get enabled(): boolean {
    return this._enabled;
  }

  /** Whether the AudioContext has been successfully created and populated. */
  get unlocked(): boolean {
    return this._unlocked;
  }

  /**
   * Create the AudioContext and generate all procedural buffers. Must be
   * invoked from a user gesture (click/keypress) to satisfy autoplay
   * policies. Safe to call more than once — subsequent calls just attempt
   * to resume a suspended context. Never throws.
   */
  unlock(): void {
    if (this.ctx) {
      this.resumeIfSuspended();
      return;
    }

    const Ctor = resolveAudioContextCtor();
    if (!Ctor) {
      return;
    }

    try {
      const ctx = new Ctor();
      this.ctx = ctx;
      const master = ctx.createGain();
      master.gain.value = this.masterVolume;
      master.connect(ctx.destination);
      this.masterGain = master;
      this.generateAll(ctx);
      this._unlocked = true;
      this.resumeIfSuspended();
    } catch {
      this.ctx = null;
      this.masterGain = null;
      this._unlocked = false;
    }
  }

  private resumeIfSuspended(): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'suspended') {
      return;
    }
    void ctx.resume().catch(() => {
      /* ignore — will retry resume on next play()/unlock() */
    });
  }

  /**
   * Play a procedural sound. Returns a monotonic handle usable with stop(),
   * or null if audio is disabled/unavailable/not yet unlocked.
   */
  play(name: GateSound, opts?: PlayOptions): number | null {
    if (!this._enabled || !this.ctx || !this.masterGain) {
      return null;
    }
    const buffer = this.buffers[name];
    if (!buffer) {
      return null;
    }

    this.resumeIfSuspended();

    const ctx = this.ctx;
    const source = ctx.createBufferSource();
    source.buffer = buffer;

    if (opts?.loop) {
      source.loop = true;
    }
    if (typeof opts?.pitch === 'number' && opts.pitch > 0) {
      source.playbackRate.value = opts.pitch;
    }

    const gain = ctx.createGain();
    gain.gain.value = Math.max(0, opts?.volume ?? 1);

    source.connect(gain);
    gain.connect(this.masterGain);

    const handle = this.nextHandle++;
    this.playing.set(handle, { source, gain });
    source.onended = () => {
      this.playing.delete(handle);
    };

    source.start(0);
    return handle;
  }

  /** Stop a specific playing sound by handle. Safe no-op if unknown/already stopped. */
  stop(handle: number): void {
    const entry = this.playing.get(handle);
    if (!entry) {
      return;
    }
    try {
      entry.source.stop();
    } catch {
      /* already stopped */
    }
    this.playing.delete(handle);
  }

  /** Stop every currently playing sound. */
  stopAll(): void {
    for (const entry of this.playing.values()) {
      try {
        entry.source.stop();
      } catch {
        /* already stopped */
      }
    }
    this.playing.clear();
  }

  /** Set the master volume (0..1, clamped). Persists even before unlock(). */
  setMasterVolume(volume: number): void {
    this.masterVolume = clamp01(volume);
    if (this.masterGain) {
      this.masterGain.gain.value = this.masterVolume;
    }
  }

  /** Enable or disable playback. Disabling stops everything immediately. */
  setEnabled(value: boolean): void {
    this._enabled = value;
    if (!this._enabled) {
      this.stopAll();
    }
  }

  /** Toggle enabled state; returns the new state. */
  toggle(): boolean {
    this.setEnabled(!this._enabled);
    return this._enabled;
  }

  // ---------------------------------------------------------------------
  // Procedural sound generation
  // ---------------------------------------------------------------------

  private generateAll(ctx: AudioContext): void {
    this.buffers = {
      dhdPress: this.createDhdPressBuffer(ctx),
      chevronLock: this.createChevronLockBuffer(ctx),
      ringRotate: this.createRingRotateBuffer(ctx),
      kawoosh: this.createKawooshBuffer(ctx),
      engage: this.createEngageBuffer(ctx),
      abort: this.createAbortBuffer(ctx),
      irisClose: this.createIrisScrapeBuffer(ctx, 2400, 280, 1.1),
      irisOpen: this.createIrisScrapeBuffer(ctx, 280, 2400, 1.1),
      wormholeHum: this.createWormholeHumBuffer(ctx),
    };
  }

  private allocBuffer(ctx: AudioContext, duration: number): AudioBuffer {
    const length = Math.max(1, Math.round(duration * ctx.sampleRate));
    return ctx.createBuffer(1, length, ctx.sampleRate);
  }

  /** Short bright beep: ~880Hz sine, 0.12s, soft sine envelope. */
  private createDhdPressBuffer(ctx: AudioContext): AudioBuffer {
    const duration = 0.12;
    const freq = 880;
    const buffer = this.allocBuffer(ctx, duration);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / ctx.sampleRate;
      const envelope = Math.sin((Math.PI * t) / duration);
      data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.5;
    }
    return buffer;
  }

  /** Metallic clunk: descending low-frequency burst blended with noise, exponential decay. */
  private createChevronLockBuffer(ctx: AudioContext): AudioBuffer {
    const duration = 0.18;
    const buffer = this.allocBuffer(ctx, duration);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / ctx.sampleRate;
      const freq = 220 - t * 600;
      const envelope = Math.exp(-t * 25);
      const noise = (Math.random() - 0.5) * 0.4;
      data[i] = (Math.sin(2 * Math.PI * freq * t) * 0.7 + noise) * envelope;
    }
    return buffer;
  }

  /**
   * Loopable mechanical hum: 80Hz fundamental + two harmonics. Duration is
   * exactly 80 cycles of the fundamental (1.0s) and has no amplitude
   * envelope, so the buffer boundary is a perfect zero-crossing match for
   * every partial and loops seamlessly.
   */
  private createRingRotateBuffer(ctx: AudioContext): AudioBuffer {
    const fundamental = 80;
    const cycles = 80;
    const duration = cycles / fundamental;
    const buffer = this.allocBuffer(ctx, duration);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / ctx.sampleRate;
      const f0 = Math.sin(2 * Math.PI * fundamental * t);
      const f1 = Math.sin(2 * Math.PI * fundamental * 2 * t) * 0.5;
      const f2 = Math.sin(2 * Math.PI * fundamental * 3 * t) * 0.25;
      data[i] = (f0 + f1 + f2) * 0.3;
    }
    return buffer;
  }

  /** 1.4s noise burst with a descending pitch sweep, fast attack, exponential tail. */
  private createKawooshBuffer(ctx: AudioContext): AudioBuffer {
    const duration = 1.4;
    const attack = 0.08;
    const buffer = this.allocBuffer(ctx, duration);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / ctx.sampleRate;
      const noise = Math.random() - 0.5;
      const freq = 500 * Math.exp(-t * 1.2) + 90;
      const sweep = Math.sin(2 * Math.PI * freq * t);
      const envelope = t < attack ? t / attack : Math.exp(-(t - attack) * 2.2);
      data[i] = (noise * 0.5 + sweep * 0.5) * envelope * 0.6;
    }
    return buffer;
  }

  /** Confident two-tone beep: a rising interval, each tone independently windowed. */
  private createEngageBuffer(ctx: AudioContext): AudioBuffer {
    const toneDuration = 0.12;
    const duration = toneDuration * 2;
    const buffer = this.allocBuffer(ctx, duration);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / ctx.sampleRate;
      const inSecondTone = t >= toneDuration;
      const freq = inSecondTone ? 990 : 660;
      const localT = inSecondTone ? t - toneDuration : t;
      const envelope = Math.sin((Math.PI * localT) / toneDuration);
      data[i] = Math.sin(2 * Math.PI * freq * localT) * envelope * 0.5;
    }
    return buffer;
  }

  /** Low descending buzz: sine/square blend sweeping down in pitch with exponential decay. */
  private createAbortBuffer(ctx: AudioContext): AudioBuffer {
    const duration = 0.4;
    const buffer = this.allocBuffer(ctx, duration);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / ctx.sampleRate;
      const freq = 260 - t * 400;
      const phase = 2 * Math.PI * freq * t;
      const buzz = Math.sign(Math.sin(phase)) * 0.5 + Math.sin(phase) * 0.5;
      const envelope = Math.exp(-t * 4);
      data[i] = buzz * envelope * 0.5;
    }
    return buffer;
  }

  /** Metallic scrape: filtered-noise-style sweep (tone+noise blend) from startFreq to endFreq. */
  private createIrisScrapeBuffer(
    ctx: AudioContext,
    startFreq: number,
    endFreq: number,
    duration: number,
  ): AudioBuffer {
    const buffer = this.allocBuffer(ctx, duration);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / ctx.sampleRate;
      const frac = t / duration;
      const freq = startFreq + (endFreq - startFreq) * frac;
      const noise = Math.random() - 0.5;
      const tone = Math.sin(2 * Math.PI * freq * t);
      const envelope = Math.sin(Math.PI * frac);
      data[i] = (noise * 0.35 + tone * 0.55) * envelope * 0.6;
    }
    return buffer;
  }

  /**
   * Loopable low ambient drone: 55Hz partial plus a detuned 55.5Hz partial.
   * At exactly 2.0s the fundamental completes 110 cycles and the detuned
   * partial completes 111 — both integers — so the buffer loops seamlessly
   * while producing a slow 0.5Hz beating throb (one full beat per loop).
   */
  private createWormholeHumBuffer(ctx: AudioContext): AudioBuffer {
    const fundamental = 55;
    const detuned = 55.5;
    const duration = 2.0;
    const buffer = this.allocBuffer(ctx, duration);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / ctx.sampleRate;
      const a = Math.sin(2 * Math.PI * fundamental * t);
      const b = Math.sin(2 * Math.PI * detuned * t) * 0.8;
      data[i] = (a + b) * 0.3;
    }
    return buffer;
  }
}

export const gateAudio = new GateAudio();
