"use strict";
const { createPreviewServer, selectExhibit, runCli } = require("../scripts/preview.js");
const PORT = Number(process.env.PORT ?? "8088");
function startServer(port = PORT) {
  return createPreviewServer(selectExhibit("stargate_nouveau_nimbus")).listen(port);
}
if (require.main === module) runCli(["--exhibit", "stargate_nouveau_nimbus", "--port", String(PORT)]);
module.exports = { startServer };
