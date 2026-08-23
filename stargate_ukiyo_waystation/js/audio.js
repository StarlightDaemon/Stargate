/**
 * Ukiyo-e Physical Acoustic Sound Engine
 * Uses Web Audio API synthesis to generate authentic woodblock impacts, washi paper friction,
 * bronze temple bells (Bonsho), wooden clappers (Hyoshigi), and surging wind/water textures.
 * ZERO electronic chirps, synthesizer beeps, or digital HUD sweeps.
 */

class UkiyoeAudioEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.isMuted = false;
        this.ambientGain = null;
        this.ambientSource = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(0.75, this.ctx.currentTime);
            this.masterGain.connect(this.ctx.destination);
            this.initialized = true;
            this.startAmbient();
        } catch (e) {
            console.warn('Web Audio API not supported or blocked:', e);
        }
    }

    ensureContext() {
        if (!this.initialized) {
            this.init();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    /**
     * Woodblock Impact Thud ("Don!")
     * Resonant low-frequency timber strike when a seal stamps onto washi paper
     */
    playWoodblockStamp(layerIndex = 1) {
        this.ensureContext();
        if (!this.ctx) return;

        const t = this.ctx.currentTime;
        const pitchMultiplier = 1 - (layerIndex * 0.04); // subtle pitch lowering as layers build
        const baseFreq = 140 * pitchMultiplier;

        // Resonant wood body oscillator
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(baseFreq, t);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, t + 0.18);

        // Wood impact click / transient
        const clickOsc = this.ctx.createOscillator();
        clickOsc.type = 'sine';
        clickOsc.frequency.setValueAtTime(420 * pitchMultiplier, t);
        clickOsc.frequency.exponentialRampToValueAtTime(80, t + 0.04);

        // Filter for warm wood timbre
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(850, t);
        filter.frequency.exponentialRampToValueAtTime(200, t + 0.22);
        filter.Q.setValueAtTime(4.0, t);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.9, t + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

        osc.connect(filter);
        clickOsc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        clickOsc.start(t);
        osc.stop(t + 0.26);
        clickOsc.stop(t + 0.05);

        // Add subtle washi paper rustle
        this.playPaperFriction(0.12, 0.3);
    }

    /**
     * Paper Friction ("Sssht")
     * Textured bandpass noise simulating mulberry washi paper rubbing/brushing
     */
    playPaperFriction(duration = 0.2, volume = 0.4) {
        this.ensureContext();
        if (!this.ctx) return;

        const t = this.ctx.currentTime;
        const bufferSize = Math.floor(this.ctx.sampleRate * duration);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.45));
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2400, t);
        filter.frequency.exponentialRampToValueAtTime(1200, t + duration);
        filter.Q.setValueAtTime(2.5, t);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(volume * 0.6, t + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start(t);
        noise.stop(t + duration);
    }

    /**
     * Wooden Clapper ("Hyoshigi" Clack)
     * Crisp cherrywood clapper strike when rotating the dial or selecting presets
     */
    playClapper() {
        this.ensureContext();
        if (!this.ctx) return;

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(780, t);
        osc.frequency.exponentialRampToValueAtTime(320, t + 0.035);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400, t);
        filter.Q.setValueAtTime(5.0, t);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.5, t + 0.002);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.07);
    }

    /**
     * Bronze Temple Bell ("Bonsho" / "Rin")
     * Deep multi-harmonic resonance when all seals lock or when portal activates
     */
    playTempleBell(isMajor = false) {
        this.ensureContext();
        if (!this.ctx) return;

        const t = this.ctx.currentTime;
        const fundamental = isMajor ? 108 : 216; // 108Hz sacred low gong or 216Hz bell
        const harmonics = [
            { f: fundamental, g: 0.8, decay: isMajor ? 3.5 : 2.0 },
            { f: fundamental * 2.02, g: 0.5, decay: isMajor ? 2.8 : 1.6 },
            { f: fundamental * 2.76, g: 0.35, decay: isMajor ? 2.2 : 1.2 },
            { f: fundamental * 4.15, g: 0.2, decay: isMajor ? 1.5 : 0.8 },
            { f: fundamental * 5.43, g: 0.1, decay: isMajor ? 1.0 : 0.5 }
        ];

        harmonics.forEach(h => {
            const osc = this.ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(h.f, t);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.001, t);
            gain.gain.linearRampToValueAtTime(h.g * 0.4, t + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + h.decay);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(t);
            osc.stop(t + h.decay);
        });
    }

    /**
     * Ink Brush Stroke ("Zaza")
     * Soft sweeping friction sound during manual dial drag / spin
     */
    playBrushSweep() {
        this.playPaperFriction(0.18, 0.25);
    }

    /**
     * Staged Activation Audio Sequence
     */
    playActivationBuildup() {
        this.ensureContext();
        if (!this.ctx) return;

        const t = this.ctx.currentTime;
        // Low tension rumble like ocean swell or mountain tremor
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(45, t);
        osc.frequency.linearRampToValueAtTime(95, t + 1.8);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(110, t);
        filter.frequency.linearRampToValueAtTime(480, t + 1.8);
        filter.Q.setValueAtTime(4.0, t);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.01, t);
        gain.gain.linearRampToValueAtTime(0.65, t + 1.7);
        gain.gain.linearRampToValueAtTime(0.01, t + 1.85);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 1.9);

        // Intermittent wooden press creaks
        setTimeout(() => this.playClapper(), 400);
        setTimeout(() => this.playClapper(), 900);
        setTimeout(() => this.playClapper(), 1400);
    }

    playActivationBreakthrough() {
        this.ensureContext();
        if (!this.ctx) return;

        // Monumental temple bell gong
        this.playTempleBell(true);

        // Powerful woodblock master stamp
        this.playWoodblockStamp(5);

        // Crashing wave splash texture
        const t = this.ctx.currentTime;
        const dur = 1.2;
        const bufferSize = Math.floor(this.ctx.sampleRate * dur);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - (i / bufferSize), 1.8);
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, t);
        filter.frequency.exponentialRampToValueAtTime(300, t + dur);
        filter.Q.setValueAtTime(1.8, t);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.01, t);
        gain.gain.linearRampToValueAtTime(0.7, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start(t);
        noise.stop(t + dur);
    }

    /**
     * Disengage Wooden Latch Release Sound
     */
    playDisengage() {
        this.ensureContext();
        if (!this.ctx) return;

        const t = this.ctx.currentTime;
        // Dual wooden sliding latch clack
        this.playClapper();
        setTimeout(() => {
            if (this.ctx) {
                const t2 = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(180, t2);
                osc.frequency.exponentialRampToValueAtTime(60, t2 + 0.15);

                const gain = this.ctx.createGain();
                gain.gain.setValueAtTime(0.4, t2);
                gain.gain.exponentialRampToValueAtTime(0.001, t2 + 0.15);

                osc.connect(gain);
                gain.connect(this.masterGain);
                osc.start(t2);
                osc.stop(t2 + 0.16);
            }
        }, 80);
    }

    /**
     * Safety Interlock Rejection Thud
     */
    playInterlockBlocked() {
        this.ensureContext();
        if (!this.ctx) return;

        // Dull heavy wooden barrier thud
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(75, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + 0.2);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(220, t);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.7, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + 0.23);
    }

    /**
     * Ambient Soft Wind / Distant Ocean
     */
    startAmbient() {
        if (!this.ctx || this.ambientSource) return;

        try {
            const bufferSize = this.ctx.sampleRate * 2;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            let lastOut = 0.0;

            // Pink noise generation for natural wind sound
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                data[i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = data[i];
                data[i] *= 1.5;
            }

            this.ambientSource = this.ctx.createBufferSource();
            this.ambientSource.buffer = buffer;
            this.ambientSource.loop = true;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(380, this.ctx.currentTime);

            this.ambientGain = this.ctx.createGain();
            this.ambientGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

            this.ambientSource.connect(filter);
            filter.connect(this.ambientGain);
            this.ambientGain.connect(this.masterGain);

            this.ambientSource.start();
        } catch (e) {
            console.warn('Ambient start failed:', e);
        }
    }
}

// Global instance
window.UkiyoeAudio = new UkiyoeAudioEngine();
