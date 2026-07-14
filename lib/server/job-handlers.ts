import { createHash, randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { addUsage, claimNextQueuedJob, readDatabase, updateJob, writeDatabase } from "./db";
import { materializeMedia, persistMedia, readMedia } from "./media-storage";
import { exportsDir } from "./paths";
import { generateMusicTrack } from "./providers/elevenlabs";
import { refreshYouTubeAccessToken, uploadYouTubeVideo } from "./providers/youtube";
import { readSecret } from "./secrets";
import type { GeneratedTrack, JobRecord, ProductionSettings } from "./types";

const execFileAsync = promisify(execFile);
const ffmpegBinary = process.env.FFMPEG_PATH || "ffmpeg";

export async function processNextQueuedJob() {
  const job = await claimNextQueuedJob();
  if (!job) {
    return undefined;
  }

  await processJob(job);
  return job;
}

export async function processJob(job: JobRecord) {
  try {
    if (job.type === "music") {
      await processMusicJob(job);
      return;
    }

    if (job.type === "render") {
      await processRenderJob(job);
      return;
    }

    if (job.type === "youtube-upload") {
      await processYouTubeUploadJob(job);
      return;
    }

    await updateJob(job.id, { status: "blocked", message: `${job.type} jobs are not handled by the worker yet.` });
  } catch (error) {
    await updateJob(job.id, {
      status: "failed",
      message: `${job.type} job failed.`,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

async function processMusicJob(job: JobRecord) {
  const projectId = requireProjectId(job);
  const database = await readDatabase();
  const project = database.projects.find((item) => item.id === projectId);

  if (!project?.blueprint) {
    throw new Error("Project blueprint is required before generating music.");
  }

  const maxTracks = database.setup.budget?.maxTracksPerRun ?? 10;
  if (project.blueprint.tracks.length > maxTracks) {
    throw new Error(`This blueprint has ${project.blueprint.tracks.length} tracks. Budget guardrail allows ${maxTracks} per run.`);
  }

  const elevenLabsKey = await readSecret("elevenlabs");
  if (!elevenLabsKey) {
    throw new Error("ElevenLabs setup is required before music generation.");
  }

  await updateJob(job.id, { message: "Generating album tracks." });
  const projectDir = path.join(exportsDir, project.id);
  await mkdir(projectDir, { recursive: true });
  const requestedTrackTitle = typeof job.payload?.trackTitle === "string" ? job.payload.trackTitle : undefined;
  const trackEntries = project.blueprint.tracks.map((track, index) => ({ track, index })).filter(({ track }) => !requestedTrackTitle || track.title === requestedTrackTitle);
  if (!trackEntries.length) throw new Error("The requested track was not found in this project.");
  const tracks: GeneratedTrack[] = [];

  for (const { track, index } of trackEntries) {
    const version = (project.trackVersions?.[track.title]?.length ?? 0) + 1;
    const audio = await generateMusicTrack({
      apiKey: elevenLabsKey,
      prompt: track.prompt,
      durationSeconds: track.durationSeconds
    });
    const filePath = path.join(projectDir, `${String(index + 1).padStart(2, "0")}-${slugify(track.title)}-v${version}.mp3`);
    await writeFile(filePath, audio);
    const storagePath = await persistMedia(filePath, `projects/${project.id}/audio/${path.basename(filePath)}`, "audio/mpeg", database.setup);
    tracks.push({ id: randomUUID(), title: track.title, filePath, storagePath, durationSeconds: track.durationSeconds, version, prompt: track.prompt, createdAt: new Date().toISOString() });
  }

  const latest = await readDatabase();
  latest.projects = latest.projects.map((item) =>
    item.id === projectId
      ? {
          ...item,
          status: "generating",
          generatedTracks: project.blueprint!.tracks.flatMap((blueprintTrack) => {
            const generated = tracks.find((track) => track.title === blueprintTrack.title) ?? item.generatedTracks?.find((track) => track.title === blueprintTrack.title);
            return generated ? [generated] : [];
          }),
          trackVersions: tracks.reduce((versions, track) => ({ ...versions, [track.title]: [...(item.trackVersions?.[track.title] ?? []), track] }), item.trackVersions ?? {}),
          updatedAt: new Date().toISOString()
        }
      : item
  );
  await writeDatabase(latest);
  await addUsage({
    provider: "elevenlabs",
    projectId,
    operation: "music-generation",
    units: { tracks: tracks.length, seconds: tracks.reduce((sum, track) => sum + track.durationSeconds, 0) }
  });
  await updateJob(job.id, { status: "completed", message: "Music tracks generated.", result: { tracks } });
}

async function processRenderJob(job: JobRecord) {
  const projectId = requireProjectId(job);
  const database = await readDatabase();
  const project = database.projects.find((item) => item.id === projectId);

  if (!project) {
    throw new Error("Project not found.");
  }

  const maxRenderAttempts = database.setup.budget?.maxRenderAttemptsPerProject ?? 5;
  const renderAttempts = database.usage.filter((usage) => usage.projectId === projectId && usage.operation === "render").length;
  if (renderAttempts >= maxRenderAttempts) {
    throw new Error(`Render guardrail reached for this project (${maxRenderAttempts} attempts).`);
  }

  await updateJob(job.id, { message: "Preparing shared tracks and render manifest." });
  const renderTracks = await Promise.all((project.generatedTracks ?? []).map(async (track) => ({
    ...track,
    filePath: await materializeMedia({ localPath: track.filePath, storagePath: track.storagePath, fallbackName: `${project.id}-${track.id ?? slugify(track.title)}.mp3`, setup: database.setup })
  })));
  const silenceAnalysis = renderTracks.length ? await analyzeSilence(renderTracks) : [];
  const manifest = {
    id: randomUUID(),
    projectId,
    title: project.title,
    blueprint: project.blueprint,
    createdAt: new Date().toISOString(),
    tracks: project.generatedTracks ?? [],
    production: project.production,
    silenceAnalysis,
    nextStep: "Install FFmpeg and generate tracks to produce MP4 output."
  };
  const projectDir = path.join(exportsDir, project.id);
  await mkdir(projectDir, { recursive: true });
  const filePath = path.join(projectDir, "render-manifest.json");
  await writeFile(filePath, `${JSON.stringify(manifest, null, 2)}\n`);
  const manifestStoragePath = await persistMedia(filePath, `projects/${project.id}/renders/render-manifest.json`, "application/json", database.setup);

  let renderStatus: "blocked" | "rendered" = "blocked";
  let message = "Render manifest created. FFmpeg is required for MP4 composition.";
  let videoPath: string | undefined;
  let videoStoragePath: string | undefined;

  if (renderTracks.length) {
    try {
      await execFileAsync(ffmpegBinary, ["-version"]);
      videoPath = path.join(projectDir, `${project.id}.mp4`);
      await execFileAsync(ffmpegBinary, buildAlbumRenderArgs(renderTracks, videoPath, project.production));
      videoStoragePath = await persistMedia(videoPath, `projects/${project.id}/renders/${project.id}.mp4`, "video/mp4", database.setup);
      renderStatus = "rendered";
      message = "Full album MP4 rendered with FFmpeg.";
    } catch {
      message = "Render package is ready, but FFmpeg is not available to Velvet or could not render the video. Set FFMPEG_PATH if it is not on PATH.";
    }
  } else {
    message = "Render manifest created. Generate music tracks before MP4 composition.";
  }

  const latest = await readDatabase();
  latest.projects = latest.projects.map((item) =>
    item.id === projectId
      ? {
          ...item,
          status: renderStatus === "rendered" ? "rendered" : item.status,
          render: { manifestPath: filePath, manifestStoragePath, videoPath, videoStoragePath, status: renderStatus, message },
          updatedAt: new Date().toISOString()
        }
      : item
  );
  await writeDatabase(latest);
  await addUsage({
    provider: "ffmpeg",
    projectId,
    operation: "render",
    units: {
      renders: renderStatus === "rendered" ? 1 : 0,
      seconds: project.generatedTracks?.reduce((sum, track) => sum + track.durationSeconds, 0) ?? 0
    }
  });
  await updateJob(job.id, { status: renderStatus === "rendered" ? "completed" : "blocked", message, result: { manifestPath: filePath, manifestStoragePath, videoPath, videoStoragePath } });
}

async function analyzeSilence(tracks: GeneratedTrack[]) {
  return Promise.all(tracks.map(async (track) => {
    try {
      const { stderr } = await execFileAsync(ffmpegBinary, ["-hide_banner", "-i", track.filePath, "-af", "silencedetect=n=-50dB:d=1.5", "-f", "null", "-"]);
      return { title: track.title, silentSections: (stderr.match(/silence_start:/g) ?? []).length, analyzed: true };
    } catch {
      return { title: track.title, silentSections: 0, analyzed: false };
    }
  }));
}

async function processYouTubeUploadJob(job: JobRecord) {
  const projectId = requireProjectId(job);
  const privacy = readPrivacy(job.payload?.privacy);
  const database = await readDatabase();
  const project = database.projects.find((item) => item.id === projectId);

  if (!project?.blueprint) {
    throw new Error("Project blueprint is required before upload.");
  }

  const refreshToken = await readSecret("youtubeRefreshToken");
  if (!refreshToken) {
    throw new Error("Connect YouTube before uploading.");
  }

  const requestedVideoPath = typeof job.payload?.videoPath === "string" ? job.payload.videoPath : project.render?.videoPath;
  if (!requestedVideoPath && !project.render?.videoStoragePath) {
    throw new Error("Render an MP4 before uploading.");
  }
  const safeVideoPath = await materializeMedia({ localPath: requestedVideoPath, storagePath: project.render?.videoStoragePath, fallbackName: `${project.id}.mp4`, setup: database.setup });
  const mediaIdentity = project.render?.videoStoragePath || safeVideoPath;
  const idempotencyKey = createHash("sha256").update(`${projectId}:${mediaIdentity}:${privacy}`).digest("hex");
  const existingUpload = database.uploads.find((upload) => upload.status === "uploaded" && upload.idempotencyKey === idempotencyKey);
  if (existingUpload) {
    await updateJob(job.id, { status: "completed", message: "Upload already exists. Returning existing YouTube record.", result: existingUpload });
    return;
  }

  await updateJob(job.id, { message: "Uploading video to YouTube." });
  const video = await readMedia(safeVideoPath, project.render?.videoStoragePath, database.setup);
  const token = await refreshYouTubeAccessToken(refreshToken);
  const upload = await uploadYouTubeVideo({
    accessToken: token.access_token,
    video,
    title: project.blueprint.youtube.title,
    description: project.blueprint.youtube.description,
    tags: project.blueprint.youtube.tags,
    privacy
  });

  await addUsage({ provider: "youtube", projectId, operation: "upload", units: { videos: 1, bytes: video.byteLength } });
  const latest = await readDatabase();
  const record = {
    id: randomUUID(),
    projectId,
    projectTitle: project.title,
    videoId: upload.id,
    url: `https://www.youtube.com/watch?v=${upload.id}`,
    videoPath: safeVideoPath,
    videoStoragePath: project.render?.videoStoragePath,
    manifestPath: project.render?.manifestPath,
    manifestStoragePath: project.render?.manifestStoragePath,
    idempotencyKey,
    prompts: latest.prompts
      .filter((prompt) => prompt.projectId === projectId)
      .map((prompt) => ({
        kind: prompt.kind,
        prompt: prompt.prompt,
        response: prompt.response,
        version: prompt.version
      })),
    usage: latest.usage.filter((usage) => usage.projectId === projectId),
    privacy,
    status: "uploaded" as const,
    createdAt: new Date().toISOString()
  };
  latest.uploads.unshift(record);
  latest.projects = latest.projects.map((item) => (item.id === projectId ? { ...item, status: "uploaded", updatedAt: new Date().toISOString() } : item));
  await writeDatabase(latest);
  await updateJob(job.id, { status: "completed", message: "Video uploaded to YouTube.", result: record });
}

function requireProjectId(job: JobRecord) {
  if (!job.projectId) {
    throw new Error("Project ID is required for this job.");
  }

  return job.projectId;
}

function readPrivacy(value: unknown): "private" | "unlisted" | "public" {
  return value === "unlisted" || value === "public" ? value : "private";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 64);
}

function buildAlbumRenderArgs(tracks: GeneratedTrack[], videoPath: string, production?: ProductionSettings) {
  const gapSeconds = Math.max(0, Math.min(10, production?.gapSeconds ?? 1.5));
  const fadeSeconds = Math.max(0, Math.min(5, production?.fadeSeconds ?? 0.8));
  const targetLufs = Math.max(-24, Math.min(-8, production?.targetLufs ?? -14));
  const totalSeconds = Math.max(
    1,
    tracks.reduce((sum, track) => sum + track.durationSeconds, 0) + Math.max(0, tracks.length - 1) * gapSeconds
  );
  const baseArgs = [
    "-y",
    "-f",
    "lavfi",
    "-i",
    `color=c=0b0712:s=1920x1080:r=30:d=${totalSeconds}`,
    ...tracks.flatMap((track) => ["-i", track.filePath])
  ];

  const filters = tracks.map((track, index) => {
    const fadeOutStart = Math.max(0, track.durationSeconds - fadeSeconds);
    const fade = fadeSeconds > 0 ? `,afade=t=in:st=0:d=${fadeSeconds},afade=t=out:st=${fadeOutStart}:d=${fadeSeconds}` : "";
    const gap = index < tracks.length - 1 && gapSeconds > 0 ? `,apad=pad_dur=${gapSeconds}` : "";
    return `[${index + 1}:a]loudnorm=I=${targetLufs}:TP=-1.5:LRA=11${fade}${gap}[a${index}]`;
  });
  const audioArgs = [
    "-filter_complex",
    `${filters.join(";")};${tracks.map((_, index) => `[a${index}]`).join("")}concat=n=${tracks.length}:v=0:a=1[aout]`,
    "-map",
    "0:v",
    "-map",
    "[aout]"
  ];

  return [
    ...baseArgs,
    ...audioArgs,
    "-c:v",
    "libx264",
    "-c:a",
    "aac",
    "-pix_fmt",
    "yuv420p",
    "-shortest",
    videoPath
  ];
}
