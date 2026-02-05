# Debugging Guide

> Derived from [Architecture Master Plan - Section 6](ARCHITECTURE_MASTER_PLAN.md#6-debug-philosophy)

## Debug System Overview

The debug system provides logging and a visual debug panel for development and troubleshooting.

**Core Principle:** Debug functionality MUST NEVER block page execution.

## Using Debug Logging

### Basic Logging

```javascript
// Log info messages
window.Debug.logInfo('auth', 'User signed in', { email: user.email });

// Log warnings
window.Debug.logWarn('upload', 'Large file detected', { size: file.size });

// Log errors
window.Debug.logError('storage', 'Upload failed', { error: err.message });
```

### Debug Modules

Use the predefined module identifiers for consistent logging:

```javascript
const { DebugModule } = window.Debug;

// Available modules:
DebugModule.AUTH      // Authentication operations
DebugModule.UPLOAD    // File upload operations
DebugModule.ADMIN     // Admin dashboard operations
DebugModule.STORAGE   // Storage operations
DebugModule.ROLE      // Role/permission operations
DebugModule.SETTINGS  // Settings page operations
DebugModule.SYSTEM    // System-level events
```

### Debug Levels

```javascript
const { DebugLevel } = window.Debug;

DebugLevel.INFO     // Informational messages
DebugLevel.WARN     // Warning conditions
DebugLevel.ERROR    // Error conditions
```

## Debug Panel

### Showing/Hiding

```javascript
// Show debug panel
window.Debug.showPanel();

// Hide debug panel
window.Debug.hidePanel();

// Toggle visibility
window.Debug.togglePanel();
```

### Panel Features

- **Filter by level:** All, Info, Warnings, Errors
- **Clear logs:** Remove all logged messages
- **Collapse/Expand:** Minimize to header only
- **Mobile responsive:** Adapts to screen size

### Panel Visibility Control

The debug panel is visible only when:
1. User has admin or reviewer role, OR
2. `DEBUG_FORCE_ENABLE = true` in `debug.module.js`

For production, set `DEBUG_FORCE_ENABLE = false`.

## Console Output

All debug messages are also logged to the browser console with:
- Colored output based on severity
- Module name in brackets
- Timestamp
- Message and optional data

Example console output:
```
ℹ️ [AUTH][INFO] 10:30:45 User signed in { email: "user@example.com" }
⚠️ [UPLOAD][WARNING] 10:30:50 Large file detected { size: 52428800 }
❌ [STORAGE][ERROR] 10:30:55 Upload failed { error: "Permission denied" }
```

## Troubleshooting Common Issues

### Page Won't Load

1. Open browser DevTools (F12)
2. Check Console for errors
3. Look for "Bootstrap" errors first
4. Check Network tab for failed requests

### Authentication Not Working

```javascript
// Check session status
const session = window.App?.session;
console.log('Current session:', session);

// Check Supabase client
console.log('Supabase client:', window.__supabase__);
```

### Role Check Failing

```javascript
// Verify role from backend
const role = await window.AdminAuth.getUserRoleBackend();
console.log('User role:', role);

// Check admin status
const isAdmin = await window.AdminAuth.isCurrentUserAdmin();
console.log('Is admin:', isAdmin);
```

### Upload Failing

```javascript
// Check session before upload
const session = await window.AuthContract.requireSession();
if (!session) {
  console.error('No session - user not authenticated');
}

// Check storage bucket access
console.log('Buckets:', window.SupabaseClient.BUCKETS);
```

## Debug Checklist

Before reporting a bug:

- [ ] Check browser console for JavaScript errors
- [ ] Check Network tab for failed API requests
- [ ] Verify authentication status (`window.App?.session`)
- [ ] Check debug panel for logged errors
- [ ] Test in incognito/private mode
- [ ] Test in different browser
- [ ] Clear localStorage and retry

## Debug Mode in Production

To enable debug mode in production:

1. Open browser console
2. Run: `localStorage.setItem('debug-panel-enabled', 'true')`
3. Refresh the page

To disable:
```javascript
localStorage.setItem('debug-panel-enabled', 'false')
```

---

*Reference: [Architecture Master Plan - Section 6](ARCHITECTURE_MASTER_PLAN.md#6-debug-philosophy)*
