import { readFile, writeFile } from "node:fs/promises";
import { decryptSecret, encryptSecret, type EncryptedValue } from "./crypto";
import { ensureVelvetDir, secretsPath } from "./paths";
import type { ProviderName } from "./types";

type SecretStore = Partial<Record<ProviderName | "youtubeRefreshToken", EncryptedValue>>;

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

export async function saveSecret(name: ProviderName | "youtubeRefreshToken", value: string) {
  if (!value.trim()) {
    return;
  }

  const store = await readSecretStore();
  store[name] = await encryptSecret(value.trim());
  await writeSecretStore(store);
}

export async function readSecret(name: ProviderName | "youtubeRefreshToken") {
  const store = await readSecretStore();
  const encrypted = store[name];
  return encrypted ? decryptSecret(encrypted) : undefined;
}

export async function hasSecret(name: ProviderName | "youtubeRefreshToken") {
  const store = await readSecretStore();
  return Boolean(store[name]);
}
