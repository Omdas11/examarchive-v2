# Timeline Log

## Phase 2 — Auth + RLS Stabilization (Full Singleton Enforcement)

**Date:** February 2026

### Problem

Despite Phase 1.3 fixes, potential race conditions and inconsistent client access patterns remained:
- Some files still referenced `window.__supabase__` directly
- `debug.module.js` used `window.supabase` (SDK) instead of client singleton
- Inconsistent error classification in debug panel
- No visual distinction between error types (AUTH vs RLS vs STORAGE vs CLIENT)

### Solution

**Universal Singleton Enforcement:**
- **ALL** files now use `getSupabase()` from `js/supabase-client.js`
- Eliminated all direct `window.__supabase__` access (kept only for backward compat)
- Updated `debug.module.js`, `avatar-utils.js`, `supabase-wait.js` to use singleton
- `window.__supabase__` is DEPRECATED — only set by singleton for old code compatibility

**Debug Panel Error Classification:**
- Added `classifyErrorCategory()` to detect error types from message content
- Added `autoPrefixMessage()` to auto-label errors: [AUTH], [RLS], [STORAGE], [CLIENT]
- Color-coded borders for visual distinction:
  - **[AUTH]** — Blue border (#2196F3)
  - **[RLS]** — Red border (#f44336)
  - **[STORAGE]** — Orange border (#FF9800)
  - **[CLIENT]** — Purple border (#9C27B0)
- Errors auto-classified based on keywords: "jwt", "policy", "storage", "not initialized"

**Upload Handler RLS Detection:**
- Both demo and regular submission insert errors check for RLS violations
- Explicit `[RLS]` prefix logged when policy violation detected
- Human-readable error surfaced to user

**Script Loading Order Verification:**
- Confirmed ALL HTML files follow correct order:
  1. Supabase SDK CDN
  2. `js/supabase-client.js` (singleton)
  3. `js/app.module.js` (initialization)
  4. Other scripts
- No duplicate client creation found
- Storage helpers correctly use `getSupabase()` throughout

**Documentation Updates:**
- README.md updated with Phase 2 client singleton pattern
- Clear guidance: "Never use `window.supabase.createClient()` directly"
- Debug panel color coding documented

### Files Changed

- `js/supabase-client.js` — Updated comments to mark `window.__supabase__` as DEPRECATED
- `js/modules/debug.module.js` — Use `getSupabaseClient()` import, added error classification
- `js/avatar-utils.js` — Updated to use `getSupabase()` instead of `window.__supabase__`
- `js/utils/supabase-wait.js` — Updated to use `getSupabase()` instead of `window.__supabase__`
- `js/upload-handler.js` — Added explicit RLS error detection in both insert paths
- `README.md` — Added Phase 2 client singleton pattern section
- `docs/TIMELINE_LOG.md` — Added Phase 2 entry

### Result

- **Zero** files create clients outside the singleton
- **Zero** files directly access `window.__supabase__` (except for backward compat write)
- **100%** consistent use of `getSupabase()` pattern
- Debug panel provides clear, color-coded error diagnosis
- Upload errors properly classified as [AUTH], [RLS], or [STORAGE]

---

## Phase 1.3 — Auth & RLS Stabilization

**Date:** February 2026

### Problem

Frontend sometimes inserted NULL `user_id`, triggering RLS policy violation:
> new row violates row-level security policy

- Upload handler used session/cache that could be stale
- Upload could execute before auth was ready
- Debug panel didn't show auth state
- Error messages were generic ("permission denied")

### Solution

**Auth Lock — Hard Require User:**
- Replaced session-based auth with fresh `getUser()` call before insert
- Block upload if `authError` or `!user`
- Log user ID explicitly before any database operation

**Prevent Upload Before Auth Ready:**
- Added `authReady` flag set by `auth:ready` event
- Upload button blocked until auth initialization completes
- Clear warning message if upload attempted too early

**Debug Panel Auth Status:**
- Added `printAuthStatus()` method
- Shows: Session Status, User ID, Role Level
- Called on page load, debug panel open, and upload start

**Human-Readable RLS Errors:**
- Detect `row-level security` or `policy` in error message
- Show: "Upload blocked by permission policy. Please re-login."
- Removed generic "permission denied" toast

**Visual Auth Indicator:**
- Added status badge to header (🟢 Logged In / 🔴 Not Logged In)
- Mobile-friendly: dot only on small screens
- Auto-updates on auth state changes

**Debug Deduplication:**
- Increased window from 500ms to 800ms

### Files Changed

- `js/upload-handler.js` — Auth lock, RLS error handling
- `js/upload.js` — Auth ready check, printAuthStatus call
- `js/modules/debug.module.js` — Deduplication window, printAuthStatus method
- `js/common.js` — Auth indicator update logic
- `partials/header.html` — Auth status badge
- `css/header.css` — Auth indicator styles

### Architecture After Phase 1.3

```
Auth Guard:      authReady flag + getUser() call before insert
RLS Policy:      WITH CHECK (auth.uid() = user_id)
Error Display:   Exact RLS message, no generic "permission denied"
Debug Panel:     Shows user ID + role level + session status
Header Badge:    🟢 Logged In / 🔴 Not Logged In
Deduplication:   800ms window (up from 500ms)
```

---

## Phase 1 — Stabilization Complete

**Date:** February 2026

### Changes

- **Backend reset** — Replaced multi-SQL fragmented setup with clean single-SQL architecture
- **Single SQL architecture** — roles + submissions + buckets + RLS in 6 ordered scripts
- **Upload fixed** — Upload path changed to `{user_id}/{timestamp}-{filename}`, demo auto-approval streamlined, debug logging added
- **Calendar toggle added** — Month/Week view toggle (Google Calendar style), fixed date parsing with `parseLocalDate()` to prevent timezone shift
- **Debug redesigned** — Mobile-friendly slide-up panel (max 60vh), tabbed interface (Info/Warnings/Errors), human-readable messages with Reason/Check format
- **Documentation aligned** — All docs rewritten to reflect Phase 1 architecture
- **Repo health check** — Removed legacy references, aligned frontend with backend schema

### Architecture After Phase 1

```
Tables:       roles (user_id, level), submissions
Buckets:      uploads-temp (private), uploads-approved (public)
Role Levels:  0=visitor, 10=user, 50=reviewer, 80=moderator, 100=admin
RPC:          get_current_user_role_level()
Upload Path:  uploads-temp/{user_id}/{timestamp}-{filename}
```
