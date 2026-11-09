"use strict";
const { runCli } = require("../scripts/preview.js");
runCli(["--exhibit", "stargate_dark_matter_array", "--port", process.env.PORT || "8080"]);
