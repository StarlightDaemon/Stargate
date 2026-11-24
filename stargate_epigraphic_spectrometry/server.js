"use strict";
const { runCli } = require("../scripts/preview.js");
runCli(["--exhibit", "stargate_epigraphic_spectrometry", "--port", process.env.PORT || "8082"]);
