# Backend

## Tables

### `roles`

Maps each user to a role level.

```sql
create table roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users on delete cascade,
  level integer not null default 0,
  created_at timestamptz default now()
);
```

| Level | Role | Access |
|---|---|---|
| 0 | Visitor | Browse only |
| 10 | Contributor | Upload papers |
| 80 | Reviewer | Approve/reject submissions |
| 100 | Admin | Full access |

### `submissions`

Tracks uploaded papers and their review status.

```sql
create table submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  paper_code text,
  exam_year int,
  temp_path text,
  approved_path text,
  status text default 'pending',
  created_at timestamptz default now()
);
```

## RLS Rules

All tables have Row-Level Security enabled. See [RLS_POLICY.md](RLS_POLICY.md) for full details.

### Key Policies

- Users can **select** their own submissions
- Users can **insert** their own submissions (`auth.uid() = user_id`)
- Admins/Reviewers (level ≥ 80) can bypass insert restriction
- Admins/Reviewers can **select** and **update** all submissions

## RPC Functions

### `get_current_user_role_level()`

Returns the role level for the currently authenticated user. Falls back to `0` (Visitor) if no role record exists.

```sql
create or replace function get_current_user_role_level()
returns integer
language sql security definer
as $$
  select coalesce(
    (select level from roles where user_id = auth.uid() limit 1),
    0
  );
$$;
```

### `get_user_role_name(user_id_param uuid)`

Returns the human-readable role name for a given user ID.

```sql
-- Returns: 'admin', 'reviewer', 'contributor', or 'visitor'
```

### `is_admin(user_id_param uuid)`

Returns `true` if the user has role level ≥ 100.

## Auto-Role Assignment

A database trigger automatically assigns level 10 (Contributor) to every new user on signup:

```sql
create or replace function handle_new_user_role()
returns trigger security definer language plpgsql
as $$
begin
  insert into roles (user_id, level)
  values (new.id, 10)
  on conflict (user_id) do nothing;
  return new;
end;
$$;
```

## Admin Bypass Logic

Admins and Reviewers (level ≥ 80) can:
- View all submissions regardless of ownership
- Update submission status (approve/reject)
- Insert submissions (bypass `auth.uid() = user_id` check)

## Insert Flow

1. Frontend calls `supabase.auth.getUser()` to get fresh user ID
2. File uploaded to `uploads-temp` storage bucket
3. Submission record inserted into `submissions` table with `user_id` and `status: 'pending'`
4. RLS validates: `auth.uid() = user_id` OR caller has role level ≥ 80
5. If insert fails, uploaded file is cleaned up from storage

## SQL Setup Scripts

Run these in order in the Supabase SQL Editor:

| Order | File | Purpose |
|---|---|---|
| 1 | `admin/sql/01_profiles_table.sql` | User profiles table |
| 2 | `admin/sql/02_submissions_table.sql` | Submissions table + RLS |
| 3 | `admin/sql/03_storage_buckets.sql` | Storage bucket creation |
| 4 | `admin/sql/04_storage_policies.sql` | Storage access policies |
| 5 | `admin/sql/05_roles_system.sql` | Roles table + RPC functions |
| 6 | `admin/sql/06_approved_papers.sql` | Approved papers view |
| 7 | `admin/sql/07_add_approved_path_column.sql` | Migration: approved_path column |
