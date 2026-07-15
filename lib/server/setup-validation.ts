import { readDatabase, updateSetup } from "./db";
import { validateElevenLabsKey } from "./providers/elevenlabs";
import { validateOpenAIKey } from "./providers/openai";
import { validatePostgresConnection } from "./providers/postgres";
import { getStorageConfig, validateStorage } from "./providers/storage";
import { readSecret } from "./secrets";
import type { ProviderStatus, SetupRecord } from "./types";

export type SetupProvider = "openai" | "elevenlabs" | "database" | "storage";

function status(state: ProviderStatus["state"], message: string): ProviderStatus {
  return { state, message, checkedAt: new Date().toISOString() };
}

export async function validateSetupProviders(providers: SetupProvider[]) {
  const database = await readDatabase();
  const unique = [...new Set(providers)];
  const results = await Promise.all(unique.map(async (provider) => [provider, await checkProvider(provider, database.setup)] as const));
  const validation = Object.fromEntries(results) as Partial<Record<SetupProvider, ProviderStatus>>;

  const next: SetupRecord = {};
  if (validation.openai) {
    next.openai = {
      planningModel: database.setup.openai?.planningModel ?? "gpt-4.1",
      imageModel: database.setup.openai?.imageModel ?? "gpt-image-1",
      status: validation.openai
    };
  }
  if (validation.elevenlabs) {
    next.elevenlabs = {
      musicModel: database.setup.elevenlabs?.musicModel ?? "eleven-music",
      outputFormat: database.setup.elevenlabs?.outputFormat ?? "mp3_44100_128",
      status: validation.elevenlabs
    };
  }
  if (validation.database || validation.storage) {
    next.worker = {
      storageEndpoint: database.setup.worker?.storageEndpoint,
      storageRegion: database.setup.worker?.storageRegion ?? "auto",
      storageForcePathStyle: database.setup.worker?.storageForcePathStyle ?? false,
      storageBucket: database.setup.worker?.storageBucket ?? "velvet-assets",
      status: validation.storage ?? database.setup.worker?.status ?? status("valid", "Local storage is ready."),
      databaseStatus: validation.database ?? database.setup.worker?.databaseStatus
    };
  }

  const setup = Object.keys(next).length ? await updateSetup(next) : database.setup;
  return { setup, validation };
}

async function checkProvider(provider: SetupProvider, setup: SetupRecord): Promise<ProviderStatus> {
  if (provider === "openai") {
    const key = await readSecret("openai");
    if (!key) return status("missing", "Add an OpenAI key first.");
    const result = await validateOpenAIKey(key);
    return status(result.valid ? "valid" : "invalid", result.message);
  }

  if (provider === "elevenlabs") {
    const key = await readSecret("elevenlabs");
    if (!key) return status("missing", "Add an ElevenLabs key first.");
    const result = await validateElevenLabsKey(key);
    return status(result.valid ? "valid" : "invalid", result.message);
  }

  if (provider === "database") {
    const connectionString = await readSecret("databaseUrl");
    if (!connectionString) return status("missing", "Optional database URL not set.");
    const result = await validatePostgresConnection(connectionString);
    return status(result.valid ? "valid" : "invalid", result.message);
  }

  const config = await getStorageConfig(setup);
  if (!config) return status("valid", "Local storage is ready.");
  const result = await validateStorage(config);
  return status(result.valid ? "valid" : "invalid", result.message);
}
