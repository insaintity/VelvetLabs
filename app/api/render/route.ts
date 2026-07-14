import { NextResponse } from "next/server";
import { addJob, readDatabase } from "@/lib/server/db";
import { processJob } from "@/lib/server/job-handlers";
import { requireSameOrigin } from "@/lib/server/security";

export async function POST(request: Request) {
  const blocked = requireSameOrigin(request);
  if (blocked) return blocked;
  const { projectId } = await request.json();
  const database = await readDatabase();
  if (!database.projects.some((project) => project.id === projectId)) return NextResponse.json({ error: "Project not found." }, { status: 404 });
  const job = await addJob({ type: "render", projectId, status: "running", message: "Preparing render." });
  await processJob(job);
  const latest = await readDatabase();
  const completedJob = latest.jobs.find((item) => item.id === job.id);
  const project = latest.projects.find((item) => item.id === projectId);
  if (completedJob?.status === "failed") return NextResponse.json({ error: completedJob.error ?? completedJob.message }, { status: 500 });
  return NextResponse.json({ job: completedJob, render: project?.render, status: completedJob?.status, message: completedJob?.message });
}
