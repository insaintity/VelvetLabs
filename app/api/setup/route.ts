import { NextResponse } from "next/server";
import { readDatabase, updateSetup } from "@/lib/server/db";
import { getStorageConfig } from "@/lib/server/providers/storage";
import { requireSameOrigin } from "@/lib/server/security";
import { hasSecret, readSecret, saveSecret } from "@/lib/server/secrets";
import { validateSetupProviders, type SetupProvider } from "@/lib/server/setup-validation";
import type { SetupRecord } from "@/lib/server/types";

function maskCredential(value?: string) {
  if (!value) return undefined;
  const prefix = value.startsWith("sk-") ? "sk-" : "";
  return `${prefix}••••${value.slice(-4)}`;
}

async function getSecretSummary(setup?: SetupRecord) {
  const [openai, elevenlabs, youtube, googleClientId, database, storage] = await Promise.all([
    readSecret("openai"),
    readSecret("elevenlabs"),
    hasSecret("youtubeRefreshToken"),
    hasSecret("googleClientId"),
    hasSecret("databaseUrl"),
    getStorageConfig(setup)
  ]);

  return {
    secrets: {
      openai: Boolean(openai),
      elevenlabs: Boolean(elevenlabs),
      youtube,
      youtubeOAuth: googleClientId,
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
  const current = (await readDatabase()).setup;

  if (typeof body.openaiApiKey === "string" && body.openaiApiKey.trim()) await saveSecret("openai", body.openaiApiKey.trim());
  if (typeof body.elevenLabsApiKey === "string" && body.elevenLabsApiKey.trim()) await saveSecret("elevenlabs", body.elevenLabsApiKey.trim());
  if (typeof body.databaseUrl === "string" && body.databaseUrl.trim()) await saveSecret("databaseUrl", body.databaseUrl.trim());
  if (typeof body.storageAccessKeyId === "string" && body.storageAccessKeyId.trim()) await saveSecret("storageAccessKeyId", body.storageAccessKeyId.trim());
  if (typeof body.storageSecretAccessKey === "string" && body.storageSecretAccessKey.trim()) await saveSecret("storageSecretAccessKey", body.storageSecretAccessKey.trim());
  const hasOpenAI = Boolean(body.openaiApiKey) || (await hasSecret("openai"));
  const hasElevenLabs = Boolean(body.elevenLabsApiKey) || (await hasSecret("elevenlabs"));
  const hasDatabase = Boolean(body.databaseUrl) || (await hasSecret("databaseUrl"));
  const workerSetup: NonNullable<SetupRecord["worker"]> = {
    storageEndpoint: body.storageEndpoint || current.worker?.storageEndpoint,
    storageRegion: body.storageRegion || current.worker?.storageRegion || "auto",
    storageForcePathStyle: body.storageForcePathStyle === undefined ? current.worker?.storageForcePathStyle ?? false : Boolean(body.storageForcePathStyle),
    storageBucket: body.storageBucket || current.worker?.storageBucket || "velvet-assets",
    status: current.worker?.status ?? { state: "valid", message: "Local storage is ready." }
  };
  const hasStorage = Boolean(await getStorageConfig({ worker: workerSetup }));

  let setup = await updateSetup({
    openai: {
      planningModel: body.planningModel || current.openai?.planningModel || "gpt-4.1",
      imageModel: body.imageModel || current.openai?.imageModel || "gpt-image-1",
      status: body.openaiApiKey ? { state: "unchecked", message: "Saved, checking now." } : current.openai?.status ?? { state: hasOpenAI ? "unchecked" : "missing", message: hasOpenAI ? "Saved, not checked yet." : "Missing API key." }
    },
    elevenlabs: {
      musicModel: body.musicModel || current.elevenlabs?.musicModel || "eleven-music",
      outputFormat: body.outputFormat || current.elevenlabs?.outputFormat || "mp3_44100_128",
      status: body.elevenLabsApiKey ? { state: "unchecked", message: "Saved, checking now." } : current.elevenlabs?.status ?? { state: hasElevenLabs ? "unchecked" : "missing", message: hasElevenLabs ? "Saved, not checked yet." : "Missing API key." }
    },
    worker: {
      ...workerSetup,
      status: body.storageEndpoint || body.storageAccessKeyId || body.storageSecretAccessKey ? { state: hasStorage ? "unchecked" : "valid", message: hasStorage ? "Private media storage saved, not checked yet." : "Local storage is ready." } : current.worker?.status ?? { state: "valid", message: "Local storage is ready." },
      databaseStatus: body.databaseUrl ? {
        state: hasDatabase ? "unchecked" : "missing",
        message: hasDatabase ? "Database URL saved encrypted, not checked yet." : "Optional database URL not set."
      } : current.worker?.databaseStatus ?? { state: hasDatabase ? "unchecked" : "missing", message: hasDatabase ? "Database URL saved encrypted, not checked yet." : "Optional database URL not set." }
    },
    budget: {
      maxTracksPerRun: Number(body.maxTracksPerRun) || current.budget?.maxTracksPerRun || 10,
      maxRenderAttemptsPerProject: Number(body.maxRenderAttemptsPerProject) || current.budget?.maxRenderAttemptsPerProject || 5
    },
    pricing: {
      openaiInputPerMillionTokens: Number(body.openaiInputPerMillionTokens) || current.pricing?.openaiInputPerMillionTokens,
      openaiOutputPerMillionTokens: Number(body.openaiOutputPerMillionTokens) || current.pricing?.openaiOutputPerMillionTokens,
      elevenLabsPerMinute: Number(body.elevenLabsPerMinute) || current.pricing?.elevenLabsPerMinute,
      ffmpegPerRenderMinute: Number(body.ffmpegPerRenderMinute) || current.pricing?.ffmpegPerRenderMinute,
      youtubeUploadPerVideo: Number(body.youtubeUploadPerVideo) || current.pricing?.youtubeUploadPerVideo
    }
  });

  const requestedProviders = Array.isArray(body.validateProviders)
    ? body.validateProviders.filter((provider: unknown): provider is SetupProvider => ["openai", "elevenlabs", "database", "storage"].includes(String(provider)))
    : [];
  let validation = {};
  if (requestedProviders.length) {
    const result = await validateSetupProviders(requestedProviders);
    setup = result.setup;
    validation = result.validation;
  }

  return NextResponse.json({ setup, validation, ...(await getSecretSummary(setup)) });
}
