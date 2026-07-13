import type { LucideIcon } from "lucide-react";
import { FolderKanban, LayoutDashboard, Settings, Sparkles } from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "New Album", href: "/projects/new", icon: Sparkles },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Settings", href: "/settings", icon: Settings }
];

export const setupSteps = [
  {
    title: "Choose AI access",
    body: "Use any supported API key, OpenAI-compatible endpoint or local CLI command.",
    href: "/settings"
  },
  {
    title: "Connect YouTube",
    body: "Optional for now. Private upload and publishing controls unlock after OAuth.",
    href: "/settings/youtube"
  },
  {
    title: "Create first album",
    body: "Start with one natural-language brief. Velvet Coda will ask before any paid work.",
    href: "/projects/new"
  }
];

export const preferenceDefaults = [
  "Bring your own AI provider",
  "API keys stay server-side",
  "CLI commands run through workers",
  "Instrumental unless requested",
  "Assisted workflow",
  "Private upload review"
];

export const aiConnectors = [
  {
    name: "OpenAI / ChatGPT",
    kind: "API key",
    detail: "Use the official OpenAI API or any account key that supports the selected model."
  },
  {
    name: "Claude",
    kind: "API key or CLI",
    detail: "Connect Anthropic by key, or point Velvet Coda at an installed Claude CLI."
  },
  {
    name: "OpenAI-compatible",
    kind: "Base URL + key",
    detail: "Use compatible hosts by providing a base URL, model name and optional API key."
  },
  {
    name: "Local command",
    kind: "CLI",
    detail: "Run a local tool such as claude, codex, ollama, lmstudio or a custom wrapper."
  },
  {
    name: "Custom provider",
    kind: "Manual config",
    detail: "Define request shape later when a provider needs special handling."
  }
];

export const mediaConnectors = [
  {
    name: "Music generation",
    detail: "ElevenLabs Music, another music API or a local generation command."
  },
  {
    name: "Image generation",
    detail: "OpenAI images, another image API or an external workflow."
  },
  {
    name: "Publishing",
    detail: "YouTube OAuth when you are ready to upload privately or schedule."
  }
];
