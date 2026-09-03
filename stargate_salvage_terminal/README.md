# BONEYARD

Aperture Bench 3 at the Halvard Reach breakers' yard: a portal-dialing console the yard crew rebuilt three times out of parts from three different hulls. This is the catalog's first Low Sci-Fi entry. Nothing here is sleek. The collar is a used instrument with a dead segment taped over, a dot-matrix log with a failing ribbon, a reel deck that logs every address to tape, a small read scope, a line meter, and a rack of hand-labelled cassettes holding the routes the crew trusts.

Status: v1.0.0, built 2026-09-02, closed out 2026-09-03. Automated Puppeteer bench 77/77 on the committed code, four runs in total; the fourth ran during the close-out session on 2026-09-03 at 10:14 UTC and covers the alarm keyframe change. **Not operator-verified.** No human has dialed this build by hand, and no human has watched it render live in a browser. Automated passes in this project have repeatedly failed to hold up under real operator testing, so treat it as unconfirmed until someone actually dials it.

Built by Claude Fable 5.1 (reasoning level: low, effort setting 25 as observed in-session).

## How to dial

1. **Select & seat.** Turn the rotary selector (click either half, or use the arrow buttons or arrow keys) until the readout shows the mark you want. Flick **SEAT**. The read head sweeps to the mark, the scope settles on its trace, then one of the six clamping dogs leaves the park bay, travels the outer rail to the mark and drops. The mark burns in on the collar.
2. Repeat for six marks. Six dogs down lights **READY**. Nothing fires by itself.
3. **Breach / drop.** Lift the striped cover by its hinge bar, then throw **BREACH**. Buildup winds the reels up and fills the collar with dirty static, the breakthrough whites the screen out with a roll-bar tear, and the sustained carrier is a cold churning field. **DROP** lifts every dog, sends the head home and is always available.

**Cassettes** in the rack are known routes. Slot one and the deck plays the address back at transport speed: the rail servo is driven from the tape's timing track, so it never waits on a read confirmation. It is faster than a hand and never instant. One tape is scrapped: it dials, builds up, breaks through, then finds no carrier and drops itself.

**Yard lockout** (bottom left, off by default) blocks seating, tapes and breach. Engaging it mid-sequence halts the sequence with one alarm. The red lamp and the red frame flash until you release it.

## Mechanism

Dog and rail. The ring does real work per mark: a read-head sweep, a scope settle, a dog travelling the outer rail in stepped increments, a clamp drop, and a phosphor burn-in. Two control clusters carry the whole core loop: *Select & seat* and *Breach / drop*. Everything else on the bench is telemetry or secondary.

## Rendering register

Screen-native wear only. No simulated metal, rust, wood or grime. Age is rendered with scanlines, animated grain, a CRT vignette, phosphor glow, a burnt-in ghost route on the collar, dead pixels on the scope, colour fringing on the nameplate, a dropped ribbon character in the log now and then, and hand-written tape labels and warning stickers as flat shapes.

## Composition

The collar sits big and off-centre on the left. The bench modules cluster to the right in an irregular grid with slight rotations, as if bolted on at different times. The two core control clusters sit along the bottom edge where an operator's hands would be. No top bar, no symmetric wings.

## Run

```bash
npm run serve
```

Serves at http://127.0.0.1:8733/ (set `PORT` to override). Static files, no build step, no network. This build has no entry in the repository's `.claude/launch.json`, so the in-app preview cannot start it by name; start it from a terminal with the command above (or `node server.js` in this folder) and open the URL in a browser.

```bash
npm install
npm test
```

The bench spawns its own server on port 8734, drives system Chrome headless with real hit-tested mouse events, writes screenshots to `test/screenshots/` and a summary to `test/results.json`. Set `CHROME_PATH` if Chrome is somewhere unusual.

## Known limitations

- Sound starts on the first pointer press anywhere on the page, as browsers require. Until then the console is silent.
- The stage is a fixed 1920x1080 layout scaled to fit. Below roughly 900px wide the hand labels get small; there is no separate mobile layout.
- Visual evidence so far comes from headless Chrome screenshots only. The in-app Browser pane used during the build reported a hidden 0x0 viewport, so the page was never watched live during the build or its close-out session.
- `preview.png` is a cold-start idle frame from headless Chrome (about 2 MB at 1920x1080). The builder checked it by opening the file, not by comparing it against a live render.
- The tape counter and log timestamps are in-universe tape units, not real time.

All destinations, names and iconography are fictional and original.
