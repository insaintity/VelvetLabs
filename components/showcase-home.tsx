import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BarChart3, CalendarClock, Clapperboard, ImageIcon, KeyRound, Layers3, Music2, Sparkles, UploadCloud } from "lucide-react";

const stats = [
  ["3", "creation lanes"],
  ["1", "private studio"],
  ["S", "timeline split"],
  ["24/7", "worker-ready"]
];

const features = [
  { title: "Prompt to release", body: "Create a single, an album, artwork direction and YouTube metadata from one guided brief.", icon: Sparkles },
  { title: "AI music pipeline", body: "OpenAI handles planning and metadata while ElevenLabs powers approved music generation.", icon: Music2 },
  { title: "Video timeline", body: "Combine artwork, audio and effects across separate visual, effect and audio lanes.", icon: Clapperboard },
  { title: "Thumbnail studio", body: "Generate release titles and thumbnail directions, then keep the winning creative attached to the project.", icon: ImageIcon },
  { title: "Publishing controls", body: "Schedule uploads, choose privacy, and keep YouTube as an optional final step.", icon: CalendarClock },
  { title: "Analytics history", body: "Track prior uploads, success rates, prompt versions, renders and project history.", icon: BarChart3 }
];

const workflow = [
  ["01", "Connect", "Add OpenAI and ElevenLabs once. YouTube can wait until publishing."],
  ["02", "Blueprint", "Describe the sound, mood, instruments and release type."],
  ["03", "Produce", "Review prompts, generate tracks, edit video, shape artwork and export."],
  ["04", "Publish", "Upload now, schedule later, or keep everything private."]
];

