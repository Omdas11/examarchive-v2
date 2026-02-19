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

## Role Fetching

Roles are fetched from the backend via RPC, never inferred on the frontend:

```javascript
// Get role name from backend
const { data: roleName } = await supabase.rpc('get_user_role_name', {
  user_id_param: session.user.id
});
// Returns: 'admin', 'reviewer', 'contributor', or 'visitor'
```

Role-to-badge mapping in `js/roles.js` is **display only**. The backend is the single source of truth.

## Upload Logic

The upload flow in `js/upload.js` and `js/upload-handler.js`:

1. **Auth Ready Check** — Upload button blocked until `auth:ready` fires
2. **Upload Lock** — `isUploading` flag prevents duplicate submissions
3. **Fresh Auth** — `supabase.auth.getUser()` called before every insert
4. **File Upload** — PDF uploaded to `uploads-temp` storage bucket
5. **DB Insert** — Submission record created with `user_id`, `paper_code`, `exam_year`, `status`
6. **Rollback** — If DB insert fails, uploaded file is deleted from storage

### Key Rules

- **Never** hardcode `user_id` — always from `getUser()`
- **Never** assume role level — always verify via backend
- **Always** use `session.user.id` or `user.id` from fresh auth call
- **Always** add debug logs with `[UPLOAD]` tag

## Debug System

See [DEBUG_SYSTEM.md](DEBUG_SYSTEM.md) for full details.

The debug panel (`js/modules/debug.module.js`) provides:
- Real-time log display with categorization
- Auth status printing (session, user ID, role level)
- Color-coded error borders (AUTH/RLS/STORAGE/CLIENT)
- Tab filtering (All/Info/Warnings/Errors)

## Profile Panel

`js/profile-panel.js` renders the user profile dropdown:

- Shows user name, email, and role badge
- Badge computed from backend-verified role via `Roles.getUserBadge()`
- Admin Dashboard link shown only if `isCurrentUserAdmin()` returns true
- Re-renders on `auth-state-changed` events

## How to Modify Safely

1. **Auth changes** — Only modify `js/auth-controller.js`. All other files consume its events.
2. **Upload logic** — Modify `js/upload-handler.js` for storage/DB changes, `js/upload.js` for UI changes.
3. **Role display** — Modify `js/roles.js` for badge mapping. Role logic lives in SQL functions.
4. **Debug panel** — Modify `js/modules/debug.module.js`. It's an ES module with its own initialization.
5. **New pages** — Copy script loading order from `index.html`. Listen for `auth:ready` event.
