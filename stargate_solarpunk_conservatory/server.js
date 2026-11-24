"use strict";
require("../scripts/preview.js").runCli([
  "--exhibit", "stargate_solarpunk_conservatory", "--port", process.env.PORT ?? "8685"
]);
