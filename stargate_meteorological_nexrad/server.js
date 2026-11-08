"use strict";
const { runCli } = require("../scripts/preview.js");
runCli(["--exhibit", "stargate_meteorological_nexrad", "--port", process.env.PORT || "8086"]);
