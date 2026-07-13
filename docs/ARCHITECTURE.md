# Architecture

Velvet Coda is planned as a monorepo with a Next.js studio app, durable workers and shared packages for database, AI, integrations, media and UI. Phase 1 keeps the code in a single app while preserving boundaries in documentation and types.

Future structure:

- `apps/web`: Next.js App Router studio
- `apps/worker`: durable generation, render and upload jobs
- `packages/ui`: shared visual primitives
- `packages/database`: Supabase schema, RLS and typed queries
- `packages/ai`: provider-agnostic planning workflows for APIs, compatible endpoints and local CLIs
- `packages/integrations`: ElevenLabs and YouTube clients
- `packages/media`: FFmpeg and FFprobe pipelines
- `packages/shared`: common schemas, status enums and utilities

Long-running operations must run in workers, not short-lived web requests.

AI access should be connector based. A project may use OpenAI, ChatGPT/OpenAI-compatible APIs, Claude, a local CLI command or another configured model host as long as the connector normalizes requests into the album-planning contract.
