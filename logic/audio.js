/**
 * Gate Dialing Computer - Audio Manager
 * Web Audio API for sound effects
 */

class AudioManager {
    constructor() {
        this.context = null;
        this.enabled = true;
        this.masterVolume = 0.5;

        // Sound buffers (would be loaded from files in production)
        this.sounds = {
            chevronLock: null,
            masterLock: null,
            ringRotate: null,
            kawoosh: null,
            alarm: null,
            engage: null,
            abort: null
        };

        // Currently playing sounds
        this.playing = new Map();
    }

    async init() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            console.log('[Audio] Context initialized');

            // Generate procedural sounds (no external files needed)
            this.generateProceduralSounds();

            return true;
        } catch (err) {
            console.warn('[Audio] Web Audio not available:', err);
            return false;
        }
    }

    generateProceduralSounds() {
        // Chevron lock "clunk" sound
        this.sounds.chevronLock = this.createChevronLockSound();

        // Master chevron lock — heavier, resonant
        this.sounds.masterLock = this.createMasterLockSound();

        // Ring rotation hum
        this.sounds.ringRotate = this.createRingRotateSound();

        // Kawoosh whoosh
        this.sounds.kawoosh = this.createKawooshSound();

        // Simple beep for engage
        this.sounds.engage = this.createBeepSound(880, 0.2);

        // Lower beep for abort
        this.sounds.abort = this.createBeepSound(220, 0.3);
    }

    createChevronLockSound() {
        const duration = 0.15;
        const sampleRate = this.context.sampleRate;
        const buffer = this.context.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            // Metallic clunk: low frequency burst with noise
            const freq = 150 - (t * 500);
            const envelope = Math.exp(-t * 30);
            const noise = (Math.random() - 0.5) * 0.3;
            data[i] = (Math.sin(2 * Math.PI * freq * t) * 0.7 + noise) * envelope;
        }

        return buffer;
    }

    createMasterLockSound() {
        const duration = 0.3;
        const sampleRate = this.context.sampleRate;
        const buffer = this.context.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            // Heavier clunk: deeper sweep, slower decay, resonant undertone
            const freq = 80 - (t * 500);
            const envelope = Math.exp(-t * 15);
            const noise = (Math.random() - 0.5) * 0.3;
            const undertone = Math.sin(2 * Math.PI * 440 * t) * 0.3;
            data[i] = (Math.sin(2 * Math.PI * freq * t) * 0.7 + noise + undertone) * envelope;
        }

        return buffer;
    }

    createRingRotateSound() {
        const duration = 1.0;
        const sampleRate = this.context.sampleRate;
        const buffer = this.context.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        const fade = 0.08;

        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            // Mechanical hum with harmonics
            const fundamental = Math.sin(2 * Math.PI * 80 * t);
            const harmonic1 = Math.sin(2 * Math.PI * 160 * t) * 0.5;
            const harmonic2 = Math.sin(2 * Math.PI * 240 * t) * 0.25;
            // Flat body with short linear fades so the buffer loops without a gap
            let envelope = 1;
            if (t < fade) {
                envelope = t / fade;
            } else if (t > duration - fade) {
                envelope = (duration - t) / fade;
            }
            data[i] = (fundamental + harmonic1 + harmonic2) * envelope * 0.3;
        }

        return buffer;
    }

    createKawooshSound() {
        const duration = 1.2;
        const sampleRate = this.context.sampleRate;
        const buffer = this.context.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            // Whoosh: filtered noise with pitch sweep
            const noise = Math.random() - 0.5;
            const freq = 200 + Math.sin(t * 10) * 100;
            const sweep = Math.sin(2 * Math.PI * freq * t);
            const envelope = t < 0.3 ? (t / 0.3) : Math.exp(-(t - 0.3) * 3);
            data[i] = (noise * 0.5 + sweep * 0.5) * envelope * 0.6;
        }

        return buffer;
    }

    createBeepSound(frequency, duration) {
        const sampleRate = this.context.sampleRate;
        const buffer = this.context.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const envelope = Math.sin(Math.PI * t / duration);
            data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.4;
        }

        return buffer;
    }

    play(soundName, options = {}) {
        if (!this.enabled || !this.context || !this.sounds[soundName]) {
            return null;
        }

        // Resume context if suspended (autoplay policy)
        if (this.context.state === 'suspended') {
            this.context.resume();
        }

        const source = this.context.createBufferSource();
        source.buffer = this.sounds[soundName];

        const gainNode = this.context.createGain();
        gainNode.gain.value = (options.volume || 1) * this.masterVolume;

        source.connect(gainNode);
        gainNode.connect(this.context.destination);

        if (options.loop) {
            source.loop = true;
        }

        source.start(0);

        const id = Date.now() + Math.random();
        this.playing.set(id, { source, gainNode });

        source.onended = () => {
            this.playing.delete(id);
        };

        return id;
    }

    /**
     * Start a sound looping indefinitely. Returns a handle for stopLooping().
     */
    playLooping(soundName, options = {}) {
        if (!this.enabled || !this.context || !this.sounds[soundName]) {
            return null;
        }

        if (this.context.state === 'suspended') {
            this.context.resume();
        }

        const source = this.context.createBufferSource();
        source.buffer = this.sounds[soundName];
        source.loop = true;

        const gainNode = this.context.createGain();
        gainNode.gain.value = (options.volume || 1) * this.masterVolume;

        source.connect(gainNode);
        gainNode.connect(this.context.destination);

        source.start(0);

        return { source, gainNode };
    }

    /**
     * Stop a looping sound with a short fade to avoid click artifacts.
     */
    stopLooping(handle) {
        if (!handle || !this.context) return;

        const rampTime = 0.06;
        const now = this.context.currentTime;
        handle.gainNode.gain.setValueAtTime(handle.gainNode.gain.value, now);
        handle.gainNode.gain.linearRampToValueAtTime(0, now + rampTime);
        handle.source.stop(now + rampTime);
    }

    stop(id) {
        const sound = this.playing.get(id);
        if (sound) {
            sound.source.stop();
            this.playing.delete(id);
        }
    }

    stopAll() {
        this.playing.forEach((sound, id) => {
            sound.source.stop();
        });
        this.playing.clear();
    }

    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }

    toggle() {
        this.enabled = !this.enabled;
        if (!this.enabled) {
            this.stopAll();
        }
        return this.enabled;
    }
}

// Global instance
const audioManager = new AudioManager();
