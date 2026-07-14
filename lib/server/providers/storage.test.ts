import { afterEach, describe, expect, it, vi } from "vitest";
import { downloadStorageObject, getStorageConfig, uploadStorageObject } from "./storage";

describe("Supabase Storage provider", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("uses server-only credentials and a private bucket", async () => {
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co/");
    vi.stubEnv("SUPABASE_SECRET_KEY", "sb_secret_test");
    vi.stubEnv("SUPABASE_STORAGE_BUCKET", "velvet-private");
    const config = await getStorageConfig();
    expect(config).toEqual({ url: "https://example.supabase.co", key: "sb_secret_test", bucket: "velvet-private" });
  });

  it("uploads and downloads authenticated objects", async () => {
    const config = { url: "https://example.supabase.co", key: "service-key", bucket: "velvet-assets" };
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response("{}", { status: 200 }))
      .mockResolvedValueOnce(new Response("{}", { status: 200 }))
      .mockResolvedValueOnce(new Response(new Uint8Array([1, 2, 3]), { status: 200 }));

    await uploadStorageObject(config, "projects/release/audio one.mp3", Buffer.from([1, 2, 3]), "audio/mpeg");
    const downloaded = await downloadStorageObject(config, "projects/release/audio one.mp3");

    expect(downloaded).toEqual(Buffer.from([1, 2, 3]));
    expect(fetchMock.mock.calls[1]?.[0]).toBe("https://example.supabase.co/storage/v1/object/velvet-assets/projects/release/audio%20one.mp3");
    expect(fetchMock.mock.calls[2]?.[0]).toBe("https://example.supabase.co/storage/v1/object/authenticated/velvet-assets/projects/release/audio%20one.mp3");
    expect(new Headers(fetchMock.mock.calls[1]?.[1]?.headers).get("authorization")).toBe("Bearer service-key");
  });
});
