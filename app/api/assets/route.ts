import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { readDatabase, updateProject } from "@/lib/server/db";
import { persistMedia, readMedia } from "@/lib/server/media-storage";
import { exportsDir } from "@/lib/server/paths";
import { requireSameOrigin } from "@/lib/server/security";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId");
  const assetId = url.searchParams.get("assetId");
  const database = await readDatabase();
  const project = database.projects.find((item) => item.id === projectId);
  const asset = project?.referenceAssets?.find((item) => item.id === assetId && item.kind === "artwork");
  if (!asset) return NextResponse.json({ error: "Artwork not found." }, { status: 404 });
  try {
    const image = await readMedia(asset.filePath, asset.storagePath, database.setup);
    return new Response(new Uint8Array(image), {
      headers: {
        "Content-Type": artworkContentType(asset.name),
        "Content-Length": String(image.byteLength),
        "Cache-Control": "private, max-age=3600"
      }
    });
  } catch {
    return NextResponse.json({ error: "Artwork is unavailable on this worker." }, { status: 404 });
  }
}

export async function POST(request: Request) {
  const blocked = requireSameOrigin(request);
  if (blocked) return blocked;
  const form = await request.formData();
  const projectId = form.get("projectId");
  const file = form.get("file");
  if (typeof projectId !== "string" || !(file instanceof File)) return NextResponse.json({ error: "A project and file are required." }, { status: 400 });
  if (file.size > 25 * 1024 * 1024) return NextResponse.json({ error: "Reference files must be 25 MB or smaller." }, { status: 413 });
  const kind = file.type.startsWith("audio/") ? "audio" : file.type.startsWith("image/") ? "artwork" : undefined;
  if (!kind) return NextResponse.json({ error: "Use an audio or image reference." }, { status: 415 });
  const database = await readDatabase();
  const project = database.projects.find((item) => item.id === projectId);
  if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });
  const directory = path.join(exportsDir, projectId, "references");
  await mkdir(directory, { recursive: true });
  const extension = path.extname(file.name).replace(/[^.a-z0-9]/gi, "").slice(0, 8);
  const filePath = path.join(directory, `${randomUUID()}${extension}`);
  await writeFile(filePath, Buffer.from(await file.arrayBuffer()));
  const storagePath = await persistMedia(filePath, `projects/${projectId}/references/${path.basename(filePath)}`, file.type, database.setup);
  const asset: NonNullable<typeof project.referenceAssets>[number] = { id: randomUUID(), name: file.name.slice(0, 180), kind, filePath, storagePath, createdAt: new Date().toISOString() };
  await updateProject(projectId, { referenceAssets: [...(project.referenceAssets ?? []), asset] });
  return NextResponse.json({ asset });
}

function artworkContentType(name: string) {
  const extension = path.extname(name).toLowerCase();
  return extension === ".png" ? "image/png" : extension === ".webp" ? "image/webp" : extension === ".gif" ? "image/gif" : "image/jpeg";
}
