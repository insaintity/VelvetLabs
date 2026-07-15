import { NextResponse } from "next/server";
import { readDatabase, updateSetup } from "@/lib/server/db";
import { getStorageConfig } from "@/lib/server/providers/storage";
import { requireSameOrigin } from "@/lib/server/security";
import { hasSecret, readSecret, saveSecret } from "@/lib/server/secrets";
import type { SetupRecord } from "@/lib/server/types";

function maskCredential(value?: string) {
  if (!value) return undefined;
  const prefix = value.startsWith("sk-") ? "sk-" : "";
  return `${prefix}••••${value.slice(-4)}`;
}

async function getSecretSummary(setup?: SetupRecord) {
  const [openai, elevenlabs, youtube, googleClientId, googleClientSecret, database, storage] = await Promise.all([
    readSecret("openai"),
    readSecret("elevenlabs"),
    hasSecret("youtubeRefreshToken"),
    hasSecret("googleClientId"),
    hasSecret("googleClientSecret"),
    hasSecret("databaseUrl"),
    getStorageConfig(setup)
  ]);

  return {
    secrets: {
      openai: Boolean(openai),
      elevenlabs: Boolean(elevenlabs),
      youtube,
      youtubeOAuth: googleClientId && googleClientSecret,
      database,
      storage: Boolean(storage)
    },
    secretHints: {
      openai: maskCredential(openai),
      elevenlabs: maskCredential(elevenlabs)
    }
  };
}

function publicSetup(setup: SetupRecord, connections: { database: boolean; storage: boolean }): SetupRecord {
  const worker = setup.worker;
  const storageValidated = worker?.status.state === "valid" && worker.status.message?.startsWith("Private bucket ");
  const databaseStatus = connections.database && !worker?.databaseStatus
    ? { state: "unchecked" as const, message: "Host-provided PostgreSQL detected. Save Setup to verify it." }
    : worker?.databaseStatus;
  const storageStatus = connections.storage && !storageValidated
    ? { state: "unchecked" as const, message: "Host-provided media storage detected. Save Setup to verify it." }
    : worker?.status ?? { state: "valid" as const, message: "Local storage is ready." };

  return {
    ...setup,
    worker: {
      storageEndpoint: worker?.storageEndpoint,
      storageRegion: worker?.storageRegion ?? "auto",
      storageForcePathStyle: worker?.storageForcePathStyle ?? false,
      storageBucket: worker?.storageBucket ?? "velvet-assets",
      status: storageStatus,
      databaseStatus
    }
  };
}

export async function GET() {
  const database = await readDatabase();
  const summary = await getSecretSummary(database.setup);
  return NextResponse.json({
    setup: publicSetup(database.setup, { database: summary.secrets.database, storage: summary.secrets.storage }),
    ...summary
  });
}

export async function POST(request: Request) {
  const blocked = requireSameOrigin(request);
  if (blocked) return blocked;

  const body = await request.json();

  await saveSecret("openai", body.openaiApiKey ?? "");
  await saveSecret("elevenlabs", body.elevenLabsApiKey ?? "");
  await saveSecret("googleClientId", body.googleClientId ?? "");
  await saveSecret("googleClientSecret", body.googleClientSecret ?? "");
  await saveSecret("databaseUrl", body.databaseUrl ?? "");
  await saveSecret("storageAccessKeyId", body.storageAccessKeyId ?? "");
  await saveSecret("storageSecretAccessKey", body.storageSecretAccessKey ?? "");
  const hasOpenAI = Boolean(body.openaiApiKey) || (await hasSecret("openai"));
  const hasElevenLabs = Boolean(body.elevenLabsApiKey) || (await hasSecret("elevenlabs"));
  const hasDatabase = Boolean(body.databaseUrl) || (await hasSecret("databaseUrl"));
  const workerSetup: NonNullable<SetupRecord["worker"]> = {
    storageEndpoint: body.storageEndpoint || undefined,
    storageRegion: body.storageRegion || "auto",
    storageForcePathStyle: Boolean(body.storageForcePathStyle),
    storageBucket: body.storageBucket || "velvet-assets",
    status: { state: "unchecked" }
  };
  const hasStorage = Boolean(await getStorageConfig({ worker: workerSetup }));

  const setup = await updateSetup({
    openai: {
      planningModel: body.planningModel || "gpt-4.1",
      imageModel: body.imageModel || "gpt-image-1",
      status: { state: hasOpenAI ? "unchecked" : "missing", message: hasOpenAI ? "Saved, not checked yet." : "Missing API key." }
    },
    elevenlabs: {
      musicModel: body.musicModel || "eleven-music",
      outputFormat: body.outputFormat || "mp3_44100_128",
      status: { state: hasElevenLabs ? "unchecked" : "missing", message: hasElevenLabs ? "Saved, not checked yet." : "Missing API key." }
    },
    worker: {
      ...workerSetup,
      status: { state: hasStorage ? "unchecked" : "valid", message: hasStorage ? "Private media storage saved, not checked yet." : "Local storage is ready." },
      databaseStatus: {
        state: hasDatabase ? "unchecked" : "missing",
        message: hasDatabase ? "Database URL saved encrypted, not checked yet." : "Optional database URL not set."
      }
    },
    budget: {
      maxTracksPerRun: Number(body.maxTracksPerRun) || 10,
      maxRenderAttemptsPerProject: Number(body.maxRenderAttemptsPerProject) || 5
    },
    pricing: {
      openaiInputPerMillionTokens: Number(body.openaiInputPerMillionTokens) || undefined,
      openaiOutputPerMillionTokens: Number(body.openaiOutputPerMillionTokens) || undefined,
      elevenLabsPerMinute: Number(body.elevenLabsPerMinute) || undefined,
      ffmpegPerRenderMinute: Number(body.ffmpegPerRenderMinute) || undefined,
      youtubeUploadPerVideo: Number(body.youtubeUploadPerVideo) || undefined
    }
  });

  return NextResponse.json({ setup, ...(await getSecretSummary(setup)) });
}
