/**
 * Gate Dialing Computer - Signal Strength Visualization
 * Real-time waveform and bar graph visualization
 */

class SignalStrength {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.warn('[Signal] Canvas not found');
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.dataPoints = [];
        this.bars = [];
        this.animationId = null;
        this.isActive = false;

        // Configuration
        this.config = {
            waveformColor: '#00ff33',
            barColor: '#00ff33',
            gridColor: '#003300',
            backgroundColor: 'rgba(0, 30, 0, 0.2)',
            maxDataPoints: 100,
            barCount: 20,
            baselineNoise: 0.75,
            peakRange: 0.2
        };

        // Initialize with baseline data
        this.generateBaselineData();
    }

    /**
     * Generate baseline "idle" signal data
     */
    generateBaselineData() {
        for (let i = 0; i < this.config.maxDataPoints; i++) {
            this.dataPoints.push(this.config.baselineNoise + (Math.random() * 0.1));
        }
        for (let i = 0; i < this.config.barCount; i++) {
            this.bars.push(this.config.baselineNoise + (Math.random() * 0.15));
        }
    }

    /**
     * Start the animation loop
     */
    start() {
        if (this.isActive) return;
        this.isActive = true;
        this.animate();
    }

    /**
     * Stop the animation loop
     */
    stop() {
        this.isActive = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    /**
     * Set signal mode (affects data generation)
     */
    setMode(mode) {
        if (mode === 'active') {
            this.config.baselineNoise = 0.85;
            this.config.peakRange = 0.15;
        } else if (mode === 'dialing') {
            this.config.baselineNoise = 0.80;
            this.config.peakRange = 0.18;
        } else {
            this.config.baselineNoise = 0.75;
            this.config.peakRange = 0.2;
        }
    }

    /**
     * Animation loop
     */
    animate() {
        if (!this.isActive) return;

        this.update();
        this.draw();

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    /**
     * Update data
     */
    update() {
        // Add new waveform data point
        const newValue = this.config.baselineNoise + (Math.random() * this.config.peakRange);
        this.dataPoints.push(newValue);
        if (this.dataPoints.length > this.config.maxDataPoints) {
            this.dataPoints.shift();
        }

        // Update bar graph (slower update rate)
        if (Math.random() > 0.7) {
            this.bars.shift();
            this.bars.push(this.config.baselineNoise + (Math.random() * this.config.peakRange));
        }

        // Calculate statistics
        this.updateStats();
    }

    /**
     * Update peak/avg statistics
     */
    updateStats() {
        const peak = Math.max(...this.dataPoints);
        const avg = this.dataPoints.reduce((a, b) => a + b, 0) / this.dataPoints.length;

        const peakEl = document.getElementById('peakValue');
        const avgEl = document.getElementById('avgValue');

        if (peakEl) peakEl.textContent = `${(peak * 100).toFixed(1)}%`;
        if (avgEl) avgEl.textContent = `${(avg * 100).toFixed(1)}%`;
    }

    /**
     * Draw visualization
     */
    draw() {
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Clear canvas
        this.ctx.fillStyle = this.config.backgroundColor;
        this.ctx.fillRect(0, 0, w, h);

        // Draw grid
        this.drawGrid(w, h);

        // Draw waveform
        this.drawWaveform(w, h);

        // Draw bars
        this.drawBars(w, h);
    }

    /**
     * Draw background grid
     */
    drawGrid(w, h) {
        this.ctx.strokeStyle = this.config.gridColor;
        this.ctx.lineWidth = 0.5;

        // Horizontal lines
        for (let y = 0; y <= h; y += h / 4) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(w * 0.7, y);
            this.ctx.stroke();
        }

        // Vertical lines
        for (let x = 0; x <= w * 0.7; x += w / 10) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, h);
            this.ctx.stroke();
        }
    }

    /**
     * Draw waveform line
     */
    drawWaveform(w, h) {
        const waveformWidth = w * 0.65;
        const step = waveformWidth / this.config.maxDataPoints;

        this.ctx.strokeStyle = this.config.waveformColor;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();

        for (let i = 0; i < this.dataPoints.length; i++) {
            const x = i * step;
            const y = h - (this.dataPoints[i] * h);

            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }

        this.ctx.stroke();
    }

    /**
     * Draw bar graph
     */
    drawBars(w, h) {
        const barAreaStart = w * 0.73;
        const barAreaWidth = w * 0.25;
        const barWidth = barAreaWidth / this.config.barCount;
        const padding = 1;

        this.ctx.fillStyle = this.config.barColor;

        for (let i = 0; i < this.bars.length; i++) {
            const x = barAreaStart + (i * barWidth);
            const barHeight = this.bars[i] * h;
            const y = h - barHeight;

            this.ctx.fillRect(x + padding, y, barWidth - (padding * 2), barHeight);
        }
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
