# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

**Built by:** Claude Sonnet 5 (keyboard-focus / reduced-motion CSS) and Claude Fable 5.1 (every other item), in catalog-wide maintenance commits of 2026-09-04. Entry backfilled 2026-09-04 by Claude Fable 5.1 from the commit diffs. Version number left unchanged; whether any item warrants a bump is for operator review.

### Added
- Keyboard focus indicators: `:focus-visible` outlines in `--amber-bright` on the HUD buttons, manual-modal close, tier tabs, modal tab buttons, glyph buttons, dispatch throttle, clear-staged button and footer link, and in `--aether-cyan` on the safety switch and emergency vent button. Added alongside the existing hover rules; no existing rule altered.

### Changed
- `version.json` restructured to the catalog's common shape: `version` and `model` at top level, with `name`, `description` and `private` preserved verbatim under a `meta` object. No date key existed, so no `built` field was added. Version value unchanged.
- Test harness `run_tests.js` now writes its four verification screenshots (idle 1080p, 4K, active conduit, manual modal) to the gitignored `test/` directory, created on demand, instead of the build root. Harness only; runtime unchanged.

## [1.1.0] - 2026-08-12

**Built by:** Gemini 3.6 Flash (high reasoning)

### Fixed
- **Gate Activation Diagnostic & Aperture Engine Resolution:**
  - *Diagnosed Root Causes:* 
    1. **Safety Interlock Gating:** When 7 glyphs were dialed, the Review/Safety Hold was engaged by default, causing clicks on the Throttle button to be blocked without prominent visual UI guidance, leading operators to perceive the button as unresponsive.
    2. **Portal Aperture Visual Contrast:** In previous render passes, the central aperture was rendered with a very dark background gradient (`rgba(10, 13, 19, 0.85)`) and faint 1px streamlines, appearing almost identical to the idle state from an observer's perspective.
    3. **Web Audio Autoplay Policy:** `AudioContext` could remain in `'suspended'` state if not explicitly resumed on early user interaction.
  - *Fixes Implemented:*
    1. Added high-luminance radiant cyan-white singularity core, glowing aether shockwave concentric rings, and dynamic galvanic arc lightning in the central canvas aperture.
    2. Added dynamic SVG lightning energy beams arcing directly from all locked Escapement nodes into the center aperture during the active state.
    3. Added interactive Safety Hold feedback: clicking the throttle while locked now shakes and flashes the Safety Hold button with crimson warning highlights and clear telegraph log prompts.
    4. Attached top-level global user-gesture audio resume listeners (`pointerdown`, `keydown`) so procedural sound synthesis is guaranteed to unlock immediately.
    5. Verified full manual dial -> Safety Hold release -> Throttle ignition -> Conduit active state -> Disengage cycle using real dispatched pointer events and confirmed visual portal rendering via screenshot.

### Operator Confirmation & Status Note
- **Operator Verification:** Direct operator testing confirmed that core functionality (manual dial, safety hold interlock, conduit ignition, and emergency vent disengage) operates as intended.
- **Session Status:** Note that while the core dialing and dispatch loop is functional, some minor unspecified technical rough edges remain unaddressed as this session concludes.

## [1.0.0] - 2026-08-12

**Built by:** Gemini 3.6 Flash (High)

### Added
- **Imperial Aetheric Telegraph & Pneumatic Dispatch Registry** interactive terminal.
- Multi-annular circular instrument display functioning as a vector schematic portal ring with dynamic pressure verniers, escapement ticks, galvanic wave indicators, and steam particle flux manifolds.
- 9 Meridian Escapement lock-nodes with radial needle deflection and steam-relief vector animations.
- 16 original vector schematic glyphs with technical drafting annotations and patent iconography.
- Web Audio API procedural sound synthesizer featuring dual-click telegraph keys, solenoid thuds, frequency-modulated governor spin-up sirens, valve steam hisses, and galvanic arc crackles.
- Two core control clusters: Meridian Dialing Array and Dispatch Throttle & Interlock Manifold.
- Boiler Safety Interlock / Dispatcher's Review Hold switch that blocks conduit ignition when engaged.
- 7 preloaded telegraph route ledger entries across 2 visual tiers (Imperial Mainlines and Experimental Bore Outposts).
- Operator's Reference & Patent Blueprint Guide modal (`?` top right) with full operational instructions and technical specs.
- Corner metadata displays (StarlightDaemon GitHub repo link and version readout).
- JavaScript responsive viewport scaling supporting 1080p and 4K viewports without scroll.
- Full Puppeteer automated verification suite testing two complete dial-disengage-redial cycles using real pointer events and hit-testing.
