# DEADRINGER — salvaged transit aperture A7-113

An interactive, fully fictional portal-dialing console. Cyberpunk build of the
Stargate-inspired series: a decommissioned **Kessler-Voss Orbital** "SPINDLE"
transit aperture, cut out of a bankrupt megacorp's tower and re-hung on a chain
gantry in a flooded sub-basement, operated by a salvage crew who dial by
**replaying stolen corporate handshake credentials** against the still-powered
derelict exchange network.

## Run

No build step, no dependencies. Serve the directory statically:

```
python -m http.server 8189
# open http://localhost:8189/
```

(ES modules require http://, not file://.)

## Operating the gate

1. Pick a route off the **ROUTES** board (thermal-label tags). The struck-through one stays struck through.
2. **NEG** — full forged handshake: ring spools segment by segment, then the rig
   probes each derelict exchange hop, answers its challenge with a ghosted
   response, and pins the route. Takes ~25 s. Segment C (the bulky dark
   replacement) stalls on cold spool — click it to whack the driver back up,
   or wait and it recovers on its own.
3. **RES** — fast dial via *session resumption*: if a route's session is still
   warm (a ghost-key chip seated in the reader, or a ticket cached from an
   earlier full dial this session), the rig replays the ticket and skips the
   entire negotiation. ~3 s to lattice.
4. When the lattice pins: lift the yellow cover, pull the bar. **CUT** severs.
   The exchange drops the route itself at ~2 min TTL.
5. **AUD** toggle enables sound (off by default).

Idle is ambient-only — the page never dials by itself.

## Testing triggers (not part of the visitor experience)

- `?rig` — auto-runs a full forged dial end-to-end via real dispatched
  pointer/mouse events on the production controls (hit-tested at element
  centers), including the segment-C whack. Result JSON in `window.__benchResult`.
- `?rig=resume` — fast dial via seated ghost key.
- `?rig=all` — full dial, then session-ticket resume, then chip resume.
- `window.__deadringer` — `{ S, actions, tick, realClick, bench, tagFor }`.

## Architecture

Vanilla ES modules; SVG chamber + ring, canvas portal field, DOM rig panels.
All sim state is a closed-form function of wall-clock time (`js/state.js`);
rendering chases it from rAF, and a tiny inline Web Worker heartbeat
(`js/clock.js`) keeps the state machine advancing even when the tab is
background-throttled. No backend, no networking, no real destinations.
