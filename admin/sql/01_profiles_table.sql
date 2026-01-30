-- ============================================
-- PROFILES TABLE
-- Stores user roles and badges
-- ============================================

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text default 'user' check (role in ('guest', 'user', 'reviewer', 'admin')),
  badge text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table profiles enable row level security;

-- Users can read their own profile
create policy "users can read own profile"
on profiles for select
using (auth.uid() = id);

-- Admins can manage all profiles
create policy "admins manage profiles"
on profiles for all
using (
  exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

-- Users can update their own profile (limited fields)
create policy "users update own profile"
on profiles for update
using (auth.uid() = id)
with check (
  auth.uid() = id
  and role = (select role from profiles where id = auth.uid()) -- can't change own role
);

-- Function to automatically create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role, badge)
  values (
    new.id,
    new.email,
    'user', -- default role
    'Contributor' -- default badge
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to update updated_at
drop trigger if exists profiles_updated_at on profiles;
create trigger profiles_updated_at
  before update on profiles
  for each row execute procedure public.handle_updated_at();
