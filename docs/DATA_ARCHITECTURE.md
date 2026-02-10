# Data Architecture

> Authoritative repo structure and the purpose of each folder.

---

## Repository Structure

```
examarchive-v2/
│
├── index.html, browse.html, upload.html, ...   # Page entry points
│
├── css/                    # Stylesheets (one per component/page)
│
├── js/                     # JavaScript
│   ├── auth-controller.js  # Central auth — SINGLE SOURCE OF TRUTH
│   ├── supabase.js         # Supabase client init (ES module)
│   ├── supabase-client.js  # Storage helpers (classic script)
│   ├── bootstrap.js        # App initialization
│   ├── upload-handler.js   # Upload logic (validation, storage, DB)
│   ├── upload.js           # Upload page controller
│   ├── browse.js           # Browse page (filtering, sorting, rendering)
│   ├── avatar-utils.js     # Avatar rendering, OAuth handlers
│   ├── avatar-popup.js     # Auth popup UI
│   ├── profile-panel.js    # User profile panel
│   ├── common.js           # Partial loader (header/footer)
│   ├── roles.js            # Role verification
│   ├── admin-auth.js       # Admin authentication
│   ├── settings.js         # Theme management
│   ├── theme.js            # Theme switching
│   ├── modules/            # ES6 modules (auth, debug)
│   └── utils/              # Shared utilities (supabase-wait)
│
├── partials/               # Reusable HTML (header, footer, avatar popup)
│
├── data/                   # Static data files
│   ├── papers.json         # Paper metadata (generated from /papers/)
│   ├── registry/           # Feature flags, programme/stream/subject lists
│   ├── syllabus/           # Syllabus data (Phase 3)
│   └── repeated-questions/ # RQ data (Phase 4)
│
├── papers/                 # Actual PDF files organized by university/programme/subject
│
├── admin/                  # Admin dashboard (role-restricted)
│   ├── dashboard.html/js/css
│   └── sql/                # Database migration reference scripts
│
├── assets/                 # Images and static files
│
├── scripts/                # Build/generation scripts (CI)
│
├── docs/                   # Documentation (this directory)
│   └── _archive/           # Archived old docs (not authoritative)
│
├── storage/                # Supabase Storage (remote, not in repo)
│   ├── uploads-temp        # Temporary uploads (private, pending review)
│   ├── uploads-approved    # Approved uploads (private)
│   └── uploads-public      # Published uploads (public)
│
└── __archive__/            # Previously removed code files
```

---

## Why Each Folder Exists

| Folder | Reason |
|--------|--------|
| `js/` | All client-side logic. No frameworks — vanilla JS for GitHub Pages compatibility |
| `css/` | Component-scoped stylesheets. No CSS framework |
| `partials/` | HTML fragments loaded by `common.js` to avoid duplication |
| `data/` | Static data that drives the UI. `papers.json` is generated from actual PDFs |
| `papers/` | Real PDF files. The source of truth for static paper content |
| `admin/` | Protected dashboard. Only accessible to admin/reviewer roles |
| `scripts/` | CI-triggered build scripts (generate JSON, PDFs) |
| `docs/` | All documentation. Minimal and authoritative |
| `storage/` | Supabase buckets (remote). Three-stage upload pipeline |

---

## Data Flow

```
User uploads PDF
  → js/upload-handler.js validates file
  → Supabase Storage: uploads-temp/{userId}/{timestamp}-{filename}
  → Supabase DB: submissions table (status: pending)
  → Admin reviews in admin/dashboard.html
  → Approved: file moves to uploads-approved, then uploads-public
  → Published: visible on browse page
```

---

## Auth Flow

```
Page loads
  → js/bootstrap.js creates window.App
  → js/supabase.js initializes Supabase client
  → js/auth-controller.js restores session, emits auth:ready
  → UI components listen for auth:ready and auth-state-changed
```
