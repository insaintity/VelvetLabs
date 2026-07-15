import { GetObjectCommand, HeadBucketCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { SetupRecord } from "../types";
import { readSecret } from "../secrets";

export type StorageConfig = {
  endpoint?: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
};

export async function getStorageConfig(setup?: SetupRecord): Promise<StorageConfig | undefined> {
  const endpoint = firstValue(process.env.AWS_ENDPOINT_URL, process.env.S3_ENDPOINT, process.env.STORAGE_ENDPOINT, setup?.worker?.storageEndpoint)?.replace(/\/$/, "");
  const region = firstValue(process.env.AWS_DEFAULT_REGION, process.env.AWS_REGION, process.env.S3_REGION, process.env.STORAGE_REGION, setup?.worker?.storageRegion) || "auto";
  const bucket = firstValue(process.env.AWS_S3_BUCKET_NAME, process.env.S3_BUCKET, process.env.STORAGE_BUCKET, setup?.worker?.storageBucket);
  const accessKeyId = await readSecret("storageAccessKeyId");
  const secretAccessKey = await readSecret("storageSecretAccessKey");
  const forcePathStyle = parseUrlStyle(process.env.AWS_S3_URL_STYLE, setup?.worker?.storageForcePathStyle);

  if (!bucket || !accessKeyId || !secretAccessKey) return undefined;
  return { endpoint, region, bucket, accessKeyId, secretAccessKey, forcePathStyle };
}

export async function uploadStorageObject(config: StorageConfig, objectPath: string, data: Buffer, contentType: string) {
  await createStorageClient(config).send(new PutObjectCommand({
    Bucket: config.bucket,
    Key: normalizeObjectPath(objectPath),
    Body: data,
    ContentType: contentType
  }));
  return objectPath;
}

export async function downloadStorageObject(config: StorageConfig, objectPath: string) {
  const response = await createStorageClient(config).send(new GetObjectCommand({
    Bucket: config.bucket,
    Key: normalizeObjectPath(objectPath)
  }));
  if (!response.Body) throw new Error("Storage object returned an empty body.");
  return readBody(response.Body);
}

export async function validateStorage(config: StorageConfig) {
  try {
    await createStorageClient(config).send(new HeadBucketCommand({ Bucket: config.bucket }));
    return { valid: true, message: `Private bucket ${config.bucket} is ready.` };
  } catch (error) {
    return { valid: false, message: storageErrorMessage(error) };
  }
}

function createStorageClient(config: StorageConfig) {
  return new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    forcePathStyle: config.forcePathStyle,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey
    }
  });
}

function firstValue(...values: Array<string | undefined>) {
  return values.find((value) => value?.trim())?.trim();
}

function parseUrlStyle(value: string | undefined, configured: boolean | undefined) {
  if (value?.toLowerCase() === "path") return true;
  if (value?.toLowerCase() === "virtual") return false;
  return configured ?? false;
}

function normalizeObjectPath(objectPath: string) {
  return objectPath.split("/").filter(Boolean).join("/");
}

async function readBody(body: unknown) {
  if (typeof body === "object" && body && "transformToByteArray" in body && typeof body.transformToByteArray === "function") {
    return Buffer.from(await body.transformToByteArray());
  }

  if (typeof body === "object" && body && Symbol.asyncIterator in body) {
    const chunks: Buffer[] = [];
    for await (const chunk of body as AsyncIterable<Uint8Array>) chunks.push(Buffer.from(chunk));
    return Buffer.concat(chunks);
  }

  throw new Error("Storage object body could not be read.");
}

function storageErrorMessage(error: unknown) {
  if (!(error instanceof Error)) return "Storage validation failed.";
  return error.message.length > 240 ? `${error.message.slice(0, 237)}...` : error.message;
}
