# Changelog

All notable changes to BONEYARD are documented here. Format follows Keep a Changelog.

## [1.0.0] - 2026-09-02

**Built by:** Claude Fable 5.1 (reasoning level: low, effort setting 25 as observed in-session)

### Added

- First release. Low Sci-Fi register: a salvaged, thrice-rebuilt aperture console at a breakers' yard.
- Collar with 16 stencilled berth marks, one dead segment (seg 13, hatched and taped over, never seatable) and a faint burnt-in ghost route.
- Dog-and-rail locking mechanism: read-head sweep, scope settle, dog travels the outer rail in stepped increments from the park bay, clamp drop, phosphor burn-in. Six dogs down = pending.
- Covered BREACH switch with an always-clickable hinge bar. Three-stage activation: buildup (2.6 s, reels wind up, warm sparse static, pulse chases the seated marks), breakthrough (white-out flash, roll-bar tear, thump), sustained carrier (cold churning static, dropout lines).
- DROP, always reachable, lifts every dog and sends the head home from any state.
- Reel deck with tape counter, REC/PLAY/RUN lamps and loaded-cassette readout. Dot-matrix log strip with a failing ribbon. Read scope with phosphor persistence. Line meter.
- Cassette rack: four good routes and one scrapped route that collapses after breakthrough with NO CARRIER and auto-drops. Playback is per-mark at deck speed, visibly staged, faster than hand pace, never instant.
- Yard lockout, released by default. Blocks seat, tape and breach with a flashing lamp, red frame flash, buzzer and log line. Engaging mid-sequence halts with one alarm.
- Sound design without chimes: mains hum, static bed, rail-servo whine, relay clack, dog clunk, buzzer, breakthrough thump. Speaker toggle.
- Fixed 1920x1080 stage scaled with a JS-computed bare custom property. Corner credit outside the transform subtree.
- Puppeteer bench (`npm test`): real hit-tested mouse events at rendered positions, staged-motion screenshots during manual and tape dialing, aperture luminance/warmth crop proving the activation stages differ, two full dial/drop/redial cycles, no-auto-fire negative case, covered-switch negative case, lockout cases, dead route, rapid-input queueing, fit check at 1080p and 4K.

### Verification (automated only)

- Automated bench, four runs on the build machine. Run 1: 73/77 (the four failures were harness and tuning issues: a log-text check tripped by the deliberate dropped-ribbon character, a luminance crop reading a hidden canvas, tape pace only marginally faster than hand pace, and a favicon 404 counted as a page error). Run 2 after fixes: 77/77. Run 3 on 2026-09-03 (UTC 05:16): 77/77. Run 4 on 2026-09-03 (UTC 10:13 to 10:14), during the close-out session, on the committed code at `f2599504` with no source changes in the working tree: **77 passed, 0 failed**, recorded in `test/results.json` (that file is gitignored, so it exists only on the machine that ran the bench).
- Alarm keyframes were changed after run 2 so both alarm animations alternate between two lit states instead of dark/lit (a still frame could otherwise catch the lamp dark). That change is part of the single v1.0.0 commit, so runs 3 and 4 both exercised it; run 4 is the one performed after the doubt about run 3 was raised, and it passed.
- Screenshots reviewed by the builder from the bench: idle, dog mid-rail (manual), pending, lockout alarm, buildup, breakthrough, active, after drop, tape mid-rail, collapse, 4K idle. Run 3 aperture crop: pending luminance 17, buildup 26 (warm tint), breakthrough 228, active 87 (cold tint). Run 4 aperture crop: pending 17.3, buildup 27.8 (warmth 8.7), breakthrough 227.9, active 83.5 (warmth -24.2). Run 4 tape pace: mean 654 ms per mark, max 792 ms, against a hand mean of 1736 ms; breakthrough reached 2624 ms after the throw.
- Fit transform verified non-"none" at 1920x1080 and 3840x2160 in headless Chrome.
- `preview.png` recaptured 2026-09-03 (UTC 10:14) during the close-out session with the repository's shared `scripts/capture-previews.js` (1920x1080 cold-start idle, 2005556 bytes, replacing the 2026-09-02 capture). The builder opened the new file and checked it: idle collar with HOOK selected, seg 13 taped as dead, six dogs parked in the bay, reel counter at 0000, no cassette loaded, breach cover closed, lockout and speaker off, corner credit present.
- Dev server checked live during close-out: `node server.js` started on 127.0.0.1:8733, and `curl -i http://127.0.0.1:8733/` returned `HTTP/1.1 200 OK` with `Content-Length: 7426` at 10:14:41 GMT. It was left running at the end of the session. This shows the server serves the page; it does not show the page rendering correctly for an operator.
- Content-safety grep of the build's own files for local paths, usernames and sibling folder names: clean.
- **Not operator-verified.** No human has dialed this build by hand as of this entry or as of the close-out session on 2026-09-03. The in-app Browser pane used during the build reported a hidden 0x0 viewport, so the page was never watched live. Automated passes in this project have repeatedly failed to hold up under real operator use; this entry should not be read as "working" until an operator confirms it and records that here.

### Known issues

- None confirmed by hands-on use, because there has been none. Anything found by an operator should be recorded here before the gallery status is decided.
