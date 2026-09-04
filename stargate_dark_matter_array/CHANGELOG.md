# Changelog

All notable changes to the BOREAS-IX Subterranean Cryogenic Dark Matter Array project will be documented in this file.

## [Unreleased]

**Built by:** Claude Sonnet 5 (keyboard-focus / reduced-motion CSS) and Claude Fable 5.1 (every other item), in catalog-wide maintenance commits of 2026-09-04. Entry backfilled 2026-09-04 by Claude Fable 5.1 from the commit diffs. Version number left unchanged; whether any item warrants a bump is for operator review.

### Added
- Keyboard focus indicators: `:focus-visible` outline (2px `--accent-cyan`, 3px offset) on every `button`, `a`, `input` and `select`, and on the visible `.switch-slider` of the 0x0 blind-lock checkbox (`#toggle-blind-lock`). Added alongside the existing rules; no existing rule altered.
- `prefers-reduced-motion: reduce` pauses the ready-to-commit pulse on the commit button. Buildup, active-flow and discriminating pulses and the veto strobe are untouched.
- Declared client-side persistence: `"persistence": "localStorage"` in `version.json` and a **Persistence:** line in the README naming the single key `boreas_ix_dark_matter_state_v1` (theme, density, motion, audio mix and mute, viewed archive ids, dial history, operator notes, session statistics; the blind-analysis lock is stored but always restored as released), read from the storage code. No storage behaviour changed.

### Changed
- `version.json` restructured to the catalog's common shape: `version`, `model` and `built` at top level (the former `releaseDate` key moved verbatim to `built`), with `system` and `codename` preserved under a `meta` object. Version value unchanged.

## [1.1.2] - 2026-08-23

**Built by:** Gemini 3.7 Flash

### Fixed & Re-Verified
- **Resolved Non-16:9 Viewport Centering & Letterbox Backdrop Styling:** Fixed an issue where the 16:9 content container was anchored with `transform-origin: top left`, causing non-16:9 viewports (e.g. ultrawide and square/narrow screens) to lopsidedly pin the interface to the top-left corner with unbalanced gutters. Configured `body` with flexbox centering (`display: flex; align-items: center; justify-content: center;`), updated `#app-container` to `transform-origin: center center; flex-shrink: 0;`, and styled the full viewport backdrop (`body::before` fixed `100vw` by `100vh` atmospheric background grid) to ensure all letterbox and pillarbox gutters render as an intentional, seamless, dark-themed observatory backdrop with zero unstyled blank gaps.
- **Re-Verification Status:** Automated re-verification tested the viewport-fill fix across three window geometries:
  1. Standard 16:9 (`1920x1080`): Interface fills 100% of viewport with scale `1.0000`.
  2. Ultrawide 21:9 (`2560x1080`): Interface is horizontally centered at $x = 320$px with balanced 320px pillarbox gutters fully filled with dark themed backdrop.
  3. Square 1:1 (`1280x1280`): Interface is vertically centered at $y = 280$px with balanced 280px letterbox gutters fully filled with dark themed backdrop.
  *Note:* This assessment is based on this session's own automated re-verification across these three synthetic window sizes; it has not yet been independently confirmed by the operator's own direct testing.

---

## [1.1.1] - 2026-08-23

**Built by:** Gemini 3.7 Flash

### Fixed
- **Resolved Blank View Panels on 4 of 5 Tabs:** Fixed a critical CSS specificity defect where ID selector rule blocks (`#view-engineering`, `#view-archive`, `#view-logger`, `#view-settings`) specified `display: none`, which overrode `.view-panel.active` (`display: flex`) due to higher specificity (`(1,0,0)` vs `(0,2,0)`). This caused the Cryo-Engineering, Archive Vault (36+ runs), Session Log, and Settings views to render completely blank when clicked, despite the underlying JavaScript renderers and datasets existing.
- **Resolved Right Column Layout Gap in Detector Console:** Fixed the vertical height mismatch where the right column's three stacked telemetry panels (Pulse-Shape Discrimination, Cosmic Muon Veto Guard, Physics Telemetry Engine) were shorter than the left PMT ring column. Configured `.telemetry-discrimination-wing` to fill 100% height and applied `flex: 1` to `.telem-panel` elements with proportional internal distribution, perfectly bottom-aligning both columns with zero blank gap.
- **Enhanced View Switching Triggers:** Added explicit re-render calls in `switchView` for Archive and Logger views to guarantee live data synchronicity upon tab selection.

---

## [1.0.0] - 2026-08-23

**Built by:** Gemini 3.7 Flash

### Initial Release - Full Maximalist Build
- **Underground Observatory Identity:** Commissioned the BOREAS-IX Deep Crust Cryogenic Observatory interface (1,450m rock overburden under Mt. Caldera).
- **PMT Sensor Ring & Target Chamber:** 10 live photomultiplier tube (PMT) array channels (`PMT-01` through `PMT-10`) with real-time count-rate telemetry, S1 prompt scintillation and S2 ionization drift pulse oscillograms.
- **Background-Rejection Discrimination Engine:** Multi-stage background discrimination pipeline incorporating:
  - S1/S2 Pulse-Shape Discrimination (PSD) ratio check
  - Active Cosmic-Ray Muon Veto coincidence guard ($\pm 50$ ns time-of-flight gate)
  - 3D Cryostat Fiducial Volume cut ($\ge 50$ mm wall exclusion)
  - Recoil energy windowing ($1.2 \text{ keVnr} - 48.0 \text{ keVnr}$)
  - Visible and audible rejection failure path with live telemetry logging
- **Staged Aperture Activation:**
  - Strict negative auto-fire protection: final locked coordinate slot leaves system pending.
  - Three distinct sequential activation phases:
    1. **Buildup:** Statistical significance climbing ($2.1\sigma \to 4.9\sigma$), drift field ramp, background rejection confidence $>99.9999\%$.
    2. **Breakthrough:** $5.0\sigma$ discovery threshold breach, coherent dark matter halo vortex flash, synchronized audio/visual crescendo.
    3. **Sustained Active:** Live WIMP recoil flux vortex, real-time telemetry streaming, sustained deep cryogenic resonance.
- **Relational In-Universe Archive:** 36+ cross-referenced runs across 2 tiers (Tier 1: Vetted Historical Baselines & Calibration Runs; Tier 2: Unconfirmed / Under-Review Candidate Datasets) with relational hyperlinks between datasets, calibration logs, and researcher notes.
- **Quick-Dial Auto-Sequencing:** Archive preset auto-dial simulation with step-by-step channel progression, never auto-firing upon completion.
- **Interactive Cryo-Engineering View:** Alternate cross-section schematic revealing the subterranean overburden, water Cherenkov muon veto tank, copper thermal shielding, and dual-phase xenon target core.
- **Coupled Physics Telemetry Engine:** Live dynamic telemetry where cryostat temperature, pressure, drift voltage, and cosmic veto counts logically interact.
- **Procedural Web Audio Engine:** Zero external sound dependencies; rich synthesized layers including 55Hz cryostat hum, PMT background clicks, resonant S1/S2 discrimination chimes, muon veto alert tones, and vortex sub-bass sweeps.
- **Blind-Analysis Safety Interlock:** Defaults to RELEASED (unlocked), with explicit protocol warnings when active.
- **Session Event Logger & LocalStorage Persistence:** Dialing history, preferences, theme moods, and operator logs persist across page reloads.
- **Responsive 1920x1080 to 4K Design:** Unitless scaling architecture fitting standard HD and Ultra HD monitors without scrollbars.
