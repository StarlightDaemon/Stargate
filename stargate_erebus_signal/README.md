# Erebus Signal Intercept

An interactive novelty portal-dialing website built as the Erebus Signal Intercept terminal, a signal-degradation aesthetic worked in CRT scanlines, tracking artifacts, and chromatic aberration. Dialing runs a 9-chevron ring sequence with visually alternating rotation alignment, driven from the UPLINK COMMAND cluster's 4-symbol manual input, with contextual audio synthesized for every stage of the intercept. Six pre-configured quick-dial frequencies span three security tiers, and an integrated SECURITY OVERRIDE (Signal Lockout) subsystem can reject an unauthorized connection outright. A built-in Operator Reference manual documents the terminal end to end.

The published experience is fictional and fully client-side, with no production backend or real destinations.

## Local preview

From this directory, run `node server.js`, then open `http://127.0.0.1:8000/`.
The development launcher uses the repository's shared preview tool, so retain the
parent repository when developing locally. `PORT` overrides the default 8000.
Only tracked public assets are served, using loopback, GET/HEAD and the shared
path-containment policy. The deployed static exhibit needs no server process.

For the security and historical/shared behavior comparison, run
`node scripts/check-erebus-security.js` from the repository root with the browser
test environment described in `scripts/MAINTENANCE.md`. The original `test.js`
flow is retained; the comparison also asserts its seven expected diagnostic values.
This is preservation evidence, not full functional or operator acceptance.
