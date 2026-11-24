"use strict";
// Shared secure preview; preserve the existing command and default port.
const { runCli } = require("../../scripts/preview.js");
runCli(["--exhibit", "stargate_reactor_criticality", "--port", process.env.PORT || "8080"]);
