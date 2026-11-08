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
// Hosted qualification: runs 42466761472, 42508178082 and 42508378871.
// This makes the checker eligible for execution; fresh results still decide status.
for (const name of ["cyberpunk_gemini","fulldome_planetarium","seismic_triangulation","ukiyo_waystation","lowmagic_gemini","municipal_registry","apiculture_telemetry","steampunk_fable","ukiyo_waystation_fable","sigint_cryptanalysis","konstrukt_transit","epigraphic_spectrometry","genomic_sequencer","windtunnel_aerodynamics","canopy_commons","dark_gothic_fable","nouveau_nimbus","futurist_dynamism","caissa_workstation","dark_matter_array","meteorological_nexrad","orbital_atc","solarpunk_ecogrid","sonar_abyssal"]) registry.find(entry => entry.exhibit === "stargate_" + name).qualification = "established";
function getSuite(exhibit) { return registry.find(item => item.exhibit === exhibit); }
module.exports = { registry, getSuite };
