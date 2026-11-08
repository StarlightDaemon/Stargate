# Aethel-Ring Collider (ARC) — Synchrotron Inversion Control

An interactive novelty portal-dialing website built around the Aethel-Ring Collider (ARC), the synchrotron control room of the Aethelgard High-Energy Inversion Laboratory (AHEIL). Dialing means steering six transverse-lattice dipoles into lock, one at a time, around a 16-sector superconducting bending-magnet ring, with the circulating relativistic bunch and its synchrotron radiation rendered live on the beam channel. Locking the sixth sector only arms COLLISION ARMED / PENDING — the operator still has to trigger the beam, and EMERGENCY BEAM DUMP is reachable at every stage. A Quench Protection interlock, released by default, blocks injection with trip banners and cryogenic alarms when engaged. The Collision Target Registry carries fourteen calibrated destinations across validated leptonic, heavy hadronic, and exotic singularity tiers.

Everything here is fictional and fully client-side: no backend, no server process, no network calls, no real destinations.

## Optional local development preview

From this directory in the repository checkout, run `node server.js`. The preview
binds only to `127.0.0.1`, defaults to port 3042, and accepts `PORT` overrides
(including `PORT=0` for an available port). Keep the parent repository tools
available. Only tracked public assets are served; traversal and development
files are denied, and only GET/HEAD are accepted. The published application
remains static and independent of this development tool.

The repository's `scripts/check-synchrotron-security.js` compares historical and
shared serving and enforces all twelve predicates in the unchanged original
suite. It uses `STARGATE_PUPPETEER_MODULE` and `PUPPETEER_EXECUTABLE_PATH` for the
existing test environment; evidence goes to ignored `test/` output. CI uses the
already-qualified browser dependency and keeps Chrome's sandbox enabled.

Preservation checks retain the existing missing favicon and the displayed
`v1.1.0` versus metadata `1.1.1` discrepancy. They do not establish full sound,
responsive, three-stage visual or hands-on operator acceptance.
