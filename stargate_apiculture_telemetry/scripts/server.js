"use strict";
// Compatibility launcher; serving and security are maintained centrally.
const { runCli } = require("../../scripts/preview.js");
runCli(["--exhibit", "stargate_apiculture_telemetry", "--port", process.env.PORT || "8080"]);
