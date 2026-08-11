# Changelog

All notable changes to MERIDIAN (stargate_high_scifi) are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-08-11

**Built by:** Claude Fable 5

Compliance pass: model attribution, versioning, corner marks, operator
reference, and single-viewport fit.

### Added

- Operator reference: a collapsed circular `?` control fixed top-right opens
  "Standing Order 4 · Console Operation", an in-universe duty card walking the
  L4 Annex dial sequence (surveyed DIAL vs. manual signature composition, the
  welded ERIDU terminal invariant, cold solve vs. lattice recall, divergence
  and the declined route, probe/collapse discipline). Dismissable by the
  DISMISS button, backdrop click, or `Escape`.
- Corner marks: build credit `StarlightDaemon` bottom-left linking to
  <https://github.com/StarlightDaemon> (`target="_blank"`,
  `rel="noopener noreferrer"`), version label bottom-right.
- `version.json` and this changelog.

### Changed

- The console now scales as a single proportional unit: the existing layout is
  authored into a fixed 1920x1080 design box (`#fit`) which a JS `fitStage()`
  scales to the viewport. Previously the artifact stage was capped at 780 px
  and the sidebar at 380 px regardless of viewport, so a 3840x2160 panel
  rendered the same small console surrounded by dead space. It now fills 4K at
  a clean 2x, and is unchanged at 1920x1080.
- `#stage` sizes from design-box units instead of `vmin`, which would otherwise
  fight the stage scale factor.
- Console sidebar no longer overruns the viewport. STATION LOG and the
  ENGINEERING footer previously fell ~160 px below the fold at 1920x1080 and
  were reachable only by scrolling the sidebar. The ROUTE CATALOG now absorbs
  the slack and scrolls inside its own panel, so the whole column fits.
- Top bar gains right padding so the fixed `?` control cannot overlap the
  SOUND / ARTIFACT DOSSIER chips.

## [1.0.0] - 2026-07-19

**Built by:** Claude Fable 5

Initial release (commit `fa38796`).

### Added

- MERIDIAN — Transit Artifact M-1 console: an eleven-metre torus of
  scale-invariant grey glass recovered at Sol–Earth L4, wrapped in the human
  research console of the L4 Annex.
- Dialing as numerical relaxation: Meridian does not store addresses, it solves
  them, confirming nine topological invariants one anchor at a time.
- 36-glyph procedural alphabet, surveyed ROUTE CATALOG, and a manual SIGNATURE
  COMPOSER with the fixed ERIDU local invariant welded into the ninth slot.
- Cold solve (15–20 s of relaxation passes) versus LATTICE RECALL — solved
  routes are imprinted permanently in the lattice and stream back in under four
  seconds, cached in `localStorage` across 8 geodesic slots.
- Divergence failure for unsurveyed signatures; one catalogued route the
  Artifact has permanently declined.
- Probe launch with streamed telemetry, aperture collapse, abort, lattice
  telemetry readouts, and a station log.
- Ambient-only idle state; the `?diag` URL parameter runs the engineering
  self-test (never triggered by visitor inactivity).
- Vanilla ES modules, no build step, no dependencies, fully client-side.
