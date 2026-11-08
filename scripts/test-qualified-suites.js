"use strict";
const test = require("node:test"), assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path");
const { registry, getSuite } = require("./suite-registry.js");
const { assessEvidence, summarize, executeStep, runQualifiedSuite } = require("./run-qualified-suites.js");
const ROOT = path.resolve(__dirname, ".."), BASE = path.join(ROOT, "test"); fs.mkdirSync(BASE, { recursive: true });
const entry = { exhibit: "controlled-fixture", qualification: "established", scope: "original-suite-preservation" };
const spec = { kind: "mode", mode: "shared", originalSuite: { kind: "status", path: "originalSuiteStatus" } };
const execution = document => [{ id: "fixture", code: 0, artifacts: [{ ...spec, source: "controlled-fixture.json", snapshot: "snapshot.json", document }] }];
test("registry covers exact package/browser targets and preserves known failed originals", () => {
  assert.equal(registry.length, 47); assert.equal(new Set(registry.map(item => item.exhibit)).size, 47);
  for (const item of registry) for (const step of item.steps) { assert.ok(fs.existsSync(path.join(ROOT, item.exhibit))); assert.ok(fs.existsSync(path.join(ROOT, step.script))); assert.ok(step.timeoutMs > 0); }
  assert.deepEqual(getSuite("stargate_cyberpunk_gemini").steps[0].args, ["--exhibit", "stargate_cyberpunk_gemini"]);
  assert.equal(getSuite("stargate_cathedral_oculus").qualification, "established");
  assert.equal(getSuite("stargate_seti_deepscope").qualificationEvidence.status, "FAIL");
  assert.equal(getSuite("stargate_seti_deepscope").qualificationEvidence.originalSuiteStatus, "PASS");
  assert.equal(getSuite("stargate_blueprint_drafting").qualificationEvidence.originalSuiteStatus, "FAIL");
  for (const name of ["stargate_darkpool_router", "stargate_lumina_grove", "stargate_high_scifi", "stargate_celestial_astrolabe"]) assert.equal(getSuite(name).qualification, "established");
  for (const name of ["stargate_atompunk_fable", "stargate_solarpunk_conservatory", "stargate_bathyscaphe_pilot_fable"]) { const item = getSuite(name); assert.equal(item.qualification, "established"); assert.equal(item.qualificationEvidence.status, "BASELINE_FAILURE_PRESERVED"); }
});
test("supplementary status contracts require exact fresh PASS without rewriting historical or original status", () => {
  const spec = { kind: "status", statusPath: "current.status" };
  const document = { historical: { status: "FAIL" }, current: { status: "PASS" }, originalSuiteStatus: "UNVERIFIED" };
  const execution = value => [{ id: "supplementary", code: 0, artifacts: [{ ...spec, document: value }] }];
  let result = summarize(entry, execution(document));
  assert.equal(result.preservationStatus, "PASS"); assert.equal(result.originalSuiteStatus, "UNVERIFIED");
  assert.equal(result.operatorStatus, "UNVERIFIED"); assert.equal(result.status, "UNVERIFIED");
  for (const value of [undefined, null, true, 1, "UNVERIFIED", "FAIL", {}]) {
    result = summarize(entry, execution({ ...document, current: { status: value } }));
    assert.equal(result.preservationStatus, "FAIL");
  }
  assert.ok(assessEvidence(document, { kind: "status" }, entry.exhibit).errors.length);
  assert.ok(assessEvidence(document, { ...spec, currentPath: "missing" }, entry.exhibit).errors.length);
  assert.ok(assessEvidence(document, { ...spec, originalSuite: { kind: "status", path: "current.status" } }, entry.exhibit).errors.length);
  result = summarize(entry, execution({ ...document, current: { status: "PASS", child: { status: "FAIL" } } }));
  assert.equal(result.status, "FAIL", "Current nested failures cannot hide behind their parent's PASS");
  result = summarize(entry, [{ id: "stale-supplementary", code: 0, artifacts: [{ ...spec, error: "Missing or stale evidence" }] }]);
  assert.equal(result.status, "FAIL");
  const originalFail = execution({ mode: "shared", status: "PASS", originalSuiteStatus: "FAIL" });
  originalFail[0].artifacts[0] = { kind: "mode", mode: "shared", originalSuite: { kind: "status", path: "originalSuiteStatus" }, document: originalFail[0].artifacts[0].document };
  result = summarize(entry, [...originalFail, ...execution(document)]);
  assert.equal(result.originalSuiteStatus, "FAIL"); assert.equal(result.status, "FAIL");
});
test("coverage retains the saved counts and mirrors current routing without inventing passes", () => {
  const coverage = require("./qualification-coverage.json");
  assert.equal(coverage.counts.activeTargets, 57); assert.equal(coverage.counts.recordedHarnessPaths, 62);
  assert.equal(coverage.targets.length, 57);
  for (const item of registry) {
    const row = coverage.targets.find(row => row.exhibit === item.exhibit);
    assert.equal(row.registration.qualification, item.qualification);
    assert.deepEqual(row.checks.map(check => check.command), item.steps.map(step => ["node", step.script, ...step.args].join(" ")));
    assert.deepEqual(row.checks.map(check => check.qualification), item.steps.map(step => step.qualification || item.qualification));
    if (row.lastReported.status === "PASS") assert.ok(row.lastReported.run && row.lastReported.job, "Historical PASS needs its retained evidence reference");
    assert.notEqual(row.lastReported.operatorStatus, "PASS");
    for (const step of item.steps.filter(step => step.scope === "supplementary-current-regression")) assert.ok(step.evidence.every(spec => !spec.originalSuite));
  }
  for (const name of ["high_scifi", "celestial_astrolabe", "darkpool_router", "lumina_grove"]) {
    assert.notEqual(coverage.targets.find(row => row.exhibit === "stargate_" + name).lastReported.status, "PASS", "Promoting routing does not overwrite last reported acceptance");
  }
});
test("original status is explicit: diagnostic/report PASS cannot invent original PASS", () => {
  const document = { mode: "shared", status: "PASS", originalSuiteStatus: "UNVERIFIED" };
  let result = summarize(entry, execution(document));
  assert.equal(result.preservationStatus, "PASS"); assert.equal(result.originalSuiteStatus, "UNVERIFIED"); assert.equal(result.status, "UNVERIFIED");
  result = summarize(entry, execution({ mode: "shared", status: "PASS" })); assert.equal(result.originalSuiteStatus, "UNVERIFIED"); assert.equal(result.status, "UNVERIFIED");
  result = summarize({ ...entry, scope: "supplementary-only" }, execution({ ...document, originalSuiteStatus: "PASS" })); assert.equal(result.originalSuiteStatus, "UNVERIFIED");
});
test("current functional/original failures remain separate from preservation and historical findings", () => {
  let result = summarize(entry, execution({ mode: "shared", status: "PASS", originalSuiteStatus: "PASS", functionalAcceptance: "FAIL: confirmed current defect" }));
  assert.equal(result.preservationStatus, "PASS"); assert.equal(result.originalSuiteStatus, "PASS"); assert.equal(result.functionalStatus, "FAIL"); assert.equal(result.status, "FAIL");
  result = summarize(entry, execution({ mode: "shared", status: "PASS", originalSuiteStatus: "FAIL" })); assert.equal(result.originalSuiteStatus, "FAIL"); assert.equal(result.status, "FAIL");
  const blueprint = { mode: "shared", status: "PASS", historicalSuite: { status: "FAIL", expectedFailureObserved: true }, currentContract: { status: "PASS" } };
  const historicalExecution = [{ id: "fixture", code: 0, artifacts: [{ ...spec, originalSuite: { kind: "status", path: "historicalSuite.status" }, document: blueprint }] }];
  result = summarize(entry, historicalExecution); assert.equal(result.preservationStatus, "PASS"); assert.equal(result.originalSuiteStatus, "FAIL"); assert.equal(result.status, "FAIL");
  const report = { status: "PASS", historicalServe: { status: "FAIL" }, results: [{ mode: "shared", status: "PASS", originalSuiteStatus: "PASS" }] };
  const assessment = assessEvidence(report, { kind: "report", modes: ["shared"], originalSuite: spec.originalSuite }, entry.exhibit);
  assert.equal(assessment.findings.length, 0); assert.ok(assessment.originalStatuses.every(row => row.status === "PASS"));
});
test("evidence rejects wrong targets/modes and requires all named original suites", () => {
  assert.ok(assessEvidence(null, spec, entry.exhibit).errors.length);
  assert.ok(assessEvidence({ exhibit: "other", mode: "shared", status: "PASS" }, spec, entry.exhibit).errors.length);
  assert.ok(assessEvidence({ mode: "legacy", status: "PASS" }, spec, entry.exhibit).errors.length);
  assert.ok(assessEvidence({ results: [{ mode: "shared", status: "PASS" }, { mode: "shared", status: "PASS" }] }, { kind: "report", modes: ["shared"] }, entry.exhibit).errors.length);
  const arraySpec = { ...spec, originalSuite: { kind: "suite-array", path: "suites", suites: ["one.js", "two.js"] } };
  let assessment = assessEvidence({ mode: "shared", status: "PASS", suites: [{ suite: "one.js", status: "PASS" }] }, arraySpec, entry.exhibit);
  assert.ok(assessment.originalStatuses.some(row => row.status === "UNVERIFIED"));
  assessment = assessEvidence({ mode: "shared", status: "PASS", suites: [{ suite: "one.js", status: "PASS" }, { suite: "two.js", status: "FAIL" }] }, arraySpec, entry.exhibit);
  assert.ok(assessment.originalStatuses.some(row => row.status === "FAIL"));
});
test("pending tooling is disclosed without rewriting established original evidence", async () => {
  const result = summarize(entry, execution({ mode: "shared", status: "PASS", originalSuiteStatus: "PASS" }), [{ id: "pending-tool", status: "UNVERIFIED" }]);
  assert.equal(result.originalSuiteStatus, "PASS"); assert.equal(result.coverageStatus, "UNVERIFIED"); assert.equal(result.status, "UNVERIFIED");
  const pending = { exhibit: "controlled-pending-qualification", qualification: "pending", steps: [{ script: "must-not-execute.cjs" }] };
  registry.push(pending);
  try {
    const result = await runQualifiedSuite(pending.exhibit);
    assert.equal(result.status, "UNVERIFIED");
    assert.match(result.reason, /Qualification pending/);
    assert.equal(result.executions, undefined, "Pending qualification must not launch a command");
  } finally { registry.splice(registry.indexOf(pending), 1); }
});
test("real owned children require fresh valid evidence, successful exit and bounded completion", async () => {
  const folder = fs.mkdtempSync(path.join(BASE, "qualified-runner-test-")), source = path.join(folder, "result.json"), script = path.join(folder, "child.cjs");
  fs.writeFileSync(script, "const fs=require('node:fs');const [action,file]=process.argv.slice(2);if(action==='write'||action==='fail')fs.writeFileSync(file,JSON.stringify({mode:'shared',status:'PASS',originalSuiteStatus:'PASS'}));if(action==='malformed')fs.writeFileSync(file,'{broken');if(action==='fail')process.exitCode=1;if(action==='hang')setInterval(()=>{},1000);");
  const step = action => ({ id: "controlled-" + action, script: path.relative(ROOT, script), args: [action, source], timeoutMs: action === "hang" ? 100 : 5000,
    evidence: [{ ...spec, file: path.relative(ROOT, source) }] });
  const run = async action => { const result = await executeStep(step(action), path.join(folder, action)); return { execution: result, result: summarize(entry, [result]) }; };
  let actual = await run("write"); assert.equal(actual.result.status, "PASS"); assert.match(actual.execution.artifacts[0].sha256, /^[0-9a-f]{64}$/); assert.ok(fs.existsSync(path.join(ROOT, actual.execution.artifacts[0].snapshot)));
  actual = await run("stale"); assert.equal(actual.result.status, "FAIL"); assert.match(actual.result.errors.join("\n"), /stale evidence/);
  actual = await run("malformed"); assert.equal(actual.result.status, "FAIL");
  actual = await run("fail"); assert.equal(actual.result.status, "FAIL"); assert.ok(actual.execution.artifacts[0].sha256);
  actual = await run("hang"); assert.equal(actual.result.status, "FAIL"); assert.equal(actual.execution.timedOut, true);
  const statusStep = action => ({ ...step(action), evidence: [{ kind: "status", statusPath: "status", file: path.relative(ROOT, source) }] });
  let statusExecution = await executeStep(statusStep("write"), path.join(folder, "status-write"));
  let statusResult = summarize(entry, [statusExecution]);
  assert.equal(statusResult.preservationStatus, "PASS"); assert.equal(statusResult.originalSuiteStatus, "UNVERIFIED");
  statusExecution = await executeStep(statusStep("stale"), path.join(folder, "status-stale"));
  assert.equal(summarize(entry, [statusExecution]).status, "FAIL", "Supplementary status evidence must also be freshly rewritten");
});
