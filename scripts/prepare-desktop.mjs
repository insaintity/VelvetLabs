import { execFileSync } from "node:child_process";
import { cp, mkdir, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { build } from "esbuild";

const root = process.cwd();
const output = path.join(root, "desktop-dist");
const serverOutput = path.join(output, "app-server");

if (!await exists(path.join(root, ".next", "standalone", "server.js"))) {
  throw new Error("No reusable web build was found. Run npm run desktop:prepare once before using the fast desktop commands.");
}

await rm(output, { recursive: true, force: true });
await mkdir(serverOutput, { recursive: true });
await cp(path.join(root, ".next", "standalone"), serverOutput, { recursive: true });
await rm(path.join(serverOutput, ".velvet"), { recursive: true, force: true });
await cp(path.join(root, ".next", "static"), path.join(serverOutput, ".next", "static"), { recursive: true });
await cp(path.join(root, "public"), path.join(serverOutput, "public"), { recursive: true });

await build({
  entryPoints: [path.join(root, "workers", "velvet-worker.ts")],
  outfile: path.join(output, "velvet-worker.cjs"),
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node20"
});

const ffmpeg = await findFfmpeg();
if (!ffmpeg) throw new Error("FFmpeg was not found. Install it or set FFMPEG_PATH before building Velvet Desktop.");
const ffmpegOutput = path.join(output, "ffmpeg");
await mkdir(ffmpegOutput, { recursive: true });
await cp(ffmpeg, path.join(ffmpegOutput, "ffmpeg.exe"));
const ffprobe = path.join(path.dirname(ffmpeg), "ffprobe.exe");
if (await exists(ffprobe)) await cp(ffprobe, path.join(ffmpegOutput, "ffprobe.exe"));
await cp(path.join(root, "app", "icon.png"), path.join(output, "velvet-icon.png"));

console.log(`Desktop runtime prepared with ${ffmpeg}.`);

async function findFfmpeg() {
  const configured = process.env.FFMPEG_PATH;
  if (configured && await exists(configured)) return path.resolve(configured);
  if (process.platform !== "win32") return undefined;

  try {
    const located = execFileSync("where.exe", ["ffmpeg"], { encoding: "utf8", windowsHide: true })
      .split(/\r?\n/)
      .map((value) => value.trim())
      .find(Boolean);
    if (located && await exists(located)) return located;
  } catch {}

  const packages = path.join(process.env.LOCALAPPDATA ?? "", "Microsoft", "WinGet", "Packages");
  return await exists(packages) ? findFile(packages, "ffmpeg.exe", 6) : undefined;
}

async function findFile(directory, name, depth) {
  if (depth < 0) return undefined;
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const candidate = path.join(directory, entry.name);
    if (entry.isFile() && entry.name.toLowerCase() === name) return candidate;
    if (entry.isDirectory()) {
      const nested = await findFile(candidate, name, depth - 1);
      if (nested) return nested;
    }
  }
  return undefined;
}

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}
