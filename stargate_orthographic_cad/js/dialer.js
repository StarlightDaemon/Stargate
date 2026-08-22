/**
 * Stargate Orthographic CAD Terminal - Dialer & Telemetric State Coordinator
 * Bureau: Aethelgard-Voss Structural Telemetrics & CAD Engineering Bureau
 * Spec: AV-CAD-STG-9042-REV-D
 * Coordinates manual coordinate input, sequential quick-dial preset runner,
 * 8-point caliper inscription, safety permit interlock, and 3-stage activation.
 */

import { GLYPH_DEFS, CALIPER_CONFIGS } from './ring.js';
import { QUICK_DIAL_PRESETS } from './presets.js';
import { cadAudio } from './audio.js';
import { PORTAL_STATES } from './portal.js';

export const DIALER_STATES = {
  IDLE: "IDLE",
  DIALING: "DIALING",
  READY: "READY",
  BUILDUP: "BUILDUP",
  BREAKTHROUGH: "BREAKTHROUGH",
  ACTIVE: "ACTIVE",
  DISENGAGING: "DISENGAGING"
};

export class CadDialerCoordinator {
  constructor(ringRenderer, portalEngine) {
    this.ring = ringRenderer;
    this.portal = portalEngine;
    this.state = DIALER_STATES.IDLE;

    // Address configuration: 7 glyphs to complete spatial coordinate lock
    this.addressLength = 7;
    this.currentAddress = []; // Array of glyph objects
    this.lockedCaliperIndices = [];

    // Safety Interlock (Structural Permit Review Hold) - MUST DEFAULT TO RELEASED
    this.isPermitApproved = true; // true = Released (Permit Granted), false = Engaged (Hold)

    // Auto-dial state
    this.isAutoDialing = false;
    this.autoDialTimer = null;
    this.activePresetId = null;

    // Callbacks for UI updates
    this.onStateChange = null;
    this.onAddressChange = null;
    this.onTelemetryUpdate = null;
  }

  setState(newState) {
    this.state = newState;
    if (this.onStateChange) this.onStateChange(this.state);
  }

  /**
   * Safety Interlock Toggle (Structural/Permit Review Hold)
   */
  toggleSafetyInterlock() {
    this.isPermitApproved = !this.isPermitApproved;
    cadAudio.playClick();
    if (this.onTelemetryUpdate) {
      this.onTelemetryUpdate({
        isPermitApproved: this.isPermitApproved,
        msg: this.isPermitApproved ? "STRUCTURAL PERMIT HOLD RELEASED [AUTHORIZED]" : "PERMIT SECTION 14-B HOLD ENGAGED"
      });
    }
    return this.isPermitApproved;
  }

  setSafetyInterlock(isApproved) {
    this.isPermitApproved = isApproved;
    if (this.onTelemetryUpdate) {
      this.onTelemetryUpdate({
        isPermitApproved: this.isPermitApproved,
        msg: this.isPermitApproved ? "STRUCTURAL PERMIT HOLD RELEASED [AUTHORIZED]" : "PERMIT SECTION 14-B HOLD ENGAGED"
      });
    }
  }

  /**
   * Manual Dialing - Inscribe a single glyph
   */
  inscribeGlyph(glyphId) {
    // If active or during buildup, ignore manual input
    if (this.state === DIALER_STATES.BUILDUP || 
        this.state === DIALER_STATES.BREAKTHROUGH || 
        this.state === DIALER_STATES.ACTIVE) {
      return false;
    }

    // If auto-dialing was in progress, stop it
    if (this.isAutoDialing) {
      this.cancelAutoDial();
    }

    // If already fully dialed (7 glyphs), prevent adding more until reset
    if (this.currentAddress.length >= this.addressLength) {
      return false;
    }

    const glyph = GLYPH_DEFS.find(g => g.id === glyphId);
    if (!glyph) return false;

    // Check if glyph already in current address (optional restriction, can allow duplicates or disallow)
    const addressIndex = this.currentAddress.length;
    const caliperIndex = addressIndex; // Caliper 0 through 6

    this.currentAddress.push(glyph);
    this.lockedCaliperIndices.push(caliperIndex);

    // Rotate rotor to align glyph
    this.ring.rotateRotorToGlyph(glyphId);

    // Lock Caliper and draft leader line
    this.ring.lockCaliper(caliperIndex, glyph, addressIndex);

    if (this.onAddressChange) this.onAddressChange(this.currentAddress);

    // Check if 7th glyph locked -> transition to READY state (NEVER AUTO-FIRE!)
    if (this.currentAddress.length === this.addressLength) {
      this.setState(DIALER_STATES.READY);
    } else {
      this.setState(DIALER_STATES.DIALING);
    }

    return true;
  }

