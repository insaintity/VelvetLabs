import { NextResponse } from "next/server";
import { readOwnerAccountSummary, updateStoredOwnerAccount } from "@/lib/server/auth-accounts";
import { requireSameOrigin } from "@/lib/server/security";

export async function GET() {
  return NextResponse.json({ account: await readOwnerAccountSummary() });
}

export async function PATCH(request: Request) {
  const blocked = requireSameOrigin(request);
  if (blocked) return blocked;
  const body = await request.json().catch(() => ({}));
  if (typeof body.currentPassword !== "string") return NextResponse.json({ error: "Enter your current password first." }, { status: 400 });
  try {
    const account = await updateStoredOwnerAccount({
      currentPassword: body.currentPassword,
      username: typeof body.username === "string" ? body.username : undefined,
      email: typeof body.email === "string" ? body.email : undefined,
      password: typeof body.password === "string" && body.password ? body.password : undefined
    });
    return NextResponse.json({ account: { username: account.username, email: account.email, stored: true } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Account could not be updated." }, { status: 400 });
  }
}
