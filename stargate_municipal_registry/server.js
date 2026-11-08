"use strict";
// Compatibility launcher; serving and security are maintained centrally.
const { runCli } = require("../scripts/preview.js");
runCli(["--exhibit", "stargate_municipal_registry", "--port", process.env.PORT || "8840"]);
