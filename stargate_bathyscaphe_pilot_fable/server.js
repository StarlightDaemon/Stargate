"use strict";
// Preserve the existing positional-port command while centralizing serving.
const { runCli } = require("../scripts/preview.js");
runCli(["--exhibit", "stargate_bathyscaphe_pilot_fable", "--port", process.argv[2] || process.env.PORT || "8747"]);
