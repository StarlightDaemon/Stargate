# Changelog

All notable changes to the **Caïssa Neural Recursion Workstation** (`stargate_caissa_workstation`) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.1] - 2026-09-04

**Built by:** Claude Sonnet 5 (keyboard-focus / reduced-motion CSS) and Claude Fable 5.1 (every other item), in catalog-wide maintenance commits of 2026-09-04. Entry backfilled 2026-09-04 by Claude Fable 5.1 from the commit diffs. Version number left unchanged; whether any item warrants a bump is for operator review.

### Added
- Keyboard focus indicators: `:focus-visible` outline in `--border-bright` with a cyan glow on `.icon-btn`, `.candidate-move-btn`, `.preset-btn`, `.action-btn`, `.close-modal-btn` and the bottom-bar link. Added alongside the existing hover rules; no existing rule altered.
- `prefers-reduced-motion: reduce` stops the status-pill indicator dot pulse, which runs regardless of engine/dial state. Buildup pulse, breakthrough flash, sustained aurora and ready strobe are untouched.

### Fixed
- The viewport meta tag no longer carries `maximum-scale=1.0` and `user-scalable=no`, so pinch zoom is no longer blocked. It now reads `width=device-width, initial-scale=1.0`.

## [1.1.0] - 2026-08-15

**Built by:** Claude Opus (auto-dial staging fix; original build by Gemini 3.7 Flash)

### Fixed
- **Preset Quick-Dial Instant-Jump Bug**: selecting a tactical preset previously pushed all 7 plies into the Principal Variation synchronously, jumping straight from idle to `PENDING COMMIT` and bypassing the per-ply alpha-beta lock animation and audio that manual dialing uses.
- **Transposition-Table Cache Replay**: presets now replay their line through the exact same per-ply lock path as manual dialing (`dialMove`), one ply every 280ms — in-universe, the engine replays a retrograde-verified canon line from its transposition table at full internal clock speed, but every ply still passes through individual alpha-beta confirmation with the full lock visual, clock-plunge/notation-tick/confirm-blip audio, and ring prune burst.
- Replay lands in the identical `LINE_PENDING_COMMIT` armed state as manual dialing and **never auto-commits** (negative auto-fire guarantee preserved and re-verified).
- `RESIGN LINE // ABORT` remains fully functional **during** the replay: aborting mid-sequence cancels all pending ply timers and returns cleanly to `IDLE` (new automated test).

### Changed
- Verification suite: added staged-replay test with in-progress screenshot sampling (Test 8) and mid-replay disengage test (Test 9); preset assertions re-timed for the ~2s replay; three-stage activation sampling moved to an absolute clock to remove screenshot-latency flakiness in Test 4.

## [1.0.0] - 2026-08-15

**Built by:** Gemini 3.7 Flash (High reasoning)

### Added
- **Search-Tree Ring Instrument**: Radial minimax tree canvas visualizer with 8 concentric search-depth plies, live sprouting candidate branches, dynamic alpha-beta pruning sweeps, and principal variation (PV) node anchoring.
- **Minimax Alpha-Beta Locking Mechanism**: 12 original tactical candidate glyphs locking into a 7-ply critical combination sequence with algebraic notation stamping and live centipawn evaluation bar spring physics.
- **Three-Stage Staged Activation**:
  - **Stage 1 (Buildup)**: 2.5-second accelerated search depth ramp (D:32 -> D:128+), 48M+ nodes/sec surge, oscillating evaluation bar, and rising harmonic audio sweep.
  - **Stage 2 (Breakthrough)**: Forced mate aperture singularity burst, checkmate crown shockwave lattice, and synchronized resonant acoustic strike.
  - **Stage 3 (Sustained Active)**: Connected hyper-space wormhole conduit with swirling streamline particles and live PV telemetry stream.
- **Negative Auto-Fire Safeguard**: Full 7-move completion transitions system strictly to `PENDING COMMIT` ready state without auto-activating.
- **Safety Interlock Subsystem**: `BLUNDER-CHECK HOLD` retrograde validation interlock, defaulting to RELEASED (unlocked), with explicit audio-visual warnings when engaged.
- **Disengage & Abort Control**: Always-accessible `RESIGN LINE // ABORT` button supporting clean resets and rapid redialing cycles.
- **Preloaded Tactical Presets**: 6 combinations across 2 distinct tiers (Tier 1: Verified Grandmaster Mate Canon, Tier 2: Speculative Neural Hypotheses).
- **Procedural Web Audio Engine**: 100% synthesized soundscape using the Web Audio API (tactile clock-press plunges, notation pencil ticks, FM confirm blips, pruning cutoff zaps, buildup sirens, and breakthrough checkmate bursts).
- **Operator Reference Guide**: Dismissible modal overlay (`?` button) detailing workstation architecture, minimax notation, and activation protocols.
- **Responsive 16:9 1080p -> 4K Scale Engine**: Unitless JavaScript-computed CSS transform scaling cleanly without scrolling or aspect distortion.
- **Corner Attribution & Branding**: Dedicated links for StarlightDaemon repository and version identifier.
