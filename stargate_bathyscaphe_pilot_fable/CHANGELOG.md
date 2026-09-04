# Changelog — DSV-7 Cerulean Lantern Pilot Console

## Catalog maintenance pass — 2026-09-04

**Performed by:** Claude Fable 5.1, in catalog-wide maintenance commits of 2026-09-04, independently of the build session. Entry backfilled 2026-09-04 by Claude Fable 5.1 from the commit diffs. Version number left unchanged; whether any item warrants a bump is for operator review. No runtime file was touched.

- Declared client-side persistence: `"persistence": "localStorage"` added to `version.json` and a **Persistence:** line added to the README naming the `lantern.v1.` prefix and its `prefs` (mood, density, motion, master volume, audio layer toggles, auto-audio), `history` (pilot dive record), `viewed` (archive entries read) and `sessions` (per-device session counter) keys, read from the storage code. No storage behaviour changed.
- `version.json` restructured to the catalog's common shape: `version`, `model` and `built` at top level, with `name`, `title`, `institute` and `architecture` preserved verbatim under a `meta` object. Version value unchanged.
- This changelog's release heading was changed from `v1.0.0 — 2026-08-23` to `[1.0.0] - 2026-08-23`, the bracketed Keep-a-Changelog form used by the rest of the catalog. No other line of the file was altered.

## Close-out re-verification — 2026-08-23

**Performed by:** an automated Claude session (Claude Fable 5), independently of the build session, using a freshly written Puppeteer harness (`verify/closeout.js`, `verify/closeout_stages.js`). **This is automated verification only — the operator has NOT yet personally clicked through this build, and nothing here should be read as operator confirmation.**

**Outcome: fully working for every check below.** 185/185 checks in the main pass and 24/24 in the bracketed stage re-capture; zero console errors, zero page errors, zero failed network requests across the whole run. No code was changed in this session; `version.json` stays at 1.0.0.

Method: a fresh `node server.js 8747` (HTTP 200 confirmed with curl), headless Chromium at 1920×1080, `localStorage` cleared. Every interaction is a real dispatched pointer event (`page.mouse` at the hit-tested centre of the rendered bounding box, `elementFromPoint` confirmed to resolve to the target). A `MutationObserver` on `body[data-phase]` recorded every phase transition. Internal state was read only to corroborate screenshots. Evidence: `verify/shots/closeout/*.png`, `verify/closeout.log`, `verify/closeout_stages.log`.

| Check | Result | Evidence |
|---|---|---|
| (a) Full manual dial does not auto-fire on the 7th lock | **PASS** — after the 7th real glyph click locked, phase was `pending`, COMMENCE read "ARMED — PILOT ACTION REQUIRED", aperture 0, ring glow 0; still identical 3.8 s later (0.05 % pixel drift, ambient animation only). The phase observer saw only `idle > locking > pending` until COMMENCE was clicked; buildup began 101 ms after that click. | `02a_after_7th_lock_immediate.png`, `02b_after_7th_lock_plus_3s_still_unfired.png` |
| (b) Three-stage activation is visually distinct | **PASS** — BUILDUP (frame darker than pending, 27.9 vs 33.5 mean luminance; "FINAL DESCENT / DESCENDING"), BREAKTHROUGH (white flash rim on the sphere, 96 % of rim samples near-white; frame luminance 54.1; "APERTURE OPENING"), SUSTAINED ACTIVE (cyan rim, 0 % white; luminance 40.5; "RING HOLD · ACTIVE" with hold timer). Pairwise pixel diffs 49.7 % / 33.5 % / 28.8 %; SHA-1s all differ. Breakthrough capture was page-clock bracketed at +4 ms…+632 ms inside the 905 ms stage. | `03_stage1_buildup.png`, `04_stage2_breakthrough.png`, `05_stage3_sustained_active.png`, `03b/04b/05b_*_bracketed.png` |
| (c) Quick-dial preset auto-dials progressively | **PASS** — TL-02 replay clicked in the DIVE COMPUTER panel: 0 waypoints at +0.4 s, 1 at +1.5 s, 2 (locking) at +3.0 s, 3 (locking) at +4.5 s, 5 at +6.0 s, pending with the full 7-glyph sequence at +8.1 s; depth monotonic 0 → 700 → 1802 → 2650 → 3800 m. Ends `pending` and stays pending 3 s later — replay never commences descent. | `12_replay_t0400ms.png` … `17_replay_pending.png` |
| (d) Disengage / redial cycle ×2 | **PASS** — engage → EMERGENCY ASCENT → surfaced (idle, profile cleared, aperture 0) → manual redial of a different 7-glyph profile → pending (not auto-fired) → engage → active → ascent → second manual redial → pending → engaged a third time to confirm. | `06_cycle1_disengage_ascending.png`, `07_redial1_pending.png`, `08_cycle2_active_abyssal_plain.png`, `09_redial2_pending.png`, `10_cycle3_active_fracture_terrace.png` |
| (e) Safety interlock defaults to released | **PASS** — on fresh load the HULL-INTEGRITY LOCKOUT checkbox is unchecked, `sim.lockout === false`, label reads RELEASED, no `engaged` class; unchanged after a second reload. | `00_cold_start_1080p.png` |
| (f) Every secondary tab / panel shows real content | **PASS** — ARCHIVE (2 657 chars, 233 visible elements; clicking a record populates the detail pane), VESSEL (111 SVG elements, 107 visible elements), DIVE COMPUTER (1 864 chars, 7 presets), SESSION LOG (8 906 chars), SETTINGS (1 059 chars), and the ? OPERATOR REFERENCE overlay (2 556 chars). Each opened by a real tab click and closed by a real click on its ✕. No blank panels. | `18_panel_*.png`, `19_operator_reference.png` |
| (g) Background fills non-16:9 viewports | **PASS** — 800×1200 (tall), 1600×600 (wide) and 1280×1024: `#ocean-bg` covers the full viewport, 350–448 sampled pixels along all edges and through the letterbox/pillarbox bands contain 0 white and 0 bright (L > 120) pixels, brightest edge sample L = 54, no scroll overflow. | `20_viewport_800x1200_tall.png`, `21_viewport_1600x600_wide.png`, `22_viewport_1280x1024.png` |
| Console / page errors | **PASS** — 0 errors, 0 warnings, 0 failed requests. | `closeout.log` |

