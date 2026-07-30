-- Supabase RBAC + Lecturer Portal schema
-- Run as a migration in Supabase SQL editor.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('admin', 'lecturer', 'student');
  end if;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  username text not null unique,
  role public.app_role not null,
  full_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_email_lowercase check (email = lower(email)),
  constraint profiles_username_lowercase check (username = lower(username))
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  course_code text not null unique,
  title text not null,
  semester text,
  lecturer_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  unique (student_id, course_id)
);

create table if not exists public.results (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  grade text not null,
  updated_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, course_id)
);

create table if not exists public.course_materials (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  file_url text not null,
  file_name text not null,
  uploaded_by uuid not null references public.profiles(id) on delete restrict,
  uploaded_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  role public.app_role,
  action text not null,
  "timestamp" timestamptz not null default now(),
  ip_address inet
);

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_courses_lecturer_id on public.courses(lecturer_id);
create index if not exists idx_enrollments_student_id on public.enrollments(student_id);
create index if not exists idx_enrollments_course_id on public.enrollments(course_id);
create index if not exists idx_results_student_id on public.results(student_id);
create index if not exists idx_results_course_id on public.results(course_id);
create index if not exists idx_course_materials_course_id on public.course_materials(course_id);
create index if not exists idx_activity_logs_user_id on public.activity_logs(user_id);
create index if not exists idx_activity_logs_timestamp on public.activity_logs("timestamp" desc);

create or replace function public.current_role()
returns public.app_role
language sql
stable
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select public.current_role() = 'admin'::public.app_role
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_touch_updated_at on public.profiles;
create trigger trg_profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists trg_courses_touch_updated_at on public.courses;
create trigger trg_courses_touch_updated_at
before update on public.courses
for each row execute function public.touch_updated_at();

drop trigger if exists trg_results_touch_updated_at on public.results;
create trigger trg_results_touch_updated_at
before update on public.results
for each row execute function public.touch_updated_at();

