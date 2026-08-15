# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-08-15

**Built by:** Claude Opus (auto-dial staging fix; original build by Gemini 3.6 Flash (high reasoning))

### Fixed
- **Preset Quick-Dial Instant-Jump Bug**: loading a synthetic-chromosome preset previously hybridized all 8 base glyphs in one synchronous forEach, jumping straight to `PENDING_READY` and bypassing the per-locus pipette click, fluorescence lock, chevron animation, and `SEQUENCING` telemetry progression that manual dialing uses.
- **Thermocycler Program Replay**: presets now anneal each base through the exact same `lockGlyph` hybridization lock as a manual dial, one locus every 260ms — in-universe, the thermocycler runs a validated primer library at machine speed: far faster than manual pipetting, but every base still requires its own hybridization cycle.
- Replay lands in the identical `PENDING_READY` state as manual dialing and **never starts synthesis on its own** (asserted at completion +1.2s).
- `FLUSH FLOWCELL / ABORT` remains fully functional **during** a replay: aborting mid-sequence cancels all pending cycle timers and resets cleanly (new automated test). Engaging the Thermal Overheat Hold mid-replay halts the remaining cycles with a single interlock alert.

### Changed
- Verification suite: staged-replay sampling with in-progress screenshots, mid-replay abort test; preset assertion re-timed for the ~2.1s replay.

## [1.0.1] - 2026-08-13

### Operator Evaluation & Status Note
- **Functional Status:** Confirmed functionally solid via live operator testing. Base-pair nucleotide dialing, chromosome loci PCR hybridization locking, quantum helix synthesis activation, thermal overheat safety hold, and flowcell flush disengage all perform as intended with no functional defects reported.
- **Batch Evaluation Note:** Operator review noted that across the six-build batch, the overall layout composition exhibits a shared underlying arrangement reskinned per build. While chevron counts (11 loci), address lengths (8 base-pairs), locking gestures, pipette/fluorescent audio synthesis, and thematic vocabulary are genuinely differentiated, the overall page layout/composition was less differentiated across the batch than claimed.
- **Batch Status:** Batch closed. No further iteration planned.

## [1.0.0] - 2026-08-12

**Built by:** Gemini 3.6 Flash (high reasoning)

### Added
- Complete Genomic / Biotech Sequencing Lab Console Stargate Interface (`stargate_genomic_sequencer`).
- Live Circular Genomic Sequencing Readout displaying rotating double-helix ladders, real-time fluorescent nucleotide sequencing chromatogram peaks, and electrophoresis bands.
- 11 Chromosome Loci Markers stationed radially around the perimeter (Loci LOC-01 through LOC-11 at ~32.7° intervals) with base-pair PCR hybridization locks.
- 8-base-pair genetic sequence address dialing protocol with explicit pending-ready state and non-auto-firing activation.
- PCR Thermal Overheat Safety Hold subsystem with audible laboratory diagnostic alerts and violet fluorescence interlock banner.
- Dedicated ALWAYS-REACHABLE Flowcell Flush / Sequence Abort Disengage control tested through multiple full dial-disengage-redial cycles.
- Dual-tiered quick-dial genomic sequence archive with 6 synthetic genome presets.
- Web Audio API laboratory diagnostic synthesizer generating pipetting clicks, violet fluorescence harmonics, and PCR thermal-cycle sine blips.
- Operator reference modal, corner branding, and dynamic responsive scaling from 1080p to 4K UHD.
