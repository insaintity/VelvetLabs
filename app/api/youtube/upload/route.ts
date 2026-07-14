import { NextResponse } from "next/server";
import { addJob, readDatabase } from "@/lib/server/db";
import { processJob } from "@/lib/server/job-handlers";
import { requireSameOrigin } from "@/lib/server/security";

export async function POST(request: Request) {
  const blocked = requireSameOrigin(request);
  if (blocked) return blocked;
  const { projectId, videoPath, privacy = "private" } = await request.json();
  const database = await readDatabase();
  if (!database.projects.some((project) => project.id === projectId)) return NextResponse.json({ error: "Project not found." }, { status: 404 });
  const job = await addJob({ type: "youtube-upload", projectId, status: "running", message: "Uploading video to YouTube.", payload: { videoPath, privacy } });
  await processJob(job);
  const latest = await readDatabase();
  const completedJob = latest.jobs.find((item) => item.id === job.id);
  if (completedJob?.status === "failed") return NextResponse.json({ error: completedJob.error ?? completedJob.message }, { status: 500 });
  return NextResponse.json({ job: completedJob, upload: completedJob?.result, message: completedJob?.message });
}
