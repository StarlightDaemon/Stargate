/**
 * Gate Dialing Computer - Ring Controller
 * SVG Ring animation with physics simulation
 */

class RingController {
    constructor(svgElement, innerRingGroup) {
        this.svg = svgElement;
        this.innerRing = innerRingGroup;

        // Configuration
        this.config = {
            totalGlyphs: 39,
            degreesPerGlyph: 360 / 39,
            maxVelocity: 180,        // degrees per second
            acceleration: 350,        // degrees per second²
            friction: 0.88,           // decay multiplier
            overshootAmplitude: 0.8,  // degrees
            overshootDecay: 10        // decay rate
        };

        // State
        this.currentAngle = 0;
        this.targetAngle = 0;
        this.velocity = 0;
        this.isSpinning = false;
        this.isOvershooting = false;
        this.overshootTime = 0;
        this.onArrival = null;

        // Animation
        this.animationId = null;
        this.lastTime = 0;

        // Looping rotation audio handle
        this._rotateAudioHandle = null;

        // Generate glyphs on the ring
        this.generateGlyphs();
    }

    generateGlyphs() {
        // Clear existing glyphs and slot dividers
        this.innerRing.querySelectorAll('.glyph-symbol, .glyph-slot-divider').forEach(el => el.remove());

        const radius = 175;
        const centerX = 250;
        const centerY = 250;

        // Glyph slot divider lines — one radial line at each slot boundary.
        // Spans from inner track edge (r=160) to outer track edge (r=190).
        // Each divider is placed at the LEADING edge of slot i (halfway between i-1 and i).
        const r1 = 160, r2 = 190;
        for (let i = 0; i < this.config.totalGlyphs; i++) {
            const angleDeg = (i * this.config.degreesPerGlyph) - (this.config.degreesPerGlyph / 2) - 90;
            const angleRad = angleDeg * Math.PI / 180;
            const x1 = centerX + r1 * Math.cos(angleRad);
            const y1 = centerY + r1 * Math.sin(angleRad);
            const x2 = centerX + r2 * Math.cos(angleRad);
            const y2 = centerY + r2 * Math.sin(angleRad);
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x1.toFixed(2));
            line.setAttribute('y1', y1.toFixed(2));
            line.setAttribute('x2', x2.toFixed(2));
            line.setAttribute('y2', y2.toFixed(2));
            line.setAttribute('class', 'glyph-slot-divider');
            this.innerRing.appendChild(line);
        }

