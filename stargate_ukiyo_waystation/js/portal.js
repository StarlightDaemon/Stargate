/**
 * Portal Activation & Barrier Controller (開関統括司)
 * State machine managing:
 * - IDLE
 * - DIALING (1-6 stations locked)
 * - PENDING (7 stations locked, waiting for manual activation seal)
 * - STAGE_1_BUILDUP (1.8s ink surge & tension)
 * - STAGE_2_BREAKTHROUGH (Elemental wave / vortex breakthrough instant)
 * - STAGE_3_SUSTAINED (Active circulating woodblock portal)
 *
 * Safety Interlock: Sekisho Tegata Barrier (Defaults to RELEASED / Open)
 * Disengage: Always reachable, resets dial, canvas, and sound
 */

const PORTAL_STATES = {
    IDLE: 'IDLE',
    DIALING: 'DIALING',
    PENDING: 'PENDING',
    STAGE_1_BUILDUP: 'STAGE_1_BUILDUP',
    STAGE_2_BREAKTHROUGH: 'STAGE_2_BREAKTHROUGH',
    STAGE_3_SUSTAINED: 'STAGE_3_SUSTAINED'
};

class PortalController {
    constructor() {
        this.state = PORTAL_STATES.IDLE;
        this.lockedStations = [];
        this.maxStations = 7;
        this.isInterlockEngaged = false; // MUST DEFAULT TO FALSE (RELEASED)
        this.isActive = false;
        this.buildupTimeout = null;
        this.breakthroughTimeout = null;

        // UI Element handles
        this.statusTextElem = null;
        this.activateBtn = null;
        this.disengageBtn = null;
        this.interlockToggle = null;
        this.interlockStatusElem = null;
        this.interlockAlertBanner = null;
    }

    init() {
        this.statusTextElem = document.getElementById('barrier-status-text');
        this.activateBtn = document.getElementById('btn-activate');
        this.disengageBtn = document.getElementById('btn-disengage');
        this.interlockToggle = document.getElementById('toggle-interlock');
        this.interlockStatusElem = document.getElementById('interlock-status-label');
        this.interlockAlertBanner = document.getElementById('interlock-alert-banner');

        this.bindEvents();
        this.updateUI();
    }

    bindEvents() {
        // Activation Button
        if (this.activateBtn) {
            this.activateBtn.addEventListener('click', () => {
                this.attemptActivation();
            });
        }

        // Disengage Button (Always reachable)
        if (this.disengageBtn) {
            this.disengageBtn.addEventListener('click', () => {
                this.disengage();
            });
        }

        // Safety Interlock Toggle (Default is unchecked = RELEASED)
        if (this.interlockToggle) {
            this.interlockToggle.checked = false; // ensure released
            this.isInterlockEngaged = false;
            this.interlockToggle.addEventListener('change', (e) => {
                this.isInterlockEngaged = e.target.checked;
                this.updateInterlockDisplay();
                if (this.isInterlockEngaged) {
                    window.UkiyoeAudio.playInterlockBlocked();
                } else {
                    window.UkiyoeAudio.playDisengage();
                }
            });
        }

        // Connect Celestial Dial manual station lock callback
        if (window.CelestialDial) {
            window.CelestialDial.onStationLockedCallback = (station) => {
                this.handleManualStationLock(station);
            };
        }
    }

    handleManualStationLock(station) {
        if (this.state === PORTAL_STATES.STAGE_1_BUILDUP ||
            this.state === PORTAL_STATES.STAGE_2_BREAKTHROUGH ||
            this.state === PORTAL_STATES.STAGE_3_SUSTAINED) {
            return;
        }

        if (this.lockedStations.length >= this.maxStations) {
            return;
        }

        const lockIdx = this.lockedStations.length;
        window.WoodblockEngine.stampStation(station, lockIdx, () => {
            this.registerLockedStation(station);
        });
    }

