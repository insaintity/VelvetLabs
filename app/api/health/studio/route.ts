import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { listBackups } from "@/lib/server/backups";
import { readDatabase } from "@/lib/server/db";
import { workerHeartbeatPath } from "@/lib/server/paths";
import { hasSecret } from "@/lib/server/secrets";
import { validateSetupProviders } from "@/lib/server/setup-validation";
import type { ProviderStatus } from "@/lib/server/types";

const run = promisify(execFile);

export async function GET() {
  const providers = [
    ...(await hasSecret("openai") ? ["openai" as const] : []),
    ...(await hasSecret("elevenlabs") ? ["elevenlabs" as const] : []),
    ...(await hasSecret("databaseUrl") ? ["database" as const] : []),
    "storage" as const
  ];
  const validationResult = await validateSetupProviders(providers).catch(() => undefined);
  const validation: Partial<Record<"openai" | "elevenlabs" | "database" | "storage", ProviderStatus>> = validationResult?.validation ?? {};
  const [ffmpeg, worker, backups] = await Promise.all([checkFfmpeg(), checkWorker(), listBackups()]);
  const latestSetup = (await readDatabase()).setup;

  return NextResponse.json({
    checkedAt: new Date().toISOString(),
    checks: {
      openai: validation.openai ?? latestSetup.openai?.status ?? { state: "missing", message: "OpenAI is not connected." },
      elevenlabs: validation.elevenlabs ?? latestSetup.elevenlabs?.status ?? { state: "missing", message: "ElevenLabs is not connected." },
      youtube: latestSetup.youtube?.status ?? { state: "missing", message: "YouTube is not connected." },
      ffmpeg,
      worker,
      storage: validation.storage ?? latestSetup.worker?.status ?? { state: "valid", message: "Local storage is ready." },
      database: validation.database ?? latestSetup.worker?.databaseStatus ?? { state: "optional", message: "Local database is active." },
      backups: { state: backups.length ? "valid" : "unchecked", message: backups.length ? `${backups.length} encrypted rolling backups available.` : "The first encrypted backup will be created on the next save." }
    },
    backups: backups.slice(0, 5)
  });
}

async function checkFfmpeg() {
  try {
    const executable = process.env.FFMPEG_PATH || "ffmpeg";
    const { stdout } = await run(executable, ["-version"], { windowsHide: true, timeout: 5000 });
    return { state: "valid", message: stdout.split(/\r?\n/)[0] || "FFmpeg is ready." };
  } catch {
    return { state: "invalid", message: "FFmpeg could not be started." };
  }
}

async function checkWorker() {
  try {
    const heartbeat = JSON.parse(await readFile(workerHeartbeatPath, "utf8")) as { checkedAt?: string };
    const age = heartbeat.checkedAt ? Date.now() - Date.parse(heartbeat.checkedAt) : Number.POSITIVE_INFINITY;
    return age < 30_000
      ? { state: "valid", message: "Worker is online and watching the queue." }
      : { state: "invalid", message: "Worker heartbeat is stale." };
  } catch {
    return { state: "invalid", message: "Worker heartbeat is unavailable." };
  }
}
