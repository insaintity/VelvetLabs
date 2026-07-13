"use client";

import {
  Check,
  ChevronDown,
  Circle,
  Cloud,
  Copy,
  Edit3,
  Heart,
  ListPlus,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Repeat2,
  Rewind,
  Settings2,
  Shuffle,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  Sparkles,
  Upload,
  Volume2
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { chapters, navItems, projectLinks, requiredRoutes, tracks, workflowSteps } from "@/lib/demo-data";
import { formatDuration } from "@/lib/time";
import { usePlayerStore } from "@/store/player-store";

const demoProjectId = "demo-masquerade";

export function VelvetApp() {
  const pathname = usePathname();
  const isNewProject = pathname === "/projects/new";
  const pageTitle = getPageTitle(pathname);

  return (
    <main className="relative z-10 h-screen min-w-[1180px] overflow-hidden p-5 text-[15px]">
      <div className="grid h-[calc(100vh-104px)] grid-cols-[240px_1fr] gap-5">
        <Sidebar pathname={pathname} />
        <section className="panel flex min-h-0 flex-col overflow-hidden rounded-[22px]">
          <TopBar pageTitle={pageTitle} />
          {isNewProject ? <NewProjectFlow /> : <AlbumWorkspace pathname={pathname} />}
        </section>
      </div>
      <BottomPlayer />
    </main>
  );
}

function Sidebar({ pathname }: { pathname: string }) {
  return (
    <aside className="panel flex min-h-0 flex-col rounded-[22px] px-4 py-6">
      <div className="px-3">
        <Link href="/dashboard" className="block">
          <div className="font-serif text-[38px] leading-none tracking-wide text-[#f4edf4]">Velvet Coda</div>
          <div className="mt-2 text-sm font-medium tracking-[0.18em] text-[var(--rose-soft)]">AI ALBUM FOUNDRY</div>
        </Link>
      </div>
      <nav className="velvet-scroll mt-8 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex h-11 items-center gap-3 rounded-lg border px-4 text-sm transition ${
                isActive
                  ? "border-[var(--border-active)] bg-[rgba(239,99,152,0.13)] text-white shadow-[inset_0_0_18px_rgba(239,99,152,0.12)]"
                  : "border-transparent text-[var(--text-secondary)] hover:border-[var(--border-hover)] hover:bg-white/[0.035] hover:text-white"
              }`}
            >
              <Icon className={`h-[18px] w-[18px] ${isActive ? "text-[var(--rose-soft)]" : "text-[#a9a3bd]"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-5 space-y-3">
        <div className="rounded-xl border border-[var(--border)] bg-white/[0.035] p-3">
          <div className="mb-3 text-[11px] font-semibold tracking-[0.18em] text-[var(--text-muted)]">SERVICE STATUS</div>
          {["OpenAI", "ElevenLabs", "YouTube"].map((service) => (
            <div key={service} className="mb-2 flex items-center justify-between text-xs text-[var(--text-secondary)] last:mb-0">
              <span>{service}</span>
              <span className="rounded-full border border-[rgba(88,182,168,0.25)] bg-[rgba(88,182,168,0.08)] px-2 py-0.5 text-[var(--success)]">
                Demo
              </span>
            </div>
          ))}
        </div>
        <Link
          href="/settings"
          className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-[var(--text-secondary)] hover:bg-white/[0.04] hover:text-white"
        >
          <Settings2 className="h-[17px] w-[17px]" />
          Settings
        </Link>
        <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-white/[0.035] p-3">
          <div className="h-10 w-10 rounded-full border border-[rgba(239,99,152,0.38)] bg-[radial-gradient(circle_at_35%_35%,#ef6398,#4a2343_58%,#111426)]" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">Luna Noir</div>
            <div className="text-xs text-[var(--text-muted)]">Creator</div>
          </div>
          <ChevronDown className="h-4 w-4 text-[var(--text-secondary)]" />
        </div>
      </div>
    </aside>
  );
}

function TopBar({ pageTitle }: { pageTitle: string }) {
  return (
    <header className="flex h-[62px] shrink-0 items-center justify-between border-b border-[var(--border)] bg-black/10 px-6">
      <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
        <Link href="/projects" className="hover:text-white">
          Projects
        </Link>
        <span>/</span>
        <span className="text-[var(--text-primary)]">{pageTitle}</span>
      </div>
      <div className="flex items-center gap-3">
        <button className="flex h-9 items-center gap-2 rounded-lg border border-[var(--border)] bg-white/[0.05] px-4 text-sm text-[var(--text-primary)]">
          <Cloud className="h-4 w-4" />
          Save
        </button>
        <button aria-label="More project actions" className="grid h-9 w-10 place-items-center rounded-lg border border-[var(--border)] bg-white/[0.05]">
          <MoreHorizontal className="h-5 w-5" />
        </button>
        <Link
          href="/projects/new"
          className="flex h-9 items-center gap-2 rounded-lg bg-[linear-gradient(135deg,var(--blue),var(--violet),var(--rose))] px-4 text-sm font-medium shadow-[0_10px_35px_rgba(239,99,152,0.26)]"
        >
          <Plus className="h-4 w-4" />
          New Project
        </Link>
      </div>
    </header>
  );
}

function AlbumWorkspace({ pathname }: { pathname: string }) {
  const selectedTrackId = usePlayerStore((state) => state.currentTrackId);
  const selectedTrack = tracks.find((track) => track.id === selectedTrackId) ?? tracks[0];

  return (
    <div className="velvet-scroll grid min-h-0 flex-1 grid-cols-[390px_minmax(390px,1fr)_390px] gap-5 overflow-y-auto p-5">
      <section className="space-y-4">
        <AlbumCard />
        <PromptCard />
      </section>
      <section className="space-y-4">
        <TrackList selectedTrackId={selectedTrack.id} />
        <TrackDetail track={selectedTrack} pathname={pathname} />
      </section>
      <section className="space-y-4">
        <Pipeline />
        <Chapters />
        <ExportPreset />
        <RoutePanel pathname={pathname} />
      </section>
    </div>
  );
}

function AlbumCard() {
  return (
    <article className="panel rounded-xl p-4">
      <div
        className="h-[340px] rounded-xl border border-[var(--border-active)] bg-cover bg-no-repeat shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03),0_22px_70px_rgba(0,0,0,0.35)]"
        style={{
          backgroundImage: "url('/velvet-reference.png')",
          backgroundSize: "1180px 675px",
          backgroundPosition: "-222px -62px"
        }}
        aria-label="Velvet Masquerade album artwork"
      />
      <div className="mt-4 flex items-start justify-between">
        <div>
          <h1 className="font-serif text-[30px] leading-8">Velvet Masquerade</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">AI Jazz YouTube Album</p>
        </div>
        <button aria-label="Edit album title" className="text-[var(--text-secondary)] hover:text-white">
          <Edit3 className="h-5 w-5" />
        </button>
      </div>
      <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
        A dark royal jazz album set during a masked midnight ball, slow tenor saxophone, intimate piano and brushed drums.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {["Dark Jazz", "Royal", "Saxophone-led", "Midnight", "Cinematic"].map((tag) => (
          <span key={tag} className="rounded-md border border-[var(--border)] bg-white/[0.05] px-3 py-1 text-xs text-[var(--text-primary)]">
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-4 rounded-xl border border-[var(--border)] bg-white/[0.035] py-3 text-center">
        {[
          ["10", "Tracks"],
          ["38:42", "Total Length"],
          ["Bb", "Key"],
          ["Assisted", "Mode"]
        ].map(([value, label], index) => (
          <div key={label} className={index ? "border-l border-[var(--border)]" : ""}>
            <div className="tabular text-base text-white">{value}</div>
            <div className="mt-1 text-[11px] text-[var(--text-muted)]">{label}</div>
          </div>
        ))}
      </div>
    </article>
  );
}

function PromptCard() {
  return (
    <article className="panel rounded-xl p-4">
      <SectionTitle label="Prompt" detail="Current Track" action={<Edit3 className="h-4 w-4" />} />
      <p className="mt-3 text-sm leading-5 text-[var(--text-secondary)]">
        Moody, royal jazz ballad with a smooth saxophone lead, intimate piano chords, warm upright bass, soft brush drums. Late-night masquerade vibe, velvet curtains, candlelight, noir...
      </p>
      <div className="mt-3 flex items-center justify-between text-xs">
        <button className="text-[var(--rose-soft)]">More</button>
        <span className="tabular text-[var(--text-muted)]">212 / 500</span>
      </div>
    </article>
  );
}

function TrackList({ selectedTrackId }: { selectedTrackId: string }) {
  const setTrack = usePlayerStore((state) => state.setTrack);
  return (
    <article className="panel rounded-xl p-4">
      <SectionTitle label="Tracks" detail="" action={<span className="flex items-center gap-1 text-xs text-[var(--text-muted)]"><ListPlus className="h-4 w-4" /> Reorder</span>} />
      <div className="mt-3 space-y-1">
        {tracks.map((track) => {
          const selected = track.id === selectedTrackId;
          return (
            <button
              key={track.id}
              onClick={() => setTrack(track.id)}
              className={`grid h-11 w-full grid-cols-[32px_1fr_50px_44px] items-center gap-3 rounded-lg border px-2 text-left transition ${
                selected
                  ? "border-[var(--border-active)] bg-[rgba(239,99,152,0.14)] shadow-[inset_0_0_22px_rgba(239,99,152,0.1)]"
                  : "border-transparent hover:border-[var(--border-hover)] hover:bg-white/[0.035]"
              }`}
            >
              <span className={`grid h-6 w-6 place-items-center rounded-md text-xs ${selected ? "bg-white/15" : "bg-white/[0.06] text-[var(--text-secondary)]"}`}>
                {selected ? <Play className="h-3.5 w-3.5 fill-current" /> : track.number}
              </span>
              <span className="truncate text-sm text-[var(--text-primary)]">{track.title}</span>
              <span className="tabular text-right text-sm text-[var(--text-muted)]">{track.duration}</span>
              <TrackStatusIcon status={track.status} />
            </button>
          );
        })}
      </div>
    </article>
  );
}

function TrackStatusIcon({ status }: { status: string }) {
  if (status === "approved") {
    return (
      <span className="ml-auto grid h-5 w-5 place-items-center rounded-full border border-[rgba(86,182,206,0.65)] text-[var(--cyan)]">
        <Check className="h-3 w-3" />
      </span>
    );
  }
  if (status === "generating") {
    return <span className="ml-auto h-5 w-5 rounded-full border border-[var(--rose-soft)] shadow-[0_0_18px_rgba(215,125,173,0.45)]" />;
  }
  return <span className="ml-auto h-5 w-5 rounded-full border border-[rgba(215,125,173,0.5)]" />;
}

function TrackDetail({ track, pathname }: { track: (typeof tracks)[number]; pathname: string }) {
  return (
    <article className="panel rounded-xl p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--rose-soft)]">Selected Track</div>
          <h2 className="mt-1 font-serif text-[28px] leading-8">{track.title}</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{track.purpose}</p>
        </div>
        <div className="flex gap-1">
          {track.candidates.map((candidate) => (
            <span key={candidate} className="grid h-7 w-7 place-items-center rounded-md border border-[var(--border)] bg-white/[0.04] text-xs">
              {candidate}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-[var(--border)] bg-black/15 p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">ElevenLabs prompt</span>
          <button className="text-[var(--text-secondary)] hover:text-white">
            <Copy className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm leading-6 text-[var(--text-secondary)]">{track.prompt}</p>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2">
        {["Edit Prompt", "Improve", "Switch It Up", "Generate"].map((action, index) => (
          <button
            key={action}
            className={`h-10 rounded-lg border px-3 text-xs font-medium ${
              index === 3
                ? "border-transparent bg-[linear-gradient(135deg,var(--blue),var(--violet),var(--rose))]"
                : "border-[var(--border)] bg-white/[0.04] text-[var(--text-secondary)] hover:text-white"
            }`}
          >
            {action}
          </button>
        ))}
      </div>
      {pathname !== "/dashboard" && (
        <div className="mt-4 rounded-xl border border-[rgba(239,99,152,0.22)] bg-[rgba(239,99,152,0.07)] p-3 text-sm text-[var(--text-secondary)]">
          Demo mode - no provider request was made. This route is wired for Phase 1 and ready for the next integration layer.
        </div>
      )}
    </article>
  );
}

function Pipeline() {
  return (
    <article className="panel rounded-xl p-4">
      <SectionTitle label="Generation Status" detail="" />
      <div className="mt-4 space-y-5">
        {workflowSteps.map((step, index) => (
          <div key={step.label} className="relative grid grid-cols-[30px_1fr_58px] gap-3">
            {index < workflowSteps.length - 1 && <span className="absolute left-[13px] top-7 h-11 w-px bg-[linear-gradient(var(--rose),var(--violet))]" />}
            <span
              className={`relative z-10 grid h-7 w-7 place-items-center rounded-full ${
                step.done
                  ? "bg-[var(--rose)] text-white"
                  : "border border-[var(--violet)] bg-[rgba(118,92,232,0.28)] shadow-[0_0_24px_rgba(118,92,232,0.62)]"
              }`}
            >
              {step.done ? <Check className="h-4 w-4" /> : <Circle className="h-3 w-3 fill-current" />}
            </span>
            <div>
              <div className="text-sm font-medium">{step.label}</div>
              <div className="mt-0.5 text-xs text-[var(--text-muted)]">{step.detail}</div>
            </div>
            <div className="tabular text-right text-xs text-[var(--text-muted)]">{step.time}</div>
          </div>
        ))}
      </div>
    </article>
  );
}

function Chapters() {
  return (
    <article className="panel rounded-xl p-4">
      <SectionTitle label="YouTube Chapters" detail="Total Length 38:42" />
      <div className="mt-5">
        <div className="flex h-8 overflow-hidden rounded-md border border-[var(--border)] bg-white/[0.04]">
          {chapters.map((chapter, index) => (
            <div
              key={chapter.time}
              className="h-full"
              style={{
                width: `${index === chapters.length - 1 ? 10 : 22 + index * 4}%`,
                background: `linear-gradient(90deg, ${chapter.color}44, ${chapter.color})`
              }}
            />
          ))}
        </div>
        <div className="mt-3 grid grid-cols-5 gap-2">
          {chapters.map((chapter) => (
            <div key={chapter.time}>
              <div className="tabular text-[11px] text-white">{chapter.time}</div>
              <div className="truncate text-[10px] text-[var(--text-muted)]">{chapter.label}</div>
            </div>
          ))}
        </div>
        <button className="ml-auto mt-4 flex h-8 items-center gap-2 rounded-lg border border-[rgba(74,110,232,0.45)] bg-[rgba(74,110,232,0.11)] px-3 text-xs">
          <Edit3 className="h-3.5 w-3.5" />
          Edit Chapters
        </button>
      </div>
    </article>
  );
}

function ExportPreset() {
  return (
    <article className="panel rounded-xl p-4">
      <SectionTitle label="Export Preset" detail="" />
      <div className="mt-4 rounded-lg border border-[rgba(239,99,152,0.24)] bg-[rgba(239,99,152,0.07)] p-3">
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-red-600">
            <Play className="h-4 w-4 fill-white" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium">YouTube (1080p)</div>
            <div className="text-xs text-[var(--text-muted)]">MP4 · H.264 · 1920x1080</div>
          </div>
          <button className="h-8 rounded-lg border border-[rgba(74,110,232,0.45)] px-3 text-xs">Change</button>
        </div>
      </div>
      <button className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[linear-gradient(135deg,var(--blue),var(--violet),var(--rose))] font-medium shadow-[0_16px_36px_rgba(239,99,152,0.22)]">
        <Upload className="h-5 w-5" />
        Export Album
      </button>
    </article>
  );
}

function RoutePanel({ pathname }: { pathname: string }) {
  return (
    <article className="panel rounded-xl p-4">
      <SectionTitle label="Workspace" detail="Phase 1 routes" />
      <div className="mt-3 grid grid-cols-2 gap-2">
        {projectLinks.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href;
          return (
            <Link key={link.href} href={link.href} className={`rounded-lg border p-3 text-xs ${active ? "border-[var(--border-active)] bg-[rgba(239,99,152,0.1)]" : "border-[var(--border)] bg-white/[0.035]"}`}>
              <Icon className="mb-2 h-4 w-4 text-[var(--rose-soft)]" />
              {link.label}
            </Link>
          );
        })}
      </div>
    </article>
  );
}

function NewProjectFlow() {
  return (
    <div className="velvet-scroll min-h-0 flex-1 overflow-y-auto p-5">
      <div className="mx-auto grid max-w-[1180px] grid-cols-[1.1fr_0.9fr] gap-5">
        <section className="panel rounded-xl p-5">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--rose-soft)]">Step 1</div>
          <h1 className="mt-2 font-serif text-[42px] leading-none">Album Brief</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
            Describe the album in ordinary language. Velvet Coda will plan the complete release before any expensive provider request begins.
          </p>
          <textarea
            className="mt-5 min-h-[230px] w-full resize-none rounded-xl border border-[var(--border)] bg-black/20 p-4 text-sm leading-6 text-white outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--border-active)]"
            defaultValue="A dark royal jazz album set during a masked midnight ball. Slow tenor saxophone, intimate piano, brushed drums and upright bass. Luxurious, romantic and slightly threatening. Instrumental only."
            aria-label="Album brief"
          />
          <div className="mt-4 flex flex-wrap gap-2">
            {["Royal Masquerade", "Rain-Soaked Noir", "Haunted Ballroom", "Velvet Lounge", "Midnight Hotel", "Gothic Romance", "Private Detective", "Candlelit Theatre"].map((preset) => (
              <button key={preset} className="rounded-lg border border-[var(--border)] bg-white/[0.04] px-3 py-2 text-xs text-[var(--text-secondary)] hover:border-[var(--border-hover)] hover:text-white">
                {preset}
              </button>
            ))}
          </div>
        </section>
        <aside className="space-y-4">
          <WizardPanel title="Basic Preferences" items={["Total album length: 38-45 minutes", "Approximate track count: 10", "Instrumental", "Lead instrument: Tenor saxophone", "Cohesion: Balanced", "Candidates per track: 2"]} />
          <WizardPanel title="Workflow Mode" items={["Assisted mode", "Pause at blueprint approval", "Pause at track approval", "Upload privately by default"]} />
          <article className="panel rounded-xl p-4">
            <SectionTitle label="Review" detail="Demo mode" />
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
              No real OpenAI, ElevenLabs, image, render or YouTube request will run until credentials and Phase 2+ workers are configured.
            </p>
            <button className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[linear-gradient(135deg,var(--blue),var(--violet),var(--rose))] font-medium">
              <Sparkles className="h-5 w-5" />
              Create Album Blueprint
            </button>
          </article>
        </aside>
      </div>
    </div>
  );
}

function WizardPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <article className="panel rounded-xl p-4">
      <SectionTitle label={title} detail="Let Velvet Coda decide available" />
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div key={item} className="rounded-lg border border-[var(--border)] bg-white/[0.035] px-3 py-2 text-sm text-[var(--text-secondary)]">
            {item}
          </div>
        ))}
      </div>
    </article>
  );
}

