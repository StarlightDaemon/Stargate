"use strict";
// Compatibility launcher; serving and security are maintained centrally.
const { runCli } = require("../scripts/preview.js");
runCli(["--exhibit", "stargate_steampunk_fable", "--port", process.env.PORT || "8661"]);