    registerLockedStation(station) {
        if (this.lockedStations.length >= this.maxStations) return;
        this.lockedStations.push(station);
        if (this.lockedStations.length < this.maxStations) {
            this.state = PORTAL_STATES.DIALING;
        } else if (this.lockedStations.length === this.maxStations) {
            this.onSequenceComplete();
        }
        this.updateUI();
    }

    /**
     * Called when all 7 stations have locked.
     * Stays in PENDING/READY state. NEVER auto-fires.
     */
    onSequenceComplete() {
        this.state = PORTAL_STATES.PENDING;
        window.UkiyoeAudio.playTempleBell(false);
        this.updateUI();
    }

    attemptActivation() {
        if (this.state !== PORTAL_STATES.PENDING) {
            if (this.state === PORTAL_STATES.STAGE_3_SUSTAINED) {
                return;
            }
            if (this.lockedStations.length < this.maxStations) {
                // Not enough seals
                window.UkiyoeAudio.playInterlockBlocked();
                this.flashStatusWarning(`Seals Incomplete (${this.lockedStations.length}/${this.maxStations}) · 七印未充`);
                return;
            }
        }

        // Check Safety Interlock
        if (this.isInterlockEngaged) {
            window.UkiyoeAudio.playInterlockBlocked();
            this.showInterlockBlockedAlert();
            return;
        }

        // Proceed to Staged Activation
        this.triggerStagedActivation();
    }

    /**
     * 3-Stage Activation Flow
     * Stage 1: BUILDUP (1.8s) - Deep pigment gathering, tension surge
     * Stage 2: BREAKTHROUGH (0.8s) - Wave crests and breaks open, temple gong
     * Stage 3: SUSTAINED ACTIVE - Dynamic circulating portal vortex
     */
    triggerStagedActivation() {
        // Stage 1: Buildup
        this.state = PORTAL_STATES.STAGE_1_BUILDUP;
        this.isActive = true;
        this.updateUI();
        window.UkiyoeAudio.playActivationBuildup();

        const stageElem = document.getElementById('woodblock-stage');
        const overlay = document.getElementById('aperture-overlay');

        if (stageElem) stageElem.className = 'woodblock-stage-active state-buildup';
        if (overlay) overlay.className = 'aperture-overlay active stage-1';

        // Transition to Stage 2: Breakthrough after 1800ms
        this.buildupTimeout = setTimeout(() => {
            this.state = PORTAL_STATES.STAGE_2_BREAKTHROUGH;
            this.updateUI();
            window.UkiyoeAudio.playActivationBreakthrough();

            if (stageElem) stageElem.className = 'woodblock-stage-active state-breakthrough';
            if (overlay) overlay.className = 'aperture-overlay active stage-2';

            // Transition to Stage 3: Sustained Active after 800ms
            this.breakthroughTimeout = setTimeout(() => {
                this.state = PORTAL_STATES.STAGE_3_SUSTAINED;
                this.updateUI();

                if (stageElem) stageElem.className = 'woodblock-stage-active state-sustained';
                if (overlay) overlay.className = 'aperture-overlay active stage-3';
            }, 800);
        }, 1800);
    }

    /**
     * Disengage Control - Resets to idle
     */
    disengage() {
        if (this.buildupTimeout) clearTimeout(this.buildupTimeout);
        if (this.breakthroughTimeout) clearTimeout(this.breakthroughTimeout);

        if (window.PresetsManager) {
            window.PresetsManager.cancelAutoDial();
        }

        window.UkiyoeAudio.playDisengage();
        this.resetToIdle(true);
    }

    resetToIdle(animate = true) {
        this.state = PORTAL_STATES.IDLE;
        this.lockedStations = [];
        this.isActive = false;

        const stageElem = document.getElementById('woodblock-stage');
        const overlay = document.getElementById('aperture-overlay');
        if (stageElem) stageElem.className = 'woodblock-stage-active state-idle';
        if (overlay) overlay.className = 'aperture-overlay';

        window.WoodblockEngine.resetStage();
        window.CelestialDial.resetDial();
        this.updateUI();
    }

