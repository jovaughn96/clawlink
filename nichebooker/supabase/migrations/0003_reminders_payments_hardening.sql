alter table appointments add column if not exists deposit_payment_intent_id text;

create table if not exists message_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  appointment_id uuid references appointments(id) on delete set null,
  channel text not null,
  recipient text,
  template_key text,
  status text not null default 'queued',
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create table if not exists reminder_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  appointment_id uuid not null references appointments(id) on delete cascade,
  reminder_type text not null check (reminder_type in ('24h','2h')),
  scheduled_for timestamptz not null,
  status text not null default 'pending' check (status in ('pending','processing','sent','failed','cancelled')),
  attempts int not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  unique (appointment_id, reminder_type)
);

create table if not exists stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);

alter table message_logs enable row level security;
alter table reminder_jobs enable row level security;

create policy "workspace scoped message logs" on message_logs
for all using (
  exists (select 1 from workspace_users wu where wu.workspace_id = message_logs.workspace_id and wu.user_id = auth.uid())
)
with check (
  exists (select 1 from workspace_users wu where wu.workspace_id = message_logs.workspace_id and wu.user_id = auth.uid())
);

create policy "workspace scoped reminder jobs" on reminder_jobs
for all using (
  exists (select 1 from workspace_users wu where wu.workspace_id = reminder_jobs.workspace_id and wu.user_id = auth.uid())
)
with check (
  exists (select 1 from workspace_users wu where wu.workspace_id = reminder_jobs.workspace_id and wu.user_id = auth.uid())
);
