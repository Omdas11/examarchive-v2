# Phase 3 — Complete Implementation

## Overview

Phase 3 is the full backend and frontend upgrade for ExamArchive v2, covering role system redesign, achievement system, paper bounty board, admin tools, and documentation rewrite.

## Changes

### 1. Role System Redesign

**SQL Migration:** `admin/sql/12_phase3_migration.sql`

New columns added to `roles` table:
- `primary_role` (text)
- `secondary_role` (text)
- `tertiary_role` (text)
- `custom_badges` (jsonb, default `[]`)
- `updated_at` (timestamptz)

**New 7-tier hierarchy:**

| Level | Role | Permissions |
|-------|------|-------------|
| 0 | Visitor | Browse only |
| 10 | User | Basic authenticated access |
| 20 | Contributor | Auto after first upload |
| 50 | Reviewer | Can review submissions |
| 75 | Moderator | Can approve/reject |
| 90 | Senior Moderator | Can publish |
| 100 | Founder/Admin | Full access |

**RPC Functions:**
- `update_user_role()` — Admin-only (≥100) role update
- `search_users_by_email()` — Search users (≥75)
- `get_user_role_by_id()` — Look up user by UUID (≥75)

### 2. Badge Display System

Profile panel shows up to 3 dynamic badges:

| Slot | Badge | Condition |
|------|-------|-----------|
| 1 | Primary Role | Always shown |
| 2 | Founder | Auto if level = 100 |
| 2 | Contributor | Auto if ≥1 upload |
| 3 | Custom | From `custom_badges` column |

### 3. Achievement System

**Table:** `achievements` (id, user_id, badge_type, awarded_at)

**Auto-awarded achievements:**
- `first_upload` — First submission
- `10_uploads` — 10th submission
- `first_review` — First review action
- `first_publish` — First publish action
- `early_user` — First 10 registered users

**Trigger:** `trigger_auto_promote_contributor` on submissions INSERT auto-promotes to level 20 and awards upload achievements.

### 4. Paper Bounty Board

**Page:** `/requests.html`

**Tables:**
- `paper_requests` (id, user_id, paper_code, year, description, votes, status)
- `paper_request_votes` (id, request_id, user_id, unique per user per request)

**Features:**
- Create request (authenticated)
- Upvote (one per user, via `upvote_paper_request()` RPC)
- Admin mark fulfilled (level ≥75)

### 5. Admin Workflow

- Removed "Approve & Publish" combined button
- **Approve** (level ≥75): Moves file, sets status to approved
- **Publish** (level ≥90): Requires approved status first
- **Reject** (level ≥75): Deletes file, sets status to rejected

### 6. Admin Role Management Panel

Available to level ≥100 users in the Admin Dashboard:
- Search by email or UUID
- View current level and roles
- Edit level, primary/secondary/tertiary roles, custom badges
- Save via `update_user_role()` RPC

### 7. Active Users Counter

- Footer shows "Visitors: N · Active: N"
- Active = signed in within last 10 minutes
- Uses `get_active_user_count()` RPC
- Cached 30 seconds

### 8. Paper Page Fix

- Now loads from `submissions` table via paper code or ID
- Generates signed URLs for PDF access
- Shows title, year, file size, published date
- Removed JSON dependency for paper data

### 9. Theme Polish

- Removed blue accent (`#42a5f5`) in dark mode → replaced with `#ff8a80`
- Header login hint dot uses `--red` instead of `--accent`
- Profile panel has proper dark mode background
- Badge colors adapted for dark mode

### 10. Repo Cleanup

- Removed startup console.log messages from auth.js, common.js, app.module.js
- Profile panel debug function converted to no-op
- Removed dead code (approveAndPublishSubmission handler reference)

### 11. Documentation

Updated:
- `README.md` — Complete rewrite with new role hierarchy and features
- `docs/PHASE3.md` — This file
- `docs/ROLE_SYSTEM.md` — Updated role hierarchy
- `docs/ACHIEVEMENTS.md` — New achievement system docs
- `docs/ARCHITECTURE.md` — Updated architecture overview

## Files Changed

### New Files
- `admin/sql/12_phase3_migration.sql`
- `requests.html`
- `js/requests.js`
- `docs/PHASE3.md`
- `docs/ACHIEVEMENTS.md`

### Modified Files
- `js/utils/role-utils.js` — New 7-tier hierarchy
- `js/roles.js` — Updated badge colors
- `js/profile-panel.js` — Dynamic badges, achievements, support link
- `js/paper.js` — Backend-driven paper loading
- `js/visitor-counter.js` — Active user count via RPC
- `js/app.module.js` — Removed console.logs
- `js/common.js` — Removed console.log
- `js/auth.js` — Removed console.log
- `admin/dashboard/dashboard.js` — Split buttons, role management
- `admin/dashboard/index.html` — Role management panel HTML
- `admin/dashboard/dashboard.css` — Role management styles
- `partials/header.html` — Requests link in drawer
- `css/common.css` — Dark mode color fix
- `css/header.css` — Login hint dot color
- `css/profile-panel.css` — Dark mode, achievements, new badge types
- `README.md` — Complete rewrite
- `docs/ROLE_SYSTEM.md` — Updated
- `docs/ARCHITECTURE.md` — Updated
