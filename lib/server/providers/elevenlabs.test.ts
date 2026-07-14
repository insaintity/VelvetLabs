import { afterEach, describe, expect, it, vi } from "vitest";
import { validateElevenLabsKey } from "./elevenlabs";

describe("ElevenLabs provider", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reports subscription usage when validating a key", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          tier: "creator",
          character_count: 1200,
          character_limit: 10000,
          max_credit_limit_extension: 500
        })
      )
    );

    await expect(validateElevenLabsKey("eleven-key")).resolves.toEqual({
      valid: true,
      message: "ElevenLabs key is valid. creator plan. Usage: 1,200 / 10,000 characters. 500 extra credits available."
    });
  });
});
