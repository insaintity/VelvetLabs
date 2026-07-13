import { NextResponse } from "next/server";
import { readDatabase } from "@/lib/server/db";

export async function GET() {
  const database = await readDatabase();
  return NextResponse.json({ jobs: database.jobs });
}
