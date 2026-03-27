create extension if not exists "pgcrypto";

create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  query text not null,
  market_type text not null default '',
  depth text not null default 'standard',
  result_json jsonb not null,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists analyses_user_created_idx
  on public.analyses (user_id, created_at desc);

create index if not exists analyses_public_created_idx
  on public.analyses (is_public, created_at desc);

create table if not exists public.user_profiles (
  user_id text primary key,
  plan text not null default 'free' check (plan in ('free', 'pro', 'agency')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles
  add column if not exists email text default '',
  add column if not exists first_name text default '',
  add column if not exists last_name text default '',
  add column if not exists default_workspace_id uuid;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null,
  name text not null,
  use_case text not null default '',
  team_size text not null default '',
  industry text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists workspaces_owner_created_idx
  on public.workspaces (owner_id, created_at desc);

create table if not exists public.workspace_invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  role text not null default 'member',
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists workspace_invites_workspace_created_idx
  on public.workspace_invites (workspace_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_profiles_set_updated_at on public.user_profiles;

create trigger user_profiles_set_updated_at
before update on public.user_profiles
for each row
execute function public.set_updated_at();
