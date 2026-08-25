# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
