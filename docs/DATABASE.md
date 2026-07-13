# Database

Phase 2 will add Supabase PostgreSQL with RLS.

Planned tables:

users, profiles, channel_profiles, provider_connections, projects, project_versions, album_blueprints, album_blueprint_versions, tracks, track_versions, prompt_versions, track_candidates, audio_assets, image_assets, video_assets, generation_jobs, render_jobs, youtube_uploads, youtube_playlists, automation_schedules, usage_events, budget_limits, quality_checks, notifications and audit_logs.

All project-owned tables should use UUID primary keys, `created_at`, `updated_at`, `created_by`, `status` and version fields where appropriate.

Upload history should join `youtube_uploads`, `video_assets`, `image_assets`, `render_jobs`, `usage_events` and `prompt_versions` so every published or privately uploaded release can show the prompts used for planning, track generation, artwork, thumbnail, video background and YouTube metadata.
