# Backend Setup

## Supabase Project

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Note your project URL and anon key
3. Configure these in your frontend JS (e.g., `js/supabase-config.js`)

## SQL Scripts

Run these in the Supabase SQL Editor in order:

| Order | Script | Purpose |
|---|---|---|
| 1 | `01_profiles_table.sql` | User profiles table |
| 2 | `02_submissions_table.sql` | Upload submissions with status tracking |
| 3 | `03_storage_buckets.sql` | Create storage buckets |
| 4 | `04_storage_policies.sql` | Row-level security policies for storage |
| 5 | `05_roles_system.sql` | Roles table and RPC function |
| 6 | `06_approved_papers.sql` | Approved papers table for browse/search |

## Storage Buckets

Create two buckets:

- **`uploads-temp`** — Private. Holds files during the review process.
- **`uploads-approved`** — Public. Holds approved files served to users.

See `STORAGE_SETUP.md` for detailed bucket policies.

## Auth

Supabase Auth handles signup/login. On signup, users are auto-assigned role level 10 (user) via a database trigger.

## Environment

No `.env` file — config values are set directly in the frontend JS config. For local development, use the Supabase local dev setup or point to a staging project.