-- Activity logging: use SECURITY DEFINER so inserts are guaranteed from triggers.
create or replace function public.log_activity(p_action text, p_ip inet default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_role public.app_role;
begin
  if v_user_id is not null then
    select role into v_role from public.profiles where id = v_user_id;
  end if;

  insert into public.activity_logs (user_id, role, action, ip_address)
  values (v_user_id, v_role, p_action, p_ip);
end;
$$;

create or replace function public.trg_log_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  entity text := tg_table_name;
  action_name text := tg_op;
begin
  perform public.log_activity(
    format('%s %s id=%s', action_name, entity, coalesce((to_jsonb(new)->>'id'), (to_jsonb(old)->>'id')))
  );
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_courses_log on public.courses;
create trigger trg_courses_log
after insert or update or delete on public.courses
for each row execute function public.trg_log_mutation();

drop trigger if exists trg_results_log on public.results;
create trigger trg_results_log
after insert or update or delete on public.results
for each row execute function public.trg_log_mutation();

drop trigger if exists trg_profiles_log on public.profiles;
create trigger trg_profiles_log
after insert or update or delete on public.profiles
for each row execute function public.trg_log_mutation();

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.enrollments enable row level security;
alter table public.results enable row level security;
alter table public.course_materials enable row level security;
alter table public.activity_logs enable row level security;

-- PROFILES
drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all"
on public.profiles
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "profiles_self_select" on public.profiles;
create policy "profiles_self_select"
on public.profiles
for select
using (id = auth.uid());

drop policy if exists "profiles_lecturer_select_students_in_courses" on public.profiles;
create policy "profiles_lecturer_select_students_in_courses"
on public.profiles
for select
using (
  public.current_role() = 'lecturer'::public.app_role
  and role = 'student'::public.app_role
  and exists (
    select 1
    from public.enrollments e
    join public.courses c on c.id = e.course_id
    where e.student_id = profiles.id
      and c.lecturer_id = auth.uid()
  )
);

-- COURSES
drop policy if exists "courses_admin_all" on public.courses;
create policy "courses_admin_all"
on public.courses
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "courses_lecturer_select_assigned" on public.courses;
create policy "courses_lecturer_select_assigned"
on public.courses
for select
using (
  public.current_role() = 'lecturer'::public.app_role
  and lecturer_id = auth.uid()
);

drop policy if exists "courses_student_select_enrolled" on public.courses;
create policy "courses_student_select_enrolled"
on public.courses
for select
using (
  public.current_role() = 'student'::public.app_role
  and exists (
    select 1 from public.enrollments e
    where e.course_id = courses.id and e.student_id = auth.uid()
  )
);

-- ENROLLMENTS
drop policy if exists "enrollments_admin_all" on public.enrollments;
create policy "enrollments_admin_all"
on public.enrollments
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "enrollments_lecturer_select_own_courses" on public.enrollments;
create policy "enrollments_lecturer_select_own_courses"
on public.enrollments
for select
using (
  public.current_role() = 'lecturer'::public.app_role
  and exists (
    select 1 from public.courses c
    where c.id = enrollments.course_id
      and c.lecturer_id = auth.uid()
  )
);

drop policy if exists "enrollments_student_select_own" on public.enrollments;
create policy "enrollments_student_select_own"
on public.enrollments
for select
using (
  public.current_role() = 'student'::public.app_role
  and student_id = auth.uid()
);

-- RESULTS
drop policy if exists "results_admin_all" on public.results;
create policy "results_admin_all"
on public.results
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "results_lecturer_select" on public.results;
create policy "results_lecturer_select"
on public.results
for select
using (
  public.current_role() = 'lecturer'::public.app_role
  and exists (
    select 1
    from public.courses c
    join public.enrollments e on e.course_id = c.id
    where c.id = results.course_id
      and c.lecturer_id = auth.uid()
      and e.student_id = results.student_id
  )
);

drop policy if exists "results_lecturer_insert" on public.results;
create policy "results_lecturer_insert"
on public.results
for insert
with check (
  public.current_role() = 'lecturer'::public.app_role
  and updated_by = auth.uid()
  and exists (
    select 1
    from public.courses c
    join public.enrollments e on e.course_id = c.id
    where c.id = results.course_id
      and c.lecturer_id = auth.uid()
      and e.student_id = results.student_id
  )
);

drop policy if exists "results_lecturer_update" on public.results;
create policy "results_lecturer_update"
on public.results
for update
using (
  public.current_role() = 'lecturer'::public.app_role
  and exists (
    select 1
    from public.courses c
    join public.enrollments e on e.course_id = c.id
    where c.id = results.course_id
      and c.lecturer_id = auth.uid()
      and e.student_id = results.student_id
  )
)
with check (
  public.current_role() = 'lecturer'::public.app_role
  and updated_by = auth.uid()
  and exists (
    select 1
    from public.courses c
    join public.enrollments e on e.course_id = c.id
    where c.id = results.course_id
      and c.lecturer_id = auth.uid()
      and e.student_id = results.student_id
  )
);

drop policy if exists "results_student_select_own" on public.results;
create policy "results_student_select_own"
on public.results
for select
using (
  public.current_role() = 'student'::public.app_role
  and student_id = auth.uid()
);

-- COURSE MATERIALS
drop policy if exists "materials_admin_all" on public.course_materials;
create policy "materials_admin_all"
on public.course_materials
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "materials_lecturer_select" on public.course_materials;
create policy "materials_lecturer_select"
on public.course_materials
for select
using (
  public.current_role() = 'lecturer'::public.app_role
  and exists (
    select 1 from public.courses c
    where c.id = course_materials.course_id
      and c.lecturer_id = auth.uid()
  )
);

drop policy if exists "materials_lecturer_insert" on public.course_materials;
create policy "materials_lecturer_insert"
on public.course_materials
for insert
with check (
  public.current_role() = 'lecturer'::public.app_role
  and uploaded_by = auth.uid()
  and exists (
    select 1 from public.courses c
    where c.id = course_materials.course_id
      and c.lecturer_id = auth.uid()
  )
);

drop policy if exists "materials_lecturer_update" on public.course_materials;
create policy "materials_lecturer_update"
on public.course_materials
for update
using (
  public.current_role() = 'lecturer'::public.app_role
  and exists (
    select 1 from public.courses c
    where c.id = course_materials.course_id
      and c.lecturer_id = auth.uid()
  )
)
with check (
  public.current_role() = 'lecturer'::public.app_role
  and uploaded_by = auth.uid()
  and exists (
    select 1 from public.courses c
    where c.id = course_materials.course_id
      and c.lecturer_id = auth.uid()
  )
);

drop policy if exists "materials_student_select_enrolled_courses" on public.course_materials;
create policy "materials_student_select_enrolled_courses"
on public.course_materials
for select
using (
  public.current_role() = 'student'::public.app_role
  and exists (
    select 1
    from public.enrollments e
    where e.course_id = course_materials.course_id
      and e.student_id = auth.uid()
  )
);

-- ACTIVITY LOGS
drop policy if exists "activity_logs_admin_all" on public.activity_logs;
create policy "activity_logs_admin_all"
on public.activity_logs
for all
using (public.is_admin())
with check (public.is_admin());

-- Optional RPC helper for admin profile creation (without password handling).
create or replace function public.admin_create_profile(
  p_user_id uuid,
  p_email text,
  p_username text,
  p_role public.app_role,
  p_full_name text
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted public.profiles;
begin
  if not public.is_admin() then
    raise exception 'Only admins can create profiles';
  end if;

  insert into public.profiles (id, email, username, role, full_name)
  values (p_user_id, lower(p_email), lower(p_username), p_role, p_full_name)
  returning * into inserted;

  perform public.log_activity(format('ADMIN_CREATE_PROFILE user_id=%s role=%s', p_user_id, p_role));
  return inserted;
end;
$$;
