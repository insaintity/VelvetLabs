import { NextResponse } from "next/server";
import { addUsage, readDatabase } from "@/lib/server/db";
import { composeMusicPrompt } from "@/lib/server/providers/openai";
import { requireSameOrigin } from "@/lib/server/security";
import { readSecret } from "@/lib/server/secrets";
import type { MediaType } from "@/lib/server/types";

export async function POST(request: Request) {
  const blocked = requireSameOrigin(request);
  if (blocked) return blocked;

  const body = await request.json();
  const mediaType: MediaType = body.mediaType === "album" ? "album" : "song";
  const answers = body.answers;
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
    return NextResponse.json({ error: "Add some creative direction first." }, { status: 400 });
  }

  const cleanAnswers = Object.fromEntries(
    Object.entries(answers)
      .filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].trim().length > 0)
      .map(([key, value]) => [key, value.trim()])
  );
  if (Object.keys(cleanAnswers).length < 2) {
    return NextResponse.json({ error: "Answer at least two producer questions first." }, { status: 400 });
  }

  const apiKey = await readSecret("openai");
  if (!apiKey) {
    return NextResponse.json({ error: "Connect ChatGPT in Settings before using Prompt Producer." }, { status: 409 });
  }

  try {
    const database = await readDatabase();
    const result = await composeMusicPrompt({
      apiKey,
      model: database.setup.openai?.planningModel || "gpt-4.1",
      mediaType,
      answers: cleanAnswers
    });
    if (result.usage) {
      await addUsage({ provider: "openai", operation: "prompt-producer", units: result.usage });
    }
    return NextResponse.json({ prompt: result.prompt, source: "ai" });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Prompt creation failed." }, { status: 500 });
  }
}
