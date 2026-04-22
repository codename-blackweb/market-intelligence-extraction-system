create extension if not exists "pgcrypto";

create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  begin
    insert into public.profiles (
      id,
      first_name,
      last_name,
      work_email,
      avatar_url
    )
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'first_name', ''),
      coalesce(new.raw_user_meta_data ->> 'last_name', ''),
      coalesce(new.email, ''),
      nullif(new.raw_user_meta_data ->> 'avatar_url', '')
    )
    on conflict (id) do nothing;
  exception
    when others then
      raise warning 'handle_new_auth_user profile provision failed for %: %', new.id, sqlerrm;
  end;

  begin
    insert into public.subscriptions (
      user_id,
      plan,
      status
    )
    values (
      new.id,
      'free',
      'active'
    )
    on conflict (user_id) do nothing;
  exception
    when others then
      raise warning 'handle_new_auth_user subscription provision failed for %: %', new.id, sqlerrm;
  end;

  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  work_email text not null default '',
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  primary_use_case text not null default '',
  team_size text not null default '',
  industry text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists workspaces_owner_created_idx
  on public.workspaces (owner_id, created_at desc);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null default 'member',
  invited_email text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  constraint workspace_members_identity_check
    check (user_id is not null or invited_email is not null)
);

create unique index if not exists workspace_members_workspace_user_uidx
  on public.workspace_members (workspace_id, user_id)
  where user_id is not null;

create unique index if not exists workspace_members_workspace_invited_email_uidx
  on public.workspace_members (workspace_id, invited_email)
  where invited_email is not null;

create index if not exists workspace_members_workspace_created_idx
  on public.workspace_members (workspace_id, created_at asc);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro', 'agency')),
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists subscriptions_user_id_uidx
  on public.subscriptions (user_id);

create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete set null,
  query text not null,
  market_type text not null default '',
  depth text not null default 'standard',
  result_json jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists analyses_user_created_idx
  on public.analyses (user_id, created_at desc);

create index if not exists analyses_workspace_created_idx
  on public.analyses (workspace_id, created_at desc);

create table if not exists public.shared_reports (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  public_token uuid not null default gen_random_uuid(),
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists shared_reports_analysis_uidx
  on public.shared_reports (analysis_id);

create unique index if not exists shared_reports_public_token_uidx
  on public.shared_reports (public_token);

create index if not exists shared_reports_user_created_idx
  on public.shared_reports (user_id, created_at desc);

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
before update on public.subscriptions
for each row
execute function private.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function private.handle_new_auth_user();

insert into public.profiles (
  id,
  first_name,
  last_name,
  work_email,
  avatar_url
)
select
  users.id,
  coalesce(users.raw_user_meta_data ->> 'first_name', ''),
  coalesce(users.raw_user_meta_data ->> 'last_name', ''),
  coalesce(users.email, ''),
  nullif(users.raw_user_meta_data ->> 'avatar_url', '')
from auth.users as users
on conflict (id) do nothing;

insert into public.subscriptions (
  user_id,
  plan,
  status
)
select
  users.id,
  'free',
  'active'
from auth.users as users
on conflict (user_id) do nothing;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.subscriptions enable row level security;
alter table public.analyses enable row level security;
alter table public.shared_reports enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "Owner can view workspace" on public.workspaces;
create policy "Owner can view workspace"
on public.workspaces
for select
to authenticated
using ((select auth.uid()) = owner_id);

drop policy if exists "Owner can insert workspace" on public.workspaces;
create policy "Owner can insert workspace"
on public.workspaces
for insert
to authenticated
with check ((select auth.uid()) = owner_id);

drop policy if exists "Owner can update workspace" on public.workspaces;
create policy "Owner can update workspace"
on public.workspaces
for update
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

drop policy if exists "Members can view workspace memberships" on public.workspace_members;
create policy "Members can view workspace memberships"
on public.workspace_members
for select
to authenticated
using (
  (select auth.uid()) = user_id
  or workspace_id in (
    select id
    from public.workspaces
    where owner_id = (select auth.uid())
  )
);

drop policy if exists "Owner can add members" on public.workspace_members;
create policy "Owner can add members"
on public.workspace_members
for insert
to authenticated
with check (
  workspace_id in (
    select id
    from public.workspaces
    where owner_id = (select auth.uid())
  )
);

drop policy if exists "Owner can update memberships" on public.workspace_members;
create policy "Owner can update memberships"
on public.workspace_members
for update
to authenticated
using (
  workspace_id in (
    select id
    from public.workspaces
    where owner_id = (select auth.uid())
  )
)
with check (
  workspace_id in (
    select id
    from public.workspaces
    where owner_id = (select auth.uid())
  )
);

drop policy if exists "User can view own subscription" on public.subscriptions;
create policy "User can view own subscription"
on public.subscriptions
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "User can insert own subscription" on public.subscriptions;
create policy "User can insert own subscription"
on public.subscriptions
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "User can update own subscription" on public.subscriptions;
create policy "User can update own subscription"
on public.subscriptions
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "User can view own analyses" on public.analyses;
create policy "User can view own analyses"
on public.analyses
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Public can view shared analyses" on public.analyses;
create policy "Public can view shared analyses"
on public.analyses
for select
to authenticated, anon
using (
  id in (
    select analysis_id
    from public.shared_reports
    where is_public = true
  )
);

drop policy if exists "User can insert own analyses" on public.analyses;
create policy "User can insert own analyses"
on public.analyses
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "User can update own analyses" on public.analyses;
create policy "User can update own analyses"
on public.analyses
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "User can delete own analyses" on public.analyses;
create policy "User can delete own analyses"
on public.analyses
for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "User can view own reports" on public.shared_reports;
create policy "User can view own reports"
on public.shared_reports
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "User can insert own reports" on public.shared_reports;
create policy "User can insert own reports"
on public.shared_reports
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "User can update own reports" on public.shared_reports;
create policy "User can update own reports"
on public.shared_reports
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "User can delete own reports" on public.shared_reports;
create policy "User can delete own reports"
on public.shared_reports
for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Public can view shared reports" on public.shared_reports;
create policy "Public can view shared reports"
on public.shared_reports
for select
to authenticated, anon
using (is_public = true);
