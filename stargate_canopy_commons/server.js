"use strict";
const { createPreviewServer, selectExhibit, runCli } = require("../scripts/preview.js");
const PORT = Number(process.env.PORT ?? "8709");
function startServer(port = PORT) {
  return createPreviewServer(selectExhibit("stargate_canopy_commons")).listen(port);
}
if (require.main === module) runCli(["--exhibit", "stargate_canopy_commons", "--port", String(PORT)]);
module.exports = { startServer, PORT };
