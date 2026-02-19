# Frontend

## Overview

The frontend is a static site (HTML/CSS/Vanilla JS) with no build step. All JavaScript files are loaded via `<script>` tags in HTML pages, except for the debug module which uses ES module syntax.

## Script Loading Order

All HTML pages must load scripts in this order:

1. Supabase SDK CDN
2. `js/supabase-client.js` (singleton client factory)
3. `js/app.module.js` (initialization, includes debug module)
4. Other page-specific scripts

## Auth Listener

Authentication state is managed by `js/auth-controller.js`:

1. On page load, restores existing session
2. Handles OAuth callback if redirected from Google
3. Sets up `onAuthStateChange` listener
4. Emits `auth:ready` event with session data
5. Emits `auth-state-changed` on subsequent auth changes

All pages listen for `auth:ready` before enabling auth-dependent features.

## Storage Buckets

ExamArchive uses two storage buckets in Supabase:

| Bucket | Visibility | Purpose |
|---|---|---|
| `uploads-temp` | Private | Temporary storage for pending submissions |
| `uploads-approved` | Public | Public storage for approved papers |

### Storage RLS Policies

**uploads-temp:**
- Authenticated users can upload (INSERT)
- Only the owner can read their files (SELECT where auth.uid() = owner)

**uploads-approved:**
- Public read access (no authentication required)
- Only reviewers/admins can write (INSERT/UPDATE/DELETE where role level ≥ 80)

### Upload Flow

1. **Authenticated user uploads** → File goes to `uploads-temp`
2. **Submission record created** → Database row with `temp_path` and `status = "pending"`
3. **Reviewer approves** → File copied to `uploads-approved`, `approved_path` updated
4. **Paper visible in Browse** → Public URL generated from `uploads-approved`

**Demo papers** skip review and go directly to `uploads-approved` with `status = "approved"`.

## Role Fetching

Roles are fetched from the backend via RPC, never inferred on the frontend.

### Centralized Role Mapping

The `mapRole(level)` function in `js/utils/role-utils.js` is the **single source of truth** for role mapping:

```javascript
function mapRole(level) {
  if (level >= 100) return { name: 'admin', displayName: '👑 Admin', icon: '👑' };
  if (level >= 80) return { name: 'reviewer', displayName: '🛡️ Reviewer', icon: '🛡️' };
  if (level >= 10) return { name: 'contributor', displayName: '✍️ Contributor', icon: '✍️' };
  return { name: 'visitor', displayName: '👤 Visitor', icon: '👤' };
}
```

### Fetching Role Level

```javascript
// Get role level from backend (returns numeric level)
const { data: roleLevel } = await supabase.rpc('get_user_role_level', {
  user_id_param: session.user.id
});
// Returns: 0, 10, 80, or 100 (defaults to 10 if no role row exists)

// Map to display name
const roleInfo = mapRole(roleLevel || 10);
// roleInfo = { name: 'contributor', displayName: '✍️ Contributor', icon: '✍️' }
```

**Never depend on the database returning a name.** Always fetch the level and map it client-side.

## Upload Logic

The upload flow in `js/upload.js` and `js/upload-handler.js`:

1. **Auth Ready Check** — Upload button blocked until `auth:ready` fires
2. **Upload Lock** — `isUploading` flag prevents duplicate submissions
3. **Fresh Auth** — `supabase.auth.getUser()` called before every insert
4. **File Upload** — PDF uploaded to `uploads-temp` storage bucket
5. **DB Insert** — Submission record created with `user_id`, `paper_code`, `exam_year`, `temp_path`, `status`
6. **Rollback** — If DB insert fails, uploaded file is deleted from storage

### Key Rules

- **Never** hardcode `user_id` — always from `getUser()`
- **Never** assume role level — always verify via backend
- **Always** use `session.user.id` or `user.id` from fresh auth call
- **Always** add debug logs with `[UPLOAD]` tag
- **Storage errors** must log bucket name, path, and full error object

## Debug System

See [DEBUG_SYSTEM.md](DEBUG_SYSTEM.md) for full details.

The debug panel (`js/modules/debug.module.js`) provides:
- Real-time log display with categorization
- Auth status printing (session, user ID, role level)
- Color-coded error borders (AUTH/RLS/STORAGE/CLIENT)
- Tab filtering (All/Info/Warnings/Errors)
- Storage error logging with bucket name, path, and full error context

## Profile Panel

`js/profile-panel.js` renders the user profile dropdown:

- Shows user name, email, and role badge
- Badge computed from backend-verified **role level** via `Roles.getUserBadge()`
- Uses centralized `mapRole(level)` function for display
- Admin Dashboard link shown only if `isCurrentUserAdmin()` returns true
- Re-renders on `auth-state-changed` events
- Default to level 10 (Contributor) if no role row exists

## Separation of Storage RLS and Database RLS

**Storage RLS** (in Supabase Storage):
- Controls who can upload/download files from buckets
- `uploads-temp`: Authenticated users can upload
- `uploads-approved`: Public read, admin/reviewer write

**Database RLS** (in Supabase Database):
- Controls who can insert/select/update rows in tables
- `submissions` table: Users insert own rows (auth.uid() = user_id) or admin/reviewer bypass (level ≥ 80)
- `roles` table: Users read own role, admins manage all

These are **separate security layers**. Storage RLS handles file access, Database RLS handles data access.

## How to Modify Safely

1. **Auth changes** — Only modify `js/auth-controller.js`. All other files consume its events.
2. **Upload logic** — Modify `js/upload-handler.js` for storage/DB changes, `js/upload.js` for UI changes.
3. **Role display** — Modify `js/utils/role-utils.js` for mapping logic. Role levels live in SQL functions.
4. **Debug panel** — Modify `js/modules/debug.module.js`. It's an ES module with its own initialization.
5. **New pages** — Copy script loading order from `index.html`. Listen for `auth:ready` event.
