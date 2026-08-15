/**
 * CAÏSSA NEURAL RECURSION WORKSTATION - ENGINE STATE & MINIMAX MODEL
 * Institute for Deep Combinatorial Analysis (IDCA)
 */

const CANDIDATE_MOVES = [
  { id: "e4", symbol: "♟", notation: "1. e4", shortName: "e4", delta: "+0.45", desc: "King Pawn Advance", plyWeight: 1.4 },
  { id: "d4", symbol: "♟", notation: "d4", shortName: "d4", delta: "+0.42", desc: "Queen Pawn Stake", plyWeight: 1.3 },
  { id: "Nf3", symbol: "♞", notation: "Nf3", shortName: "Nf3", delta: "+0.38", desc: "Knight Outpost Flank", plyWeight: 1.5 },
  { id: "Bc4", symbol: "♝", notation: "Bc4", shortName: "Bc4", delta: "+0.75", desc: "Italian Spearhead", plyWeight: 1.8 },
  { id: "Bg5", symbol: "♝", notation: "Bg5", shortName: "Bg5", delta: "+0.92", desc: "Pinning Infiltration", plyWeight: 2.1 },
  { id: "Re1", symbol: "♜", notation: "Re1", shortName: "Re1", delta: "+1.25", desc: "Central File Control", plyWeight: 2.4 },
  { id: "Qh5", symbol: "♛", notation: "Qh5", shortName: "Qh5", delta: "+2.85", desc: "Focal Attack Vector", plyWeight: 3.2 },
  { id: "Kf1", symbol: "♚", notation: "Kf1", shortName: "Kf1", delta: "+0.15", desc: "Deep King Step", plyWeight: 1.1 },
  { id: "c5", symbol: "♟", notation: "c5", shortName: "c5", delta: "-0.18", desc: "Counter-Thrust Wing", plyWeight: 1.2 },
  { id: "Nc6", symbol: "♞", notation: "Nc6", shortName: "Nc6", delta: "+0.55", desc: "Reinforced Deflection", plyWeight: 1.6 },
  { id: "Rxd5", symbol: "♜", notation: "Rxd5", shortName: "Rxd5", delta: "+4.10", desc: "Center Exchange Sac", plyWeight: 4.5 },
  { id: "Qxf7", symbol: "♛", notation: "Qxf7#", shortName: "Qxf7#", delta: "+M0", desc: "Forced Mate Execution", plyWeight: 9.9 }
];

const PRESETS = [
  // TIER 1: Verified Grandmaster Canon (Forced Mate Lines)
  {
    id: "preset_immortal",
    tier: 1,
    tierName: "TIER 1: VERIFIED CANON",
    name: "Immortal Queen Deflection",
    eval: "+M7 (Forced Mate)",
    moves: ["e4", "d4", "Nf3", "Bc4", "Qh5", "Rxd5", "Qxf7"],
    desc: "Classical deflection sequence stripping king defense for decisive queen breakthrough."
  },
  {
    id: "preset_opera",
    tier: 1,
    tierName: "TIER 1: VERIFIED CANON",
    name: "Opera House Pin Collapse",
    eval: "+M6 (Decisive Pin)",
    moves: ["e4", "Nf3", "d4", "Bg5", "Re1", "Rxd5", "Qxf7"],
    desc: "Overloaded center coordination leading to an inescapable mating net."
  },
  {
    id: "preset_greek_gift",
    tier: 1,
    tierName: "TIER 1: VERIFIED CANON",
    name: "Greek Gift Bishop Sacrifice",
    eval: "+M5 (Wing Assault)",
    moves: ["e4", "Nf3", "Bc4", "d4", "Qh5", "c5", "Qxf7"],
    desc: "Devastating flank sacrifice blowing open the castle barrier."
  },
  // TIER 2: Speculative Neural Hypotheses (Deep Minimax Trajectories)
  {
    id: "preset_pawn_storm",
    tier: 2,
    tierName: "TIER 2: NEURAL HYPOTHESIS",
    name: "Hyper-Positional Pawn Storm",
    eval: "+3.84 Centipawns",
    moves: ["d4", "c5", "Nf3", "e4", "Bc4", "Re1", "Nc6"],
    desc: "Centaur-evaluated hyper-modern space bind strangling lateral maneuverability."
  },
  {
    id: "preset_asymmetric",
    tier: 2,
    tierName: "TIER 2: NEURAL HYPOTHESIS",
    name: "Centaur Asymmetric Breach",
    eval: "+4.12 Centipawns",
    moves: ["c5", "d4", "e4", "Nc6", "Bg5", "Rxd5", "Qh5"],
    desc: "Unorthodox diagonal imbalance sacrificing structure for dynamic initiative."
  },
  {
    id: "preset_king_walk",
    tier: 2,
    tierName: "TIER 2: NEURAL HYPOTHESIS",
    name: "Quantum King Clearance",
    eval: "+2.95 Centipawns",
    moves: ["Nf3", "e4", "Bc4", "Kf1", "d4", "Re1", "c5"],
    desc: "Deep engine king relocation neutralizing counterplay before wing assault."
  }
];

const MAX_PLIES = 7;

class CaissaEngineState {
  constructor() {
    this.status = "IDLE"; // IDLE, DIALING, LINE_PENDING_COMMIT, STAGE_BUILDUP, STAGE_BREAKTHROUGH, STAGE_SUSTAINED
    this.history = []; // array of move objects
    this.blunderCheckHold = false; // SAFETY INTERLOCK: MUST DEFAULT TO FALSE (RELEASED)
    this.currentEval = 0.0;
    this.currentDepth = 32;
    this.currentNodes = 48.2;
    this.listeners = [];
    this.activationTimer = null;
    this.activePresetId = null;
  }

