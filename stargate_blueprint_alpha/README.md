# Vossen-Klein Topological Drafting Station Alpha (stargate_blueprint_alpha)

> [!WARNING]
> **Known Issues / Current State Note:**
> Operator testing found that manual dialing is non-functional. This contradicts this session's automated verification report (which reported two passing dial-disengage-redial cycles). The root cause has not yet been determined and will be addressed in a separate pass.

---

## Overview

A digital architectural blueprint & CAD drafting portal terminal for the **Vossen-Klein Topological Drafting Bureau (Division of Non-Euclidean Surveys)**.

- **Theme**: Classic Prussian-blue cyanotype drafting station with vector SVG linework, real dimension lines, 45° cross-hatch shading, and technical drafting conventions.
- **Addressing**: 16-symbol coordinate drafting matrix with 8 radial datum lock nodes.
- **Safety Subsystem**: Structural Peer Review Permit Hold lockout.
- **Quick-Dials**: 6 preloaded site plans across two classification tiers.
- **Audio Engine**: Procedural Web Audio API synthesizer for mechanical plotter and inking sounds.

## Local development and verification

Run `npm start` or `node server.js` from this directory in the repository checkout.
Both use the shared preview, bind only to `127.0.0.1`, and default to port 8088.
Set `PORT` to override it; `PORT=0` selects an available port. Keep the parent
repository tools available. Only tracked public assets are served; development
source, manifests and documentation are denied, and only GET/HEAD are accepted.

After installing the existing locked test dependencies with `npm ci`, `npm test`
runs the retained verification suite using its own ephemeral shared preview.
`PUPPETEER_EXECUTABLE_PATH` can select an existing Chrome installation; the browser
sandbox remains enabled. Screenshots go to ignored `test/` output.

Automated preservation does not resolve the operator-reported issue above.
Preset auto-activation and a missing favicon were also reproduced during security
qualification. Dependency audit findings remain open; the serving change is not
a claim that the development dependency tree is vulnerability-free.
