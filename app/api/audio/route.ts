import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { readDatabase } from "@/lib/server/db";
import { exportsDir } from "@/lib/server/paths";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId");
  const trackId = url.searchParams.get("trackId");
  const database = await readDatabase();
  const project = database.projects.find((item) => item.id === projectId);
  const versions = Object.values(project?.trackVersions ?? {}).flat();
  const track = [...(project?.generatedTracks ?? []), ...versions].find((item) => item.id === trackId || (!trackId && item.title === url.searchParams.get("title")));
  if (!track) return NextResponse.json({ error: "Audio not found." }, { status: 404 });
  const safeRoot = path.resolve(exportsDir);
  const safePath = path.resolve(track.filePath);
  if (!safePath.startsWith(`${safeRoot}${path.sep}`)) return NextResponse.json({ error: "Invalid audio path." }, { status: 403 });
  try {
    const audio = await readFile(safePath);
    const range = request.headers.get("range")?.match(/bytes=(\d+)-(\d*)/);
    if (range) {
      const start = Math.min(Number(range[1]), Math.max(0, audio.byteLength - 1));
      const requestedEnd = range[2] ? Number(range[2]) : audio.byteLength - 1;
      const end = Math.min(Math.max(start, requestedEnd), audio.byteLength - 1);
      const chunk = audio.subarray(start, end + 1);
      return new Response(chunk, { status: 206, headers: { "Content-Type": "audio/mpeg", "Content-Length": String(chunk.byteLength), "Content-Range": `bytes ${start}-${end}/${audio.byteLength}`, "Accept-Ranges": "bytes", "Cache-Control": "private, max-age=3600" } });
    }
    return new Response(audio, { headers: { "Content-Type": "audio/mpeg", "Content-Length": String(audio.byteLength), "Accept-Ranges": "bytes", "Cache-Control": "private, max-age=3600" } });
  } catch {
    return NextResponse.json({ error: "Audio file is unavailable." }, { status: 404 });
  }
}
