# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

This file and `version.json` were backfilled on 2026-08-16 from the build's git
history (one commit = one version, starting at v1.0.0), following the same
convention used for the other pre-existing builds in this monorepo.

## [Unreleased]

**Built by:** Claude Fable 5.1 (catalog-wide maintenance commits of 2026-09-04). Entry backfilled 2026-09-04 by Claude Fable 5.1 from the commit diffs. Version number left unchanged; whether any item warrants a bump is for operator review.

### Added
- Declared client-side persistence: `"persistence": "localStorage"` in `version.json` and a **Persistence:** line in the README naming the single key `sidereum.memory.v1` (the Ring's remembered Ways with id, name, seven-symbol address and uncharted flag, plus the count of uncharted Ways taken; the Forget control effaces it), read from the storage code. No storage behaviour changed.

### Changed
- `version.json` restructured to the catalog's common shape: `version`, `model` and `built` at top level (the former `date` key moved verbatim to `built`), with `name` and `device` preserved under a `meta` object. The `model` value stays `unknown`. Version value unchanged.

## [1.1.0] - 2026-08-16

**Built by:** unknown

Lighting and materials pass on the ring plate, plus a real fix for the aperture:
the stonework was painted as solid filled discs and had been silently blotting
out the veil canvas underneath it. Also converts the console shell to a
fit-to-viewport, proportionally-scaling layout on desktop and 4K. No change to
the rite, the sigil grammar, the Codex, the audio, or any in-universe copy.

### Fixed

- **Aperture mask.** `js/ring.js` builds the ring's concentric rims as filled
  `<circle>` elements, and `#ringSvg` paints over `#portalCanvas` — so the
  opaque stone discs covered the starlight veil entirely. The previous code had
  only a comment asserting the aperture was "already covered" by the r=254
  circle, which was not true. Added an `apertureMask` (a 900×900 white rect
  with a black `r=237` circle at the ring center, `maskUnits="userSpaceOnUse"`)
  and applied it to the stonework group, punching a hole that matches the
  veil's own aperture (`portal.js` `APERTURE = 236`). The plate now reads as a
  true ring with an open center instead of a solid disc sitting on the veil.

### Added

- **One directional light source across the whole plate.** New `ringHighlight`
  (warm `rgba(255,238,196,0.4)` → transparent) and `ringShadow`
  (`rgba(0,0,0,0.5)` → transparent) radial gradients, painted as two large
  ellipses in a masked layer stacked *above* the stone, wards and band: the
  highlight upper-left with `mix-blend-mode: screen`, the shadow lower-right
  with `mix-blend-mode: multiply`. Every mounted piece is now lit from the same
  direction, instead of the plate being flatly and evenly illuminated.
- **Keystone bevel.** The Keystone boss was a flat `#1a1433` fill; it is now a
  `keystoneBevel` radial gradient offset to the same upper-left light source
  (`cx 34% / cy 28%`), with a matching brighter `keystoneBevelAwake` gradient
  for the awake state, plus a cast `drop-shadow`. It reads as a mounted boss
  catching light rather than a flat mandala.
- **Drop shadows on the moving hardware.** `.ward` and `#band` each cast a
  short offset shadow consistent with the same light direction, so the wards
  and the turning sigil band sit above the plate instead of being flush with it.
- **Mounting hardware.** Sixteen `rim-rivet` circles at r=409 (offset 11° so
  they do not align with the existing graduations) bolting the outer plate
  down, and six `keystone-rivet` circles at r=78 around the Keystone boss.
- **Irregular tarnish.** Eight hand-placed, unevenly sized and rotated dark
  ellipses scattered across the outer plate at varying opacity (0.09–0.16) —
  deliberately not a uniform tint, so age reads as having settled unevenly.
- **Fit-to-viewport console shell** (`@media (min-width: 1081px)`): the whole
  console — ring, dialing controls, Codex, activation controls, portal display
  — is pinned to one screen with `body` as a full-height flex column, scrolling
  moved inside `#codexList` and `#rememberedList` (capped at 20vh) rather than
  the page, and `.ring-stage` sized `min(100%, 72vh)` so the ring grows with a
  taller frame. Only the footer colophon may fall below the fold. The existing
  single-column stacked layout below 1081px is untouched.

### Changed

- **Proportional scaling instead of dead space at high resolutions.** Root font
  size is now `clamp(16px, 0.8333vw, 32px)` — exactly 16px at 1920px wide
  (base layout unchanged) and exactly 32px at 3840px — and the fixed pixel
  values in the layout were converted to rem to ride it: `.frame` grid tracks
  (`250/300px` → `15.625/18.75rem`, `340px` → `21.25rem`, `270/330px` →
  `16.875/20.625rem`) and `.tray li` (`38px` → `2.375rem`). The `font-size:
  16px` declaration was removed from `body` so it inherits the fluid root.

### Notes

- Model attribution for this release is recorded as `unknown`: these changes
  were present as uncommitted working-tree edits with no commit, no
  `Co-Authored-By` trailer, and no session record identifying the author, so
  there is no honest basis for naming a model.

## [1.0.0] - 2026-07-18

**Built by:** Claude Fable 5

Initial build (commit `d3e8307`, model derived from its
`Co-Authored-By: Claude Fable 5` trailer). SIDEREUM, the Ring of Seven Wards —
a fully static, dependency-free site (vanilla HTML/CSS/JS): a gate-ring of the
fictional Astrolith Order, whose sidereal magic is written in invented
constellation-sigils.

### Added

- SVG ring: engraved rim law, seven ignitable wards in heptagonal array, a
  rotating band of 21 seeded constellation-sigils, the Crown Lens, the Keystone.
- The full rite: inscribe seven sigils → wards ignite → Keystone wakes →
  ignition cascade and flash → canvas veil of starlight → Sealing collapse.
- Codex of six fictional charted Ways; uncharted addresses open a violet veil;
  opened Ways are remembered in `localStorage`.
- Swift Working fast-dial, justified in-universe by the Ring's engraved law —
  *"What the Ring remembers, the Ring may recall"* — remembered Ways reopen
  without the band turning.
- Procedural Web Audio (hum, chimes, ignition swell, open choir, knell), off by
  default; the Grimoire help overlay; the Ritual Record log; Efface actions.
- Ambient-only idle state (drifting motes, breathing glow); dev-only
  verification hooks: the `RITE` console API, `Ctrl+Alt+G`/`J`, and
  `?rite`/`?tableau`/`?diag`/`?freeze`/`?veilimg` query params.
- Reduced-motion support, responsive layout, hidden-tab-safe frame ticker.
