# DITMCO — Municipal Conduit Registry Terminal (Form 1099-TX)

An interactive novelty portal-dialing website for the Department of Interzonal Transit & Municipal Conduit Oversight (DITMCO), Registry Division Annex 4-B. Dialing means filing a Form 1099-TX Clearance Application: an 8-symbol address stamped one glyph at a time into a 12-slot chevron lock matrix (8 standard fields, 4 reserved priority positions), tracked live on a vector CRT oscilloscope showing the conduit raster and event-horizon authorization plane. The Quick-Dial Cabinet carries three Tier-1 Approved Corridors and three Tier-2 Flagged Routes, and a basic dial completes in two actions from cold start. An Administrative Compliance Freeze (Section 44 Lockout Hold) can halt the desk mid-filing; REVOKE PERMIT / DISENGAGE tears down and redials cleanly. Consult the DITMCO Operator Manual (Form 0-A) via the top-right `?`.

Everything here is fictional and fully client-side, with no application backend or real destinations. Local preview uses a static development server.


## Local preview and verification

Run `node server.js` from this directory. It keeps port 8840 (`PORT` may override it), binds to loopback, and serves only the tracked public assets through the shared preview handler. The checkout must include the repository maintenance scripts. The original `node verify_test.js` command keeps port 8899 and its eight verification phases; its embedded server now uses the same restricted handler. Screenshots remain in the ignored `test/` directory.

The migration security and preservation suite is `node scripts/check-municipal-security.js` from the repository root. It compares the historical standalone and embedded handlers with both shared transports. The complete original eight-phase suite is retained. Its non-asserted authorization observations after 600ms now fall within buildup; the explicit CURRENT contract adds two sustained-stage waits while retaining all original positive assertions. Historical timing mismatches are reported separately.

Authorization now indexes the carrier for 1.4 seconds, produces an 0.8-second phosphor authorization flash, then opens the existing sustained conduit raster, approval stamp and telemetry. REVOKE PERMIT cancels either transitional stage; Compliance Freeze also cancels an activation in progress. The focused `node scripts/check-municipal-regressions.js` proves the former immediate-activation defect, distinct stages, pending presets, cancellation stability and exact replacement routes. Hosted browser and visual acceptance of this repair is pending; infrastructure checks and deterministic tests do not establish operator acceptance. Merge and deployment remain on HOLD.
