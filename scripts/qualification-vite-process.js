"use strict";
const assert = require("node:assert/strict"), fs = require("node:fs"), path = require("node:path");
const { fork, spawn } = require("node:child_process");
const ROOT = path.resolve(__dirname, "..");
async function bounded(promise, milliseconds, label) {
  let timer;
  try { return await Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(label + " exceeded " + milliseconds + "ms")), milliseconds); })]); }
  finally { clearTimeout(timer); }
}
async function killOwned(child, exit) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  assert.ok(Number.isInteger(child.pid) && child.pid > 0, "Only the owned child PID can be terminated");
  if (process.platform === "win32") {
    try { await bounded(new Promise((resolve, reject) => {
      const kill = spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], { windowsHide: true, stdio: "ignore" });
      kill.once("error", reject); kill.once("close", code => code === 0 ? resolve() : reject(new Error("Owned tree termination failed: " + code)));
    }), 5000, "Owned Vite tree termination"); }
    catch (error) {
      // Restricted Windows hosts can refuse taskkill. The existing owned process
      // handle still permits a bounded stop; never escalate or target another PID.
      child.kill("SIGKILL");
      await bounded(exit, 5000, "Owned Vite fallback process exit");
      return { treeTermination: "UNVERIFIED", detail: error.message };
    }
  } else {
    try { process.kill(-child.pid, "SIGKILL"); } catch (error) { if (error.code !== "ESRCH") throw error; }
  }
  await bounded(exit, 5000, "Owned Vite process exit");
}
async function startOwnedVite(target, packageFile, folder, phase = () => {}, bounds = {}) {
  fs.mkdirSync(folder, { recursive: true });
  const logFile = path.join(folder, "vite-listener.log"); fs.writeFileSync(logFile, "");
  const child = fork(path.join(__dirname, "qualification-vite-child.cjs"),
    [path.join(ROOT, target.name), packageFile, path.join(folder, "vite-cache")],
    { cwd: ROOT, execArgv: [], detached: process.platform !== "win32", windowsHide: true, stdio: ["ignore", "pipe", "pipe", "ipc"] });
  for (const [stream, output] of [[child.stdout, process.stdout], [child.stderr, process.stderr]]) stream.on("data", data => {
    fs.appendFileSync(logFile, data); output.write(data);
  });
  let readyResolve, readyReject, closedResolve, closedReject;
  const ready = new Promise((resolve, reject) => { readyResolve = resolve; readyReject = reject; });
  const closed = new Promise((resolve, reject) => { closedResolve = resolve; closedReject = reject; });
  // An early error can precede close(); attach a handler without changing its result.
  closed.catch(() => {});
  const exit = new Promise(resolve => child.once("close", (code, signal) => {
    resolve({ code, signal }); readyReject(new Error("Owned Vite exited before ready: " + code));
    if (code !== 0) closedReject(new Error("Owned Vite exited unexpectedly: " + code + "/" + signal));
  }));
  child.once("error", error => { readyReject(error); closedReject(error); });
  child.on("message", message => {
    if (message.type === "ready") readyResolve(message.url);
    else if (message.type === "closed") closedResolve();
    else if (message.type === "error") { const error = new Error(message.message); readyReject(error); closedReject(error); }
    else if (message.type === "phase") phase(message.phase, message.status);
  });
  let closePromise;
  try {
    phase("owned-vite-startup", "START");
    const url = await bounded(ready, bounds.startup ?? 15000, "Owned Vite startup");
    phase("owned-vite-startup", "PASS");
    return { url, pid: child.pid, close() {
      if (!closePromise) closePromise = (async () => {
        phase("owned-vite-cleanup", "START");
        try {
          if (!child.connected) throw new Error("Owned Vite IPC disconnected before cleanup");
          child.send({ type: "close" });
          await bounded(closed, bounds.close ?? 10000, "Vite close API");
          const ended = await bounded(exit, 3000, "Owned Vite graceful exit");
          assert.equal(ended.code, 0, "Owned Vite closes successfully");
          phase("owned-vite-cleanup", "PASS");
        } catch (error) {
          phase("owned-vite-cleanup", "FAIL", error.message);
          const termination = await killOwned(child, exit);
          if (termination) phase("owned-vite-forced-termination", "FAIL", termination);
          throw error;
        }
      })();
      return closePromise;
    } };
  } catch (error) {
    phase("owned-vite-startup", "FAIL", error.message);
    if (child.pid) await killOwned(child, exit);
    throw error;
  }
}
module.exports = { startOwnedVite, bounded };

