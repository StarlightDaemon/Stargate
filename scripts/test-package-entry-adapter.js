"use strict";
const test = require("node:test"), assert = require("node:assert/strict");
const { closeOwnedHttpServer } = require("./check-package-entry-security");
test("owned HTTP cleanup waits for underlying close and terminates keepalive connections", async () => {
  let callback, closedConnections = 0, settled = false;
  const pending = closeOwnedHttpServer({
    close(fn) { callback = fn; },
    closeAllConnections() { closedConnections++; }
  }).then(() => { settled = true; });
  assert.equal(typeof callback, "function");
  assert.equal(closedConnections, 1);
  await Promise.resolve(); assert.equal(settled, false);
  callback(); await pending; assert.equal(settled, true);
});
test("owned HTTP cleanup propagates close failure", async () => {
  await assert.rejects(closeOwnedHttpServer({
    close(fn) { queueMicrotask(() => fn(new Error("controlled close failure"))); }
  }), /controlled close failure/);
});

