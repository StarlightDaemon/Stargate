# Changelog

All notable changes to the **Stargate Konstrukt Transit** platform are documented in this file.

## [Unreleased]

**Built by:** Claude Sonnet 5 (keyboard-focus / reduced-motion CSS) and Claude Fable 5.1 (every other item), in catalog-wide maintenance commits of 2026-09-04. Entry backfilled 2026-09-04 by Claude Fable 5.1 from the commit diffs. Version number left unchanged; whether any item warrants a bump is for operator review.

### Added
- Keyboard focus indicators: a `:focus-visible` double ring (2px `--c-canvas-pure` inside 5px `--c-blue`, drawn with `box-shadow`, native outline suppressed) on every `button` and `a`, with an explicit override so the ring wins over the hard-shadow resting state of the two master engage/disengage buttons. Added alongside the existing rules; no existing rule altered.

### Changed
- Test harness `tests/test_flow.js`: the hardcoded Chrome/Edge candidate list was replaced by `resolveChrome()`, which takes `CHROME_PATH` or `PUPPETEER_EXECUTABLE_PATH`, falls back to puppeteer's own `executablePath()`, and otherwise fails with an explicit error naming `CHROME_PATH`. No absolute local path remains in the harness. Harness only; runtime unchanged.

## [1.0.0] - 2026-08-22

**Built by:** Gemini 3.7 Flash

> **Operator Verification Note:** Direct operator testing confirmed this build is fully functional end-to-end — manual dialing, three-stage activation (buildup, breakthrough, sustained active), disengage/reset, and quick-dial auto-sequencing all operate as intended. This marks this project's third deliberate artistic-register departure from the digital-glow HUD style, embracing a Bauhaus and Constructivist geometric abstraction aesthetic, which was confirmed successful by the operator.

### Initial Release: Bauhaus / Constructivist Geometric Abstraction Portal
- **Identity & Aesthetics**:
  - Invented fictional identity: *KONSTRUKT TRANSIT BUREAU* (Bureau of Applied Geometric Kinetics & Inter-Vector Transit).
  - Formal geometric design language inspired by Bauhaus color-shape theory (Kandinsky, Lissitzky, Moholy-Nagy) using bold primary colors (Cadmium Red, Cobalt Blue, Ochre Yellow), Pitch Black, Bone White, and Steel Grey.
  - Zero political emblems, slogans, or real-world political affiliations; strict adherence to formal geometric abstraction.
  - Asymmetric, dynamic poster composition with bold diagonal structural axes, heavy typography, and off-axis balance.
  - Hard-edged rendering with zero gradients, zero faked 3D lighting, and zero cybernetic glows.
- **The Kinetic Annulus (Dial Ring)**:
  - 8-segment 45-degree radial Euclidean geometry with 8 distinct invented geometric glyphs (`V-01` through `V-08`).
  - Screen-printing squeegee-drag locking mechanism: mechanical stencil registration followed by a bold pigment wipe pass.
  - 6-glyph address coordinate sequence with real-time linear stencil register tracking.
- **Audio Synthesizer (Web Audio API)**:
  - Machine-age functionalist audio design: metallic detent clicks, squeegee friction passes, heavy platen thuds, four-on-the-floor industrial motor drone, rising stepped buildup hum, explosive mechanical breakthrough crash, and pneumatic air-dump purges.
- **Multi-Stage Staged Activation**:
  - No auto-fire on address completion; system enters distinct `PENDING` state with high-contrast indicator.
  - Stage 1: Buildup (~1.8s) with accelerating mechanical tension and sector alignment.
  - Stage 2: Breakthrough (~0.6s) with diagonal geometric wedge spearhead piercing center aperture.
  - Stage 3: Sustained Active with counter-rotating geometric discs and rhythmic vector pulse.
  - Immediate, always-reachable Disengage / Purge control.
- **Quick-Dial Presets & Safety**:
  - 6 preloaded destinations across 2 tiers (*Intra-Metropolitan Arteries* and *Deep Kinetic Corridors*).
  - Real staged auto-dialing sequence (~320ms per symbol) halting at `PENDING` state.
  - *Vector Interference Interlock* detent defaulting to `RELEASED`, presenting unmissable hazard feedback when engaged.
- **Viewport & Operator Controls**:
  - Master 1920x1080 design scaling dynamically to 4K (3840x2160) without scrolling.
  - Collapsible Operator Manual overlay (`?` circular button).
  - Bottom-left `StarlightDaemon` external link and bottom-right version attribution label.
