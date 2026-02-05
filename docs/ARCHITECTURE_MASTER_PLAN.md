# ExamArchive v2 — Architecture Master Plan

> **Version:** 2.2.0  
> **Last Updated:** Phase 9.2 (2026-02-05)  
> **Status:** CANONICAL — This is the single source of truth for all architecture decisions

---

## 📋 Phase 9.2 Summary

**Phase 9.2** introduced major architectural improvements:

- ✅ **Centralized Auth Controller** — Single source of truth for authentication
- ✅ **Event-Driven Architecture** — `auth:ready` and `auth-state-changed` events
- ✅ **Code Deduplication** — Removed 204 lines of duplicate `waitForSupabase` functions
- ✅ **Race Condition Fixes** — Pages wait for auth initialization before checking session
- ✅ **Comprehensive Documentation** — 4,195+ lines of system docs

**Key Files Added:**
- `js/auth-controller.js` — Central auth orchestrator
- `js/utils/supabase-wait.js` — Shared Supabase wait utility
- `docs/AUTH_SYSTEM.md` — Complete auth documentation
- `docs/UPLOAD_SYSTEM.md` — Complete upload documentation
- `docs/ADMIN_SYSTEM.md` — Complete admin documentation
- `docs/REPO_HEALTH_CHECK.md` — Repository health analysis

---

## 1. System Overview

### 1.1 Core Architecture

ExamArchive v2 is a **static frontend application** backed by **Supabase** for authentication, database, and file storage.

```
┌────────────────────┐     ┌────────────────────┐
│   Static HTML/CSS  │────▶│  Supabase Backend  │
│   + Vanilla JS     │     │  (Auth/DB/Storage) │
└────────────────────┘     └────────────────────┘
         │                           │
         │                           │
    GitHub Pages              PostgreSQL + RLS
```

### 1.2 Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Auth | Supabase Auth (Google OAuth) |
| Database | Supabase PostgreSQL with RLS |
| Storage | Supabase Storage (bucket-based) |
| Hosting | GitHub Pages (static) |

### 1.3 Trust Boundaries

1. **Frontend** — Untrusted. Never makes security decisions.
2. **Supabase Auth** — Trusted for identity verification.
3. **Supabase RLS** — Trusted for authorization. All permission checks happen here.
4. **Backend Functions** — Trusted for role-based access control.

**Critical Rule:** The frontend NEVER decides permissions. All authorization is enforced by Row Level Security (RLS) policies on the backend.

---

## 2. Execution Model

### 2.1 Script Loading Architecture

ExamArchive uses a **hybrid module system**:

1. **ES Modules** (`type="module"`) - Used only for `app.module.js` and its imports
2. **Classic Scripts** - All other JavaScript files (no `type="module"`)

This architecture is required because:
- ES modules load **asynchronously** in parallel
- Classic scripts load **synchronously** in order
- Classic scripts need the Supabase client to be ready

### 2.2 Page Load Sequence

Every page follows this exact load order:

```
1. HTML parsed
2. bootstrap.js loads (MUST be first script)
   └─ Creates window.App object
   └─ Installs global error handlers
   └─ NEVER throws errors (graceful degradation)
3. Supabase SDK loads (CDN)
4. app.module.js loads (type="module") - ASYNCHRONOUS
   └─ Imports supabase.js → Creates client
   └─ Imports auth.module.js → Sets up auth listener
   └─ Imports debug.module.js → Exposes window.Debug
   └─ Dispatches 'app:ready' event when done
5. Classic scripts load in order - SYNCHRONOUS
   └─ common.js → Loads partials (header/footer)
   └─ auth.js → Exposes window.AuthContract
   └─ Page-specific scripts
6. Classic scripts WAIT for 'app:ready' or poll for window.__supabase__
```

### 2.3 The Timing Problem (Critical)

**Problem:** ES modules execute asynchronously. Classic scripts execute synchronously BUT may run before the ES module finishes initializing Supabase.

