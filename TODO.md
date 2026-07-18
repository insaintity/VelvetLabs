# Velvet TODO

This list is intentionally practical: things worth doing next after the current streamlined web build.

## Highest Priority

- Confirm the laptop setup path:
  - clone from GitHub
  - install dependencies
  - copy `.env.example` to `.env.local`
  - add OpenAI, ElevenLabs, Railway/Postgres/storage, and optional YouTube OAuth variables
  - run `npm run dev`
- Export a local Velvet backup from the desktop and restore it on the laptop if you want matching local projects.
- Decide whether the public GitHub destination should remain `insaintity/Velvet` or move fully to the redirected `insaintity/VelvetLabs` repo.
- Keep YouTube optional everywhere. OpenAI gates plan creation, ElevenLabs gates music generation, and YouTube gates publishing only.

## Product Cleanup

- Continue reducing advanced setup visibility so new users mainly see OpenAI, ElevenLabs, and optional YouTube.
- Add clearer empty states in Video Editor, Thumbnail Editor, Publishing, and History with one primary next action.
- Add short tooltips to timeline controls: Cut, Delete, Drag, Effects, Export, Schedule.
- Audit all user-facing wording for leftover `blueprint` language and replace with `plan` where possible.
- Keep page-level scrolling disabled and test compact laptop viewport sizes regularly.

## Video Editor

- Make imported media thumbnails visible in the Add Media bin.
- Add clip-level properties for start time, end time, duration, volume, crop, and opacity.
- Add keyboard shortcut hints for `S` cut, Delete, undo, redo, copy, and paste.
- Add drag handles that feel larger and easier to grab on laptop trackpads.
- Add real preview playback once uploaded media files are available to the browser.
- Connect Export settings directly to the render job and show progress inside the editor.

## Thumbnail Editor

- Add image import and drag-in support.
- Add crop, safe-zone, title text, shadow, grain, contrast, and export size controls.
- Add quick variants generated from the project plan and YouTube title.

## Publishing

- Show scheduled uploads, recent uploads, failed uploads, and success rate in one compact screen.
- Add retry action for failed upload jobs.
- Add a manual publish checklist for users who do not connect YouTube.
- Add clearer Google OAuth setup guidance for private single-user deployments.

## Backend And Reliability

- Keep the durable worker running in production and verify it processes music, render, and upload jobs after deploys.
- Add more job progress events so the UI updates immediately without refresh.
- Add backup export/restore tests for projects, prompts, jobs, setup, usage, and uploads.
- Add a production health check that verifies OpenAI, ElevenLabs, FFmpeg, storage, database, worker, and YouTube status.
- Make Railway deployment notes current after every infrastructure change.

## Testing

- Run before pushes:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npx playwright test tests/velvet-dashboard.spec.ts --project=desktop-1280
```

- Add a laptop viewport Playwright profile once you know the laptop resolution.
- Add tests for `/showcase`, Publishing performance summary, and editor Export tab behavior.

## Nice To Have

- Add gentle page transitions between primary studio sections.
- Add more premium motion to timeline clips and project status changes.
- Add a compact keyboard command palette action for Create Media, Open Editor, Export, and Publish.
- Add a first-run “restore from backup” option for moving between desktop and laptop.
