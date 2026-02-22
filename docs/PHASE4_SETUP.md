# Phase 4 Setup Guide

> Complete step-by-step guide to deploy the Phase 4 role system, admin dashboard, XP system, and promotion features.

## Prerequisites

Before starting Phase 4 setup, ensure you have completed:

- [ ] Supabase project created and configured (see [DEPLOYMENT.md](DEPLOYMENT.md))
- [ ] SQL scripts 01–12 already executed in order
- [ ] Google OAuth configured in Supabase Authentication → Providers
- [ ] Storage buckets (`uploads-temp`, `uploads-approved`) verified
- [ ] `js/supabase.js` updated with your project URL and anon key

## Step 1: Run Phase 4 SQL Migrations

Open the **Supabase SQL Editor** (Dashboard → SQL Editor) and run these two scripts **in order**.

### 1a. Phase 4 Migration (`13_phase4_migration.sql`)

This script adds:
- `xp` column to the `roles` table
- `username` and `display_name` columns
- XP-to-level calculation function (cosmetic)
- `add_user_xp()` RPC for admins to award XP
- `get_user_xp_info()` RPC for users to check their own XP
- `search_users_by_username()` RPC for admin user search
- `set_username()` RPC for users to set their username
- `remove_vote()` RPC for paper request voting
- `get_user_upload_stats()` RPC
- Updated `auto_promote_contributor()` trigger (+50 XP on upload)

**Run in SQL Editor:**

1. Open `admin/sql/13_phase4_migration.sql`
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click **Run**
5. Verify: No errors in output. You should see "Success" for each statement.

### 1b. Phase 4 Restructure (`14_phase4_restructure.sql`)

This script adds:
- **Decoupled XP from permissions** — XP is now cosmetic only
- **Founder uniqueness** — only one Founder allowed (unique partial index)
- **Daily streak system** — `streak_count` and `last_login_date` columns
- **Role-based access control RPCs** — `has_admin_access()`, `has_moderator_access()`, `has_reviewer_access()`
- **`update_user_role()` RPC** — admin role management with Founder uniqueness check
- **`list_all_users()` RPC** — paginated user listing for admin dashboard
- **`get_current_user_primary_role()` RPC**
- **Updated legacy RPCs** — `is_admin()`, `is_current_user_admin()`, `get_user_role_name()` now use `primary_role`
- **Updated RLS policy** — "admins manage roles" now checks `primary_role`

**Run in SQL Editor:**

1. Open `admin/sql/14_phase4_restructure.sql`
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click **Run**
5. Verify: No errors. If you get an error about `award_achievement` not existing, run `admin/sql/12_phase3_migration.sql` first (it defines the achievement system).

## Step 2: Set Up the First Founder

After running the SQL migrations, you need to assign the Founder role to the site owner. The Founder is the highest-privilege role and only one user can hold it.

### Option A: Via SQL (Recommended for First Setup)

1. **Sign in** to your site with Google OAuth to create your user account
2. **Find your user ID** in Supabase:
   - Go to **Authentication → Users** in the Supabase dashboard
   - Find your email and copy the **User UID** (UUID format)
3. **Run this SQL** in the SQL Editor:

```sql
-- Replace 'YOUR-USER-UUID-HERE' with your actual UUID
UPDATE roles
SET primary_role = 'Founder',
    level = 100,
    xp = 5000,
    updated_at = now()
WHERE user_id = 'YOUR-USER-UUID-HERE';

-- Verify:
SELECT user_id, primary_role, level, xp
FROM roles
WHERE user_id = 'YOUR-USER-UUID-HERE';
```

> **Note:** If no row exists in `roles` for your user, insert one first:
> ```sql
> INSERT INTO roles (user_id, primary_role, level, xp)
> VALUES ('YOUR-USER-UUID-HERE', 'Founder', 100, 5000)
> ON CONFLICT (user_id) DO UPDATE
> SET primary_role = 'Founder', level = 100, xp = 5000;
> ```

### Option B: Via Supabase Table Editor

1. Go to **Table Editor → roles**
2. Find the row matching your `user_id`
3. Edit the `primary_role` column to `Founder`
4. Set `level` to `100` and `xp` to `5000`
5. Save

## Step 3: Verify Admin Dashboard Access

1. **Refresh your site** (hard refresh: Ctrl+Shift+R)
2. **Click your avatar** in the top-right corner
3. You should see an **"Admin Dashboard"** link in the drawer menu
4. Click it — you should land on `/admin/dashboard/`
5. The dashboard shows:
   - **Role Management** panel (search users, edit roles)
   - **All Users** table (paginated user listing)
   - **Production Cleanup** section
   - **Submission stats and tabs** (Pending, Approved, All)

If you see "Access Denied" instead:
- Verify your `primary_role` is set to `Founder`, `Admin`, or `Senior Moderator` in the `roles` table
- Hard refresh the page (cached session may have stale data)
- Check browser console for errors

## Step 4: Promote Other Users

### From the Admin Dashboard (Recommended)

1. Navigate to `/admin/dashboard/`
2. In the **Role Management** section, enter a username, email, or UUID
3. Click **Search**
4. Click **Edit** on the user
5. Select a **Primary Role** from the dropdown:
   - `Visitor` — read-only access
   - `Contributor` — can upload papers (auto-assigned on first upload)
   - `Reviewer` — can review submissions
   - `Senior Moderator` — dashboard access
   - `Admin` — full management
   - `Founder` — unique, full control (only one allowed)
