import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { addJob, addPrompt, addUsage, readDatabase, updateJob, writeDatabase } from "@/lib/server/db";
import { generateAlbumBlueprint } from "@/lib/server/providers/openai";
import { requireSameOrigin } from "@/lib/server/security";
import { readSecret } from "@/lib/server/secrets";
import type { MediaType, ProjectRecord } from "@/lib/server/types";

export async function GET() {
  const database = await readDatabase();
  return NextResponse.json({ projects: database.projects });
}

export async function POST(request: Request) {
  const blocked = requireSameOrigin(request);
  if (blocked) return blocked;

  const { brief, mediaType: requestedMediaType } = await request.json();
  const mediaType: MediaType = requestedMediaType === "song" ? "song" : "album";
  const releaseLabel = mediaType === "song" ? "song" : "album";

  if (!brief || typeof brief !== "string" || brief.trim().length < 12) {
    return NextResponse.json({ error: `Add a fuller ${releaseLabel} brief first.` }, { status: 400 });
  }

  const openaiKey = await readSecret("openai");
  if (!openaiKey) {
    return NextResponse.json({ error: `OpenAI setup is required before creating a ${releaseLabel} blueprint.` }, { status: 409 });
  }

  const database = await readDatabase();
  const job = await addJob({
    type: "blueprint",
    status: "running",
    message: `Generating ${releaseLabel} blueprint.`
  });

  try {
    const { blueprint, raw, usage } = await generateAlbumBlueprint({
      apiKey: openaiKey,
      model: database.setup.openai?.planningModel || "gpt-4.1",
      brief: brief.trim(),
      mediaType
    });
    const now = new Date().toISOString();
    const project: ProjectRecord = {
      id: randomUUID(),
      title: blueprint.title,
      brief: brief.trim(),
      mediaType,
      status: "blueprint",
      blueprint,
      createdAt: now,
      updatedAt: now
    };
    const latest = await readDatabase();
    latest.projects.unshift(project);
    await writeDatabase(latest);
    const operation = `${mediaType}-blueprint`;
    await addPrompt({ projectId: project.id, kind: operation, prompt: brief.trim(), response: raw });
    if (usage) {
      await addUsage({ provider: "openai", projectId: project.id, operation, units: usage });
    }
    await updateJob(job.id, { status: "completed", message: "Blueprint created.", projectId: project.id, result: { projectId: project.id } });
    return NextResponse.json({ project });
  } catch (error) {
    await updateJob(job.id, { status: "failed", message: "Blueprint generation failed.", error: error instanceof Error ? error.message : "Unknown error" });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Blueprint generation failed." }, { status: 500 });
  }
}
