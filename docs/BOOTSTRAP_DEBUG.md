# Bootstrap Debug Guide

**Phase 9.2.2 — Emergency Bootstrap & Auth Deadlock Fix**

## Overview

This document explains the bootstrap system implemented to detect and diagnose "dead JS" scenarios where JavaScript fails silently before the application can initialize properly.

## Problem

After Phase 9.2/9.2.1, critical issues emerged:
- Upload said "no permission" for admin users
- Settings page appeared blank
- Debug panel did not appear at all
- Backend role checks, SQL, and RLS were all correct

**Root Cause:** Frontend JavaScript was not executing past bootstrap, causing:
- `auth.uid()` → NULL
- `getSession()` → never awaited
- Upload → treated as anonymous
- Settings → empty page
- Debug → never mounted

## Solution: Bootstrap System

### Script Load Order

**CRITICAL:** Scripts must load in this exact order:

1. **bootstrap.js** (FIRST - no exceptions)
2. Supabase SDK
3. ES Modules (common.js, etc.)
4. Regular scripts (theme.js)

### Why Bootstrap Exists

The bootstrap system provides:

1. **Global Bootstrap Flag** (`window.__APP_BOOTED__`)
   - Set immediately when bootstrap.js loads
   - All other scripts check this flag
   - If missing, scripts fail LOUDLY with alerts

2. **Global Error Handlers**
   - Catches uncaught JavaScript errors
   - Catches unhandled promise rejections
   - Makes errors VISIBLE via alerts
   - Logs all errors to console

3. **Hard Stops**
   - `common.js` throws if bootstrap not loaded
   - Upload blocks if session is missing
   - Session check shows alerts if authentication broken

## How to Detect "Dead JS"

### On Desktop (Browser Console)

You should see these logs in order:
```
[BOOT] bootstrap.js loaded
[BOOT] Global error handlers installed
[BOOT] Bootstrap complete - app ready to load
[COMMON] common.js started
[AUTH] session = { ... }
```

### On Mobile (Without PC)

If you see **ANY** of these alerts, JS is failing:

1. `BOOTSTRAP FAILED: common.js blocked`
   - Bootstrap.js failed to load
   - Check script path and network

2. `JS ERROR: [error message]`
   - JavaScript syntax or runtime error
   - Check browser compatibility

3. `PROMISE ERROR: [error message]`
   - Async operation failed
   - Check network or API issues

4. `NO SESSION DETECTED — AUTH BROKEN`
   - Supabase auth not working
   - User may need to sign in again

5. `UPLOAD BLOCKED: session missing`
   - Upload attempted without authentication
   - User must sign in first

### No Alerts or Logs = Dead JS

If you see **NOTHING** (no alerts, no console logs):
- Scripts are not loading at all
- Check network tab for 404s
- Check for Content Security Policy (CSP) violations
- Check for CORS issues

## Mobile Debugging Without PC

### Method 1: Check for Alerts
- Load the page
- Wait for any alert popups
- Alerts indicate specific failures

### Method 2: Use Force Debug Mode
The system includes `DEBUG_FORCE_ENABLE = true` in `js/debug/logger.js`:
- Enables debug panel for all users (temporary)
- Shows real-time logs on mobile
- No admin/reviewer role required

### Method 3: Check Visual Indicators
- Settings page should NOT be blank
- Upload should show specific error messages
- Debug panel should appear (with force enable)

## Implementation Files

### Core Files

1. **js/bootstrap.js**
   - Global error handlers
   - Bootstrap flag
   - Must load first

2. **js/common.js**
   - Bootstrap check at top
   - Session visibility logging
   - Auth state debugging

3. **js/debug/logger.js**
   - `DEBUG_FORCE_ENABLE` flag
   - Bypasses role checks
   - Force enables debug panel

4. **js/upload-handler.js**
   - Hard fail on missing session
   - Explicit alerts for upload blocks

### HTML Files Modified

All critical pages now load bootstrap.js first:
- `upload.html`
- `settings.html`
- `admin/dashboard.html`

## Verification Checklist

After implementing bootstrap system, verify:

- [ ] Console shows `[BOOT] bootstrap.js loaded`
- [ ] Console shows `[COMMON] common.js started`
- [ ] Console shows `[AUTH] session = ...`
- [ ] Debug panel appears on page load
- [ ] Settings page shows content (not blank)
- [ ] Upload errors are explicit (not silent)
- [ ] Alerts appear for any JS failures

## Temporary Changes (Will Be Reverted)

⚠️ **Phase 9.2.2 includes temporary debug overrides:**

1. **DEBUG_FORCE_ENABLE = true** in `logger.js`
   - Enables debug for everyone
   - Will be removed once issue is resolved

2. **Session alerts** in `common.js`
   - Alert popup if no session detected
   - Will be removed or made less intrusive

These are diagnostic tools, not permanent features.

## What This Does NOT Fix

This bootstrap system makes failures VISIBLE but does NOT fix:
- Actual authentication issues
- Supabase configuration problems
- RLS policy errors
- Network connectivity issues

It's a diagnostic layer that helps identify WHERE the problem occurs.

## Next Steps

Once you can SEE where JS is failing:
1. Note the exact error message
2. Check which log appears last
3. Investigate the specific module that failed
4. Fix the underlying issue
5. Remove temporary debug overrides

## Support

If bootstrap system reveals errors you can't resolve:
1. Note exact console logs and alerts
2. Check browser network tab
3. Verify Supabase configuration
4. Check authentication setup