**Solution (Phase 9.2.8):** All classic scripts that need Supabase must:
1. Include a `waitForSupabase()` helper function
2. Call it before any Supabase operation
3. Use the `app:ready` event as a signal that Supabase is ready

```javascript
// Pattern used in all classic scripts
async function waitForSupabase(timeout = 10000) {
  if (window.__supabase__) {
    return window.__supabase__;
  }
  
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    document.addEventListener('app:ready', () => {
      if (window.__supabase__) resolve(window.__supabase__);
    }, { once: true });
    
    const interval = setInterval(() => {
      if (window.__supabase__) {
        clearInterval(interval);
        resolve(window.__supabase__);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(interval);
        resolve(null);  // Return null, don't throw
      }
    }, 50);
  });
}
```

---

## 3. Authentication Flow (Phase 9.2)

### 3.1 Centralized Auth Controller

**Phase 9.2 introduced `js/auth-controller.js`** — the single source of truth for authentication:

```
┌────────────────────────────────────────────────────────────┐
│              js/auth-controller.js (Phase 9.2)              │
│  - Initializes Supabase client                              │
│  - Handles OAuth callbacks & URL cleanup                    │
│  - Manages auth state (single listener)                     │
│  - Emits auth:ready event                                   │
│  - Emits auth-state-changed event                           │
│  - Provides public API                                      │
└────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │   Pages     │ │  Components │ │   Utilities │
    │ (wait for   │ │  (listen to │ │  (use API)  │
    │ auth:ready) │ │  events)    │ │             │
    └─────────────┘ └─────────────┘ └─────────────┘
```

### 3.2 How Auth Works (Phase 9.2)

1. **Initial Load:**
   - `supabase.js` creates client, calls `getSession()`
   - `auth-controller.js` initializes, handles OAuth callback
   - Emits `auth:ready` event with session

2. **Page Access:**
   - Pages listen for `auth:ready` event
   - Use `AuthController.requireSession()` or `requireRole()`
   - Show loading state until auth ready

3. **Auth Changes:**
   - Single listener in `auth-controller.js`
   - Emits `auth-state-changed` event
   - Components update UI based on event

### 3.3 Auth Controller API

**Primary API** (`window.AuthController`):

```javascript
// Wait for auth to be ready
const session = await AuthController.waitForAuthReady();

// Get current session (sync)
const session = AuthController.getSession();

// Check if authenticated
if (AuthController.isAuthenticated()) { ... }

// Require session (async)
const session = await AuthController.requireSession();

// Require role (async)
const session = await AuthController.requireRole(['admin', 'reviewer']);

// Sign in with Google
await AuthController.signInWithGoogle();

// Sign out
await AuthController.signOut();
```

**Backward Compatibility** (`window.AuthContract`):

```javascript
// Legacy API still works
window.AuthContract = {
  requireSession: AuthController.requireSession,
  requireRole: AuthController.requireRole
};
```

### 3.4 Auth Events (Phase 9.2)

**`auth:ready` Event** — Emitted once when auth initialized:

```javascript
window.addEventListener('auth:ready', (e) => {
  const session = e.detail.session;
  if (session) {
    console.log('User:', session.user.email);
  }
});
```

**`auth-state-changed` Event** — Emitted on auth changes:

```javascript
window.addEventListener('auth-state-changed', (e) => {
  console.log('Event:', e.detail.event);
  console.log('Session:', e.detail.session);
  updateUI(e.detail.session);
});
```

### 3.5 OAuth Flow with Error Handling

```
User clicks "Sign in"
       │
       ▼
AuthController.signInWithGoogle()
       │
       ▼
Redirect to Google OAuth
       │
       ▼
User approves, redirect back with ?code=...
       │
       ▼
auth-controller.js detects OAuth callback
       │
       ├─ Success: Exchange code for session
       │           Clean URL params
       │           Emit auth-state-changed
       │
       └─ Error: Show user-friendly notification
                 Clean URL params
                 Log error details
```

### 3.6 Role-Based Access

Admin/reviewer access is controlled by backend functions:

