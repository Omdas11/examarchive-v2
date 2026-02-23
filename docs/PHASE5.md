# Phase 5 — Critical Fix Implementation Guide

## Overview

Phase 5 is a comprehensive enforcement and polish pass across ExamArchive-v2. It addresses 9 critical fixes covering promotion system integrity, UI consistency, security, UX, and admin tooling.

---

## All 9 Fixes — Status: COMPLETE

### 1. Promotion System Fixed

**Problem**: Frontend `update_user_role` RPC calls used mismatched parameter names (`target_user` instead of `target_user_id`, `new_primary_role` instead of `new_role`), causing silent failures or bypassing the cooldown-enforced 2-param version from migration 16.

**Fix**:
- `admin/users.html`: Fixed `target_user` → `target_user_id` + `new_role`
- `admin/dashboard/dashboard.js`: Fixed `new_primary_role` → `new_role` in inline promote handler
- `admin/dashboard/dashboard.js`: Split `saveRoleChanges()` into 2-param RPC for primary role (cooldown-enforced) + direct table update for other fields
- `admin/sql/15_phase5_migration.sql`: Fixed `target_user` → `target_user_id` in function signature for consistency
- Added cooldown-specific error handling in all catch blocks

**Cooldown enforcement**:
- Founder: 2 hours
- Admin: 3 hours
- Senior Moderator: 6 hours
- Moderator: 12 hours

**Unique Founder constraint**: Enforced via unique partial index in migration 14 + pre-check in RPC.

### 2. Custom Dropdown Complete

All native `<select>` elements have been replaced with the custom `EaDropdown` component.

- **Component**: `css/dropdown.css` + `js/dropdown.js`
- **Usage**: Add `data-ea-dropdown` attribute to any `<select>` element
- **API**: `window.EaDropdown.create(selectEl)` or `window.EaDropdown.initAll()`

**Static selects** (8 total): All have `data-ea-dropdown` attribute in HTML.
**Dynamic selects** (3 total): All enhanced with `EaDropdown.create()` in JavaScript.

### 3. Developer Page Fixed

**Problem**: Infinite "Verifying Founder access..." spinner when auth takes too long.

**Fix**: Added 5-second `setTimeout` guard in `developer/index.html`:
- Shows timeout error message if verification takes too long
- `clearTimeout` called on all exit paths (success, denied, error)
- Proper Founder role check via `roles.primary_role`

### 4. SVG Logo Placeholders

Created structured logo directories:

- `/assets/logos/svg/` — SVG logo files (examarchive.svg, university-default.svg, placeholder.svg)
- `/assets/logos/png/` — PNG uploads directory
- Icon fallback system in `js/icon-fallback.js` auto-applies `onerror` fallback to all icon/logo images

### 5. Admin Button Removed from Homepage

**Problem**: Homepage hero section had an Admin button that was role-gated but should not appear at all.

**Fix**: Removed the Admin button (`#heroAdminBtn`) and its associated role-checking JavaScript entirely from `index.html`. Admin access is available via the drawer navigation menu.

### 6. Last Login: Real auth.users.last_sign_in_at

**Problem**: `last_login_date` in the roles table was a static value, not the real authentication timestamp.

**Fix** (SQL migration `17_phase5_lastlogin_support.sql`):
- Created `get_user_last_sign_in(target_user_id uuid)` RPC — returns real `auth.users.last_sign_in_at`
- Created `get_all_last_sign_ins()` RPC — batch version for admin table
- Both RPCs are `SECURITY DEFINER` with Founder/Admin role checks

**Frontend** (`admin/users.html`):
- Prefers `real_last_sign_in` from auth.users over `last_login_date` from roles
- Per-cell refresh button (🔄 icon) to re-fetch a single user's last sign-in
- Auto-refresh every 60 minutes via `setInterval`

### 7. Badge & Achievement Display

**Problem**: Admin users table showed only count numbers for badges and achievements.

**Fix** (`admin/users.html`):
- **Badges**: Hovering badge cell shows actual badge names as tooltip (e.g., "Subject Expert (Physics), Beta Tester")
- **Achievements**: Hovering achievement cell shows actual achievement titles (e.g., "First Upload, 7-Day Streak")
- Achievement type mapping: `first_upload` → "First Upload", `10_uploads` → "10 Uploads", `streak_7` → "7-Day Streak", etc.
- Achievement details fetched from `achievements` table with `badge_type` and `awarded_at`

### 8. Support Page & Submissions

**Problem**: No `support_submissions` table; form data went only to `admin_requests`.

**Fix**:
- Created `support_submissions` table (SQL migration `17_phase5_lastlogin_support.sql`) with: id, user_id, type, subject, message, status, created_at, updated_at
- RLS policies: Users can insert/view own; Admins can view/update all
- `js/support.js`: Now inserts into `support_submissions` (with legacy `admin_requests` fallback)
- Added **"Support Requests" tab** in admin dashboard (`admin/dashboard/index.html` + `dashboard.js`)
- Tab only visible to Founder/Admin

### 9. Role Management Removed from Dashboard

**Problem**: Role Management panel duplicated functionality available in `admin/users.html`.

**Fix**: Removed the entire Role Management HTML section from `admin/dashboard/index.html`. The `setupRoleManagement()` call was removed from dashboard init. Role management is done via the dedicated Users page at `admin/users.html`.

---

## Database Migrations

### Migration 16: `admin/sql/16_phase5_cooldown.sql`
- Adds `last_role_change` column to roles table
- Replaces `update_user_role()` with cooldown-enforced 2-param version

### Migration 17: `admin/sql/17_phase5_lastlogin_support.sql`
- Creates `get_user_last_sign_in()` and `get_all_last_sign_ins()` RPCs
- Creates `support_submissions` table with RLS policies

---

## Setup Steps

1. Run `admin/sql/16_phase5_cooldown.sql` in Supabase SQL editor
2. Run `admin/sql/17_phase5_lastlogin_support.sql` in Supabase SQL editor
3. Verify `last_role_change` column exists in `roles` table
4. Verify `support_submissions` table exists
5. Test role change cooldown by changing a user's role twice
6. Test last login refresh button in admin users table
7. Test support form submission from `/support.html`
8. Verify support requests appear in admin dashboard Support tab
