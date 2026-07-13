import { NextResponse } from "next/server";
import { readDatabase } from "@/lib/server/db";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const database = await readDatabase();
  const project = database.projects.find((item) => item.id === id);

  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  return NextResponse.json({
    project,
    prompts: database.prompts.filter((prompt) => prompt.projectId === id),
    jobs: database.jobs.filter((job) => job.projectId === id),
    uploads: database.uploads.filter((upload) => upload.projectId === id)
  });
}
