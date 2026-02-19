# Debug System

## Overview

The debug panel is a mobile-friendly slide-up panel that provides real-time logging, auth status, and error diagnosis. It is implemented as an ES module in `js/modules/debug.module.js`.

## How to Enable

The debug panel is controlled by the `DEBUG_FORCE_ENABLE` flag:

```javascript
// In js/modules/debug.module.js
const DEBUG_FORCE_ENABLE = true;  // Set to false for production
```

When enabled, the panel appears at the bottom of every page. Visibility state is persisted in `localStorage`.

## Toggle in Settings

The panel can be toggled via:
- Clicking the 🐛 debug panel header to collapse/expand
- The ✕ button to close the panel entirely
- `window.Debug.togglePanel()` from the console

## Message Format

Each log entry contains:

| Field | Description |
|---|---|
| Timestamp | Time the message was logged |
| Module | Source module (AUTH, UPLOAD, STORAGE, SYSTEM, etc.) |
| Level | INFO, WARNING, or ERROR |
| Message | Human-readable description |
| Category | Auto-classified: auth, rls, storage, client |

## Log Types

| Tag | Color | Description |
|---|---|---|
| `[AUTH]` | Blue (#2196F3) | Authentication and JWT errors |
| `[RLS]` | Red (#f44336) | Row-level security policy violations |
| `[STORAGE]` | Orange (#FF9800) | Storage bucket and upload errors |
| `[CLIENT]` | Purple (#9C27B0) | Client initialization errors |
| `[UPLOAD]` | Default blue | Upload flow messages |
| `[SYSTEM]` | Default | System-level messages |

## Storage Error Logging

When storage operations fail, the debug panel logs detailed context:

```javascript
// Error context includes:
{
  bucket: "uploads-temp",        // Bucket name
  path: "user_id/timestamp-file.pdf",  // Storage path
  error: { /* full error object */ },
  statusCode: 404                // HTTP status code
}
```

Example error message:
```
[STORAGE ERROR]
Bucket: uploads-temp
Path: abc123/1234567890-exam.pdf
Reason: Storage bucket not found.
Check: Contact the administrator.
```

## Logging Methods

```javascript
// Available via window.Debug
window.Debug.logInfo('upload', 'Starting upload...');
window.Debug.logWarn('auth', 'Session expiring soon');
window.Debug.logError('storage', 'Bucket not found', errorContext);
window.Debug.printAuthStatus();  // Logs session, user ID, role level
window.Debug.clear();            // Clear all logs
```

## Debug Modules

```javascript
const DebugModule = {
  AUTH: 'auth',
  UPLOAD: 'upload',
  ADMIN: 'admin',
  STORAGE: 'storage',
  ROLE: 'role',
  SETTINGS: 'settings',
  SYSTEM: 'system',
  RLS: 'rls'
};
```

## NOT NULL Constraint Errors

If a submission insert fails with a `null value in column` error, check that all required fields are provided:

- `original_filename` — must be `file.name` (never undefined or null)
- `file_size` — must be `file.size` (never undefined or null)
- `user_id` — must be from a fresh `supabase.auth.getUser()` call
- `paper_code` — must not be empty
- `year` — must be a valid integer
- `storage_path` — must be the path returned after successful storage upload

These fields are declared `NOT NULL` in the database. Passing `undefined` or `null` will cause the insert to fail with a constraint violation. When this happens, the debug panel will log: `Submission insert failed:` with the full error object.

## How to Debug Upload Failure

1. Open the debug panel (🐛 icon at bottom of page)
2. Expand the panel and switch to the "Errors" tab
3. Look for `[UPLOAD]`, `[RLS]`, or `[STORAGE]` tagged entries
4. Check auth status: click the panel header to trigger `printAuthStatus()`
5. Common issues:
   - **`[AUTH]` error** — User session expired. Sign out and sign in again.
   - **`[RLS]` error** — user_id mismatch or missing role. Check that `getUser()` returns valid user.
   - **`[STORAGE]` error** — Bucket not found or permission denied. Check Supabase storage policies.

## How to Debug RLS Errors

1. Look for red-bordered entries in the debug panel
2. The message will contain "row-level security" or "policy"
3. Verify the user is authenticated: check `[AUTH] Session Status` in logs
4. Verify user_id matches: check `[AUTH] User ID` matches the insert
5. If admin/reviewer, verify role level ≥ 80 in the logs

## Deduplication

Identical messages within an 800ms window are suppressed to prevent log spam. This is configurable via `DEBUG_DEDUPE_WINDOW_MS`.

## Panel Features

- **Tabs:** All / Info / Warnings / Errors
- **Clear button:** Removes all log entries
- **Collapse/Expand:** Toggle panel body visibility
- **Close button:** Hides panel entirely
- **Auto-scroll:** Newest entries appear at top
- **Mobile-friendly:** Touch-friendly buttons, slide-up design, max 60vh height
- **Non-blocking:** Panel does not overlap main content or upload buttons
