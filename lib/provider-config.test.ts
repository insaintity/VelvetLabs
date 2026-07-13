import { describe, expect, it } from "vitest";
import { providerConnectionExamples, providerConnectionSchema } from "./provider-config";

describe("provider connection schema", () => {
  it("accepts API, OpenAI-compatible and CLI provider shapes", () => {
    expect(providerConnectionExamples.every((example) => providerConnectionSchema.safeParse(example).success)).toBe(true);
    expect(
      providerConnectionSchema.safeParse({
        method: "openAiCompatible",
        label: "Custom host",
        model: "studio-model",
        baseUrl: "https://models.example.com/v1"
      }).success
    ).toBe(true);
  });

  it("rejects incomplete CLI provider configs", () => {
    expect(
      providerConnectionSchema.safeParse({
        method: "cli",
        label: "Missing command"
      }).success
    ).toBe(false);
  });
});
