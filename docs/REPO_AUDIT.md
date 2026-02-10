# Repository Audit — ExamArchive v2

> Generated: 2026-02-10
> Purpose: Honest assessment of every file and folder in the repo

---

## Directory Structure

### `/` (Root)

| File | Purpose | Status |
|------|---------|--------|
| `index.html` | Home page | Active |
| `browse.html` | Browse papers page | Active — **shows cards from JSON even when no approved papers exist** |
| `upload.html` | Upload page | Active — **upload fails at Supabase Storage** |
| `paper.html` | Individual paper view | Active |
| `settings.html` | Theme/font settings | Active |
| `about.html` | About page | Active |
| `privacy.html` | Privacy policy | Active |
| `terms.html` | Terms of service | Active |
| `CNAME` | Custom domain config | Active |
| `README.md` | Quick start guide | **Outdated** — references old doc structure |
| `package.json` | Dependencies (puppeteer) | Active |

### `/js/` — JavaScript

| File | Purpose | Status |
|------|---------|--------|
| `bootstrap.js` | Creates `window.App` object | Active |
| `supabase.js` | ES module — Supabase client init | Active |
| `supabase-client.js` | Classic script — storage helpers (BUCKETS, uploadFile) | Active |
| `auth-controller.js` | Central auth controller (Phase 9.2) | Active |
| `auth.js` | Legacy auth file | **Dead** — superseded by auth-controller.js |
| `avatar-utils.js` | Avatar rendering, sign-in/out handlers | Active — **does not use provider avatar_url in header** |
| `avatar-popup.js` | Auth popup UI | Active |
| `profile-panel.js` | User profile panel | Active |
| `browse.js` | Browse page — loads papers.json | Active — **misleading: shows JSON cards as if papers are approved** |
| `upload.js` | Upload page controller | Active |
| `upload-handler.js` | Supabase storage upload logic | Active — **upload fails** |
| `common.js` | Partial loader (header/footer) | Active |
| `roles.js` | Role verification via RPC | Active |
| `admin-auth.js` | Admin authentication helpers | Active |
| `settings.js` | Theme management | Active |
| `theme.js` | Theme switching | Active |
| `paper.js` | Paper view logic | Active |
| `home-search.js` | Home page search | Active |
| `about.js` | About page logic | Active |
| `notices-calendar.js` | Notices/calendar display | Active |
| `app.module.js` | ES module entry point | Active |

### `/js/modules/`

| File | Purpose | Status |
|------|---------|--------|
| `auth.module.js` | Auth state management (ES module) | Active |
| `debug.module.js` | Debug utilities (ES module) | Active |

### `/js/utils/`

| File | Purpose | Status |
|------|---------|--------|
| `supabase-wait.js` | `window.waitForSupabase()` utility | Active |

### `/css/` — Stylesheets

All CSS files are active and in use by their respective HTML pages.

### `/partials/` — Reusable HTML Fragments

| File | Purpose | Status |
|------|---------|--------|
| `header.html` | Site header with nav, theme toggle, avatar | Active |
| `footer.html` | Site footer | Active |
| `avatar-popup.html` | Auth popup HTML | Active |
| `profile-panel.html` | Profile panel HTML | Active |

### `/data/` — Static Data

| File/Dir | Purpose | Status |
|----------|---------|--------|
| `papers.json` | Paper metadata (36 entries) | Active — **misleading: browse shows these as if they're approved uploads** |
| `calendar.json` | Academic calendar | Active |
| `notices.json` | System notices | Active |
| `registry/` | Feature flags, programme/stream/subject lists | Active |
| `repeated-questions/` | RQ data | **Incomplete** — schema exists but no content |
| `syllabus/` | Syllabus data | **Incomplete** — partial data |
| `about/` | About page content | Active |

### `/papers/` — Actual PDF Files

Contains 36 real PDF files organized by university/programme/subject. These are legitimate exam papers.

### `/maps/` — Curriculum Maps

JSON files mapping paper codes to curriculum structure. **Purpose unclear** — not referenced in main application code.

### `/admin/` — Admin Dashboard

| File | Purpose | Status |
|------|---------|--------|
| `dashboard.html` | Admin review dashboard | Active |
| `dashboard.js` | Admin panel logic | Active |
| `dashboard.css` | Admin styling | Active |
| `sql/` | Database migration scripts | Reference only |

### `/demo/` — Demo Pages

| File | Purpose | Status |
|------|---------|--------|
| `pdf-demo.html/css/js` | PDF viewer demo | **Dead** — not linked anywhere |
| `profile-demo.html` | Profile page demo | **Dead** — not linked anywhere |

### `/templates/`

| File | Purpose | Status |
|------|---------|--------|
| `syllabus.html` | Syllabus PDF generation template | Active (used by build scripts) |

### `/scripts/` — Build Scripts

| File | Purpose | Status |
|------|---------|--------|
| `generate-papers.js` | Generate papers.json from PDF files | Active |
| `generate-syllabus-pdf.js` | Generate syllabus PDFs | Active |
| `build-about-status.js` | Build about page status data | Active |
| `build-about-timeline.js` | Build about page timeline | Active |
| `reorganize-papers.js` | One-time paper reorganization | **Dead** — already executed |

### `/docs/` — Documentation (ARCHIVED)

All previous docs moved to `docs/_archive/`. Previous docs were comprehensive but referenced outdated phase numbers and did not reflect current broken state.

### `/__archive__/` — Previously Removed Files

Contains files removed in Phase 9.2.7 and 9.2.8 — debug logger, old avatar.js, outdated docs.

---

## Key Issues Found

1. **Upload is broken** — `upload-handler.js` uploads to Supabase Storage but fails (likely RLS policy or bucket config issue)
2. **Avatar does not show provider image** — `avatar-utils.js` has `updateAvatarElement()` that handles `avatar_url` from user metadata, but the header's `.avatar-mini` element is not updated with this function
3. **Browse page is misleading** — Shows 36 paper cards from `papers.json` as if they're approved uploads. These are real PDFs but the browse page doesn't distinguish between static files and Supabase-approved submissions
4. **`auth.js` is dead code** — Superseded by `auth-controller.js` but still exists
5. **`maps/` purpose unclear** — JSON files exist but aren't consumed by the app
6. **`demo/` is dead** — Not linked from anywhere
7. **`scripts/reorganize-papers.js` is dead** — One-time migration already completed
8. **Docs were outdated** — Referenced Phase 9.2 as current but system needs Phase 1 restart

---

## Recommendations

- Fix upload pipeline (non-negotiable)
- Fix avatar to show Google/GitHub provider image in header
- Make browse page honest — only show admin-approved papers, or clearly label static papers
- Delete `js/auth.js` (dead code)
- Archive or remove `demo/` directory
- Archive `scripts/reorganize-papers.js`
- Reset documentation to Phase 1
