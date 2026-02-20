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
| Authentication | Google OAuth via Supabase Auth |
| Security | Row-Level Security (RLS) on all tables |

No build step, no framework, no bundler. Just HTML, CSS, and JavaScript served as static files.

## Role-Based Approval System

Access is controlled by numeric role levels stored in the `roles` table. The frontend maps levels to roles client-side via `mapRole()`.

| Level | Role | Capabilities |
|---|---|---|
| 0 | Visitor | Browse approved papers only |
| 10 | Contributor | Upload papers for review |
| 75 | Reviewer | Review, approve, or reject pending submissions |
| 90 | Publisher | Publish approved papers; debug panel visible |
| 100 | Admin | Full access; reset counters; full debug logging |

New users are automatically assigned **Contributor** (level 10) on signup. Roles are managed via the `roles` table in Supabase.

```javascript
// js/utils/role-utils.js
function mapRole(level) {
  if (level >= 100) return { name: 'admin', displayName: '👑 Admin', icon: '👑' };
  if (level >= 90)  return { name: 'publisher', displayName: '📢 Publisher', icon: '📢' };
  if (level >= 75)  return { name: 'reviewer', displayName: '🛡️ Reviewer', icon: '🛡️' };
  if (level >= 10)  return { name: 'contributor', displayName: '✍️ Contributor', icon: '✍️' };
  return { name: 'visitor', displayName: '👤 Visitor', icon: '👤' };
}
```

**Important:** Always fetch the role **level** from the backend and map it client-side. Never depend on the database returning a role name.

## Upload Flow

1. Authenticated user uploads a PDF → file saved to `uploads-temp` bucket (private)
2. Submission row created with `status = "pending"`, `user_id` from a fresh `getUser()` call, `original_filename`, and `file_size`
3. **Reviewer (≥75)** reviews and approves or rejects the submission
4. **Publisher (≥90)** publishes the approved submission → file copied to `uploads-approved` bucket, status set to `"published"`
5. Paper appears on the Browse page via backend query

```
User upload → uploads-temp (private) → pending
  → Reviewer approves (≥75) → approved
  → Publisher publishes (≥90) → uploads-approved (public) → published → visible in Browse
```

## Backend-Driven Browse

The Browse page queries the `submissions` table directly with `status = 'published'`. There is no static `papers.json` file for browse data — all content is served live from the database.

1. Page loads → queries `submissions` where `status = 'published'`
2. For each result, a **signed URL** is generated from the `uploads-approved` bucket
3. Paper cards are rendered client-side from the query results

Signed URLs provide time-limited access to files in the `uploads-approved` bucket, ensuring controlled download access even for public content.

## Storage Buckets

| Bucket | Visibility | Purpose |
|---|---|---|
| `uploads-temp` | Private | Holds files during pending/review stage |
| `uploads-approved` | Public | Holds published papers served to users |

**uploads-temp RLS:**
- Authenticated users can upload (INSERT)
- Users can only read their own files (SELECT where `auth.uid() = owner`)

**uploads-approved RLS:**
- Public read access (no authentication required)
- Only privileged roles can write (INSERT/UPDATE/DELETE where role level ≥ 75)

### Required Submission Fields

| Field | Type | Description |
|---|---|---|
| `user_id` | uuid | From `supabase.auth.getUser()` |
| `paper_code` | text | Paper/subject code |
| `year` | int | Examination year |
| `storage_path` | text | Path in `uploads-temp` bucket |
| `original_filename` | text | Original filename from `file.name` |
| `file_size` | bigint | File size in bytes from `file.size` |
| `content_type` | text | MIME type (defaults to `application/pdf`) |
| `status` | text | `"pending"` for normal uploads |

## Visitor Counter

ExamArchive tracks site visits using a server-side counter:

1. On page load, the frontend checks `sessionStorage` for a `visited` flag
2. If not set, calls the `increment_visit_counter()` RPC function in Supabase
3. Sets `sessionStorage.visited = true` to prevent duplicate counts in the same session
4. The current count is read from the `site_stats` table and displayed in the footer

Admins (level 100) can reset the counter via the debug panel.

## Security Model

### Client Singleton

All code uses `getSupabase()` from `js/supabase-client.js`. Never create Supabase clients directly.

```javascript
const supabase = window.getSupabase ? window.getSupabase() : null;
```

### Fresh Auth Checks

1. Upload button blocked until `auth:ready` event fires
2. `supabase.auth.getUser()` called before every database insert — never cached
3. If no user or auth error, the operation is rejected immediately
4. Only fresh `user.id` from `getUser()` is used in submissions

### Row-Level Security

**Storage RLS** controls file access in Supabase Storage buckets.
**Database RLS** controls row access in Supabase Database tables.

These are **separate security layers**. An authenticated user can upload to `uploads-temp` (Storage RLS allows it), but the submission must still pass Database RLS (`user_id` must match `auth.uid()`).

```sql
CREATE POLICY "users insert own submissions"
ON submissions FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  OR get_current_user_role_level() >= 75
);
```

## Debug Panel

The debug panel (🐛 icon) is an ES module (`js/modules/debug.module.js`) gated by role level:

| Level | Access |
|---|---|
| < 90 | Panel hidden |
| ≥ 90 | Panel visible; view classified logs |
| ≥ 100 | Full access; export, copy, and clear logs |

Auto-classified error tags:

