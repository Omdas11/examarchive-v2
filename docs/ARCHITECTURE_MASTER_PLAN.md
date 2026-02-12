# Architecture Master Plan

## Overview

Static site hosted on GitHub Pages with a Supabase backend for auth, database, and storage.

## Stack

- **Frontend:** Static HTML/CSS/JS served via GitHub Pages
- **Backend:** Supabase (Auth, PostgreSQL, Storage)
- **No build step** — plain files, no framework

## Storage Buckets

| Bucket | Visibility | Purpose |
|---|---|---|
| `uploads-temp` | Private | Holds uploads pending review |
| `uploads-approved` | Public | Holds approved papers for browsing |

## Role Levels

| Level | Role |
|---|---|
| 0 | Visitor (unauthenticated) |
| 10 | User (authenticated, default on signup) |
| 50 | Reviewer |
| 80 | Moderator |
| 100 | Admin |

## Upload Flow

```
Upload → submissions table (status=pending) → Reviewer panel
  → Approve: move file to uploads-approved, insert approved_papers, status=approved
  → Reject: delete temp file, status=rejected
```

## Demo Mode

Uploads are auto-approved. File goes directly to `uploads-approved` and an `approved_papers` row is inserted immediately.

## Calendar System

JSON-based holiday calendar. Data lives in `data/calendar/assam-2026.json` with year and categorized entries (gazetted, restricted, other). Rendered as a month-view calendar on the home page with colored dots and category toggles.

## Key Pages

| Page | Purpose |
|---|---|
| `index.html` | Home with calendar |
| `upload.html` | Upload form |
| `browse.html` | Browse approved papers |
| `paper.html` | Single paper view |
| `admin/review.html` | Reviewer panel |
| `admin/calendar.html` | Calendar admin |
| `settings.html` | User settings |
