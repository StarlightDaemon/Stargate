"use strict";
// Qualification-owned Vite process. No server policy/optimizer options are disabled.
const assert = require("node:assert/strict"), path = require("node:path"), { pathToFileURL } = require("node:url");
const ROOT = path.resolve(__dirname, "..");
const [root, packageFile, cacheDir] = process.argv.slice(2);
const within = (base, file) => { const rel = path.relative(base, file); return rel !== "" && rel !== ".." && !rel.startsWith(".." + path.sep) && !path.isAbsolute(rel); };
assert.equal(path.dirname(root), ROOT);
assert.ok(path.basename(root).startsWith("stargate_"));
assert.ok(within(ROOT, packageFile) && within(path.join(ROOT, "test"), cacheDir));
let instance, closing = false;
const send = value => { if (process.connected) process.send(value); };
async function close() {
  if (closing) return; closing = true;
  send({ type: "phase", phase: "vite-close", status: "START" });
  instance?.httpServer?.closeAllConnections?.();
  await instance?.close();
  // Like the native Vite CLI, exit this owned process after its close API finishes.
  if (process.connected) process.send({ type: "closed" }, () => process.exit(0));
  else process.exit(0);
}
process.on("message", message => { if (message?.type === "close") close().catch(fail); });
process.on("disconnect", () => {
  // A vanished owner must not leave an optimizer process behind indefinitely.
  setTimeout(() => process.exit(1), 1000);
  close().catch(fail);
});
function fail(error) {
  console.error(error.stack || error);
  if (process.connected) process.send({ type: "error", message: error.message }, () => process.exit(1));
  else process.exit(1);
}
(async () => {
  send({ type: "phase", phase: "vite-create", status: "START" });
  const vite = await import(pathToFileURL(path.join(path.dirname(packageFile), "dist/node/index.js")).href);
  instance = await vite.createServer({ root, configFile: false, cacheDir,
    server: { host: "127.0.0.1", port: 0, strictPort: true, open: false }, logLevel: "error" });
  send({ type: "phase", phase: "vite-listen", status: "START" });
  await instance.listen();
  assert.equal(instance.httpServer.address().address, "127.0.0.1");
  send({ type: "ready", url: "http://127.0.0.1:" + instance.httpServer.address().port });
})().catch(fail);

