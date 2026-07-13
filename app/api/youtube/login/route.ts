import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";

const youtubeScopes = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly"
];

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.YOUTUBE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      {
        error: "YouTube OAuth is not configured.",
        required: ["GOOGLE_CLIENT_ID", "YOUTUBE_REDIRECT_URI"]
      },
      { status: 501 }
    );
  }

  const state = randomBytes(24).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set("youtube_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: youtubeScopes.join(" "),
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent",
    state
  });

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}