export function ShowcaseHome() {
  return (
    <main className="showcase-home h-dvh overflow-y-auto bg-[#090711] text-white">
      <section className="relative min-h-dvh overflow-hidden">
        <Image src="/brand/velvet-studio-hero.webp" alt="Dark high-end music studio" fill priority sizes="100vw" className="object-cover object-center opacity-[.56]" />
        <div className="showcase-grain pointer-events-none absolute inset-0" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,6,14,.94)_0%,rgba(16,12,25,.72)_44%,rgba(16,12,25,.34)_100%),linear-gradient(0deg,rgba(8,6,14,.96)_0%,rgba(8,6,14,.08)_52%,rgba(8,6,14,.7)_100%)]" />

        <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-5 py-5 lg:px-8">
          <nav className="flex h-14 items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/brand/velvet-mark.png" alt="" width={38} height={38} className="rounded-lg ring-1 ring-white/15" />
              <span>
                <span className="block font-serif text-3xl leading-none">velvet</span>
                <span className="block text-[10px] font-semibold uppercase tracking-[.22em] text-[#d9b8dc]">AI music foundry</span>
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <Link href="/login" className="hidden h-10 items-center rounded-lg border border-white/12 bg-white/[.04] px-4 text-sm text-[#cfc4d7] hover:bg-white/[.08] hover:text-white sm:flex">Log in</Link>
              <Link href="/projects/new" className="flex h-10 items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#8e80b7,#d58fbd)] px-4 text-sm font-medium text-white shadow-[0_16px_40px_rgba(213,143,189,.18)]">Enter studio <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </nav>

          <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_520px]">
            <div className="max-w-3xl">
              <div className="inline-flex h-8 items-center gap-2 rounded-full border border-[#d9b8dc]/25 bg-[#d9b8dc]/10 px-3 text-xs font-medium text-[#ead3ee]">
                <Sparkles className="h-3.5 w-3.5" />
                Private AI music creation studio
              </div>
              <h1 className="mt-7 max-w-4xl font-serif text-6xl leading-[.92] tracking-[-.01em] text-white md:text-7xl lg:text-8xl">
                Create AI music releases from first idea to final upload.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-[#d8cfdf] md:text-lg">
                Velvet turns prompts into project blueprints, generated tracks, artwork direction, video timelines, thumbnails, scheduled uploads and performance history inside one quiet studio-grade workspace.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/projects/new" className="flex h-12 items-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-[#14101d] hover:bg-[#f1e9f5]">
                  Start creating <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/login" className="flex h-12 items-center gap-2 rounded-lg border border-white/14 bg-white/[.06] px-5 text-sm font-medium text-white hover:bg-white/[.1]">
                  Velvet account <KeyRound className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-10 grid max-w-2xl grid-cols-4 gap-2">
                {stats.map(([value, label]) => (
                  <div key={label} className="rounded-xl border border-white/10 bg-white/[.045] p-3 backdrop-blur-md">
                    <div className="font-serif text-3xl leading-none">{value}</div>
                    <div className="mt-2 text-[10px] uppercase tracking-[.14em] text-[#a99daf]">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            <StudioPreview />
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#100d19] px-5 py-14 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.title} className="group rounded-2xl border border-white/10 bg-white/[.035] p-5 transition hover:-translate-y-1 hover:border-[#d9b8dc]/30 hover:bg-white/[.055]">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#d9b8dc]/10 text-[#d9b8dc] ring-1 ring-[#d9b8dc]/20"><Icon className="h-5 w-5" /></div>
                <h2 className="mt-5 text-lg font-semibold">{feature.title}</h2>
                <p className="mt-3 text-sm leading-6 text-[#bdb1c8]">{feature.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="bg-[#090711] px-5 py-16 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[380px_minmax(0,1fr)]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#d9b8dc]">How it moves</p>
            <h2 className="mt-4 font-serif text-5xl leading-none">One studio flow. Fewer dead ends.</h2>
            <p className="mt-5 text-sm leading-7 text-[#bdb1c8]">OpenAI and ElevenLabs unlock creation. YouTube stays optional until you are ready to publish, so the first useful action is always faster.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            {workflow.map(([step, title, body]) => (
              <article key={step} className="rounded-2xl border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,.06),rgba(255,255,255,.025))] p-4">
                <div className="text-xs font-semibold text-[#d9b8dc]">{step}</div>
                <h3 className="mt-8 text-lg font-semibold">{title}</h3>
                <p className="mt-3 text-xs leading-6 text-[#bdb1c8]">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#100d19] px-5 py-16 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(217,184,220,.16),rgba(124,130,175,.08))] p-8 md:flex-row md:items-center">
          <div>
            <h2 className="font-serif text-4xl leading-none">Ready to make the first release?</h2>
            <p className="mt-3 text-sm text-[#cfc4d7]">Start with a song, an album, or bring your own media into the editor.</p>
          </div>
          <Link href="/projects/new" className="flex h-12 shrink-0 items-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-[#14101d] hover:bg-[#f1e9f5]">
            Open Velvet <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}

function StudioPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[520px]">
      <div className="absolute -inset-8 rounded-[2rem] bg-[radial-gradient(circle_at_50%_20%,rgba(217,184,220,.3),transparent_52%)] blur-2xl" />
      <div className="relative overflow-hidden rounded-3xl border border-white/14 bg-[#171321]/82 p-4 shadow-[0_32px_100px_rgba(0,0,0,.45)] backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[.16em] text-[#d9b8dc]">New Media</div>
            <div className="mt-1 text-sm text-white">Describe the song or album.</div>
          </div>
          <div className="rounded-full border border-[#8fc3b1]/20 bg-[#8fc3b1]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[.12em] text-[#aee0ca]">Ready</div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-white/10 bg-white/[.045] p-3">
            <div className="text-[10px] uppercase tracking-[.14em] text-[#a99daf]">Prompt</div>
            <p className="mt-3 text-sm leading-6 text-[#eee7f2]">Smoky late-night jazz, brushed drums, noir piano, velvet saxophone lead.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[.045] p-3">
            <div className="text-[10px] uppercase tracking-[.14em] text-[#a99daf]">Services</div>
            <div className="mt-3 space-y-2 text-xs text-[#cfc4d7]">
              <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#8fc3b1]" />OpenAI connected</span>
              <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#8fc3b1]" />ElevenLabs connected</span>
              <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#d1b285]" />YouTube optional</span>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-[#0d0a14] p-3">
          <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[.14em] text-[#a99daf]">
            <span>Video timeline</span>
            <span>Artwork + music + effects</span>
          </div>
          <PreviewLane label="Video/Image" tone="violet" />
          <PreviewLane label="Effect" tone="rose" />
          <PreviewLane label="Audio" tone="cyan" />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <PreviewPill icon={<Layers3 className="h-4 w-4" />} label="Filters" />
          <PreviewPill icon={<UploadCloud className="h-4 w-4" />} label="Publish" />
          <PreviewPill icon={<BarChart3 className="h-4 w-4" />} label="History" />
        </div>
      </div>
    </div>
  );
}

function PreviewLane({ label, tone }: { label: string; tone: "violet" | "rose" | "cyan" }) {
  const colors = {
    violet: "from-[#8e80b7]/40 to-[#8e80b7]/10 border-[#8e80b7]/30",
    rose: "from-[#d58fbd]/40 to-[#d58fbd]/10 border-[#d58fbd]/30",
    cyan: "from-[#8eb8be]/40 to-[#8eb8be]/10 border-[#8eb8be]/30"
  };
  return (
    <div className="grid grid-cols-[92px_minmax(0,1fr)] items-center gap-2 py-1">
      <div className="text-[9px] font-semibold uppercase tracking-[.12em] text-[#8f839a]">{label}</div>
      <div className={`h-8 rounded-lg border bg-gradient-to-r ${colors[tone]}`} />
    </div>
  );
}

function PreviewPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return <div className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.045] text-xs text-[#cfc4d7]">{icon}{label}</div>;
}