  /**
   * Sequential Quick-Dial Preset Runner
   * Genuinely auto-dials through each symbol with visible pacing (600ms per lock),
   * using the exact same per-symbol locking animation and audio as manual dialing.
   */
  startQuickDialPreset(presetId) {
    // Disengage if previously active
    if (this.state === DIALER_STATES.ACTIVE || this.state === DIALER_STATES.BUILDUP) {
      this.disengage();
    } else {
      this.resetDial();
    }

    const preset = QUICK_DIAL_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    this.isAutoDialing = true;
    this.activePresetId = presetId;
    this.setState(DIALER_STATES.DIALING);

    let stepIndex = 0;
    const address = preset.address; // 7 glyph indices

    const step = () => {
      if (!this.isAutoDialing) return;

      if (stepIndex < address.length) {
        const glyphId = address[stepIndex];
        const glyph = GLYPH_DEFS.find(g => g.id === glyphId);

        if (glyph) {
          const addrIdx = this.currentAddress.length;
          const calIdx = addrIdx;
          this.currentAddress.push(glyph);
          this.lockedCaliperIndices.push(calIdx);

          this.ring.rotateRotorToGlyph(glyphId);
          this.ring.lockCaliper(calIdx, glyph, addrIdx);

          if (this.onAddressChange) this.onAddressChange(this.currentAddress);
        }

        stepIndex++;

        // If reached 7th lock point
        if (stepIndex === address.length) {
          this.isAutoDialing = false;
          // LAND IN READY STATE - NEVER AUTO-FIRE!
          this.setState(DIALER_STATES.READY);
        } else {
          // Schedule next glyph in sequence (600ms pacing)
          this.autoDialTimer = setTimeout(step, 600);
        }
      }
    };

    // Begin sequence
    this.autoDialTimer = setTimeout(step, 100);
  }

  cancelAutoDial() {
    this.isAutoDialing = false;
    if (this.autoDialTimer) {
      clearTimeout(this.autoDialTimer);
      this.autoDialTimer = null;
    }
  }

  /**
   * Primary Activation Control - EXECUTE VECTOR MANIFOLD / RENDER APERTURE
   * Requires:
   * 1. System in READY state (7 glyphs locked)
   * 2. Safety Interlock RELEASED (isPermitApproved === true)
   */
  executeActivation() {
    if (this.state !== DIALER_STATES.READY) {
      return { success: false, reason: "NOT_READY", message: "ADDRESS INCOMPLETE: 7 COORDINATES REQUIRED" };
    }

    // Safety Interlock check
    if (!this.isPermitApproved) {
      cadAudio.playInterlockWarning();
      return { 
        success: false, 
        reason: "SAFETY_HOLD", 
        message: "ACTIVATION BLOCKED: SECTION 14-B STRUCTURAL PERMIT HOLD ENGAGED" 
      };
    }

    // Begin 3-stage activation sequence
    this.setState(DIALER_STATES.BUILDUP);

    this.portal.startActivation(
      // Stage 1 (Buildup) Complete Callback
      () => {
        this.setState(DIALER_STATES.BREAKTHROUGH);
      },
      // Stage 2 (Breakthrough) Complete Callback
      () => {
        this.setState(DIALER_STATES.ACTIVE);
      },
      // Stage 3 (Sustained Active) Callback
      () => {
        if (this.onTelemetryUpdate) {
          this.onTelemetryUpdate({
            status: "MANIFOLD STABLE",
            flux: "99.8%",
            energy: "4.881 TeV",
            msg: "EVENT HORIZON ESTABLISHED // ORTHOGONAL LINK CERTIFIED"
          });
        }
      }
    );

    return { success: true, reason: "ACTIVATING", message: "INITIALIZING VECTOR MANIFOLD RENDER" };
  }

  /**
   * Universal Disengage & Purge Control
   * Always reachable and resets everything to clean idle state.
   */
  disengage() {
    this.cancelAutoDial();
    this.setState(DIALER_STATES.DISENGAGING);

    this.portal.disengage();
    this.ring.resetRing();

    this.currentAddress = [];
    this.lockedCaliperIndices = [];
    this.activePresetId = null;

    if (this.onAddressChange) this.onAddressChange(this.currentAddress);

    setTimeout(() => {
      this.setState(DIALER_STATES.IDLE);
      if (this.onTelemetryUpdate) {
        this.onTelemetryUpdate({
          status: "STANDBY / IDLE",
          flux: "0.0%",
          energy: "0.000 TeV",
          msg: "CAD TERMINAL RESET // VECTOR ROTOR HOMED"
        });
      }
    }, 450);
  }

  resetDial() {
    this.cancelAutoDial();
    this.ring.resetRing();
    this.currentAddress = [];
    this.lockedCaliperIndices = [];
    this.activePresetId = null;
    this.setState(DIALER_STATES.IDLE);
    if (this.onAddressChange) this.onAddressChange(this.currentAddress);
  }
}
