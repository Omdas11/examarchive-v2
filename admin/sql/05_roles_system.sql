-- ============================================
-- ROLES SYSTEM — Clean Architecture
-- ============================================
-- Single table mapping user_id → level.
-- No separate user_roles join table; no seed data needed.
--
-- Role Levels:
--   0   = visitor  (default / unauthenticated)
--   10  = user
--   50  = reviewer
--   80  = moderator
--   100 = admin
-- ============================================

-- ============================================
-- 1. ROLES TABLE
-- ============================================

create table if not exists roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users on delete cascade,
  level integer not null default 0,
  created_at timestamptz default now()
);

-- Index for fast lookups
create index if not exists roles_user_id_idx on roles (user_id);

-- Enable RLS
alter table roles enable row level security;

-- Users can read their own role
create policy "users read own role"
on roles for select
using (auth.uid() = user_id);

-- Admins can manage all roles
create policy "admins manage roles"
on roles for all
using (
  coalesce(
    (select level from roles where user_id = auth.uid() limit 1),
    0
  ) >= 100
);

-- ============================================
-- 2. CORE RPC: get_current_user_role_level()
-- ============================================

create or replace function get_current_user_role_level()
returns integer
language sql
security definer
set search_path = public
as $$
  select coalesce(
    (select level from roles where user_id = auth.uid() limit 1),
    0
  );
$$;

-- ============================================
-- 3. BACKWARD-COMPATIBLE HELPER FUNCTIONS
-- ============================================

-- Get role level for any user
create or replace function get_user_role_level(user_id_param uuid)
returns integer
language sql
security definer
set search_path = public
as $$
  select coalesce(
    (select level from roles where user_id = user_id_param limit 1),
    0
  );
$$;

-- Map a user's level to a human-readable role name
create or replace function get_user_role_name(user_id_param uuid)
returns text
language sql
security definer
set search_path = public
as $$
  select case coalesce(
           (select level from roles where user_id = user_id_param limit 1),
           0
         )
    when 100 then 'admin'
    when 80  then 'moderator'
    when 50  then 'reviewer'
    when 10  then 'user'
    else          'visitor'
  end;
$$;

-- Check whether a given user is an admin (level >= 100)
create or replace function is_admin(user_id_param uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce(
    (select level from roles where user_id = user_id_param limit 1),
    0
  ) >= 100;
$$;

-- Convenience: is the current session user an admin?
create or replace function is_current_user_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce(
    (select level from roles where user_id = auth.uid() limit 1),
    0
  ) >= 100;
$$;

-- ============================================
-- 4. TRIGGER: Auto-assign 'user' role on signup
-- ============================================

create or replace function handle_new_user_role()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
  insert into roles (user_id, level)
  values (new.id, 10)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_role on auth.users;

create trigger on_auth_user_created_role
  after insert on auth.users
  for each row execute procedure handle_new_user_role();

-- ============================================
-- END OF ROLES SYSTEM
-- ============================================
