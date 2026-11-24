"use strict";
const { runCli } = require("../scripts/preview.js");
runCli(["--exhibit", "stargate_windtunnel_aerodynamics", "--port", process.env.PORT || "8094"]);
