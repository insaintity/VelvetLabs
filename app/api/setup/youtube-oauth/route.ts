import { NextResponse } from "next/server";
import { requireSameOrigin } from "../../../../lib/server/security";
import { hasSecret, saveSecret } from "../../../../lib/server/secrets";

export async function POST(request: Request) {
  const blocked = requireSameOrigin(request);
  if (blocked) return blocked;

  const body = await request.json();
  const clientId = typeof body.clientId === "string" ? body.clientId.trim() : "";
  const clientSecret = typeof body.clientSecret === "string" ? body.clientSecret.trim() : "";

  if (!clientId || !clientId.endsWith(".apps.googleusercontent.com")) {
    return NextResponse.json({ error: "Enter a valid Google OAuth client ID ending in .apps.googleusercontent.com." }, { status: 400 });
  }

  await saveSecret("googleClientId", clientId);
  if (clientSecret) await saveSecret("googleClientSecret", clientSecret);

  const configured = await hasSecret("googleClientId");
  if (!configured) {
    return NextResponse.json({ error: "This hosted build requires GOOGLE_CLIENT_ID in its server environment." }, { status: 409 });
  }

  return NextResponse.json({ configured: true });
}
