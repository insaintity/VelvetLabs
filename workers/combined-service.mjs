import { spawn } from "node:child_process";

let stopping = false;
let worker;

const web = spawn(process.execPath, [".next/standalone/server.js"], { env: process.env, stdio: "inherit" });

function startWorker() {
  if (stopping) return;
  worker = spawn(process.execPath, ["node_modules/tsx/dist/cli.mjs", "workers/velvet-worker.ts"], { env: process.env, stdio: "inherit" });
  worker.on("exit", (code, signal) => {
    if (stopping) return;
    console.error(`Velvet worker exited (${signal || code || "unknown"}); restarting in 5 seconds.`);
    setTimeout(startWorker, 5000);
  });
}

function stop(signal) {
  if (stopping) return;
  stopping = true;
  worker?.kill(signal);
  web.kill(signal);
  setTimeout(() => process.exit(0), 5000).unref();
}

web.on("exit", (code, signal) => {
  if (!stopping) {
    stopping = true;
    worker?.kill("SIGTERM");
    process.exitCode = code || (signal ? 1 : 0);
  }
});

process.on("SIGTERM", () => stop("SIGTERM"));
process.on("SIGINT", () => stop("SIGINT"));
startWorker();
