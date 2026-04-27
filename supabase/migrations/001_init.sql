-- AI-Powered Power BI Analytics — core schema (run in Supabase SQL editor)

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  dataset_id text not null,
  dataset_name text,
  group_id text not null,
  payload jsonb not null default '{}',
  insights jsonb,
  row_count integer,
  schema_checksum text,
  refresh_warning text,
  last_refreshed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_reports_user on public.reports (user_id, created_at desc);

create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text,
  dataset_id text not null,
  dataset_name text,
  group_id text not null,
  frequency text not null check (frequency in ('daily', 'weekly')),
  cron_expr text not null,
  timezone text not null default 'UTC',
  recipient_email text not null,
  hour_utc smallint default 8,
  enabled boolean default true,
  next_run_at timestamptz,
  last_run_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_schedules_next on public.schedules (enabled, next_run_at);

create table if not exists public.schedule_runs (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.schedules (id) on delete cascade,
  status text not null,
  message text,
  report_id uuid references public.reports (id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  report_id uuid references public.reports (id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  meta jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_chat_session on public.chat_messages (session_id, created_at);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  status text not null default 'pending',
  report_id uuid references public.reports (id) on delete cascade,
  payload jsonb,
  result jsonb,
  error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_jobs_pending on public.jobs (status, created_at);

create table if not exists public.api_logs (
  id bigserial primary key,
  user_id uuid,
  route text,
  status_code int,
  duration_ms int,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.reports enable row level security;
alter table public.schedules enable row level security;
alter table public.schedule_runs enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.jobs enable row level security;

-- Policies: users can only see own rows (direct Supabase client). Backend uses service role and bypasses RLS.

create policy "profiles_own" on public.profiles for all using (auth.uid() = id);
create policy "reports_own" on public.reports for all using (auth.uid() = user_id);
create policy "schedules_own" on public.schedules for all using (auth.uid() = user_id);
create policy "schedule_runs_own" on public.schedule_runs for all
  using (exists (select 1 from public.schedules s where s.id = schedule_id and s.user_id = auth.uid()));
create policy "chat_sessions_own" on public.chat_sessions for all using (auth.uid() = user_id);
create policy "chat_messages_own" on public.chat_messages for all
  using (exists (select 1 from public.chat_sessions c where c.id = session_id and c.user_id = auth.uid()));
create policy "jobs_own" on public.jobs for all using (auth.uid() = user_id);
