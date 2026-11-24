"use strict";
const { runCli } = require("../scripts/preview.js");
runCli(["--exhibit", "stargate_sonar_abyssal", "--port", process.env.PORT || "8081"]);