```javascript
// Check if user is admin
const { data } = await supabase.rpc('is_admin', { user_id_param: userId });

// Get user's role
const { data } = await supabase.rpc('get_user_role_name', { user_id_param: userId });
```

**NEVER** infer roles from frontend data. Always call backend functions.

**See:** [docs/AUTH_SYSTEM.md](./AUTH_SYSTEM.md) for complete authentication documentation

---

## 4. Upload Flow

### 4.1 Complete Upload Sequence

1. User selects PDF file
2. `upload.js` calls `window.UploadHandler.handlePaperUpload()`
3. `upload-handler.js`:
   - Waits for Supabase to be ready
   - Validates file (PDF, <50MB)
   - Gets session via `supabase.auth.getSession()`
   - **Fails immediately if no session** (hard requirement)
   - Uploads to `uploads-temp` bucket
   - Creates record in `submissions` table
   - Returns success/error

### 4.2 Storage Buckets

| Bucket | Purpose | Access |
|--------|---------|--------|
| `uploads-temp` | Pending uploads | Authenticated users |
| `uploads-approved` | Reviewed uploads | Admins only |
| `uploads-public` | Published papers | Public read |

### 4.3 Upload Success Criteria

Upload is only successful when:
1. ✅ Session exists (user is logged in)
2. ✅ File is valid PDF under 50MB
3. ✅ File uploads to storage bucket
4. ✅ Submission record created in database

If DB insert fails, the uploaded file is cleaned up.

---

## 5. Admin Dashboard

### 5.1 Access Control

Admin dashboard access requires:
1. User must be authenticated
2. User must have `admin` or `reviewer` role (verified by backend)

```javascript
// dashboard.js uses auth contract
const session = await window.AuthContract.requireRole(['admin', 'reviewer']);
if (!session) {
  // Show access denied UI (graceful)
  return;
}
```

### 5.2 Admin Operations

All admin operations use backend-verified permissions:
- **Approve:** Moves file from temp → public, updates submission status
- **Reject:** Deletes file from temp, updates submission status
- **Delete:** Removes file and database record

---

## 6. Bootstrap & Error Handling

### 6.1 Bootstrap Guarantees

`js/bootstrap.js` provides:
- `window.App` object (always exists)
- `window.__APP_BOOTED__` flag
- Global error handlers (logs, never throws)

**Critical:** Bootstrap NEVER throws errors. All failures are logged and the app continues.

### 6.2 Graceful Degradation

Every script follows this pattern:
1. Check if dependencies exist
2. If missing, log warning and continue
3. Never throw errors that block page render
4. Never use `alert()` to show errors to users

Example:
```javascript
// ✅ Correct - graceful degradation
if (!window.__APP_BOOTED__) {
  console.warn('[COMMON] Bootstrap not loaded - continuing with degraded functionality');
}

// ❌ Wrong - blocking error
if (!window.__APP_BOOTED__) {
  alert('BOOTSTRAP FAILED');
  throw new Error('Bootstrap not loaded');
}
```

---

## 7. Debug System

### 7.1 How Debug Works

The debug system is initialized by `debug.module.js` and exposed as `window.Debug`:

```javascript
window.Debug = {
  logInfo(module, message, data),
  logWarn(module, message, data),
  logError(module, message, data),
  showPanel(),
  hidePanel(),
  togglePanel()
};
```

### 7.2 Safe Debug Logging

Because ES modules load asynchronously, `window.Debug` may not exist when classic scripts first run. Use safe wrappers:

```javascript
function safeLogInfo(module, message, data) {
  if (window.Debug && window.Debug.logInfo) {
    window.Debug.logInfo(module, message, data);
  } else {
    console.log(`[${module.toUpperCase()}] ${message}`, data || '');
  }
}
```

---

## 8. File Structure

### 8.1 JavaScript Files

