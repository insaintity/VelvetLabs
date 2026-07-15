"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import { ProjectArtwork } from "@/components/studio-chrome";
import { cachedJson, peekCachedJson } from "@/components/data-cache";
import { historyColumns, historyPromptTypes } from "@/lib/app-data";

type Upload = { id: string; url?: string; projectId: string; projectTitle?: string; privacy?: string; createdAt: string; prompts?: unknown[]; status?: string };
type Prompt = { id: string; kind: string; version: number };
type Job = { id: string; type: string; message: string };

export function HistoryWorkspace() {
  const cachedUploads = peekCachedJson<{ uploads: Upload[] }>("/api/uploads");
  const [uploads, setUploads] = useState<Upload[] | null>(cachedUploads?.uploads ?? null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    const load = () => Promise.all([
      cachedJson<{ uploads: Upload[] }>("/api/uploads", true),
      cachedJson<{ prompts: Prompt[] }>("/api/prompts", true),
      cachedJson<{ jobs: Job[] }>("/api/jobs", true)
    ]).then(([uploadData, promptData, jobData]) => {
      setUploads(uploadData.uploads ?? []);
      setPrompts(promptData.prompts ?? []);
      setJobs(jobData.jobs ?? []);
    }).catch(() => setUploads((current) => current ?? []));
    load();
    window.addEventListener("velvet:studio-update", load);
    return () => window.removeEventListener("velvet:studio-update", load);
  }, []);

  return (
    <div className="min-h-0 flex-1 overflow-hidden p-3 lg:p-5">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-5">
        <section className="panel rounded-xl p-5">
          <Label>Upload History</Label>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">Every upload keeps its exact prompts, render choices, privacy, YouTube link, and result.</p>
          <div className="mt-5 overflow-hidden rounded-xl border border-[var(--border)] bg-black/15">
            <div className="grid grid-cols-[1.1fr_1fr_0.7fr_0.8fr_0.7fr_0.7fr] border-b border-[var(--border)] bg-white/[0.035] px-4 py-3 text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">{historyColumns.map((column) => <div key={column}>{column}</div>)}</div>
            {uploads === null ? <div className="studio-skeleton m-5 h-52 rounded-lg" /> : uploads.length ? uploads.slice(0, 7).map((upload) => (
              <div key={upload.id} className="grid grid-cols-[1.1fr_1fr_0.7fr_0.8fr_0.7fr_0.7fr] items-center border-b border-[var(--border)] px-4 py-3 text-xs text-[var(--text-secondary)] last:border-b-0">
                <a href={upload.url} className="truncate text-[var(--rose-soft)]" target="_blank" rel="noreferrer">{upload.url ? "YouTube video" : upload.id.slice(0, 8)}</a>
                <Link href={`/projects/${upload.projectId}`} className="truncate text-white">{upload.projectTitle ?? upload.projectId}</Link><div className="capitalize">{upload.privacy}</div><div>{new Date(upload.createdAt).toLocaleDateString()}</div><div>{upload.prompts?.length ?? 0}</div><div className="capitalize">{upload.status}</div>
              </div>
            )) : <div className="flex min-h-[250px] flex-col items-center justify-center px-6 py-8 text-center"><div className="w-20"><ProjectArtwork title="Velvet archive" compact /></div><h1 className="mt-4 text-[28px] font-semibold">No uploads yet</h1><p className="mt-2 text-sm text-[var(--text-secondary)]">Completed YouTube releases and their prompt records will appear here.</p><Link href="/projects/new" className="mt-5 flex h-10 items-center gap-2 rounded-lg border border-[var(--border)] bg-white/[0.05] px-4 text-sm">Create first release<ArrowRight className="h-4 w-4" /></Link></div>}
          </div>
        </section>
        <aside className="hidden space-y-4 xl:block">
          <section className="panel rounded-xl p-5"><Label>Prompt Archive</Label><div className="mt-4 space-y-2">{(prompts.length ? prompts.slice(0, 7).map((prompt) => `${prompt.kind} v${prompt.version}`) : historyPromptTypes).map((item) => <div key={item} className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-white/[0.035] p-3 text-sm text-[var(--text-secondary)]"><FileText className="h-4 w-4 text-[var(--rose-soft)]" />{item}</div>)}</div></section>
          <section className="panel rounded-xl p-5"><Label>Recent Work</Label><div className="mt-4 space-y-2">{jobs.slice(0, 6).map((job) => <div key={job.id} className="rounded-lg border border-[var(--border)] bg-white/[0.035] p-3 text-xs text-[var(--text-secondary)]"><span className="capitalize text-white">{job.type}</span>: {job.message}</div>)}</div></section>
        </aside>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <h1 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.13em]"><span className="h-1.5 w-1.5 rounded-full bg-[var(--rose-soft)]" />{children}</h1>;
}
