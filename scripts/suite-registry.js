"use strict";
// Registration is routing, not evidence of a pass. Only fresh executions qualify.
const MODES = ["legacy", "shared"];
const registry = [];
function entry(name, steps, options = {}) {
  registry.push({ exhibit: "stargate_" + name, qualification: "pending", scope: "original-suite-preservation", ...options, steps });
}
function report(id, script, file, modes = MODES, options = {}) {
  return { id, script: "scripts/" + script + ".js", args: [], timeoutMs: 600000,
    evidence: [{ file, kind: "report", modes }], ...options };
}
const pilotOriginal = report("pilot-original", "run-pilot-suites", "test/pilot-suites/report.json", [...MODES, "command"], { timeoutMs: 1200000 });
const pilotBrowser = report("pilot-browser", "check-pilot-browsers", "test/pilot-browser/report.json", MODES, { timeoutMs: 600000 });
for (const name of ["aetheric_telegraph", "bathyscaphe_pilot"]) entry(name, [pilotOriginal, pilotBrowser], { qualification: "established" });
entry("solarpunk_astra", [pilotBrowser], { qualification: "established", scope: "supplementary-only" });
entry("bibliographic_depository", [report("bibliographic", "check-consolidation", "test/consolidation/report.json")], { qualification: "established" });
for (const [name, id] of [["erebus_signal", "erebus"], ["reactor_criticality", "reactor"]]) {
  entry(name, [report(id, "check-" + id + "-security", "test/" + id + "-security/report.json")], { qualification: "established" });
}
entry("blueprint_alpha", [report("blueprint", "check-blueprint-security", "test/blueprint-security/report.json",
  ["legacy-custom", "legacy-test", "shared", "node-command", "npm-start", "shared-test", "npm-test"])], { qualification: "established" });
