import { NextResponse } from "next/server";
import { readDatabase } from "@/lib/server/db";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const database = await readDatabase();
  const project = database.projects.find((item) => item.id === id);
  if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });
  const archive = {
    exportedAt: new Date().toISOString(),
    project,
    prompts: database.prompts.filter((item) => item.projectId === id),
    jobs: database.jobs.filter((item) => item.projectId === id),
    usage: database.usage.filter((item) => item.projectId === id),
    uploads: database.uploads.filter((item) => item.projectId === id)
  };
  return new Response(`${JSON.stringify(archive, null, 2)}\n`, {
    headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="velvet-${id}-archive.json"` }
  });
}
