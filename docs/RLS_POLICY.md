# RLS Policy

## Overview

Row-Level Security (RLS) is enabled on all tables. Policies control who can read, insert, and update data based on the authenticated user's identity and role level.

## Submissions Table

### Select Policies

**Users see own submissions:**

```sql
create policy "users see own submissions"
on submissions for select
using (auth.uid() = user_id);
```

**Reviewers see all submissions (level ≥ 80):**

```sql
create policy "reviewers see all submissions"
on submissions for select
using (get_current_user_role_level() >= 80);
```

### Insert Policy

**Users insert own submissions + admin bypass:**

```sql
create policy "users insert own submissions"
on submissions for insert
with check (
  auth.uid() = user_id
  or get_current_user_role_level() >= 80
);
```

This allows:
- Authenticated users to insert submissions where `user_id` matches their own `auth.uid()`
- Admins and Reviewers (level ≥ 80) to insert submissions regardless of `user_id`

This prevents:
- NULL `user_id` inserts (unless admin/reviewer)
- Regular users inserting submissions for other users
- Unauthenticated insertions

### Update Policy

**Reviewers update submissions (level ≥ 80):**

```sql
create policy "reviewers update submissions"
on submissions for update
using (get_current_user_role_level() >= 80)
with check (get_current_user_role_level() >= 80);
```

## Roles Table

### Select Policy

**Users read own role:**

```sql
create policy "users read own role"
on roles for select
using (auth.uid() = user_id);
```

### Admin Management

**Admins manage all roles (level ≥ 100):**

```sql
create policy "admins manage roles"
on roles for all
using (
  coalesce(
    (select level from roles where user_id = auth.uid() limit 1),
    0
  ) >= 100
);
```

## Admin Bypass Logic

The admin bypass works through `get_current_user_role_level()`:

```sql
create or replace function get_current_user_role_level()
returns integer language sql security definer
as $$
  select coalesce(
    (select level from roles where user_id = auth.uid() limit 1),
    0
  );
$$;
```

- Uses `security definer` so it runs with the function owner's permissions
- Falls back to `0` (Visitor) if no role record exists
- Called in RLS policies to check role-based access

## How to Modify Safely

1. **Test in Supabase SQL Editor** before applying to production
2. **Never disable RLS** — always add new policies instead
3. **Use `security definer`** for RPC functions that need to bypass RLS
4. **Check both `using` and `with check`** when creating update policies
5. **Verify with debug panel** — RLS errors appear as `[RLS]` with red border