entry("municipal_registry", [report("municipal", "check-municipal-security", "test/municipal-security/report.json", ["legacy", "legacy-embedded", "shared", "shared-embedded"])]);
for (const [name, id] of [["synchrotron_collider", "synchrotron"], ["sigint_cryptanalysis", "sigint"], ["konstrukt_transit", "konstrukt"], ["apiculture_telemetry", "apiculture"]]) {
  entry(name, [{ id, script: "scripts/check-" + id + "-security.js", args: [], timeoutMs: 600000,
    evidence: MODES.map(mode => ({ file: "test/" + id + "-security/" + mode + ".json", kind: "mode", mode })) }],
  name === "synchrotron_collider" ? { qualification: "established" } : {});
}
const groups = {
  science: ["epigraphic_spectrometry", "genomic_sequencer", "windtunnel_aerodynamics"],
  instrument: ["caissa_workstation", "cyberpunk_gemini", "fulldome_planetarium", "seismic_triangulation", "ukiyo_waystation"],
  specialist: ["atompunk_fable", "canopy_commons", "dark_gothic_fable", "nouveau_nimbus", "futurist_dynamism"],
  secondary: ["bathyscaphe_pilot_fable", "dark_matter_array", "solarpunk_conservatory", "lowmagic_gemini"],
  telemetry: ["meteorological_nexrad", "orbital_atc", "solarpunk_ecogrid", "sonar_abyssal"],
  "extra-entry": ["cyberpunk_fable", "steampunk_fable", "ukiyo_waystation_fable"]
};
for (const [group, names] of Object.entries(groups)) for (const name of names) {
  const exhibit = "stargate_" + name;
  entry(name, [{ id: group + "-" + name, script: "scripts/check-" + group + "-security.js",
    args: group === "instrument" ? ["--exhibit", exhibit] : [exhibit], timeoutMs: 1200000,
    evidence: MODES.map(mode => ({ file: "test/" + group + "-security/" + exhibit + "/" + mode + "/result.json", kind: "mode", mode })) }],
  name === "lowmagic_gemini" ? { scope: "supplementary-only" } : {});
}
// Each contract points to original-suite evidence, independently of the enclosing
// HTTP/browser report status. Missing or diagnostic evidence cannot become PASS.
function originalContract(exhibit, contract, stepId) {
  for (const step of registry.find(item => item.exhibit === exhibit).steps) if (!stepId || step.id === stepId) {
    for (const evidence of step.evidence) evidence.originalSuite = contract;
  }
}
for (const name of ["aetheric_telegraph", "bathyscaphe_pilot"]) originalContract("stargate_" + name, { kind: "status", path: "status" }, "pilot-original");
originalContract("stargate_bibliographic_depository", { kind: "assertion-log", path: "assertions", summary: "TEST SUMMARY: (\\d+) PASSED, (\\d+) FAILED" });
originalContract("stargate_reactor_criticality", { kind: "status", at: "document", path: "originalSuite.status" });
originalContract("stargate_blueprint_alpha", { kind: "status", path: "historicalSuite.status", modes: ["legacy-custom", "shared"] });
originalContract("stargate_municipal_registry", { kind: "status", path: "originalSuite.status" });
for (const name of ["synchrotron_collider", "sigint_cryptanalysis", "konstrukt_transit"]) originalContract("stargate_" + name, { kind: "status", path: "originalSuite.status" });
originalContract("stargate_apiculture_telemetry", { kind: "status", path: "original.status" });
for (const group of ["science", "instrument", "specialist", "telemetry"]) for (const name of groups[group]) originalContract("stargate_" + name, { kind: "status", path: "original.status" });
const multiSuites = {
  bathyscaphe_pilot_fable: ["verify/run.js", "verify/closeout.js", "verify/closeout_stages.js", "verify/smoke.js"],
  dark_matter_array: ["test/verify.js", "test/verify_tabs.js", "test/verify_viewport_scaling.js", "test/final_closeout_verify.js", "test/diag_viewport.js"],
  solarpunk_conservatory: ["test/run-tests.mjs"], cyberpunk_fable: ["test/run-tests.mjs"], steampunk_fable: ["test/run-tests.mjs"],
  ukiyo_waystation_fable: ["test/run-tests.mjs", "test/ring-verify.mjs", "test/diagnose.mjs", "test/probe-4k.mjs"]
};
for (const [name, suites] of Object.entries(multiSuites)) originalContract("stargate_" + name, { kind: "suite-array", path: "suites", suites });
// Erebus' original logs are observations. Its adapter's additional predicates
// remain useful evidence, but do not create original-suite assertions.
registry.find(item => item.exhibit === "stargate_erebus_signal").scope = "original-observational-harness";
const packageSuites = {
  cathedral_oculus: ["tests/verify.js"], mastering_suite: ["test_suite.js"],
  blueprint_drafting: ["test.js", "test_fix.js", "run_tests_with_vite.js"], orthographic_cad: ["tests/e2e.test.mjs"],
  radio_interferometry: ["test_e2e.mjs"], seti_deepscope: ["test_e2e.js"], seti_freeform: ["test_e2e.js"]
};
for (const [name, suites] of Object.entries(packageSuites)) {
  const exhibit = "stargate_" + name;
  entry(name, [{ id: "package-" + name, script: "scripts/check-package-entry-security.js", args: [exhibit], timeoutMs: 1200000,
    evidence: MODES.map(mode => ({ file: "test/package-entry-security/" + exhibit + "/" + mode + "/result.json", kind: "mode", mode,
      originalSuite: { kind: "suite-array", path: "suites", suites } })) }]);
}
function remainingStep(name, mode, original = false) {
  const exhibit = "stargate_" + name;
  return { id: "remaining-" + name, qualification: "pending", script: "scripts/check-remaining-harnesses.js", args: [exhibit], timeoutMs: 300000,
    evidence: [{ file: "test/remaining-harnesses/" + exhibit + "/result.json", kind: "mode", mode,
      ...(original ? { originalSuite: { kind: "status", path: "originalSuiteStatus" } } : {}) }] };
}
for (const name of ["celestial_astrolabe", "darkpool_router", "lumina_grove", "high_scifi"]) {
  entry(name, [remainingStep(name, "shared", true)], ["celestial_astrolabe", "high_scifi"].includes(name) ? { scope: "supplementary-only" } : {});
}
for (const [name, mode] of [["aetheric_telegraph", "tooling"], ["bibliographic_depository", "tooling"], ["solarpunk_conservatory", "shared"]]) {
  registry.find(item => item.exhibit === "stargate_" + name).steps.push(remainingStep(name, mode));
}
// Hosted qualification: runs 42466761472, 42508178082 and 42508378871.
// This makes the checker eligible for execution; fresh results still decide status.
for (const name of ["cyberpunk_gemini","fulldome_planetarium","seismic_triangulation","ukiyo_waystation","lowmagic_gemini","municipal_registry","apiculture_telemetry","steampunk_fable","ukiyo_waystation_fable","sigint_cryptanalysis","konstrukt_transit","epigraphic_spectrometry","genomic_sequencer","windtunnel_aerodynamics","canopy_commons","dark_gothic_fable","nouveau_nimbus","futurist_dynamism","caissa_workstation","dark_matter_array","meteorological_nexrad","orbital_atc","solarpunk_ecogrid","sonar_abyssal"]) registry.find(entry => entry.exhibit === "stargate_" + name).qualification = "established";
for (const [name, job, detail] of [
  ["atompunk_fable", 128819587859, "Legacy 103/104; shared 102/104. Pending luminance fails both; original assertions remain FAIL."],
  ["solarpunk_conservatory", 128819587912, "Legacy/shared 41/42; stage-pair distances 9.0/10.6 below required 12. Original assertions remain FAIL."]
]) {
  const item = registry.find(item => item.exhibit === "stargate_" + name);
  item.qualification = "established";
  item.qualificationEvidence = { status: "BASELINE_FAILURE_PRESERVED", run: 42509607423, job, detail,
    url: "https://github.com/StarlightDaemon/Stargate/actions/runs/42509607423/job/" + job };
}
const cyberpunkFable = registry.find(item => item.exhibit === "stargate_cyberpunk_fable");
cyberpunkFable.qualification = "established";
cyberpunkFable.qualificationEvidence = { status: "PASS", run: 42510716794, job: 128822958190,
  detail: "Original 42/42 in both modes, 10 assets; reported paired-stage visual review passed. Full operator acceptance remains separate.",
  url: "https://github.com/StarlightDaemon/Stargate/actions/runs/42510716794/job/128822958190" };
