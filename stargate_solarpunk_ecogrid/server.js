"use strict";
const { runCli } = require("../scripts/preview.js");
runCli(["--exhibit", "stargate_solarpunk_ecogrid", "--port", process.env.PORT || "8083"]);
