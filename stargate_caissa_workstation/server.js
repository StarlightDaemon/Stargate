"use strict";
const { runCli } = require("../scripts/preview.js");
runCli(["--exhibit", "stargate_caissa_workstation", "--port", process.env.PORT || "8085"]);