const lantern = registry.find(item => item.exhibit === "stargate_bathyscaphe_pilot_fable");
lantern.qualification = "established";
lantern.qualificationEvidence = { status: "BASELINE_FAILURE_PRESERVED", run: 42510045209, job: 128820919093,
  detail: "Nine exact public assets and close-out 185/185 in both modes. Build 132/133 retains the normalized-heading mismatch; stages 23/24 retain breakthrough white-rim failure. Smoke is diagnostic. Launcher migration does not turn these originals into PASS.",
  url: "https://github.com/StarlightDaemon/Stargate/actions/runs/42510045209/job/128820919093" };
// Fresh proof qualifies execution, while each harness keeps its original meaning.
for (const [name, job, scope, originalSuiteStatus] of [
  ["high_scifi", 128827398184, "original-diagnostic-with-supplementary-guards", "UNVERIFIED"],
  ["celestial_astrolabe", 128827398206, "original-observational-harness", "UNVERIFIED"],
  ["bibliographic_depository", 128827398209, "unused-mock-scaffold-only", "UNVERIFIED"],
  ["darkpool_router", 128827398217, "original-suite", "PASS"],
  ["aetheric_telegraph", 128827398275, "dependency-load-smoke", "UNVERIFIED"],
  ["lumina_grove", 128827398324, "original-suite", "PASS"],
  ["solarpunk_conservatory", 128827398290, "original-preview-capture-tool", "UNVERIFIED"]
]) {
  const item = registry.find(item => item.exhibit === "stargate_" + name);
  const step = item.steps.find(step => step.id === "remaining-" + name);
  step.qualification = "established";
  step.qualificationEvidence = { status: "PASS", originalSuiteStatus, scope, run: 42512175752, job,
    url: "https://github.com/StarlightDaemon/Stargate/actions/runs/42512175752/job/" + job };
  if (["high_scifi", "celestial_astrolabe", "darkpool_router", "lumina_grove"].includes(name)) item.qualification = "established";
}
function supplementary(name, step, job) {
  step.scope = "supplementary-current-regression";
  step.qualification = job ? "established" : "pending";
  if (job) step.qualificationEvidence = { status: "PASS", originalSuiteStatus: "UNVERIFIED", run: 42512175752, job,
    url: "https://github.com/StarlightDaemon/Stargate/actions/runs/42512175752/job/" + job };
  registry.find(item => item.exhibit === "stargate_" + name).steps.push(step);
}
for (const [name, id, job] of [
  ["erebus_signal", "erebus-regressions", 128827398241],
  ["nouveau_nimbus", "nimbus-notes-security", 128827398259],
  ["reactor_criticality", "reactor-regressions", 128827398421]
]) supplementary(name, report(id, "check-" + id, "test/" + id + "/report.json", ["baseline-client", "repaired-client"]), job);
for (const [name, id, job] of [
  ["blueprint_alpha", "blueprint-regressions", 128827398288],
  ["bathyscaphe_pilot", "bathyscaphe-regressions", 128827398351]
]) supplementary(name, { id, script: "scripts/check-" + id + ".js", args: [], timeoutMs: 1200000,
  evidence: ["deterministic", "browser"].map(file => ({ file: "test/" + id + "/" + file + ".json", kind: "status", statusPath: "status" })) }, job);
