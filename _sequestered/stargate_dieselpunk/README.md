# STENTOR — Resonance Alternator No. 3

An original dieselpunk portal-dialing console: the Halvorsen & Krag **Type 88
resonance alternator**, worked by the fictional Overland Wireless Traction
Board, alternate 1931. The paradigm is the great mechanical longwave
transmitter: the traction carrier is generated *mechanically* — its frequency
is the rotor's speed and nothing else — so dialing a destination means
governing a 96-tonne machine onto that station's resonant signature.

All destinations are fictional. No franchise assets, symbols, or names are
reproduced. Fully client-side: no backend, no networking, nothing leaves the
page.

## Run

```
python -m http.server 8203
# open http://localhost:8203/
```

No build step, no dependencies. Vanilla ES modules + hand-written SVG/canvas.

## How to dial (hand tuning)

1. Open the **fuel cock**, hold the **air start** lever until the diesel fires.
2. Post a **traffic order** by clicking a station line in the ledger.
3. Wait for lub-oil ≥ 25 lb, engage the **main clutch**.
4. Governor quadrant to the station's speed band, then null the beat note on
   the **vernier** wheel (watch the magic eye close) until the resonance latch
   takes.
5. Drag the **goniometer** card until the red preset sits under the lubber
   line; hold.
6. Press the **transmit key**; the coder drum sends the call. Wait for the
   answering signature on the beat scope.
7. Close the **main contactor**. Early closing trips the overload (reset at
   the alarm board on the machine plinth).

## Fast dial — crystal working

Stations with an issued quartz **channel crystal** (marked · in the ledger)
can be worked from the crystal rack: seat the crystal in the oven socket and
the crystal bridge overrides the governor (dead-beat, no hunting, no hand
nulling) while the selsyn repeater lays the goniometer on the stamped bearing
by itself. You still start the engine, clutch in, key the call, and close the
contactor — the Board does not automate judgment, only tuning.

## Idle behavior

Ambient only: dust in the skylight shaft, needle rest-quiver, a cold machine.
No dialing sequence ever runs on its own.

## Test harness (not part of the visitor experience)

- `?shakedown` or `?shakedown=crystal|manual|guards|all` — runs the shakedown
  bench: real dispatched pointer/click event trains against the production
  DOM, hit-tested with `elementFromPoint`, including closed-loop hand-nulling
  of the vernier and hand-swinging the goniometer.
- `window.__stentor.shakedown('all')` — same from the console.
- `window.__stentor.S` / `.sim` — live state for inspection.

## Notes

- Layout is a fixed 1920×1080 design stage scaled uniformly (up to 4K and
  beyond); everything needed to dial fits in one viewport. Below the fold:
  lore and operating notes only.
- The sim is closed-form in wall-clock time; a Web Worker heartbeat drives
  state transitions so hidden-tab throttling cannot stall a sequence.
- Audio (WebAudio) starts on first click; the tannoy horn on the wall
  mutes/unmutes.
