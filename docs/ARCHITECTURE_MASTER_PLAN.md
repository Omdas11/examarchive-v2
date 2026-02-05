# ExamArchive v2 — Architecture Master Plan

> **Version:** 2.1.0  
> **Last Updated:** Phase 9.2.8  
> **Status:** CANONICAL — This is the single source of truth for all architecture decisions

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

## 3. Authentication Flow

### 3.1 How Auth Actually Works

1. **Initial Load:** `supabase.js` calls `getSession()` and stores result in `window.App.session`
2. **Classic Script Access:** Scripts use `window.AuthContract.requireSession()` which:
   - Waits for Supabase to be initialized
   - Calls `supabase.auth.getSession()`
   - Returns session or null

### 3.2 Auth Contract API

`js/auth.js` exposes the ONLY way to check authentication:

```javascript
window.AuthContract = {
  requireSession(),    // Returns session or null (waits for Supabase)
  requireRole(roles)   // Returns session if user has role, else null
};
```

### 3.3 Role-Based Access

Admin/reviewer access is controlled by backend functions:

```javascript
// Check if user is admin
const { data } = await supabase.rpc('is_admin', { user_id_param: userId });

// Get user's role
const { data } = await supabase.rpc('get_user_role_name', { user_id_param: userId });
```

**NEVER** infer roles from frontend data. Always call backend functions.

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

- **Phase 9.2.8** - Fixed timing issues with Supabase initialization, removed blocking errors
- **Phase 9.2.5** - Auth contract system
- **Phase 9.2.4** - Module architecture
- **Phase 9.2.3** - Classic JS conversion