6. Optionally adjust XP, Level (cosmetic only), Secondary/Tertiary roles, Custom Badges
7. Click **Save Changes**

### From SQL (Direct Database Access)

```sql
-- Promote a user to Admin
SELECT update_user_role(
  'target-user-uuid',    -- target_user_id
  NULL,                  -- new_level (NULL = no change)
  'Admin',               -- new_primary_role
  NULL,                  -- new_secondary_role
  NULL,                  -- new_tertiary_role
  NULL                   -- new_custom_badges
);
```

## Step 5: Verify Key Features

### Role System
- [ ] Founder role shows in profile panel
- [ ] Admin Dashboard accessible at `/admin/dashboard/`
- [ ] Role Management panel visible (Founder/Admin only)
- [ ] Users table loads with pagination
- [ ] Role changes save successfully via "Edit" button

### XP & Streak System
- [ ] XP displays in profile panel (cosmetic only)
- [ ] Level badge shows correct cosmetic tier
- [ ] Daily streak increments on login
- [ ] Streak dots show in profile panel (7 dots, fire emoji at 7+)

### Submissions & Upload
- [ ] Upload form works for authenticated users
- [ ] First upload auto-promotes to `Contributor` role
- [ ] First upload awards +50 XP
- [ ] Submissions appear in admin dashboard for review

### Permission Checks
- [ ] Only Founder/Admin/Senior Moderator can access `/admin/dashboard/`
- [ ] Only Founder/Admin can see Role Management and Users Table
- [ ] Non-admin users see "Access Denied" on the dashboard
- [ ] Admin drawer link hidden for non-admin users

## Role Hierarchy Reference

| Tier | Role | Permissions |
|------|------|------------|
| 0 | **Founder** | Full access. Unique (only one). Can assign all roles including Admin. |
| 1 | **Admin** | Full management. Can manage users, roles, submissions. |
| 2 | **Senior Moderator** | Can access admin dashboard, review submissions. |
| 3 | **Moderator** | Can approve/reject submissions. No dashboard access. |
| 4 | **Reviewer** | Can review submissions only. Cannot approve/publish. |
| 5 | **Contributor** | Can upload papers. Auto-assigned on first upload. |
| 6 | **Member** | Authenticated user. Can browse and download. |
| 7 | **Visitor** | Not signed in. Can browse published papers only. |

## XP Cosmetic Tiers (No Permission Impact)

| XP | Level | Title |
|----|-------|-------|
| 0 | 0 | Visitor |
| 100 | 5 | Explorer |
| 300 | 10 | Contributor |
| 800 | 25 | Veteran |
| 1500 | 50 | Senior |
| 3000 | 90 | Elite |
| 5000 | 100 | Legend |

## Troubleshooting

### "Access Denied" on Admin Dashboard
1. Check `primary_role` in the `roles` table for your user
2. Must be `Founder`, `Admin`, or `Senior Moderator`
3. Hard refresh the browser (Ctrl+Shift+R)
4. Check browser console for Supabase RPC errors

### Role Changes Don't Save
1. Only `Founder` and `Admin` can modify roles
2. Check browser console for error messages from `update_user_role` RPC
3. Verify the target user has a row in the `roles` table

### Founder Role Assignment Fails
1. Only one Founder is allowed (enforced by unique partial index)
2. If another user is already Founder, demote them first
3. Error message: "Founder role is unique: another user already has this role"

### XP Not Updating
1. XP is cosmetic only — it does NOT affect permissions
2. Daily streak awards +5 XP/day automatically
3. First upload awards +50 XP via database trigger
4. Manual XP changes require Founder/Admin via `add_user_xp()` RPC

### Search Users Not Working
1. Requires `Founder`, `Admin`, or `Senior Moderator` role
2. Search matches against username (ILIKE) and email (ILIKE)
3. UUID search uses `get_user_role_by_id()` from Phase 3 migration

### Tutorial Keeps Showing
1. Tutorial uses `localStorage` key `examarchive_tutorial_seen`
2. Clear localStorage and reload to re-trigger
3. Set `localStorage.setItem('examarchive_tutorial_seen', '2')` in console to dismiss

## SQL Migration Summary

| Script | Phase | What It Does |
|--------|-------|-------------|
| 01–07 | Core | Profiles, submissions, storage, roles, approved papers |
| 08–10 | 1–2 | Submission fields, RLS fixes, policy cleanup |
| 11 | 2 | Phase 2 migration |
| 12 | 3 | Phase 3: achievements, email search, role-by-id RPCs |
| **13** | **4** | XP system, username, level calc, search RPCs |
| **14** | **4** | Decouple XP from permissions, founder uniqueness, streak, RBAC |

## Security Notes

- **Backend is the security boundary** — RLS policies and `SECURITY DEFINER` RPCs enforce all access control. The frontend reads `primary_role` from the `roles` table for UI gating (show/hide admin links), but the database is the authority and rejects unauthorized operations regardless of frontend state.
- **XP cannot escalate permissions** — XP is cosmetic only, `primary_role` is the sole authority
- **RLS policies enforce access** — even if someone bypasses the frontend, the database rejects unauthorized operations
- **Founder uniqueness** — enforced by unique partial index, not just application logic
- **All role-changing RPCs** require `SECURITY DEFINER` and check caller's `primary_role`
