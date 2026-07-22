# AUGUR — Type 61 Aperture Trace Console

A single-session novelty portal-dialing toy in the **Retro** register: an early-1960s
storage-oscilloscope installation at the (fictional) Physical Establishment, Nine Elms.
Fully client-side; all destinations are fictional; no franchise assets reproduced.

## The conceit

The Type 61's storage tube doesn't display an address — it **is** the address.
A destination is a standing Lissajous figure (an X:Y frequency ratio plus a phase
angle). Plot the figure, let the automatic frequency control latch it dead, strike
it into the 2.4 kV storage mesh, and energize: the mesh floods, the figure unwinds
into a circular luminous aperture, and the far side shimmers through.

Because the storage phosphor genuinely retains a struck trace, a previously-plotted
address never needs re-plotting — **recall floods it back instantly**. That is the
fast-dial mechanism, and it is exactly how storage scopes really worked.

## Operating it

**Manual dial from cold (6 actions, 2 control clusters):**

1. MAINS toggle up — HT rises, tube readies (~2.5 s).
2. FIGURE X:Y knob — click to turn it one detent at a time (wraps around
   indefinitely) until it shows the destination's ratio (see TRACE TABLE);
   wheel/arrows also step it.
3. PHASE VERNIER — click to turn it 6° per notch (wraps past 360°) toward the
   destination's phase; wheel/arrows trim by 1° (shift: 0.2°) for the final lock-in.
   Inside ±3° the AFC latches (~1 s).
4. STRIKE — commits the standing figure into the storage mesh.
5. Raise the ENERGIZE cover (clicking the blocked switch raises it for you).
6. Throw ENERGIZE — mesh flood, aperture stands. Throw it back to collapse.

Clicking a TRACE TABLE row draws that destination as a faint dashed graticule mask —
an optional plotting aid. A standing aperture bleeds the mesh dry after 90 s.

**Fast dial:** click a retained trace on the STORAGE MESH screen (`[RECALL]`), then
cover + ENERGIZE. Retained traces survive a mains cycle — the mesh holds its charge.

## Running

```bash
python -m http.server 8231
```

then open <http://localhost:8231/>. No build step, no dependencies, ES modules only.

## Testing (not a visitor path)

Idle state is ambient only (free-running 1:1 wander; no auto-dial). The bench drives
the production DOM with real dispatched pointer/mouse/wheel events, hit-tested via
`elementFromPoint`:

- `http://localhost:8231/?trace` — full suite; or `?trace=manual|recall|guards`
- console: `await window.__augur.bench('all')`

## Layout

Designed at 1920×1080 and scaled proportionally (up and down) to the viewport, so a
4K screen gets a proportionally larger console, not a centered postage stamp.
Everything needed to dial sits in the single viewport.
