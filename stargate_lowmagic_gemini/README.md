# Stargate Rushlight Hearth (`stargate_lowmagic_gemini`)

An interactive novelty portal-dialing website set in the register of **Low Magic**: humble, domestic, everyday folk magic. Here there are no grand celestial arches, cosmic cathedrals, or glowing technomantic circuits. Instead, the portal is drawn at the cottage fireside: an inscribed salt boundary upon flagstone, spun flax cords pinned with iron needles, dried herbs gathered at Michaelmas, and a rushlight candle dipped in kitchen tallow. Seven folk charms bound in twine open the hearth-gate to quiet larders, herb-cellars, hedgerows, and drying lofts across the cottage network.

## The Hearth-Stone Register

- **Aesthetic**: Flat, illustrated folk-craft art tradition drawing from illuminated-manuscript marginalia, botanical field-guide herbarium plates, embroidery sampler and cross-stitch borders, and hearth-ward chalk and salt sigil linework. Avoids both simulated 3D physical materials (no fake brass, fake wood grain, or synthetic patina) and digital-native schematic circuitry (no glowing cyan/amber HUDs).
- **Dialing Instrument**: The **Hearth-Stone Spindle**, a rotating ring of 28 folk symbols (herbs, hearth tools, pantry staples, and cottage charms).
- **Locking Mechanism**: **"Tying the Knot"** — each selected glyph rotates into the North Hearth Pin, where a taut linen cord draws inward and binds into the perimeter ring with an audible cord cinch and chalk-settle flourish.
- **Activation Sequence**: A genuine three-stage progression:
  1. *Buildup (1.8s)*: The Kindler's bellows pump, the tallow rushlight wick catches flame, a warm rushlight ochre wash expands into the salt ring, and linen cords hum with rising tension.
  2. *Breakthrough (Instant)*: The salt boundary fractures with a crisp chalk snap and resonant bronze hearth-bell strike; botanical pressings bloom outward from the aperture.
  3. *Sustained Active*: The threshold is open; flat silhouette thistle seedheads and night moths drift across the hearth aperture accompanied by a gentle, warm candlelit hum.
- **Disengage**: **"Snuffing the Hearth"** — immediate snip of the binding cord and smothering of the kindling flame. Timers, animations, and sound cancel cleanly without orphan loops.
- **Destination Autocomplete**: Includes a typeahead registry with 50 curated folk destinations (expanding well beyond the 16 traditional hearths), featuring staged sequential auto-dialing.
- **Safety Interlock**: The **Cold-Iron Threshold Nail**, defaulting to Released. When engaged, it physically bars the Kindler with clear visual warning rhymes.
- **Sound Design**: Pure procedural Web Audio synthesis mimicking folk acoustic physics: plucked linen cords, dry twine snaps, salt-chalk scrapes, bellows breath, sheep-shear snips, and bronze hearth bells. Zero external audio files.
- **State & Persistence**: Entirely in-memory state that resets cleanly on page reload. Zero `localStorage` or external cookies.

## Controls

- **Mouse / Touch**: Select glyphs along the Spindle or click glyph tiles in the Ledger; search destinations via the Autocomplete box; toggle the Cold-Iron Nail; Kindle or Snuff the portal.
- **Keyboard Navigation**:
  - `Tab` / `Shift+Tab`: Navigate interactive controls (with high-contrast focus rings).
  - `Enter` / `Space`: Activate buttons and select autocomplete destinations.
  - `K`: Kindle Portal (when 7 symbols are bound and safety is released).
  - `Escape` / `S`: Snuff Portal / Disengage immediately.
  - `I`: Toggle Cold-Iron Safety Interlock.
  - `C`: Clear bound cords.
  - `?`: Open the Herbwife's Operator Guide.

## Running the Local Dev Server

```bash
# Start static HTTP server on port 8655:
node scripts/server.js
# Then visit http://localhost:8655/
```
