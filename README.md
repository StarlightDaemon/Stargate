# DSV-9 ARCHELON - Bathyscaphe Pilot Console & Abyssal Gateway Interface

Themed, single-page "portal dialing" console: a deep-ocean submersible HUD for the fictional Hadal Exploration & Abyssal Research Consortium (HEARC). Version 1.0.0, originally built by Gemini 3.7 Flash (see `CHANGELOG.md`).

## Run

```
npm run dev          # node server.js -> http://127.0.0.1:3000  (PORT env var overrides)
npm test             # node test/verify.js  (builder's Puppeteer suite; expects the server on :3000)
```

Static files only (`index.html`, `src/css`, `src/js`); no build step.

## How it works

- **Dial control:** 8 depth waypoints (WP-1 .. WP-8, 850 m .. 11,800 m) in Cluster 01. Each click runs a 10-channel ballast/trim convergence and locks the waypoint. Keys `1`-`8` also work.
- **Safety interlock:** Cluster 02 toggle, defaults to **RELEASED**. When engaged, the actuator is disabled and refuses clicks / `Space`.
- **Activation:** with 8/8 locked the profile is **ARMED / PENDING** and never auto-fires. Pressing **COMMENCE DESCENT APERTURE** (or `Space`/`Enter`) runs three stages: BUILDUP (2.0 s) -> BREAKTHROUGH (0.8 s) -> SUSTAINED ACTIVE.
- **Disengage:** **EMERGENCY ASCENT // BLOW ALL BALLAST** (or `Esc`) is always enabled; it clears all locks and returns to IDLE.
- **Quick-dial presets:** `DIVE PRESETS` drawer (`P`), 3 Tier I + 3 Tier II profiles; replay locks waypoints progressively and lands in ARMED / PENDING.
- **Tabs:** Piloting HUD, Vessel Engineering, Dive Archives, Telemetry Matrix, Session Log, Settings; `?` opens the operator manual.

## Verification status (read this before calling the build done)

**2026-08-23 - automated re-verification by a Claude Code session.** Checks (a)-(g) below all PASSED using real Puppeteer pointer events and pixel-diffed screenshots; evidence in `test/screenshots/reverify_2026-08-23/`. Full detail in `CHANGELOG.md`.

| | Check | Result |
|---|---|---|
| a | Manual dial completes without auto-firing on the final lock | PASS |
| b | Three activation stages are visually distinct (pixel diff) | PASS |
| c | Presets auto-dial progressively, not instantly | PASS |
| d | Engage / disengage / redial cycle, run twice | PASS |
| e | Interlock defaults to released on fresh load | PASS |
| f | Every secondary tab / panel / modal shows real content | PASS |
| g | Background fills 800x1200 and 1600x600 with no unstyled gap | PASS |

**This is automated verification only. The operator has NOT personally clicked through this build.** Nothing here should be read as operator confirmation.

Known issues found by that session and left unfixed (details in `CHANGELOG.md`): depth telemetry lags the "11,800 m" stage text by minutes; archive sidebar counts (32/12/8/7/5) are hard-coded while only 10 records exist; the "Saved Local Dives" counter never updates; `node_modules/` is committed with no `.gitignore`; no favicon.
