-- Scalable profiles + sync improvements for 1M+ users
-- Run after 20250617120000_app_sync.sql

-- Extend app_role to include registrar (maps to app "registrar" portal)
do $$
begin
  if exists (select 1 from pg_type where typname = 'app_role') then
    if not exists (
      select 1 from pg_enum e
      join pg_type t on e.enumtypid = t.oid
      where t.typname = 'app_role' and e.enumlabel = 'registrar'
    ) then
      alter type public.app_role add value if not exists 'registrar';
    end if;
  else
    create type public.app_role as enum ('registrar', 'lecturer', 'student', 'admin');
  end if;
end $$;

-- High-scale profile index (UUID PK from auth.users — scales to millions)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  username text not null,
  role public.app_role not null,
  full_name text not null,
  matric_no text,
  staff_id text,
  department text,
  faculty text,
  level text,
  semester smallint,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_email_lowercase check (email = lower(email)),
  constraint profiles_username_lowercase check (username = lower(username))
);

create unique index if not exists idx_profiles_email on public.profiles (email);
create unique index if not exists idx_profiles_username on public.profiles (username);
create index if not exists idx_profiles_role on public.profiles (role);
create index if not exists idx_profiles_department on public.profiles (department) where department is not null;
create index if not exists idx_profiles_matric on public.profiles (matric_no) where matric_no is not null;
create index if not exists idx_profiles_staff on public.profiles (staff_id) where staff_id is not null;
create index if not exists idx_profiles_created_at on public.profiles (created_at desc);

-- Faster app_sync lookups under load
create index if not exists idx_app_sync_updated_at on public.app_sync (updated_at desc);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_select_registrar" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "profiles_select_registrar"
  on public.profiles for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('registrar', 'admin')
    )
  );

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Auto-create profile row when Supabase Auth user is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta_role text := coalesce(new.raw_user_meta_data->>'role', 'student');
  mapped_role public.app_role;
begin
  mapped_role := case meta_role
    when 'registrar' then 'registrar'::public.app_role
    when 'admin' then 'admin'::public.app_role
    when 'lecturer' then 'lecturer'::public.app_role
    else 'student'::public.app_role
  end;

  insert into public.profiles (id, email, username, role, full_name)
  values (
    new.id,
    lower(new.email),
    lower(coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))),
    mapped_role,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

comment on table public.profiles is 'Scalable user directory (1M+ rows). Indexed for role/department lookups.';
comment on table public.app_sync is 'Institutional blob sync bridge. Migrate to normalized tables at scale.';
