/**
 * Gate Dialing Computer — Signal Strength Visualization
 * Oscilloscope-style waveform + spectrum analyzer bars
 */

class SignalStrength {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.warn('[Signal] Canvas not found');
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.isActive = false;
        this.animationId = null;
        this.frame = 0;
        this.mode = 'idle';

        // Logical draw dimensions (set by resize)
        this.W = 0;
        this.H = 0;

        // Waveform — ring buffer of normalised values (0=center, ±1=full height)
        this.WAVEFORM_LEN = 120;
        this.waveform = new Float32Array(this.WAVEFORM_LEN);

        // Carrier/envelope state
        this.ph1 = Math.random() * Math.PI * 2; // primary carrier phase
        this.ph2 = Math.random() * Math.PI * 2; // secondary carrier phase
        this.ph3 = Math.random() * Math.PI * 2; // slow modulation phase
        this.envelope = 0.3; // current amplitude envelope (0–1)

        // Spectrum bars — 20 bars each with smoothed value and peak hold
        this.BAR_COUNT = 20;
        this.barValues  = new Float32Array(this.BAR_COUNT).fill(0.15);
        this.barTargets = new Float32Array(this.BAR_COUNT).fill(0.15);
        this.barPeaks   = new Float32Array(this.BAR_COUNT).fill(0.15);
        this.barHold    = new Int32Array(this.BAR_COUNT).fill(0);   // frames remaining at peak
        this.barTimer   = new Int32Array(this.BAR_COUNT).fill(0);   // frames until next target roll

        // Stats (smoothed for display)
        this.peakStat = 0.3;
        this.avgStat  = 0.3;

