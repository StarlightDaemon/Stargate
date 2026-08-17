# VANTAGE — Type 9 Aperture Surveillance & Induction Console

**stargate_atompunk** — an interactive novelty portal-dialing website. Atompunk:
Cold War civil-defense radar room, alt-1959. Station 3 "Bluff Creek" on the
Continental Threshold Warning Line, Bureau of Civil Aperture Defense.

The circular PPI radar scope **is** the portal ring. Threshold stations appear
as blips painted by the rotating sweep (P7 phosphor: blue-white flash decaying
to an amber trail). Lay the bearing cursor and range gate onto a station, let
the sweep paint it three times to build a firm track, challenge its signature
on the interrogator, then lift the red cover and throw INDUCT — the aperture
forms in the tube itself.

## Operating the console (manual dial, cold start — 6 actions)

1. **H.T.** toggle up — the sweep comes alive and stations paint.
2. **BEARING** knob — click left/right half (or mouse wheel) to lay the dashed
   cursor on a station's bearing (see the target log).
3. **RANGE GATE** knob — bring the gate arcs onto the station's range.
4. Wait: three sweep paints build a firm track — **LOCK** legend lights.
5. **CHALLENGE** — the interrogator round-trips the station's signature.
   Friendly stations verify; dark stations answer **NO JOY**.
6. Lift the red cover, throw **INDUCT** — the tube floods and the threshold opens.

## Fast dial — drum track store

A verified firing solution is automatically written to the console's magnetic
drum (the amber dots in the target log). **RECALL** replays a stored solution:
the servos lay the gates and the drum answers the interrogator from its
recording — no sweep acquisition needed. Slot 1 ships with ABLE ORCHARD's
solution left by the day shift. Select a slot with the DRUM STORE knob, press
RECALL, cover up, INDUCT.

## Running

```
python -m http.server 8245
```

then open http://localhost:8245/ — fully client-side, no backend, no network
calls, all destinations fictional.

## Testing (non-default; a plain visitor never triggers this)

- `http://localhost:8245/?drill` or `?drill=geometry|manual|store|guards|all`
- or `window.__vantage.drill('all')` from the console.

The drill hit-tests every control at its rendered screen position
(`elementFromPoint`) before dispatching real pointer/mouse event trains, runs
the full manual dial, the drum-recall fast dial, and the interlock guards, and
verifies the open-aperture state at the canvas pixel level. Results land in
`window.__vantageDrill`.
