# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

**Built by:** Claude Sonnet 5 (keyboard-focus / reduced-motion CSS) and Claude Fable 5.1 (every other item), in catalog-wide maintenance commits of 2026-09-04. Entry backfilled 2026-09-04 by Claude Fable 5.1 from the commit diffs. Version number left unchanged; whether any item warrants a bump is for operator review.

### Added
- `preview.png` for the gallery card, committed at 800x450 (dimensions read from the PNG header).
- Keyboard focus indicators: a 3px `--vermil` outline on every `button` and on `#author-corner`. Added alongside the existing rules; no existing rule altered.
- `prefers-reduced-motion: reduce` pauses the drifting sky clouds (`.cloud-a`, `.cloud-b`). Dial, portal and activation feedback are untouched.

### Changed
- `version.json` restructured to the catalog's common shape: `version` and `model` at top level, with `name` preserved under a `meta` object. No date key existed, so no `built` field was added. Version value unchanged.

## [1.0.1] - 2026-08-25

**Built by:** Claude Fable 5, high reasoning

Targeted fix pass from live operator observations. Identity, woodblock
rendering style, palette, station content, and sound design unchanged.

### Diagnosis (confirmed in code and via live Puppeteer probes before changing anything)

- **Ring vs. stage panel — confirmed.** Per lock, the ring's only
  feedback was the wheel rotation plus the locked cartouche turning
  vermillion (with a 0.26s pop). The entire layered print-building
  animation rendered only in the separate destination-print panel, and
  the ring's central aperture displayed the same static dry-ring art
  through all seven locks and through pending. The ring read as a
  passive input device while all the real visual work happened
  off-ring.
- **Multi-lock — partially real.** With paced clicks (waiting out each
  ~800ms wheel turn), second and later locks all registered correctly,
  including dialing two full stations back to back — no state
  corruption after the first lock. But at natural operator speed
  (probe: real dispatched clicks every 250ms), only 1 of 7 locks
  registered: every click landing while the wheel was still turning was
  silently discarded by the `S.rotating` early-return in
  `selectGlyph`, with no refusal wobble, no sound, no status change.
  That silent swallowing is the real mechanism behind "later locks
  don't register."

### Fixed

- **The ring is now the primary locus of dialing feedback.** The
  aperture doubles as the press bed: from the first impression, the
  destination print builds layer by layer inside the ring's own mouth
  (sharing the exact same layer markup as the panel via a common
  `printLayers()`, so the two views cannot drift). Seven kentō
  registration stations around the aperture rim each take the locked
  block's vermillion glyph seal with a stamp-pop as its impression
  lands; the pointer notch visibly strikes and the whole dial takes a
  press on every lock. A full address lights a pulsing vermillion rim
  around the mouth until the Warden's Seal is pressed. The
  destination-print panel remains unchanged as the detail view of the
  full sheet.
- **Clicks during wheel rotation are no longer silently dropped.** A
  manual click that lands mid-turn is queued (FIFO, up to seven) and
  fed through the normal registration path when the turn completes —
  wrong blocks still refuse (and a refusal voids the queue), duplicate
  clicks still tick. Brisk sequential dialing now registers all seven
  impressions. Queue is cleared on release, on quick-dial, and during
  warden auto-stamping.

### Verification

- `test/run-tests.mjs` extended: ring seal/press-bed progression
  checks, pending-rim check, release-clears-ring check, and a
  rapid-click scenario (real dispatched clicks every 250ms → all 7
  locks must register). 36 checks, 0 failures, including all prior
  requirements: three-stage activation, staged auto-dial, disengage and
  redial, negative auto-fire watches, interlock default and refusal,
  4K hit-testing.
- New `test/ring-verify.mjs`: full manual dial with a dial-region
  screenshot after every individual lock, asserting the ring shows
  distinct progressing state (n seals + n bed layers) at each of the
  seven steps, then pending rim, buildup/active over the bed, and a
  clean ring after release. All checks pass.

## [1.0.0] - 2026-08-25

**Built by:** Claude Fable 5, high reasoning

### Known Issues

- Operator review found the overall build did not meet expectations
  compared to a sibling build on the same creative brief. Specifically,
  the auto-dial/quick-dial preset behavior (the traveler's tokens) did
  not read as working or present during real operator use.
- This build's own automated Puppeteer verification reported specific
  staged auto-dial timing (per-lock timestamps of roughly 850ms to
  5100ms across the seven impressions, documented in the original build
  report). The discrepancy between that automated verification and the
  operator's real-use experience has not been resolved or explained.
- This build is closed as a single, one-off attempt. No further
  iteration or fix pass is planned.

### Added

- Initial release of the Kagerō Road Waystation Registry, a portal-dialing
  console rendered entirely as a flat ukiyo-e style woodblock print.
- Registry Dial: a rotating carved ring of ten original travel-glyphs that
  aligns each chosen glyph under the pointer notch before stamping it.
- Layered woodblock locking: each of the seven address impressions stamps a
  real layer of the destination station's print — sumi key-block first, then
  six color blocks in registration.
- Ten original waystations along the fictional Kagerō-kaidō, each with its own
  palette, print composition, and seven-glyph address.
- Seven traveler's tokens (quick-dial presets) across two tiers, Post Road and
  Hidden Way, which auto-stamp their addresses visibly, glyph by glyph.
- Three-stage activation — ink-gathering buildup, breaking-wave breakthrough,
  and sustained open water — triggered only by the Warden's Seal, never by
  completing an address.
- Always-available Release Cord disengage, working in every state.
- Barrier Writ safety interlock (defaults to lifted/pass open) with unmissable
  closed-pass banner when posted.
- Fully synthesized WebAudio sound design: woodblock thuds, paper rustle,
  bronze bell, wind and water ambience.
- Operator's reference overlay, version label, and author corner links.
