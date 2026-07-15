import { NextResponse } from "next/server";
import { readDatabase, updateSetup } from "@/lib/server/db";
import { validateElevenLabsKey } from "@/lib/server/providers/elevenlabs";
import { validateOpenAIKey } from "@/lib/server/providers/openai";
import { validatePostgresConnection } from "@/lib/server/providers/postgres";
import { getStorageConfig, validateStorage } from "@/lib/server/providers/storage";
import { requireSameOrigin } from "@/lib/server/security";
import { readSecret } from "@/lib/server/secrets";
import type { SetupRecord } from "@/lib/server/types";

function workerSettings(setup: SetupRecord, patch: Partial<NonNullable<SetupRecord["worker"]>> = {}): NonNullable<SetupRecord["worker"]> {
  return {
    storageEndpoint: setup.worker?.storageEndpoint,
    storageRegion: setup.worker?.storageRegion ?? "auto",
    storageForcePathStyle: setup.worker?.storageForcePathStyle ?? false,
    storageBucket: setup.worker?.storageBucket ?? "velvet-assets",
    status: setup.worker?.status ?? { state: "valid", message: "Local storage is ready." },
    databaseStatus: setup.worker?.databaseStatus,
    ...patch
  };
}

export async function POST(request: Request) {
  const blocked = requireSameOrigin(request);
  if (blocked) return blocked;

  const { provider } = await request.json();
  const now = new Date().toISOString();

  if (provider === "openai") {
    const key = await readSecret("openai");
    if (!key) {
      const setup = await updateSetup({ openai: { planningModel: "gpt-4.1", imageModel: "gpt-image-1", status: { state: "missing", message: "Add an OpenAI key first.", checkedAt: now } } });
      return NextResponse.json({ status: setup.openai?.status }, { status: 400 });
    }

    const result = await validateOpenAIKey(key);
    const setup = await updateSetup({
      openai: {
        planningModel: "gpt-4.1",
        imageModel: "gpt-image-1",
        status: { state: result.valid ? "valid" : "invalid", message: result.message, checkedAt: now }
      }
    });
    return NextResponse.json({ status: setup.openai?.status }, { status: result.valid ? 200 : 401 });
  }

  if (provider === "elevenlabs") {
    const key = await readSecret("elevenlabs");
    if (!key) {
      const setup = await updateSetup({ elevenlabs: { musicModel: "eleven-music", outputFormat: "mp3_44100_128", status: { state: "missing", message: "Add an ElevenLabs key first.", checkedAt: now } } });
      return NextResponse.json({ status: setup.elevenlabs?.status }, { status: 400 });
    }

    const result = await validateElevenLabsKey(key);
    const setup = await updateSetup({
      elevenlabs: {
        musicModel: "eleven-music",
        outputFormat: "mp3_44100_128",
        status: { state: result.valid ? "valid" : "invalid", message: result.message, checkedAt: now }
      }
    });
    return NextResponse.json({ status: setup.elevenlabs?.status }, { status: result.valid ? 200 : 401 });
  }

  if (provider === "database") {
    const database = await readDatabase();
    const databaseUrl = await readSecret("databaseUrl");
    if (!databaseUrl) {
      const setup = await updateSetup({
        worker: workerSettings(database.setup, { databaseStatus: { state: "missing", message: "Add a PostgreSQL database URL first.", checkedAt: now } })
      });
      return NextResponse.json({ status: setup.worker?.databaseStatus }, { status: 400 });
    }

    const result = await validatePostgresConnection(databaseUrl);
    const setup = await updateSetup({
      worker: workerSettings(database.setup, { databaseStatus: { state: result.valid ? "valid" : "invalid", message: result.message, checkedAt: now } })
    });
    return NextResponse.json({ status: setup.worker?.databaseStatus }, { status: result.valid ? 200 : 401 });
  }

  if (provider === "storage") {
    const database = await readDatabase();
    const config = await getStorageConfig(database.setup);
    if (!config) {
      const setup = await updateSetup({
        worker: workerSettings(database.setup, { status: { state: "missing", message: "Add a Railway bucket or S3-compatible storage credentials first.", checkedAt: now } })
      });
      return NextResponse.json({ status: setup.worker?.status }, { status: 400 });
    }
    const result = await validateStorage(config);
    const setup = await updateSetup({
      worker: workerSettings(database.setup, { status: { state: result.valid ? "valid" : "invalid", message: result.message, checkedAt: now } })
    });
    return NextResponse.json({ status: setup.worker?.status }, { status: result.valid ? 200 : 401 });
  }

  return NextResponse.json({ error: "Unknown provider." }, { status: 400 });
}