function BottomPlayer() {
  const { currentTrackId, isPlaying, positionSeconds, volume, togglePlaying, next, previous, setVolume } = usePlayerStore();
  const currentTrack = tracks.find((track) => track.id === currentTrackId) ?? tracks[0];
  return (
    <footer className="panel mt-4 grid h-20 grid-cols-[310px_1fr_260px] items-center gap-6 rounded-xl px-5">
      <div className="flex items-center gap-4">
        <div
          className="h-14 w-14 shrink-0 rounded-lg border border-[var(--border-active)] bg-cover bg-no-repeat"
          style={{
            backgroundImage: "url('/velvet-reference.png')",
            backgroundSize: "230px 132px",
            backgroundPosition: "-43px -12px"
          }}
        />
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{currentTrack.title}</div>
          <div className="mt-1 truncate text-xs text-[var(--text-muted)]">Velvet Masquerade</div>
        </div>
        <button aria-label="Favourite track" className="ml-auto text-[var(--rose-soft)]">
          <Heart className="h-5 w-5" />
        </button>
      </div>
      <div className="grid grid-cols-[280px_1fr_105px] items-center gap-5">
        <div className="flex items-center justify-center gap-5 text-[var(--text-secondary)]">
          <Shuffle className="h-4 w-4" />
          <button aria-label="Previous track" onClick={previous}>
            <SkipBack className="h-5 w-5 fill-current" />
          </button>
          <motion.button
            whileTap={{ scale: 0.94 }}
            aria-label={isPlaying ? "Pause" : "Play"}
            onClick={togglePlaying}
            className="grid h-12 w-12 place-items-center rounded-full bg-[linear-gradient(135deg,var(--rose-soft),var(--violet))] text-white shadow-[0_0_32px_rgba(215,125,173,0.4)]"
          >
            {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="ml-0.5 h-5 w-5 fill-current" />}
          </motion.button>
          <button aria-label="Next track" onClick={next}>
            <SkipForward className="h-5 w-5 fill-current" />
          </button>
          <Repeat2 className="h-4 w-4" />
        </div>
        <div className="flex items-center gap-4">
          <Waveform />
          <div className="tabular w-[92px] text-sm text-[var(--text-secondary)]">
            {formatDuration(positionSeconds)} / {currentTrack.duration}
          </div>
        </div>
        <div className="flex items-center gap-3 text-[var(--text-secondary)]">
          <Rewind className="h-4 w-4" />
          <Volume2 className="h-5 w-5" />
          <input
            aria-label="Volume"
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(event) => setVolume(Number(event.target.value))}
            className="h-1 w-24 accent-[var(--rose-soft)]"
          />
          <SlidersHorizontal className="h-5 w-5" />
        </div>
      </div>
    </footer>
  );
}

