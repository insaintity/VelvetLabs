"use client";

import { useRef, useState } from "react";
import { Activity, Check, Download, RefreshCw, RotateCcw, Upload } from "lucide-react";
import Link from "next/link";
import { emitToast } from "@/components/toast-system";

type HealthCheck = { state?: string; message?: string };
type HealthData = { checkedAt?: string; checks?: Record<string, HealthCheck>; backups?: Array<{ filename: string; createdAt?: string }> };

export function StudioHealth() {
  const [data, setData] = useState<HealthData>({});
  const [busy, setBusy] = useState(false);
  const restoreInput = useRef<HTMLInputElement>(null);

  async function check() {
    setBusy(true);
    try {
      const response = await fetch("/api/health/studio", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Studio health is unavailable.");
      setData(body);
    } catch (error) {
      emitToast(error instanceof Error ? error.message : "Studio health is unavailable.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function restore(file?: File) {
    if (!file) return;
    setBusy(true);
    const form = new FormData();
    form.set("backup", file);
    try {
      const response = await fetch("/api/backups", { method: "POST", body: form });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Backup could not be restored.");
      emitToast(`Backup restored: ${body.counts.projects} projects.`, "success");
      window.dispatchEvent(new Event("velvet:studio-update"));
      await check();
    } catch (error) {
      emitToast(error instanceof Error ? error.message : "Backup could not be restored.", "error");
    } finally {
      setBusy(false);
      if (restoreInput.current) restoreInput.current.value = "";
    }
  }

  const entries = Object.entries(data.checks ?? {});
  return (
    <section className="panel rounded-xl p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-[var(--rose-soft)]" /><h2 className="text-xs font-semibold uppercase tracking-[0.13em]">Studio Health</h2></div>
        <button onClick={check} disabled={busy} title="Check everything" aria-label="Check everything" className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-white disabled:opacity-40"><RefreshCw className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} /></button>
      </div>
      <div className="mt-3 grid gap-1.5">
        {!entries.length ? <button onClick={check} className="h-12 rounded-lg bg-white/[0.025] px-3 text-left text-[11px] text-[var(--text-muted)] ring-1 ring-inset ring-[var(--border)]">Run a full check for providers, quota, worker, FFmpeg, storage, and backups.</button> : null}
        {entries.map(([name, item]) => {
          const ready = item.state === "valid" || item.state === "connected";
          return <div key={name} title={item.message} className="flex h-8 items-center gap-2 rounded-lg bg-white/[0.025] px-2.5 text-[11px] ring-1 ring-inset ring-[var(--border)]"><span className={`grid h-4 w-4 place-items-center rounded-full ${ready ? "bg-[rgba(88,182,168,.13)] text-[var(--success)]" : "bg-white/[.04] text-[var(--text-muted)]"}`}>{ready ? <Check className="h-3 w-3" /> : null}</span><span className="min-w-0 flex-1 truncate capitalize">{name}</span><span className="max-w-[150px] truncate text-[var(--text-muted)]">{item.message}</span></div>;
        })}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link href="/api/backups" download className="flex h-9 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-white/[.035] text-xs text-[var(--text-secondary)] hover:text-white"><Download className="h-3.5 w-3.5" />Export backup</Link>
        <button onClick={() => restoreInput.current?.click()} disabled={busy} className="flex h-9 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-white/[.035] text-xs text-[var(--text-secondary)] hover:text-white disabled:opacity-40"><RotateCcw className="h-3.5 w-3.5" />Restore backup</button>
        <input ref={restoreInput} type="file" accept=".enc,application/octet-stream" className="hidden" aria-label="Restore Velvet backup" onChange={(event) => restore(event.target.files?.[0])} />
      </div>
      <div className="mt-2 flex items-center gap-2 text-[10px] text-[var(--text-muted)]"><Upload className="h-3 w-3" />Rolling encrypted backups are retained automatically.</div>
    </section>
  );
}
