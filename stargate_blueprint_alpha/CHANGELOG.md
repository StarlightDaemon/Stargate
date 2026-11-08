# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Audio mute lifecycle — 2026-11-08

- Reproduced the existing mute/unmute defect: an active connection's ambient gain stayed at zero after AUDIO returned to ON. Unmute now restores the existing gain, or starts the requested ambient connection if activation completed while muted. Disengage clears that request, so unmuting an idle terminal cannot restart a cancelled connection.
- Mute cancels transient sounds, pending pen callbacks, retiring ambient fades and scheduled gain ramps. An explicitly muted preference remains muted through activation and disengage; cancellation does not raise its silent gain.
- Deterministic baseline/current checks pass, including muted activation, fade/ramp interruption and cancellation. Real pointer browser checks retain the old audio source to reproduce silent unmute and test the repaired lifecycle; hosted execution is pending. Original verification assertions, stage timings, audio timbre and operator-known-issue status are unchanged.

### Breakthrough header layout — 2026-11-08

- Visual review of hosted job `128827398288` found that the breakthrough status forced the firm title and metadata onto extra lines, although the staged functional and pixel checks passed. Shortened only that header label to `BREAKTHROUGH // CERTIFIED`; the central aperture and approval stamp retain the full drawing-certification captions. Brand text, typography, styling and stage duration are unchanged.
- Added a browser layout regression that replays the previous label and measures its wrapping, then verifies the corrected label at 1080p and 4K. Actual buildup, breakthrough and sustained headers are checked at both sizes; the existing three-stage screenshots and pixel predicates remain intact. Hosted verification of this focused layout repair is pending.

### Shared verification dependencies — 2026-11-08

- Removed duplicate `puppeteer` declarations in favor of the repository's locked development tools. Package commands and non-dependency metadata are preserved; install shared tools with `npm ci --ignore-scripts` at the repository root before browser verification.
- Adopted exact npm-generated manifest and lockfile bytes from hosted run `42512175752`, job `128827397973`, after byte-count and SHA-256 verification. This candidate passed clean install, installed-tree validation, native CommonJS/ES-module resolution and a full audit with zero findings.
- Preserved the current-contract `npm test`, historical `test:legacy` and focused `test:regressions` commands. Historical timing/automatic-preset failures and the unresolved operator manual-dialing report remain separate from dependency qualification.
- This dependency qualification does not grant functional, visual, sound, operator or release acceptance. Existing known issues and historical operator dispositions are preserved; merge and deployment remain on HOLD.

### Three-stage drawing approval — 2026-11-08

- Replaced the 200 ms approval flip with 1.6 seconds of caliper calibration, a 0.6-second certification breakthrough, then sustained active topology. The buildup uses the existing drafting grid and an accelerating plotter cadence; breakthrough pairs the existing stamp and impact sound; the canvas and continuous hum begin only in the sustained stage.
- Stage captions and the operator reference now distinguish pending coordinates, calibration, certification and active transmission. Reduced-motion mode retains these captions and static stage colors while disabling the new calibration trace motion.
- All stage transitions and cadence sounds use the existing cancellation owner. Disengage and Clear Buffer remain reachable throughout; engaging Review Hold during approval cancels the draft safely.
- Deterministic checks pass immediately before/at 1600 ms and 2200 ms, and after canceling at 500/1800/2500 ms followed by 8.25 seconds idle. Hosted checks are prepared for real pointer/key cycles, instrument-region screenshot differences between all three stages, every-stage cancellation, control reachability at 1080p/4K and reduced-motion captions. Those browser checks are pending, not claimed as passed here.
- The unchanged original suite now conflicts first with its manual 500 ms active assertion, in addition to its automatic-preset assertions. Those historical contract failures remain explicit; no original assertions or timings were weakened. The operator-reported manual-dial failure below remains unresolved pending hands-on acceptance.


### Staged archive plotting and cancellation — 2026-11-08

