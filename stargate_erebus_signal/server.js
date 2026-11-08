"use strict";
// Shared secure preview; retain the existing command and default port.
const { runCli } = require("../scripts/preview.js");
runCli(["--exhibit", "stargate_erebus_signal", "--port", process.env.PORT || "8000"]);
