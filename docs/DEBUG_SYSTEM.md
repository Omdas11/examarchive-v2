# Debug System

> Phase 1 — Mobile-Friendly Debug Panel

## Overview

The debug system provides a slide-up panel at the bottom of the screen for viewing application logs. It shows human-readable messages instead of raw error codes.

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

## Logging from Code

```js
// Info
window.Debug.logInfo('upload', 'File uploaded successfully');

// Warning
window.Debug.logWarn('auth', 'Session refresh failed, using cached session');

// Error
window.Debug.logError('storage', 'Upload Failed\nReason: Bucket not found.\nCheck: Contact admin.');
```

## Common Errors

| Error | Meaning | Fix |
|---|---|---|
| Storage Access Denied | RLS policy blocking upload | Check if user is authenticated |
| Session Expired | JWT token expired | Sign in again |
| Bucket Not Found | Storage bucket doesn't exist | Run SQL setup scripts |
| Submission Record Failed | Database insert failed | Check submissions table RLS |

## Architecture

- **Module:** `js/modules/debug.module.js` (ES module)
- **Panel:** Slide-up, max 60% viewport height
- **Touch-friendly:** Min 36px tap targets
- **Persistence:** Panel state saved in localStorage
