# Changelog

All notable changes to the Stargate Ukiyo-e Waystation interface will be documented in this file.

## [1.0.2] - 2026-08-25

**Built by:** Claude Opus 5

> **Fix scope:** Pure layout/positioning pass. No interactive behaviour, audio, palette,
> station content, or woodblock-stamping logic was altered — in particular the ring's own
> locking feedback and the click-queue serialisation added in 1.0.1 are untouched and
> re-verified below.

### Before (measured on the cold-start page, 1920×1080)
- `.main-stage-layout` was a single-row 3-column grid, `550px 1fr 490px`.
- **Interactive dial / ring** sat in **grid column 1 (left flank)**: `.dial-column` at
  x=36, y=108, 550×912; the ring itself (`.celestial-dial-wrapper`, 490×490) centred at
  **(311, 417)**.
- **Illustrated print panel (Woodblock Stage)** sat in **grid column 2 (centre)**:
  `#woodblock-stage` at x=604, y=248, 772×772, centred at **(990, 634)** — i.e. the imagery
  occupied the page's central focal position and the instrument was pushed to the margin.
- `.controls-column` in grid column 3 at x=1394.

### Changed — imagery to top-left, dial to centre
- `.main-stage-layout` now uses **named grid areas** (`"stage dial controls"`) with
  **equal-width flanking columns** (`490px 1fr 490px`). Equal flanks are deliberate: they put
  the centre column's axis exactly on the 1920px stage centre line, so the dial is
  geometrically centred rather than approximately so.
- **`.stage-column` (illustrated print panel) → `grid-area: stage`, the top-left flank.**
  Its children were reordered so the print plate leads and the seal tags follow, and the
  column is `justify-content: flex-start` so the block hugs the top edge.
  `#woodblock-stage` changed from `flex: 1` (stretch the whole column) to a fixed
  `530px` plate, making it a discrete panel anchored top-left at **x=36, y=152, 490×530**
  rather than a full-height stretch. The washi below it is intentional *Ma*.
- **`.dial-column` (interactive dial/ring) → `grid-area: dial`, the centre.** New
  `#dial-container` rule (`flex: 1` + column flex + `justify-content: center`) lets the
  instrument stack occupy the full remaining height of the centre column.
- **Ring enlarged to read as the dominant focal element**: `.celestial-dial-wrapper`
  490→**620px**, `.kento-compass-ring` 486→616px, `.dial-svg` 470→596px (+27% diameter).
  The SVG is `viewBox`-driven, so every sector, trigram, kento blade and seal mark scales
  with it and no coordinate maths changed.
- **7 passage seal tags (`.fuda-slots-container`) reflowed** from a 1×7 flex row to a
  `repeat(4, 1fr)` grid so the tags stay legible in the narrower 490px left flank; they now
  sit directly beneath the print panel they annotate. `.fuda-slot` dropped its `flex: 1`
  accordingly. Ids (`#fuda-slots`, `#fuda-slot-N`) are unchanged, so
  `WoodblockEngine.renderFudaSlots` / `updateFudaTag` / `clearFudaSlots` are unaffected.
- `.station-pad-strip` keeps its 5×2 arrangement but now spans the wider centre column, so
  each pad's romaji label fits on one line (strip height 190→166px).
- Footer version label `v1.0.0` → `v1.0.2` (it had drifted behind `version.json`).

### After (measured on the cold-start page, 1920×1080)
- Computed grid: `490px 832px 490px`.
- **Illustrated print panel top-left**: `#woodblock-stage` at **x=36, y=152, 490×530**,
  its top edge flush with the top of the stage area; seal tags directly below at y=692.
- **Dial centred and dominant**: `.dial-column` at x=544, 832×912, **centre x = 960 — exactly
  the page centre line**; the ring (`.celestial-dial-wrapper`, now 620×620) centred at
  **(960, 482)**, the largest single element on the page.
- Quick-dial ledger, operator controls, header and footer corner displays all retain their
  prior roles and positions (`.controls-column` unchanged at x=1394, 490×912).

### Verified
- Full existing **14-test Puppeteer E2E suite passes 14/14** with no regressions: viewport
  scaling, safety-interlock default (RELEASED), 7-station manual dial, negative auto-fire
  (lands in PENDING, never self-activates), three-stage activation
  (buildup → breakthrough → sustained), both disengage/redial cycles, quick-dial auto-dial
  sequencing, interlock block, operator reference modal, and 4K scaling. The suite drives
  every control by hit-tested bounding box, so it exercised the relocated elements at their
  new coordinates.
- **Prior fixes explicitly re-verified against the restructured DOM** rather than assumed
  intact. A targeted Puppeteer run confirmed: all 10 sectors present in the recentred dial;
  a locked sector still passes through the transient `.sector-locking` layer-colour
  animation, ends in persistent `.sector-locked`, repaints its rim notch through the
  woodblock layer colours, and reveals the vermillion Inkan seal mark. Rapid dispatched
  pointer clicks at both **60ms and 20ms** spacing still fully serialise — exactly 5
  registrations, zero duplicates, zero blank destination tags, all 5 ring sectors sealed,
  queue drained with no stuck in-flight flag, and mid-flight clicks still acknowledged by
  the dashed `.pad-queued` outline. Both behaviours are keyed off `this.container`-relative
  selectors and the SVG's own coordinate space, which is why page position does not affect
  them — but this was confirmed by measurement, not by inspection alone.

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
