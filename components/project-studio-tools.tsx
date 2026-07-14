"use client";

import { useEffect, useState } from "react";
import { Activity, ArrowDown, ArrowUp, Check, Clock3, Download, FileAudio, GripVertical, ImageIcon, Loader2, Music2, Pause, Play, RefreshCw, RotateCcw, Sparkles, Upload, X } from "lucide-react";
import { AnimatePresence, motion, Reorder } from "framer-motion";
import { StatusPill, Waveform } from "@/components/studio-chrome";
import { formatDuration } from "@/lib/time";
import { usePlayerStore } from "@/store/player-store";

export type StudioTrack = { title: string; durationSeconds: number; prompt: string; mood: string };
export type StudioVersion = { id?: string; title: string; durationSeconds: number; version?: number; prompt?: string; createdAt?: string; approvedAt?: string };
export type StudioJob = { id: string; type: string; status: string; message: string; updatedAt?: string };
export type StudioProduction = { gapSeconds: number; fadeSeconds: number; targetLufs: number; stylePreset?: string; scheduledPublishAt?: string };

export function emitToast(message: string, tone: "success" | "error" | "neutral" = "neutral") {
  window.dispatchEvent(new CustomEvent("velvet:toast", { detail: { message, tone } }));
}

export function ToastHost() {
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; tone: string }>>([]);
  useEffect(() => {
    const listener = (event: Event) => {
      const detail = (event as CustomEvent<{ message: string; tone: string }>).detail;
      const id = Date.now();
      setToasts((current) => [...current.slice(-2), { id, ...detail }]);
      window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 3200);
    };
    window.addEventListener("velvet:toast", listener);
    return () => window.removeEventListener("velvet:toast", listener);
  }, []);
  return (
    <div className="pointer-events-none fixed right-5 top-20 z-[80] grid w-[320px] gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div key={toast.id} initial={{ opacity: 0, x: 20, scale: 0.98 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 12 }} className={`panel rounded-lg px-4 py-3 text-sm shadow-2xl ${toast.tone === "error" ? "border-[rgba(219,99,114,.38)]" : toast.tone === "success" ? "border-[rgba(88,182,168,.35)]" : ""}`}>
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function Drawer({ open, onClose, title, icon, children, width = "max-w-[560px]" }: { open: boolean; onClose: () => void; title: string; icon: React.ReactNode; children: React.ReactNode; width?: string }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="fixed inset-0 z-50 flex justify-end bg-black/55 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
          <motion.section role="dialog" aria-modal="true" aria-label={title} className={`panel h-full w-full ${width} overflow-hidden rounded-none border-y-0 border-r-0 p-5`} initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 28, opacity: 0 }} transition={{ type: "spring", stiffness: 260, damping: 28 }}>
            <div className="flex h-10 items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-white"><span className="text-[var(--rose-soft)]">{icon}</span>{title}</div>
              <button onClick={onClose} title="Close" aria-label={`Close ${title}`} className="grid h-9 w-9 place-items-center rounded-lg text-[var(--text-muted)] hover:bg-white/[0.06] hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="h-[calc(100%-40px)] min-h-0">{children}</div>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function TrackAuditionDrawer({ open, onClose, projectId, projectTitle, track, versions, selectedVersion, onRefresh, onApplyPrompt }: { open: boolean; onClose: () => void; projectId: string; projectTitle: string; track: StudioTrack | null; versions: StudioVersion[]; selectedVersion?: StudioVersion; onRefresh: () => Promise<void>; onApplyPrompt: (prompt: string) => Promise<void> }) {
  const { activeTrack, isPlaying, loadTrack, togglePlaying } = usePlayerStore();
  const [activeVersion, setActiveVersion] = useState<StudioVersion | undefined>(selectedVersion ?? versions.at(-1));
  const [prompt, setPrompt] = useState(track?.prompt ?? "");
  const [explanation, setExplanation] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  useEffect(() => { setActiveVersion(selectedVersion ?? versions.at(-1)); setPrompt(track?.prompt ?? ""); setExplanation(""); }, [selectedVersion, track, versions]);
  if (!track) return null;
  const isCurrent = activeTrack?.title === track.title && activeTrack?.version === activeVersion?.version;
  const sourceUrl = activeVersion ? `/api/audio?projectId=${encodeURIComponent(projectId)}&trackId=${encodeURIComponent(activeVersion.id ?? "")}&title=${encodeURIComponent(track.title)}` : undefined;

  async function versionAction(type: "select" | "approve") {
    if (!activeVersion) return;
    setBusy(type);
    const response = await fetch(`/api/projects/${projectId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ versionAction: { type, title: track!.title, versionId: activeVersion.id ?? String(activeVersion.version) } }) });
    setBusy(null);
    if (!response.ok) return emitToast("Version could not be updated.", "error");
    emitToast(type === "approve" ? "Track version approved." : "Active version changed.", "success");
    await onRefresh();
  }

  async function refine() {
    setBusy("refine");
    const response = await fetch("/api/prompts/refine", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId, prompt }) });
    const data = await response.json();
    setBusy(null);
    if (!response.ok) return emitToast(data.error ?? "Prompt refinement failed.", "error");
    setPrompt(data.prompt); setExplanation(data.explanation); emitToast("Refined prompt ready to review.", "success");
  }

  async function regenerate() {
    setBusy("regenerate");
    const response = await fetch("/api/jobs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId, type: "music", payload: { trackTitle: track!.title } }) });
    setBusy(null);
    emitToast(response.ok ? "Track regeneration queued." : "Track could not be queued.", response.ok ? "success" : "error");
    await onRefresh();
  }

  return (
    <Drawer open={open} onClose={onClose} title="Track audition" icon={<Music2 className="h-4 w-4" />}>
      <div className="grid h-full grid-rows-[auto_auto_minmax(0,1fr)_auto] gap-4 pt-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0"><div className="text-2xl font-semibold text-white">{track.title}</div><div className="mt-1 text-xs text-[var(--text-muted)]">{track.mood} · {formatDuration(track.durationSeconds)} · {versions.length || 0} versions</div></div>
          {activeVersion?.approvedAt ? <StatusPill status="Approved" /> : <StatusPill status={activeVersion ? `Version ${activeVersion.version ?? 1}` : "Not generated"} />}
        </div>
        <div className="rounded-xl bg-black/20 p-4 ring-1 ring-inset ring-[var(--border)]">
          <Waveform isPlaying={Boolean(isCurrent && isPlaying)} progress={isCurrent && activeTrack ? usePlayerStore.getState().positionSeconds / activeTrack.durationSeconds : 0.28} />
          <div className="mt-3 flex items-center justify-between">
            <button disabled={!activeVersion} onClick={() => { if (!isCurrent) loadTrack({ title: track.title, projectTitle, artworkTitle: projectTitle, durationSeconds: activeVersion?.durationSeconds ?? track.durationSeconds, sourceUrl, version: activeVersion?.version }); togglePlaying(); }} className="flex h-10 items-center gap-2 rounded-lg bg-[linear-gradient(135deg,var(--violet),var(--rose))] px-4 text-sm font-medium disabled:opacity-40">{isCurrent && isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}Audition</button>
            <div className="flex gap-1.5">{versions.map((version) => <button key={version.id ?? version.version} onClick={() => setActiveVersion(version)} className={`h-9 min-w-9 rounded-lg px-3 text-xs ${activeVersion === version ? "bg-[rgba(239,99,152,.16)] text-white ring-1 ring-inset ring-[var(--border-active)]" : "bg-white/[.04] text-[var(--text-muted)]"}`}>V{version.version ?? 1}</button>)}</div>
          </div>
        </div>
        <div className="min-h-0 rounded-xl bg-white/[0.025] p-4 ring-1 ring-inset ring-[var(--border)]">
          <div className="flex items-center justify-between"><span className="text-[10px] font-semibold uppercase tracking-[.13em] text-[var(--rose-soft)]">Generation prompt</span><button onClick={refine} disabled={Boolean(busy)} className="flex h-8 items-center gap-2 rounded-lg bg-white/[.05] px-3 text-xs hover:bg-white/[.08] disabled:opacity-40"><Sparkles className="h-3.5 w-3.5" />Refine</button></div>
          <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} className="mt-3 h-28 w-full resize-none bg-transparent text-sm leading-6 text-[var(--text-secondary)] outline-none" />
          <AnimatePresence>{explanation ? <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="border-t border-[var(--border)] pt-3 text-xs leading-5 text-[var(--text-muted)]">{explanation}</motion.p> : null}</AnimatePresence>
        </div>
        <div className="grid grid-cols-5 gap-2">
          <a href={sourceUrl} download title="Download selected track" className={`flex h-10 items-center justify-center rounded-lg bg-white/[.05] text-xs hover:bg-white/[.08] ${activeVersion ? "" : "pointer-events-none opacity-40"}`}><Download className="h-3.5 w-3.5" /></a>
          <button onClick={() => onApplyPrompt(prompt)} className="h-10 rounded-lg bg-white/[.05] text-xs hover:bg-white/[.08]">Use prompt</button>
          <button onClick={regenerate} disabled={Boolean(busy)} className="flex h-10 items-center justify-center gap-2 rounded-lg bg-white/[.05] text-xs hover:bg-white/[.08] disabled:opacity-40"><RefreshCw className="h-3.5 w-3.5" />Regenerate</button>
          <button onClick={() => versionAction("select")} disabled={!activeVersion || Boolean(busy)} className="h-10 rounded-lg bg-white/[.05] text-xs disabled:opacity-40">Use version</button>
          <button onClick={() => versionAction("approve")} disabled={!activeVersion || Boolean(busy)} className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[rgba(88,182,168,.12)] text-xs text-[var(--success)] disabled:opacity-40"><Check className="h-3.5 w-3.5" />Approve</button>
        </div>
      </div>
    </Drawer>
  );
}

export function CreativeVariantsDrawer({ open, onClose, projectId, variants, onUseTitle, onUseThumbnail, onRefresh }: { open: boolean; onClose: () => void; projectId: string; variants?: { titles: string[]; thumbnailPrompts: string[]; createdAt: string }; onUseTitle: (title: string) => Promise<void>; onUseThumbnail: (prompt: string) => Promise<void>; onRefresh: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  async function generate() { setBusy(true); const response = await fetch(`/api/projects/${projectId}/creative-variants`, { method: "POST", headers: { "Content-Type": "application/json" } }); const data = await response.json(); setBusy(false); emitToast(response.ok ? "Creative variants are ready." : data.error ?? "Variants could not be created.", response.ok ? "success" : "error"); if (response.ok) await onRefresh(); }
  return (
    <Drawer open={open} onClose={onClose} title="Creative variants" icon={<ImageIcon className="h-4 w-4" />}>
      <div className="grid h-full grid-rows-[auto_minmax(0,1fr)] gap-4 pt-4">
        <div className="flex items-center justify-between rounded-xl bg-black/20 p-4 ring-1 ring-inset ring-[var(--border)]"><div><div className="text-sm font-medium text-white">YouTube release options</div><div className="mt-1 text-xs text-[var(--text-muted)]">Three title and thumbnail directions, generated on demand.</div></div><button onClick={generate} disabled={busy} className="flex h-9 items-center gap-2 rounded-lg bg-[linear-gradient(135deg,var(--violet),var(--rose))] px-4 text-xs font-medium disabled:opacity-40">{busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}{variants ? "Refresh" : "Generate"}</button></div>
        <div className="grid min-h-0 grid-cols-2 gap-3 overflow-hidden">
          <section><div className="mb-2 text-[10px] font-semibold uppercase tracking-[.12em] text-[var(--rose-soft)]">Title variants</div><div className="grid gap-2">{(variants?.titles ?? ["Generate variants to compare release titles."]).map((title, index) => <button key={title} disabled={!variants} onClick={() => onUseTitle(title)} className="rounded-lg bg-white/[.025] p-3 text-left text-xs leading-5 text-[var(--text-secondary)] ring-1 ring-inset ring-[var(--border)] hover:bg-white/[.05] hover:text-white disabled:opacity-50"><span className="mr-2 text-[var(--rose-soft)]">0{index + 1}</span>{title}</button>)}</div></section>
          <section><div className="mb-2 text-[10px] font-semibold uppercase tracking-[.12em] text-[var(--rose-soft)]">Thumbnail directions</div><div className="grid gap-2">{(variants?.thumbnailPrompts ?? ["Generate variants to compare artwork directions."]).map((prompt, index) => <button key={prompt} disabled={!variants} onClick={() => onUseThumbnail(prompt)} className="rounded-lg bg-white/[.025] p-3 text-left text-xs leading-5 text-[var(--text-secondary)] ring-1 ring-inset ring-[var(--border)] hover:bg-white/[.05] hover:text-white disabled:opacity-50"><span className="mr-2 text-[var(--rose-soft)]">0{index + 1}</span>{prompt}</button>)}</div></section>
        </div>
      </div>
    </Drawer>
  );
}

export function SequenceDrawer({ open, onClose, tracks, production, onSave }: { open: boolean; onClose: () => void; tracks: StudioTrack[]; production?: StudioProduction; onSave: (tracks: StudioTrack[], production: StudioProduction) => Promise<void> }) {
  const [ordered, setOrdered] = useState(tracks);
  const [settings, setSettings] = useState<StudioProduction>(production ?? { gapSeconds: 1.5, fadeSeconds: 0.8, targetLufs: -14, stylePreset: "Studio master" });
  useEffect(() => { setOrdered(tracks); setSettings(production ?? { gapSeconds: 1.5, fadeSeconds: 0.8, targetLufs: -14, stylePreset: "Studio master" }); }, [production, tracks]);
  function move(index: number, direction: -1 | 1) { const next = [...ordered]; const target = index + direction; if (target < 0 || target >= next.length) return; [next[index], next[target]] = [next[target], next[index]]; setOrdered(next); }
  const total = ordered.reduce((sum, track) => sum + track.durationSeconds, 0) + Math.max(0, ordered.length - 1) * settings.gapSeconds;
  return (
    <Drawer open={open} onClose={onClose} title="Album timeline" icon={<Activity className="h-4 w-4" />} width="max-w-[620px]">
      <div className="grid h-full grid-rows-[auto_minmax(0,1fr)_auto] gap-4 pt-4">
        <div className="space-y-3 rounded-xl bg-black/20 p-3 ring-1 ring-inset ring-[var(--border)]">
          <div className="grid grid-cols-4 gap-2"><CompactNumber label="Gap" value={settings.gapSeconds} min={0} max={10} step={0.5} suffix="s" onChange={(gapSeconds) => setSettings({ ...settings, gapSeconds })} /><CompactNumber label="Fade" value={settings.fadeSeconds} min={0} max={5} step={0.1} suffix="s" onChange={(fadeSeconds) => setSettings({ ...settings, fadeSeconds })} /><CompactNumber label="Loudness" value={settings.targetLufs} min={-24} max={-8} step={1} suffix=" LUFS" onChange={(targetLufs) => setSettings({ ...settings, targetLufs })} /><div><div className="text-[9px] uppercase tracking-[.12em] text-[var(--text-muted)]">Runtime</div><div className="mt-2 text-sm text-white">{formatDuration(total)}</div></div></div>
          <div className="flex gap-1.5">{["Studio master", "Warm vinyl", "Broadcast clean"].map((preset) => <button key={preset} onClick={() => setSettings({ ...settings, stylePreset: preset })} className={`h-8 flex-1 rounded-lg text-[10px] ${settings.stylePreset === preset ? "bg-[rgba(239,99,152,.14)] text-white ring-1 ring-inset ring-[var(--border-active)]" : "bg-white/[.035] text-[var(--text-muted)]"}`}>{preset}</button>)}</div>
        </div>
        <Reorder.Group axis="y" values={ordered} onReorder={setOrdered} className="grid min-h-0 content-start gap-2 overflow-hidden">
          {ordered.slice(0, 10).map((track, index) => (
            <Reorder.Item value={track} layout key={`${track.title}-${index}`} whileDrag={{ scale: 1.015, backgroundColor: "rgba(239,99,152,.09)" }} className="grid h-12 cursor-grab grid-cols-[18px_30px_minmax(0,1fr)_70px] items-center gap-2 rounded-lg bg-white/[.025] px-3 ring-1 ring-inset ring-[var(--border)] active:cursor-grabbing">
              <GripVertical className="h-3.5 w-3.5 text-[var(--text-muted)]" /><span className="tabular text-xs text-[var(--text-muted)]">{String(index + 1).padStart(2, "0")}</span><div className="truncate text-sm text-white">{track.title}</div><div className="flex justify-end gap-1"><button onPointerDown={(event) => event.stopPropagation()} onClick={() => move(index, -1)} title="Move up" aria-label={`Move ${track.title} up`} className="grid h-7 w-7 place-items-center rounded-md hover:bg-white/[.07]"><ArrowUp className="h-3.5 w-3.5" /></button><button onPointerDown={(event) => event.stopPropagation()} onClick={() => move(index, 1)} title="Move down" aria-label={`Move ${track.title} down`} className="grid h-7 w-7 place-items-center rounded-md hover:bg-white/[.07]"><ArrowDown className="h-3.5 w-3.5" /></button></div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
        <div className="grid grid-cols-[1fr_auto] items-end gap-3"><label className="text-[10px] uppercase tracking-[.12em] text-[var(--text-muted)]">Schedule publish<input type="datetime-local" value={settings.scheduledPublishAt?.slice(0, 16) ?? ""} onChange={(event) => setSettings({ ...settings, scheduledPublishAt: event.target.value ? new Date(event.target.value).toISOString() : undefined })} className="mt-1.5 h-10 w-full rounded-lg bg-black/20 px-3 text-xs normal-case text-white ring-1 ring-inset ring-[var(--border)]" /></label><button onClick={() => onSave(ordered, settings)} className="h-10 rounded-lg bg-[linear-gradient(135deg,var(--blue),var(--violet),var(--rose))] px-5 text-sm font-medium">Save timeline</button></div>
      </div>
    </Drawer>
  );
}

function CompactNumber({ label, value, min, max, step, suffix, onChange }: { label: string; value: number; min: number; max: number; step: number; suffix: string; onChange: (value: number) => void }) {
  return <label className="text-[9px] uppercase tracking-[.12em] text-[var(--text-muted)]">{label}<div className="mt-1 flex items-center gap-1"><input type="number" value={value} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value))} className="h-8 min-w-0 w-full rounded-lg bg-white/[.04] px-2 text-xs normal-case text-white" /><span className="text-[9px] normal-case">{suffix}</span></div></label>;
}

export function GenerationDrawer({ open, onClose, jobs, services, estimatedCost, onRefresh }: { open: boolean; onClose: () => void; jobs: StudioJob[]; services: Array<{ label: string; ready: boolean }>; estimatedCost: number | null; onRefresh: () => Promise<void> }) {
  async function act(jobId: string, action: "retry" | "cancel") { const response = await fetch("/api/jobs", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobId, action }) }); emitToast(response.ok ? `Job ${action === "retry" ? "queued again" : "cancelled"}.` : "Job could not be updated.", response.ok ? "success" : "error"); await onRefresh(); }
  return (
    <Drawer open={open} onClose={onClose} title="Generation center" icon={<Activity className="h-4 w-4" />}>
      <div className="grid h-full grid-rows-[auto_auto_minmax(0,1fr)] gap-4 pt-4">
        <div className="grid grid-cols-3 gap-2">{services.map((service) => <div key={service.label} className="rounded-lg bg-white/[.025] p-3 ring-1 ring-inset ring-[var(--border)]"><div className="text-[10px] uppercase tracking-[.1em] text-[var(--text-muted)]">{service.label}</div><div className={`mt-2 text-xs ${service.ready ? "text-[var(--success)]" : "text-[var(--warning)]"}`}>{service.ready ? "Ready" : "Needs setup"}</div></div>)}</div>
        <div className="flex items-center justify-between rounded-lg bg-black/20 px-4 py-3 ring-1 ring-inset ring-[var(--border)]"><div><div className="text-[10px] uppercase tracking-[.12em] text-[var(--text-muted)]">Next generation estimate</div><div className="mt-1 text-sm text-white">{estimatedCost === null ? "Set rates in Settings" : `$${estimatedCost.toFixed(2)} estimated`}</div></div><Clock3 className="h-4 w-4 text-[var(--rose-soft)]" /></div>
        <div className="grid min-h-0 content-start gap-2 overflow-hidden">
          {(jobs.length ? jobs : [{ id: "empty", type: "queue", status: "idle", message: "No generation jobs yet." }]).slice(0, 7).map((job) => <div key={job.id} className="rounded-lg bg-white/[.025] p-3 ring-1 ring-inset ring-[var(--border)]"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2 text-sm font-medium capitalize text-white">{job.status === "running" ? <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--cyan)]" /> : <FileAudio className="h-3.5 w-3.5 text-[var(--rose-soft)]" />}{job.type}</div><StatusPill status={job.status} /></div><p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">{job.message}</p>{job.id !== "empty" && (["failed", "blocked", "queued"].includes(job.status)) ? <div className="mt-2 flex gap-2">{["failed", "blocked"].includes(job.status) ? <button onClick={() => act(job.id, "retry")} className="flex h-8 items-center gap-1.5 rounded-lg bg-white/[.05] px-3 text-xs"><RotateCcw className="h-3 w-3" />Retry</button> : null}{job.status === "queued" ? <button onClick={() => act(job.id, "cancel")} className="h-8 rounded-lg bg-white/[.05] px-3 text-xs text-[var(--danger)]">Cancel</button> : null}</div> : null}</div>)}
        </div>
      </div>
    </Drawer>
  );
}

export function ReferenceUploader({ projectId, onUploaded }: { projectId: string; onUploaded: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  async function upload(file?: File) { if (!file) return; setBusy(true); const form = new FormData(); form.set("projectId", projectId); form.set("file", file); const response = await fetch("/api/assets", { method: "POST", body: form }); const data = await response.json(); setBusy(false); emitToast(response.ok ? `${file.name} added as a reference.` : data.error ?? "Reference upload failed.", response.ok ? "success" : "error"); if (response.ok) await onUploaded(); }
  return <label title="Import reference audio or artwork" className="flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg bg-white/[.04] px-3 text-xs text-[var(--text-secondary)] hover:bg-white/[.07] hover:text-white">{busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}Reference<input type="file" accept="audio/*,image/*" className="hidden" onChange={(event) => upload(event.target.files?.[0])} /></label>;
}
