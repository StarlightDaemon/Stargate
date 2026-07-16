# STARGATE — Gate Interface

A client-side interactive Stargate gate interface: dial fictional in-universe
addresses on a 39-glyph ring, watch the per-chevron encoding sequence, the
Kawoosh Burst, and a stable event horizon — with a fully wired iris and a
self-running attract mode. A noncommercial fan project; not affiliated with or
endorsed by MGM.

## This is v1 — the first coalesced, working version

This repository's `archive/` directory (kept local-only, gitignored) holds
**17 earlier independent attempts** at this project, built across multiple
stacks and design generations. None of them were ever combined, finished, or
released. This build is the first time the working ideas from those attempts
were brought together into one reviewed, tested, releasable implementation —
it is a fresh build, not a relabeling of any prior attempt.

What was carried forward (as reference, reimplemented in the new stack):

| Subsystem | Reference (archived) |
| --- | --- |
| Phase model (IDLE → DIALING w/ per-symbol align/settle/lock-verify → CONNECTING w/ ignition/stabilization/steady → COOLDOWN) | `SG_MK7/stargate_design_07` XState machine |
| Iris guards — defined there but never wired; wired for real here | `SG_MK7/stargate_design_07` `guards.ts` |
| requestAnimationFrame ring-rotation controller + "Kawoosh Burst" | `SG_MK7/stargate-dialing-console` |
| Procedural Web Audio engine (every interaction has a synthesized sound) | `old/Stargate/sdc/scripts/audio.js` |
| Timer-driven idle/attract loop — cosmetic & unreachable there; real and address-driven here | `stargaste_old_export/stargate-export/stargate_logic.js` |

## Features

- **Dialing** — 39-glyph DHD input (point of origin included), quick-dial
  directory of fictional addresses, per-symbol ring alignment with a
  trapezoidal velocity profile, chevron lock/energize sequence.
- **Iris** — a real parallel state region (open/closing/closed/opening).
  Closing it before a wormhole forms suppresses the Kawoosh Burst into a
  shielded ignition; it can be sealed or opened over an active wormhole.
- **Idle / attract mode** — after 45 s untouched, the gate dials real entries
  from the address directory in a deterministic cycle. Any interaction hands
  control back to the operator.
- **Procedural audio** — every step (DHD press, ring rotation, chevron lock,
  engage, kawoosh, wormhole hum, iris transit, abort) is synthesized with the
  Web Audio API. No audio files, no network.
- **38-minute wormhole ceiling** — a steady wormhole auto-disconnects at the
  canonical limit.

## Stack

Vite 8 · React 19 · XState 5 (+ @xstate/react 6) · TypeScript · Vitest 4.
Static, client-only single-page build — no backend, no SSR, no runtime
network dependency (system fonts, procedural audio, generated glyph art).

## Develop

```sh
npm install
npm run dev      # local dev server
npm test         # state-machine test suite
npm run build    # type-check + production build (static, in dist/)
```

## License

MIT — see [LICENSE](LICENSE). All glyph artwork is procedurally generated and
all addresses/destinations are fictional. Stargate and related marks belong to
Metro-Goldwyn-Mayer Studios Inc.; nothing MGM-owned is included in this build.