  subscribe(listener) {
    this.listeners.push(listener);
  }

  notify() {
    this.listeners.forEach(fn => fn(this));
  }

  /**
   * Dial / select a move into the current ply
   */
  dialMove(moveId) {
    if (this.status === "STAGE_BUILDUP" || this.status === "STAGE_BREAKTHROUGH" || this.status === "STAGE_SUSTAINED") {
      return false; // locked during activation
    }

    if (this.history.length >= MAX_PLIES) {
      return false;
    }

    const moveDef = CANDIDATE_MOVES.find(m => m.id === moveId);
    if (!moveDef) return false;

    // Calculate incremental evaluation
    const plyIndex = this.history.length + 1;
    let evalDelta = parseFloat(moveDef.delta) || 1.2;
    if (moveDef.delta === "+M0") {
      this.currentEval = 99.9;
    } else {
      this.currentEval = Math.min(15.0, Math.round((this.currentEval + evalDelta) * 100) / 100);
    }

    this.currentDepth = 32 + plyIndex * 6;
    this.currentNodes = Math.round((48.2 + plyIndex * 7.5) * 10) / 10;

    this.history.push({
      ply: plyIndex,
      move: moveDef,
      evalAtPly: this.currentEval
    });

    if (this.history.length === MAX_PLIES) {
      // CRITICAL NEGATIVE AUTO-FIRE REQUIREMENT:
      // When final move is completed, system enters PENDING COMMIT state.
      // NEVER auto-activates!
      this.status = "LINE_PENDING_COMMIT";
    } else {
      this.status = "DIALING";
    }

    this.notify();
    return true;
  }

  /**
   * Load a pre-defined tactical preset
   */
  loadPreset(presetId) {
    if (this.status === "STAGE_BUILDUP" || this.status === "STAGE_BREAKTHROUGH" || this.status === "STAGE_SUSTAINED") {
      this.reset();
    }

    const preset = PRESETS.find(p => p.id === presetId);
    if (!preset) return false;

    this.activePresetId = presetId;
    this.history = [];
    this.currentEval = 0.0;

    preset.moves.forEach((moveId, idx) => {
      const moveDef = CANDIDATE_MOVES.find(m => m.id === moveId);
      if (moveDef) {
        let evalDelta = parseFloat(moveDef.delta) || 1.2;
        if (moveDef.delta === "+M0") {
          this.currentEval = 99.9;
        } else {
          this.currentEval = Math.min(15.0, Math.round((this.currentEval + evalDelta) * 100) / 100);
        }
        this.history.push({
          ply: idx + 1,
          move: moveDef,
          evalAtPly: this.currentEval
        });
      }
    });

    this.currentDepth = 68;
    this.currentNodes = 88.5;
    this.status = "LINE_PENDING_COMMIT"; // Loaded ready to commit, NOT auto-fired!
    this.notify();
    return true;
  }

  /**
   * Toggle the Blunder-Check Hold Safety Interlock
   */
  toggleSafetyInterlock() {
    this.blunderCheckHold = !this.blunderCheckHold;
    this.notify();
    return this.blunderCheckHold;
  }

  /**
   * Set safety interlock explicitly
   */
  setSafetyInterlock(state) {
    this.blunderCheckHold = Boolean(state);
    this.notify();
    return this.blunderCheckHold;
  }

  /**
   * Commit Line // Trigger Staged Activation Sequence
   */
  commitLine() {
    if (this.history.length < MAX_PLIES) {
      return { success: false, reason: "INCOMPLETE_LINE", message: `Line incomplete: ${this.history.length}/${MAX_PLIES} plies dialed.` };
    }

    // CHECK SAFETY INTERLOCK
    if (this.blunderCheckHold) {
      return {
        success: false,
        reason: "INTERLOCK_ENGAGED",
        message: "BLUNDER-CHECK HOLD ACTIVE: Retrograde verification blocked activation. Release interlock to proceed."
      };
    }

    // STAGE 1: BUILDUP (2.5s duration)
    this.status = "STAGE_BUILDUP";
    this.notify();

    if (window.CaissaAudio) {
      window.CaissaAudio.startBuildupWhine(2.5);
    }

    // Transition to STAGE 2: BREAKTHROUGH at 2.5s
    this.activationTimer = setTimeout(() => {
      this.status = "STAGE_BREAKTHROUGH";
      this.currentEval = 99.9;
      this.currentDepth = 128;
      this.currentNodes = 142.8;
      this.notify();

      if (window.CaissaAudio) {
        window.CaissaAudio.playBreakthroughCrescendo();
      }

      // Transition to STAGE 3: SUSTAINED ACTIVE at 3.5s
      this.activationTimer = setTimeout(() => {
        this.status = "STAGE_SUSTAINED";
        this.notify();

        if (window.CaissaAudio) {
          window.CaissaAudio.startSustainedDrone();
        }
      }, 1000); // 1.0s of breakthrough instant peak

    }, 2500); // 2.5s of intense buildup

    return { success: true, status: this.status };
  }

  /**
   * Resign Line // Immediate Abort & Reset
   */
  reset() {
    if (this.activationTimer) {
      clearTimeout(this.activationTimer);
      this.activationTimer = null;
    }

    if (window.CaissaAudio) {
      window.CaissaAudio.playResignSwoosh();
    }

    this.status = "IDLE";
    this.history = [];
    this.currentEval = 0.0;
    this.currentDepth = 32;
    this.currentNodes = 48.2;
    this.activePresetId = null;
    this.notify();
  }
}

window.CaissaState = new CaissaEngineState();
window.CANDIDATE_MOVES = CANDIDATE_MOVES;
window.PRESETS = PRESETS;
window.MAX_PLIES = MAX_PLIES;
