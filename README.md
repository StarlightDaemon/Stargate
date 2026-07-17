# MERIDIAN RING — Gateway Operations Console

An original, fully client-side interactive novelty site: a ring-shaped dialing
apparatus that acquires a seven-sigil address, seats eight mechanical
hold-clamps one by one, ignites a violent energy surge, and settles into a
shimmering open conduit — then collapses and seals behind a twelve-plate iris.

Everything on screen and in the speakers is generated at runtime:

- **36 original sigils** — procedurally generated from a seeded grammar of
  six stroke-template families, so the set reads as one coherent script.
- **Dialing mechanism** — the inner glyph band physically rotates each sigil
  under the apex reader (alternating direction per sigil); clamps seat in a
  symmetric order ending on the bottom keystone.
- **Ignition & conduit** — an overshooting turbulent plume, then a
  counter-rotating shimmer surface with outward ripples.
- **Sealing** — conduit collapse plus a mechanical iris of twelve plates.
- **Fully synthesized sound** — servo grind, clamp thunks, ignition surge,
  conduit shimmer loop, seal whoosh; Web Audio API, no audio files.
- **Console UI** — sigil keypad, address register, six fictional registered
  destinations, random vector, stability countdown with auto-seal, system log,
  operator handbook.

## Run

No build step, no dependencies, no network access. Serve the folder with any
static file server (ES modules require http://, not file://):

```
python -m http.server 8420
# open http://localhost:8420
```

## Controls

- Click sigils on the keypad **or directly on the ring** to compose an address.
- **ENGAGE** (or `Enter`) starts the dial; **ABORT** (`Esc`) releases clamps.
- While the conduit is open: click the horizon to send a probe, click dead
  centre to transit, **SEAL RING** (`Esc`) to close. Stability auto-seals at 0.
- **RANDOM** (`R`) composes an unregistered vector.

All destinations, names, and addresses are fictional. Original visual
language throughout — no artwork, symbols, or names are reproduced from any
existing franchise.