| Tag | Color | Description |
|---|---|---|
| `[AUTH]` | Blue | Authentication/JWT errors |
| `[RLS]` | Red | Row-level security violations |
| `[STORAGE]` | Orange | Storage bucket errors |
| `[CLIENT]` | Purple | Client initialization errors |

## Theme System

Themes are applied via `body[data-theme]` and configured through CSS custom properties in `css/brand.css`:

| Theme | Attribute |
|---|---|
| Light | `body[data-theme="light"]` |
| Dark | `body[data-theme="dark"]` |
| AMOLED | `body[data-theme="amoled"]` |

Key CSS tokens:
- `--bg`, `--bg-soft`, `--surface` — backgrounds
- `--text`, `--text-muted` — text colors
- `--border`, `--accent`, `--accent-soft` — UI chrome
- `--color-success`, `--color-error`, `--color-info`, `--color-warning` — status colors

Night mode support is included. Theme presets (e.g., `red-classic`, `blue-slate`) set coordinated values for all variables with light, dark, and AMOLED variants.

## Support Page

The support page (`support.html`) allows users to submit admin application requests. Users can request elevated roles by filling out a form that is reviewed by existing administrators.

## Folder Structure

```
/
├── index.html              # Home page
├── upload.html             # Upload page
├── browse.html             # Browse papers (backend-driven)
├── about.html              # About page (live database stats)
├── settings.html           # User settings
├── support.html            # Admin application / support requests
├── paper.html              # Individual paper view
├── privacy.html            # Privacy policy
├── terms.html              # Terms of service
├── js/
│   ├── supabase-client.js  # Singleton client factory
│   ├── auth-controller.js  # Central auth state manager
│   ├── upload-handler.js   # Storage + submission logic
│   ├── browse.js           # Browse page queries + signed URLs
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
├── admin/sql/              # Database setup scripts (run in order)
├── docs/                   # Documentation
├── partials/               # Reusable HTML components
├── data/                   # Static data files
├── templates/              # Page templates
├── scripts/                # Build/utility scripts
└── assets/                 # Static assets (images, icons)
```

## How to Run Locally

1. Clone this repository
2. Create a Supabase project at [supabase.com](https://supabase.com)
3. Run SQL scripts from `admin/sql/` in numerical order (01 through 07)
4. Enable Google OAuth provider in Supabase Authentication → Providers
5. Verify storage buckets exist: `uploads-temp` (private), `uploads-approved` (public)
6. Update `js/supabase.js` with your project URL and anon key
7. Serve with any static file server:
   ```bash
   python -m http.server 8000
   ```
8. Open `http://localhost:8000`

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed setup instructions.

## Documentation

| Document | Content |
|---|---|
| [Architecture](docs/ARCHITECTURE.md) | System overview and data flow |
| [Phase 1](docs/PHASE1.md) | Phase 1 summary — Core Recovery |
| [Phase 2](docs/PHASE2.md) | Phase 2 summary — Backend Migration & Stabilization |
| [Timeline](docs/TIMELINE.md) | Project timeline and roadmap |
| [Backend](docs/BACKEND.md) | Tables, RLS, RPC functions, SQL setup |
| [Frontend](docs/FRONTEND.md) | Auth listener, upload logic, debug system |
| [RLS Policy](docs/RLS_POLICY.md) | Row-level security policies |
| [Role System](docs/ROLE_SYSTEM.md) | Role levels, promotion, access control |
| [Storage Flow](docs/STORAGE_FLOW.md) | Buckets, upload/approval flow, rollback |
| [Debug System](docs/DEBUG_SYSTEM.md) | Debug panel usage and error diagnosis |
| [Deployment](docs/DEPLOYMENT.md) | GitHub Pages and Supabase setup |
| [Timelog](docs/TIMELOG.md) | Development history |

## Current System Status

- ✅ Authentication (Google OAuth via Supabase)
- ✅ Role-based access control (5-tier: Visitor / Contributor / Reviewer / Publisher / Admin)
- ✅ Upload with RLS enforcement and fresh `getUser()` checks
- ✅ Admin workflow split (approve vs publish at different role levels)
- ✅ Backend-driven browse page (no static papers.json)
- ✅ Signed URL generation for approved papers
- ✅ Debug panel with error classification (Publisher/Admin only)
- ✅ Visitor counter with sessionStorage dedup and RPC
- ✅ About page with live database stats
- ✅ Support page for admin application requests
- ✅ Mobile-friendly responsive design
- ✅ Theme system with brand.css tokens (light/dark/AMOLED + night mode)
- ✅ Visitor badge when logged out
- ✅ Console.log cleanup (no debug noise in production)

## Roadmap

- **Phase 1** ✅ — Core Recovery (Dec 2024 – Jan 2025)
- **Phase 2** ✅ — Backend Migration & Stabilization (Jan – Feb 2025)
- **Phase 3** 🔜 — Auth & User System (profile pages, email login, session management)
- **Phase 4** 🔜 — Content Backend Expansion (search, syllabus, repeated questions)
- **Phase 5** 🔜 — AI Integration (smart search, auto-tagging, recommendations)
- **Phase 6** 🔜 — Public Launch (custom domain, SEO, onboarding, analytics)

See [docs/TIMELINE.md](docs/TIMELINE.md) for details.

## License

MIT License — See LICENSE file for details.
