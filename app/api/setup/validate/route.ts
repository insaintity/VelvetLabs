import { NextResponse } from "next/server";
import { requireSameOrigin } from "@/lib/server/security";
import { validateSetupProviders, type SetupProvider } from "@/lib/server/setup-validation";

export async function POST(request: Request) {
  const blocked = requireSameOrigin(request);
  if (blocked) return blocked;

  const { provider } = await request.json() as { provider?: SetupProvider };
  if (!provider || !["openai", "elevenlabs", "database", "storage"].includes(provider)) {
    return NextResponse.json({ error: "Unknown provider." }, { status: 400 });
  }

  const result = await validateSetupProviders([provider]);
  const providerStatus = result.validation[provider];
  const responseStatus = providerStatus?.state === "valid" ? 200 : providerStatus?.state === "missing" ? 400 : 401;
  return NextResponse.json({ status: providerStatus, setup: result.setup }, { status: responseStatus });
}
