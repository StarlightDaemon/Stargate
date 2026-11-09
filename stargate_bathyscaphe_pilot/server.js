"use strict";
// Compatibility launcher; serving and security are maintained centrally.
const { runCli } = require("../scripts/preview.js");
runCli(["--exhibit", "stargate_bathyscaphe_pilot", "--port", process.env.PORT || "3000"]);
