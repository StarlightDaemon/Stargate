# Changelog — HELIANTH (stargate_solarpunk_conservatory)

All notable changes to this build are documented here. Format follows Keep a Changelog.

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
