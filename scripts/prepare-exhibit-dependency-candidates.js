"use strict";
// Frozen baseline scope, not an inventory scan. Writes only ignored copied fixtures.
const assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path"), crypto = require("node:crypto");
const { spawnSync, execFileSync } = require("node:child_process");
const ROOT = path.resolve(__dirname, "..");
const BASELINE = { run: 42467009677, job: 128688734094, source: "Existing dependency baseline; Blueprint Alpha was separately audited" };
const TARGETS = ["stargate_aetheric_telegraph","stargate_apiculture_telemetry","stargate_atompunk_fable","stargate_bathyscaphe_pilot","stargate_bathyscaphe_pilot_fable","stargate_blueprint_alpha","stargate_blueprint_drafting","stargate_caissa_workstation","stargate_canopy_commons","stargate_cathedral_oculus","stargate_futurist_dynamism","stargate_konstrukt_transit","stargate_nouveau_nimbus","stargate_ukiyo_waystation","stargate_cyberpunk_fable","stargate_cyberpunk_gemini","stargate_dark_gothic_fable","stargate_dark_matter_array","stargate_darkpool_router","stargate_erebus_signal","stargate_fulldome_planetarium","stargate_lumina_grove","stargate_mastering_suite","stargate_municipal_registry","stargate_orthographic_cad","stargate_radio_interferometry","stargate_seismic_triangulation","stargate_seti_deepscope","stargate_seti_freeform","stargate_sigint_cryptanalysis","stargate_solarpunk_conservatory","stargate_steampunk_fable","stargate_synchrotron_collider","stargate_ukiyo_waystation_fable","stargate_windtunnel_aerodynamics"];
const SHARED = ["puppeteer", "puppeteer-core", "pngjs"], SECTIONS = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"];
const ADVISORIES = {
  vite: { floor: "6.4.4", url: "https://github.com/advisories/GHSA-587h-7wmj-h5pm" },
  "source-map-js": { floor: "1.2.2", url: "https://github.com/advisories/GHSA-68fv-2mgg-jv7q" },
  "follow-redirects": { floor: "1.16.2", url: "https://github.com/advisories/GHSA-mrwp-f3q8-3g9p" },
  qs: { floor: "6.16.1", url: "https://github.com/advisories/GHSA-6pq8-jhm2-2vcw" }
};
const hash = file => fs.existsSync(file) ? crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex") : null;
const metadata = folder => Object.fromEntries(["package.json", "package-lock.json", "npm-shrinkwrap.json"].map(file => [file, hash(path.join(folder, file))]));
function parse(args) {
  const options = { names: [], generate: false, install: false, emit: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--exhibit" && args[i + 1]) options.names.push(args[++i]);
    else if (args[i] === "--generate-lock") options.generate = true;
    else if (args[i] === "--install") options.generate = options.install = true;
    else if (args[i] === "--emit") options.emit = true;
    else throw new Error("Usage: prepare-exhibit-dependency-candidates.js [--exhibit EXACT_NAME] [--generate-lock | --install] [--emit]");
  }
  if (!options.names.length) options.names = [...TARGETS];
  assert.equal(new Set(options.names).size, options.names.length, "No duplicate targets");
  assert.ok(options.names.every(name => TARGETS.includes(name)), "Only exact frozen active targets are permitted; flagship excluded");
  assert.ok(!options.emit || options.install, "File emission requires clean install, full audit and native resolution proof");
  return options;
}
function planManifest(name, source) {
  assert.ok(TARGETS.includes(name));
  const candidate = structuredClone(source), changes = [], refresh = [];
  for (const section of SECTIONS) if (candidate[section]) {
    for (const dependency of SHARED) if (Object.hasOwn(candidate[section], dependency)) {
      changes.push({ action: "centralize", dependency, section, previous: candidate[section][dependency], replacement: "repository root development dependency" });
      delete candidate[section][dependency];
    }
    if (Object.hasOwn(candidate[section], "vite")) {
      assert.match(candidate[section].vite, /^\^6\./, "Review non-Vite-6 migrations separately");
      changes.push({ action: "raise-floor", dependency: "vite", section, previous: candidate[section].vite, next: "^6.4.4", advisory: ADVISORIES.vite });
      candidate[section].vite = "^6.4.4"; refresh.push("source-map-js");
    }
    if (Object.hasOwn(candidate[section], "http-server")) {
      changes.push({ action: "retain", dependency: "http-server", section, range: candidate[section]["http-server"], reason: "Preserve existing package command until serving migration qualifies" });
      refresh.push("follow-redirects", "qs");
    }
  }
  if (name === "stargate_apiculture_telemetry") {
    for (const section of SECTIONS) if (candidate[section]?.express) {
      changes.push({ action: "remove-unused", dependency: "express", section, previous: candidate[section].express,
        provenance: "Native Node/shared handler has no Express import; https://github.com/StarlightDaemon/Stargate/pull/6 is superseded for this dependency path only when removal is adopted and qualification passes" });
      delete candidate[section].express;
    }
    if (candidate.overrides) {
      assert.deepEqual(candidate.overrides, { qs: "6.16.0" }, "Review any new override separately");
      changes.push({ action: "remove-unused-override", dependency: "qs", previous: "6.16.0", reason: "Only Express introduced this override path; no replacement override" });
      delete candidate.overrides;
    }
  }
  for (const section of SECTIONS) if (candidate[section] && !Object.keys(candidate[section]).length) delete candidate[section];
  assert.deepEqual(candidate.scripts, source.scripts, "All original package commands are preserved");
  return { candidate, changes, refresh: [...new Set(refresh)], commands: source.scripts || {}, acceptance: "UNVERIFIED: adoption requires original suite, original command, visual and functional qualification; install/audit alone is insufficient" };
}
function npmCommand() {
  if (process.platform !== "win32") return { command: "npm", prefix: [] };
  const cli = [process.env.npm_execpath, path.join(path.dirname(process.execPath), "node_modules/npm/bin/npm-cli.js")].find(file => file && fs.existsSync(file));
  assert.ok(cli, "npm CLI must already be available"); return { command: process.execPath, prefix: [cli] };
}
function atLeast(value, floor) {
  assert.match(value, /^\d+\.\d+\.\d+$/, "Only stable package versions qualify");
  const actual = value.split(".").map(Number), minimum = floor.split(".").map(Number);
  return actual[0] > minimum[0] || actual[0] === minimum[0] && (actual[1] > minimum[1] || actual[1] === minimum[1] && actual[2] >= minimum[2]);
}
function verifyLock(folder, plan) {
  const lock = JSON.parse(fs.readFileSync(path.join(folder, "package-lock.json"), "utf8"));
  assert.ok(lock.packages && lock.packages[""], "Modern npm lock with root entry required");
  for (const section of SECTIONS) for (const name of SHARED) assert.ok(!lock.packages[""][section]?.[name], "No duplicate browser declaration remains");
  for (const [location, pkg] of Object.entries(lock.packages)) {
    for (const name of SHARED) assert.ok(!location.endsWith("node_modules/" + name), "No redundant browser/image package in exhibit lock");
    if (plan.changes.some(change => change.dependency === "express" && change.action === "remove-unused")) assert.ok(!location.endsWith("node_modules/express"), "Unused Express removed from lock");
    for (const name of [...plan.refresh, ...(plan.refresh.includes("source-map-js") ? ["vite"] : [])]) if (location.endsWith("node_modules/" + name)) assert.ok(atLeast(pkg.version, ADVISORIES[name].floor), name + " is below its verified patch floor");
  }
}
function nativeProbes(folder, fixtureRoot, run) {
  const common = "const expected=fs.realpathSync(process.argv[2]);const names=JSON.parse(process.argv[3]);const rows=[];";
  const cjs = "const fs=require('node:fs'),path=require('node:path');" + common + "for(const name of names){const resolved=fs.realpathSync(require.resolve(name));const rel=path.relative(expected,resolved);if(!rel||rel==='..'||rel.startsWith('..'+path.sep)||path.isAbsolute(rel))throw Error('Dependency resolved outside copied root: '+name);require(name);rows.push({name,resolved})}console.log(JSON.stringify(rows));";
  const esm = "import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';" + common + "for(const name of names){const resolved=fs.realpathSync(fileURLToPath(import.meta.resolve(name)));const rel=path.relative(expected,resolved);if(!rel||rel==='..'||rel.startsWith('..'+path.sep)||path.isAbsolute(rel))throw Error('Dependency resolved outside copied root: '+name);await import(name);rows.push({name,resolved})}console.log(JSON.stringify(rows));";
  const results = {};
  for (const [kind, code] of [["cjs", cjs], ["mjs", esm]]) {
    const file = path.join(folder, "__candidate_resolution." + kind); fs.writeFileSync(file, code);
    results[kind] = JSON.parse(run("native-" + kind, folder, process.execPath, [file, path.join(fixtureRoot, "node_modules"), JSON.stringify(SHARED)]).stdout);
  }
  return results;
}
function emit(name, folder) {
  for (const file of ["package.json", "package-lock.json"]) {
    const bytes = fs.readFileSync(path.join(folder, file)), base64 = bytes.toString("base64");
    console.log("DEPENDENCY_CANDIDATE_FILE " + JSON.stringify({ exhibit: name, file, sha256: hash(path.join(folder, file)), bytes: bytes.length }));
    for (let offset = 0; offset < base64.length; offset += 12000) console.log("DEPENDENCY_CANDIDATE_CHUNK " + name + " " + file + " " + offset + " " + base64.slice(offset, offset + 12000));
  }
}
function main(args = process.argv.slice(2)) {
  const options = parse(args);
  if (options.generate) assert.equal(process.env.GITHUB_ACTIONS, "true", "Registry operations belong to hosted qualification; preparation alone is offline");
  const before = Object.fromEntries([".", "Stargate_OG", ...options.names].map(name => [name, metadata(path.join(ROOT, name))]));
  const base = path.join(ROOT, "test/exhibit-dependency-candidates"); fs.mkdirSync(base, { recursive: true });
  assert.ok(fs.realpathSync(base).startsWith(fs.realpathSync(ROOT) + path.sep), "Candidate fixture must remain inside checkout");
  const output = path.join(base, crypto.randomUUID()), tree = path.join(output, "repo"); fs.mkdirSync(tree, { recursive: true });
  for (const file of ["package.json", "package-lock.json"]) { assert.ok(before["."][file], "Accepted root metadata required"); fs.copyFileSync(path.join(ROOT, file), path.join(tree, file)); }
  const rootPackage = JSON.parse(fs.readFileSync(path.join(tree, "package.json"), "utf8"));
  assert.ok(!rootPackage.workspaces, "Candidate layout assumes independent manifests");
  for (const name of SHARED) assert.ok(rootPackage.devDependencies?.[name], "Shared root development dependency required: " + name);
  const report = { baseline: BASELINE, sourceCommit: execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim(), options, output: path.relative(ROOT, output).split(path.sep).join("/"), status: "PREPARED", rootChecks: [], candidates: [], before };
  const npm = npmCommand(), common = ["--ignore-scripts", "--include=dev", "--include=optional", "--include=peer", "--fetch-retries=0", "--fetch-timeout=20000"];
  const env = { ...process.env, NODE_PATH: "", PUPPETEER_SKIP_DOWNLOAD: "true", npm_config_cache: path.join(output, "npm-cache"), npm_config_update_notifier: "false", NO_COLOR: "1" };
  let checks = report.rootChecks;
  const run = (label, cwd, command, commandArgs) => {
    const result = spawnSync(command, commandArgs, { cwd, env, encoding: "utf8", windowsHide: true, timeout: 180000, maxBuffer: 16 * 1024 * 1024 });
    fs.writeFileSync(path.join(cwd, label + ".stdout.log"), result.stdout || ""); fs.writeFileSync(path.join(cwd, label + ".stderr.log"), (result.stderr || "") + (result.error ? "\n" + result.error.message : ""));
    checks.push({ label, exitCode: result.status, cwd: path.relative(output, cwd).split(path.sep).join("/"), command: [command === process.execPath ? "node" : command, ...commandArgs.map(arg => arg === npm.prefix[0] ? "npm-cli.js" : arg)] });
    assert.ok(!result.error && result.status === 0, label + " failed; see copied fixture logs"); return result;
  };
  const audit = cwd => { const result = JSON.parse(run("audit", cwd, npm.command, [...npm.prefix, "audit", "--json", ...common]).stdout); assert.equal(result.metadata?.vulnerabilities?.total, 0, "Full dependency tree must have zero findings"); return result.metadata.vulnerabilities; };
  try {
    if (options.generate) {
      // Exact accepted root lock is installed without mutation, not regenerated.
      run("root-install", tree, npm.command, [...npm.prefix, "ci", "--no-audit", ...common]);
      assert.equal(hash(path.join(tree, "package-lock.json")), before["."]["package-lock.json"], "Root fixture lock unchanged");
      report.rootAudit = audit(tree);
    }
    for (const name of options.names) {
      const source = path.join(ROOT, name), folder = path.join(tree, name); fs.mkdirSync(folder);
      assert.ok(!before[name]["npm-shrinkwrap.json"], "Review shrinkwrap separately");
      const plan = planManifest(name, JSON.parse(fs.readFileSync(path.join(source, "package.json"), "utf8")));
      const item = { exhibit: name, status: "PREPARED", changes: plan.changes, refresh: plan.refresh.map(dependency => ({ dependency, advisory: ADVISORIES[dependency], strategy: "npm update within existing dependency ranges; no override" })), commandsPreserved: plan.commands, originalLockMissing: !before[name]["package-lock.json"], acceptance: plan.acceptance, checks: [] };
      report.candidates.push(item); checks = item.checks;
      fs.writeFileSync(path.join(folder, "package.json"), JSON.stringify(plan.candidate, null, 2) + "\n");
      if (before[name]["package-lock.json"]) fs.copyFileSync(path.join(source, "package-lock.json"), path.join(folder, "package-lock.json"));
      if (options.generate) {
        try {
          run("lock", folder, npm.command, [...npm.prefix, "install", "--package-lock-only", "--no-audit", ...common]);
          if (plan.refresh.length) run("refresh-patched-transitives", folder, npm.command, [...npm.prefix, "update", ...plan.refresh, "--save=false", "--package-lock-only", "--no-audit", ...common]);
          assert.deepEqual(JSON.parse(fs.readFileSync(path.join(folder, "package.json"), "utf8")), plan.candidate, "npm must not alter candidate commands or declaration plan");
          verifyLock(folder, plan);
          const lockHash = hash(path.join(folder, "package-lock.json"));
          if (options.install) {
            run("install", folder, npm.command, [...npm.prefix, "ci", "--no-audit", ...common]);
            assert.equal(hash(path.join(folder, "package-lock.json")), lockHash, "Clean install preserves candidate lock");
            run("tree", folder, npm.command, [...npm.prefix, "ls", "--all", "--json"]);
            item.nativeResolution = nativeProbes(folder, tree, run);
          }
          item.audit = audit(folder); item.status = options.install ? "CANDIDATE_INSTALL_PASS" : "CANDIDATE_LOCK_PASS";
          if (options.emit) emit(name, folder);
        } catch (error) { item.status = "FAIL"; item.error = error.message; }
      }
      item.files = Object.fromEntries(["package.json", "package-lock.json"].map(file => [file, { sha256: hash(path.join(folder, file)), bytes: fs.existsSync(path.join(folder, file)) ? fs.statSync(path.join(folder, file)).size : null }]));
      console.log("EXHIBIT_DEPENDENCY_CANDIDATE_RESULT " + JSON.stringify(item));
    }
    report.status = report.candidates.some(item => item.status === "FAIL") ? "FAIL" : options.install ? "CANDIDATE_INSTALL_PASS" : options.generate ? "CANDIDATE_LOCK_PASS" : "PREPARED";
    assert.notEqual(report.status, "FAIL", "One or more candidate trees failed; no adoption authorized");
    return report;
  } catch (error) { report.status = "FAIL"; report.error = error.message; throw error; }
  finally {
    report.after = Object.fromEntries(Object.keys(before).map(name => [name, metadata(path.join(ROOT, name))]));
    report.sourceUnchanged = JSON.stringify(before) === JSON.stringify(report.after);
    fs.writeFileSync(path.join(output, "report.json"), JSON.stringify(report, null, 2));
    console.log("EXHIBIT_DEPENDENCY_CANDIDATES_SUMMARY " + JSON.stringify({ status: report.status, sourceUnchanged: report.sourceUnchanged, output: report.output, targets: report.candidates.map(item => ({ exhibit: item.exhibit, status: item.status })), error: report.error }));
    assert.ok(report.sourceUnchanged, "Source metadata including flagship must remain unchanged");
  }
}
if (require.main === module) { try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; } }
module.exports = { main, parse, planManifest, verifyLock, nativeProbes, TARGETS, ADVISORIES };
