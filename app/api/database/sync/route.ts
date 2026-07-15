import { NextResponse } from "next/server";
import { readDatabase, updateSetup } from "@/lib/server/db";
import { initializeVelvetSchema, syncVelvetDatabase } from "@/lib/server/providers/postgres";
import { requireSameOrigin } from "@/lib/server/security";
import { readSecret } from "@/lib/server/secrets";

export async function POST(request: Request) {
  const blocked = requireSameOrigin(request);
  if (blocked) return blocked;

  const databaseUrl = await readSecret("databaseUrl");
  if (!databaseUrl) {
    return NextResponse.json({ error: "Add and save a PostgreSQL database URL first." }, { status: 409 });
  }

  try {
    const database = await readDatabase();
    await initializeVelvetSchema(databaseUrl);
    const counts = await syncVelvetDatabase(databaseUrl, database);
    await updateSetup({
      worker: {
        storageEndpoint: database.setup.worker?.storageEndpoint,
        storageRegion: database.setup.worker?.storageRegion ?? "auto",
        storageForcePathStyle: database.setup.worker?.storageForcePathStyle ?? false,
        storageBucket: database.setup.worker?.storageBucket ?? "velvet-assets",
        status: database.setup.worker?.status ?? { state: "valid", message: "Local storage is ready." },
        databaseStatus: {
          state: "valid",
          message: `Database initialized and synced (${counts.projects} projects, ${counts.jobs} jobs).`,
          checkedAt: new Date().toISOString()
        }
      }
    });

    return NextResponse.json({ counts });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Database sync failed." },
      { status: 500 }
    );
  }
}
