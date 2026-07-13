import { afterEach, describe, expect, it, vi } from "vitest";
import { hasSecret, readSecret } from "./secrets";

describe("secret provider", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reads production secrets from the environment when configured", async () => {
    vi.stubEnv("VELVET_SECRET_PROVIDER", "env");
    vi.stubEnv("OPENAI_API_KEY", "sk-env-openai");

    await expect(readSecret("openai")).resolves.toBe("sk-env-openai");
    await expect(hasSecret("openai")).resolves.toBe(true);
  });
});
