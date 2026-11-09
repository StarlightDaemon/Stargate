"use strict";
// Compatibility launcher; serving and security are maintained centrally.
const { runCli } = require("../scripts/preview.js");
runCli(["--exhibit", "stargate_aetheric_telegraph", "--port", process.env.PORT || "8420"]);
