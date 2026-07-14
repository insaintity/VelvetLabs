import type { AlbumBlueprint, MediaType } from "../types";

const openaiBaseUrl = "https://api.openai.com/v1";

export async function validateOpenAIKey(apiKey: string) {
  const response = await fetch(`${openaiBaseUrl}/models`, {
    headers: { Authorization: `Bearer ${apiKey}` }
  });

  if (!response.ok) {
    return { valid: false, message: `OpenAI rejected the key (${response.status}).` };
  }

  return { valid: true, message: "OpenAI key is valid." };
}

export async function generateAlbumBlueprint({
  apiKey,
  model,
  brief,
  mediaType = "album"
}: {
  apiKey: string;
  model: string;
  brief: string;
  mediaType?: MediaType;
}): Promise<{ blueprint: AlbumBlueprint; raw: string; usage?: Record<string, number> }> {
  const isSong = mediaType === "song";
  const blueprintKind = isSong ? "single-song release" : "album";
  const trackPrompt = isSong
    ? `Create a single-track AI music blueprint from this brief. Return exactly one track:\n\n${brief}`
    : `Create a 6-track AI music album blueprint from this brief:\n\n${brief}`;

  const response = await fetch(`${openaiBaseUrl}/responses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content:
            `You are Velvet, an expert AI music director. Create concise, commercially useful ${blueprintKind} blueprints. Return only valid JSON.`
        },
        {
          role: "user",
          content: trackPrompt
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "album_blueprint",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["title", "concept", "targetLengthMinutes", "tracks", "coverPrompt", "videoPrompt", "youtube"],
            properties: {
              title: { type: "string" },
              concept: { type: "string" },
              targetLengthMinutes: { type: "number" },
              tracks: {
                type: "array",
                minItems: isSong ? 1 : 4,
                maxItems: isSong ? 1 : 10,
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["title", "durationSeconds", "prompt", "mood"],
                  properties: {
                    title: { type: "string" },
                    durationSeconds: { type: "number" },
                    prompt: { type: "string" },
                    mood: { type: "string" }
                  }
                }
              },
              coverPrompt: { type: "string" },
              videoPrompt: { type: "string" },
              youtube: {
                type: "object",
                additionalProperties: false,
                required: ["title", "description", "tags"],
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  tags: { type: "array", items: { type: "string" } }
                }
              }
            }
          },
          strict: true
        }
      }
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI blueprint generation failed (${response.status}).`);
  }

  const data = await response.json();
  const raw = data.output_text ?? data.output?.flatMap((item: { content?: Array<{ text?: string }> }) => item.content ?? []).map((item: { text?: string }) => item.text ?? "").join("");
  return { blueprint: JSON.parse(raw), raw, usage: data.usage };
}

export async function refineMusicPrompt({ apiKey, model, prompt }: { apiKey: string; model: string; prompt: string }) {
  const response = await fetch(`${openaiBaseUrl}/responses`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      input: [
        { role: "system", content: "You are Velvet's music prompt editor. Improve specificity, arrangement, arc, instrumentation, and production detail without changing the creator's intent." },
        { role: "user", content: prompt }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "prompt_refinement",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["prompt", "explanation"],
            properties: { prompt: { type: "string" }, explanation: { type: "string" } }
          }
        }
      }
    })
  });

  if (!response.ok) throw new Error(`OpenAI prompt refinement failed (${response.status}).`);
  const data = await response.json();
  const raw = data.output_text ?? data.output?.flatMap((item: { content?: Array<{ text?: string }> }) => item.content ?? []).map((item: { text?: string }) => item.text ?? "").join("");
  return { ...JSON.parse(raw), raw, usage: data.usage } as { prompt: string; explanation: string; raw: string; usage?: Record<string, number> };
}

export async function generateCreativeVariants({ apiKey, model, title, concept, coverPrompt }: { apiKey: string; model: string; title: string; concept: string; coverPrompt: string }) {
  const response = await fetch(`${openaiBaseUrl}/responses`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      input: [
        { role: "system", content: "You are Velvet's release strategist. Create distinct, tasteful YouTube title and thumbnail directions without clickbait." },
        { role: "user", content: `Release: ${title}\nConcept: ${concept}\nCurrent artwork direction: ${coverPrompt}` }
      ],
      text: { format: { type: "json_schema", name: "creative_variants", strict: true, schema: { type: "object", additionalProperties: false, required: ["titles", "thumbnailPrompts"], properties: { titles: { type: "array", minItems: 3, maxItems: 3, items: { type: "string" } }, thumbnailPrompts: { type: "array", minItems: 3, maxItems: 3, items: { type: "string" } } } } } }
    })
  });
  if (!response.ok) throw new Error(`OpenAI creative variants failed (${response.status}).`);
  const data = await response.json();
  const raw = data.output_text ?? data.output?.flatMap((item: { content?: Array<{ text?: string }> }) => item.content ?? []).map((item: { text?: string }) => item.text ?? "").join("");
  return { ...JSON.parse(raw), raw, usage: data.usage } as { titles: string[]; thumbnailPrompts: string[]; raw: string; usage?: Record<string, number> };
}
