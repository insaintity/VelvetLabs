import type { LucideIcon } from "lucide-react";
import {
  Album,
  Archive,
  AudioLines,
  CalendarDays,
  Gauge,
  Image,
  LayoutDashboard,
  ListMusic,
  Palette,
  RadioTower,
  Settings,
  Sparkles,
  UploadCloud,
  Wand2,
  Youtube
} from "lucide-react";

export type TrackStatus = "approved" | "ready" | "generating" | "queued";

export type Track = {
  id: string;
  number: string;
  title: string;
  duration: string;
  purpose: string;
  prompt: string;
  status: TrackStatus;
  candidates: string[];
};

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", href: "/projects", icon: Archive },
  { label: "Albums", href: "/albums", icon: Album },
  { label: "Tracks", href: "/tracks", icon: ListMusic },
  { label: "Prompt Lab", href: "/prompt-lab", icon: Wand2 },
  { label: "Artwork", href: "/artwork", icon: Palette },
  { label: "Render Queue", href: "/render-queue", icon: AudioLines },
  { label: "YouTube", href: "/youtube", icon: Youtube },
  { label: "Automation", href: "/automation", icon: RadioTower },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
  { label: "Presets", href: "/presets", icon: Sparkles },
  { label: "Usage", href: "/usage", icon: Gauge },
  { label: "Settings", href: "/settings", icon: Settings }
];

export const requiredRoutes = [
  "/dashboard",
  "/projects",
  "/projects/new",
  "/projects/demo-masquerade",
  "/projects/demo-masquerade/blueprint",
  "/projects/demo-masquerade/tracks",
  "/projects/demo-masquerade/artwork",
  "/projects/demo-masquerade/mastering",
  "/projects/demo-masquerade/render",
  "/projects/demo-masquerade/youtube",
  "/prompt-lab",
  "/artwork",
  "/render-queue",
  "/youtube",
  "/automation",
  "/calendar",
  "/presets",
  "/usage",
  "/settings",
  "/settings/openai",
  "/settings/elevenlabs",
  "/settings/youtube",
  "/settings/storage"
];

