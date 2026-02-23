# Phase 5 Implementation

## Overview

Phase 5 focuses on full backend + frontend synchronization and stabilization. This includes:
- Admin user management page
- Role-based navigation
- Real stats and developer tool integration
- Header ring animation
- Username change timer fix
- Streak system upgrade
- Debug panel enhancement

## New Database Columns

### `roles.username_last_changed` (timestamptz)
- Tracks when user last changed their username
- `NULL` = username can be changed immediately
- Frontend calculates remaining days from 30-day cooldown

### `roles.week_start` (text, default 'Monday')
- User preference for streak calendar alignment
- Valid values: `'Sunday'`, `'Monday'`
- Used by frontend to render 7-day streak row

## Migration SQL

```sql
ALTER TABLE roles ADD COLUMN IF NOT EXISTS username_last_changed timestamptz;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS week_start text DEFAULT 'Monday';
```

Full migration: `admin/sql/15_phase5_migration.sql`

## RPC Definitions

### `list_all_users_full()`
- **Returns**: Table of all users with roles, XP, upload stats
- **Security**: SECURITY DEFINER (no RLS bypass needed - function is the definer)
- **Access**: Called from admin users page (Founder/Admin only via frontend check)

### `update_user_role(target_user_id uuid, new_role text)`
- **Security**: SECURITY DEFINER with inline role check
- **Access**: Founder/Admin only
- **Restriction**: Only Founder can assign Founder role

### `get_platform_stats()`
- **Returns**: JSON with total_users, total_uploads, approved, pending, rejected, active_7
- **Security**: SECURITY DEFINER
- **Access**: Founder/Admin/Senior Moderator

### `reset_user_xp(target uuid)`
- **Security**: SECURITY DEFINER, Founder-only check
- **Action**: Sets XP=0, level=0 for target user

### `reset_achievements(target uuid)`
- **Security**: SECURITY DEFINER, Founder-only check
- **Action**: Deletes all achievements for target user

### `reset_streak(target uuid)`
- **Security**: SECURITY DEFINER, Founder-only check
- **Action**: Resets streak_count=0, last_login_date=NULL

### `reset_submissions(target uuid)`
- **Security**: SECURITY DEFINER, Founder-only check
- **Action**: Deletes all submissions for target user

### `recalc_levels()`
- **Security**: SECURITY DEFINER, Founder-only check
- **Action**: Recalculates all user levels from XP

### `rebuild_achievements()`
- **Security**: SECURITY DEFINER, Founder-only check
- **Action**: Rebuilds first_upload achievements from submissions data

## Role Access Matrix

| Page/Feature         | Founder | Admin | Senior Moderator | Moderator | Other |
|---------------------|---------|-------|-----------------|-----------|-------|
| Admin Dashboard     | ✅      | ✅    | ✅ (Submissions only) | ❌  | ❌    |
| Users Management    | ✅      | ✅    | ❌              | ❌        | ❌    |
| Stats Page          | ✅      | ✅    | ✅              | ❌        | ❌    |
| Developer Tools     | ✅      | ❌    | ❌              | ❌        | ❌    |
| Promote to Founder  | ✅      | ❌    | ❌              | ❌        | ❌    |
| Promote to Admin    | ✅      | ✅    | ❌              | ❌        | ❌    |

## Navigation Links (Drawer)

- **Founder/Admin**: Admin, Users, Stats, Developer
- **Senior Moderator**: Admin, Stats
- **Others**: No admin links

## Files Changed

### New Files
- `admin/users.html` — User management page
- `admin/sql/15_phase5_migration.sql` — Phase 5 migration
- `docs/phase-5-implementation.md` — This document

### Modified Files
- `partials/header.html` — Added drawer links (Users, Stats, Developer)
- `js/common.js` — Role-based drawer link visibility
- `admin/stats.html` — RPC integration, free-tier usage estimate
- `developer/index.html` — Real RPC calls with button disable
- `css/header.css` — Animated conic-gradient ring
- `js/avatar-popup.js` — Ring data attribute based on role/level
- `profile.html` — Username timer fix, streak week_start alignment, ring animation speed
- `js/settings.js` — Week start dropdown
- `js/core/debug.js` — Enhanced error capture system

## Security Notes

- All RPCs use SECURITY DEFINER
- Role checks happen inside RPC functions (not relying on frontend)
- Founder is the only role that can assign Founder
- XP/level never grant permissions
- Frontend checks are defense-in-depth only

## Testing Checklist

- [ ] Users page loads for Founder/Admin
- [ ] Users page shows access denied for other roles
- [ ] Promotion works via dropdown + confirm modal
- [ ] Founder restriction enforced (only Founder can assign Founder)
- [ ] Senior Moderator sees Stats but not Users/Developer
- [ ] Stats page shows real data from RPC (with fallback)
- [ ] Developer page RPC calls work with button disable
- [ ] Username timer shows correct remaining days
- [ ] Username change allowed when timer expired
- [ ] Streak calendar aligns with week_start setting
- [ ] Week start setting saves to both localStorage and Supabase
- [ ] Debug panel captures console.error, fetch failures, rejections
- [ ] Header gradient animation rotates slowly (8s)
- [ ] Profile page ring animation rotates slowly (8s)
- [ ] Ring color matches role/level tier
- [ ] No console errors on any page

## Rollback Instructions

### Database
```sql
-- Remove new columns
ALTER TABLE roles DROP COLUMN IF EXISTS username_last_changed;
ALTER TABLE roles DROP COLUMN IF EXISTS week_start;

-- Drop new RPCs
DROP FUNCTION IF EXISTS list_all_users_full();
DROP FUNCTION IF EXISTS get_platform_stats();
DROP FUNCTION IF EXISTS reset_user_xp(uuid);
DROP FUNCTION IF EXISTS reset_achievements(uuid);
DROP FUNCTION IF EXISTS reset_streak(uuid);
DROP FUNCTION IF EXISTS reset_submissions(uuid);
DROP FUNCTION IF EXISTS recalc_levels();
DROP FUNCTION IF EXISTS rebuild_achievements();
```

### Frontend
Revert the following files to their pre-Phase 5 state:
- `partials/header.html`
- `js/common.js`
- `admin/stats.html`
- `developer/index.html`
- `css/header.css`
- `js/avatar-popup.js`
- `profile.html`
- `js/settings.js`
- `js/core/debug.js`

Remove:
- `admin/users.html`
- `admin/sql/15_phase5_migration.sql`
- `docs/phase-5-implementation.md`
