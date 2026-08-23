# DSV-7 *Cerulean Lantern* — Pilot Console

Hadal Threshold Institute · fictional deep-sea submersible piloting console. An interactive, entirely client-side novelty site: fly a seven-waypoint descent profile by balancing ballast and trim into neutral-buoyancy holds, then commence the final descent to a Threshold ring and open the pressure-hull aperture.

## Run

```
node server.js          # → http://127.0.0.1:8747/
```

Any static server works; there is no backend. Preferences, pilot record and read archive entries persist in this browser's `localStorage` only.

## Verify

```
npm install                      # puppeteer
node verify/run.js               # build-session suite: screenshots → verify/shots/, report → verify/report.md
node verify/closeout.js          # 2026-08-23 close-out suite: screenshots → verify/shots/closeout/, log → verify/closeout.log
node verify/closeout_stages.js   # bracketed three-stage capture → verify/closeout_stages.log
```

## Verification status (2026-08-23)

**Automated verification only — not yet confirmed by direct operator testing.** An automated Claude session re-ran the build from a fresh server with a newly written Puppeteer harness using real dispatched pointer events, and found it **fully working**: (a) a full manual dial ends `pending` and does not auto-fire — PASS; (b) buildup / breakthrough / sustained-active are visually distinct, screenshot-compared — PASS; (c) quick-dial presets replay progressively over ~8 s, not instantly — PASS; (d) two engage → disengage → redial cycles — PASS; (e) hull-integrity lockout released on fresh load — PASS; (f) all five tabs and the operator reference show real content — PASS; (g) background fills 800×1200, 1600×600 and 1280×1024 with no unstyled gaps — PASS; zero console errors. Details and screenshots: `CHANGELOG.md`, `verify/shots/closeout/`, `verify/closeout.log`. The operator has not personally clicked through this build.

## Layout

- `index.html`, `styles.css` — stage (1920×1080 design surface, scaled by a bare-number `--ui-scale`)
- `js/data.js` — vessel constants, glyphs, channels, profiles, archive, reference
- `js/sim.js` — phase state machine, lock dynamics, activation staging, telemetry model
- `js/viewport.js` — observation-sphere canvas renderer + crush-depth gauge SVG
- `js/audio.js` — synthesised Web Audio layers and events
- `js/ui.js` — controller: clusters, telemetry, panels, persistence, session log

Built by Claude Fable 5 (high reasoning). See `CHANGELOG.md` and `version.json`.
