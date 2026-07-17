-- Restrict anonymous reads to the public roster key only.
-- Portal data and settings require an authenticated session.
-- Password material must never appear in the shared roster blob (enforced client-side).

drop policy if exists "app_sync_select_anon" on public.app_sync;

create policy "app_sync_select_anon"
  on public.app_sync for select
  to anon
  using (key = 'wawuhub_users');
