-- Allow sign-in page on any device/browser to pull the institutional roster before auth.
-- Write access remains authenticated-only.

drop policy if exists "app_sync_select_anon" on public.app_sync;

create policy "app_sync_select_anon"
  on public.app_sync for select
  to anon
  using (true);
