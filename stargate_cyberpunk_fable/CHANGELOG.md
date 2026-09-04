# Changelog

All notable changes to NIGHTGLASS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

**Built by:** Claude Sonnet 5 (keyboard-focus / reduced-motion CSS) and Claude Fable 5.1 (every other item), in catalog-wide maintenance commits of 2026-09-04. Entry backfilled 2026-09-04 by Claude Fable 5.1 from the commit diffs. Version number left unchanged; whether any item warrants a bump is for operator review.

### Added
- Keyboard focus indicators: `:focus-visible` outline (2px `--accent`, 3px offset) on every `button`, `a` and range input. Added alongside the existing hover rules; no existing rule altered.
- `prefers-reduced-motion: reduce` pauses the ambient loops: `.lightstream`, `.ring-rot`, `.ring-rot-rev`, the pending-state `#aperture-breath`, `.addr-slot.next`, the armed `#btn-open`, the engaged `#btn-ward` and `.ch-edge.known`. Dial feedback is untouched; this sits alongside the build's own `data-motion="still"` setting, which is unchanged.
- Declared client-side persistence: `"persistence": "localStorage"` in `version.json` and a **Persistence:** line in the README naming `nightglass.prefs` (theme, density, motion, audio mix), `nightglass.history` (last 40 weave entries) and `nightglass.seen` (archive entries viewed), read from the storage code. No storage behaviour changed.

### Changed
- `version.json` restructured to the catalog's common shape: `version` and `model` at top level, with `name` preserved under a `meta` object. No date key existed, so no `built` field was added. Version value unchanged.
- Test harness `test/run-tests.mjs`: the hardcoded Chrome candidate list (Windows, Linux and macOS paths) was replaced by `resolveChrome()`, which takes `CHROME_PATH` or `PUPPETEER_EXECUTABLE_PATH`, falls back to puppeteer's own `executablePath()`, and otherwise fails with an explicit error naming `CHROME_PATH`. No absolute local path remains in the harness. Harness only; runtime unchanged.

## [1.0.0] — 2026-09-01

**Built by:** Claude Fable 5 (model id `claude-fable-5`). Reasoning level was not recorded at build time.

> **Correction (2026-09-02):** the "Operator verification (2026-09-01)" line
> originally recorded here (commit `7c8a18d8`) was a prose-only status
> assertion written at build time — not evidence, despite the name. No
> hands-on testing had actually happened at that point; the build had only
> the harness's own automated Puppeteer run behind it, and was pushed live
> on that alone.
>
> **Operator verification (2026-09-02):** direct hands-on testing by the
> operator, done afterward, confirmed the build fully functional
> end-to-end — manual dial, three-stage activation, disengage, and
> quick-dial auto-dial all working as intended — and judged it a successful
> one-shot build. This release is a Fable-executed revisit of the Cyberpunk
> theme under the project's current digital-first, maximalist template.

### Added

- Initial release of NIGHTGLASS, the private access spire of Vesper Ryn on the Lume Lattice.
- Layered-depth stage composition: parallax light-lattice backdrop, tilted translucent panes at distinct implied z-depths, and a seven-shard veil ring as the centerpiece.
- Weave Deck with ten original resonance glyphs and a seven-glyph route track.
- Signal-lock gesture: each chosen glyph resolves from scattered static into a crisp form while a light-thread arcs to the ring and one veil shard dissolves.
- Staged link activation — buildup, breakthrough, and sustained open link — triggered only by the explicit *Open Link* control; a completed route always waits pending.
- Seven preloaded threads across two tiers (anchored / frayed) that genuinely re-weave their route glyph by glyph at loom speed.
- Always-available *Close Link* control, functional in every state including mid-auto-weave.
- Drift Ward hold (released by default) with unmissable blocking feedback while engaged.
- Cross-referenced archive of 34 entries (nodes, routes, personas, phenomena, fragments) with clickable references between entries.
- Lattice chart: an alternate constellation view of nodes and known threads, distinct from the ring.
- Live telemetry with coupled values: coherence follows carrier and turbulence, throughput follows coherence and carrier, drift runs inverse to coherence.
- Settings pane: four theme variants, three display densities, three motion intensities, and per-layer synthesized audio levels.
- Timestamped session journal of the visitor's actions.
- Layered Web Audio glass-loom sound design: ambient grain texture, pentatonic weave chimes, riser, bloom, and sustained hum.
- localStorage persistence for preferences, weave history, and viewed archive entries.
- Operator reference overlay (circular "?", collapsed by default), corner version label, and StarlightDaemon credit link.
- Puppeteer test harness with hit-tested real pointer events, staged-activation screenshot evidence at 1080p and simulated 4K, and a numeric aperture-luminance comparison across stages.
