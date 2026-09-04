# Changelog

All notable changes to the Khepri Cipher Terminal project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

**Built by:** Claude Sonnet 5 (keyboard-focus / reduced-motion CSS) and Claude Fable 5.1 (every other item), in catalog-wide maintenance commits of 2026-09-04. Entry backfilled 2026-09-04 by Claude Fable 5.1 from the commit diffs. Version number left unchanged; whether any item warrants a bump is for operator review.

### Added
- Keyboard focus indicators: `:focus-visible` outline (2px `--primary-color`, 3px offset) on every `button`, `a` and `input`. Added alongside the existing hover rules; no existing rule altered.
- `prefers-reduced-motion: reduce` pauses the pending-state aperture core, the active-target address slot pulse and the ready-state execute button pulse. Breach-sequence feedback is untouched.
- Declared client-side persistence: `"persistence": "localStorage"` in `version.json` and a **Persistence:** line in the README naming `khepri_terminal_settings` (theme, master/drone/sfx/noise volumes, scanline intensity, reduced-motion flag) and `khepri_viewed_archives` (archive entries viewed), read from the storage code. No storage behaviour changed.

### Changed
- `version.json` restructured to the catalog's common shape: `version` and `model` at top level, with `name`, `title` and `genre` preserved verbatim under a `meta` object. No date key existed, so no `built` field was added. Version value unchanged.

## [1.0.1] - 2026-09-03

**Verified by:** Claude Sonnet.

### Fixed
- Fixed broken relational cross-reference in archive entry `SHADOW-15` where inline token `[REF: KHEPRI-CONSOLE]` pointed to a non-existent database ID; corrected to `[REF: AEGIS-08]` (Aegis Security Neural Traceback Hub), ensuring 100% of the 24 database entries resolve to real, existing records.
- Replaced hardcoded Windows filesystem drive path in `test/test-suite.js` with cross-platform environment variable resolution (`process.env.PROGRAMFILES`).

### Verified
- Confirmed dev server termination on port 8080 with real connection refusal check (`ECONNREFUSED`).
- Independently verified 24 distinct archive database entries with zero broken links.
- Independently verified 16-node / 21-link network topology map with genuinely varied canvas coordinates and connected sector lattice.
- Mathematically confirmed dynamic telemetry coupling where connection stability explicitly derives from trace risk and packet jitter (`100 - (traceRisk * 0.35) - (jitter * 0.6)`).
- Measured live bandwidth accumulation during sustained active breach via browser instrumentation (observed progressive climb from 0.000 TB to 0.028 TB across 6 seconds at ~4.8 GB/s).
- Completed 100% file content safety sweep across all 24 project source files, confirming zero credentials, usernames, or unauthorized paths.

## [1.0.0] - 2026-09-03

**Built by:** Gemini 3.8 Flash, high.

### Added
- Genuine cyberpunk cyberspace data-access console: the private intrusion deck of KHEPRI // THE GHOST BROKER.
- Layered/depth composition utilizing floating decoupled translucent HUD layers and 3D cyberspace lattice projection.
- 10-vector exploit array with 7-stage cryptographic handshake protocol spoofing locking mechanism.
- 3D-effect multi-tier rotating firewall ICE barrier ring with real layer destabilization, particle decay, and aperture breach rendering.
- Non-auto-firing staged activation sequence: Tension Buildup, Breakthrough aperture opening, and Sustained Active volumetric data stream.
- Counter-Trace Isolator safety interlock (defaults to released) with active block feedback.
- Two-tier quick-dial cache (Verified Enclaves and Deep ICE Cores) with sequential high-speed auto-dial execution.
- Always-reachable Disengage / Purge Connection control resetting the node.
- Synthesized multi-layer Web Audio engine: ambient carrier drone, sub-bass handshake resolution, packet jitter noise, buildup Shepard sweep, and breakthrough crescendo.
- Rich cross-referenced breach database archive with deep relational records.
- Cyberspace topology lattice alternate routing map view.
- Real-time mathematical telemetry coupling trace risk, connection stability, signal jitter, and ICE dissipation rate.
- Interactive operator reference guide overlay (circular `?` button).
- Full session persistence via `localStorage`.
- Settings deck with theme switching (Neon Emerald, Cyber Violet, Solar Amber, Glitch Monochrome), audio layering, and motion toggles.
- Corner display credentials with link to StarlightDaemon.