Harness note (not an app issue): the first pass flagged one check because a 1080p PNG encode (~0.6–0.9 s) outran the 0.9 s breakthrough stage before the *post*-capture state read; the image content already showed the breakthrough frame. The check was replaced by page-clock bracketing plus an image-content test (the breakthrough-only white rim), which passes. Also noted: a stale `node server.js 8747` (pid 7988) from the build session was still running on start-up; it was stopped and a fresh server started for this pass, then stopped again.

## [1.0.0] - 2026-08-23

**Built by:** Claude Fable 5 (high reasoning)

Initial release of the Hadal Threshold Institute pilot console for the bathyscaphe DSV-7 *Cerulean Lantern*.

### Identity
- Deep-sea submersible piloting HUD built around a 2.10 m acrylic observation sphere. The crush-depth gauge is the ring framing the sphere (0–12 000 m, rated 11 000 m, red band above).
- 16 original strata glyphs (Kelp Shelf → Threshold Floor) form the descent-profile alphabet; 7 waypoints per profile; 10 trim channels (4 main ballast, 2 trim, 2 vertical thrusters, 2 horizontal thrusters).

### Core loop (two clusters)
- **DESCENT PROFILE** — select seven strata in increasing depth. Each selection floods ballast, overshoots, and settles through a damped thruster/trim correction into a neutral-buoyancy hold at the exact depth (the lock).
- **HELM** — COMMENCE FINAL DESCENT (only activation trigger; never auto-fires), EMERGENCY ASCENT / blow all ballast (never disabled), hull-integrity lockout (released by default).
- Three-stage activation: BUILDUP (2.2 s, accelerating descent, light fading, hull load climbing) → BREAKTHROUGH (0.9 s, ring responds, aperture iris opens, flash + crescendo) → SUSTAINED (ring hold, drone, live telemetry, hold timer).

### Expanded systems
- Dive computer quick-dial: 4 verified profiles + 3 experimental routes, replayed waypoint-by-waypoint at processor speed (850 ms per lock vs 2 600 ms manual), ending PENDING.
- Cross-referenced dive archive: 50 records across five types (dive, crew log, incident, discovery, maintenance) with forward references and computed backlinks; read entries persisted.
- Vessel cross-section: live ballast fills, trim transfer, thruster spin, water-column position, hull load, attitude.
- Live telemetry with physically linked relationships (pressure → hull load, strain, compression, crush margin; depth → water temperature, light, density; thruster use → battery).
- Settings: five colour moods, display density, motion intensity, four synthesised audio layers + master, persisted-data wipe.
- Session log: timestamped record of the visitor's real actions.
- Web Audio: deep-water ambience, electrical hum, scrubber fan, hull body tone, flood hiss, vent, thruster whine, creak, groan, hold-confirm, buildup swell, breakthrough boom/chord, sustained drone, ballast blow, lockout alarm. No sonar/acoustic-detection sounds.
- localStorage persistence (`lantern.v1.*`): preferences, pilot record, read archive entries, device session count.

### Verification
- Puppeteer suite in `verify/run.js`: real pointer events hit-tested at rendered positions, negative auto-fire test, lockout default, three-stage screenshots, replay sequence screenshots, two full dial/disengage/redial cycles, every secondary panel screenshotted, 1080p + 4K + non-16:9 background-fill checks.
