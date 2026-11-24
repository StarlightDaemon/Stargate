"use strict";
const { runCli } = require("../scripts/preview.js");
runCli(["--exhibit", "stargate_konstrukt_transit", "--port", process.env.PORT || "8088"]);
