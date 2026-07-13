# Architecture

Velvet Coda is planned as a monorepo with a Next.js studio app, durable workers and shared packages for database, AI, integrations, media and UI. Phase 1 keeps the code in a single app while preserving boundaries in documentation and types.

Future structure:

- `apps/web`: Next.js App Router studio
- `apps/worker`: durable generation, render and upload jobs
- `packages/ui`: shared visual primitives
- `packages/database`: Supabase schema, RLS and typed queries
- `packages/ai`: OpenAI structured output workflows
- `packages/integrations`: ElevenLabs and YouTube clients
- `packages/media`: FFmpeg and FFprobe pipelines
- `packages/shared`: common schemas, status enums and utilities

Long-running operations must run in workers, not short-lived web requests.
