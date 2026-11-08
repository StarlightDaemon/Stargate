"use strict";
// Preserve the command and default port under the shared secure preview policy.
const { runCli } = require("../scripts/preview.js");
runCli(["--exhibit", "stargate_synchrotron_collider", "--port", process.env.PORT || "3042"]);
