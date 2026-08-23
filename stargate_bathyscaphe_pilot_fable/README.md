# DSV-7 *Cerulean Lantern* — Pilot Console

Hadal Threshold Institute · fictional deep-sea submersible piloting console. An interactive, entirely client-side novelty site: fly a seven-waypoint descent profile by balancing ballast and trim into neutral-buoyancy holds, then commence the final descent to a Threshold ring and open the pressure-hull aperture.

## Run

```
node server.js          # → http://127.0.0.1:8747/
```

Any static server works; there is no backend. Preferences, pilot record and read archive entries persist in this browser's `localStorage` only.

## Verify

```
npm install             # puppeteer
node verify/run.js      # screenshots → verify/shots/, report → verify/report.md
```

## Layout

- `index.html`, `styles.css` — stage (1920×1080 design surface, scaled by a bare-number `--ui-scale`)
- `js/data.js` — vessel constants, glyphs, channels, profiles, archive, reference
- `js/sim.js` — phase state machine, lock dynamics, activation staging, telemetry model
- `js/viewport.js` — observation-sphere canvas renderer + crush-depth gauge SVG
- `js/audio.js` — synthesised Web Audio layers and events
- `js/ui.js` — controller: clusters, telemetry, panels, persistence, session log

Built by Claude Fable 5 (high reasoning). See `CHANGELOG.md` and `version.json`.
