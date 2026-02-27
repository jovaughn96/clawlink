create table if not exists workspace_users (
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'member' check (role in ('owner','admin','member')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

alter table workspaces enable row level security;
alter table workspace_users enable row level security;
alter table clients enable row level security;
alter table services enable row level security;
alter table appointments enable row level security;

create policy "workspace members can read workspaces" on workspaces
for select using (
  exists (
    select 1 from workspace_users wu
    where wu.workspace_id = workspaces.id and wu.user_id = auth.uid()
  )
);

create policy "owner can create workspace" on workspaces
for insert with check (owner_user_id = auth.uid());

create policy "workspace members can read workspace_users" on workspace_users
for select using (
  user_id = auth.uid() or exists (
    select 1 from workspace_users wu where wu.workspace_id = workspace_users.workspace_id and wu.user_id = auth.uid()
  )
);

create policy "members can add themselves at workspace creation" on workspace_users
for insert with check (user_id = auth.uid());

create policy "workspace scoped clients" on clients
for all using (
  exists (select 1 from workspace_users wu where wu.workspace_id = clients.workspace_id and wu.user_id = auth.uid())
)
with check (
  exists (select 1 from workspace_users wu where wu.workspace_id = clients.workspace_id and wu.user_id = auth.uid())
);

create policy "workspace scoped services" on services
for all using (
  exists (select 1 from workspace_users wu where wu.workspace_id = services.workspace_id and wu.user_id = auth.uid())
)
with check (
  exists (select 1 from workspace_users wu where wu.workspace_id = services.workspace_id and wu.user_id = auth.uid())
);

create policy "workspace scoped appointments" on appointments
for all using (
  exists (select 1 from workspace_users wu where wu.workspace_id = appointments.workspace_id and wu.user_id = auth.uid())
)
with check (
  exists (select 1 from workspace_users wu where wu.workspace_id = appointments.workspace_id and wu.user_id = auth.uid())
);

create table if not exists niche_configs (
  niche_key text primary key,
  version int not null default 1,
  schema_json jsonb not null,
  templates_json jsonb not null,
  defaults_json jsonb not null,
  active boolean not null default true
);

insert into niche_configs (niche_key, schema_json, templates_json, defaults_json)
values (
  'lash-tech',
  '{"clientFields":[{"key":"allergies","type":"text"}]}'::jsonb,
  '{"booking_confirmation":"You are booked for {{service}} on {{date}}"}'::jsonb,
  '{"depositType":"percent","depositValue":30}'::jsonb
)
on conflict (niche_key) do nothing;
