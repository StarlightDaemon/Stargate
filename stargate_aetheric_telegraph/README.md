# HM Imperial Aetheric Telegraph & Pneumatic Dispatch Registry

An interactive Victorian technical drafting instrument panel and glowing vector schematic portal ring dispatch terminal.

> **Status Note:** Core operational loop (manual coordinate dialing, meridian escapement locking, safety hold interlock, conduit ignition/vortex, and emergency vent disengage) has been verified and confirmed functional through direct operator testing. Minor technical rough edges remain unaddressed as this build is closed.

## Architecture
- **Vector Patent Schematics:** Glowing vector linework, patent annotations, and annular vernier scales on a dark drafting board plane.
- **The Ring as a Functioning Instrument:** Multi-annular differential chronograph with 9 radial Escapements and central aetheric singularity.
- **16 Original Meridian Glyphs:** Vector drafting schematics with imperial patent registrations.
- **Controls (2 Clusters):**
  1. *Meridian Dialing Array:* 16-patent glyph matrix.
  2. *Dispatch Throttle & Interlock Manifold:* Boiler Safety Interlock toggle, Primary Dispatch Throttle, and Emergency Steam Vent / Disengage.
- **Procedural Sound Engine:** 100% Web Audio API procedural synthesis (solenoid thuds, telegraph clicks, governor whistles, steam hisses, and arc discharges).

## Running Locally
```bash
node server.js
```
Navigate to `http://localhost:8420`.

The command now launches the repository's shared loopback-only preview server;
keep this exhibit inside the Stargate checkout. `PORT` overrides 8420. Public
tracked assets are served; development files and traversal requests are denied.
Run `node run_tests.js` after installing the repository root's locked tools with
`npm ci --ignore-scripts` from that root. The original suite starts and closes its own shared preview on a free
port. `STARGATE_TEST_URL` can select an already-running test server.
The 2026-11-07 cancellation repair and serving migration still require operator
hands-on acceptance; the historical status note above does not qualify them.


## Shared verification dependencies — 2026-11-08

Browser verification uses the shared tools installed at the repository root. Run `npm ci --ignore-scripts` there before using this exhibit's verification commands, with system Chrome configured as required by the harness. Existing package commands and application assets are unchanged by this dependency maintenance.
