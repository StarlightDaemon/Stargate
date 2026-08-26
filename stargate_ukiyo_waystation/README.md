# Stargate Ukiyo-e Waystation (`stargate_ukiyo_waystation`)

> **Operator Verification Note:** Direct operator testing confirmed this build is fully functional end-to-end — manual dialing, three-stage activation, disengage, and quick-dial auto-dialing all perform as intended. This represents the project's first deliberate departure from the digital-glow HUD register into a flat Japanese ukiyo-e woodblock-print aesthetic, verified successful by the operator.

> **Session Close-Out (v1.0.3) — believed solid, pending final operator review:** This build
> went through four iterative fix passes in a single session — **v1.0.1** (the ring gained its
> own locking feedback, and rapid clicks were serialized instead of racing), **v1.0.2** (the
> print panel and dial were repositioned to their correct locations: panel top-left, dial
> centred), and **v1.0.3** (a full stale-position audit that caught three effects left
> mis-anchored by that repositioning). Each pass was verified as passing at the time, and each
> one uncovered the next issue. The 1.0.3 audit was verified with live-playback screenshot
> evidence — each animated effect captured and measured while actually playing — not by DOM-state
> checks alone. On that basis the build is **believed solid**; the full E2E suite passes 14/14.
> **Final operator review is still pending as of this close-out.** See `CHANGELOG.md` for detail.

An interactive novelty portal-dialing website set along **The Sixty-Nine Stations of the Celestial Mist-Weave Road** (*浮世雲織道 六十九次*), administered by **The Bureau of Celestial Passes & Mist Registries** (*雲路関所司 - Unro Sekisho-shi*).

## Overview

- **Aesthetic**: Flat Japanese ukiyo-e woodblock print art with traditional mineral pigments (Indigo, Ochre, Vermillion, Gold, Washi paper cream) and Sumi linework.
- **Instrument**: The Celestial Woodblock Compass Dial (*天象木版方位儀*).
- **Technique**: 5-layer woodblock stamping engine (Keyblock outline -> Earth ground wash -> Prussian blue indigo -> Vermillion accent -> Bokashi gradient & Hanko approval stamp).
- **Sound Design**: Physical acoustic Web Audio synthesis (woodblock thuds, washi friction, temple bell, wooden clappers, ocean and mountain breeze).
- **Activation Flow**: 3-stage activation (Buildup 1.8s -> Great Wave Breakthrough -> Sustained Active vortex).
- **Quick-Dial**: 6 preloaded itineraries across 2 tiers with sequential auto-dialing.
- **Safety Interlock**: Imperial Barrier Interlock (*Sekisho Tegata Barrier*), defaulting to Released.

## Local Server & Running

```bash
# Start server
node scripts/server.js

# Run E2E Puppeteer test suite
node scripts/test_e2e.js
```
