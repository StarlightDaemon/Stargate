"use strict";
// Shared secure preview; preserve existing npm start/dev commands and port.
const { runCli } = require("../scripts/preview.js");
runCli(["--exhibit", "stargate_bibliographic_depository", "--port", process.env.PORT || "5173"]);
