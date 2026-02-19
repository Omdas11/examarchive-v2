# Architecture

## Overview

ExamArchive is a community-driven university question paper archive. It uses a **static frontend** served via GitHub Pages and a **Supabase backend** for authentication, database, and file storage.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Static HTML / CSS / Vanilla JavaScript |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| Hosting | GitHub Pages |
| Auth | Google OAuth via Supabase Auth |
| Security | Row-Level Security (RLS) on all tables |

## Core Components

### Frontend

- Pure HTML/CSS/JS — no build step, no framework
- ES modules for debug system (`js/modules/debug.module.js`)
- Classic scripts for page-level logic (`js/upload.js`, `js/browse.js`, etc.)
- Supabase JS SDK loaded via CDN

### Backend (Supabase)

- **Tables:** `roles`, `submissions`
- **Storage Buckets:** `uploads-temp` (private), `uploads-approved` (public)
- **RPC Functions:** `get_current_user_role_level()`, `get_user_role_name()`, `is_admin()`
- **RLS:** Enabled on all tables with role-based policies

### Auth Flow

1. User clicks "Sign in with Google"
2. Supabase handles OAuth redirect and session creation
3. On signup, trigger auto-assigns role level 10 (Contributor)
4. Frontend emits `auth:ready` event when session is restored
5. All pages listen for `auth:ready` before enabling features

## Data Flow

```
User → Google OAuth → Supabase Auth → Session Created
                                         ↓
                                   roles table (auto level 10)
                                         ↓
Upload PDF → uploads-temp bucket → submissions table (pending)
                                         ↓
                              Reviewer approves → uploads-approved bucket
                                         ↓
                              Paper visible in Browse page
```

## Key Design Decisions

1. **No build step** — Deploy by pushing to GitHub Pages
2. **Backend is source of truth** — Frontend never infers roles; always queries backend
3. **Singleton pattern** — Single Supabase client via `getSupabase()` from `js/supabase-client.js`
4. **Fresh auth checks** — `getUser()` called before every database insert, never cached
5. **RLS enforcement** — All table access controlled by Supabase RLS policies

## Folder Structure

```
/
├── index.html              # Home page
├── upload.html             # Upload page
├── browse.html             # Browse papers
├── about.html              # About page
├── settings.html           # User settings
├── js/
│   ├── supabase-client.js  # Singleton client factory
│   ├── auth-controller.js  # Central auth state manager
│   ├── upload.js           # Upload page logic
│   ├── upload-handler.js   # Storage + submission insert
│   ├── roles.js            # Role → badge display mapping
│   ├── profile-panel.js    # Profile dropdown UI
│   ├── modules/
│   │   └── debug.module.js # Debug panel (ES module)
│   └── utils/
│       ├── role-utils.js   # Role verification utilities
│       └── supabase-wait.js # Client readiness helper
├── css/                    # Stylesheets
├── admin/
│   ├── sql/                # Database setup scripts (run in order)
│   └── dashboard/          # Admin dashboard
├── docs/                   # Documentation
├── partials/               # Reusable HTML components
└── assets/                 # Static assets (images, icons)
```
