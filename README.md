# ExamArchive v2

> A modern, community-driven archive of university question papers.

## What is ExamArchive

ExamArchive is a web application where students can upload, browse, and download university question papers. It provides a centralized repository for exam preparation materials with role-based access control and a review pipeline for quality assurance.

## Tech Stack

| Component | Technology |
|---|---|
| Frontend | Static HTML / CSS / Vanilla JavaScript |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| Hosting | GitHub Pages |
| Authentication | Google OAuth via Supabase Auth |
| Security | Row-Level Security (RLS) on all tables |

No build step, no framework, no dependencies. Just HTML, CSS, and JavaScript.

## Role System

| Level | Role | Access |
|---|---|---|
| 0 | Visitor | Browse approved papers |
| 10 | Contributor | Upload papers |
| 80 | Reviewer | Approve/reject submissions |
| 100 | Admin | Full access |

New users are automatically assigned **Contributor** (level 10) on signup. Roles are managed via the `roles` table in Supabase.

## Upload Flow

1. Authenticated user uploads a PDF → saved to `uploads-temp` bucket
2. Submission row created with `status = "pending"` and `user_id` from fresh `getUser()` call
3. Reviewer approves → file copied to `uploads-approved`, status updated
4. Paper appears in Browse page

**Demo papers** skip review and appear immediately.

## Storage Buckets

ExamArchive uses two storage buckets:

| Bucket | Visibility | Purpose |
|---|---|---|
| `uploads-temp` | Private | Temporary storage for pending submissions |
| `uploads-approved` | Public | Public storage for approved papers |

### Storage RLS Policies

**uploads-temp:**
- Authenticated users can upload (INSERT)
- Users can only read their own files (SELECT where auth.uid() = owner)

**uploads-approved:**
- Public read access (no authentication required)
- Only reviewers/admins can write (INSERT/UPDATE/DELETE where role level ≥ 80)

## Role System Details

Roles are stored in the `roles` table with numeric levels. Frontend uses a centralized `mapRole(level)` function:

```javascript
// In js/utils/role-utils.js
function mapRole(level) {
  if (level >= 100) return { name: 'admin', displayName: '👑 Admin', icon: '👑' };
  if (level >= 80) return { name: 'reviewer', displayName: '🛡️ Reviewer', icon: '🛡️' };
  if (level >= 10) return { name: 'contributor', displayName: '✍️ Contributor', icon: '✍️' };
  return { name: 'visitor', displayName: '👤 Visitor', icon: '👤' };
}
```

**Important:** Always fetch the role **level** from the backend and map it client-side. Never depend on the database returning a name. If no role row exists, default to level 10 (Contributor).

## Security Model

### Client Singleton

All code uses `getSupabase()` from `js/supabase-client.js`. Never create clients directly.

```javascript
const supabase = window.getSupabase ? window.getSupabase() : null;
```

### Upload Guard

1. Upload button blocked until `auth:ready` event fires
2. `supabase.auth.getUser()` called before every insert — never cached
3. If no user or auth error, upload is rejected immediately
4. Only fresh `user.id` from `getUser()` is used in submissions

### Database RLS Policy

```sql
-- Users insert own submissions (admin/reviewer bypass for level >= 80)
CREATE POLICY "users insert own submissions"
ON submissions FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  OR get_current_user_role_level() >= 80
);
```

### Separation of Storage RLS and Database RLS

**Storage RLS** controls file access in Supabase Storage buckets.  
**Database RLS** controls row access in Supabase Database tables.  

These are **separate security layers**. An authenticated user can upload to `uploads-temp` (Storage RLS allows it), but the submission must still pass Database RLS (user_id must match auth.uid()).

### Debug Panel

The debug panel (🐛 icon) auto-classifies errors:

| Tag | Color | Description |
|---|---|---|
| `[AUTH]` | Blue | Authentication/JWT errors |
| `[RLS]` | Red | Row-level security violations |
| `[STORAGE]` | Orange | Storage bucket errors |
| `[CLIENT]` | Purple | Client initialization errors |

Storage errors include full context:
- Bucket name used
- Storage path
- Full error object
- HTTP status code

## How to Run Locally

1. Clone this repository
2. Set up a Supabase project — run SQL scripts from `admin/sql/` in order (01 through 07)
3. Update `js/supabase.js` with your project URL and anon key
4. Configure Google OAuth provider in Supabase Authentication settings
5. Serve with any static file server:
   ```bash
   python -m http.server 8000
   ```
6. Open `http://localhost:8000`

## How to Configure Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run SQL scripts in `admin/sql/` in numerical order
3. Enable Google provider in Authentication → Providers
4. Verify storage buckets: `uploads-temp` (private), `uploads-approved` (public)
5. Update `js/supabase.js` with your project URL and anon key

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed setup instructions.

## Folder Structure

```
/
├── index.html              # Home page
├── upload.html             # Upload page
├── browse.html             # Browse papers
├── about.html              # About page
├── settings.html           # User settings
├── js/                     # JavaScript modules
│   ├── supabase-client.js  # Singleton client factory
│   ├── auth-controller.js  # Central auth state manager
│   ├── upload-handler.js   # Storage + submission logic
│   └── modules/            # ES modules (debug panel)
├── css/                    # Stylesheets
├── admin/sql/              # Database setup scripts
├── docs/                   # Documentation
├── partials/               # Reusable HTML components
└── assets/                 # Static assets
```

## Documentation

| Document | Content |
|---|---|
| [Architecture](docs/ARCHITECTURE.md) | System overview and data flow |
| [Backend](docs/BACKEND.md) | Tables, RLS, RPC functions, SQL setup |
| [Frontend](docs/FRONTEND.md) | Auth listener, upload logic, debug system |
| [RLS Policy](docs/RLS_POLICY.md) | Row-level security policies |
| [Role System](docs/ROLE_SYSTEM.md) | Role levels, promotion, access control |
| [Storage Flow](docs/STORAGE_FLOW.md) | Buckets, upload/approval flow, rollback |
| [Debug System](docs/DEBUG_SYSTEM.md) | Debug panel usage and error diagnosis |
| [Deployment](docs/DEPLOYMENT.md) | GitHub Pages and Supabase setup |
| [Timelog](docs/TIMELOG.md) | Development history |

## Current System Status

- ✅ Authentication (Google OAuth)
- ✅ Role-based access control (4-tier)
- ✅ Upload with RLS enforcement
- ✅ Admin/Reviewer bypass for submissions
- ✅ Debug panel with error classification
- ✅ Mobile-friendly responsive design
- ✅ Demo paper auto-approval

## Roadmap

- **Phase 1** ✅ — Core Recovery (backend reset, upload fix, calendar, debug)
- **Phase 2** ✅ — Auth + RLS Stabilization (singleton enforcement, error classification)
- **Phase 3** — Search & Browse enhancements
- **Phase 4** — Syllabus and repeated questions
- **Phase 5** — AI integration

## License

MIT License — See LICENSE file for details.
