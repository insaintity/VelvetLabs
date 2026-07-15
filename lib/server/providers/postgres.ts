import { Client } from "pg";
import type { JobRecord, ProjectRecord, PromptRecord, UploadRecord, UsageRecord, VelvetDatabase } from "../types";

function createClient(connectionString: string) {
  return new Client({
    connectionString,
    connectionTimeoutMillis: 8000
  });
}

export async function validatePostgresConnection(connectionString: string) {
  const client = createClient(connectionString);

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

export async function initializeVelvetSchema(connectionString: string) {
  const client = createClient(connectionString);
  await client.connect();

  try {
    await client.query(`
      create table if not exists velvet_projects (
        id text primary key,
        title text not null,
        status text not null,
        payload jsonb not null,
        created_at timestamptz not null,
        updated_at timestamptz not null
      );

      create table if not exists velvet_prompts (
        id text primary key,
        project_id text,
        kind text not null,
        version integer not null,
        payload jsonb not null,
        created_at timestamptz not null
      );

      create table if not exists velvet_jobs (
        id text primary key,
        project_id text,
        type text not null,
        status text not null,
        payload jsonb not null,
        created_at timestamptz not null,
        updated_at timestamptz not null
      );

      create table if not exists velvet_uploads (
        id text primary key,
        project_id text not null,
        status text not null,
        payload jsonb not null,
        created_at timestamptz not null
      );

      create table if not exists velvet_usage (
        id text primary key,
        project_id text,
        provider text not null,
        operation text not null,
        units jsonb not null,
        payload jsonb not null,
        created_at timestamptz not null
      );
    `);
  } finally {
    await client.end().catch(() => undefined);
  }
}

export async function syncVelvetDatabase(connectionString: string, database: VelvetDatabase) {
  const client = createClient(connectionString);
  await client.connect();

  try {
    await client.query("begin");

    for (const project of database.projects) {
      await client.query(
        `
        insert into velvet_projects (id, title, status, payload, created_at, updated_at)
        values ($1, $2, $3, $4, $5, $6)
        on conflict (id) do update set
          title = excluded.title,
          status = excluded.status,
          payload = excluded.payload,
          updated_at = excluded.updated_at
      `,
        [project.id, project.title, project.status, project, project.createdAt, project.updatedAt]
      );
    }

    for (const prompt of database.prompts) {
      await client.query(
        `
        insert into velvet_prompts (id, project_id, kind, version, payload, created_at)
        values ($1, $2, $3, $4, $5, $6)
        on conflict (id) do update set
          project_id = excluded.project_id,
          kind = excluded.kind,
          version = excluded.version,
          payload = excluded.payload
      `,
        [prompt.id, prompt.projectId, prompt.kind, prompt.version, prompt, prompt.createdAt]
      );
    }

    for (const job of database.jobs) {
      await client.query(
        `
        insert into velvet_jobs (id, project_id, type, status, payload, created_at, updated_at)
        values ($1, $2, $3, $4, $5, $6, $7)
        on conflict (id) do update set
          project_id = excluded.project_id,
          type = excluded.type,
          status = excluded.status,
          payload = excluded.payload,
          updated_at = excluded.updated_at
      `,
        [job.id, job.projectId ?? null, job.type, job.status, job, job.createdAt, job.updatedAt]
      );
    }

    for (const upload of database.uploads) {
      await client.query(
        `
        insert into velvet_uploads (id, project_id, status, payload, created_at)
        values ($1, $2, $3, $4, $5)
        on conflict (id) do update set
          project_id = excluded.project_id,
          status = excluded.status,
          payload = excluded.payload
      `,
        [upload.id, upload.projectId, upload.status, upload, upload.createdAt]
      );
    }

    for (const usage of database.usage) {
      await client.query(
        `
        insert into velvet_usage (id, project_id, provider, operation, units, payload, created_at)
        values ($1, $2, $3, $4, $5, $6, $7)
        on conflict (id) do update set
          project_id = excluded.project_id,
          provider = excluded.provider,
          operation = excluded.operation,
          units = excluded.units,
          payload = excluded.payload
      `,
        [usage.id, usage.projectId ?? null, usage.provider, usage.operation, usage.units, usage, usage.createdAt]
      );
    }

    await client.query("commit");

    return {
      projects: database.projects.length,
      prompts: database.prompts.length,
      jobs: database.jobs.length,
      uploads: database.uploads.length,
      usage: database.usage.length
    };
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    await client.end().catch(() => undefined);
  }
}

export async function readVelvetDatabase(connectionString: string): Promise<VelvetDatabase> {
  const client = createClient(connectionString);
  await client.connect();

  try {
    const projects = await client.query("select payload from velvet_projects order by created_at desc");
    const prompts = await client.query("select payload from velvet_prompts order by created_at desc");
    const jobs = await client.query("select payload from velvet_jobs order by created_at desc");
    const uploads = await client.query("select payload from velvet_uploads order by created_at desc");
    const usage = await client.query("select payload from velvet_usage order by created_at desc");

    return {
      setup: {},
      projects: projects.rows.map((row: { payload: ProjectRecord }) => row.payload),
      prompts: prompts.rows.map((row: { payload: PromptRecord }) => row.payload),
      jobs: jobs.rows.map((row: { payload: JobRecord }) => row.payload),
      uploads: uploads.rows.map((row: { payload: UploadRecord }) => row.payload),
      usage: usage.rows.map((row: { payload: UsageRecord }) => row.payload)
    };
  } finally {
    await client.end().catch(() => undefined);
  }
}

export async function upsertVelvetProject(connectionString: string, project: ProjectRecord) {
  const client = createClient(connectionString);
  await client.connect();

  try {
    await client.query(
      `
      insert into velvet_projects (id, title, status, payload, created_at, updated_at)
      values ($1, $2, $3, $4, $5, $6)
      on conflict (id) do update set
        title = excluded.title,
        status = excluded.status,
        payload = excluded.payload,
        updated_at = excluded.updated_at
    `,
      [project.id, project.title, project.status, project, project.createdAt, project.updatedAt]
    );
  } finally {
    await client.end().catch(() => undefined);
  }
}

export async function upsertVelvetPrompt(connectionString: string, prompt: PromptRecord) {
  const client = createClient(connectionString);
  await client.connect();

  try {
    await client.query(
      `
      insert into velvet_prompts (id, project_id, kind, version, payload, created_at)
      values ($1, $2, $3, $4, $5, $6)
      on conflict (id) do update set
        project_id = excluded.project_id,
        kind = excluded.kind,
        version = excluded.version,
        payload = excluded.payload
    `,
      [prompt.id, prompt.projectId, prompt.kind, prompt.version, prompt, prompt.createdAt]
    );
  } finally {
    await client.end().catch(() => undefined);
  }
}

export async function upsertVelvetJob(connectionString: string, job: JobRecord) {
  const client = createClient(connectionString);
  await client.connect();

  try {
    await client.query(
      `
      insert into velvet_jobs (id, project_id, type, status, payload, created_at, updated_at)
      values ($1, $2, $3, $4, $5, $6, $7)
      on conflict (id) do update set
        project_id = excluded.project_id,
        type = excluded.type,
        status = excluded.status,
        payload = excluded.payload,
        updated_at = excluded.updated_at
    `,
      [job.id, job.projectId ?? null, job.type, job.status, job, job.createdAt, job.updatedAt]
    );
  } finally {
    await client.end().catch(() => undefined);
  }
}

export async function upsertVelvetUpload(connectionString: string, upload: UploadRecord) {
  const client = createClient(connectionString);
  await client.connect();

  try {
    await client.query(
      `
      insert into velvet_uploads (id, project_id, status, payload, created_at)
      values ($1, $2, $3, $4, $5)
      on conflict (id) do update set
        project_id = excluded.project_id,
        status = excluded.status,
        payload = excluded.payload
    `,
      [upload.id, upload.projectId, upload.status, upload, upload.createdAt]
    );
  } finally {
    await client.end().catch(() => undefined);
  }
}

export async function upsertVelvetUsage(connectionString: string, usage: UsageRecord) {
  const client = createClient(connectionString);
  await client.connect();

  try {
    await client.query(
      `
      insert into velvet_usage (id, project_id, provider, operation, units, payload, created_at)
      values ($1, $2, $3, $4, $5, $6, $7)
      on conflict (id) do update set
        project_id = excluded.project_id,
        provider = excluded.provider,
        operation = excluded.operation,
        units = excluded.units,
        payload = excluded.payload
    `,
      [usage.id, usage.projectId ?? null, usage.provider, usage.operation, usage.units, usage, usage.createdAt]
    );
  } finally {
    await client.end().catch(() => undefined);
  }
}
