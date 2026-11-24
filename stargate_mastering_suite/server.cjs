"use strict";
// Preserve this exhibit's command and port while sharing the source-serving policy.
const { runCli } = require("../scripts/preview.js");
const args = process.argv.slice(2).map(value => value === "-p" ? "--port" : value);
if (!args.includes("--port")) args.push("--port", process.env.PORT ?? "8080");
runCli(["--exhibit", "stargate_mastering_suite", ...args]);

