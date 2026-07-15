import { readFile, readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { decryptSecret, encryptSecret, type EncryptedValue } from "./crypto";
import { backupsDir, ensureVelvetDir, secretsPath } from "./paths";
import type { VelvetDatabase } from "./types";

type BackupBundle = {
  version: 1;
  createdAt: string;
  database: VelvetDatabase;
  encryptedSecretStore?: string;
};

let lastAutomaticBackupAt = 0;
const automaticIntervalMs = 5 * 60_000;
const retainedBackups = 12;

export async function createRollingBackup(database: VelvetDatabase, force = false) {
  if (!force && Date.now() - lastAutomaticBackupAt < automaticIntervalMs) return undefined;
  await ensureVelvetDir();
  const createdAt = new Date().toISOString();
  const bundle: BackupBundle = {
    version: 1,
    createdAt,
    database,
    encryptedSecretStore: await readFile(secretsPath, "utf8").catch(() => undefined)
  };
  const encrypted = await encryptSecret(JSON.stringify(bundle));
  const filename = `velvet-backup-${createdAt.replace(/[:.]/g, "-")}.json.enc`;
  const destination = path.join(backupsDir, filename);
  await writeFile(destination, `${JSON.stringify(encrypted)}\n`, { mode: 0o600 });
  lastAutomaticBackupAt = Date.now();
  await pruneBackups();
  return { filename, destination, createdAt };
}

export async function listBackups() {
  await ensureVelvetDir();
  const files = (await readdir(backupsDir)).filter((file) => file.endsWith(".json.enc")).sort().reverse();
  return files.map((filename) => ({ filename, createdAt: backupDate(filename) }));
}

export async function readLatestBackup(database: VelvetDatabase) {
  const created = await createRollingBackup(database, true);
  if (!created) throw new Error("Backup could not be created.");
  return { filename: created.filename, data: await readFile(created.destination) };
}

export async function decodeBackup(data: Buffer): Promise<BackupBundle> {
  const encrypted = JSON.parse(data.toString("utf8")) as EncryptedValue;
  const bundle = JSON.parse(await decryptSecret(encrypted)) as BackupBundle;
  if (bundle.version !== 1 || !bundle.database || !Array.isArray(bundle.database.projects) || !Array.isArray(bundle.database.jobs)) {
    throw new Error("This is not a valid Velvet backup.");
  }
  return bundle;
}

export async function restoreSecretStore(bundle: BackupBundle) {
  if (bundle.encryptedSecretStore) await writeFile(secretsPath, bundle.encryptedSecretStore, { mode: 0o600 });
}

async function pruneBackups() {
  const files = (await readdir(backupsDir)).filter((file) => file.endsWith(".json.enc")).sort().reverse();
  await Promise.all(files.slice(retainedBackups).map((file) => unlink(path.join(backupsDir, file)).catch(() => undefined)));
}

function backupDate(filename: string) {
  const value = filename.replace("velvet-backup-", "").replace(".json.enc", "");
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2})-(\d{2})-(\d{2})/);
  return match ? `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}Z` : undefined;
}
