# Old Punctual — Vane & Harrow Transit Engine №7

An interactive, entirely fictional portal-dialing exhibit in a Victorian
steampunk idiom: a punched-card **æther correspondence engine** built in
1894 by the (equally fictional) firm of Vane & Harrow, Blackfriars, for
the Ætheric Correspondence Trust.

Everything is client-side — no backend, no networking, no real
destinations. All correspondents are invented. Original visual and
symbolic language throughout.

## The machine

Dialing is **punched-card programming under steam**:

1. **Raise steam.** Open the DAMPER and watch the boiler climb into the
   working band (100–148 lb/in²). The flyball governor spins up with
   pressure. Interlocks refuse everything below working pressure.
2. **Program the route.** Either draw a **certified card** from the
   rack of listed correspondents, or compose your own on the punch: set
   a value (1–8) on the scale, STRIKE each of the six columns, and take
   the finished card from the out-tray.
3. **Draw the card.** Throw DRAW. The reader pulls the card past sprung
   feeler pins; each column aligns a register and a red annunciator
   flag drops — six drops and the registers are "in correspondence."
4. **Open the line.** Throw the COUPLING. If the code answers to a
   listed correspondent, the brass iris parts onto the luminiferous
   æther. Unknown codes find a **dead line**: the leaves crack, nothing
   answers, and the card is returned.
5. **VENT** blows the engine down: line shut, registers cleared, card
   returned.

A live line draws steam. Shut the damper while connected and the
correspondence will eventually **lapse** on its own as pressure decays.

## Fast dial, in-universe

Cards from the rack carry a **certification notch** cut by the Trust's
computing office. The notch physically lifts the reader's **proving
pawl**, so the card runs through at governor speed (~5 s). A
hand-composed card has no notch: the pawl stands, and the engine
double-strikes ("proves") every column against the feelers before
locking it (~15 s), on top of the manual composition work. Fast dial is
therefore a different *mechanism* — certified compilation — not a
sped-up animation.

## Idle behavior

Ambient only: ember flicker, drifting steam, gauge breathing, governor
motion when steam is up. **No automatic dialing sequence ever runs for
a visitor.**

## Running it

Any static file server, e.g.:

    python -m http.server 8171

then open `http://localhost:8171/`. No build step, no dependencies —
vanilla ES modules. (`.claude/launch.json` registers this as
`oldpunctual` for the Claude Code browser pane.)

## Test harness (not part of the visitor experience)

Append `?works` to arm `window.__punctual`, or auto-run a trial with
`?works=interlocks|card|manual|dead|all`. Trials drive the machine by
dispatching **real pointer/mouse event trains at the production DOM
controls** (with `elementFromPoint` hit-testing so occlusion bugs
fail loudly), wait on a MessageChannel timer shim immune to hidden-tab
throttling, and log PASS/FAIL per step to the console.
`window.__punctual.rafCheck()` reports honest visibility +
requestAnimationFrame rates.

## Architecture notes

- `js/sim.js` — the whole machine as closed-form functions of
  wall-clock time (piecewise-exponential boiler pressure, scheduled
  column locks, analytic collapse prediction). User actions only swap
  reference parameters; rendering can stall without deadlocking state.
- `js/main.js` — render loop (rAF + 250 ms setInterval backstop).
- `js/iris.js` — 12-leaf brass iris (SVG) over a canvas æther field.
- `js/panels.js` — gauge, governor, annunciator drops, rack, punch.
- `js/audio.js` — synthesized hiss/clank/thunk/ratchet (WebAudio, no
  samples, no chimes).
- `js/clock.js` — wall clock + throttling-proof timer shim (harness
  only).
