# DSV-7 *Cerulean Lantern* — Pilot Console

Hadal Threshold Institute · fictional deep-sea submersible piloting console. An interactive, entirely client-side novelty site: fly a seven-waypoint descent profile by balancing ballast and trim into neutral-buoyancy holds, then commence the final descent to a Threshold ring and open the pressure-hull aperture.

**Persistence:** `localStorage` only, under the `lantern.v1.` prefix: `prefs` (mood, density, motion, master volume, audio layer toggles, auto-audio), `history` (the pilot dive record), `viewed` (archive entries already read) and `sessions` (a per-device session counter). Clearable from Settings.

## Run

```
node server.js          # → http://127.0.0.1:8747/
node server.js 8750     # optional positional port; takes precedence over PORT
```

The launcher delegates to the repository's shared loopback preview server. It serves tracked public assets, keeps development files private, rejects unsupported methods and handles malformed URLs without crashing. The optional positional port takes precedence over `PORT`; the default remains 8747. Launch from this repository checkout. There is no backend. Preferences, pilot record and read archive entries persist in this browser's `localStorage` only.

## Verify

```
npm install                      # puppeteer
node verify/run.js               # build-session suite: screenshots → verify/shots/, report → verify/report.md
node verify/closeout.js          # 2026-08-23 close-out suite: screenshots → verify/shots/closeout/, log → verify/closeout.log
node verify/closeout_stages.js   # bracketed three-stage capture → verify/closeout_stages.log
```

## Modernization verification (2026-11-08)

Hosted job `128820919093` compared all nine tracked public assets through the original and shared handlers with identical bytes. The unchanged close-out suite passed 185/185 in both modes; the original smoke diagnostic completed. The build suite remains 132/133 because its literal `## v1.0.0` heading expectation conflicts with the documented September normalization to `## [1.0.0]`. The bracketed stage suite remains 23/24: its breakthrough white-rim predicate measured 0% near-white samples against a required >60% through both handlers. All other original predicates passed, with no page errors. Shared screenshots show distinct buildup, breakthrough and sustained-active states; paired legacy screenshot review is pending.

This qualifies handler consolidation with documented baseline failures; it is not a full acceptance PASS. Original suites, client assets, attribution and release version are preserved. Merge and deployment remain on HOLD, and operator confirmation is still outstanding.

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
