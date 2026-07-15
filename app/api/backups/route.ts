import { NextResponse } from "next/server";
import { decodeBackup, listBackups, readLatestBackup, restoreSecretStore } from "@/lib/server/backups";
import { readDatabase, writeDatabase } from "@/lib/server/db";
import { requireSameOrigin } from "@/lib/server/security";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("list") === "1") return NextResponse.json({ backups: await listBackups() });
  const backup = await readLatestBackup(await readDatabase());
  return new Response(new Uint8Array(backup.data), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${backup.filename}"`,
      "Cache-Control": "no-store"
    }
  });
}

export async function POST(request: Request) {
  const blocked = requireSameOrigin(request);
  if (blocked) return blocked;
  const form = await request.formData();
  const file = form.get("backup");
  if (!(file instanceof File) || file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: "Choose a Velvet backup smaller than 20 MB." }, { status: 400 });
  }

  try {
    const current = await readDatabase();
    await readLatestBackup(current);
    const bundle = await decodeBackup(Buffer.from(await file.arrayBuffer()));
    await restoreSecretStore(bundle);
    await writeDatabase(bundle.database);
    return NextResponse.json({ restored: true, createdAt: bundle.createdAt, counts: { projects: bundle.database.projects.length, jobs: bundle.database.jobs.length, uploads: bundle.database.uploads.length } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Backup could not be restored." }, { status: 400 });
  }
}
