"use strict";

const assert = require("assert");
const path = require("path");
const { assertSafeOutputDir } = require("./build-pages-site.js");

const ROOT = path.resolve(__dirname, "..");

assert.doesNotThrow(() => assertSafeOutputDir(path.join(ROOT, "_site-security-test")));

for (const unsafePath of [
  ROOT,
  path.dirname(ROOT),
  path.parse(ROOT).root,
  path.join(ROOT, ".git", "generated-site"),
  path.join(ROOT, "hub"),
]) {
  assert.throws(
    () => assertSafeOutputDir(unsafePath),
    /Refusing to replace output directory|Refusing output directory/
  );
}

console.log("Pages output guard rejects repository, ancestor, Git, and tracked-source paths.");
