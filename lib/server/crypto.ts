import { randomBytes, createCipheriv, createDecipheriv, createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { ensureVelvetDir, masterKeyPath } from "./paths";

type EncryptedValue = {
  iv: string;
  tag: string;
  value: string;
};

async function getMasterKey() {
  const envSecret = process.env.VELVET_MASTER_KEY || process.env.TOKEN_ENCRYPTION_KEY;
  if (envSecret) {
    return createHash("sha256").update(envSecret).digest();
  }

  await ensureVelvetDir();

  try {
    const key = await readFile(masterKeyPath, "utf8");
    return Buffer.from(key.trim(), "base64");
  } catch {
    const key = randomBytes(32);
    await writeFile(masterKeyPath, key.toString("base64"), { mode: 0o600 });
    return key;
  }
}

export async function encryptSecret(value: string): Promise<EncryptedValue> {
  const key = await getMasterKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);

  return {
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    value: encrypted.toString("base64")
  };
}

export async function decryptSecret(encrypted: EncryptedValue): Promise<string> {
  const key = await getMasterKey();
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(encrypted.iv, "base64"));
  decipher.setAuthTag(Buffer.from(encrypted.tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(encrypted.value, "base64")), decipher.final()]).toString("utf8");
}

export type { EncryptedValue };
