import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { addJob, readDatabase, updateJob, writeDatabase } from "@/lib/server/db";
import { exportsDir } from "@/lib/server/paths";

export async function POST(request: Request) {
  const { projectId } = await request.json();
  const database = await readDatabase();
  const project = database.projects.find((item) => item.id === projectId);

  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const job = await addJob({
    type: "render",
    projectId,
    status: "running",
    message: "Preparing render manifest."
  });

  const manifest = {
    id: randomUUID(),
    projectId,
    title: project.title,
    blueprint: project.blueprint,
    createdAt: new Date().toISOString(),
    nextStep: "Install and wire FFmpeg rendering to turn generated tracks, cover art, and video prompt into MP4."
  };
  const filePath = path.join(exportsDir, `${project.id}-render-manifest.json`);
  await writeFile(filePath, `${JSON.stringify(manifest, null, 2)}\n`);

  const latest = await readDatabase();
  latest.projects = latest.projects.map((item) => (item.id === projectId ? { ...item, status: "rendered", updatedAt: new Date().toISOString() } : item));
  await writeDatabase(latest);
  await updateJob(job.id, { status: "completed", message: "Render manifest created.", result: { filePath } });

  return NextResponse.json({ manifest, filePath });
}