export const tracks: Track[] = [
  {
    id: "amber-masque",
    number: "01",
    title: "Amber Masque",
    duration: "3:45",
    purpose: "Opening statement: velvet curtains, candlelight and the first saxophone motif.",
    prompt:
      "Dark royal jazz ballad led by warm tenor saxophone, intimate piano chords, brushed drums and upright bass. Begin with a hushed saxophone phrase, develop into a restrained ballroom sway, and end on a smoky unresolved cadence. Instrumental only.",
    status: "approved",
    candidates: ["A", "B"]
  },
  {
    id: "gilded-shadow",
    number: "02",
    title: "Gilded Shadow",
    duration: "4:12",
    purpose: "Deepens the nocturne with brass glow and a slower pulse.",
    prompt:
      "Moody noir jazz with tenor saxophone, upright bass, low piano voicings and brushed cymbals. Keep the arrangement intimate and cinematic with antique-gold warmth. Instrumental only.",
    status: "approved",
    candidates: ["A"]
  },
  {
    id: "crimson-vow",
    number: "03",
    title: "Crimson Vow",
    duration: "3:58",
    purpose: "A romantic centrepiece with stronger melodic tension.",
    prompt:
      "Slow cinematic jazz waltz with saxophone lead, soft piano response, bowed bass accents and brushed drums. Build from fragile to quietly dangerous, then fade with a final breath. Instrumental only.",
    status: "approved",
    candidates: ["A", "B", "C"]
  },
  {
    id: "halo-secrecy",
    number: "04",
    title: "Halo of Secrecy",
    duration: "4:33",
    purpose: "A veiled interlude that opens more room in the arrangement.",
    prompt:
      "Sparse midnight jazz interlude with a muted saxophone melody, spacious piano, brushed snare and upright bass harmonics. Leave air between phrases and preserve a candlelit atmosphere. Instrumental only.",
    status: "approved",
    candidates: ["A"]
  },
  {
    id: "jewel-dusk",
    number: "05",
    title: "Jewel of Dusk",
    duration: "4:21",
    purpose: "Adds sparkle without breaking the restrained album mood.",
    prompt:
      "Elegant dark jazz with tenor saxophone ornamentation, polished piano arpeggios, brushed ride cymbal and warm bass. Begin delicately, bloom in the middle, then close with velvet softness. Instrumental only.",
    status: "approved",
    candidates: ["A", "B"]
  },
  {
    id: "silent-grandeur",
    number: "06",
    title: "Silent Grandeur",
    duration: "4:07",
    purpose: "A calm, regal passage before the late-album tension.",
    prompt:
      "Regal lounge jazz, slow tempo, saxophone-led, with intimate piano, upright bass and brushed drums. Keep the texture expensive, dark and patient. Instrumental only.",
    status: "ready",
    candidates: ["A"]
  },
  {
    id: "theatrical-vow",
    number: "07",
    title: "Theatrical Vow",
    duration: "4:46",
    purpose: "The dramatic peak of the masked ballroom story.",
    prompt:
      "Cinematic noir jazz with a more intense tenor saxophone lead, piano in low register, brushed drums growing to a measured climax, then a restrained ending. Instrumental only.",
    status: "generating",
    candidates: ["A", "B"]
  },
  {
    id: "whispered-mask",
    number: "08",
    title: "Whispered Mask",
    duration: "3:40",
    purpose: "Pulls the album back into intimacy after the peak.",
    prompt:
      "Soft late-night jazz miniature with breathy saxophone, close piano, subtle upright bass and almost whispered brushes. Keep it romantic, dim and slightly haunted. Instrumental only.",
    status: "queued",
    candidates: ["A"]
  },
  {
    id: "midnight-crown",
    number: "09",
    title: "Midnight Crown",
    duration: "4:20",
    purpose: "A final royal theme before the closing afterglow.",
    prompt:
      "Dark royal jazz theme with saxophone lead, antique piano, upright bass and brushed drums. Develop the opening motif into a confident but restrained farewell. Instrumental only.",
    status: "queued",
    candidates: ["A"]
  },
  {
    id: "velvet-afterglow",
    number: "10",
    title: "Velvet Afterglow",
    duration: "4:38",
    purpose: "Closing track, warm embers and the last candlelight.",
    prompt:
      "Slow closing jazz ballad with lyrical tenor saxophone, intimate piano, brushed drums and upright bass. Resolve the album gently with a soft, smoky final cadence. Instrumental only.",
    status: "queued",
    candidates: ["A"]
  }
];

export const workflowSteps = [
  { label: "Draft", detail: "Lyrics and structure created", time: "10:21 PM", done: true },
  { label: "Generated", detail: "Music and arrangements", time: "10:28 PM", done: true },
  { label: "Approved", detail: "You approved all tracks", time: "10:34 PM", done: true },
  { label: "Rendered", detail: "High quality audio export", time: "--:--", done: false }
];

export const chapters = [
  { time: "00:00", label: "Intro", color: "#3b425e" },
  { time: "04:12", label: "Amber Masque", color: "#c7b49f" },
  { time: "08:24", label: "Crimson Vow", color: "#d2a18f" },
  { time: "12:22", label: "Jewel of Dusk", color: "#ef6398" },
  { time: "38:42", label: "Outro", color: "#e8ded0" }
];

export const projectLinks = [
  { label: "Blueprint", href: "/projects/demo-masquerade/blueprint", icon: Image },
  { label: "Tracks", href: "/projects/demo-masquerade/tracks", icon: ListMusic },
  { label: "Artwork", href: "/projects/demo-masquerade/artwork", icon: Palette },
  { label: "Render", href: "/projects/demo-masquerade/render", icon: UploadCloud },
  { label: "YouTube", href: "/projects/demo-masquerade/youtube", icon: Youtube }
];
