# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
