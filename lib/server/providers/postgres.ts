import { Client } from "pg";

export async function validatePostgresConnection(connectionString: string) {
  const client = new Client({
    connectionString,
    ssl: connectionString.includes("supabase.co") ? { rejectUnauthorized: false } : undefined,
    connectionTimeoutMillis: 8000
  });

  try {
    await client.connect();
    await client.query("select 1 as ok");
    return { valid: true, message: "Database connection is valid." };
  } catch (error) {
    return {
      valid: false,
      message: error instanceof Error ? `Database connection failed: ${error.message}` : "Database connection failed."
    };
  } finally {
    await client.end().catch(() => undefined);
  }
}
