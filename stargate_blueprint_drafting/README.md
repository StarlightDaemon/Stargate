# Aeon Structural Dynamics CAD Drafting Terminal

> [!WARNING]
> **UNRESOLVED ISSUE - BUILD CLOSED AS-IS**
> The original build shipped with non-functional manual dialing. A dedicated fix pass diagnosed and addressed two specific issues (a missing manual ENGAGE control, and a Quick Dial state-wipe race condition). This fix was verified via real dispatched pointer events in automated testing. However, operator testing after that fix found that manual dialing *still* does not work. The root cause remains unresolved, and this build has been closed without further iteration.

## About
A complete, standalone, original interactive novelty portal-dialing website themed around an architectural blueprint and CAD drafting terminal with custom vector drafting linework, original glyph addressing, audio synthesis, review hold lockout, quick-dial site plans, responsive scaling, and automated testing verification.


## Shared verification dependencies — 2026-11-08

Browser verification uses the shared tools installed at the repository root. Run `npm ci --ignore-scripts` there before using this exhibit's verification commands, with system Chrome configured as required by the harness. Existing package commands and application assets are unchanged by this dependency maintenance.

Normal `npm start` uses shared loopback source preview at `http://127.0.0.1:5173`. Set `PORT` or pass `-- --port NUMBER` (also `-p`); explicit arguments take precedence. Invalid or occupied ports fail. Only tracked public assets are served; development files, traversal and unsupported methods are refused.

`npm test` now owns its loopback listeners and runs all three unchanged historical suites through the comparison adapter. Install the retained Vite package here with `npm ci --ignore-scripts` before comparison. The adapter suppresses the original suites’ unmanaged Python/Vite launcher calls. It starts its own bounded Vite comparison process on an ephemeral loopback port, then checks the shared preview separately.

**Historical suite result remains FAIL:** `test.js` and `run_tests_with_vite.js` expect automatic APPROVED status when Review Hold releases. Existing application behavior returns to DRAFT and requires the visible APPROVE / ENGAGE button. Both transports reproduced those same failures in run `42514572291`, job `128834661761`; `test_fix.js` passed on both. Six public assets, cancellation observations, shared security and listener cleanup were preserved.

The separate `node ../scripts/check-blueprint-drafting-contract.js` check exercises the existing explicit Engage contract. Its eight pointer cycles passed at 1080p/4K with 0/80/350ms input cadences (run `42512882276`, job `128829555754`). That supplemental result does not override the original-suite failures or the operator warning above. Sound/operator acceptance, merge and deployment remain on HOLD.
