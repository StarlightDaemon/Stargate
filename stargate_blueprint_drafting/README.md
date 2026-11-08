# Aeon Structural Dynamics CAD Drafting Terminal

> [!WARNING]
> **UNRESOLVED ISSUE - BUILD CLOSED AS-IS**
> The original build shipped with non-functional manual dialing. A dedicated fix pass diagnosed and addressed two specific issues (a missing manual ENGAGE control, and a Quick Dial state-wipe race condition). This fix was verified via real dispatched pointer events in automated testing. However, operator testing after that fix found that manual dialing *still* does not work. The root cause remains unresolved, and this build has been closed without further iteration.

## About
A complete, standalone, original interactive novelty portal-dialing website themed around an architectural blueprint and CAD drafting terminal with custom vector drafting linework, original glyph addressing, audio synthesis, review hold lockout, quick-dial site plans, responsive scaling, and automated testing verification.


## Shared verification dependencies — 2026-11-08

Browser verification uses the shared tools installed at the repository root. Run `npm ci --ignore-scripts` there before using this exhibit's verification commands, with system Chrome configured as required by the harness. Existing package commands and application assets are unchanged by this dependency maintenance.

This exhibit still has its own development-server dependencies: also run `npm ci --ignore-scripts` in this directory for the existing Vite/http-server commands. Dependency qualification does not qualify those serving policies; entry-point security remains a separate migration.
