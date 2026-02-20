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

On signup, a database trigger auto-assigns role level 10 (Contributor). If no role row exists, the frontend defaults to level 10.

## Upload Flow

```
Authenticated user selects PDF
  → getUser() called (fresh, never cached)
  → File uploaded to uploads-temp bucket (private)
  → Submission row inserted: status = "pending"
  → Reviewer (≥75) approves → status = "approved"
  → Publisher (≥90) publishes → file copied to uploads-approved → status = "published"
  → Paper visible on Browse page
```

## Browse Flow

The Browse page is fully backend-driven. No static `papers.json` is used.

```
Page loads
  → Query submissions table WHERE status = 'published'
  → For each row, generate signed URL from uploads-approved bucket
  → Render paper cards with metadata + download link
```

Signed URLs are time-limited and generated on the client via the Supabase Storage API.

## Storage Architecture

| Bucket | Visibility | Purpose |
|---|---|---|
| `uploads-temp` | Private | Holds files during pending/review stage |
| `uploads-approved` | Public | Holds published papers served to users |

**Storage RLS** and **Database RLS** are separate security layers:
- Storage RLS controls who can read/write files in each bucket
- Database RLS controls who can read/write rows in each table
- Both must pass for any operation to succeed

## Role System

Roles are numeric levels stored in the `roles` table. The frontend maps levels to display names via `mapRole()` in `js/utils/role-utils.js`.

| Level | Role | Access |
|---|---|---|
| 0 | Visitor | Browse approved papers |
| 10 | Contributor | Upload papers |
| 75 | Reviewer | Approve/reject submissions |
| 90 | Publisher | Publish approved papers; debug panel visible |
| 100 | Admin | Full access; reset counters; full debug logging |

The backend never returns role names — only numeric levels. All name mapping happens client-side.

## Visitor Counter

1. On page load, check `sessionStorage` for `visited` flag
2. If not set, call `increment_visit_counter()` RPC
3. Set `sessionStorage.visited = true` to prevent duplicate counts
4. Read count from `site_stats` table → display in footer

Admins (level 100) can reset the counter.

## Debug Panel

The debug panel is an ES module (`js/modules/debug.module.js`), role-gated:

- **Level < 90:** Panel hidden
- **Level ≥ 90:** Panel visible, view classified logs
- **Level ≥ 100:** Full access — export, copy, and clear log buffer

Errors are auto-classified with tags: `[AUTH]`, `[RLS]`, `[STORAGE]`, `[CLIENT]`.

## Theme System

Themes use CSS custom properties defined in `css/brand.css` and applied via the `data-theme` attribute on `<body>`:

- **Modes:** Light, Dark, AMOLED
- **Night mode:** Automatic theme switching support
- **Tokens:** `--bg`, `--text`, `--accent`, `--border`, `--surface`, status colors, avatar colors
- **Presets:** Named presets (e.g., `red-classic`, `blue-slate`) with variants for each mode

## Backend Components

### Tables

- `roles` — User role levels (keyed by `user_id`)
- `submissions` — Uploaded papers with status lifecycle
- `site_stats` — Visitor counter and site-wide statistics

### RPC Functions

- `get_current_user_role_level()` — Returns the calling user's role level
- `increment_visit_counter()` — Atomically increments the visit count
- `is_admin()` — Boolean check for admin access

### Storage Buckets

- `uploads-temp` — Private; authenticated users can upload, read own files
- `uploads-approved` — Public read; privileged roles can write

## Key Design Decisions

1. **No build step** — Deploy by pushing to GitHub Pages
2. **Backend is source of truth** — Frontend never infers roles; always queries backend
3. **Singleton pattern** — Single Supabase client via `getSupabase()` from `js/supabase-client.js`
4. **Fresh auth checks** — `getUser()` called before every database insert, never cached
5. **RLS enforcement** — All table access controlled by Supabase RLS policies
6. **Signed URLs** — Time-limited download links for published papers
7. **Approve ≠ Publish** — Separate actions at different role levels (75 vs 90)

## Folder Structure

```
/
├── index.html              # Home page
├── upload.html             # Upload page
├── browse.html             # Browse papers (backend-driven)
├── about.html              # About page (live database stats)
├── settings.html           # User settings
├── support.html            # Admin application / support
├── paper.html              # Individual paper view
├── js/
│   ├── supabase-client.js  # Singleton client factory
│   ├── auth-controller.js  # Central auth state manager
│   ├── upload-handler.js   # Storage + submission insert
│   ├── browse.js           # Browse queries + signed URLs
│   ├── roles.js            # Role → badge display mapping
│   ├── profile-panel.js    # Profile dropdown UI
│   ├── modules/
│   │   └── debug.module.js # Debug panel (ES module, role-gated)
│   └── utils/
│       ├── role-utils.js   # mapRole() and role verification
│       └── supabase-wait.js# Client readiness helper
├── css/
│   ├── common.css          # Shared styles
│   └── brand.css           # Theme tokens and CSS variables
├── admin/
│   ├── sql/                # Database setup scripts (run in order)
│   └── dashboard/          # Admin dashboard
├── docs/                   # Documentation
├── partials/               # Reusable HTML components
└── assets/                 # Static assets (images, icons)
```
