# Changelog

All notable changes to SPLITTERLICHT are documented here. Format follows
Keep a Changelog; versions follow Semantic Versioning.

## [1.0.0] - 2026-09-03

**Built by:** Claude Fable 5.1 (reasoning effort 25, as exposed by the session harness).

### Added

- SPLITTERLICHT, Torkammer Neun at the Nachtwerk Kesselgrund: the catalog's
  first Expressionism entry in the artistic-register series.
- Fracture ring: seven shards that exist only once cracked out of the wall.
  Each lock is a two-step event (crack propagation along a jagged path from
  the chosen stair, then the shard splitting free with a flash and kicking
  outward). Idle the ring is a chalk outline; open it becomes a judder-rotating
  eye.
- Crooked two-flight staircase as the symbol selector (twelve invented angular
  marks); clicks during a running crack are queued.
- The room keels: rotate + skew of the whole set that grows per shard, lurches
  in steps during buildup, snaps the other way at breakthrough, judders while
  open, settles when walled up.
- Three-stage tear: AUFREISSEN buildup (2.4 s, shards shake and redden, hole
  darkens to vermilion, lamp gutters) -> breakthrough (0.7 s white bolt and
  flash) -> sustained open (yellow shards, rotating iris, pupil).
- ZUMAUERN disengage, reachable in every state. RIEGEL bolt interlock, drawn
  back by default, blocks stairs / scars / tear lever with a full-width banner.
- Five old scars on a tilted advertising column as quick dial: the wall
  reopens along a remembered fracture at roughly a third of hand pace, lands
  at ready, never fires by itself. One scar (the walled-up gate) fails after
  buildup: the wall holds.
- Protocol pad with seven slots, tilt (NEIGUNG), unrest (UNRUHE) and shard
  count readouts.
- Synthesized sound: tritone drone, crack crackle, fracture thud, cluster
  glissando buildup, noise-crash breakthrough with a dissonant stab, gated
  pulse while open, descending thuds for walling up, buzz for the bolt. Mute
  toggle in the corner chrome.
- Static server (`server.js`, port 8821) and a puppeteer-core harness
  (`npm test`, port 8841).

### Verified

- Operator hands-on confirmation (2026-09-03): the operator personally tested
  the build by hand after the automated run and confirmed it functional. This
  line was added after that testing took place, not at build time.
- `npm test`: 116/116 checks in headless system Chrome at build time. Hit-tested
  real mouse events on every control; no-auto-fire negative cases after both
  hand dial and scar dial; three activation stages measured pairwise distinct
  in a (luminance, warmth) crop of the ring (minimum pairwise distance 42.7);
  scar dial observed at 8 distinct lock counts over ~4.2 s; disengage while
  open, mid-scar, and after bolt-halt; both interlock block cases; dark route.
- Scale transform verified non-`none` at 1920x1080 (fit 1) and 3840x2160
  (fit 2).

### Creative status

- Closed without further iteration. The build is functionally complete and
  confirmed working, but leans harder into Expressionist horror and dread
  (Caligari-style film-set register) than a general "Expressionism" brief
  called for. The operator's reaction was mixed: not what they expected, but
  considered a legitimate result. Recorded as a creative-fit outcome, not a
  technical failure.

### Notes

- Composition reasoning: a Caligari-style room instead of ring-and-panel;
  column left, staircase climbing from floor onto wall, ring high-right in a
  leaning wall, switch box low-right, pad on the floor, and the room itself
  as a moving part. Core control clusters: the staircase and the three-lever
  switch box.
- Register: flat vector only. No gradients, shadows, textures, or material
  simulation. Only the formal technique of German Expressionism is used; no
  real film, set, artist, or figure is referenced.
- Name-collision check against sibling builds was not run in the build
  session (the session was scoped to this folder only).