- Archived site plans now replay six coordinates through the existing manual inking path, with 120 ms between coordinates. Each selection replaces the prior draft exactly and stops pending work. Completed plans remain staged; only ENGAGE starts approval. Manual input during a preset cancels the remaining replay and continues the visible partial draft.
- Draft timers are owned and generation-guarded. Disengage and Clear Buffer cancel pending plotting, approval and hold callbacks, preventing an old approval stamp from reappearing after reset.
- Audio cancellation separately owns the delayed pen stroke and finite sources. Ambient fade cleanup captures its own nodes and gain, so rapid redial cannot stop a newer connection.
- Deterministic regressions passed for all six exact presets; interrupted plotting at 0/60/240/500/590 ms via both cancellation controls; replacement and manual takeover; approval interruption at 50 ms; and 8.25-second idle observations. Audio checks reproduce and repair the old pen callback and rapid-redial cleanup defects. Browser pointer/key, reachability and timing checks are prepared but pending hosted execution.
- The original `verify.js` remains unchanged. Its phase 9 explicitly requires automatic preset activation after 800 ms, so it now conflicts with the required no-auto-fire behavior and is expected to FAIL that historical assertion. The new focused suite enforces staged/pending followed by explicit manual approval; it does not silently adapt or relabel the original suite.
- The operator-reported Manual Dialing Failure below remains unresolved. Deterministic staging accepts 0/80/350 ms intervals, but automated results cannot overturn the operator report. The existing 200 ms approval transition is also not qualified as a genuine three-stage activation; that requires a separate scoped repair and acceptance.


### Development dependency maintenance — 2026-11-08

- Removed unused `serve` and its dependency tree after the entry points moved to
  the shared preview. Updated Puppeteer from 25.9.0 to 25.16.0 and raised its
  declared minimum accordingly. The npm-generated lock resolves Zod 4.6.7 via
  Puppeteer's supported dependency tree without overrides; all packages are
  development-only. Locked package count falls from 108 to 26.
- Changed the existing full-tree audit from diagnostic output to a blocking
  zero-findings gate. CI checks a fresh `npm ci`, installed dependency graph,
  lockfile stability, original functional assertions, self-hosted `npm test`,
  all current entry points and historical/shared browser preservation.
- Retained prior `serve` qualification evidence at commit
  `d4ce5294bc65182bcff1a17e085a69700ecf2f10`, workflow run `42462388786`.
  Its traversal rejection, private-file exposure, POST acceptance and original
  suite's 301 redirect failure remain historical findings. That obsolete CLI
  is no longer installed or rerun; the report marks this explicitly as SKIP.
- Application files, original functional assertions, version, attribution and
  known-issue status are unchanged. The UI issues below remain separately scoped.

### Development entry-point security maintenance — 2026-11-08

- Routed `node server.js`, `npm start` and the verification suite's embedded
  listener through the shared loopback-only preview. The development commands
  retain port 8088 and accept `PORT`; verification owns an ephemeral listener.
- Historical raw HTTP checks reproduced parent/sibling-file exposure in both
  handwritten handlers. The locked `serve` CLI rejected traversal but exposed
  development files and accepted POST. Shared serving denies private files and
  traversal with 403 and unsupported methods with 405.
- Preserved the original functional assertions and client files. Verification
  now expects denied documentation access and accepts standard JavaScript MIME;
  metadata assertions still read the changelog from disk. Browser sandbox
  disabling flags were removed and shutdown awaits listener closure.
- Qualification checks all six public assets and two hit-tested manual cycles
  against historical/shared serving. The original suite passes with both
  handwritten/shared handlers; its existing `serve` redirect incompatibility
  is reported as a transport FAIL, not hidden by a passing browser comparison.
- Preserved the operator manual-dialing warning below. Preset auto-activation
  and favicon 404 are existing observations, not fixed by this maintenance.
  Existing dependency audit findings are recorded separately; locks unchanged.
