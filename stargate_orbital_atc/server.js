"use strict";
const { runCli } = require("../scripts/preview.js");
runCli(["--exhibit", "stargate_orbital_atc", "--port", process.env.PORT || "8084"]);
