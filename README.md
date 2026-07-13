# Velvet

Velvet is an AI album foundry for creating complete jazz albums and preparing them for YouTube release.

The app is currently in Phase 1: a polished first-launch studio shell with no fake albums, fake jobs, fake uploads, or simulated provider activity. It opens like a brand-new workspace and guides the user through setup before any generation workflow begins.

## What It Does

- Collects a natural-language album brief.
- Onboards the required services: ChatGPT/OpenAI, ElevenLabs, YouTube, storage, and worker settings.
- Provides a fixed, no-scroll studio interface with dark midnight styling.
- Shows empty Projects and Upload History states until real user work exists.
- Defines the upload history surface that will preserve the prompts used for each uploaded release.

## Tech Stack

- Next.js App Router
- React
- TypeScript strict mode
- Tailwind CSS
- Zustand
- Zod
- Lucide icons
- Framer Motion
- Vitest
- Playwright

## Quick Start

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000/dashboard
```

## Available Routes

- `/dashboard` - first-launch studio overview
- `/projects/new` - album brief entry
- `/projects` - empty project library
- `/history` - upload history and prompt archive
- `/settings` - onboarding for ChatGPT/OpenAI, ElevenLabs, YouTube login, storage, and worker setup

## Onboarding

Velvet is focused on:

- ChatGPT/OpenAI for album planning, prompt refinement, artwork prompts, image generation, and YouTube metadata
- ElevenLabs for music generation
- YouTube login via Google OAuth for private uploads, thumbnails, metadata, and publishing workflows

The current UI shows setup fields, but real secrets are not persisted yet. API keys and OAuth tokens must be encrypted and stored server-side before provider requests are enabled.

## Upload History

The History page is designed to log every uploaded album with:

- YouTube video ID and URL
- Privacy state
- Thumbnail asset
- Render manifest
- Provider usage
- Error and retry log
- Album brief
- Album blueprint prompt
- Track music prompts
- Album cover prompt
- YouTube thumbnail prompt
- Video background prompt
- YouTube metadata prompt

## Validation

Run the full local verification suite:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:e2e
```

The Playwright suite checks the primary pages at desktop sizes and verifies that the main studio pages do not create page-level scrolling.

## Environment

Copy `.env.example` and fill in values when backend persistence and provider integrations are implemented.

```bash
cp .env.example .env.local
```

Important variables include:

- `OPENAI_API_KEY`
- `ELEVENLABS_API_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `YOUTUBE_REDIRECT_URI` such as `http://localhost:3000/api/youtube/callback`
- `SUPABASE_URL`
- `DATABASE_URL`
- `WORKER_SECRET`

## Current Limitations

- No provider calls are made yet.
- API keys are not stored yet.
- Supabase persistence is not wired yet.
- ElevenLabs generation is not wired yet.
- YouTube OAuth and uploads are not wired yet.
- FFmpeg rendering is not wired yet.

## Design Direction

The interface should remain a dense, premium, midnight studio console:

- dark plum and navy surfaces
- rose, violet, and blue lighting
- editorial serif branding
- fixed no-scroll pages
- compact, purposeful controls
- no generic SaaS dashboard styling
