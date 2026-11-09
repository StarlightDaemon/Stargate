"use strict";
// Compatibility launcher; serving and security are maintained centrally.
const { runCli } = require("../scripts/preview.js");
runCli(["--exhibit", "stargate_solarpunk_astra", "--port", process.env.PORT || "4177"]);
