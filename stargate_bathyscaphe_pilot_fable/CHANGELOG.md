# Changelog — DSV-7 Cerulean Lantern Pilot Console

## v1.0.0 — 2026-08-23

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
