# ExamArchive v2

> A student-driven academic archive for university question papers.
> Live at [examarchive.dev](https://examarchive.dev)

## What is ExamArchive

ExamArchive is a web application where students can upload, browse, and download university question papers. It provides a centralized, backend-driven repository for exam preparation materials with a multi-tier role-based approval pipeline and Supabase-powered storage.

## Tech Stack

| Component | Technology |
|---|---|
| Frontend | Static HTML / CSS / Vanilla JavaScript |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| Hosting | GitHub Pages |
| Authentication | Google OAuth + Email/Password via Supabase Auth |
| Security | Row-Level Security (RLS) on all tables |

No build step, no framework, no bundler. Just HTML, CSS, and JavaScript served as static files.

## Role-Based Permission System

Access is controlled by `primary_role` in the `roles` table. XP and levels are cosmetic only and never affect permissions.

| Tier | Role | Permissions |
|------|------|------------|
| 0 | **Founder** | Full access. Unique (only one user). Can assign all roles. |
| 1 | **Admin** | Full management. Manage users, roles, submissions. |
| 2 | **Senior Moderator** | Dashboard (submissions), approve/reject, assign custom badges. |
| 3 | **Moderator** | Approve/reject submissions. |
| 4 | **Reviewer** | Review submissions only. |
| 5 | **Contributor** | Upload papers. Auto-assigned on first upload. |
| 6 | **Explorer** | Authenticated user. Browse and download. |
| 7 | **Visitor** | Not signed in. Browse published papers only. |

See [docs/ROLES.md](docs/ROLES.md) for the full role architecture, badge system, achievements, and RPC reference.

## Upload Flow

1. Authenticated user uploads a PDF with full metadata (University, Programme, Semester, Stream, Year, Paper Code, Paper Name)
2. Submission row created with `status = "pending"`
3. Admin can edit metadata before approval
4. Moderator reviews and approves or rejects
5. Senior Moderator publishes → file moved to public bucket → visible in Browse

## Features

- **Browse & Search** — Filter by university, programme, stream, year, and search by keyword
- **Upload System** — Full metadata entry with file rename before storage
- **Paper Bounty Board** — Request papers, upvote requests, admins mark as fulfilled
- **Syllabus** — University-wide and paper-wise syllabus pages
- **Badge System** — Primary role badges, custom functional badges, achievement badges
- **Admin Dashboard** — Submission management, user roles, stats, and support requests
- **XP & Achievements** — Cosmetic gamification (never affects permissions)

## Storage Buckets

| Bucket | Visibility | Purpose |
|---|---|---|
| `uploads-temp` | Private | Holds files during pending/review stage |
| `uploads-approved` | Public | Holds published papers served to users |

## Security

- **Backend is the security boundary** — RLS policies and `SECURITY DEFINER` RPCs enforce all access
- **Client Singleton** — All code uses `getSupabase()` from `js/supabase-client.js`
- **Fresh Auth Checks** — `auth:ready` event required before any protected action
- **RLS on all tables** — Database and storage RLS are separate layers

## Folder Structure

```
/
├── index.html              # Home page
├── upload.html             # Upload page
├── browse.html             # Browse papers
├── paper.html              # Individual paper view
├── syllabus.html           # Syllabus page
├── requests.html           # Paper bounty board
├── notes.html              # Notes & references (placeholder)
├── about.html              # About page
├── settings.html           # User settings
├── support.html            # Help & support
├── js/                     # JavaScript modules
├── css/                    # Stylesheets
├── admin/                  # Admin dashboard, SQL migrations
├── docs/                   # Documentation
├── templates/              # PDF generation templates
├── data/                   # Static data files
└── assets/                 # Static assets (images, icons)
```

## Documentation

| Document | Description |
|----------|-------------|
| [ROLES.md](docs/ROLES.md) | Role hierarchy, permissions, badges, achievements, RPCs |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Supabase setup, SQL migration order |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture overview |
| [FRONTEND.md](docs/FRONTEND.md) | Frontend conventions and script loading |
| [STORAGE_FLOW.md](docs/STORAGE_FLOW.md) | Upload storage path structure |
| [ACHIEVEMENTS.md](docs/ACHIEVEMENTS.md) | Achievement system details |
| [RLS_POLICY.md](docs/RLS_POLICY.md) | Row Level Security policies |

## How to Run Locally

1. Clone this repository
2. Run `npm install` to install dependencies
3. Create a Supabase project at [supabase.com](https://supabase.com)
4. Run SQL scripts from `admin/sql/` in numerical order
5. Enable Google OAuth provider in Supabase Authentication → Providers
6. Update `js/supabase.js` with your project URL and anon key
7. Serve with any static file server:

```bash
npx serve .
```
