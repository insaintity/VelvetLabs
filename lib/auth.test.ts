import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createSessionToken, passwordMatches, verifySessionToken } from "./auth";

describe("private studio authentication", () => {
  beforeEach(() => {
    process.env.VELVET_ADMIN_PASSWORD = "velvet-test-password";
    process.env.VELVET_SESSION_SECRET = "velvet-test-session-secret";
  });

  afterEach(() => {
    delete process.env.VELVET_ADMIN_PASSWORD;
    delete process.env.VELVET_SESSION_SECRET;
  });

  it("accepts only the configured password", async () => {
    await expect(passwordMatches("velvet-test-password")).resolves.toBe(true);
    await expect(passwordMatches("not-the-password")).resolves.toBe(false);
  });

  it("verifies active sessions and rejects tampering or expiry", async () => {
    const issuedAt = Date.parse("2026-07-14T00:00:00.000Z");
    const token = await createSessionToken(issuedAt);
    await expect(verifySessionToken(token, issuedAt + 60_000)).resolves.toBe(true);
    await expect(verifySessionToken(`${token}tampered`, issuedAt + 60_000)).resolves.toBe(false);
    await expect(verifySessionToken(token, issuedAt + 8 * 24 * 60 * 60_000)).resolves.toBe(false);
  });
});
