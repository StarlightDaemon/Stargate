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

After installing the repository root tools with `npm ci --ignore-scripts`, run
`npm test` here for the explicitly adapted current contract using an ephemeral
shared preview. It retains all eleven original phases and their positive checks, waits for
the completed activation stages and explicitly clicks ENGAGE after preset staging.
`npm run test:legacy` retains the historical suite byte-for-byte; its 500 ms
activation and automatic-preset expectations conflict with the current contract
and remain an explicit historical FAIL. `npm run test:regressions` exercises
staging, manual/key controls, cancellation, reduced motion and stage captures.
`PUPPETEER_EXECUTABLE_PATH` selects installed Chrome; the sandbox stays enabled
and evidence remains under ignored `test/` directories.

Automated verification does not resolve the operator-reported issue above.
Preset auto-activation was reproduced during security qualification and then
repaired with staged plotting and explicit ENGAGE. The unused `serve` dependency
has been removed; its old transport failure remains historical evidence. Browser
tests now use the repository root Puppeteer lock rather than a duplicated local
tree. Fresh full-tree audits and separate operator acceptance remain required.


## Shared verification dependencies — 2026-11-08

Browser verification uses the shared tools installed at the repository root. Run `npm ci --ignore-scripts` there before using this exhibit's verification commands, with system Chrome configured as required by the harness. Existing package commands and application assets are unchanged by this dependency maintenance.
