"use strict";
const assert = require("node:assert/strict");
const http = require("node:http");
function request(url, pathname, method = "GET") {
  const target = new URL(url);
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: target.hostname, port: target.port, path: pathname, method }, res => {
      const chunks = [];
      res.on("data", c => chunks.push(c));
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
    });
    req.setTimeout(5000, () => req.destroy(new Error("HTTP timeout")));
    req.on("error", reject); req.end();
  });
}
async function click(page, selector) {
  const element = await page.waitForSelector(selector, { visible: true });
  await element.scrollIntoView();
  const box = await element.boundingBox();
  assert.ok(box, selector);
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  assert.ok(await page.evaluate((s, x, y) => {
    const control = document.querySelector(s), hit = document.elementFromPoint(x, y);
    return hit === control || control.contains(hit);
  }, selector, x, y), "Control hit test: " + selector);
  await page.mouse.click(x, y);
}
module.exports = { request, click };
