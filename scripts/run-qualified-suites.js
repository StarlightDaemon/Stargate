"use strict";
// Existing checkers retain ownership of their original assertions and comparisons.
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawn } = require("node:child_process");
const { registry, getSuite } = require("./suite-registry.js");
const ROOT = path.resolve(__dirname, "..");
const relative = file => path.relative(ROOT, file).split(path.sep).join("/");
function stamp(file) {
  try { const stat = fs.statSync(file, { bigint: true }); return stat.mtimeNs.toString() + ":" + stat.ctimeNs.toString(); }
  catch (error) { if (error.code === "ENOENT") return null; throw error; }
}
function scanFindings(value, prefix = "", findings = []) {
  if (!value || typeof value !== "object") return findings;
  for (const [key, child] of Object.entries(value)) {
    const location = prefix ? prefix + "." + key : key;
    if ((key === "functionalAcceptance" || key === "functionalStatus") && typeof child === "string" && /^FAIL\b/.test(child)) findings.push({ kind: "functional", location, detail: child });
    else if ((key === "status" || key === "originalSuiteStatus") && child === "FAIL") findings.push({ kind: "assertion", location, detail: "Existing checker recorded FAIL" });
    if (child && typeof child === "object") scanFindings(child, location, findings);
  }
  return findings;
}
const valueAt = (value, dotted) => dotted.split(".").reduce((value, key) => value?.[key], value);
const evidenceStatus = value => ["PASS", "FAIL", "ENVIRONMENT-BLOCKED"].includes(value) ? value : "UNVERIFIED";
function originalStatuses(document, rows, contract) {
  if (!contract) return [];
  const statuses = [];
  if (Object.hasOwn(document, "originalSuiteStatus")) statuses.push({ location: "originalSuiteStatus", status: evidenceStatus(document.originalSuiteStatus) });
  const sources = contract.at === "document" ? [document] : rows.filter(row => !contract.modes || contract.modes.includes(row.mode));
  for (const source of sources) {
    const location = (source.mode || "document") + "." + contract.path;
    if (Object.hasOwn(source, "originalSuiteStatus")) { statuses.push({ location, status: evidenceStatus(source.originalSuiteStatus) }); continue; }
    const value = valueAt(source, contract.path);
    if (contract.kind === "status") statuses.push({ location, status: evidenceStatus(value) });
    else if (contract.kind === "suite-array") {
      if (!Array.isArray(value) || !value.length) { statuses.push({ location, status: "UNVERIFIED", reason: "Missing original suite results" }); continue; }
      for (const suite of contract.suites) {
        const matches = value.filter(item => item.suite === suite);
        statuses.push({ location: location + ":" + suite, status: matches.length === 1 ? evidenceStatus(matches[0].status) : "UNVERIFIED", ...(matches.length === 1 ? {} : { reason: "Original suite result missing or duplicated" }) });
      }
    } else if (contract.kind === "assertion-log") {
      const summaries = Array.isArray(value) ? value.map(line => String(line).match(new RegExp(contract.summary))).filter(Boolean) : [];
      const status = summaries.length !== 1 ? "UNVERIFIED" : Number(summaries[0][2]) > 0 || value.some(line => /^\[FAIL\]/.test(line)) ? "FAIL" : Number(summaries[0][1]) > 0 ? "PASS" : "UNVERIFIED";
      statuses.push({ location, status });
    } else statuses.push({ location, status: "UNVERIFIED", reason: "Unknown original-suite evidence contract" });
  }
  return statuses;
}
function assessEvidence(document, spec, exhibit) {
  const errors = [], findings = [];
  if (!document || typeof document !== "object" || Array.isArray(document)) return { errors: ["Evidence must be a result object"], findings };
  if (document.exhibit && document.exhibit !== exhibit) errors.push("Evidence belongs to another exhibit: " + document.exhibit);
  if (document.status && document.status !== "PASS") errors.push("Report status: " + document.status);
  let rows;
  if (spec.kind === "mode") {
    rows = [document];
    if (document.mode !== spec.mode) errors.push("Expected mode " + spec.mode + ", got " + document.mode);
  } else {
    if (!Array.isArray(document.results)) return { errors: ["Missing results array"], findings };
    rows = document.results.filter(row => !row.exhibit || row.exhibit === exhibit);
    for (const mode of spec.modes) if (rows.filter(row => row.mode === mode).length !== 1) errors.push("Expected exactly one " + mode + " result for " + exhibit);
  }
  for (const row of rows) {
    if ((row.status || row.interactionAssertions) !== "PASS") errors.push("Mode " + row.mode + " did not pass");
    scanFindings(row, row.mode, findings);
  }
  // Root original-suite results are current; historicalServe is intentionally not scanned.
  if (document.originalSuite) scanFindings(document.originalSuite, "originalSuite", findings);
  return { errors, findings, originalStatuses: originalStatuses(document, rows, spec.originalSuite) };
}
function stopOwnedChild(child) {
  if (!child.pid) return;
  if (process.platform === "win32") {
    const killer = spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], { windowsHide: true, stdio: "ignore" });
    killer.on("error", () => child.kill());
    killer.on("close", code => { if (code !== 0) child.kill(); });
  } else {
    try { process.kill(-child.pid, "SIGKILL"); } catch { child.kill("SIGKILL"); }
  }
}
async function executeStep(step, output) {
  fs.mkdirSync(output, { recursive: true });
  const before = new Map(step.evidence.map(spec => [spec.file, stamp(path.join(ROOT, spec.file))]));
  const logPath = path.join(output, "checker.log"), log = fs.createWriteStream(logPath);
  const result = { id: step.id, command: [process.execPath, step.script, ...step.args], startedAt: new Date().toISOString(), log: relative(logPath), timeoutMs: step.timeoutMs, artifacts: [] };
  await new Promise(resolve => {
    const child = spawn(process.execPath, [path.join(ROOT, step.script), ...step.args], {
      cwd: ROOT, windowsHide: true, detached: process.platform !== "win32", stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, STARGATE_LOG_VISUALS: "0" }
    });
    const timer = setTimeout(() => { result.timedOut = true; stopOwnedChild(child); }, step.timeoutMs);
    child.stdout.on("data", data => log.write(data));
    child.stderr.on("data", data => log.write(data));
    child.on("error", error => { result.spawnError = { code: error.code, message: error.message }; });
    child.on("close", (code, signal) => { clearTimeout(timer); result.code = code; result.signal = signal; log.end(resolve); });
  });
  result.finishedAt = new Date().toISOString();
  for (const [index, spec] of step.evidence.entries()) {
    const source = path.join(ROOT, spec.file), current = stamp(source);
    const artifact = { ...spec, source: spec.file };
    try {
      if (!current || current === before.get(spec.file)) throw new Error("Missing or stale evidence; checker must rewrite this file during this execution");
      const bytes = fs.readFileSync(source);
      artifact.document = JSON.parse(bytes);
      const snapshot = path.join(output, index + "-" + path.basename(source));
      fs.writeFileSync(snapshot, bytes);
      artifact.snapshot = relative(snapshot);
      artifact.sha256 = crypto.createHash("sha256").update(bytes).digest("hex");
    } catch (error) { artifact.error = error.message; }
    result.artifacts.push(artifact);
  }
  return result;
}
function summarize(entry, executions, skippedSteps = []) {
  const errors = [], findings = [], originalEvidence = [];
  let environmentBlocked = false;
  for (const execution of executions) {
    if (execution.spawnError) { environmentBlocked = ["EACCES", "EPERM", "ENOENT"].includes(execution.spawnError.code); errors.push(execution.spawnError.message); }
    if (execution.timedOut) errors.push(execution.id + " timed out");
    if (execution.code !== 0) errors.push(execution.id + " exited " + execution.code);
    for (const artifact of execution.artifacts) {
      if (artifact.error) { errors.push(artifact.source + ": " + artifact.error); continue; }
      if (artifact.document && artifact.document.status === "ENVIRONMENT-BLOCKED") environmentBlocked = true;
      const assessment = assessEvidence(artifact.document, artifact, entry.exhibit);
      errors.push(...assessment.errors.map(error => artifact.source + ": " + error));
      findings.push(...assessment.findings.map(finding => ({ artifact: artifact.snapshot, ...finding })));
      originalEvidence.push(...(assessment.originalStatuses || []).map(status => ({ artifact: artifact.snapshot, ...status })));
    }
  }
  const preservationStatus = errors.length ? environmentBlocked ? "ENVIRONMENT-BLOCKED" : "FAIL" : "PASS";
  const functionalStatus = findings.some(finding => finding.kind === "functional") ? "FAIL" : "UNVERIFIED";
  const assertionFailure = findings.some(finding => finding.kind === "assertion");
  const originalSuiteStatus = originalEvidence.some(row => row.status === "FAIL") ? "FAIL"
    : entry.scope === "supplementary-only" || !originalEvidence.length || originalEvidence.some(row => row.status !== "PASS") ? "UNVERIFIED" : "PASS";
  const coverageStatus = skippedSteps.length ? "UNVERIFIED" : "PASS";
  const failed = functionalStatus === "FAIL" || assertionFailure || originalSuiteStatus === "FAIL" || preservationStatus === "FAIL";
  return { exhibit: entry.exhibit, qualification: entry.qualification, scope: entry.scope,
    status: failed ? "FAIL" : preservationStatus === "ENVIRONMENT-BLOCKED" ? "ENVIRONMENT-BLOCKED" : originalSuiteStatus !== "PASS" || coverageStatus !== "PASS" ? "UNVERIFIED" : preservationStatus,
    preservationStatus, originalSuiteStatus, coverageStatus, originalEvidence,
    functionalStatus, operatorStatus: "UNVERIFIED", acceptanceStatus: failed ? "FAIL" : "UNVERIFIED",
    errors, findings, skippedSteps, executions: executions.map(execution => ({ ...execution, artifacts: execution.artifacts.map(({ document, ...artifact }) => artifact) })) };
}
async function runQualifiedSuites(exhibits, options = {}) {
  // Cache is deliberately scoped to one sequential batch. Shared pilot checkers run once.
  const cache = new Map(), results = [];
  const runId = new Date().toISOString().replace(/[:.]/g, "-") + "-" + crypto.randomUUID();
  const output = path.join(ROOT, "test/qualified-suites", runId);
  fs.mkdirSync(output, { recursive: true });
  for (const exhibit of [...new Set(exhibits)]) {
    const entry = getSuite(exhibit);
    if (!entry || entry.qualification === "pending" && !options.includePending) {
      results.push({ exhibit, status: "UNVERIFIED", preservationStatus: "UNVERIFIED", originalSuiteStatus: "UNVERIFIED", functionalStatus: "UNVERIFIED", operatorStatus: "UNVERIFIED", acceptanceStatus: "UNVERIFIED",
        reason: entry ? "Qualification pending; use includePending to execute its existing checker explicitly" : "No registered comparison checker" });
      continue;
    }
    const executions = [], skippedSteps = [];
    for (const step of entry.steps) {
      if (step.qualification === "pending" && !options.includePending) { skippedSteps.push({ id: step.id, status: "UNVERIFIED", reason: "Ancillary checker qualification pending" }); continue; }
      const key = JSON.stringify([step.script, step.args]);
      if (!cache.has(key)) cache.set(key, await executeStep(step, path.join(output, step.id)));
      executions.push(cache.get(key));
    }
    results.push(summarize(entry, executions, skippedSteps));
  }
  const report = { scope: "Current-client suite preservation and bounded automated probes; full functional, visual, sound and operator acceptance remain separate", results, artifactDirectory: relative(output) };
  fs.writeFileSync(path.join(output, "report.json"), JSON.stringify(report, null, 2) + "\n");
  return report;
}
async function runQualifiedSuite(exhibit, options) { return (await runQualifiedSuites([exhibit], options)).results[0]; }
async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--list")) { console.log(JSON.stringify(registry, null, 2)); return; }
  const exhibits = [], options = { includePending: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--include-pending") options.includePending = true;
    else if (args[i] === "--all") exhibits.push(...registry.map(entry => entry.exhibit));
    else if (args[i] === "--exhibit" && args[i + 1]) exhibits.push(args[++i]);
    else throw new Error("Usage: run-qualified-suites.js --exhibit NAME [--include-pending] | --all | --list");
  }
  if (!exhibits.length) throw new Error("Select --exhibit NAME or --all explicitly");
  const report = await runQualifiedSuites(exhibits, options);
  console.log("QUALIFIED_SUITES_RESULT " + JSON.stringify(report));
  process.exitCode = report.results.some(result => result.status === "FAIL") ? 1 : report.results.some(result => result.status !== "PASS") ? 2 : 0;
}
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { runQualifiedSuites, runQualifiedSuite, assessEvidence, summarize, executeStep };
