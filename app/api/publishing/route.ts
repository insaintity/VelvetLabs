import { NextResponse } from "next/server";
import { addJob, readDatabase, updateJob } from "@/lib/server/db";
import { requireSameOrigin } from "@/lib/server/security";

export async function GET() {
  const database = await readDatabase();
  return NextResponse.json({
    projects: database.projects.filter((project) => project.render?.videoPath || project.render?.videoStoragePath),
    schedules: database.jobs.filter((job) => job.type === "youtube-upload" && ["queued", "running"].includes(job.status)).sort(scheduleOrder),
    recent: database.uploads.slice(0, 5)
  });
}

export async function POST(request: Request) {
  const blocked = requireSameOrigin(request);
  if (blocked) return blocked;
  const body = await request.json();
  const database = await readDatabase();
  const project = database.projects.find((item) => item.id === body.projectId);
  if (!project?.render?.videoPath && !project?.render?.videoStoragePath) return NextResponse.json({ error: "Render this release before scheduling its upload." }, { status: 409 });
  const scheduledPublishAt = readFutureDate(body.scheduledPublishAt);
  if (!scheduledPublishAt) return NextResponse.json({ error: "Choose a future publishing time." }, { status: 400 });
  const existing = database.jobs.find((job) => job.projectId === project.id && job.type === "youtube-upload" && ["queued", "running"].includes(job.status));
  if (existing) return NextResponse.json({ error: "This release already has an active upload schedule.", job: existing }, { status: 409 });
  const privacy = body.privacy === "public" || body.privacy === "unlisted" ? body.privacy : "private";
  const job = await addJob({ type: "youtube-upload", projectId: project.id, status: "queued", message: `YouTube upload scheduled for ${scheduledPublishAt}.`, payload: { privacy, scheduledPublishAt } });
  return NextResponse.json({ job, message: "Upload scheduled." }, { status: 201 });
}

export async function PATCH(request: Request) {
  const blocked = requireSameOrigin(request);
  if (blocked) return blocked;
  const { jobId, action, scheduledPublishAt } = await request.json();
  const database = await readDatabase();
  const job = database.jobs.find((item) => item.id === jobId && item.type === "youtube-upload");
  if (!job) return NextResponse.json({ error: "Scheduled upload not found." }, { status: 404 });
  if (action === "cancel" && job.status === "queued") {
    const updated = await updateJob(job.id, { status: "blocked", message: "Scheduled YouTube upload cancelled." });
    return NextResponse.json({ job: updated });
  }
  if (action === "reschedule" && job.status === "queued") {
    const nextDate = readFutureDate(scheduledPublishAt);
    if (!nextDate) return NextResponse.json({ error: "Choose a future publishing time." }, { status: 400 });
    const updated = await updateJob(job.id, { payload: { ...job.payload, scheduledPublishAt: nextDate }, message: `YouTube upload rescheduled for ${nextDate}.` });
    return NextResponse.json({ job: updated });
  }
  return NextResponse.json({ error: "Only queued uploads can be changed." }, { status: 409 });
}

function readFutureDate(value: unknown) {
  if (typeof value !== "string") return undefined;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && timestamp > Date.now() + 60_000 ? new Date(timestamp).toISOString() : undefined;
}

function scheduleOrder(left: { payload?: Record<string, unknown>; createdAt: string }, right: { payload?: Record<string, unknown>; createdAt: string }) {
  return scheduleTime(left) - scheduleTime(right);
}

function scheduleTime(job: { payload?: Record<string, unknown>; createdAt: string }) {
  const value = typeof job.payload?.scheduledPublishAt === "string" ? Date.parse(job.payload.scheduledPublishAt) : Number.NaN;
  return Number.isFinite(value) ? value : Date.parse(job.createdAt);
}
