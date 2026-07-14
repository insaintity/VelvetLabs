import { NextResponse } from "next/server";
import { authIsConfigured } from "@/lib/auth";

export async function GET() {
  return NextResponse.json({ enabled: authIsConfigured() });
}