for (const name of ["solarpunk_ecogrid", "seti_freeform"]) supplementary(name,
  report("keyboard-interlocks", "check-keyboard-interlocks", "test/keyboard-interlocks/report.json", ["baseline", "repaired"]), 128827398337);
supplementary("municipal_registry", { id: "municipal-regressions", script: "scripts/check-municipal-regressions.js", args: [], timeoutMs: 1200000,
  evidence: ["deterministic.status", "browser.repaired.status"].map(statusPath => ({ file: "test/municipal-regressions/report.json", kind: "status", statusPath })) });
supplementary("blueprint_drafting", { id: "blueprint-drafting-contract", script: "scripts/check-blueprint-drafting-contract.js", args: [], timeoutMs: 1200000,
  evidence: [{ file: "test/blueprint-drafting-current-contract/result.json", kind: "status", statusPath: "currentContractStatus", currentPath: "cycles" }] });
// Latest completed source/contract evidence. Eligibility includes checkers that
// truthfully reproduce a known failure; it never converts that failure to PASS.
function latestEvidence(job, status, detail, originalSuiteStatus = "UNVERIFIED", run = 42514572291) {
  return { status, originalSuiteStatus, detail, run, job,
    operatorStatus: "UNVERIFIED", acceptanceStatus: "UNVERIFIED",
    url: "https://github.com/StarlightDaemon/Stargate/actions/runs/" + run + "/job/" + job };
}
for (const [name, job, status, originalStatus, detail] of [
  ["cathedral_oculus", 128834661763, "PASS", "PASS", "Original 32 records and eight public assets passed in both modes. Separate layout diagnostic does not establish visual acceptance."],
  ["mastering_suite", 128834661646, "PASS", "PASS", "Full original test_suite.js and ten public assets passed in both modes."],
  ["orthographic_cad", 128834661654, "PASS", "PASS", "Original 41/41 and eleven public assets passed in both source modes; built-preview qualification remains separate."],
  ["radio_interferometry", 128834661724, "PASS", "PASS", "Full original test_e2e.mjs and eight public assets passed in both source modes; built-preview qualification remains separate."],
  ["seti_deepscope", 128834661714, "FAIL", "PASS", "Full original test_e2e.js passed in both modes. Legacy Vite cleanup exceeded 10000ms, so aggregate preservation remains FAIL despite shared PASS; fresh cleanup and built-preview proof required."],
  ["blueprint_drafting", 128834661761, "FAIL", "FAIL", "Both modes retain the automatic-approval assertion failures in test.js and run_tests_with_vite.js; test_fix.js passes. The explicit-Engage current contract is a separate step."],
  ["nouveau_nimbus", 128834662081, "PASS", "PASS", "Full original assertions passed in legacy and shared modes; notes-injection regression remains a separate step."]
]) {
  const item = registry.find(item => item.exhibit === "stargate_" + name);
  item.qualification = "established";
  item.qualificationEvidence = latestEvidence(job, status, detail, originalStatus);
}
for (const [name, id, job, detail] of [
  ["blueprint_drafting", "blueprint-drafting-contract", 128834661891, "Eight current-contract pointer cycles passed; historical automatic-approval originals remain FAIL."],
  ["blueprint_alpha", "blueprint-regressions", 128834661643, "Deterministic and browser regressions passed, including staged activation, header geometry and mute restoration; retained historical originals and operator issue are separate."],
  ["bathyscaphe_pilot", "bathyscaphe-regressions", 128834661691, "Deterministic and browser regressions passed, including manual takeover, cancellation telemetry, and archive counters."],
  ["nouveau_nimbus", "nimbus-notes-security", 128834661673, "Baseline-client and repaired-client injection regressions passed."],
  ["solarpunk_ecogrid", "keyboard-interlocks", 128834661830, "Baseline and repaired keyboard interlock regressions passed."],
  ["seti_freeform", "keyboard-interlocks", 128834661830, "Baseline and repaired keyboard interlock regressions passed; the package-source checker remains independently pending."]
]) {
  const step = registry.find(item => item.exhibit === "stargate_" + name).steps.find(step => step.id === id);
  step.qualification = "established";
  step.qualificationEvidence = latestEvidence(job, "PASS", detail);
}
registry.find(item => item.exhibit === "stargate_municipal_registry").steps.find(step => step.id === "municipal-regressions").qualificationEvidence =
  latestEvidence(128834661710, "FAIL", "Latest stage-color predicate failed; the diagnosed render-frame sampling correction still requires fresh hosted proof. This supplementary step remains pending.");
