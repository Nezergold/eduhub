-- Eduhub one-shot setup — paste entire file in Supabase SQL Editor → Run
-- Project: ptfwxyynivvtgpbqqstu

-- ─── Migration 1: app_sync ───────────────────────────────────────────────────
create table if not exists public.app_sync (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_sync enable row level security;

drop policy if exists "app_sync_select_authenticated" on public.app_sync;
drop policy if exists "app_sync_insert_authenticated" on public.app_sync;
drop policy if exists "app_sync_update_authenticated" on public.app_sync;

create policy "app_sync_select_authenticated"
  on public.app_sync for select to authenticated using (true);

drop policy if exists "app_sync_select_anon" on public.app_sync;
create policy "app_sync_select_anon"
  on public.app_sync for select to anon
  using (key = 'wawuhub_users');

create policy "app_sync_insert_authenticated"
  on public.app_sync for insert to authenticated with check (true);

create policy "app_sync_update_authenticated"
  on public.app_sync for update to authenticated using (true) with check (true);

-- ─── Migration 2: scalable profiles ──────────────────────────────────────────
do $$
begin
  if exists (select 1 from pg_type where typname = 'app_role') then
    if not exists (
      select 1 from pg_enum e join pg_type t on e.enumtypid = t.oid
      where t.typname = 'app_role' and e.enumlabel = 'registrar'
    ) then
      alter type public.app_role add value if not exists 'registrar';
    end if;
  else
    create type public.app_role as enum ('registrar', 'lecturer', 'student', 'admin');
  end if;
end $$;

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
create index if not exists idx_app_sync_updated_at on public.app_sync (updated_at desc);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_select_registrar" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_select_own"
  on public.profiles for select to authenticated using (id = auth.uid());

create policy "profiles_select_registrar"
  on public.profiles for select to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('registrar', 'admin')
  ));

create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
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
    new.id, lower(new.email),
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
  after insert on auth.users for each row execute function public.handle_new_user();

-- ─── Realtime: app_sync ──────────────────────────────────────────────────────
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'app_sync'
  ) then
    alter publication supabase_realtime add table public.app_sync;
  end if;
end $$;

-- Server-side: strip password fields from roster blob on every write
create or replace function public.app_sync_strip_password_fields(acc jsonb)
returns jsonb language plpgsql immutable as $$
declare
  result jsonb := jsonb_build_object('user', acc->'user');
  field text;
  blocked constant text[] := array['password', 'passwordhash', 'password_hash', 'passhash', 'pass_hash'];
begin
  if acc is null then return '{}'::jsonb; end if;
  for field in select jsonb_object_keys(acc) loop
    if field = 'user' then continue; end if;
    if lower(field) = any(blocked) then continue; end if;
    result := result || jsonb_build_object(field, acc->field);
  end loop;
  return result;
end;
$$;

create or replace function public.app_sync_sanitize_users_value()
returns trigger language plpgsql as $$
declare
  accounts jsonb;
  cleaned_accounts jsonb := '[]'::jsonb;
  acc jsonb;
begin
  if NEW.key <> 'wawuhub_users' then return NEW; end if;
  accounts := NEW.value->'accounts';
  if accounts is null or jsonb_typeof(accounts) <> 'array' then return NEW; end if;
  for acc in select value from jsonb_array_elements(accounts) as t(value) loop
    cleaned_accounts := cleaned_accounts || jsonb_build_array(public.app_sync_strip_password_fields(acc));
  end loop;
  NEW.value := jsonb_set(coalesce(NEW.value, '{}'::jsonb), '{accounts}', cleaned_accounts, true);
  return NEW;
end;
$$;

drop trigger if exists app_sync_sanitize_users_before_write on public.app_sync;
create trigger app_sync_sanitize_users_before_write
  before insert or update on public.app_sync
  for each row execute function public.app_sync_sanitize_users_value();

-- Defense-in-depth: AFTER trigger that verifies no password material survived storage.
-- Blocks the transaction if any account still carries a password-related field.
create or replace function public.app_sync_verify_no_passwords()
returns trigger language plpgsql as $$
declare
  acc jsonb;
  field text;
  blocked constant text[] := array['password','passwordhash','password_hash','passhash','pass_hash'];
begin
  if NEW.key <> 'wawuhub_users' then return NEW; end if;
  for acc in select value from jsonb_array_elements(coalesce(NEW.value->'accounts','[]'::jsonb)) as t(value) loop
    for field in select jsonb_object_keys(acc) loop
      if field = 'user' then continue; end if;
      if lower(field) = any(blocked) then
        raise exception 'Password material detected in app_sync wawuhub_users row — write blocked.';
      end if;
    end loop;
  end loop;
  return NEW;
end;
$$;

drop trigger if exists app_sync_verify_no_passwords_after_write on public.app_sync;
create trigger app_sync_verify_no_passwords_after_write
  before insert or update on public.app_sync
  for each row execute function public.app_sync_verify_no_passwords();

-- Scrub any legacy password material already stored in cloud roster blobs.
update public.app_sync
set value = jsonb_set(
  value,
  '{accounts}',
  coalesce(
    (
      select jsonb_agg(public.app_sync_strip_password_fields(elem))
      from jsonb_array_elements(value->'accounts') as elem
    ),
    '[]'::jsonb
  ),
  true
),
updated_at = now()
where key = 'wawuhub_users'
  and value ? 'accounts';

-- Seed empty sync rows so first push succeeds
insert into public.app_sync (key, value, updated_at)
values
  ('wawuhub_users', '{"version":3,"accounts":[]}'::jsonb, now()),
  ('wawuhub_data', '{"version":6}'::jsonb, now()),
  ('wawuhub_settings', '{}'::jsonb, now())
on conflict (key) do nothing;

-- Dev: auto-confirm emails so sign-in works immediately (disable "Confirm email" in Auth settings too)
update auth.users set email_confirmed_at = coalesce(email_confirmed_at, now()) where email_confirmed_at is null;
