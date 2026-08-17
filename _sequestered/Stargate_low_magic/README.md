# The Wayband of Wren Alderwick

An interactive novelty website: a ring-shaped, portal-opening device built in a
**low-magic** register — hedge-craft, not high sorcery. The Wayband is a
threshold wheel kept by Wren Alderwick, a hedge-dialer of the drove-road
cunning folk: a salvaged cartwheel hung on a barn wall, twenty-four chalked
slate way-marks strung to its tire, seven tallow candles in twine catches,
a copper ladle of priming water, and a cold-iron pin to seal the way shut.

Everything is fictional and self-contained. No backend, no network calls,
no frameworks — plain HTML, CSS and JavaScript.

## Running it

It is a fully static site. Either open `index.html` in a browser, or serve
the folder with any static server. A dependency-free dev server is included:

```
node dev-server.js        # http://localhost:8737
```

## How to work the rig (in-universe)

1. **Chalk six way-marks** — click slates on the wheel yourself (the wheel
   creaks round to each mark and a candle catches), or tap a page of
   **Wren's Road-Ledger** to chalk a known road.
2. **Press Wren's Mark** — the seventh chalking, always last.
3. **Tip the Copper Ladle** — the priming water wakes the chalk and the way
   opens… if the road is one that answers. Hand-chalked nonsense fizzles.
   The road the ledger crosses out is crossed out for a reason.
4. **Draw the Cold-Iron Pin** to seal the way when you're done. If you dawdle,
   the tallow gutters out and the way falls shut on its own (house rule 3).

### The Moth's Bargain (fast dial)

The **Patient Way** turns the wheel mark by mark. The **Moth's Bargain**
burns a moth-dipped taper — wax saved from roads already traveled — and the
moth-flame flies the route from the wax's own memory in seconds. It costs the
taper, it only works for roads in the ledger (the wax can't remember a road
it never dripped on), and moth-light never sits steady: the flames burn green
and jumpy, the open way shivers, and the tallow burns out twice as fast.
Seal a patient-way trip cleanly and you scrape a **dripping**; two drippings
dip a new taper.

## Verification hooks (not part of the visitor experience)

Idle behavior is ambient only — flames, hum, dust, occasional journal
murmurs. Nothing ever dials itself. For testing there are three deliberate,
non-default triggers:

- **Console API** — `wayband.test(destId, fast, holdMs)` runs a full cycle
  (dial → pour → hold → seal). Also `wayband.dial(id)`, `wayband.pour()`,
  `wayband.seal()`, `wayband.state()`, `wayband.grantTaper()`,
  `wayband.timeScale(0.25)`.
- **Keyboard** — `Ctrl+Alt+R` runs one full standard cycle.
- **URL params** — `?rig=fen-market` auto-runs a cycle on load;
  add `&fast=1` for the Moth's Bargain, `&quick=1` to compress all timings.

## Files

- `index.html` — structure: ledger, rig, journal, house rules
- `css/wayband.css` — barn wall, wheel, sockets, paper, chalk
- `js/glyphs.js` — the 24 original way-mark glyphs + destinations + copy
- `js/audio.js` — all sound synthesized with Web Audio (no assets)
- `js/portal.js` — canvas portal: ripples, sheen, motes, moth-flicker
- `js/main.js` — state machine, wheel, sockets, tapers, dev hooks
- `dev-server.js` — optional zero-dependency static server for previewing
