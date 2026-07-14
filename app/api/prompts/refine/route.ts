import { NextResponse } from "next/server";
import { addPrompt, addUsage, readDatabase } from "@/lib/server/db";
import { refineMusicPrompt } from "@/lib/server/providers/openai";
import { requireSameOrigin } from "@/lib/server/security";
import { readSecret } from "@/lib/server/secrets";

export async function POST(request: Request) {
  const blocked = requireSameOrigin(request);
  if (blocked) return blocked;
  const { projectId, prompt } = await request.json();
  if (typeof projectId !== "string" || typeof prompt !== "string" || prompt.trim().length < 8) {
    return NextResponse.json({ error: "A project and fuller prompt are required." }, { status: 400 });
  }
  const apiKey = await readSecret("openai");
  if (!apiKey) return NextResponse.json({ error: "Connect OpenAI before refining prompts." }, { status: 409 });
  try {
    const database = await readDatabase();
    const result = await refineMusicPrompt({ apiKey, model: database.setup.openai?.planningModel || "gpt-4.1", prompt: prompt.trim() });
    await addPrompt({ projectId, kind: "track-refinement", prompt: prompt.trim(), response: result.raw });
    if (result.usage) await addUsage({ provider: "openai", projectId, operation: "prompt-refinement", units: result.usage });
    return NextResponse.json({ prompt: result.prompt, explanation: result.explanation });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Prompt refinement failed." }, { status: 500 });
  }
}
