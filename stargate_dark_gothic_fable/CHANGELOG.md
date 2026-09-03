# Changelog

All notable changes to **WIDDERSHINS — The Gatehouse at Corvane Hollow** are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-09-03

**Built by:** Claude Fable 5.1 (`claude-fable-5-1`), the runtime identity reported to the build session. Reasoning level: not observable from inside the build session, so not recorded rather than guessed.

**Status:** closed, complete, no further iteration planned (2026-09-03). Not a defect close-out — see "Verified" and "Closed" below.

### Verified
- Automated Puppeteer suite: 109/109 checks passed, every control hit-tested at its rendered position with real dispatched events, catches timed from outside the page, widdershins direction checked per turn, stages measured from screenshots.
- Direct hands-on testing in an interactive browser confirmed the core interactions work: ward selection turns the fence and catches the ward at the lantern; a remembered-hand quick-dial catches all six wards one at a time and lands unbarred; RING THE BELL runs the three-stage sequence (buildup → breakthrough → sustained open) and BAR THE GATE returns the console to idle. The operator judged the build functionally solid, with good aesthetics and working tooling.
- One documented caveat: a screenshot taken from a throttled interactive browser pane about four seconds after the bell still showed the gate bar mid-fade, while headless Chrome and the pane's own computed styles a few seconds later showed the transition completing (bar opacity 0, translated fully). Resolved as a headless-vs-interactive-pane timing artifact — environment noise, not a build bug. No change was made for it.

### Closed
- Closed without further iteration on a creative and genre-fit judgment by the operator: digitizing an inherently supernatural subject through the project's standard glowing-schematic register undercuts the theme itself for this gallery's purposes. This is a conceptual call, not a defect; nothing here needs fixing.
- The local dev server left running at the end of the build session (port 8797) was stopped and the port confirmed free before this entry was committed.

### Added
- **Dark Gothic horror register, digital-native.** Haunted-manor gatehouse: witch-fire green and moonlight blue over near-black, one guttering amber candle in the keeper's lantern as the sole warm point, fog banks that roll and thin across the base. Everything is flat fill, stroke, and glow — spectral line-work standing in for wrought iron, ghost-light scrollwork for the gate leaves, drifting soft light for fog. No material is simulated. Deliberately distinct from the reverent, jewel-toned stained-glass cathedral register elsewhere in the catalogue: dread and shadow rather than reverence and warmth.
- **Fence-ring as a working instrument.** Thirteen pickets with finials and sigil plates on two rails. Pressing a ward turns the whole fence widdershins (the only direction it will go) until that finial reaches the lantern, ratcheting as it goes; the finial takes flame with a candle flare; a ghost-chain link binds it to the last ward caught along the inner rail; the wardstone fills. A finial already at the lantern goes the full round.
- **Original lock mechanism:** turn widdershins → take flame at the lantern → bind with the chain. Hand pace 200°/s with an 0.8 s floor plus a 0.5 s take (measured 1.34–1.40 s per adjacent ward, 2.42 s for the full-round case); remembered pace 420°/s with a 0.35 s floor plus a 0.25 s take.
- **Three-stage bell:** buildup (2.4 s: three tolls, accelerating spin, gathering witch-light, thrashing candle, rising green fog, dimming moon, rattling leaves), breakthrough (0.8 s: leaves fling open on hinges, pale flash, sixteen rays, candle blown sideways, raven), sustained open (counter-turning ghost-light wheels, inward wisps, breathing rays, slow widdershins drift, drone, thinning fog). Gate luminance on the verified run: unbarred 15.4 · buildup 51.8 · breakthrough 236.7 · open 123.0 (every pair ≥ 25 apart).
- **No auto-fire.** Six caught wards lift the bar and leave the gate unbarred; only RING THE BELL proceeds. Verified as a negative case with real events (2.5 s hold after the sixth catch, by hand and by remembered hand).
- **BAR THE GATE always reachable:** from unbarred, mid-remembered-hand (cancels remaining turns), mid-buildup (never reaches breakthrough), and from an open gate. Two full dial → bar → redial cycles verified with hit-tested events.
- **Salt line** interlock, unlaid by default; laid, it refuses turns, remembered hands, and the bell with a blinking warning and an iron refusal, the warning holding until the salt is swept away.
- **Five remembered hands** (quick-dial) with an in-universe justification (the iron remembers a turning it has done before and does not hesitate, but cannot skip a ward). Verified: 6 wards in 5.03 s vs 9.2 s by hand, every step ≥ 749 ms apart, landing unbarred with no auto-fire.
- **One dark road** (NOBODY'S PARISH): rings and opens normally, then something knocks back — leaves slam, candle out, every ward dark, candle relights.
- **Procedural sound** (Web Audio, no samples): inharmonic distant bell, stick-slip iron creak while turning, ratchet ticks, whoosh-and-clank take, raven, hinge shriek, iron clang, salt refusal, candle snuff, wind bed with glass whistles, open-gate drone. Ambience starts on the first gesture; a sound toggle mutes.
- **Gate-book ledger and log**, gate-book overlay, favicon, viewport fit via a JS-computed bare `--fit` ratio (verified 1 at 1920×1080, 2 at 3840×2160; stage transform confirmed not `none` at both).
- **Puppeteer harness** (`npm test`, puppeteer-core against system Chrome, own server on port 8817): 109 checks, all hit-tested with real dispatched events, catches timed from outside the page, widdershins direction checked per turn, stages measured from screenshots; 15 screenshots and `test/last-run.log`.

### Composition
Gatehouse stack rather than hero-and-wings: large ring left of centre under the lantern with fog at its base; vertical picket line; gate-book and bell-rope column on the right with the rope hanging from the page top to the bell-pull; keys on hooks below; status on the threshold under the salt line. No left wing, no bottom deck.

### Content notes
Atmospheric horror only — no gore, viscera, or depictions of death. Draws on generic European folklore (widdershins, salt lines) and the Gothic horror literary tradition; no living sacred or ceremonial tradition, no real political content.

### Known issues
- None. Neither the automated harness nor the operator's hands-on testing found a defect. The one caveat above (interactive-pane transition timing) was resolved as environment noise.
