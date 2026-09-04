# Changelog

All notable changes to **TRELLIS — Hollin Reach Canopy Commons · Sunspan Ring** are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

**Built by:** Claude Sonnet 5 (keyboard-focus / reduced-motion CSS) and Claude Fable 5.1 (every other item), in catalog-wide maintenance commits of 2026-09-04. Entry backfilled 2026-09-04 by Claude Fable 5.1 from the commit diffs. Version number left unchanged; whether any item warrants a bump is for operator review.

### Added
- Keyboard focus indicators: a 3px `--terracotta` outline (the build's existing held/engaged accent) drawn outside the control on `.wm`, `.route` (2px offset), `.shelf-btn`, `.open-btn`, `.fold-btn`, `.latch-btn`, `.guide-close` and the corner link. Additive only; the existing `prefers-reduced-motion` block and hover rules are unchanged.

### Changed
- `version.json` restructured to the catalog's common shape: `version`, `model` and `built` at top level, with `name`, `folder` and `status` preserved verbatim under a `meta` object. The stray `port` key (local dev-server environment data) was removed. Version value unchanged.
- Test harness `test/run-tests.mjs`: the hardcoded Chrome candidate list (Windows, Linux and macOS paths plus a probe of puppeteer's home-directory cache) was replaced by `resolveChrome()`, which takes `CHROME_PATH` or `PUPPETEER_EXECUTABLE_PATH`, falls back to puppeteer's own `executablePath()`, and otherwise fails with an explicit error naming `CHROME_PATH`. No absolute local path remains in the harness. Harness only; runtime unchanged.

## [1.0.0] - 2026-09-02

**Built by:** Claude Fable 5.1 (claude-fable-5-1), standard reasoning effort

**Status:** closed, complete, no further iteration planned.

### Closed

- Operator verdict (2026-09-03): the build is functional and a legitimate execution of
  the solarpunk theme, but does not fully match the intended vision for it. Closed on
  creative-fit grounds rather than as a technical failure — no defect is recorded
  against it, and no further iteration is planned. Same close-out category as the
  Low Sci-Fi and Dark Spooky Gothic builds.
- Build-time verification stands as recorded below: implemented and self-tested,
  102/102 automated checks with real dispatched pointer events.

### Added
- **Solarpunk register as a synthesis, not a tint.** Warm daylight palette (cream, moss, brass, terracotta, amber) on a light ground; Art Nouveau whiplash stems and leaf braces; visible mechanism throughout (hoop, conduits, collectors, pool rim). No material simulation anywhere: stroke, flat fill, and glow only.
- **Sunspan Ring as a working instrument.** Seven collector bays on a trellis frame, a rotating fourteen-waymark dial hoop, seven conduit tracks from the stem join, a pool rim around the aperture, and a canvas aperture. Each pledge slews the hoop to place the waymark under the open bay (geometry verified to within 0.001°), flows the share along its conduit, and opens the bay's five petals.
- **Original lock mechanism:** heliostat slew → conduit flow → collector open, with hand pace (~1.3–1.7 s per share, slew time scaling with angular distance) and ledger pace (~0.65–0.75 s per share).
- **Three-stage opening:** the pool gathers (2.4 s ember dimming with inward spiral and rays), sunburst (0.7 s white-gold bloom with rays and flash ring), span open (breathing conic weave of amber/gold/sage with outward flecks). Aperture screenshot metrics on the verified run (luminance, warmth): pending 232/46, buildup 131/74, breakthrough 224/107, active 179/86; every pair at least 49 apart.
- **No auto-fire.** Seven held shares leave the ring pending; only *Open the Span* proceeds. Verified as a negative case with real events (2.5 s hold after the seventh share, and after a ledger route).
- **Fold the Span** always reachable: from pending, from the gathering (never reaches open), from an open span, and mid-walk (cancels the ledger queue).
- **Quiet-hours latch** interlock, released by default; when engaged the hearth refuses with a shaking banner, a refused-shake on the control, three low tones and a warm log line.
- **Six walked routes** (quick-dial) re-pledged at ledger pace with the same per-share staging; verified faster than by hand (5.2 s vs 11.9 s for seven) and never instantaneous.
- **Coupled telemetry:** in-universe clock with a masthead sun-arc, stored sun charging with daylight and drawn down while open, pooled shares, and draw.
- **Procedural Web Audio** sound design (toks, slew whirr, trickle, pentatonic petal chimes, gathering chord with slowing pulse, sunburst gong, breathing open drone, folding chimes, latch tones).
- **Rapid-input queue:** clicks faster than the lock animation are queued through the normal validation path rather than dropped.
- **Viewport fit** via a JS-computed bare `--fit` custom property; verified `transform` is applied at 1920×1080 (`--fit` 1) and 3840×2160 (`--fit` 2).
- **Guide overlay** (`?`) and sound toggle; global `[hidden]{display:none!important}` reset.
- **Puppeteer verification harness** (`npm test`): 102 checks with hit-tested real pointer events, screenshot-based aperture metrics, and 15 named screenshots.

### Known issues
- None found by the automated harness. Operator hands-on testing has not yet been performed; this section should be updated after it.
