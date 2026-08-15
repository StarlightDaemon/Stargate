# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-08-15

**Built by:** Claude Opus (auto-dial staging fix; original build by Gemini 3.6 Flash (high reasoning))

### Fixed
- **Preset Quick-Dial Instant-Jump Bug**: loading a grid preset previously coupled all 8 route-vector glyphs in one synchronous forEach, jumping straight to `PENDING_READY` and bypassing the per-substation grid pulse, phase-lock chime, chevron animation, and `ROUTING` telemetry progression that manual coupling uses.
- **Stored Dispatch-Schedule Replay**: presets now couple each substation through the exact same `lockGlyph` phase-lock as manual dialing, one substation every 260ms — in-universe, the grid controller runs a pre-balanced dispatch schedule at relay cadence: far faster than manual switching, but every substation still requires its own phase lock.
- Replay lands in the identical `PENDING_READY` state as manual coupling and **never dispatches power on its own** (asserted at completion +1.2s).
- `GRID SCRAM / DISENGAGE` remains fully functional **during** a replay: scramming mid-sequence cancels all pending relay timers and resets cleanly (new automated test). Engaging the Bus Overload Hold mid-replay halts the remaining relays with a single interlock alert.

### Changed
- Verification suite: staged-replay sampling with in-progress screenshots, mid-replay SCRAM test; preset assertion re-timed for the ~2.1s replay.

## [1.0.1] - 2026-08-13

### Operator Evaluation & Status Note
- **Functional Status:** Confirmed functionally solid via live operator testing. Eco-grid route vector dialing, substation phase-locked coupling, biosphere conduit activation, superconducting bus safety hold, and grid scram disengage all perform as intended with no functional defects reported.
- **Batch Evaluation Note:** Operator review noted that across the six-build batch, the overall layout composition exhibits a shared underlying arrangement reskinned per build. While chevron counts (10 substations), address lengths (8 route vectors), locking gestures, 60Hz harmonic audio synthesis, and thematic vocabulary are genuinely differentiated, the overall page layout/composition was less differentiated across the batch than claimed.
- **Batch Status:** Batch closed. No further iteration planned.

## [1.0.0] - 2026-08-12

**Built by:** Gemini 3.6 Flash (high reasoning)

### Added
- Complete Solarpunk Smart Eco-Grid Dispatch Terminal Stargate Interface (`stargate_solarpunk_ecogrid`).
- Live Biosphere Microgrid Power Flow-Network visualization with particle energy streamlines, bus voltage sinusoids, and central Fusion-Solar Synchroscope core.
- 10 Microgrid Substations stationed radially around the perimeter (Substations α through κ at 36° intervals) with phase-locked power surge coupling.
- 8-vector renewable resource route address dialing protocol with explicit pending-ready state and non-auto-firing activation.
- Superconducting Bus Overload Safety Hold subsystem with audible electric harmonic alerts and emerald grid warning banner.
- Dedicated ALWAYS-REACHABLE Emergency Grid Scram / Bus Purge Disengage control tested through multiple full dial-disengage-redial cycles.
- Dual-tiered quick-dispatch biosphere archive with 6 renewable mega-habitat presets.
- Web Audio API pure electric harmonic synthesizer generating 60Hz grid hums, phase-lock sine pulses, and clean energy surge chords.
- Operator reference modal, corner branding, and dynamic responsive scaling from 1080p to 4K UHD.
