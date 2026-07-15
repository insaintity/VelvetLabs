import { processNextQueuedJob } from "../lib/server/job-handlers";
import { writeFile } from "node:fs/promises";
import { ensureVelvetDir, workerHeartbeatPath } from "../lib/server/paths";

const once = process.argv.includes("--once");
const minimumIntervalMs = Number(process.env.VELVET_WORKER_INTERVAL_MS) || 1000;
const maximumIntervalMs = Number(process.env.VELVET_WORKER_MAX_INTERVAL_MS) || 10_000;

async function main() {
  console.log(`Velvet worker started${once ? " in one-shot mode" : ""}.`);
  let idleRuns = 0;

  while (true) {
    await ensureVelvetDir();
    await writeFile(workerHeartbeatPath, JSON.stringify({ checkedAt: new Date().toISOString(), pid: process.pid }));
    const job = await processNextQueuedJob();

    if (job) {
      idleRuns = 0;
      console.log(`Processed ${job.type} job ${job.id}.`);
    } else if (once) {
      console.log("No queued jobs.");
    } else {
      idleRuns += 1;
    }

    if (once) {
      break;
    }

    const delay = job ? 100 : Math.min(maximumIntervalMs, minimumIntervalMs * 2 ** Math.min(idleRuns - 1, 4));
    await sleep(delay);
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
