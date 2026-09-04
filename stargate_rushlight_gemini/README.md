# Stargate: Rushlight — Low Magic Portal Console

A low-magic, domestic folk-craft portal console rooted in humble kitchen witchery, hearth wards, and herbal crafts. Built under the working codename **RUSHLIGHT**, this console turns away from grand cathedral mysticism and avoids both simulated 3D physical materials (no fake wood grain or brass sheen) and sci-fi digital HUD tropes (no cyan circuitry or neon holograms). Instead, it adopts a flat, illustrated folk-craft register inspired by illuminated manuscript marginalia, herbalist field-guide plates, sampler cross-stitch linework, and chalk/salt hearth sigils.

## In-Universe Lore & Mechanism

In quiet country cottages and roadside crofts, thresholds are not broken by thunderous particle colliders or divine archangels; they are woven from spun fleece, pinned with carved bone, sealed with dried chamomile, and kindled over tallow rushlights. The console centers upon the **Spindle Ring**, a 36-sigil folk wheel bound by 7 perimeter Bone Pins. As each symbol is drawn, tensioned linen twine threads across the aperture, accompanied by the dry click of reed shuttles.

Completing the 7-symbol address draws the threshold taut into a pending state. Ignition is never automatic: the operator must strike the hearthstone striker to kindle the rushlight tallow. Activation proceeds through three distinct, unhurried stages:
1. **Buildup**: Sparks shower the rushlight wick, tallow smokes gently, and thread tension hums with rising acoustic resonance.
2. **Breakthrough**: The chalk salt-line snaps bright white, an iron bell chimes, and the floral diaphragm blooms outward.
3. **Sustained Active**: The aperture reveals a tranquil, living Hearth Window of dancing flame silhouettes, drifting herbal motes, and a soft crackling fireplace hum.

## Controls & Operation

- **Herbarium & Knot Registry**: Filter and search through 50 humble folk-craft destinations with the typeahead autocomplete input, or browse by seasonal humors.
- **Thread the Hearth Knots (Auto-Dial)**: Watch the Spindle Ring sequentially rotate, spin twine, and seat each bone pin before coming to rest in the pending state.
- **Manual Dialing Pad**: Select runes directly from the 36-sigil folk alphabet.
- **Strike Rushlight (Kindle Hearth)**: Active once 7 symbols are locked and safety interlock is clear.
- **Sweep the Hearth Salt (Disengage)**: Always reachable and active. Instantly snuffs the flame, unwinds all twine, unseats pins, and quenches all audio timers.
- **Salt-Line Threshold Latch (Safety Interlock)**: Defaults to released. When latched, physically bars the striker with an illustrated iron ward.
- **Acoustic Soundscape**: Procedurally synthesized folk audio (dry reed clicks, loom shuttle snaps, flint strikes, fireplace crackle, tallow hiss) via the Web Audio API with dedicated mute control.

## State & Persistence

This build operates purely in-memory; no state is written to `localStorage` or any client-side persistence. Every browser reload returns the hearth to a fresh, cold-iron resting state.