function Waveform() {
  const bars = [12, 18, 26, 34, 22, 30, 43, 21, 38, 48, 28, 36, 18, 24, 42, 50, 33, 22, 45, 29, 34, 48, 25, 17, 38, 41, 29, 47, 31, 26, 36, 44, 52, 27, 22, 35, 31, 42, 28, 18];
  return (
    <div className="flex h-12 min-w-[220px] flex-1 items-center gap-1">
      {bars.map((bar, index) => (
        <span
          key={`${bar}-${index}`}
          className="w-0.5 rounded-full bg-[linear-gradient(var(--blue),var(--violet),var(--rose))]"
          style={{ height: `${bar}px`, opacity: index < 24 ? 0.95 : 0.48 }}
        />
      ))}
    </div>
  );
}

function SectionTitle({ label, detail, action }: { label: string; detail?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[var(--rose-soft)]" />
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)]">{label}</h2>
        {detail ? <span className="text-xs text-[var(--text-muted)]">{detail}</span> : null}
      </div>
      {action ? <button className="text-[var(--text-secondary)] hover:text-white">{action}</button> : null}
    </div>
  );
}

function getPageTitle(pathname: string) {
  if (pathname === "/projects/new") {
    return "New Album Blueprint";
  }
  if (pathname.startsWith(`/projects/${demoProjectId}/`)) {
    const suffix = pathname.split("/").at(-1);
    return `Velvet Masquerade / ${titleCase(suffix ?? "Workspace")}`;
  }
  const known = requiredRoutes.find((route) => route === pathname);
  if (known && known !== "/dashboard") {
    return titleCase(known.split("/").filter(Boolean).join(" / "));
  }
  return "Velvet Masquerade";
}

function titleCase(value: string) {
  return value
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
