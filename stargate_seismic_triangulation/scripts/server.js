"use strict";
// Compatibility launcher; serving and security are maintained centrally.
const { runCli } = require("../../scripts/preview.js");
runCli(["--exhibit", "stargate_seismic_triangulation", "--port", process.env.PORT || "8090"]);
