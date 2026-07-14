import { NextResponse } from "next/server";
import { sessionCookieOptions, VELVET_SESSION_COOKIE } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/server/security";

export async function POST(request: Request) {
  const blocked = requireSameOrigin(request);
  if (blocked) return blocked;
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(VELVET_SESSION_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
  return response;
}
