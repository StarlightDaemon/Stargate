# Changelog

## [Unreleased]

**Built by:** Claude Sonnet 5 (keyboard-focus / reduced-motion CSS) and Claude Fable 5.1 (every other item), in catalog-wide maintenance commits of 2026-09-04. Entry backfilled 2026-09-04 by Claude Fable 5.1 from the commit diffs. Version number left unchanged; whether any item warrants a bump is for operator review.

### Added
- Keyboard focus indicators: `:focus-visible` outline in `--gold-leaf` with the gold glow on `.gothic-btn`, `.palette-btn`, `.preset-card-btn`, `.modal-close-btn` and `.starlight-link`. Added alongside the existing hover rules; no existing rule altered.
- `prefers-reduced-motion: reduce` stops the ambient candle flicker (`.candle-flame`). Sunbeam shift/glow, kaleidoscope spin, the ignition button's pending/active pulses and the glass-seat/spark lock feedback are untouched.

### Changed
- Test harness `tests/verify.js`: the hardcoded Chrome/Edge candidate list was replaced by `resolveChrome()`, which takes `CHROME_PATH` or `PUPPETEER_EXECUTABLE_PATH`, falls back to puppeteer's own `executablePath()`, and otherwise fails with an explicit error naming `CHROME_PATH`. No absolute local path remains in the harness. Harness only; runtime unchanged.

## [1.0.0] - 2026-08-22

### Added
- **Sanctuary Identity**: The Grand Vitrarium of Lumisfer (Chantry of the Solstitial Oculus / Custodians of the Seven Meridians).
- **Architectural Composition**: Authentic Gothic cathedral facade elevation with towering pointed lancet arches, cusped stone tracery, triforium gallery tiers, and the Great Rose Window (Oculus) crowning the central nave.
- **Leaded Stained-Glass Rendering**: Saturated jewel-toned flat glass segments divided by dark structural lead came outlines (`#111114`), authentic lead solder joints, and warm internal backlight radiance.
- **Two-Stage Glass & Lead Locking**: Selecting an address light sequentially fits the colored jewel glass pane into the tracery frame followed by a visual solder spark and lead came border sealing.
- **Non-Auto-Firing Activation**: 7-light sequences transition to PENDING (Sanctified) state, requiring explicit activation via the central Keystone Censer.
- **Three-Stage Staged Activation**: 
  1. *Buildup* (1.8s) - clerestory sunlight beams intensify, stone vibrates, pipe organ swells.
  2. *Breakthrough* (1.2s) - aperture vortex ignites with chromatic jewel blaze, cathedral bell toll.
  3. *Sustained Active* - stable prismatic kaleidoscope vortex, sustained organ pedal resonance.
- **Genuinely Auto-Dialed Presets**: 8 preloaded destinations across 2 architectural tiers (Inner Sanctum Sanctorum & Outer Pilgrim Voids) with visible per-light step execution.
- **Safety Interlock**: The Chantry Anathema Latch (defaults to released, blocks activation with liturgical warning when engaged).
- **Acoustic Web Audio Synthesizer**: Original sound design featuring resonant wine-glass chimes, lead soldering hiss, 32-foot pipe organ pedals, bronze cathedral bells, and stone seating thuds.
- **Operator Reference**: Collapsible illuminated manuscript parchment overlay detailing symbol concordance and dialing liturgy.
- **Responsive Viewport**: Strict 1080p fit with unitless CSS scale factor supporting 4K displays seamlessly.

### Verification & Operator Testing
- **Direct Operator Testing Confirmation**: Direct operator testing confirmed the build is fully functional end-to-end—manual dial, three-stage activation, disengage, and quick-dial auto-dial all working as intended.
- **Aesthetic Direction**: This build marks this project's second deliberate departure from the digital-glow HUD register into a Gothic stained-glass architectural aesthetic, confirmed successful in direct testing.

**Built by:** Gemini 3.7 Flash (High)
