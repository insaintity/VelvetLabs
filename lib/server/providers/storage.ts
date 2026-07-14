import type { SetupRecord } from "../types";
import { readSecret } from "../secrets";

export type StorageConfig = {
  url: string;
  key: string;
  bucket: string;
};

export async function getStorageConfig(setup?: SetupRecord): Promise<StorageConfig | undefined> {
  const url = (process.env.SUPABASE_URL || setup?.worker?.supabaseUrl)?.replace(/\/$/, "");
  const key = await readSecret("supabaseServiceRole");
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || setup?.worker?.storageBucket || "velvet-assets";
  if (!url || !key) return undefined;
  return { url, key, bucket };
}

export async function ensureStorageBucket(config: StorageConfig) {
  const existing = await storageRequest(config, `/bucket/${encodeURIComponent(config.bucket)}`);
  if (existing.ok) return;
  if (existing.status !== 400 && existing.status !== 404) throw await storageError(existing, "Storage bucket could not be checked");
  const created = await storageRequest(config, "/bucket", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: config.bucket, name: config.bucket, public: false })
  });
  if (!created.ok && created.status !== 409) throw await storageError(created, "Storage bucket could not be created");
}

export async function uploadStorageObject(config: StorageConfig, objectPath: string, data: Buffer, contentType: string) {
  await ensureStorageBucket(config);
  const response = await storageRequest(config, `/object/${encodeURIComponent(config.bucket)}/${encodeObjectPath(objectPath)}`, {
    method: "POST",
    headers: { "Content-Type": contentType, "x-upsert": "true" },
    body: data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer
  });
  if (!response.ok) throw await storageError(response, "Storage upload failed");
  return objectPath;
}

export async function downloadStorageObject(config: StorageConfig, objectPath: string) {
  const response = await storageRequest(config, `/object/authenticated/${encodeURIComponent(config.bucket)}/${encodeObjectPath(objectPath)}`);
  if (!response.ok) throw await storageError(response, "Storage download failed");
  return Buffer.from(await response.arrayBuffer());
}

export async function validateStorage(config: StorageConfig) {
  try {
    await ensureStorageBucket(config);
    return { valid: true, message: `Private bucket ${config.bucket} is ready.` };
  } catch (error) {
    return { valid: false, message: error instanceof Error ? error.message : "Storage validation failed." };
  }
}

function storageRequest(config: StorageConfig, pathname: string, init?: RequestInit) {
  return fetch(`${config.url}/storage/v1${pathname}`, {
    ...init,
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      ...init?.headers
    }
  });
}

function encodeObjectPath(objectPath: string) {
  return objectPath.split("/").filter(Boolean).map(encodeURIComponent).join("/");
}

async function storageError(response: Response, message: string) {
  const detail = (await response.text().catch(() => "")).slice(0, 240);
  return new Error(`${message} (${response.status})${detail ? `: ${detail}` : "."}`);
}
