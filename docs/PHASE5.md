# Phase 5 — Implementation Guide

## Overview

Phase 5 is a comprehensive enforcement and polish pass across ExamArchive-v2. It addresses 12 mandatory fixes covering UI consistency, security, UX, and admin tooling.

---

## Changes Summary

### 1. Custom Dropdown Everywhere

All native `<select>` elements have been replaced with the custom `EaDropdown` component.

- **Component**: `css/dropdown.css` + `js/dropdown.js`
- **Usage**: Add `data-ea-dropdown` attribute to any `<select>` element
- **API**: `window.EaDropdown.create(selectEl)` or `window.EaDropdown.initAll()`
- **Features**: Themed, animated, accessible, keyboard navigable, close on outside click, mobile friendly

**Files changed**:
- `admin/users.html` — Sort dropdowns (`#sortBy`, `#sortDir`) enhanced
- `admin/dashboard/index.html` — Role edit dropdown (`#roleEditPrimary`) enhanced
- `admin/dashboard/dashboard.js` — `EaDropdown.initAll()` called after dashboard init

### 2. SVG Icon System (No Emojis)

All emoji characters have been replaced with inline SVG icons from the centralized icon library (`js/svg-icons.js`).

**Files changed**: `admin/users.html`, `developer/index.html`, `support.html`, `admin/stats.html`, `requests.html`, `upload.html`, `about.html`, `admin/dashboard/dashboard.js`

**Icon library** at `js/svg-icons.js` provides: `SvgIcons.get(name)`, `SvgIcons.inline(name)`, `SvgIcons.el(name)`

### 3. UUID Fully Visible

Admin user table now shows full UUID without truncation.

- Removed `max-width`, `overflow: hidden`, `text-overflow: ellipsis` from `.uuid-text`
- Added `word-break: break-all` and `min-width: 280px` on UUID column
- Copy button functional with clipboard API + fallback

### 4. Admin Promotion Cooldown

**Backend** (SQL migration: `admin/sql/16_phase5_cooldown.sql`):
- Added `last_role_change timestamptz` column to `roles` table
- Modified `update_user_role()` RPC to enforce cooldowns:
  - Founder → 2 hours
  - Admin → 3 hours
  - Senior Moderator → 6 hours
  - Moderator → 12 hours
- Raises exception with remaining time if cooldown is active
- Updates `last_role_change = NOW()` on successful role change

**Frontend** (`admin/users.html`):
- Success toast shows cooldown duration
- Error handler detects cooldown messages
- Custom dropdown reverts on failure

### 5. Developer Page Verification Fix

Fixed infinite "Verifying Founder access..." loop in `developer/index.html`.

- Added 5-second `setTimeout` guard
- `clearTimeout` called on all exit paths (success, denied, error)
- Shows timeout error message if verification takes too long

### 6. Icon Fallback System

Created a robust icon fallback system:

- **Default icon**: `/assets/icons/system/default.svg`
- **Custom icons folder**: `/assets/icons/custom/`
- **Fallback script**: `js/icon-fallback.js`
  - Uses `MutationObserver` to catch dynamically added images
  - Applies `onerror` fallback to all icon-related `<img>` elements
  - No empty icon areas possible

### 7. Tutorial Blur Fix

Fixed background remaining blurred after closing the tutorial overlay.

In `js/tutorial.js` `dismiss()` function:
- Removes `tutorial-active` class from body
- Clears `filter`, `backdrop-filter`, `-webkit-backdrop-filter` from body and `#main-content`
- Removes all tutorial DOM elements and styles

### 8. Homepage Redesign

Redesigned `index.html` with minimal layout:

- **Typewriter animation** on "ExamArchive" title (plays once, then static)
- **Streamlined buttons**: Browse Papers, Upload Paper, Login/Profile, Admin (auth-aware)
- Removed Quick Access section (6 redundant buttons)
- Auth-aware button visibility (Login shown for guests, Profile/Admin for authenticated users)

### 9. Developer Pack Reset Expansion

Added 7 new reset buttons to `developer/index.html`:

| Button | Action | Description |
|--------|--------|-------------|
| Reset Level | `reset-level` | Sets user level to 0 |
| Reset Role | `reset-role` | Sets role to Visitor |
| Reset Username | `reset-username` | Clears username |
| Reset Display Name | `reset-displayname` | Clears display name |
| Reset Cooldown | `reset-cooldown` | Clears `last_role_change` |
| Reset Upload Stats | `reset-uploads` | Deletes user submissions |
| Reset Badges | `reset-badges` | Clears `custom_badges` |

All use confirmation dialogs and show success/error toasts.

### 10. Badge & Achievement Columns

Added to admin user table (`admin/users.html`):

- **Badges** column: Shows badge icon + count from `custom_badges` array
- **Achievements** column: Shows trophy icon + count from `achievements` table
- Data supplemented from separate queries after main user load

### 11. Old User Table Removed

Cleaned `admin/dashboard/`:
- Removed Users tab button from main tab navigation
- Removed Users panel HTML entirely
- Commented out `setupMainTabs()` and `setupUsersTable()` calls
- Dashboard now shows only Submissions analytics

### 12. Last Login Timestamp Fix

Fixed timestamp formatting in both admin pages:

- `admin/users.html`: Uses `toLocaleString()` with `timeZoneName: 'short'`
- `admin/dashboard/dashboard.js`: Same format
- Output example: "Feb 23, 2026, 05:30 AM IST"
- Each user shows their actual last login, not a shared timestamp

---

## Database Migrations

### Migration: `admin/sql/16_phase5_cooldown.sql`

Run this migration to add cooldown enforcement:

```sql
-- 1. Add column
ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS last_role_change timestamptz;

-- 2. Create/replace the RPC function
-- (See full SQL in admin/sql/16_phase5_cooldown.sql)
```

---

## Setup Steps

1. Run `admin/sql/16_phase5_cooldown.sql` in Supabase SQL editor
2. Verify `last_role_change` column exists in `roles` table
3. Test role change cooldown by changing a user's role twice
4. Verify icon fallback by temporarily using a broken image URL
5. Clear `examarchive_tutorial_seen` from localStorage to test tutorial blur fix

---

## Fallback Systems

### Icon Fallback
- Script: `js/icon-fallback.js`
- Default: `/assets/icons/system/default.svg`
- Custom: Upload to `/assets/icons/custom/`
- Automatic: MutationObserver catches dynamically added images

### Avatar Fallback
- Priority: `roles.avatar_url` → OAuth avatar → Letter initial
- Shimmer loading state while fetching

---

## Cooldown Logic

| Actor Role | Cooldown Duration |
|-----------|-------------------|
| Founder | 2 hours |
| Admin | 3 hours |
| Senior Moderator | 6 hours |
| Moderator | 12 hours |
| Other | 24 hours |

- Enforced server-side via `update_user_role()` RPC
- Frontend shows remaining time in error toast
- Can be reset via Developer Tools (Founder only)
