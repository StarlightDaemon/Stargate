/**
 * Main Application Orchestrator & Viewport Scale Manager
 * Handles:
 * - Precise 1920x1080 viewport scaling (avoids calc unitless scale bug)
 * - Operator Reference Guide modal (Orihon accordion style)
 * - Global audio context unlock on first pointerdown
 * - Module initialization
 */

class UkiyoeApp {
    constructor() {
        this.baseWidth = 1920;
        this.baseHeight = 1080;
        this.currentScale = 1.0;
        this.appContainer = null;
        this.helpModal = null;
        this.helpBtn = null;
        this.closeHelpBtn = null;
    }

    init() {
        this.appContainer = document.getElementById('app-root');
        this.helpModal = document.getElementById('operator-guide-modal');
        this.helpBtn = document.getElementById('btn-help-guide');
        this.closeHelpBtn = document.getElementById('btn-close-modal');

        this.setupScaleManager();
        this.setupOperatorModal();
        this.setupAudioUnlock();
        this.initSubsystems();
    }

    /**
     * Scale Manager:
     * Calculates the scale factor as a plain unitless float and applies it via JS transform
     * or CSS custom property --app-scale.
     * Prevents CSS scale() unit errors.
     */
    setupScaleManager() {
        const updateScale = () => {
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const scaleX = vw / this.baseWidth;
            const scaleY = vh / this.baseHeight;
            // Fit inside viewport without scroll
            const scale = Math.min(scaleX, scaleY);
            this.currentScale = scale;

            document.documentElement.style.setProperty('--app-scale', scale.toFixed(5));

            if (this.appContainer) {
                this.appContainer.style.transform = `scale(${scale})`;
                // Center the fixed 1920x1080 container in viewport
                const leftOffset = Math.max(0, (vw - this.baseWidth * scale) / 2);
                const topOffset = Math.max(0, (vh - this.baseHeight * scale) / 2);
                this.appContainer.style.left = `${leftOffset}px`;
                this.appContainer.style.top = `${topOffset}px`;
            }
        };

        window.addEventListener('resize', updateScale);
        updateScale();
    }

    setupOperatorModal() {
        if (this.helpBtn && this.helpModal) {
            this.helpBtn.addEventListener('click', () => {
                this.helpModal.classList.add('visible');
                window.UkiyoeAudio.playPaperFriction(0.15, 0.3);
            });
        }

        if (this.closeHelpBtn && this.helpModal) {
            this.closeHelpBtn.addEventListener('click', () => {
                this.helpModal.classList.remove('visible');
                window.UkiyoeAudio.playPaperFriction(0.15, 0.3);
            });
        }

        // Close on backdrop click
        if (this.helpModal) {
            this.helpModal.addEventListener('click', (e) => {
                if (e.target === this.helpModal) {
                    this.helpModal.classList.remove('visible');
                    window.UkiyoeAudio.playPaperFriction(0.15, 0.3);
                }
            });
        }

        // Close on Escape key
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.helpModal && this.helpModal.classList.contains('visible')) {
                this.helpModal.classList.remove('visible');
                window.UkiyoeAudio.playPaperFriction(0.15, 0.3);
            }
        });
    }

    setupAudioUnlock() {
        const unlockAudio = () => {
            window.UkiyoeAudio.ensureContext();
            window.removeEventListener('pointerdown', unlockAudio);
            window.removeEventListener('keydown', unlockAudio);
        };
        window.addEventListener('pointerdown', unlockAudio);
        window.addEventListener('keydown', unlockAudio);
    }

    initSubsystems() {
        window.WoodblockEngine.init('woodblock-stage');
        window.CelestialDial.init('dial-container');
        window.PresetsManager.init('presets-ledger');
        window.PortalController.init();
    }
}

// Instantiate on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.App = new UkiyoeApp();
    window.App.init();
});
