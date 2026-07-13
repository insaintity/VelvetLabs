import { z } from "zod";

export const providerConnectionSchema = z.discriminatedUnion("method", [
  z.object({
    method: z.literal("apiKey"),
    label: z.string().min(1),
    provider: z.string().min(1),
    model: z.string().min(1).optional(),
    apiKeyEnvVar: z.string().min(1),
    baseUrl: z.string().url().optional()
  }),
  z.object({
    method: z.literal("openAiCompatible"),
    label: z.string().min(1),
    model: z.string().min(1),
    baseUrl: z.string().url(),
    apiKeyEnvVar: z.string().min(1).optional()
  }),
  z.object({
    method: z.literal("cli"),
    label: z.string().min(1),
    command: z.string().min(1),
    model: z.string().min(1).optional(),
    timeoutSeconds: z.number().int().positive().max(3600).default(300)
  })
]);

export type ProviderConnection = z.infer<typeof providerConnectionSchema>;

export const providerConnectionExamples: ProviderConnection[] = [
  {
    method: "apiKey",
    label: "OpenAI production",
    provider: "openai",
    model: "gpt-4.1",
    apiKeyEnvVar: "OPENAI_API_KEY"
  },
  {
    method: "apiKey",
    label: "Claude planning",
    provider: "anthropic",
    model: "claude-sonnet",
    apiKeyEnvVar: "ANTHROPIC_API_KEY"
  },
  {
    method: "cli",
    label: "Local Claude CLI",
    command: "claude --print",
    timeoutSeconds: 300
  }
];