// The following fresh executions supersede those two historical failures.
const deepscope = registry.find(item => item.exhibit === "stargate_seti_deepscope");
deepscope.qualificationHistory = [deepscope.qualificationEvidence];
deepscope.qualificationEvidence = latestEvidence(128836833564, "PASS",
  "Full original assertions, fifteen public assets, cancellation/restart and owned Vite cleanup passed in both source modes. The earlier cleanup FAIL is historical.", "PASS", 42515274539);
const municipalRegression = registry.find(item => item.exhibit === "stargate_municipal_registry").steps.find(step => step.id === "municipal-regressions");
municipalRegression.qualificationHistory = [municipalRegression.qualificationEvidence];
municipalRegression.qualification = "established";
municipalRegression.qualificationEvidence = latestEvidence(128836833671, "PASS",
  "Deterministic and strengthened browser regressions passed: stage oscillator starts 26/32/34, exactly two sustained oscillators, seven cancellations with zero active oscillators after 8.25s, no muted starts, and unchanged pixel thresholds. Audio quality and operator acceptance remain separate.", "UNVERIFIED", 42515274539);
for (const [name, job, status, detail] of [
  ["radio_interferometry", 128836833556, "PASS", "Four exact built assets, Host/origin policy, rendering, full originals, cancellation, port conflict and shutdown passed."],
  ["orthographic_cad", 128836833546, "PASS", "Four exact built assets, Host/origin policy, rendering, full originals, cancellation, port conflict and shutdown passed."],
  ["seti_deepscope", 128836833502, "PASS", "Four exact built assets, Host/origin policy, rendering, full originals, cancellation, port conflict and shutdown passed."],
  ["seti_freeform", 128836833483, "FAIL", "Four built assets, Host/origin policy, rendering and cancellation passed; the retained original 350ms manual assertion reports DIALING instead of READY. Port release was not recorded before that assertion failed in this run. No full built-contract PASS."]
]) {
  const item = registry.find(item => item.exhibit === "stargate_" + name);
  item.steps.push({ id: "built-" + name, script: "scripts/check-vite-built-preview.js", args: [item.exhibit], timeoutMs: 1200000,
    qualification: "established", scope: "supplementary-built-artifact",
    qualificationEvidence: latestEvidence(job, status, detail, status, 42515274539),
    evidence: [{ file: "test/vite-built-preview/" + item.exhibit + "/result.json", kind: "status", statusPath: "status" }] });
}
supplementary("seti_freeform", { id: "freeform-manual-contract", script: "scripts/check-freeform-manual-contract.js", args: [], timeoutMs: 1200000,
  evidence: [{ file: "test/freeform-manual-contract/result.json", kind: "status", statusPath: "currentContractStatus", currentPath: "cycles" }] });
function getSuite(exhibit) { return registry.find(item => item.exhibit === exhibit); }
module.exports = { registry, getSuite };
