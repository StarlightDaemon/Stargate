"use strict";
// Observe actual requests after the load event instead of relying on a renderer
// networkIdle lifecycle event. Both stages share the original bounded deadline.
async function loadPage(page, url, timeout = 15000, now = Date.now) {
  const deadline = now() + timeout;
  const response = await page.goto(url, { waitUntil: "load", timeout });
  const remaining = deadline - now();
  if (remaining <= 0) throw new Error("Page loading exhausted its " + timeout + "ms deadline");
  await page.waitForNetworkIdle({ idleTime: 500, timeout: remaining });
  return response;
}
module.exports = { loadPage };