    updateUI() {
        if (!this.statusTextElem) return;

        switch (this.state) {
            case PORTAL_STATES.IDLE:
                this.statusTextElem.innerHTML = `<span class="state-badge idle">待機中 (Idle)</span> · 雲路開放 · Select Seals (0/${this.maxStations})`;
                if (this.activateBtn) this.activateBtn.className = 'control-seal-btn btn-activate idle';
                break;
            case PORTAL_STATES.DIALING:
                this.statusTextElem.innerHTML = `<span class="state-badge dialing">摺版刻印中 (Dialing)</span> · Registering Seals (${this.lockedStations.length}/${this.maxStations})`;
                if (this.activateBtn) this.activateBtn.className = 'control-seal-btn btn-activate dialing';
                break;
            case PORTAL_STATES.PENDING:
                this.statusTextElem.innerHTML = `<span class="state-badge pending">通関準備完了 (Pending Ready)</span> · 7 Seals Registered · Awaiting Activation Seal`;
                if (this.activateBtn) this.activateBtn.className = 'control-seal-btn btn-activate ready';
                break;
            case PORTAL_STATES.STAGE_1_BUILDUP:
                this.statusTextElem.innerHTML = `<span class="state-badge buildup">墨気集約中 (Stage 1: Buildup)</span> · Gathering Ink & Current...`;
                if (this.activateBtn) this.activateBtn.className = 'control-seal-btn btn-activate active';
                break;
            case PORTAL_STATES.STAGE_2_BREAKTHROUGH:
                this.statusTextElem.innerHTML = `<span class="state-badge breakthrough">怒涛開関 (Stage 2: Breakthrough)</span> · Cresting Wave Aperture Opened!`;
                if (this.activateBtn) this.activateBtn.className = 'control-seal-btn btn-activate active';
                break;
            case PORTAL_STATES.STAGE_3_SUSTAINED:
                const dest = this.lockedStations[this.lockedStations.length - 1];
                const destName = dest ? `${dest.kanji} (${dest.name})` : 'Celestial Waystation';
                this.statusTextElem.innerHTML = `<span class="state-badge sustained">通関中 (Stage 3: Sustained Active)</span> · Destination: ${destName}`;
                if (this.activateBtn) this.activateBtn.className = 'control-seal-btn btn-activate active';
                break;
        }

        this.updateInterlockDisplay();
    }

    updateInterlockDisplay() {
        if (!this.interlockStatusElem) return;
        if (this.isInterlockEngaged) {
            this.interlockStatusElem.textContent = '関所封鎖 (Pass Blocked / Closed)';
            this.interlockStatusElem.className = 'interlock-label engaged';
        } else {
            this.interlockStatusElem.textContent = '通行許可 (Pass Open / Released)';
            this.interlockStatusElem.className = 'interlock-label released';
        }
    }

    showInterlockBlockedAlert() {
        if (!this.interlockAlertBanner) return;
        this.interlockAlertBanner.textContent = '【関所封鎖中】 Imperial Barrier Interlock Engaged! Release barrier latch before transit.';
        this.interlockAlertBanner.classList.add('visible');
        setTimeout(() => {
            if (this.interlockAlertBanner) {
                this.interlockAlertBanner.classList.remove('visible');
            }
        }, 3000);
    }

    flashStatusWarning(msg) {
        if (!this.interlockAlertBanner) return;
        this.interlockAlertBanner.textContent = msg;
        this.interlockAlertBanner.classList.add('visible');
        setTimeout(() => {
            if (this.interlockAlertBanner) {
                this.interlockAlertBanner.classList.remove('visible');
            }
        }, 2500);
    }
}

// Global instance
window.PortalController = new PortalController();
