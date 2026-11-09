"use strict";
// Run the existing builder suites without replacing or weakening their assertions.
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { startPreview, selectExhibit } = require("./preview.js");
const { legacy } = require("./check-pilot-browsers.js");
const ROOT = path.resolve(__dirname, "..");
const suites = [
  { name: "stargate_aetheric_telegraph", server: "server.js", script: "run_tests.js" },
  { name: "stargate_bathyscaphe_pilot", server: "server.js", script: "test/verify.js" },
];
async function runSuite(pilot, mode, output) {
  fs.mkdirSync(output, { recursive: true });
  try { require.resolve("puppeteer", { paths: [path.join(ROOT, pilot.name)] }); }
  catch { return { exhibit: pilot.name, mode, status: "ENVIRONMENT-BLOCKED", error: "Install this exhibit's locked Puppeteer dependency with npm ci before running its original suite." }; }
  const preview = mode === "command" ? null : mode === "legacy" ? await legacy(pilot) : await startPreview({ ...selectExhibit(pilot.name), port: 0 });
  try {
    return await new Promise(resolve => {
      const log = fs.createWriteStream(path.join(output, "suite.log"));
      const env = { ...process.env, STARGATE_TEST_OUTPUT: output };
      if (preview) env.STARGATE_TEST_URL = preview.url;
      else delete env.STARGATE_TEST_URL;
      const child = spawn(process.execPath, [path.join(ROOT, pilot.name, pilot.script)], {
        cwd: path.join(ROOT, pilot.name), windowsHide: true,
        env,
        stdio: ["ignore", "pipe", "pipe"],
      });
      let timedOut = false;
      const timeout = setTimeout(() => { timedOut = true; child.kill(); }, 180000);
      child.stdout.on("data", data => log.write(data));
      child.stderr.on("data", data => log.write(data));
      let error;
      child.on("error", e => { error = e.message; });
      child.on("close", (code, signal) => {
        clearTimeout(timeout);
        log.end(() => {
          const text = fs.readFileSync(path.join(output, "suite.log"), "utf8");
          const summary = text.match(/VERIFICATION SUMMARY:.*|ALL 9 VERIFICATION TEST PHASES.*/g) || [];
          resolve({ exhibit: pilot.name, mode, status: code === 0 && !timedOut ? "PASS" : "FAIL", code, signal, timedOut, error, summary, output: path.relative(ROOT, output) });
        });
      });
    });
  } finally { if (preview) await preview.close(); }
}
async function main() {
  const output = path.join(ROOT, "test", "pilot-suites");
  const results = [];
  for (const pilot of suites) for (const mode of ["legacy", "shared", "command"]) {
    const result = await runSuite(pilot, mode, path.join(output, `${pilot.name}-${mode}`));
    results.push(result); console.log(JSON.stringify(result));
  }
  fs.writeFileSync(path.join(output, "report.json"), JSON.stringify({ results,
    solarpunk: "No original tracked suite exists; scripts/check-pilot-browsers.js provides current interaction evidence." }, null, 2));
  process.exitCode = results.every(r => r.status === "PASS") ? 0 : 1;
}
if (require.main === module) main().catch(e => { console.error(e); process.exitCode = 1; });
module.exports = { runSuite, suites };
