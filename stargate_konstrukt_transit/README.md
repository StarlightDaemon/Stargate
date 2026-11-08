# Stargate Konstrukt Transit

> **Operator Verification Note:** Direct operator testing confirmed this build is fully functional end-to-end — manual dialing, three-stage activation (buildup, breakthrough, sustained active), disengage/reset, and quick-dial auto-sequencing all operate as intended. This marks this project's third deliberate artistic-register departure from the digital-glow HUD style, embracing a Bauhaus and Constructivist geometric abstraction aesthetic, which was confirmed successful by the operator.

An interactive portal-dialing interface built in the artistic register of **Bauhaus and Constructivist Geometric Abstraction**. Operating under the fictional jurisdiction of the **KONSTRUKT TRANSIT BUREAU** (*Bureau of Applied Geometric Kinetics // Form-Werk Apparatus 08*).

## Key Features
- **Artistic Register:** Bold primary colors (Cadmium Red, Cobalt Blue, Ochre Yellow), Pitch Black, and Bone White with hard flat edges and dynamic asymmetric poster composition.
- **The Kinetic Annulus:** 8-segment 45-degree Euclidean radial dial ring with 8 original geometric glyphs (`V-01` through `V-08`).
- **Screen-Printing Squeegee Locking:** Mechanical stencil registration detent followed by a pigment squeegee wipe sweep across sector and linear register slots.
- **Three-Stage Staged Activation:** Manual activation through `ENGAGE VECTOR` executing Buildup (1.8s) $\to$ Breakthrough (0.6s) $\to$ Sustained Active (counter-rotating primary geometric vortex). Zero auto-fire on address entry.
- **Quick-Dial Preset Roster:** 6 preloaded destinations across 2 tiers (*Intra-Metropolitan Arteries* and *Deep Kinetic Corridors*) with visible per-symbol auto-dial sequencing (~320ms/symbol).
- **Safety Interlock:** *Vector Interference Interlock (Detent 08)* defaulting to `RELEASED`, providing unmissable hazard feedback when engaged.
- **Functionalist Audio Synthesis:** Web Audio API procedural sound engine generating mechanical detents, squeegee friction sweeps, heavy platen clamp thuds, and industrial motor drone.
- **Responsive Viewport:** Master 1920x1080 design scaling dynamically to 4K (3840x2160) without scrolling.


## Shared local preview

Run `node server.js` from this exhibit directory. The compatibility launcher uses
the repository shared server at `http://127.0.0.1:8088`; `PORT` overrides the port.
Only tracked public assets are served; development files and unsupported methods
are denied. Keep the exhibit inside this repository. Original verification suites
and client behavior remain independently qualified; security migration does not
assert new operator acceptance.


## Shared verification dependencies — 2026-11-08

Browser verification uses the shared tools installed at the repository root. Run `npm ci --ignore-scripts` there before using this exhibit's existing verification commands, with system Chrome configured as required by the harness. The exhibit's package commands and application assets are unchanged.