        for (let i = 0; i < this.config.totalGlyphs; i++) {
            const angle = (i * this.config.degreesPerGlyph) * (Math.PI / 180);
            const x = centerX + Math.sin(angle) * radius;
            const y = centerY - Math.cos(angle) * radius;

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('class', 'glyph-symbol');
            text.setAttribute('x', x);
            text.setAttribute('y', y);
            text.setAttribute('data-id', i);
            text.setAttribute('transform', `rotate(${i * this.config.degreesPerGlyph}, ${x}, ${y})`);
            text.textContent = GLYPH_SYMBOLS[i] || String.fromCharCode(65 + (i % 26));

            // Click handler
            text.addEventListener('click', () => {
                if (window.sdcEngine) {
                    window.sdcEngine.handleGlyphClick(i);
                }
            });

            this.innerRing.appendChild(text);
        }
    }

    /**
     * Rotate to a specific glyph index
     */
    rotateToGlyph(glyphIndex, clockwise = null) {
        return new Promise(resolve => {
            const targetGlyphAngle = -(glyphIndex * this.config.degreesPerGlyph);

            // Determine rotation direction
            if (clockwise === null) {
                // Alternate based on current position for variety
                const diff = targetGlyphAngle - this.currentAngle;
                const normalizedDiff = ((diff % 360) + 540) % 360 - 180;

                // Add extra rotation for visual effect
                if (Math.abs(normalizedDiff) < 60) {
                    this.targetAngle = this.currentAngle + (normalizedDiff > 0 ? 360 : -360) + normalizedDiff;
                } else {
                    this.targetAngle = this.currentAngle + normalizedDiff;
                }
            } else {
                const rotation = clockwise ? -360 : 360;
                this.targetAngle = targetGlyphAngle + rotation;
            }

            this.isSpinning = true;
            this.isOvershooting = false;
            this.onArrival = resolve;

            // Start animation if not running
            if (!this.animationId) {
                this.lastTime = performance.now();
                this.animate();
            }

            // Play rotation sound — looped for the lifetime of the spin
            if (typeof audioManager !== 'undefined') {
                this.stopRotateAudio();
                this._rotateAudioHandle = audioManager.playLooping('ringRotate', { volume: 0.3 });
            }
        });
    }

    /**
     * Main animation loop
     */
    animate(currentTime = performance.now()) {
        const dt = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        if (this.isSpinning || this.isOvershooting) {
            this.updatePhysics(dt);

            // Apply rotation to SVG
            this.innerRing.style.transform = `rotate(${this.currentAngle}deg)`;

            this.animationId = requestAnimationFrame(t => this.animate(t));
        } else {
            this.animationId = null;
        }
    }

    /**
     * Physics update
     */
    updatePhysics(dt) {
        const distance = this.targetAngle - this.currentAngle;
        const direction = Math.sign(distance);

        if (this.isOvershooting) {
            // Damped harmonic oscillator
            this.overshootTime += dt;
            const decay = Math.exp(-this.config.overshootDecay * this.overshootTime);
            const oscillation = Math.cos(2 * Math.PI * 2.5 * this.overshootTime);

            this.currentAngle = this.targetAngle +
                (this.config.overshootAmplitude * decay * oscillation);

            if (decay < 0.01) {
                this.currentAngle = this.targetAngle;
                this.arrive();
            }
        } else {
            if (Math.abs(distance) > 0.5) {
                // Accelerate toward target
                this.velocity += direction * this.config.acceleration * dt;

                // Clamp velocity
                this.velocity = Math.max(
                    -this.config.maxVelocity,
                    Math.min(this.config.maxVelocity, this.velocity)
                );

                // Apply friction when approaching
                if (Math.abs(distance) < 60) {
                    this.velocity *= this.config.friction;
                }

                this.currentAngle += this.velocity * dt;

                // Check for overshoot trigger
                const newDistance = this.targetAngle - this.currentAngle;
                if (Math.sign(newDistance) !== direction && Math.abs(this.velocity) > 5) {
                    this.isOvershooting = true;
                    this.overshootTime = 0;
                    this.config.overshootAmplitude = Math.abs(this.velocity) * 0.015;
                    this.stopRotateAudio();
                }
            } else {
                // Close enough, trigger overshoot
                this.isOvershooting = true;
                this.overshootTime = 0;
                this.stopRotateAudio();
            }
        }
    }

    /**
     * Called when ring arrives at target
     */
    arrive() {
        this.isSpinning = false;
        this.isOvershooting = false;
        this.velocity = 0;

        // Normalize angle
        this.currentAngle = this.targetAngle % 360;

        if (this.onArrival) {
            const callback = this.onArrival;
            this.onArrival = null;
            callback();
        }
    }

    /**
     * Stop the looping rotation audio if playing
     */
    stopRotateAudio() {
        if (this._rotateAudioHandle && typeof audioManager !== 'undefined') {
            audioManager.stopLooping(this._rotateAudioHandle);
            this._rotateAudioHandle = null;
        }
    }

    /**
     * Stop immediately
     */
    stop() {
        this.isSpinning = false;
        this.isOvershooting = false;
        this.velocity = 0;
        this.stopRotateAudio();

        if (this.onArrival) {
            this.onArrival();
            this.onArrival = null;
        }
    }

    /**
     * Reset to starting position
     */
    reset() {
        this.currentAngle = 0;
        this.targetAngle = 0;
        this.velocity = 0;
        this.isSpinning = false;
        this.isOvershooting = false;
        this.innerRing.style.transform = 'rotate(0deg)';

        // Clear glyph highlights
        this.innerRing.querySelectorAll('.glyph-symbol').forEach(g => {
            g.classList.remove('active', 'target');
        });
    }

    /**
     * Highlight a specific glyph
     */
    highlightGlyph(glyphId, state = 'active') {
        const glyph = this.innerRing.querySelector(`[data-id="${glyphId}"]`);
        if (glyph) {
            glyph.classList.add(state);
        }
    }

    /**
     * Clear all highlights
     */
    clearHighlights() {
        this.innerRing.querySelectorAll('.glyph-symbol').forEach(g => {
            g.classList.remove('active', 'target');
        });
    }

    /**
     * Get current glyph at top position
     */
    getCurrentGlyphIndex() {
        const normalizedAngle = ((this.currentAngle % 360) + 360) % 360;
        return Math.round(normalizedAngle / this.config.degreesPerGlyph) % this.config.totalGlyphs;
    }
}
