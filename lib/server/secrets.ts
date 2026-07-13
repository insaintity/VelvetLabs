import { readFile, writeFile } from "node:fs/promises";
import { decryptSecret, encryptSecret, type EncryptedValue } from "./crypto";
import { ensureVelvetDir, secretsPath } from "./paths";
import type { ProviderName } from "./types";

type SecretName = ProviderName | "youtubeRefreshToken" | "databaseUrl" | "workerSecret";

type SecretStore = Partial<Record<SecretName, EncryptedValue>>;

const envSecretNames: Record<SecretName, string[]> = {
  openai: ["OPENAI_API_KEY"],
  elevenlabs: ["ELEVENLABS_API_KEY"],
  youtube: [],
  youtubeRefreshToken: ["YOUTUBE_REFRESH_TOKEN"],
  databaseUrl: ["DATABASE_URL"],
  workerSecret: ["WORKER_SECRET"]
};

async function readSecretStore(): Promise<SecretStore> {
  await ensureVelvetDir();

  try {
    return JSON.parse(await readFile(secretsPath, "utf8"));
  } catch {
    return {};
  }
}

async function writeSecretStore(store: SecretStore) {
  await ensureVelvetDir();
  await writeFile(secretsPath, `${JSON.stringify(store, null, 2)}\n`, { mode: 0o600 });
}

export async function saveSecret(name: SecretName, value: string) {
  if (!value.trim()) {
    return;
  }

  if (process.env.VELVET_SECRET_PROVIDER === "env") {
    return;
  }

  const store = await readSecretStore();
  store[name] = await encryptSecret(value.trim());
  await writeSecretStore(store);
}

export async function readSecret(name: SecretName) {
  const envSecret = readEnvironmentSecret(name);
  if (envSecret) {
    return envSecret;
  }

  const store = await readSecretStore();
  const encrypted = store[name];
  return encrypted ? decryptSecret(encrypted) : undefined;
}

export async function hasSecret(name: SecretName) {
  if (readEnvironmentSecret(name)) {
    return true;
  }

  const store = await readSecretStore();
  return Boolean(store[name]);
}

function readEnvironmentSecret(name: SecretName) {
  for (const envName of envSecretNames[name]) {
    const value = process.env[envName];
    if (value?.trim()) {
      return value.trim();
    }
  }

  return undefined;
}
