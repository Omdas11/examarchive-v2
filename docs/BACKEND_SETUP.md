# Backend Setup

> Phase 1 — Single SQL Architecture

## Supabase Project

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Note your project URL and anon key
3. Update `js/supabase.js` with your credentials

## SQL Setup

Run SQL scripts from `admin/sql/` in the Supabase SQL Editor in order:

| Order | Script | Purpose |
|---|---|---|
| 1 | `01_profiles_table.sql` | User profiles |
| 2 | `02_submissions_table.sql` | Upload tracking (status, temp_path, approved_path) |
| 3 | `03_storage_buckets.sql` | Create uploads-temp and uploads-approved |
| 4 | `04_storage_policies.sql` | RLS policies for storage buckets |
| 5 | `05_roles_system.sql` | Roles table + `get_current_user_role_level()` RPC |
| 6 | `06_approved_papers.sql` | Approved papers for browse/search |

## Storage Buckets

| Bucket | Type | Purpose |
|---|---|---|
| `uploads-temp` | Private | Authenticated users can upload; holds pending files |
| `uploads-approved` | Public read | Approved files served to all users |

## Role Promotion Example

```sql
-- Promote a user to reviewer (level 50)
INSERT INTO roles (user_id, level) VALUES ('USER_UUID_HERE', 50)
ON CONFLICT (user_id) DO UPDATE SET level = 50;

-- Promote to admin (level 100)
INSERT INTO roles (user_id, level) VALUES ('USER_UUID_HERE', 100)
ON CONFLICT (user_id) DO UPDATE SET level = 100;
```

## Auth

Supabase Auth handles Google OAuth. On signup, users are auto-assigned role level 10 via database trigger. No `.env` file — credentials are in `js/supabase.js`.
