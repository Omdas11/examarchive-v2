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
| 0 | Visitor | Browse published papers only |
| 10 | User | Basic authenticated access |
| 20 | Contributor | Auto-assigned after first upload |
| 50 | Reviewer | Can review submissions |
| 75 | Moderator | Approve or reject pending submissions |
| 90 | Senior Moderator | Publish approved papers; debug panel visible |
| 100 | Founder/Admin | Full access; manage roles; reset counters |

New users are automatically assigned **User** (level 10) on signup. After their first upload, they are auto-promoted to **Contributor** (level 20).

```javascript
// js/utils/role-utils.js
function mapRole(level) {
  if (level >= 100) return { name: 'admin', displayName: '👑 Founder', icon: '👑' };
  if (level >= 90)  return { name: 'senior_moderator', displayName: '🔰 Senior Moderator', icon: '🔰' };
  if (level >= 75)  return { name: 'moderator', displayName: '🛡️ Moderator', icon: '🛡️' };
  if (level >= 50)  return { name: 'reviewer', displayName: '📋 Reviewer', icon: '📋' };
  if (level >= 20)  return { name: 'contributor', displayName: '✍️ Contributor', icon: '✍️' };
  if (level >= 10)  return { name: 'user', displayName: '👤 User', icon: '👤' };
  return { name: 'visitor', displayName: '👁️ Visitor', icon: '👁️' };
}
```

**Important:** Always fetch the role **level** from the backend and map it client-side. Never depend on the database returning a role name.

### Admin Role Management

Admins (level ≥ 100) can manage user roles from the Admin Dashboard:
- Search users by email or UUID
- Edit level, primary/secondary/tertiary roles, and custom badges
- Changes saved via RLS-safe `update_user_role()` RPC

## Badge Display System

The profile panel displays up to **3 badges** per user:

| Slot | Badge | Condition |
|---|---|---|
| 1 | Primary Role | Always shown (maps from role level) |
| 2 | Founder | Auto if level = 100 |
| 2 | Contributor | Auto if user has ≥1 upload (when not Founder) |
| 3 | Custom Badge | From `custom_badges` column in roles table |

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
3. **Moderator (≥75)** reviews and approves or rejects the submission
4. **Senior Moderator (≥90)** publishes the approved submission → file in `uploads-approved` bucket
5. Paper appears on the Browse page via backend query

```
User upload → uploads-temp (private) → pending
  → Moderator approves (≥75) → approved
  → Senior Moderator publishes (≥90) → uploads-approved (public) → published → visible in Browse
```

**Note:** The "Approve & Publish" combined action has been removed. Approve and Publish are now separate steps.

## Paper Bounty Board

Users can request papers they need at `/requests.html`:
- Create requests with paper code, year, and description
- Upvote requests (one vote per user per request)
- Admins can mark requests as fulfilled
- Stored in `paper_requests` table with vote tracking in `paper_request_votes`

## Backend-Driven Pages

### Browse Page
Queries `submissions` table with `status = 'published'`. Signed URLs generated for each paper.

### Paper Page
Loads paper details from `submissions` table by paper code or ID. Shows title, year, file size, published date, and signed URL for PDF access.

## Active Users Counter

The footer displays visitor count and active user count:
- **Visitors**: Total visits tracked via `increment_visit_counter()` RPC
- **Active**: Users signed in within last 10 minutes via `get_active_user_count()` RPC
- Stats cached for 30 seconds in sessionStorage

## Storage Buckets

| Bucket | Visibility | Purpose |
|---|---|---|
| `uploads-temp` | Private | Holds files during pending/review stage |
| `uploads-approved` | Public | Holds published papers served to users |

## Security Model

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
├── support.html            # Help & support / admin application
├── privacy.html            # Privacy policy
├── terms.html              # Terms of service
├── js/
│   ├── supabase-client.js  # Singleton client factory
│   ├── auth-controller.js  # Central auth state manager
│   ├── upload-handler.js   # Storage + submission logic
│   ├── browse.js           # Browse page queries + signed URLs
│   ├── paper.js            # Paper page (backend-driven)
│   ├── requests.js         # Paper bounty board logic
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
│   ├── dashboard/          # Admin dashboard + role management
│   └── sql/                # Database migration scripts (run in order)
├── docs/                   # Documentation
├── partials/               # Reusable HTML components
├── data/                   # Static data files
└── assets/                 # Static assets (images, icons)
```

## How to Run Locally

1. Clone this repository
2. Create a Supabase project at [supabase.com](https://supabase.com)
3. Run SQL scripts from `admin/sql/` in numerical order (01 through 12)
4. Enable Google OAuth provider in Supabase Authentication → Providers
5. Verify storage buckets exist: `uploads-temp` (private), `uploads-approved` (public)
6. Update `js/supabase.js` with your project URL and anon key
7. Serve with any static file server:

```bash
npx serve .
# or
python3 -m http.server 8000
```
