# ExamArchive v2

> A student-driven academic archive for university question papers.

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
| 0 | **Founder** | Full access. Unique (only one user). Can assign all roles including Admin. |
| 1 | **Admin** | Full management. Can manage users, roles, submissions. |
| 2 | **Senior Moderator** | Can access admin dashboard, review submissions. |
| 3 | **Moderator** | Can approve/reject submissions. |
| 4 | **Reviewer** | Can review submissions only. Cannot approve/publish. |
| 5 | **Contributor** | Can upload papers. Auto-assigned on first upload. |
| 6 | **Member** | Authenticated user. Can browse and download. |
| 7 | **Visitor** | Not signed in. Can browse published papers only. |

### Admin Dashboard & Role Management

Users with `Founder`, `Admin`, or `Senior Moderator` role can access the admin dashboard at `/admin/dashboard/`. Founder and Admin users can manage roles:

- Search users by username, email, or UUID
- Edit primary role, XP, level, secondary/tertiary roles, and custom badges
- Changes saved via `update_user_role()` RPC (backend-enforced)

See [docs/PHASE4_SETUP.md](docs/PHASE4_SETUP.md) for full setup instructions.

### XP System (Cosmetic Only)

| XP | Title |
|----|-------|
| 0 | Visitor |
| 100 | Explorer |
| 300 | Contributor |
| 800 | Veteran |
| 1500 | Senior |
| 3000 | Elite |
| 5000 | Legend |

XP is earned from daily login streaks (+5/day) and paper uploads (+50). XP does **not** grant any permissions.

## Badge Display System

The profile panel displays up to **3 badges** per user:

| Slot | Badge | Source |
|---|---|---|
| 1 | Primary Role | Maps from `primary_role` column |
| 2 | Functional Badge | From `secondary_role` or `tertiary_role` |
| 3 | Custom Badge | From `custom_badges` JSON array in roles table |

Badges are fully dynamic — no hardcoded user IDs.

## Achievement System

Achievements are auto-awarded and displayed in the profile panel:

| Achievement | Trigger |
|---|---|
| First Upload | User submits their first paper |
| 10 Uploads | User reaches 10 submissions |
| First Review | User reviews their first submission |
| First Publish | User publishes their first paper |
| Early Adopter | Among the first 10 registered users |

Achievements are stored in the `achievements` table and awarded via the `award_achievement()` RPC.

## Upload Flow

1. Authenticated user uploads a PDF → file saved to `uploads-temp` bucket (private)
2. Submission row created with `status = "pending"`
3. Moderator reviews and approves or rejects the submission
4. Senior Moderator publishes the approved submission → file moved to `uploads-approved` bucket
5. Paper appears on the Browse page via backend query

```
User upload → uploads-temp (private) → pending
  → Moderator approves → approved
  → Senior Moderator publishes → uploads-approved (public) → published → visible in Browse
```

## Paper Bounty Board

Users can request papers they need at `/requests.html`:
- Create requests with paper code, year, and description
- Upvote requests (one vote per user per request)
- Admins can mark requests as fulfilled
- Stored in `paper_requests` table with vote tracking in `paper_request_votes`

## Storage Buckets

| Bucket | Visibility | Purpose |
|---|---|---|
| `uploads-temp` | Private | Holds files during pending/review stage |
| `uploads-approved` | Public | Holds published papers served to users |

## Security Model

### Backend is the Security Boundary

RLS policies and `SECURITY DEFINER` RPCs enforce all access control. The frontend reads `primary_role` from the `roles` table for UI gating (show/hide admin features), but the database is the authority and rejects unauthorized operations regardless of frontend state.

### Client Singleton
All code uses `getSupabase()` from `js/supabase-client.js`. Never create Supabase clients directly.

### Fresh Auth Checks
1. Upload button blocked until `auth:ready` event fires
2. `supabase.auth.getUser()` called before every database insert
3. Only fresh `user.id` from `getUser()` is used in submissions

### Row-Level Security
All tables have RLS enabled. Storage RLS and Database RLS are separate security layers.

## Folder Structure

```
/
├── index.html              # Home page
├── upload.html             # Upload page
├── browse.html             # Browse papers (backend-driven)
├── paper.html              # Individual paper view (backend-driven)
├── requests.html           # Paper bounty board
├── about.html              # About page
├── settings.html           # User settings
├── support.html            # Help & support
├── privacy.html            # Privacy policy
├── terms.html              # Terms of service
├── js/
│   ├── supabase-client.js  # Singleton client factory
│   ├── auth-controller.js  # Central auth state manager (Google + email/password)
│   ├── admin-auth.js       # Admin access verification via backend RPCs
│   ├── upload-handler.js   # Storage + submission logic
│   ├── browse.js           # Browse page queries + signed URLs
│   ├── paper.js            # Paper page (backend-driven)
│   ├── requests.js         # Paper bounty board logic
│   ├── roles.js            # Role → badge display mapping
│   ├── profile-panel.js    # Profile panel + badges + achievements + streak
│   ├── tutorial.js         # Guided walkthrough for new users
│   ├── modules/
│   │   └── debug.module.js # Debug panel (ES module, role-gated)
│   └── utils/
│       ├── role-utils.js   # getCurrentUserRole() and role verification
│       └── supabase-wait.js# Client readiness helper
├── css/                    # Stylesheets
├── admin/
│   ├── dashboard/          # Admin dashboard + role management UI
│   └── sql/                # Database migration scripts (01–14, run in order)
├── docs/                   # Documentation
├── partials/               # Reusable HTML components
├── data/                   # Static data files
└── assets/                 # Static assets (images, icons)
```

## Documentation

| Document | Description |
|----------|-------------|
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Supabase setup, SQL migration order, local development |
| [PHASE4_SETUP.md](docs/PHASE4_SETUP.md) | Phase 4 setup: role system, admin dashboard, XP, promotions |
| [PROMOTION_GUIDE.md](docs/PROMOTION_GUIDE.md) | How to promote users, role hierarchy, security rules |
| [ROLE_SYSTEM.md](docs/ROLE_SYSTEM.md) | Role architecture: primary_role, badges, achievements |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | High-level system architecture |
| [FRONTEND.md](docs/FRONTEND.md) | Frontend conventions, script loading order |
| [STORAGE_FLOW.md](docs/STORAGE_FLOW.md) | Upload storage path structure |
| [ACHIEVEMENTS.md](docs/ACHIEVEMENTS.md) | Achievement system details |
| [DEBUG_SYSTEM.md](docs/DEBUG_SYSTEM.md) | Debug panel usage |

## How to Run Locally

1. Clone this repository
2. Create a Supabase project at [supabase.com](https://supabase.com)
3. Run SQL scripts from `admin/sql/` in numerical order (01 through 14)
4. Enable Google OAuth provider in Supabase Authentication → Providers
5. Verify storage buckets exist: `uploads-temp` (private), `uploads-approved` (public)
6. Update `js/supabase.js` with your project URL and anon key
7. Serve with any static file server:

```bash
npx serve .
# or
python3 -m http.server 8000
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for full deployment details and [docs/PHASE4_SETUP.md](docs/PHASE4_SETUP.md) for Phase 4 setup.
