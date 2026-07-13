import type { LucideIcon } from "lucide-react";
import { FolderKanban, History, LayoutDashboard, Settings, Sparkles } from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "New Album", href: "/projects/new", icon: Sparkles },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "History", href: "/history", icon: History },
  { label: "Settings", href: "/settings", icon: Settings }
];

export const setupSteps = [
  {
    title: "Connect ChatGPT",
    body: "Add an OpenAI API key for album planning, artwork prompts, image generation and YouTube metadata.",
    href: "/settings"
  },
  {
    title: "Connect ElevenLabs",
    body: "Add an ElevenLabs key for music generation when track prompts are approved.",
    href: "/settings"
  },
  {
    title: "Connect YouTube",
    body: "Add Google OAuth details so Velvet Coda can upload privately when the album is ready.",
    href: "/settings"
  }
];

export const onboardingSteps = [
  "ChatGPT / OpenAI",
  "ElevenLabs",
  "YouTube",
  "Storage & worker",
  "Review"
];

export const safetyDefaults = [
  "Assisted workflow by default",
  "Review blueprint before generation",
  "Review tracks before rendering",
  "Upload privately before publishing",
  "Never run paid retries silently"
];

export const historyPromptTypes = [
  "Album brief",
  "Album blueprint prompt",
  "Track music prompts",
  "Album cover prompt",
  "YouTube thumbnail prompt",
  "Video background prompt",
  "YouTube metadata prompt"
];

export const historyColumns = [
  "Upload",
  "Project",
  "Privacy",
  "Published",
  "Prompts",
  "Status"
];
