-- ============================================
-- ROLES SYSTEM - Backend-First Architecture
-- Phase 8.3: Admin System Redesign
-- ============================================

-- ============================================
-- 1. ROLES TABLE (NEW)
-- ============================================
-- Core roles table with hierarchical levels
-- Admin authority system: Backend is the ONLY source of truth

create table if not exists roles (
  id uuid primary key default gen_random_uuid(),
  name text unique not null check (name in ('visitor', 'user', 'reviewer', 'admin', 'moderator', 'ai_reviewer', 'curator')),
  level int not null,
  description text,
  created_at timestamptz default now()
);

-- Seed roles with hierarchical levels
insert into roles (name, level, description) values
  ('visitor', 0, 'Guest user without account'),
  ('user', 10, 'Logged-in user with basic permissions'),
  ('reviewer', 50, 'Can review and moderate submissions'),
  ('admin', 100, 'Full administrative access')
on conflict (name) do nothing;

-- Future roles (Phase 7+) - documented but not yet used
-- ('moderator', 60, 'Community moderator')
-- ('ai_reviewer', 40, 'AI-assisted review role')
-- ('curator', 70, 'Content curator')

-- ============================================
-- 2. USER_ROLES TABLE (NEW)
-- ============================================
-- Maps users to their roles (one primary role per user)

create table if not exists user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null references roles(id) on delete cascade,
  assigned_by uuid references auth.users(id),
  assigned_at timestamptz default now(),
  primary key (user_id, role_id)
);

-- Enable RLS
alter table user_roles enable row level security;

-- Users can read their own role assignments
create policy "users can read own role"
on user_roles for select
using (auth.uid() = user_id);

-- Only admins can assign roles (backend-enforced)
create policy "admins can assign roles"
on user_roles for all
using (
  exists (
    select 1 from user_roles ur
    join roles r on r.id = ur.role_id
    where ur.user_id = auth.uid() and r.level >= 100
  )
);

-- ============================================
-- 3. HELPER FUNCTIONS
-- ============================================

-- Get user's role level (returns highest level if multiple roles)
create or replace function get_user_role_level(user_id_param uuid)
returns int as $$
declare
  max_level int;
begin
  select coalesce(max(r.level), 0)
  into max_level
  from user_roles ur
  join roles r on r.id = ur.role_id
  where ur.user_id = user_id_param;
  
  return max_level;
end;
$$ language plpgsql security definer;

-- Get user's primary role name
create or replace function get_user_role_name(user_id_param uuid)
returns text as $$
declare
  role_name text;
begin
  select r.name
  into role_name
  from user_roles ur
  join roles r on r.id = ur.role_id
  where ur.user_id = user_id_param
  order by r.level desc
  limit 1;
  
  -- Default to 'user' if logged in but no role assigned
  if role_name is null and user_id_param is not null then
    return 'user';
  end if;
  
  return coalesce(role_name, 'visitor');
end;
$$ language plpgsql security definer;

-- ============================================
-- 4. IS_ADMIN FUNCTION (MANDATORY)
-- ============================================
-- Backend-only admin verification
-- This is the SINGLE SOURCE OF TRUTH for admin access

create or replace function is_admin(user_id_param uuid)
returns boolean as $$
declare
  user_level int;
begin
  -- Get user's role level
  user_level := get_user_role_level(user_id_param);
  
  -- Admin requires level >= 100
  return user_level >= 100;
end;
$$ language plpgsql security definer;

-- Convenience function for current user
create or replace function is_current_user_admin()
returns boolean as $$
begin
  return is_admin(auth.uid());
end;
$$ language plpgsql security definer;

-- ============================================
-- 5. ROLE ASSIGNMENT FUNCTION (RPC)
-- ============================================
-- Backend function for role assignment (admin only)

create or replace function assign_role(
  target_user_id uuid,
  role_name_param text
)
returns json as $$
declare
  role_record record;
  is_admin_user boolean;
begin
  -- Check if current user is admin
  is_admin_user := is_admin(auth.uid());
  
  if not is_admin_user then
    return json_build_object(
      'success', false,
      'error', 'Unauthorized: Only admins can assign roles'
    );
  end if;
  
  -- Get role by name
  select * into role_record from roles where name = role_name_param;
  
  if role_record is null then
    return json_build_object(
      'success', false,
      'error', 'Invalid role name'
    );
  end if;
  
  -- Remove existing roles for user (one primary role)
  delete from user_roles where user_id = target_user_id;
  
  -- Assign new role
  insert into user_roles (user_id, role_id, assigned_by)
  values (target_user_id, role_record.id, auth.uid());
  
  return json_build_object(
    'success', true,
    'role', role_name_param,
    'level', role_record.level
  );
end;
$$ language plpgsql security definer;

-- ============================================
-- 6. MIGRATE EXISTING PROFILES
-- ============================================
-- Migrate existing role data from profiles to user_roles

do $$
declare
  profile_record record;
  role_record record;
begin
  -- Migrate all existing profiles
  for profile_record in 
    select id, role from profiles where role is not null
  loop
    -- Get the role_id for this role name
    select id into role_record from roles where name = profile_record.role;
    
    if role_record is not null then
      -- Insert into user_roles if not exists
      insert into user_roles (user_id, role_id)
      values (profile_record.id, role_record.id)
      on conflict (user_id, role_id) do nothing;
    end if;
  end loop;
end $$;

-- ============================================
-- 7. UPDATE PROFILES TABLE (DEPRECATE ROLE COLUMN)
-- ============================================
-- Keep profiles.role for backward compatibility during transition
-- But it should be considered read-only and populated from user_roles

-- Add comment to indicate deprecation
comment on column profiles.role is 'DEPRECATED: Use user_roles table and get_user_role_name() function instead';
comment on column profiles.badge is 'DISPLAY ONLY: Badge text for UI, computed from role';

-- ============================================
-- 8. TRIGGER: Auto-assign 'user' role on signup
-- ============================================

create or replace function handle_new_user_role()
returns trigger as $$
declare
  user_role_id uuid;
begin
  -- Get 'user' role ID
  select id into user_role_id from roles where name = 'user';
  
  -- Assign default 'user' role
  if user_role_id is not null then
    insert into user_roles (user_id, role_id)
    values (new.id, user_role_id)
    on conflict (user_id, role_id) do nothing;
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

-- Drop old trigger if exists
drop trigger if exists on_auth_user_created_role on auth.users;

-- Create new trigger
create trigger on_auth_user_created_role
  after insert on auth.users
  for each row execute procedure handle_new_user_role();

-- ============================================
-- END OF ROLES SYSTEM
-- ============================================
