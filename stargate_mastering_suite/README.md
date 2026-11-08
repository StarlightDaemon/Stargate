# Axiom Sound Labs — Quantum Mastering Array MK-IX

An interactive novelty portal-dialing website staged as an audio mastering console: the Quantum Mastering Array MK-IX at Axiom Sound Labs, a 10-channel Harmonic Patchbay running custom sonic glyphs from 32 Hz to 16 kHz. Patching a route means seating each channel's cable in turn across the Harmonic Channel Patchbay and the Master Transport & Summing Deck, watched over by a polar spectrum analyzer, a radial VU ring, and a central oscilloscope/Lissajous vectorscope. The 7-bus Master Summing Array only prints on a deliberate BOUNCE / PRINT MASTER; a completed patch just arms the deck. Six quick-dial session presets, split between calibrated broadcast stems and experimental overdriven routing, re-seat their cables through the array's own motorized patchbay rather than snapping in at once.

Everything here is fictional and fully client-side: no backend, no server process, no network calls, no real destinations.


## Shared verification dependencies — 2026-11-08

Browser verification uses the shared tools installed at the repository root. Run `npm ci --ignore-scripts` there before using this exhibit's verification commands, with system Chrome configured as required by the harness. Existing package commands and application assets are unchanged by this dependency maintenance.

Normal source preview uses the shared loopback server: `npm start` opens `http://127.0.0.1:8080`. Set `PORT` or pass `-- --port NUMBER` (also `-p`) to select another port; an explicit argument takes precedence. Invalid or occupied ports fail instead of selecting another interface or port. Only tracked public assets are served; development files, raw traversal and unsupported methods are refused.

`npm test` now owns both loopback comparison listeners and the browser. It runs the unchanged original suite through the qualification adapter, including public-asset and security probes. Run `npm ci --ignore-scripts` in this directory before this comparison; the retained `http-server` dependency supplies the historical package transport. Direct historical test files remain preserved as evidence, rather than the supported test entry point.

Source-serving qualification: hosted run `42512882276`, job `128829555760`, passed the full original suite on installed package and shared transports, public assets and cancellation observations. Built-artifact, sound and operator acceptance are separate; merge and deployment remain on HOLD.
