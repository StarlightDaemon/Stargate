# Panel K — Conduit Routing & Service

**Intermunicipal Conduit Authority · Substation 6**
*Strand & Weir Ltd. Type 44 routing console, ser. № 1187*

A fictional, fully client-side, interactive portal-dialing site in the register of
**grounded, workaday low-tech science fiction**. Portals here are not relics or
ritual instruments — they are municipal infrastructure, "conduits," maintained by
shift technicians the way a water utility maintains pumping stations. This page is
the routing panel a technician works at.

Everything on it — the utility, the manufacturer, every destination — is invented.
No franchise assets, symbols, or names are reproduced.

## How you dial

There is deliberately **no glyph alphabet, no rotating symbol ring, no chime
lock-ins**. Routes are plain five-digit numbers out of a paper routing ledger, and
the mechanism is 1950s telephone-exchange practice:

1. **Key switch → ENERGIZE.** Bus comes up at 117 V, panel hum starts.
2. **COMPRESSOR on.** The plenum charges; the pressure gauge must reach the
   green band (≥ 58 kPa) before the panel will line anything up.
3. **Set the route** on five BCD thumbwheels, reading the number off the ledger
   (click a ledger row to grease-pencil-mark it as a reading aid).
4. **LINE UP.** Five stepping relays walk to their digits — you hear each wiper
   detent and seat clunk — then the far end is *proved* for continuity.
   A number not in the ledger proves nothing and drops out: **NO ROUTE**.
5. **Pre-transit checklist.** Three guarded toggles: seal ring seated, plenum
   equalized, traffic board clear.
6. **Raise the guard, press OPEN CONDUIT.** The butterfly gate valve grinds
   open (~2 s) and a thin iridescent *carrier film* forms across the throat —
   visible through the round inspection port. Closing reverses it and drops the
   line; the checklist must be re-certified for the next transit.

Interlocks refuse (buzzer + INTERLOCK lamp + log entry) anything a real panel
would refuse: dialing under load, key-off with the conduit open, lining up with
a cold panel or low plenum, flipping certs held by a card, etc. Every action is
stamped into the paper service log at the bottom.

## Fast dial — the route card

The fast path is not the same animation sped up; it is a different mechanism.
Frequently serviced junctions have **pre-punched route cards** in the rack,
stamped by a supervisor under *Maintenance Order 7-C*. Seating a card:

- mechanically slews all five thumbwheels to its punching at once,
- lets LINE UP do a **gang release** — one motor throw seats all five relay
  banks together instead of stepping digit by digit,
- and carries the pre-transit certification stamp, so the checklist is accepted
  from the card the moment the line proves.

Card in, LINE UP, guard up, OPEN — a few seconds instead of a full hand dial.
Eject the card to get the wheels back.

## Idle behaviour

Idle is ambient only: needle micro-jitter and bus hum when energized, condensation
and glass reflections on a dark port when cold. A visitor who leaves the page open
never sees an automatic dialing sequence.

## Tech

- **Stack:** vanilla HTML/CSS/JS, ES modules, zero dependencies, no build step.
  A physical-analog panel is mostly *material rendering* — enamel, bakelite,
  lamacoid, paper — which is exactly what hand-written CSS is good at; a
  framework would only add weight to what is a single state machine.
- **Audio:** all synthesized with Web Audio (detents, relay seats, gang-release
  motor, valve grind, hums). No assets, starts after first user gesture.
- **Port window:** Canvas 2D — butterfly valve, bore rings, carrier film drawn
  as sinusoidal interference bands (oil-film look, not glow-magic).
- **Gauges:** SVG faces with underdamped spring-driven needles.
- **Scheduler:** rAF-driven, with a coarse 250 ms interval as a backstop so
  lamps, needles, and the port stay alive in frame-starved viewers; while the
  tab is hidden, a MessageChannel pump gives precise ticking during sequences
  and for a short burst after each input (works around hidden-tab timer
  throttling; idle hidden tabs cost almost nothing).
- **Interlocks read the physical model, not the meters:** plenum pressure and
  bus volts are closed-form functions of wall-clock time, so LINE UP and OPEN
  behave correctly even if rendering has been throttled; the needles just
  chase the model.

Serve statically, e.g. `python -m http.server 8147`, and open `/`.

## Test harness (not visitor-facing)

`?bench` runs one scripted hand-dial cycle; `?bench=card` runs the card path.
Console: `window.__panelK` exposes `bench()`, `snapshot()`, `sleep()`, and all
panel actions for scripted testing. A live visitor never triggers this.
