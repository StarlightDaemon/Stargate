"use strict";
const { createPreviewServer, selectExhibit, runCli } = require("../scripts/preview.js");
const PORT = Number(process.env.PORT ?? "8797");
function startServer(port = PORT) {
  return createPreviewServer(selectExhibit("stargate_dark_gothic_fable")).listen(port);
}
if (require.main === module) runCli(["--exhibit", "stargate_dark_gothic_fable", "--port", String(PORT)]);
module.exports = { startServer, PORT };
