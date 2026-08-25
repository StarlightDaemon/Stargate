# Changelog

All notable changes to the Stargate Ukiyo-e Waystation interface will be documented in this file.

## [1.0.1] - 2026-08-25

**Built by:** Claude Sonnet 5

> **Fix scope:** Targeted fix only — original ukiyo-e identity, woodblock rendering style, color palette, station content, and sound design are unchanged.

### Diagnosed (confirmed directly in this build's own code, not assumed from a similar build)
- **Ring carried no locking feedback**: `.dial-sector` elements never changed visual state on a lock — verified via instrumented Puppeteer run showing sector `class` attributes stayed empty before and after locking a station. All 5-layer woodblock stamping rendered exclusively in the separate `#woodblock-stage` print panel; the rotating dial ring itself was purely a selector with no persistent per-station record of what had been locked.
- **Rapid manual clicks raced and corrupted state**: `PortalController.handleManualStationLock` / `WoodblockEngine.stampStation` had no reentrancy guard. Puppeteer test dispatching 5 real pointer-event clicks 60ms apart (faster than the ~560ms rotate+stamp pipeline) produced `lockedStations.length === 6` with one station double-registered and 4 of 5 destination tags left blank (`fuda-kanji` showing `-`) — clicks weren't dropped outright, but the shared stage SVG layers and `lockIdx` slot were stomped by overlapping in-flight calls, so most of the operator's input produced no visible result.

### Fixed
- **Ring is now the primary locus of dialing feedback**: added `CelestialDial.animateSectorLock()`, which stamps each dial sector's rim notch and seal badge through the same 5 woodblock layer colors (`jizuri` → `aizuri` → `shuzuri` → gold/bokashi) used on the print stage, ending in a persistent vermillion-sealed `.sector-locked` state with a small red Inkan seal mark. Wired into both the manual lock path (`portal.js`) and the auto-dial path (`presets.js`), synced to each engine's existing stamp timing. The stage panel remains as a secondary detail view.
- **Mid-rotation clicks now queue instead of racing**: `CelestialDial` gained an explicit click queue (`queueStationClick` / `processStationClick`). A click landing while a prior rotate+lock pipeline is in flight is queued (with a brief audible paper-friction cue and a dashed `.pad-queued` outline on its pad button) and processed strictly in order once the previous station's full rotate → 5-layer stamp → registration sequence completes. `rotateToStation`'s completion now waits on `PortalController.handleManualStationLock`'s actual finish (via an explicit `doneCallback`) rather than firing after the CSS rotation alone, eliminating the `lockIdx` collision at its root.
- Updated `scripts/test_e2e.js`'s manual-dial and safety-interlock tests to wait on `lockedStations.length` reaching the expected count via `page.waitForFunction` instead of fixed sleeps — the previous fixed delays were implicitly tuned to the old racing behavior finishing "fast but corrupted"; correct serialization takes measurably longer per rapid click and needed a completion-based wait instead of a guessed timeout.

### Verified
- Re-ran the full existing 14-test Puppeteer E2E suite (`scripts/test_e2e.js`) end-to-end: viewport scaling, safety interlock default (RELEASED), full 7-station manual dial, negative auto-fire (lands in PENDING, never auto-activates), three-stage activation (buildup → breakthrough → sustained), disengage/reset, quick-dial auto-dial sequencing, safety interlock block, operator reference modal, and 4K scaling all pass with no regressions.
- Additional targeted Puppeteer runs with real dispatched pointer events at 60ms and 20ms click spacing confirmed clicks now fully serialize (verified via instrumented call-order logging) with zero duplicate registrations and zero blank destination tags.

## [1.0.0] - 2026-08-23

**Built by:** Gemini 3.7 Flash (High Reasoning)

> **Operator Verification Note:** Direct operator testing confirmed the build is fully functional end-to-end — manual dialing, three-stage activation, disengage, and quick-dial auto-dialing all perform as intended. This represents the project's first deliberate departure from the digital-glow HUD register into a flat Japanese ukiyo-e woodblock-print aesthetic, verified successful by the operator.

### Added
- **Original Ukiyo-e Aesthetic System**: Flat bold color fields, Sumi ink outline linework, traditional mineral pigment palette (Indigo/Bero-ai `#1d3b53`, Ochre/Ōdo `#c8963e`, Vermillion/Shu `#c73d2a`, Washi paper `#f5edd6`, Sumi black `#1a1818`), and authentic registration marks (Kento).
- **Asymmetrical Ukiyo-e Composition**: Dominant off-center Celestial Woodblock Compass Dial, balanced with vertical Tanzaku poetry cartouches, progressive multi-layer woodblock stamping plate, travel ledger scroll, and spacious washi negative space (*Ma*).
- **Physical Woodblock Stamping Engine**: Addresses built up layer-by-layer across 5 authentic print phases (Keyblock Sumi outline -> Earth pigment wash -> Prussian blue block -> Vermillion accent -> Bokashi gradient feathering & Imperial Seal stamp).
- **Synthesized Web Audio Physical Sound Engine**: Resonant woodblock impact thuds (*Don!*), mulberry paper brushing (*Sssht*), bronze temple bell chimes (*Bonshō*), wooden clappers (*Hyōshigi*), and surging wave ambiance. Zero digital HUD sweeps or electronic beeps.
- **Three-Stage Staged Activation Flow**:
  - *Stage 1 (Buildup)*: Deep pigment accumulation, rising press tension, elemental current gathering (1.8s).
  - *Stage 2 (Breakthrough)*: Original Great Cresting Wave aperture burst, temple bell gong resonance, threshold breakthrough.
  - *Stage 3 (Sustained Active)*: Circulating woodblock vortex stream, dynamic swirling cloud ribbons, station destination fully illuminated in 5-layer woodblock print.
- **Strict Activation Safety**: Completing the 7th station lock enters PENDING/READY state and never auto-fires; activation occurs solely via explicit operator activation seal.
- **Sequential Quick-Dial Presets**: 6 preloaded destinations across 2 tiers (*Imperial Courier Routes* and *Pilgrim Mountain Passes*), with visible step-by-step woodblock stamping progression.
- **Safety Interlock**: *Imperial Barrier Seal* (*Sekisho Tegata*), defaulting to RELEASED (Pass Open), providing clear blocked feedback when closed by operator.
- **Always-Reachable Disengage Control**: Accessible at all times to clear the dial or disengage an active portal.
- **Operator Reference Guide Overlay**: Traditional accordion travel manual (*Orihon*) style help modal accessible via top-right `?` button.
- **Corner Attribution & Responsive Viewport Scaling**: Fixed 1920x1080 design cleanly scaling to 4K (3840x2160) without scrollbars, with StarlightDaemon link and version label.
