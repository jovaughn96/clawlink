create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid not null,
  niche_key text not null check (niche_key in ('lash-tech', 'mobile-detailer', 'tutor')),
  plan text not null default 'free' check (plan in ('free', 'pro', 'premium')),
  created_at timestamptz not null default now()
);

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  tags_json jsonb not null default '[]'::jsonb,
  custom_fields_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  duration_min int not null,
  price_cents int not null,
  deposit_type text not null default 'none' check (deposit_type in ('none', 'fixed', 'percent')),
  deposit_value int not null default 0,
  is_active boolean not null default true,
  custom_fields_json jsonb not null default '{}'::jsonb
);

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  service_id uuid not null references services(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text not null,
  subtotal_cents int not null,
  deposit_required_cents int not null default 0,
  deposit_paid_cents int not null default 0,
  location_text text,
  notes text,
  custom_fields_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
