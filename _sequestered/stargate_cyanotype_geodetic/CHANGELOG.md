# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Known Issues (Post-1.1.0 Operator Testing)

- **Confirmed Working**: Direct operator testing confirms that the auto-activation fix in v1.1.0 is working as intended under real operator use — the dialing sequence correctly requires an intentional click on `VALIDATE & COMMIT` and no longer fires automatically upon scribing the 7th node.
- **Unresolved Portal Visual Effect**: Separately, operator testing found that clicking `VALIDATE & COMMIT` produces the approval stamp, but the described portal/aperture connection effect (rotating compass rose, drafting spirals, and radiating cyanotype particle streams) does not actually appear or render perceptibly to a real viewer — only the stamp is visible.
- **Build Status**: Root cause has not been investigated; this build is closed as-is without further iteration.

## [1.1.0] - 2026-08-12

**Built by:** Gemini 3.6 Flash (high reasoning)

### Fixed
- **Resolved Automatic Portal Activation on 7th Node**: Fixed root-cause issue where scribing the 7th geodetic node automatically triggered validation stamping and aperture animation without an intentional, deliberate activation step.
- **Added Dedicated Activation Control (`VALIDATE & COMMIT`)**: Introduced a distinct deliberate activation button (`#btn-certify-activate`) inside Cluster 2 (Draughtsman's Action Tools) that remains visually inert/disabled (`REQUIRES 7 SCRIBED NODES`) until all 7 nodes are scribed, and becomes clearly enabled and highlighted (`READY · CLICK TO COMMIT CONDUIT`) upon 7th node completion.
- **Field Permit Hold Safety Flow**: Ensured that releasing a permit hold after dialing 7 nodes does not auto-activate the conduit on release, but requires an intentional click on `VALIDATE & COMMIT`.
- **Quick-Dial Preset Flow**: Preset site plans now sequence through all 7 nodes, log coordinates, and enable `VALIDATE & COMMIT` without auto-activating.

## [1.0.0] - 2026-08-12

**Built by:** Gemini 3.6 Flash (High)

### Added
- **Bureau Identity & Lore**: Initial release of the Vance & Sterling Geodetic Survey Bureau (Est. 1888) cartographic blueprint portal: *PLATE NO. IV-B: RESONANT TOROID APPARATUS (AZIMUTH TRANSIT CONDUIT)*.
- **Physical-Material Cyanotype Aesthetic**: Authentic deep Prussian-blue paper, pale cyan ink linework, dark walnut drafting table surface, directional top-left lighting with realistic drop shadows on all drafting tools and hardware.
- **Irregular Wear System**: Zero repeating tiled textures. Procedural creased fold lines, realistic coffee-ring stain on the drafting margin, frayed deckled paper borders, translucent drafting tape repairs, water droplet bleach marks, and smudged graphite dust.
- **Drafting Tool Controls & Depth**: Brass and steel drafting compass, boxwood architect's scale with brass ferrule, hexagonal redline grease pencil, and heavy rubber validation inspector stamp with physical depth and occlusion.
- **9-Node Astrometric Locking Mechanism**: Nonagonal harmonic triangulation framework with 9 physical node pins and 7-symbol coordinate address length. Redline grease-pencil checkmarks and dimension callouts scribed directly onto the cyanotype upon each lock.
- **Synthesized Drafting Audio Engine**: Web Audio API synthesizer generating realistic graphite pencil lead friction, rubber stamp thud & mechanical clack, parchment paper rustle, and vernier ratchet clinking.
- **Drafting-Style Gateway Activation**: Dynamic technical ink vortex, cross-hatching, radiating compass rose vectors, logarithmic spiral drafting arcs, and flowing cyanotype linework upon 7-node lock completion.
- **Safety Subsystem - Field Permit Hold**: Physical inspection stamp toggle that prohibits portal activation during ongoing structural audits.
- **Site Plan Archives**: 6 preloaded quick-dial site plans across 2 distinct visual tiers (Approved Imperial Survey Conduits Class A, and Deep Abyss & Uncharted Harmonic Conduits Class C).
- **Responsive Viewport Engine**: Full-screen 1920x1080 fit without vertical or horizontal scroll, smoothly scaling to 3840x2160 (4K) with unitless CSS transform calculations.
- **Operator Reference Guide**: Collapsible weathered drafting manual modal accessible via the top-right "?" button.
- **Corner Attribution**: StarlightDaemon GitHub link at bottom-left and version indicator at bottom-right.
