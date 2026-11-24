"use strict";
const { createPreviewServer, selectExhibit, runCli } = require("../scripts/preview.js");
const PORT = Number(process.env.PORT ?? "3000");
const server = createPreviewServer(selectExhibit("stargate_futurist_dynamism"));
if (require.main === module) runCli(["--exhibit", "stargate_futurist_dynamism", "--port", String(PORT)]);
module.exports = server;
