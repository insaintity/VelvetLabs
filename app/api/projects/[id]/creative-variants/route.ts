import { NextResponse } from "next/server";
import { addPrompt, addUsage, readDatabase, updateProject } from "@/lib/server/db";
import { generateCreativeVariants } from "@/lib/server/providers/openai";
import { requireSameOrigin } from "@/lib/server/security";
import { readSecret } from "@/lib/server/secrets";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const blocked = requireSameOrigin(request);
  if (blocked) return blocked;
  const { id } = await context.params;
  const database = await readDatabase();
  const project = database.projects.find((item) => item.id === id);
  if (!project?.blueprint) return NextResponse.json({ error: "Project blueprint not found." }, { status: 404 });
  const apiKey = await readSecret("openai");
  if (!apiKey) return NextResponse.json({ error: "Connect OpenAI before creating variants." }, { status: 409 });
  try {
    const result = await generateCreativeVariants({ apiKey, model: database.setup.openai?.planningModel || "gpt-4.1", title: project.title, concept: project.blueprint.concept, coverPrompt: project.blueprint.coverPrompt });
    const creativeVariants = { titles: result.titles, thumbnailPrompts: result.thumbnailPrompts, createdAt: new Date().toISOString() };
    await updateProject(id, { creativeVariants });
    await addPrompt({ projectId: id, kind: "creative-variants", prompt: project.blueprint.coverPrompt, response: result.raw });
    if (result.usage) await addUsage({ provider: "openai", projectId: id, operation: "creative-variants", units: result.usage });
    return NextResponse.json({ creativeVariants });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Creative variants failed." }, { status: 500 });
  }
}
