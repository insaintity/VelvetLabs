# Deployment

Velvet can run as two processes:

- Web: `npm run start`
- Worker: `npm run worker`

The worker drains persisted queued jobs for music generation, rendering and YouTube upload. In production, deploy the worker as a separate service/container with the same environment variables and database/secrets access as the web app.

## Worker Container

Build the worker image:

```bash
docker build -f Dockerfile.worker -t velvet-worker .
```

Run the worker:

```bash
docker run --env-file .env.local velvet-worker
```

The worker image installs FFmpeg so render jobs can produce MP4 exports when generated audio files are available to the container.

## Shared Requirements

Both web and worker processes need access to:

- `DATABASE_URL` when `VELVET_DATABASE_MODE=postgres`
- provider secrets through local encrypted storage, env-backed secrets, or `VELVET_SECRET_PROVIDER=vault`
- `SUPABASE_URL` and a server-only `SUPABASE_SECRET_KEY` (or legacy `SUPABASE_SERVICE_ROLE_KEY`) for the private shared media bucket
- `SUPABASE_STORAGE_BUCKET`, defaulting to `velvet-assets`
- `VELVET_WORKER_INTERVAL_MS` if the default polling cadence should change

## Railway

Recommended Railway layout:

- Service 1: `velvet-web`
  - Source: GitHub repo
  - Build command: `npm run build`
  - Start command: `npm run start:railway`
  - Health check path: `/api/health`
- Service 2: `velvet-worker`
  - Source: same GitHub repo
  - Config file path: `/railway.worker.json`
  - Builds with `Dockerfile.worker` so FFmpeg is included
  - Start command: `npm run worker`
- Plugin/service: Postgres
  - Set `VELVET_DATABASE_MODE=postgres`
  - Use Railway's `DATABASE_URL`

The checked-in `railway.json` config is for the web service. The worker has its own `railway.worker.json`; select `/railway.worker.json` as that service's custom config file so the web start command cannot override the worker container.

Railway variables to set on both web and worker:

- `VELVET_ADMIN_PASSWORD` on the web service only
- `VELVET_SESSION_SECRET` on the web service only; use a separate long random value
- `VELVET_DATABASE_MODE=postgres`
- `VELVET_SECRET_PROVIDER=env`
- `OPENAI_API_KEY`
- `ELEVENLABS_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET=velvet-assets`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `YOUTUBE_REDIRECT_URI`
- `YOUTUBE_REFRESH_TOKEN` after OAuth is completed or migrated
- `FFMPEG_PATH=ffmpeg`
- optional `VELVET_*_USD` cost estimate rates

## Shared Supabase Storage

Velvet creates or reuses a private Storage bucket when the server-side storage test runs. The web and worker services must receive the same URL, secret key, and bucket name. The publishable key is not used for server media writes and must not be substituted for the secret/service-role key.

Media remains private. Browser playback is proxied through Velvet, and generated tracks, reference assets, render manifests, and MP4 files are addressed by stable object paths. Local files remain a development cache; another Railway instance can restore an object from Storage when the original local path is unavailable.

In Supabase, copy the server key from **Project Settings > API Keys**. Prefer the current `sb_secret_...` key when available. Never expose this value through a `NEXT_PUBLIC_*` variable.
