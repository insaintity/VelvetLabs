import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const error = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get("youtube_oauth_state")?.value;

  cookieStore.delete("youtube_oauth_state");

  if (error) {
    return NextResponse.redirect(new URL(`/settings?youtube=denied&reason=${encodeURIComponent(error)}`, request.url));
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL("/settings?youtube=invalid_state", request.url));
  }

  if (!process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_CLIENT_ID || !process.env.YOUTUBE_REDIRECT_URI) {
    return NextResponse.redirect(new URL("/settings?youtube=missing_server_config", request.url));
  }

  // Token exchange and encrypted storage belong in the server-side vault layer.
  // Keep the callback safe and explicit until persistence exists.
  return NextResponse.redirect(new URL("/settings?youtube=authorized_pending_storage", request.url));
}