        this.resize();
        this._ro = new ResizeObserver(() => this.resize());
        this._ro.observe(this.canvas);
    }

    resize() {
        const dpr  = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        this.W = rect.width;
        this.H = rect.height;

        this.canvas.width  = Math.round(rect.width  * dpr);
        this.canvas.height = Math.round(rect.height * dpr);

        // Reset transform so repeated resizes don't stack scales
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // ----- Public API -----

    start() {
        if (this.isActive) return;
        this.isActive = true;
        this.animate();
    }

    stop() {
        this.isActive = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    /** Called by engine.js on state transitions */
    setMode(mode) {
        this.mode = mode;
    }

    // ----- Mode parameters -----

    get params() {
        // base: target envelope centre (0–1)
        // spread: amplitude of envelope variation
        // envSpeed: how fast envelope wanders
        // noise: random noise floor added to waveform
        // ph1Rate, ph2Rate, ph3Rate: phase advance per frame (radians)
        switch (this.mode) {
            case 'active':
                return { base: 0.78, spread: 0.15, envSpeed: 0.006, noise: 0.06,
                         ph1Rate: 0.09, ph2Rate: 0.05, ph3Rate: 0.018 };
            case 'dialing':
                return { base: 0.50, spread: 0.28, envSpeed: 0.018, noise: 0.10,
                         ph1Rate: 0.11, ph2Rate: 0.07, ph3Rate: 0.025 };
            default: // idle
                return { base: 0.22, spread: 0.20, envSpeed: 0.008, noise: 0.14,
                         ph1Rate: 0.06, ph2Rate: 0.035, ph3Rate: 0.012 };
        }
    }

    // ----- Update -----

    updateWaveform() {
        const p = this.params;

        // Advance carrier phases
        this.ph1 += p.ph1Rate;
        this.ph2 += p.ph2Rate;
        this.ph3 += p.ph3Rate;

        // Envelope wanders toward mode base with random drift
        const envTarget = p.base + Math.sin(this.ph3) * p.spread;
        this.envelope += (envTarget - this.envelope) * p.envSpeed +
                         (Math.random() - 0.5) * p.envSpeed * 0.5;
        this.envelope = Math.max(0.05, Math.min(0.98, this.envelope));

        // Composite signal: two sine carriers + noise, scaled by envelope
        const signal = (
            Math.sin(this.ph1) * 0.55 +
            Math.sin(this.ph2) * 0.30 +
            (Math.random() - 0.5) * p.noise
        ) * this.envelope;

        // Shift buffer left, append new value (clamped to ±1)
        this.waveform.copyWithin(0, 1);
        this.waveform[this.WAVEFORM_LEN - 1] = Math.max(-1, Math.min(1, signal));
    }

    updateBars() {
        const p = this.params;
        const centerIdx = (this.BAR_COUNT - 1) / 2;

        for (let i = 0; i < this.BAR_COUNT; i++) {
            // Roll a new target periodically
            this.barTimer[i]--;
            if (this.barTimer[i] <= 0) {
                // Spectral hump: bars closer to center are stronger
                const dist    = Math.abs(i - centerIdx) / centerIdx; // 0 at center, 1 at edge
                const hump    = 1 - dist * 0.65;
                const tgt     = (p.base * hump + Math.random() * p.spread) * hump;
                this.barTargets[i] = Math.max(0.04, Math.min(0.97, tgt));
                this.barTimer[i]   = 6 + Math.floor(Math.random() * 18);
            }

            // Smooth bar toward target
            this.barValues[i] += (this.barTargets[i] - this.barValues[i]) * 0.18;

            // Peak hold
            if (this.barValues[i] >= this.barPeaks[i]) {
                this.barPeaks[i] = this.barValues[i];
                this.barHold[i]  = 45;
            } else {
                this.barHold[i]--;
                if (this.barHold[i] <= 0) {
                    this.barPeaks[i] = Math.max(this.barPeaks[i] - 0.01, this.barValues[i]);
                }
            }
        }
    }

    updateStats() {
        // Signal values are −1 to +1; convert to 0–1 magnitude for display
        let peak = 0, sum = 0;
        for (let i = 0; i < this.WAVEFORM_LEN; i++) {
            const mag = Math.abs(this.waveform[i]);
            if (mag > peak) peak = mag;
            sum += mag;
        }
        const avg = sum / this.WAVEFORM_LEN;

        this.peakStat += (peak - this.peakStat) * 0.04;
        this.avgStat  += (avg  - this.avgStat)  * 0.04;

        const peakEl = document.getElementById('peakValue');
        const avgEl  = document.getElementById('avgValue');
        if (peakEl) peakEl.textContent = `${(this.peakStat * 100).toFixed(1)}%`;
        if (avgEl)  avgEl.textContent  = `${(this.avgStat  * 100).toFixed(1)}%`;
    }

    // ----- Draw -----

    draw() {
        const { ctx, W, H } = this;
        if (!W || !H) return;

        // Layout split
        const WAVE_W   = Math.floor(W * 0.63);   // waveform panel width
        const GAP      = Math.floor(W * 0.04);   // divider gap
        const BAR_X    = WAVE_W + GAP;            // bars start x
        const BAR_W    = W - BAR_X;              // bars panel width

        // Background
        ctx.fillStyle = '#001400';
        ctx.fillRect(0, 0, W, H);

        this._drawGrid(W, H, WAVE_W);
        this._drawWaveform(WAVE_W, H);
        this._drawDivider(WAVE_W, GAP, H);
        this._drawBars(BAR_X, BAR_W, H);
    }

    _drawGrid(W, H, waveW) {
        const ctx = this.ctx;
        ctx.strokeStyle = '#002800';
        ctx.lineWidth   = 0.5;

        const cols = 8, rows = 4;
        for (let c = 0; c <= cols; c++) {
            const x = (c / cols) * waveW;
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
        }
        for (let r = 0; r <= rows; r++) {
            const y = (r / rows) * H;
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(waveW, y); ctx.stroke();
        }

        // Centre line (reference 0-crossing)
        ctx.strokeStyle = '#004400';
        ctx.lineWidth = 0.75;
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(waveW, H / 2); ctx.stroke();
        ctx.setLineDash([]);
    }

    _drawWaveform(waveW, H) {
        const ctx  = this.ctx;
        const mid  = H / 2;
        const amp  = H / 2 - 2;   // max pixel amplitude
        const step = waveW / (this.WAVEFORM_LEN - 1);

        // Under-fill (very faint)
        ctx.fillStyle = 'rgba(0, 255, 65, 0.05)';
        ctx.beginPath();
        for (let i = 0; i < this.WAVEFORM_LEN; i++) {
            const x = i * step;
            const y = mid - this.waveform[i] * amp;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.lineTo(waveW, H); ctx.lineTo(0, H); ctx.closePath();
        ctx.fill();

        // Waveform line
        ctx.strokeStyle = '#00ff41';
        ctx.lineWidth   = 1.5;
        ctx.lineJoin    = 'round';
        ctx.beginPath();
        for (let i = 0; i < this.WAVEFORM_LEN; i++) {
            const x = i * step;
            const y = mid - this.waveform[i] * amp;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
    }

    _drawDivider(waveW, gap, H) {
        const ctx = this.ctx;
        const x = waveW + gap / 2;
        ctx.strokeStyle = '#003300';
        ctx.lineWidth   = 1;
        ctx.beginPath(); ctx.moveTo(x, 4); ctx.lineTo(x, H - 4); ctx.stroke();
    }

    _drawBars(barX, barW, H) {
        const ctx  = this.ctx;
        const bw   = barW / this.BAR_COUNT;
        const pad  = 1;

        for (let i = 0; i < this.BAR_COUNT; i++) {
            const x      = barX + i * bw;
            const barH   = this.barValues[i] * H;
            const y      = H - barH;

            // Bar body
            ctx.fillStyle = '#00ff41';
            ctx.fillRect(x + pad, y, bw - pad * 2, barH);

            // Peak-hold marker (bright white notch)
            if (this.barHold[i] > 0 && this.barPeaks[i] > this.barValues[i] + 0.01) {
                const py = H - this.barPeaks[i] * H;
                ctx.fillStyle = '#ccffcc';
                ctx.fillRect(x + pad, py - 1, bw - pad * 2, 2);
            }
        }
    }

    // ----- Loop -----

    animate() {
        if (!this.isActive) return;
        this.frame++;
        this.updateWaveform();
        this.updateBars();
        this.updateStats();
        this.draw();
        this.animationId = requestAnimationFrame(() => this.animate());
    }
}

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('signalCanvas')) {
            window.signalStrength = new SignalStrength('signalCanvas');
            window.signalStrength.start();
            console.log('[Signal] Visualization initialized');
        }
    });
}
