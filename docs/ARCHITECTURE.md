# Architecture

## Overview

ExamArchive is a student-driven academic archive for university question papers. It uses a **static frontend** served via GitHub Pages and a **Supabase backend** for authentication, database, and file storage. All data flows through the Supabase client — there are no custom API servers.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Static HTML / CSS / Vanilla JavaScript |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| Hosting | GitHub Pages |
| Auth | Google OAuth via Supabase Auth |
| Security | Row-Level Security (RLS) on all tables |

## Data Flow

```
Browser → Supabase JS Client → RPC / Queries → PostgreSQL → Response → Render
```

All interactions follow this pattern. The frontend initializes a singleton Supabase client and communicates directly with Supabase services — no intermediate server.

## Auth Flow

```
User clicks "Sign in with Google"
  → Supabase OAuth redirect → Google consent → callback
  → Supabase Auth creates/restores session
  → Frontend queries roles table for user's level
  → mapRole(level) determines client-side permissions
  → auth:ready event emitted → UI features enabled
```

On signup, a database trigger auto-assigns role level 10 (User). After first upload, auto-promoted to level 20 (Contributor).

## Upload Flow

```
Authenticated user selects PDF
  → getUser() called (fresh, never cached)
  → File uploaded to uploads-temp bucket (private)
  → Submission row inserted: status = "pending"
  → Auto-promotion trigger: level < 20 → level 20 + first_upload achievement
  → Moderator (≥75) approves → status = "approved"
  → Senior Moderator (≥90) publishes → status = "published"
  → Paper visible on Browse page
```

## Approval Workflow

Approve and Publish are **separate actions** at different role levels:
- **Approve** (level ≥ 75): Moves file from temp to approved bucket, sets status to "approved"
- **Publish** (level ≥ 90): Requires approved status, sets status to "published"
- **Reject** (level ≥ 75): Deletes file, sets status to "rejected"

## Browse Flow

The Browse page is fully backend-driven. No static JSON is used.

```
Page loads
  → Query submissions table WHERE status = 'published'
  → For each row, generate signed URL from uploads-approved bucket
  → Render paper cards with metadata + download link
```

## Paper Page

Papers load from the `submissions` table by paper code or ID:
- Shows title, year, file size, published date
- Generates signed URLs for PDF access
- Syllabus, repeated questions, and notes sections are placeholders for future backend data

## Storage Architecture

| Bucket | Visibility | Purpose |
|---|---|---|
| `uploads-temp` | Private | Holds files during pending/review stage |
| `uploads-approved` | Public | Holds published papers served to users |

## Role System

7-tier numeric role levels in the `roles` table:

| Level | Role | Key Permissions |
|---|---|---|
| 0 | Visitor | Browse only |
| 10 | User | Basic authenticated access |
| 20 | Contributor | Auto after first upload |
| 50 | Reviewer | Review submissions |
| 75 | Moderator | Approve/reject submissions |
| 90 | Senior Moderator | Publish papers, debug panel |
| 100 | Founder/Admin | Full access, manage roles |

### Badge System (3 slots)
1. **Primary Role** — From `mapRole(level)`
2. **Founder/Contributor** — Auto: Founder if level=100, Contributor if ≥1 upload
3. **Custom Badge** — From `custom_badges` column

### Admin Role Management
Admins (≥100) can search users and edit roles via the Admin Dashboard panel using `update_user_role()` RPC.

## Achievement System

Auto-awarded achievements stored in `achievements` table:
- `first_upload`, `10_uploads`, `first_review`, `first_publish`, `early_user`
- Triggered by database triggers and RPC functions
- Displayed as pills in the profile panel

## Paper Bounty Board

Users can request papers at `/requests.html`:
- Create requests (authenticated)
- Upvote (one per user via `upvote_paper_request()` RPC)
- Admin mark fulfilled (level ≥ 75)
- Tables: `paper_requests`, `paper_request_votes`

## Active Users Counter

Footer shows visitors and active users:
- Visitors: `increment_visit_counter()` RPC, cached in sessionStorage
- Active: `get_active_user_count()` RPC (last 10 min sign-in)

## Backend Components

### Tables

- `roles` — User role levels with primary/secondary/tertiary roles and custom badges
- `submissions` — Uploaded papers with status lifecycle
- `achievements` — User achievements (auto-awarded)
- `paper_requests` — Paper bounty board requests
- `paper_request_votes` — One vote per user per request
- `site_stats` — Visitor counter
- `admin_requests` — Admin application requests

### Key RPC Functions

- `get_current_user_role_level()` — Calling user's role level
- `get_user_role_level(user_id)` — Any user's role level
- `update_user_role(...)` — Admin-only role update
- `search_users_by_email(email)` — User search
- `award_achievement(user_id, type)` — Idempotent achievement award
- `get_user_achievements(user_id)` — User's achievements
- `upvote_paper_request(request_id)` — One vote per user
- `get_active_user_count()` — Active users in last 10 min
- `increment_visit_counter()` — Atomic visit count

## Key Design Decisions

1. **No build step** — Deploy by pushing to GitHub Pages
2. **Backend is source of truth** — Frontend never infers roles; always queries backend
3. **Singleton pattern** — Single Supabase client via `getSupabase()`
4. **Fresh auth checks** — `getUser()` called before every database insert
5. **RLS enforcement** — All table access controlled by Supabase RLS policies
6. **Signed URLs** — Time-limited download links for published papers
7. **Approve ≠ Publish** — Separate actions at different role levels (75 vs 90)
8. **Auto-promotion** — Database triggers handle role upgrades on user actions
9. **Idempotent achievements** — `award_achievement()` is safe to call multiple times

## Folder Structure

```
/
├── index.html              # Home page
├── upload.html             # Upload page
├── browse.html             # Browse papers (backend-driven)
├── paper.html              # Paper details (backend-driven)
├── requests.html           # Paper bounty board
├── about.html              # About page
├── settings.html           # User settings
├── support.html            # Help & support
├── js/
│   ├── supabase-client.js  # Singleton client factory
│   ├── auth-controller.js  # Central auth state manager
│   ├── upload-handler.js   # Storage + submission insert
│   ├── browse.js           # Browse queries + signed URLs
│   ├── paper.js            # Paper page (backend-driven)
│   ├── requests.js         # Paper bounty board
│   ├── roles.js            # Role → badge display mapping
│   ├── profile-panel.js    # Profile panel + badges + achievements
│   ├── visitor-counter.js  # Visitor + active user counts
│   ├── modules/
│   │   └── debug.module.js # Debug panel (ES module, role-gated)
│   └── utils/
│       ├── role-utils.js   # mapRole() and role verification
│       └── supabase-wait.js# Client readiness helper
├── css/                    # Stylesheets
├── admin/
│   ├── sql/                # Database migration scripts (01-12)
│   └── dashboard/          # Admin dashboard + role management
├── docs/                   # Documentation
├── partials/               # Reusable HTML components (header, footer, profile)
└── assets/                 # Static assets (images, icons, logos)
```
