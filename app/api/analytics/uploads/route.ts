import { NextResponse } from "next/server";
import { readDatabase } from "@/lib/server/db";

export async function GET() {
  const database = await readDatabase();
  const uploadJobs = database.jobs.filter((job) => job.type === "youtube-upload");
  const failures = uploadJobs.filter((job) => job.status === "failed");
  const successes = database.uploads.filter((upload) => upload.status === "uploaded");
  const attempts = successes.length + failures.length;
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setUTCDate(1); date.setUTCHours(0, 0, 0, 0); date.setUTCMonth(date.getUTCMonth() - (5 - index));
    const next = new Date(date); next.setUTCMonth(next.getUTCMonth() + 1);
    return {
      key: date.toISOString().slice(0, 7),
      label: date.toLocaleDateString("en", { month: "short" }),
      success: successes.filter((item) => inRange(item.createdAt, date, next)).length,
      failed: failures.filter((item) => inRange(item.updatedAt, date, next)).length
    };
  });
  return NextResponse.json({
    summary: {
      successfulUploads: successes.length,
      failedUploads: failures.length,
      scheduledUploads: uploadJobs.filter((job) => ["queued", "running"].includes(job.status)).length,
      successRate: attempts ? Math.round((successes.length / attempts) * 100) : 0,
      publicUploads: successes.filter((item) => item.privacy === "public").length,
      unlistedUploads: successes.filter((item) => item.privacy === "unlisted").length,
      privateUploads: successes.filter((item) => item.privacy === "private").length
    },
    months,
    uploads: successes.slice(0, 8),
    failures: failures.slice(0, 5).map((job) => ({ id: job.id, projectId: job.projectId, message: job.error || job.message, createdAt: job.updatedAt }))
  });
}

function inRange(value: string, start: Date, end: Date) {
  const timestamp = Date.parse(value);
  return timestamp >= start.getTime() && timestamp < end.getTime();
}
