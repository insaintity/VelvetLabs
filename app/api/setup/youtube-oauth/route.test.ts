import { beforeEach, describe, expect, it, vi } from "vitest";

const secretState = vi.hoisted(() => ({ configured: false }));
const saveSecret = vi.hoisted(() => vi.fn(async (name: string) => {
  if (name === "googleClientId") secretState.configured = true;
}));

vi.mock("../../../../lib/server/security", () => ({ requireSameOrigin: () => null }));
vi.mock("../../../../lib/server/secrets", () => ({
  hasSecret: vi.fn(async (name: string) => name === "googleClientId" && secretState.configured),
  saveSecret
}));

import { POST } from "./route";

describe("YouTube OAuth desktop setup", () => {
  beforeEach(() => {
    secretState.configured = false;
    saveSecret.mockClear();
  });

  it("rejects a value that is not a Google OAuth client ID", async () => {
    const response = await POST(new Request("http://localhost/api/setup/youtube-oauth", {
      method: "POST",
      body: JSON.stringify({ clientId: "not-a-client" })
    }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: expect.stringContaining(".apps.googleusercontent.com") });
    expect(saveSecret).not.toHaveBeenCalled();
  });

  it("stores a valid desktop client configuration", async () => {
    const response = await POST(new Request("http://localhost/api/setup/youtube-oauth", {
      method: "POST",
      body: JSON.stringify({
        clientId: "123456.apps.googleusercontent.com",
        clientSecret: "optional-secret"
      })
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ configured: true });
    expect(saveSecret).toHaveBeenNthCalledWith(1, "googleClientId", "123456.apps.googleusercontent.com");
    expect(saveSecret).toHaveBeenNthCalledWith(2, "googleClientSecret", "optional-secret");
  });
});
