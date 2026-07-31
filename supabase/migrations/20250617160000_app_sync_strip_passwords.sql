-- Server-side enforcement: password material must never persist in app_sync,
-- including the world-readable wawuhub_users roster row.

create or replace function public.app_sync_strip_password_fields(acc jsonb)
returns jsonb
language plpgsql
immutable
as $$
declare
  result jsonb := jsonb_build_object('user', acc->'user');
  field text;
  blocked constant text[] := array[
    'password', 'passwordhash', 'password_hash', 'passhash', 'pass_hash'
  ];
begin
  if acc is null then
    return '{}'::jsonb;
  end if;

  for field in select jsonb_object_keys(acc)
  loop
    if field = 'user' then
      continue;
    end if;
    if lower(field) = any(blocked) then
      continue;
    end if;
    result := result || jsonb_build_object(field, acc->field);
  end loop;

  return result;
end;
$$;

create or replace function public.app_sync_sanitize_users_value()
returns trigger
language plpgsql
as $$
declare
  accounts jsonb;
  cleaned_accounts jsonb := '[]'::jsonb;
  acc jsonb;
begin
  if NEW.key <> 'wawuhub_users' then
    return NEW;
  end if;

  accounts := NEW.value->'accounts';
  if accounts is null or jsonb_typeof(accounts) <> 'array' then
    return NEW;
  end if;

  for acc in select value from jsonb_array_elements(accounts) as t(value)
  loop
    cleaned_accounts := cleaned_accounts || jsonb_build_array(public.app_sync_strip_password_fields(acc));
  end loop;

  NEW.value := jsonb_set(
    coalesce(NEW.value, '{}'::jsonb),
    '{accounts}',
    cleaned_accounts,
    true
  );

  return NEW;
end;
$$;

drop trigger if exists app_sync_sanitize_users_before_write on public.app_sync;

create trigger app_sync_sanitize_users_before_write
  before insert or update on public.app_sync
  for each row
  execute function public.app_sync_sanitize_users_value();

-- Scrub legacy password material already stored in cloud roster blobs.
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
