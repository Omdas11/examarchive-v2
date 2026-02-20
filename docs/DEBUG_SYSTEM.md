# Debug System

## Overview

The debug panel is a mobile-friendly slide-up panel that provides real-time logging, auth status, and error diagnosis. It is implemented as an ES module in `js/modules/debug.module.js` with structured logging helpers in `js/core/debug.js`.

## How to Enable

The debug panel is restricted to users with **role level >= 80** (Reviewers and Admins). For users with lower roles:
- The debug system does not initialize
- No DOM is injected
- No logs are displayed

Admins can toggle the panel visibility in **Settings → Debug Panel**.

For development, set `DEBUG_FORCE_ENABLE = true` in `js/modules/debug.module.js`:

```javascript
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
| `[AUTH]` | Blue (var(--color-info)) | Authentication and JWT errors |
| `[RLS]` | Red (var(--color-error)) | Row-level security policy violations |
| `[STORAGE]` | Orange (var(--color-warning)) | Storage bucket and upload errors |
| `[CLIENT]` | Purple (var(--color-purple)) | Client initialization errors |
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
- `user_id` — auto-set by database default (`auth.uid()`), NOT sent by frontend
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
4. Verify user has a valid session: check `[AUTH] User ID` in the logs
5. If admin/reviewer, verify role level ≥ 80 in the logs

## Deduplication

Identical messages within an 800ms window are suppressed to prevent log spam. This is configurable via `DEBUG_DEDUPE_WINDOW_MS`.

## Panel Features

- **Tabs:** All / Info / Warnings / Errors
- **Clear button:** Removes all log entries
- **Copy button:** Copies all logs to clipboard as formatted text
- **Collapse/Expand entries:** Click error entries to expand code/details/hint
- **Collapse/Expand panel:** Toggle panel body visibility
- **Close button:** Hides panel entirely
- **Auto-scroll:** Newest entries appear at top
- **Mobile-friendly:** Touch-friendly buttons, slide-up design, max 60vh height
- **Non-blocking:** Panel does not overlap main content or upload buttons

## Structured Logging (js/core/debug.js)

The `js/core/debug.js` file provides global helper functions:

```javascript
// Structured log with type
window.debugLog('AUTH', 'User logged in', { userId: '...' });
window.debugLog('SUBMISSION', 'Insert started', metadata);
window.debugLog('ERROR', 'Something failed', errorObj);

// Error with code/details/hint extraction
window.debugError('SUBMISSION_INSERT_FAILED', supabaseError);

// Health check — auto-called after login for admins
window.systemHealthCheck();
```

Types: `AUTH`, `STORAGE`, `SUBMISSION`, `RLS`, `DASHBOARD`, `ERROR`, `SYSTEM`

## Health Check

`window.systemHealthCheck()` verifies:
1. Supabase client is available
2. User session is active
3. Submissions table is reachable

It runs automatically after `auth:ready` for users with debug access (role level ≥ 80).
