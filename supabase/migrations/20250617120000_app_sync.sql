-- Cross-device institutional data sync (users + portal state)
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
  on public.app_sync for select
  to authenticated
  using (true);

drop policy if exists "app_sync_select_anon" on public.app_sync;
create policy "app_sync_select_anon"
  on public.app_sync for select
  to anon
  using (true);

create policy "app_sync_insert_authenticated"
  on public.app_sync for insert
  to authenticated
  with check (true);

create policy "app_sync_update_authenticated"
  on public.app_sync for update
  to authenticated
  using (true)
  with check (true);

-- Realtime: enable in Supabase Dashboard → Database → Replication if not auto-enabled
