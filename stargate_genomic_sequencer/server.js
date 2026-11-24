"use strict";
const { runCli } = require("../scripts/preview.js");
runCli(["--exhibit", "stargate_genomic_sequencer", "--port", process.env.PORT || "8085"]);
