"use strict";
const test = require("node:test"), assert = require("node:assert/strict");
const fs = require("node:fs"), path = require("node:path");
const { filesIn, compareRender } = require("./check-vite-built-preview");
test("built-render comparison preserves visible control structure and geometry", () => {
  const row = { width: 1920, height: 1080, title: "Fixture", buttons: 8, canvases: 2,
    preset: { text: "Preset", x: 100, y: 200, width: 80, height: 30 },
    stop: { text: "Stop", x: 300, y: 400, width: 80, height: 30 } };
  compareRender([row], [JSON.parse(JSON.stringify(row))]);
  const shifted = JSON.parse(JSON.stringify(row)); shifted.stop.x += 2;
  assert.throws(() => compareRender([row], [shifted]), /stop x preserved/);
  const missing = { ...row, buttons: 7 };
  assert.throws(() => compareRender([row], [missing]), /buttons/);
});
test("built-file collection rejects private development output", () => {
  fs.mkdirSync(path.resolve(__dirname, "../test"), { recursive: true });
  const root = fs.mkdtempSync(path.join(path.resolve(__dirname, "../test"), "built-assets-"));
  fs.writeFileSync(path.join(root, "index.html"), "<h1>Controlled build</h1>");
  fs.mkdirSync(path.join(root, "assets"));
  fs.writeFileSync(path.join(root, "assets/app.js"), "export const fixture = true;");
  assert.deepEqual(filesIn(root), ["assets/app.js", "index.html"]);
  fs.writeFileSync(path.join(root, "package.json"), "{}");
  assert.throws(() => filesIn(root), /Only public built assets/);
});

