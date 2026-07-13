import { describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret } from "./crypto";

describe("encrypted secret storage", () => {
  it("round-trips a secret without storing it as plain text", async () => {
    const encrypted = await encryptSecret("sk-test-secret");

    expect(encrypted.value).not.toContain("sk-test-secret");
    await expect(decryptSecret(encrypted)).resolves.toBe("sk-test-secret");
  });
});