- Reviewed four 1920x1080 shared-preview captures: idle, six-symbol ready,
  approved/active and disengaged. Primary controls, ring state and approval
  stamp remain visible. This is not full responsive, sound or operator acceptance.

The attribution and entries below describe earlier catalog maintenance only.

**Built by:** Claude Sonnet 5 (keyboard-focus / reduced-motion CSS) and Claude Fable 5.1 (every other item), in catalog-wide maintenance commits of 2026-09-04. Entry backfilled 2026-09-04 by Claude Fable 5.1 from the commit diffs. Version number left unchanged; whether any item warrants a bump is for operator review.

### Added
- Keyboard focus indicators: `:focus-visible` outline in `--line-bright-cyan` with the build's cyan glow on `.cad-mini-btn`, `.operator-ref-btn`, `.site-plan-card`, `.glyph-btn`, `.action-btn`, `.sub-btn`, `.modal-close-x`, `.modal-btn-dismiss` and `.attribution-link`. Added alongside the existing hover rules; no existing rule altered.

### Changed
- Test harness `verify.js` now writes its five verification screenshots (1080p dormant, 4K scaled, active manifold, review hold, quick-dial active) to the gitignored `test/` directory, created on demand, instead of the build root. Harness only; runtime unchanged.

### Browser icon compatibility — 2026-11-08

**Performed by:** Codex maintenance session.

- Added a local SVG favicon using the existing palette and drafting manifold motif,
  with an explicit HTML icon link to prevent the missing favicon request.

## [1.0.0] - 2026-08-12

### Known Issues
- **Manual Dialing Failure**: Operator testing found that manual dialing is non-functional. This directly contradicts this session's automated verification report (which reported two passing dial-disengage-redial cycles). The root cause has not yet been determined and will be investigated in a separate pass.

### Added
- **Architectural Drafting Identity**: Complete CAD / cyanotype blueprint terminal interface for the *Vossen-Klein Topological Drafting Bureau (Division of Non-Euclidean Surveys)*.
- **Annotated Vector Ring Drawing**: Central plan-view structural elevation drawing with real SVG dimension lines (Ø 7,200mm Outer Chord, R 2,400mm Aperture Bore, 240mm Flange), 45° cross-hatch section shading, and 8 octagonal radial datum anchor nodes.
- **Drafting Locking Mechanism**: 8 Structural Caliper Anchors with real-time inking passes, mechanical compass arm plotting tracer, and technical weld/tension callout stamps.
- **Topological Coordinate Addressing**: 16 original vector glyphs with 6-symbol coordinate staging addressing for 6-DoF manifold locking.
- **Procedural Sound Engine**: High-fidelity Web Audio API synthesizer generating authentic rapidograph ink pen scratches, stepper motor plotting pulses, metallic caliper snaps, and harmonic wormhole resonance.
- **Drawing Approval & Manifold Activation**: Drawing authorization protocol with dynamic "APPROVED & CERTIFIED" blueprint stamp and animated ray-traced hyperbolic wireframe portal manifold.
- **Disengage Control**: Always-accessible VOID / DISENGAGE control that smoothly reverts the drawing back to draft construction state.
- **Review Hold Subsystem**: Independent structural engineering permit hold preventing final transmission until code compliance is approved.
- **Preloaded Quick-Dial Site Plans**: 6 filed site plans across 2 distinct visual tiers (Tier 1: Civil Sector Plans, Tier 2: Classified Extra-Topological Blueprints).
- **Responsive CAD Viewport Scaling**: Dynamic mathematical scaling supporting 1080p and 4K viewports without scrolling.
- **Operator Reference Manual**: Dismissible technical schematic guide (`?` button).
- **Attribution & Versioning**: In-universe title block, bottom-right `v1.0.0` version indicator, and bottom-left `StarlightDaemon` attribution link (`rel="noopener noreferrer"`).

**Built by:** Gemini 3.6 Flash (high reasoning)
