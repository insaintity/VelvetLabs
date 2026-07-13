# YouTube Integration

YouTube support will use Google OAuth 2.0 and the official YouTube Data API.

Default publication behavior is private upload for final review. Public publishing must require explicit confirmation unless the user has deliberately configured safe automation.

Use idempotency records to prevent duplicate uploads.

Each upload record must preserve a history view with the final YouTube video ID, URL, privacy state, thumbnail, render manifest, usage summary, errors/retries and the exact prompt versions used to create the album.
