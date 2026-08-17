# The Hollowbeck Six — a lych-ring

An interactive novelty website in a **low-magic** register: not sorcery, just
an old practice that works if you do it properly. Hollowbeck's church tower
keeps a ring of six bells — Lark, Tansy, Dole, Mattock, Hobb, and **Grief**,
the tenor. Ring a *road* (a change of the five treble bells, closed on Grief)
true, and the tower door at the head of the stair stops giving onto the stair:
it gives onto another parish's lych-gate. The roads are painted on the peal
board. One of them is struck through. Leave it that way.

Everything is fictional and fully self-contained: no backend, no network
calls, no frameworks — plain HTML, CSS, and JavaScript modules. All parishes
are invented.

## Running it

Serve the folder with any static server (ES modules need HTTP):

```
python -m http.server 8217      # then open http://localhost:8217
```

## How to work the tower (in-universe)

**The patient way — ringing (7 actions from cold):**

1. **Draw the stay-bolt** (the `STAYS` slide on the pier by the door) — the
   six swing free.
2–6. **Pull five ropes** in the order the peal board gives for your road.
   The slate chalks each bell as it speaks.
7. **Close on Grief** — pull the tenor. If the change is true, the door
   gives onto the road. False changes jow and are chalked away; rounds are
   only rounds.

While a way stands open, pulling Grief again tolls it shut. Left alone, the
change wears thin and the way falls shut of itself inside the minute.

**The sexton's barrel — chiming (the fast way):**

Crank the barrel until the card window names your road, then drop the engage
lever. The pins do the ringing at chiming pace. This is faster *for a
reason*, not just a sped-up animation: chiming taps a hanging bell with a
hammer instead of swinging it full circle, so there are no stays to draw, no
rhythm to keep, and no way to ring it false — the old sexton's pins remember
the order. The cost: the barrel only knows the roads he pinned. Anything
else must be rung by hand, the patient way.

## Idle behavior

Ambient only: the lantern breathes, ropes sway, dust drifts, mist stirs when
a way is open. Nothing ever dials itself for a visitor.

## Verification hooks (not part of the visitor experience)

- **URL param** — `?changes` runs the full bench;
  `?changes=manual|chime|false|guards|dark` runs one suite.
- **Console** — `window.__belfry.trial('all')` (same bench),
  `window.__belfry.state()` (read-only state snapshot).

The bench interacts only by dispatching real pointer events against the same
elements a visitor's hand would land on, hit-tested with `elementFromPoint`.

## Files

- `index.html` — shell, corner marks
- `css/belfry.css` — fluid single-viewport layout, lettering
- `js/roads.js` — bells, roads, judging, all copy
- `js/audio.js` — every sound synthesized with Web Audio (no assets)
- `js/scene.js` — the chamber, painted procedurally into one 1920×1080 SVG
  from a fixed seed (same chamber every visit, nothing tiled)
- `js/main.js` — state machine, hands, render loop
- `js/bench.js` — dispatched-event verification bench
