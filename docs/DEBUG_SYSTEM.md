# Debug System

> Phase 1 — Mobile-Friendly Debug Panel

## Overview

The debug system provides a slide-up panel at the bottom of the screen for viewing application logs. It shows human-readable messages instead of raw error codes.

## Auth State Tracking

The debug panel tracks and displays authentication state:

### When Printed

Auth status is logged automatically:
- **On page load** — When `auth:ready` event fires
- **Debug panel open** — When you manually open the debug panel
- **Upload start** — Before any upload operation begins

### What It Shows

```
[AUTH] Session Status: Logged In
[AUTH] User ID: 12345678-abcd-1234-5678-abcdef012345
[AUTH] Role Level: 10
```

Or if not authenticated:
```
[AUTH] No active session.
```

### Manual Check

You can manually print auth status:
```js
window.Debug.printAuthStatus();
```

This calls `supabase.auth.getUser()` and retrieves the current role level via RPC.

## How to Enable

The debug panel is controlled by `DEBUG_FORCE_ENABLE` in `js/modules/debug.module.js`. When set to `true`, the panel is visible for all users.

Toggle via Settings page or programmatically:

```js
window.Debug.showPanel();
window.Debug.hidePanel();
window.Debug.togglePanel();
```

## How to Read Logs

### Tabs

| Tab | Shows |
|---|---|
| All | Every log entry |
| Info | Informational messages (blue) |
| Warnings | Warning messages (orange) |
| Errors | Error messages (red) |

### Message Format

Messages are human-readable. Example:

```
Upload Failed
Reason: Permission denied in uploads-temp bucket.
Check: User authenticated?
```

Instead of raw: `[STORAGE] Upload failed`

## Deduplication

Debug panel deduplicates identical messages within an **800ms window** to prevent log spam. Configurable via `DEBUG_DEDUPE_WINDOW_MS` constant.

## Logging from Code

```js
// Info
window.Debug.logInfo('upload', 'File uploaded successfully');

// Warning
window.Debug.logWarn('auth', 'Session refresh failed, using cached session');

// Error
window.Debug.logError('storage', 'Upload Failed\nReason: Bucket not found.\nCheck: Contact admin.');

// Print auth status
window.Debug.printAuthStatus();
```

## Common Errors

| Error | Meaning | Fix |
|---|---|---|
| Storage Access Denied | RLS policy blocking upload | Check if user is authenticated |
| Session Expired | JWT token expired | Sign in again |
| Bucket Not Found | Storage bucket doesn't exist | Run SQL setup scripts |
| Submission Record Failed | Database insert failed | Check submissions table RLS |
| RLS Insert Blocked | user_id mismatch or NULL | Re-login to refresh session |

## Architecture

- **Module:** `js/modules/debug.module.js` (ES module)
- **Panel:** Slide-up, max 60% viewport height
- **Touch-friendly:** Min 36px tap targets
- **Persistence:** Panel state saved in localStorage
- **Auth tracking:** Prints user ID and role level on demand
