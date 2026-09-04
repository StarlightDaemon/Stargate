// dialer.js — Dialing state machine, 3-stage activation, auto-dial sequencer, and disengage hygiene
// Strictly adheres to STARGATE_BUILD_STANDARDS.md Section 6 & Section 8.

import { sound } from "./audio.js";

export const GATE_STATES = {
  IDLE: "idle",
  DIALING: "dialing",
  PENDING: "pending",
  BUILDUP: "buildup",
  BREAKTHROUGH: "breakthrough",
  ACTIVE: "active"
};

export class HearthDialer {
  constructor(renderer, runes, onStateChange) {
    this.renderer = renderer;
    this.runes = runes;
    this.onStateChange = onStateChange;

    this.state = GATE_STATES.IDLE;
    this.dialedRunes = []; // Array of rune objects (up to 7)
    this.isInterlocked = false; // Safety interlock defaults to RELEASED
    this.activeDestination = null;

    // Timer hygiene: track all scheduled handles
    this.scheduledTimers = new Set();
    this.autoDialCancelRequested = false;
    this.operationGeneration = 0; // Generation token to invalidate stale callbacks
  }

  // Schedule a timer with generation check and cancellation tracking
  scheduleTimer(callback, ms) {
    const currentGen = this.operationGeneration;
    const handle = setTimeout(() => {
      this.scheduledTimers.delete(handle);
      // Double check: generation must match and state must not be idle
      if (this.operationGeneration === currentGen && this.state !== GATE_STATES.IDLE) {
        callback();
      }
    }, ms);
    this.scheduledTimers.add(handle);
    return handle;
  }

  clearAllTimers() {
    this.operationGeneration++;
    this.scheduledTimers.forEach(handle => clearTimeout(handle));
    this.scheduledTimers.clear();
    this.autoDialCancelRequested = true;
  }

  setState(newState, detail = {}) {
    this.state = newState;
    if (this.onStateChange) {
      this.onStateChange(this.state, {
        dialedRunes: [...this.dialedRunes],
        isInterlocked: this.isInterlocked,
        destination: this.activeDestination,
        ...detail
      });
    }
  }

  // Dial a single rune manually
  dialRune(rune) {
    if (this.state !== GATE_STATES.IDLE && this.state !== GATE_STATES.DIALING) {
      return false;
    }
    if (this.dialedRunes.length >= 7) {
      return false;
    }
    // Prevent duplicate consecutive or in-sequence rune
    if (this.dialedRunes.some(r => r.id === rune.id)) {
      return false;
    }

    const pinIndex = this.dialedRunes.length;
    this.dialedRunes.push(rune);

    // Calculate angle to rotate to this rune
    const totalRunes = this.runes.length;
    const runeIndex = this.runes.findIndex(r => r.id === rune.id);
    const targetAngle = -runeIndex * (360 / totalRunes);

    this.renderer.rotateToAngle(targetAngle);
    sound.playSpindleClick(1 + pinIndex * 0.08);

    sound.playThreadDraw();
    this.renderer.lockPin(pinIndex, rune.id);
    sound.playPinSeat(pinIndex);

    if (this.dialedRunes.length === 7) {
      // Reached 7 symbols: NEVER AUTO-FIRE. Must enter PENDING state!
      this.setState(GATE_STATES.PENDING);
    } else {
      this.setState(GATE_STATES.DIALING);
    }

    return true;
  }

  // In-universe Auto-dial ("Thread the Hearth Knots")
  autoDialAddress(destination, onSymbolStep) {
    // If not idle, disengage first
    if (this.state !== GATE_STATES.IDLE) {
      this.disengage();
    }

    this.activeDestination = destination;
    this.autoDialCancelRequested = false;
    const currentGen = this.operationGeneration;
    const address = destination.address; // 7 rune IDs

    let stepIndex = 0;
    this.setState(GATE_STATES.DIALING);

    const stepNext = () => {
      if (this.autoDialCancelRequested || this.operationGeneration !== currentGen) {
        return;
      }
      if (stepIndex >= address.length) {
        // Completed 7 symbols: MUST REMAIN PENDING, NEVER AUTO-FIRE
        if (this.state === GATE_STATES.DIALING) {
          this.setState(GATE_STATES.PENDING);
        }
        return;
      }

      const runeId = address[stepIndex];
      const rune = this.runes.find(r => r.id === runeId);
      if (!rune) return;

      const pinIndex = stepIndex;
      this.dialedRunes.push(rune);

      const runeIdx = this.runes.findIndex(r => r.id === runeId);
      const targetAngle = -runeIdx * (360 / this.runes.length);

      this.renderer.rotateToAngle(targetAngle);
      sound.playSpindleClick(1 + pinIndex * 0.08);
      sound.playThreadDraw();
      this.renderer.lockPin(pinIndex, rune.id, true);
      sound.playPinSeat(pinIndex);

      // Update UI state on each symbol step so ribbon slots, telemetry, and announcements reflect progress
      this.setState(GATE_STATES.DIALING);

      if (onSymbolStep) {
        onSymbolStep(pinIndex, rune);
      }

      stepIndex++;

      if (stepIndex === 7) {
        // Last symbol locked: halt in pending state!
        this.setState(GATE_STATES.PENDING);
      } else {
        this.scheduleTimer(stepNext, 460);
      }
    };

    stepNext();
  }

  // Strike Rushlight (Trigger 3-stage activation sequence)
  strikeRushlight() {
    if (this.state !== GATE_STATES.PENDING) {
      return { success: false, reason: "NOT_PENDING" };
    }

    if (this.isInterlocked) {
      sound.playInterlock(true);
      return { success: false, reason: "INTERLOCKED" };
    }

    // Begin genuine 3-stage activation event
    const currentGen = this.operationGeneration;

    // STAGE 1: BUILDUP (1.8s)
    this.setState(GATE_STATES.BUILDUP);
    this.renderer.setBuildup();
    sound.playFlintStrike();
    sound.startBuildup(1.8);

    // STAGE 2: BREAKTHROUGH (~1.8s)
    this.scheduleTimer(() => {
      if (this.operationGeneration !== currentGen || this.state !== GATE_STATES.BUILDUP) return;

      this.setState(GATE_STATES.BREAKTHROUGH);
      this.renderer.setBreakthrough();
      sound.playBreakthrough();

      // STAGE 3: SUSTAINED ACTIVE (~0.65s after breakthrough for dramatic crescendo)
      this.scheduleTimer(() => {
        if (this.operationGeneration !== currentGen || this.state !== GATE_STATES.BREAKTHROUGH) return;

        this.setState(GATE_STATES.ACTIVE);
        this.renderer.setSustainedActive();
        sound.startSustainedActive();
      }, 650);

    }, 1800);

    return { success: true };
  }

  // Safety interlock toggle (Defaults to RELEASED)
  toggleInterlock() {
    this.isInterlocked = !this.isInterlocked;
    sound.playInterlock(this.isInterlocked);
    this.setState(this.state, { isInterlocked: this.isInterlocked });
    return this.isInterlocked;
  }

  // Disengage ("Sweep the Hearth Salt") — ALWAYS reachable, cancels all
  disengage() {
    // Invalidate and cancel all scheduled timers immediately
    this.clearAllTimers();

    // Kill all sounds
    sound.stopAll();
    sound.playDisengage();

    // Reset visual gate renderer
    this.renderer.resetToIdle();

    // Reset state variables
    this.dialedRunes = [];
    this.activeDestination = null;

    // Return to IDLE
    this.setState(GATE_STATES.IDLE);
    return true;
  }
}
