# Velvet Coda

AI album foundry for planning, producing, rendering and publishing complete jazz albums.

Phase 1 is a polished demo-mode studio shell that recreates the supplied Velvet Coda dashboard direction with seeded `Velvet Masquerade` content. Provider calls are intentionally not connected yet.

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000/dashboard`.

## Current Phase

- Next.js App Router, React, strict TypeScript and Tailwind CSS
- Velvet Coda visual system with dark plum/navy panels, rose/violet/blue lighting and editorial serif branding
- Permanent sidebar, top project bar and bottom audio player
- Three-column album workspace with album artwork, track list, workflow status, chapters and export preset
- New project guided flow at `/projects/new`
- Required Phase 1 routes served with honest demo-mode surfaces
- Zustand-powered player state

## Demo Mode

When provider credentials are missing, the app preserves the complete interface and uses deterministic seeded data. It never claims that OpenAI, ElevenLabs, image, FFmpeg or YouTube work has happened.
