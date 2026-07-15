create table if not exists public.velvet_projects (
  id text primary key,
  title text not null,
  status text not null,
  payload jsonb not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists public.velvet_prompts (
  id text primary key,
  project_id text,
  kind text not null,
  version integer not null,
  payload jsonb not null,
  created_at timestamptz not null
);

create table if not exists public.velvet_jobs (
  id text primary key,
  project_id text,
  type text not null,
  status text not null,
  payload jsonb not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists public.velvet_uploads (
  id text primary key,
  project_id text not null,
  status text not null,
  payload jsonb not null,
  created_at timestamptz not null
);

create table if not exists public.velvet_usage (
  id text primary key,
  project_id text,
  provider text not null,
  operation text not null,
  units jsonb not null,
  payload jsonb not null,
  created_at timestamptz not null
);
