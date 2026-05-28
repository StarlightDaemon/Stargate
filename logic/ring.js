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
            maxVelocity: 120,        // degrees per second
            acceleration: 200,        // degrees per second²
            friction: 0.92,           // decay multiplier
            overshootAmplitude: 1.5,  // degrees
            overshootDecay: 6         // decay rate
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

        // Generate glyphs on the ring
        this.generateGlyphs();
    }

    generateGlyphs() {
        // Clear existing glyphs
        const existingGlyphs = this.innerRing.querySelectorAll('.glyph-symbol');
        existingGlyphs.forEach(g => g.remove());

        const radius = 175;
        const centerX = 250;
        const centerY = 250;

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

            // Play rotation sound
            if (typeof audioManager !== 'undefined') {
                audioManager.play('ringRotate', { volume: 0.3 });
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
            const oscillation = Math.cos(2 * Math.PI * 4 * this.overshootTime);

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
                if (Math.abs(distance) < 30) {
                    this.velocity *= this.config.friction;
                }

                this.currentAngle += this.velocity * dt;

                // Check for overshoot trigger
                const newDistance = this.targetAngle - this.currentAngle;
                if (Math.sign(newDistance) !== direction && Math.abs(this.velocity) > 5) {
                    this.isOvershooting = true;
                    this.overshootTime = 0;
                    this.config.overshootAmplitude = Math.abs(this.velocity) * 0.015;
                }
            } else {
                // Close enough, trigger overshoot
                this.isOvershooting = true;
                this.overshootTime = 0;
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
     * Stop immediately
     */
    stop() {
        this.isSpinning = false;
        this.isOvershooting = false;
        this.velocity = 0;

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
