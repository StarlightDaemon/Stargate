"use strict";
const { runCli } = require("../scripts/preview.js");
runCli(["--exhibit", "stargate_sigint_cryptanalysis", "--port", process.env.PORT || "8420"]);
