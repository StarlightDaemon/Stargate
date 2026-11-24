# DSV-9 ARCHELON - Bathyscaphe Pilot Console & Abyssal Gateway Interface

Themed, single-page "portal dialing" console: a deep-ocean submersible HUD for the fictional Hadal Exploration & Abyssal Research Consortium (HEARC). Version 1.0.0, originally built by Gemini 3.7 Flash (see `CHANGELOG.md`).

**Persistence:** `localStorage` only, under `archelon_pilot_preferences_v1` (theme, density, motion, audio mute and the master/ballast/thruster/hull/drone volumes), `archelon_pilot_dives_v1` (the last 50 completed aperture-sequence records: planned target depth, measured pressure and elapsed activation time) and `archelon_pilot_viewed_archives_v1` (archive entries already opened). The session event log is in-memory only and resets on reload.

## Run

Browser verification uses the shared tools installed at the repository root. Run `npm ci --ignore-scripts` there before using this exhibit's existing verification commands, with system Chrome configured as required by the harness. The exhibit's package commands and application assets are unchanged.

```
npm run dev          # node server.js -> http://127.0.0.1:3000  (PORT env var overrides)
npm test             # original builder suite; starts/closes its own shared preview on a free port
```

Static files only (`index.html`, `src/css`, `src/js`); no build step.
The dev command uses the repository's shared loopback-only preview server; keep
the exhibit inside the Stargate checkout. Run `npm ci` for the locked test
dependency. `STARGATE_TEST_URL` optionally selects an existing server for tests.
The serving migration does not change the display, engine or saved preferences.

## How it works

- **Dial control:** 8 depth waypoints (WP-1 .. WP-8, 850 m .. 11,800 m) in Cluster 01. Each click runs a 10-channel ballast/trim convergence and locks the waypoint. Keys `1`-`8` also work.
- **Safety interlock:** Cluster 02 toggle, defaults to **RELEASED**. When engaged, the actuator is disabled and refuses clicks / `Space`.
- **Activation:** with 8/8 locked the profile is **ARMED / PENDING** and never auto-fires. Pressing **COMMENCE DESCENT APERTURE** (or `Space`/`Enter`) runs three stages: BUILDUP (2.0 s) -> BREAKTHROUGH (0.8 s) -> SUSTAINED ACTIVE. These are aperture stages; the physical depth continues to integrate toward the 11,800 m target and does not jump there on activation.
- **Disengage:** **EMERGENCY ASCENT // BLOW ALL BALLAST** (or `Esc`) is always enabled; it clears all locks, cancels queued dialing and sounds, resets the simulation to surface depth and zero velocity, and returns to IDLE after the brief ballast-blow effect. This is a simulation reset, not a modeled ascent.
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

The historical issues and measurements remain recorded in `CHANGELOG.md`. The maintenance repairs distinguish target depth from actual depth, derive archive counts from the ten existing records, and refresh Saved Local Dives after successful saves and reload. Cancellation now clears pending preset/trim/settle work, restores surface telemetry, and resets active sound to its ambient state. The earlier infrastructure maintenance added the missing favicon and ignore rules.

Focused regression command from the repository root: `node scripts/check-bathyscaphe-regressions.js` (`--offline` runs deterministic module checks only). The deterministic checks pass; real-browser verification of these repairs is pending. The original `npm test` suite remains unchanged. Gallery status and the operator acceptance gate remain unchanged.
