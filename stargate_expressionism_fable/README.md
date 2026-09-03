# SPLITTERLICHT

Torkammer Neun at the Nachtwerk Kesselgrund, 1921. A gate console in the register of German Expressionism: the address is not dialed, it is cracked out of a leaning black wall. Twelve angular marks sit on a crooked staircase; stepping on one sends a jagged fracture running across the floor and up the wall until a shard breaks loose from the ring and shows its mark. Seven shards and the wall is ready to tear. The whole room keels a little further with every shard, and a lever, never the seventh shard, tears it open.

**Status:** functionally complete and confirmed. The automated Puppeteer harness passed 116/116 checks at build time, and the operator has since personally tested the build by hand and confirmed it functional (2026-09-03).

**Creative status:** closed, no further iteration. The build leans harder into Expressionist horror and dread, in the Caligari film-set manner, than a general "Expressionism" brief called for. The operator's reaction was mixed: not what they expected, but accepted as a legitimate result. Recorded as a creative-fit outcome, not a technical defect.

**Built by:** Claude Fable 5.1 (reasoning effort 25, as exposed by the session harness).

## The register

This is the catalog's first Expressionism entry, in the artistic-register series. The visual language is taken from the German Expressionist film set and poster: skewed, non-orthogonal geometry, painted shadows as flat black wedges, jagged hand-cut lettering, stark color fields (black, bone, cadmium yellow, vermilion, a night green and a violet sky), bold black outlines, and a room that will not stand up straight. Everything is flat vector. There are no gradients, no soft shadows, no textures and no attempt to simulate any physical material.

Only the formal technique of the movement is used. No real film, set, artist, character, or historical figure is referenced or reproduced; every name and mark here is invented.

## What the ring does

The ring is seven shards that do not exist until they are broken out of the wall. Idle, it is a faint chalk outline. Each lock is a two-step fracture: a crack propagates from the chosen stair to the shard's edge (a jagged path drawn in over about a second), then the shard splits free with a white flash, kicks outward on its own axis, and shows the mark that was chosen. The room tilts with each shard. When the wall is torn open the hole inside the ring becomes an eye: a judder-rotating iris of black, vermilion, bone and yellow wedges around a jagged black pupil.

## How to dial

1. **Tread a stair.** Click any of the twelve treads on the crooked staircase. Each one is a mark. The crack runs, the shard breaks out. Clicks during a running crack are queued, not lost.
2. **Seven shards.** After the seventh shard the console reads BEREIT (ready) and stops. Nothing fires by itself.
3. **AUFREISSEN** (tear open) is the only trigger. Buildup: the shards shake and turn red as the room lurches and the lamp gutters, roughly 2.4 s. Breakthrough: a white bolt tears through the ring in a single flash. Open: the eye turns, the shards go yellow, the message strip names where you are.
4. **ZUMAUERN** (wall up) is the disengage. It is always available, in every state, including while open and mid-scar. The shards drop back into the wall.
5. **RIEGEL** (the bolt) is the safety interlock. It is drawn back by default. Thrown, it blocks the stairs, the scars and the tear lever with a full-width red RIEGEL VOR! banner and a buzz. It never blocks ZUMAUERN.

## Old scars (quick dial)

Five posters are pasted on the tilted advertising column. Each is a road the wall has been broken along before. Click one and the wall reopens along the old fracture: the same seven cracks and seven shards, visibly one after the other, but at roughly a third of hand pace, because an old crack reopens faster than a new one is cut. The scar lands at BEREIT exactly like a hand dial and still needs the lever. One scar, DAS VERMAUERTE TOR (the walled-up gate), runs the full buildup and then the wall holds: MAUER HÄLT, and the shards sit back.

## Composition

Not a ring-and-panel layout. The scene is a Caligari-style room seen from a crooked angle: a tilted advertising column on the left carries the scars; a two-flight staircase climbs from the bottom-left floor up onto the wall and is the symbol selector; the shard ring is set high-right, embedded in a leaning black wall under a hanging lamp; a tilted switch box with three painted levers sits low-right; a protocol pad lies on the floor between them. The room itself is a moving part: it rotates and skews around a point near the centre of the frame as shards lock, lurches in steps during buildup, and snaps the other way when the wall gives. Core controls are the staircase and the three-lever switch box; the scar posters are the only secondary control.

## Run

```bash
npm run serve
```

Serves the folder at http://localhost:8821/ with no dependencies (plain `node server.js`). Any other port: `PORT=9000 node server.js`.

## Test

```bash
npm install
npm test
```

`test/run-tests.mjs` drives the system Chrome headless through puppeteer-core on port 8841: cold-start state, scale transform at 1920x1080 and 3840x2160, hit-tested real mouse events on every control, a manual dial with a mid-crack screenshot, the no-auto-fire negative case, all three activation stages with a luminance/warmth crop proving they differ from each other, disengage while open, a second full cycle, rapid-click queueing, both interlock cases, a staged scar dial with mid-sequence screenshots, disengage and bolt mid-scar, and the dark route. Results go to `test/results.json`, screenshots to `test/shots/`.

Automated checks are necessary but not sufficient. Dispatched-event suites in this project have reported passes that did not hold up under real use. Hands-on operator testing is the real final check, and for this build it has been done: the operator tested it personally on 2026-09-03 and confirmed it works.

## Diagnostics

`window.__splitterlicht.state()` returns the live state (phase, locked marks, queue, bolt, scar progress, tilt, unrest, message, alert).

## Files

- `index.html` - the painted set (inline SVG) and the HTML overlays
- `style.css` - flat palette, skewed layout, levers, posters, treads
- `app.js` - ring geometry, crack propagation, state machine, tilt, sound
- `server.js` - static server
- `test/run-tests.mjs` - verification harness
- `CHANGELOG.md`, `version.json`, `package.json`, `.gitignore`
