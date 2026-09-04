# Changelog

All notable changes to the VALENCE-9 Cross-Venue Dark Route Console (`stargate_darkpool_router`) will be documented in this file.

## [Unreleased]

**Built by:** Claude Sonnet 5 (keyboard-focus / reduced-motion CSS) and Claude Fable 5.1 (every other item), in catalog-wide maintenance commits of 2026-09-04. Entry backfilled 2026-09-04 by Claude Fable 5.1 from the commit diffs. Version number left unchanged; whether any item warrants a bump is for operator review.

### Added
- Keyboard focus indicators: `:focus-visible` outline (2px `--color-cyan`, 3px offset) on every `button` and `a`, and on the visible `.switch-slider` of the 0x0 risk-toggle checkbox (`#risk-toggle`). Added alongside the existing rules; no existing rule altered.
- `prefers-reduced-motion: reduce` disables the ambient alarm/ready pulses: the ready status pill, the active alarm banner, the ready-state activate button, the engaged risk LED and the alarm shake on the risk panel. Buildup, breakthrough and active stage feedback are untouched.

### Changed
- Test harness `tests/test_suite.js`: the hardcoded Chrome path constant was replaced by `resolveChrome()`, which takes `CHROME_PATH` or `PUPPETEER_EXECUTABLE_PATH`, falls back to puppeteer's own `executablePath()`, and otherwise fails with an explicit error naming `CHROME_PATH`. No absolute local path remains in the harness. Harness only; runtime unchanged.

## [1.0.0] - 2026-08-22

**Built by:** Gemini 3.7 Flash (High reasoning)

> **Operator Verification Note:** Direct operator testing confirmed the build is fully functional end-to-end — manual dialing, three-stage activation (buildup, breakthrough, sustained active), disengage kill-switch, and quick-dial auto-dial sequencing all operate as intended.

### Added
- **Asymmetric Trading Pit Split-Deck Architecture:** Non-symmetric 63/37 layout deliberately breaking the five-zone top/center/left/right/bottom frame rut.
- **Orbital Order-Book Liquidity Ring:** 10 radial exchange nodes (`LSE-DARK`, `NY4-ULTRA`, `TY3-MWAVE`, `SG1-LASER`, `HK1-OPTIC`, `FR2-DIRECT`, `CME-AURORA`, `CHI-BATS`, `ZUR-QNTM`, `TOK-SUBSEA`) with real-time bid/ask depth walls converging toward an execution core.
- **L-STOR Locking Mechanism:** Discrete Liquidity-Slicing & Sub-Tick Order Routing locking 7 synthetic multi-leg asset vectors with instant fill flashes and sub-tick spread compression.
- **Three-Stage Staged Activation Sequence:**
  - *Buildup Stage (1.8s)*: Volatility surge, 10x volume spike, high-frequency depth wall oscillation, rising acoustic sweep.
  - *Breakthrough Stage (Instant Flash)*: Matched execution threshold crossing, spread snaps to 0.0000 Δ, central quantum aperture activation, polyphonic execution bell chime.
  - *Sustained Active Stage*: High-throughput running P&L ticker, multi-node particle vortex circulation, live trade execution stream.
- **Negative Auto-Fire Safeguard:** Explicit verification ensuring 7th lock leaves system in pending/ready state without auto-firing.
- **Two-Tier Quick-Dial Engine:** 6 preloaded strategy presets across Backtested Alpha Baskets (Tier 1) and Experimental Dark Squeeze Vectors (Tier 2) with genuine sequenced auto-dialing (~280ms/step) and interruptible disengage.
- **Hardware Risk Interlock / Pre-Trade Circuit Breaker:** Dedicated safety toggle defaulting to RELEASED (0 / Normal route permitted), with alarm strobe and negative buzz when engaged.
- **Emergency Kill-Switch / Flatten Control:** High-visibility hazard disengage button enabling instantaneous order flattening and system reset from any state.
- **Web Audio Sound Engine:** 100% procedural synthesized market audio (packet chirp, metallic fill chime, execution bell, warp hum, risk buzz, disengage dump).
- **Responsive 16:9 Viewport Engine:** Unitless JS-driven `--app-scale` transform supporting 1920x1080 and 3840x2160 (4K) without overflow.
- **Operator Reference Manual (`?`):** Collapsible modal guide with full terminal documentation.
