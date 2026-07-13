# Known Limitations

- The app intentionally opens with no projects or seeded demo albums.
- Local persistence uses `.velvet/db.json`, which is appropriate for local development but not multi-user production hosting.
- Secrets are encrypted locally; production should use a managed vault or KMS.
- Job records are persisted, but there is not yet a separate durable worker process.
- ElevenLabs music generation depends on the live provider endpoint and a valid key.
- The render endpoint creates a manifest; full FFmpeg video composition is still pending.
- YouTube upload is implemented as an API endpoint, but requires a real MP4 export path and configured OAuth credentials.
