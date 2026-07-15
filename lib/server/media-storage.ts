import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { exportsDir } from "./paths";
import { downloadStorageObject, getStorageConfig, uploadStorageObject } from "./providers/storage";
import type { SetupRecord } from "./types";

export async function persistMedia(localPath: string, storagePath: string, contentType: string, setup?: SetupRecord) {
  const config = await getStorageConfig(setup);
  if (!config) return undefined;
  const data = await readFile(localPath);
  await uploadStorageObject(config, storagePath, data, contentType);
  return storagePath;
}

export async function readMedia(localPath: string | undefined, storagePath: string | undefined, setup?: SetupRecord) {
  if (localPath) {
    try {
      return await readFile(assertExportPath(localPath));
    } catch {
      // A different worker may own the original ephemeral file.
    }
  }
  const config = await getStorageConfig(setup);
  if (!config || !storagePath) throw new Error("Shared media is unavailable. Configure S3-compatible storage or restore the local file.");
  return downloadStorageObject(config, storagePath);
}

export async function materializeMedia({ localPath, storagePath, fallbackName, setup }: { localPath?: string; storagePath?: string; fallbackName: string; setup?: SetupRecord }) {
  if (localPath) {
    try {
      await access(assertExportPath(localPath));
      return localPath;
    } catch {
      // Download below when the file belongs to another service instance.
    }
  }
  const data = await readMedia(undefined, storagePath, setup);
  const cacheDirectory = path.join(exportsDir, ".shared-cache");
  await mkdir(cacheDirectory, { recursive: true });
  const safeName = fallbackName.replace(/[^a-z0-9._-]+/gi, "-").slice(0, 120) || "media.bin";
  const cachePath = path.join(cacheDirectory, safeName);
  await writeFile(cachePath, data);
  return cachePath;
}

export function assertExportPath(filePath: string) {
  const safeRoot = path.resolve(exportsDir);
  const safePath = path.resolve(filePath);
  if (safePath !== safeRoot && !safePath.startsWith(`${safeRoot}${path.sep}`)) throw new Error("Media path must be inside the Velvet export folder.");
  return safePath;
}
