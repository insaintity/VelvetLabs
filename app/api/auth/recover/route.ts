import { NextResponse } from "next/server";
import { createSessionToken, sessionCookieOptions, VELVET_SESSION_COOKIE } from "@/lib/auth";
import { recoverStoredOwnerAccount } from "@/lib/server/auth-accounts";
import { requireSameOrigin } from "@/lib/server/security";

export async function POST(request: Request) {
  const blocked = requireSameOrigin(request);
  if (blocked) return blocked;
  const body = await request.json().catch(() => ({}));
  if (typeof body.email !== "string" || typeof body.recoveryCode !== "string" || typeof body.password !== "string") {
    return NextResponse.json({ error: "Email, recovery code, and new password are required." }, { status: 400 });
  }
  try {
    await recoverStoredOwnerAccount({ email: body.email, recoveryCode: body.recoveryCode, password: body.password });
    const response = NextResponse.json({ recovered: true, authenticated: true });
    response.cookies.set(VELVET_SESSION_COOKIE, await createSessionToken(), sessionCookieOptions);
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Account could not be recovered." }, { status: 400 });
  }
}
