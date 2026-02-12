# Architecture Master Plan

> Phase 1 — Stabilization Complete

## Overview

ExamArchive is a static site hosted on GitHub Pages with a Supabase backend. Single SQL architecture with clean role-based access control.

## Stack

- **Frontend:** Static HTML/CSS/Vanilla JS (no framework, no build step)
- **Backend:** Supabase (Auth, PostgreSQL, Storage)
- **Hosting:** GitHub Pages

## Backend Schema

### Tables

| Table | Purpose |
|---|---|
| `roles` | `user_id` (unique), `level` (int) — role assignment |
| `submissions` | Upload tracking with status, temp_path, approved_path |

### Storage Buckets

| Bucket | Visibility | Purpose |
|---|---|---|
| `uploads-temp` | Private | Holds uploads pending review |
| `uploads-approved` | Public | Holds approved papers for browsing |

### Role Levels

| Level | Role | Access |
|---|---|---|
| 0 | Visitor | Unauthenticated, read-only |
| 10 | User | Authenticated, can upload |
| 50 | Reviewer | Can approve/reject submissions |
| 80 | Moderator | Extended management |
| 100 | Admin | Full access |

### RPC Function

`get_current_user_role_level()` — returns the current user's role level (defaults to 0).

## Upload Flow

```
User uploads PDF → uploads-temp/{user_id}/{timestamp}-{filename}
  → submissions row (status=pending, temp_path set, approved_path null)
  → Reviewer panel shows pending submissions
  → Approve: copy to uploads-approved, update approved_path, status=approved
  → Reject: remove temp file, status=rejected
```

## Demo Upload Flow

```
User selects "Demo Paper" → uploads-temp/{user_id}/{timestamp}-{filename}
  → Copy to uploads-approved/demo/{paperCode}/{examYear}/{timestamp}-{filename}
  → submissions row (status=approved, approved_path set)
  → Appears immediately in Browse
```

## Calendar System

JSON-based holiday/academic calendar.

- **Data:** `data/calendar/assam-2026.json`
- **Categories:** gazetted, restricted, other
- **Views:** Month (default) and Week (toggle)
- **Rendering:** `js/notices-calendar.js` on `index.html`
- **Date parsing:** Local timezone via `parseLocalDate()` to avoid UTC shift

## Debug System

Slide-up panel at bottom of screen (max 60% viewport height).

- **Tabs:** All, Info, Warnings, Errors
- **Human-readable messages** with Reason/Check format
- **Toggle:** Settings page or `window.Debug.togglePanel()`
- **Module:** `js/modules/debug.module.js`

## Key Pages

| Page | Purpose |
|---|---|
| `index.html` | Home with search, notices, calendar |
| `upload.html` | Upload form (auth-gated) |
| `browse.html` | Browse approved papers |
| `paper.html` | Single paper viewer |
| `admin/review.html` | Reviewer panel |
| `settings.html` | User settings |
