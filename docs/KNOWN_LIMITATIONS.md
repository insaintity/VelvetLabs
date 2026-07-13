# Known Limitations

- The app intentionally opens with no projects or seeded demo albums.
- Local persistence uses `.velvet/db.json`, which is appropriate for local development but not multi-user production hosting.
- Supabase/Postgres database URLs can be saved, validated, initialized, and synced. Runtime writes still use local `.velvet` until hosted database mode is enabled.
- Secrets are encrypted locally; production should use a managed vault or KMS.
- Job records are persisted, but there is not yet a separate durable worker process.
- ElevenLabs music generation depends on the live provider endpoint and a valid key.
- The render endpoint creates a manifest and attempts MP4 composition when FFmpeg is on PATH or `FFMPEG_PATH` points to `ffmpeg.exe`.
- YouTube upload is implemented as an API endpoint, but requires a real MP4 export path and configured OAuth credentials.
- Usage units are recorded, but provider pricing and budget enforcement are not yet calculated.
