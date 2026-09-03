# Changelog

All notable changes to **AUREOLE — Meadowlark Atomic Exposition · Threshold Pavilion** are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-09-02

**Built by:** Claude Fable 5.1 (`claude-fable-5-1`). Reasoning level: not observable from inside the build session, so not recorded rather than guessed.

**Status:** confirmed by direct operator hands-on testing (2026-09-02) — see "Verified" below.

### Verified
- Direct operator testing (2026-09-02) confirmed the build works as intended, end to end. This confirmation is the operator's own hands-on testing, not the build's automated self-test; the harness results listed under "Added" supported it but do not stand in for it.

### Added
- **Atompunk register, digital-native.** Midnight-teal ground with turquoise, coral, and butter-cream glow; Googie starburst selector, boomerang outline, cantilevered console wedge, asterisk ornaments. Flat fill, stroke, and glow only — no simulated chrome, Bakelite, or metal anywhere. Deliberately distinct from the retro build's charcoal-and-green-phosphor storage-oscilloscope console in both palette and concept.
- **Bohr-shell ring as a working instrument.** Seven concentric shells (K–Q) each carry an orbiting electron at its own rate and sense. Seating an isotope makes the next shell hunt (electron races, orbit wobbles, resonance arc sweeps, meter climbs) then capture (starburst pop, shell lights, nucleus gains a dot, seat tile fills, manifest lamp lights, spectrograph line appears).
- **Original lock mechanism:** resonance hunt → capture, hand pace ≈1.3 s per shell (measured 1.26–1.31 s), cam pace ≈0.6 s per shell.
- **Three-stage excitation:** buildup (2.3 s shell contraction, electron acceleration, swelling nucleus, T− countdown, theremin glide with rising noise), breakthrough (0.7 s cream flash with coral rays, sixteen starburst spikes, noise burst plus chord), sustained open (rotating conic corona with outward sparks, breathing halo, detuned hum, faster Geiger ticks). Aperture luminance on the verified run: pending 44 · buildup 72 · breakthrough 221 · active 176 (every pair ≥ 25 apart).
- **No auto-fire.** Seven seated shells leave the console pending; only EXCITE proceeds. Verified as a negative case with real events (2.5 s hold after the seventh capture, by hand and by cam).
- **DISCHARGE always reachable:** from pending, mid-cam (cancels remaining stops), mid-buildup (never reaches breakthrough), and from an open threshold. Two full dial → discharge → redial cycles verified with hit-tested events.
- **Lead Shutter** interlock, released by default; engaged, it refuses captures, cams, and excitation with a blinking warning, red-flashing shells, and a buzzer, and the warning stays visible until release.
- **Five preset cams** (quick-dial) with an in-universe justification (pre-cut tuning profiles; the servo runs to each stop without hunting but cannot skip one). Verified: 7 shells in 4.07 s vs 8.9 s by hand, every step ≥ 0.5 s apart, mid-sequence screenshot with three seated and one hunting. One dark cam (MOONGLOW COURT) collapses after breakthrough with no answering resonance.
- **Rapid-input queue:** clicks faster than the hunt are queued through the normal validation path and seat in order; duplicates and out-of-turn cams are refused with a visible reason.
- **Coupled readouts:** spectrograph strip, shell manifest lamps, countdown, resonance meter, Exposition Standard Time clock, hyperfine cycle counter, shell energy, threshold flux, teletype log.
- **Procedural Web Audio:** Geiger-tick ambient, theremin hunt glide, capture ping, servo whirr, buildup glide and noise bed, breakthrough burst and chord, open hum, discharge sweep and relay clack, refusal buzzer, dark-route sag.
- **Viewport fit** via a JS-computed bare `--fit` custom property; `transform` verified applied at 1920×1080 (`--fit` 1) and 3840×2160 (`--fit` 2). Corner chrome lives outside the scaled stage. Global `[hidden]{display:none!important}` reset.
- **Puppeteer verification harness** (`npm test`): 104 checks with hit-tested real pointer events, externally timed captures, screenshot-based aperture metrics, and 15 named screenshots.

### Known issues
- None found by the automated harness or by the operator's hands-on testing (2026-09-02).
