# Changelog — HELIANTH (stargate_solarpunk_conservatory)

All notable changes to this build are documented here. Format follows Keep a Changelog.

## [Unreleased]

**Built by:** Claude Sonnet 5 (keyboard-focus / reduced-motion CSS) and Claude Fable 5.1 (every other item), in catalog-wide maintenance commits of 2026-09-04. Entry backfilled 2026-09-04 by Claude Fable 5.1 from the commit diffs. Version number left unchanged; whether any item warrants a bump is for operator review.

### Added
- Keyboard focus indicators: a 3px `--ink` outline with a cream halo and green glow on the `.seed`, `.pressing` and `.tool` controls. Added alongside the existing hover/active rules and the existing `prefers-reduced-motion` block, none of which are altered.

### Changed
- `version.json` restructured to the catalog's common shape: `version`, `model` and `built` at top level, with `name`, `folder` and `status` preserved verbatim under a `meta` object. The stray `port` key (local dev-server environment data) was removed. Version value unchanged.
- Test harnesses `test/capture.mjs` and `test/run-tests.mjs`: the hardcoded Chrome default was replaced by `resolveChrome()`, which takes `CHROME_PATH`, `PUPPETEER_EXECUTABLE_PATH` or the harnesses' own older `CHROME` variable, falls back to puppeteer's own `executablePath()`, and otherwise fails with an explicit error naming `CHROME_PATH`. No absolute local path remains in either harness. Harness only; runtime unchanged.

## [1.0.0] — 2026-09-02

**Built by:** Claude Fable 5.1 (Claude Code, autonomous session; default reasoning effort).

### Verified

- Direct operator testing (2026-09-02) confirmed the build functional and
  solid. This confirmation is the operator's own hands-on testing, not the
  build's automated self-test (see "Added" below and the README's "What was
  verified" section for what the harness alone had covered).
- Operator's accepted read of the finished piece: the visual execution leans
  toward the organic/nature side of the solarpunk brief more than a fully
  balanced technology-and-ecology blend.

### Added
- The five-light lantern: a conservatory cupola drawn as luminous Art Nouveau linework on a daylight ground — outer drum, five hinged sashes ("lights") with whiplash ornament, a heliotropic 13-cultivar seed-ring, sill notches, an oculus with hour ticks and an analemma.
- Grafting as the locking gesture: choose a cultivar from the seed tray, the seed-ring slews it under the next light, TAKE grows a tendril from the sill notch into the light and a five-petal bloom opens; the cultivar is sealed into the light and climbs the ledger vine.
- Activation as a three-stage event: OPEN THE LIGHTS swings the sashes edge-on while sap rises and ripples tighten (buildup, 2.6 s) → petal burst and flash (breakthrough) → the sunwell: a rotating caustic weave with drifting seeds (sustained active) until CLOSE THE LIGHTS.
- Herbarium quick-dial: five pressed routes that strike at nursery pace (each cutting still slews and grafts visibly; roughly 4.7 s for five, never instant). One pressing has gone fallow and fails after buildup with no breakthrough.
- Frost Shutter interlock, released by default: when drawn it blocks TAKE and OPEN with a cold veil, crackle linework, a cooled sky and a shiver tone; drawing it mid-strike halts the pressing; drawing it while open closes the lights.
- Fully synthesised sound (Web Audio, no assets): wooden tick, seed-ring rustle, snip + breath-flute "take" with a water plink, bee-hum/wind buildup drone, flute-harmonic breakthrough chord, warm sunwell drone with bird trills and drips, frost shiver.
- Gentle stewardship telemetry as hung tags (canopy light + sap, rain cistern, pollinators aloft + hives, tending rota) that couples to the open way.
- Proportional 1920×1080 stage scaling via a JS-computed bare `--fit` custom property; corner chrome lives outside the transform subtree.
- Self-test harness (`npm test`): puppeteer-core + system Chrome, real hit-tested mouse events, 42 checks with evidence screenshots and an oculus luminance/warmth proof of stage distinctness.

### Rendering decisions worth knowing
- Ledger labels are HTML positioned over the ledger SVG, not SVG `<text>`: in the Claude app's embedded Chromium 148 the SVG text inside the CSS-scaled stage rendered oversized and displaced (system Chrome 152 headless rendered it correctly). Verified fixed in both.
- Glow on the backdrop vines and the ledger stem is a wide low-opacity halo stroke rather than a filter reference into another SVG's `<defs>`; filters are only used inside the lantern SVG that owns them.

### Known issues
- None found by the self-test or by the operator's hands-on testing — see README "Status".