```
/js
├── bootstrap.js        # First script - creates window.App
├── supabase.js         # ES module - creates Supabase client
├── app.module.js       # ES module entry point
├── auth.js             # Auth contract (waitForSupabase)
├── common.js           # UI helpers (theme, partials)
├── upload.js           # Upload page controller
├── upload-handler.js   # Upload business logic
├── supabase-client.js  # Storage helpers
├── admin-auth.js       # Admin verification
├── roles.js            # Badge system
├── avatar-utils.js     # Avatar helpers
├── avatar-popup.js     # Avatar popup controller
├── profile-panel.js    # Profile panel controller
├── paper.js            # Paper page controller
├── settings.js         # Settings page controller
├── theme.js            # Theme application
└── modules/
    ├── auth.module.js  # ES module auth listeners
    └── debug.module.js # ES module debug system
```

### 8.2 HTML Pages

```
/
├── index.html          # Home page
├── upload.html         # Upload page (requires auth)
├── browse.html         # Browse papers
├── paper.html          # Single paper view
├── settings.html       # User settings (requires auth)
├── about.html          # About page
├── privacy.html        # Privacy policy
├── terms.html          # Terms of service
└── admin/
    └── dashboard.html  # Admin dashboard (requires admin role)
```

---

## 9. Key Invariants

These rules MUST always be true:

1. **Bootstrap never throws** - Only logs warnings
2. **Classic scripts wait for Supabase** - Use `waitForSupabase()` helper
3. **Auth is server-verified** - Never trust frontend for permissions
4. **Upload requires session** - Hard fail if not authenticated
5. **No blocking alerts** - Use toast messages or inline UI
6. **Graceful degradation** - App should work even if some features fail

---

## 10. Troubleshooting

### 10.1 "Supabase not initialized"

**Cause:** Classic script tried to use Supabase before ES module finished
**Fix:** Use `waitForSupabase()` helper function

### 10.2 "Upload blocked: session missing"

**Cause:** User is not logged in
**Fix:** Redirect to sign in or show sign-in UI

### 10.3 "Access denied" on admin dashboard

**Cause:** User doesn't have admin/reviewer role
**Fix:** Check Supabase user_roles table

### 10.4 Page not rendering

**Cause:** JavaScript error blocking execution
**Fix:** Check browser console for errors, ensure no `throw` in bootstrap path

---

## Version History

- **Phase 9.2** (2026-02-05) - **Major Architecture Overhaul**
  - Added centralized auth controller (`js/auth-controller.js`)
  - Created shared Supabase wait utility (`js/utils/supabase-wait.js`)
  - Implemented event-driven auth (`auth:ready`, `auth-state-changed`)
  - Removed 204 lines of duplicate code
  - Fixed race conditions in upload, settings, admin pages
  - Added comprehensive documentation (4,195+ lines)
  - OAuth error handling with user-friendly messages
  - URL cleanup after OAuth callback
- **Phase 9.2.8** - Fixed timing issues with Supabase initialization, removed blocking errors
- **Phase 9.2.5** - Auth contract system
- **Phase 9.2.4** - Module architecture
- **Phase 9.2.3** - Classic JS conversion

---

## 11. Additional Documentation

For detailed system-specific documentation, see:

- **[AUTH_SYSTEM.md](./AUTH_SYSTEM.md)** — Complete authentication documentation
  - Architecture and component hierarchy
  - API reference with code examples
  - Event system documentation
  - Debugging guide for auth issues
  - Security model and best practices

- **[UPLOAD_SYSTEM.md](./UPLOAD_SYSTEM.md)** — Complete upload documentation
  - Upload flow and state management
  - Supabase Storage integration
  - File validation and size limits
  - Admin review workflow
  - Troubleshooting upload issues

- **[ADMIN_SYSTEM.md](./ADMIN_SYSTEM.md)** — Complete admin documentation
  - Role-based access control (RBAC)
  - Admin dashboard features
  - Review workflow (approve/reject)
  - Backend RPC functions
  - Adding new admins/reviewers

- **[REPO_HEALTH_CHECK.md](./REPO_HEALTH_CHECK.md)** — Repository health analysis
  - Complete codebase audit
  - Root cause analysis of Phase 9.2 issues
  - Code duplication findings
  - Recommended action plan
