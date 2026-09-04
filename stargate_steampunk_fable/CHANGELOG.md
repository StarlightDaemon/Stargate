# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

**Built by:** Claude Sonnet 5 (keyboard-focus / reduced-motion CSS) and Claude Fable 5.1 (every other item), in catalog-wide maintenance commits of 2026-09-04. Entry backfilled 2026-09-04 by Claude Fable 5.1 from the commit diffs. Version number left unchanged; whether any item warrants a bump is for operator review.

### Added
- OS-level `prefers-reduced-motion: reduce` support alongside the build's own `data-motion` setting: the armed engage lever's idle breathing glow (`#btn-engage.armed`) is disabled, since border and label colour already convey the armed state, and the cross-section modal's flywheel rotation (`.xs-spin.turning` under `data-motion="full"`) is slowed to 32s rather than stopped. Refusal flash, the buildup/breakthrough/active annunciator states and the reader-card feed transition are untouched. No focus-visible rule was added.
- Declared client-side persistence: `"persistence": "localStorage"` in `version.json` and a **Persistence:** line in the README naming the single key `perpetua.v1` (theme, density, motion, master/ambient/mechanism/bell volumes, the last 40 dial history entries and archive entries viewed), read from the storage code. No storage behaviour changed.

### Changed
- `version.json` restructured to the catalog's common shape: `version` and `model` at top level, with `name` preserved under a `meta` object. No date key existed, so no `built` field was added. Version value unchanged.
- Test harness `test/run-tests.mjs`: the hardcoded Chrome path constant was replaced by `resolveChrome()`, which takes `CHROME_PATH` or `PUPPETEER_EXECUTABLE_PATH`, falls back to puppeteer's own `executablePath()`, and otherwise fails with an explicit error naming `CHROME_PATH`. No absolute local path remains in the harness. Harness only; runtime unchanged.

## [1.0.0] - 2026-09-01

**Built by:** Claude Fable 5. Reasoning level was not recorded at build time.

### Verified

- **Correction (2026-09-02):** the "Direct operator testing (2026-09-01)"
  line below was a prose-only status assertion written at build time — not
  evidence, despite the name. No hands-on testing had actually happened at
  that point; the build had only the harness's own automated Puppeteer run
  behind it, and was pushed live on that alone.
- Direct operator testing, done afterward on 2026-09-02, confirmed the
  build fully functional and matching the intended direction end-to-end:
  manual dial, three-stage activation (buildup / breakthrough / sustained
  active), disengage, and folio-rack quick-dial auto-dial all working as
  intended.
- This is a successful second attempt at the Steampunk genre for this project.
  It deliberately avoids the physical-material rendering approach (simulated
  brass/iron surfaces) that ended a prior attempt at this theme, rendering
  everything as glowing schematic line-work instead — and takes a distinct
  identity angle (a calculating engine) from the genre's one other existing
  success, a telegraph/dispatch-style console.

### Added

- PERPETUA v1.0.0 — the Aldercroft Computation Bureau's Great Concordance Engine.
- Patent-sheet composition: dominant Store-wheel schematic left of center, card
  train and mill governor on a right-hand apparatus rail, telemetry as marginalia.
- Ten value-wheel columns (eight coordinate, one carriage-check, one residual),
  eight-card concordance addresses over a twelve-card index tray.
- Punched-card locking: each index card feeds visibly through the reader slot and
  advances its value-wheel ring to the reading index — all clean line-work and glow.
- Staged activation: buildup (mill spin-up), breakthrough (residual proves zero,
  bell strike, aperture opens), sustained active. Never auto-fires; the engage
  lever is the only trigger.
- Folio rack quick-dial (7 preloaded folios, attested vs. provisional tiers) that
  replays a punched card train at governor speed — staged, never instantaneous.
- Proving Hold safety interlock, released by default, with unmissable refusal
  feedback when engaged.
- Cross-referenced folio archive (28 entries with supersession/derivation/dispute
  links), schematic cross-section view, coupled boiler/torque/confidence
  telemetry, session event log, settings (density, motion, audio layers, four
  theme variants), localStorage persistence.
- Densely layered synthesized Web Audio: boiler-room ambience, escapement tick,
  card clack, ratchet trains, steam chuff, proving bell.
- Puppeteer verification suite (`npm test`) with hit-tested events and
  1080p/4K screenshot capture.
