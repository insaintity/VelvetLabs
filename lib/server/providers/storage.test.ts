import { GetObjectCommand, HeadBucketCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { afterEach, describe, expect, it, vi } from "vitest";
import { downloadStorageObject, getStorageConfig, uploadStorageObject, validateStorage } from "./storage";

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }));

vi.mock("@aws-sdk/client-s3", async () => {
  const actual = await vi.importActual<typeof import("@aws-sdk/client-s3")>("@aws-sdk/client-s3");
  return {
    ...actual,
    S3Client: class {
      send = sendMock;
    }
  };
});

describe("S3-compatible storage provider", () => {
  afterEach(() => {
    sendMock.mockReset();
    vi.unstubAllEnvs();
  });

  it("uses Railway bucket credentials without manual setup", async () => {
    vi.stubEnv("AWS_ENDPOINT_URL", "https://storage.railway.app/");
    vi.stubEnv("AWS_ACCESS_KEY_ID", "railway-access");
    vi.stubEnv("AWS_SECRET_ACCESS_KEY", "railway-secret");
    vi.stubEnv("AWS_S3_BUCKET_NAME", "velvet-private-123");
    vi.stubEnv("AWS_DEFAULT_REGION", "auto");
    vi.stubEnv("AWS_S3_URL_STYLE", "virtual");

    await expect(getStorageConfig()).resolves.toEqual({
      endpoint: "https://storage.railway.app",
      region: "auto",
      bucket: "velvet-private-123",
      accessKeyId: "railway-access",
      secretAccessKey: "railway-secret",
      forcePathStyle: false
    });
  });

  it("uploads, downloads, and validates private objects", async () => {
    const config = {
      endpoint: "https://storage.example.com",
      region: "auto",
      bucket: "velvet-assets",
      accessKeyId: "access-key",
      secretAccessKey: "secret-key",
      forcePathStyle: false
    };
    sendMock
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ Body: { transformToByteArray: async () => new Uint8Array([1, 2, 3]) } })
      .mockResolvedValueOnce({});

    await uploadStorageObject(config, "projects/release/audio one.mp3", Buffer.from([1, 2, 3]), "audio/mpeg");
    const downloaded = await downloadStorageObject(config, "projects/release/audio one.mp3");
    const validation = await validateStorage(config);

    expect(downloaded).toEqual(Buffer.from([1, 2, 3]));
    expect(validation).toEqual({ valid: true, message: "Private bucket velvet-assets is ready." });
    expect(sendMock.mock.calls[0]?.[0]).toBeInstanceOf(PutObjectCommand);
    expect(sendMock.mock.calls[1]?.[0]).toBeInstanceOf(GetObjectCommand);
    expect(sendMock.mock.calls[2]?.[0]).toBeInstanceOf(HeadBucketCommand);
    expect(sendMock.mock.calls[0]?.[0].input).toMatchObject({ Bucket: "velvet-assets", Key: "projects/release/audio one.mp3", ContentType: "audio/mpeg" });
  });
});
