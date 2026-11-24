"use strict";
// Preserve the development command and default port under the shared policy.
const { runCli } = require("../scripts/preview.js");
runCli(["--exhibit", "stargate_blueprint_alpha", "--port", process.env.PORT || "8088"]);
