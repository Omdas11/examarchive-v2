# Repository Health Check — Phase 9.2

> **Date:** 2026-02-05  
> **Purpose:** Comprehensive audit of ExamArchive v2 before architecture stabilization  
> **Status:** DIAGNOSTIC ONLY — No fixes applied yet

---

## Executive Summary

This repository health check reveals a **functioning but architecturally fragmented** codebase. The primary issues are:

1. **Code Duplication** — 8 identical `waitForSupabase*` functions across different files
2. **Multiple Auth Listeners** — 4+ files independently listening to auth state changes
3. **Distributed Session Management** — Session stored in multiple global locations
4. **No Centralized Auth Controller** — Auth logic scattered across 10+ files
5. **Documentation Drift** — No single source of truth for auth, upload, or admin systems

**Root Cause:** Incremental development without refactoring has led to "copy-paste" patterns instead of shared utilities.

---

## 1. Directory Structure Overview

```
examarchive-v2/
├── admin/                    # Admin dashboard (role-restricted)
│   ├── dashboard/           
│   │   └── index.html       # Duplicate admin page
│   ├── dashboard.html       # ✅ Primary admin dashboard
│   ├── dashboard.js         # Admin logic
│   ├── dashboard.css        # Admin styles
│   └── sql/                 # Database scripts
├── assets/                  # Images and static assets
├── css/                     # Global and component styles
├── data/                    # Static data files
├── demo/                    # Demo/test pages
├── docs/                    # Documentation
│   └── ARCHITECTURE_MASTER_PLAN.md  # ✅ Current architecture doc
├── js/                      # JavaScript modules
│   ├── modules/             # ES6 modules
│   │   ├── auth.module.js   # Auth state management
│   │   └── debug.module.js  # Debug utilities
│   ├── auth.js              # Auth contract API
│   ├── admin-auth.js        # Backend admin verification
│   ├── avatar-popup.js      # Auth UI popup
│   ├── avatar-utils.js      # OAuth handlers
│   ├── bootstrap.js         # ✅ App initialization
│   ├── app.module.js        # ✅ ES6 entry point
│   ├── common.js            # Partial loader & theme
│   ├── supabase.js          # Supabase client init
│   ├── supabase-client.js   # Storage operations
│   ├── upload.js            # Upload page controller
│   ├── upload-handler.js    # Upload backend logic
│   ├── settings.js          # Settings page controller
│   └── [other pages]
├── partials/                # Reusable HTML components
│   ├── header.html
│   ├── footer.html
│   ├── avatar-popup.html
│   └── profile-panel.html
├── index.html               # ✅ Home page (entry point)
├── upload.html              # ✅ Upload page
├── settings.html            # ✅ Settings page
├── browse.html              # Browse papers
├── paper.html               # Individual paper view
└── [other pages]
```

### Key Entry Points

| File | Purpose | Auth Required |
|------|---------|---------------|
| `index.html` | Home page | No |
| `upload.html` | Paper upload | **Yes** |
| `settings.html` | User settings | **Yes** |
| `admin/dashboard.html` | Admin moderation | **Yes (Admin/Reviewer role)** |
| `paper.html` | View paper details | No |
| `browse.html` | Browse papers | No |

---

## 2. Authentication System

### 2.1 What is Authoritative

**Single Source of Truth:**
- `js/supabase.js` — Initializes Supabase client, calls `getSession()`, dispatches `app:ready` event
- `window.App.session` — Primary session storage location
- `js/auth.js` — Exposes `window.AuthContract` with `requireSession()` and `requireRole()` APIs

**Primary Auth Flow:**
1. `bootstrap.js` creates `window.App` object
2. Supabase SDK loads from CDN
3. `app.module.js` imports `supabase.js` and `auth.module.js`
4. `supabase.js` creates client, calls `getSession()`, stores in `window.App.session`
5. `app:ready` event dispatched
6. Classic scripts use `AuthContract.requireSession()` to check auth

### 2.2 What is Duplicated

**❌ CRITICAL ISSUE — 8 Identical `waitForSupabase*` Functions:**

Each file implements its own polling function with identical logic:

| File | Function Name | Lines |
|------|---------------|-------|
| `js/auth.js` | `waitForSupabase()` | 15-47 |
| `js/admin-auth.js` | `waitForSupabaseAdmin()` | 10-42 |
| `js/supabase-client.js` | `waitForSupabaseStorage()` | 9-41 |
| `js/upload-handler.js` | `waitForSupabaseClient()` | 16-48 |
| `js/profile-panel.js` | `waitForSupabaseProfile()` | 34-66 |
| `js/paper.js` | `waitForSupabasePaper()` | ~early lines |
| `js/roles.js` | `waitForSupabaseRoles()` | ~early lines |
| `js/avatar-utils.js` | `waitForSupabaseAvatar()` | ~early lines |

**Impact:** ~300 lines of duplicated code. Any bug fix requires 8 updates.

**❌ Multiple Auth State Listeners:**

Several files independently listen to `onAuthStateChange`:

| File | Purpose | Issue |
|------|---------|-------|
| `js/modules/auth.module.js` | Primary listener, updates `window.App.session` | ✅ Correct location |
| `js/avatar-popup.js` | Re-renders popup on auth change | ⚠️ Should use event, not direct listener |
| `js/profile-panel.js` | Updates profile panel | ⚠️ Should use event, not direct listener |
| `js/settings.js` | Re-renders settings | ⚠️ Should use event, not direct listener |

**Impact:** Multiple handlers fire for same event. Risk of race conditions and state inconsistencies.

### 2.3 What is Dead / Unused

**✅ No login.html** — Confirmed not present in repository
**✅ No auto-OAuth on page load** — OAuth only triggered by user click

**Potentially Unused:**
- `admin/dashboard/index.html` — Appears to be duplicate of `admin/dashboard.html`
- Various legacy helper functions in older scripts

### 2.4 What is Conflicting

**❌ Multiple Session Storage Locations:**

| Location | Set By | Purpose |
|----------|--------|---------|
| `window.App.session` | `supabase.js` (line 52) | Primary storage |
| `window.__SESSION__` | `auth.module.js` (line 31) | Backward compatibility |
| Direct `supabase.auth.getSession()` calls | Various files | Bypasses cache |

**Impact:** Unclear which is canonical. Different files read from different sources.

**❌ Conflicting Error Handlers:**

- `bootstrap.js` installs global error handlers
- Individual scripts have their own try-catch with console.error
- No unified error reporting or user feedback system

---

## 3. Upload System

### 3.1 What is Authoritative

**Upload Flow:**
1. `upload.html` — UI and form structure
2. `js/upload.js` — Page controller, auth guard, form validation
3. `js/upload-handler.js` — Backend integration, file upload to Supabase Storage
4. Supabase Storage bucket: `paper-submissions`
5. Supabase table: `paper_submissions` (metadata)

**Auth Gating:**
- `upload.js` calls `AuthContract.requireSession()` on DOMContentLoaded
- If no session, renders "Sign in required" message
- If session exists, initializes upload form

### 3.2 What is Duplicated

**Nothing significant** — Upload logic is well-contained.

### 3.3 What is Dead / Unused

**Upload type selector** — UI exists for "Repeated Questions" and "Notes/Resources" but they're disabled. Backend only supports "Question Papers" currently.

### 3.4 What is Conflicting

**No conflicts** — Upload system is relatively clean.

**Known Issue:** Upload success depends on:
1. User authentication (checked ✅)
2. Supabase Storage bucket policy (not verified in code)
3. Backend RLS policies (assumed correct)

---

## 4. Admin System

### 4.1 What is Authoritative

**Admin Access Flow:**
1. `admin/dashboard.html` — UI
2. `admin/dashboard.js` — Dashboard controller
3. `js/admin-auth.js` — Backend admin verification via `is_admin` RPC
4. `js/auth.js` — `requireRole(['admin', 'reviewer'])` contract
5. Supabase RPC: `is_admin`, `get_user_role_name`
6. Supabase table: `user_roles` (role assignments)

**Access Control:**
- Admin page calls `AuthContract.requireRole(['admin', 'reviewer'])`
- Backend verifies role via database lookup
- RLS policies enforce read/write permissions

### 4.2 What is Duplicated

**Nothing significant** — Admin logic is well-separated.

### 4.3 What is Dead / Unused

**Potentially unused:**
- `admin/dashboard/index.html` — Appears to be duplicate of `admin/dashboard.html`

### 4.4 What is Conflicting

**No conflicts** — Admin system follows auth contract pattern correctly.

**Potential Issue:** Error messages are generic ("Access Denied"). No distinction between:
- Not signed in
- Signed in but not admin
- Admin check RPC failed

---

## 5. Documentation State

### 5.1 Current Documentation

| File | Status | Content Quality |
|------|--------|-----------------|
| `docs/ARCHITECTURE_MASTER_PLAN.md` | ✅ Current | Excellent, canonical |
| *(No other docs in docs/)* | ❌ Missing | Need AUTH_SYSTEM.md, UPLOAD_SYSTEM.md, ADMIN_SYSTEM.md |

### 5.2 Missing Documentation

**Critical Gaps:**
1. **No AUTH_SYSTEM.md** — How to use AuthContract, OAuth flow, debugging auth issues
2. **No UPLOAD_SYSTEM.md** — How upload works, storage policies, approval flow
3. **No ADMIN_SYSTEM.md** — Role management, moderation workflow, RLS policies
4. **No development guide** — How to run locally, test, debug
5. **No API reference** — Supabase functions, tables, schemas

### 5.3 Documentation Recommendations

Create these new docs:
- `docs/AUTH_SYSTEM.md` — Authentication architecture and debugging
- `docs/UPLOAD_SYSTEM.md` — Upload flow and backend integration
- `docs/ADMIN_SYSTEM.md` — Admin access and moderation
- `docs/DEVELOPMENT.md` — Local setup and testing
- `docs/API_REFERENCE.md` — Backend functions and schemas

---

## 6. Root Cause Analysis

### 6.1 Why "flow_state_not_found" Happens

**Diagnosis:**

This error comes from **Supabase Auth backend**, not our code. It occurs when:

1. **OAuth state mismatch** — The `state` parameter in OAuth callback doesn't match the one sent in auth request
2. **PKCE verification failure** — Code challenge/verifier mismatch
3. **Redirect URI mismatch** — Callback URL doesn't match registered redirect URIs in Supabase dashboard

**Probable Cause in This Repo:**

Looking at `js/supabase.js`:
```javascript
supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,  // ✅ Auto-detects OAuth callback
      flowType: "pkce"            // ✅ PKCE enabled
    }
  }
);
```

And `js/avatar-utils.js`:
```javascript
await supabase.auth.signInWithOAuth({
  provider: "google",
  options: {
    redirectTo: window.location.origin,  // ⚠️ Returns to root
  }
});
```

**The Issue:**
- OAuth redirects to `window.location.origin` (e.g., `https://example.com/`)
- But if user started OAuth from `https://example.com/settings.html`, they get redirected to root
- User might navigate to another page before callback completes
- Supabase tries to detect callback on new page → state mismatch → `flow_state_not_found`

**Additional Factors:**
- Browser extensions blocking cookies/localStorage
- User clearing cookies between auth request and callback
- Multiple tabs competing for same OAuth flow

**Fix Required:**
1. ✅ Keep `detectSessionInUrl: true` (correct)
2. ✅ Add URL parameter cleanup after callback
3. ❌ Don't change redirect URL (keep at origin for consistency)
4. ✅ Add user-facing error message for failed OAuth

### 6.2 Why Settings Shows "Sign in required" After Sign-In

**Diagnosis:**

Looking at `js/settings.js` (lines 536-583):

```javascript
document.addEventListener("DOMContentLoaded", async () => {
  const { requireSession } = window.AuthContract;
  const session = await requireSession();
  
  if (!session) {
    renderSignInRequired();  // ⚠️ Renders "sign in required"
  } else {
    renderSettingsUI();
  }
});
```

**The Issue:**

This is a **race condition**:

1. `settings.html` loads
2. DOMContentLoaded fires
3. `settings.js` calls `requireSession()`
4. `requireSession()` calls `waitForSupabase()` (waits up to 10s)
5. If Supabase isn't ready yet, `waitForSupabase()` times out → returns `null`
6. `settings.js` thinks user is not signed in → shows "sign in required"

**Why It Happens:**

- ES modules (`app.module.js`) load **asynchronously**
- Classic scripts load **synchronously** in order
- On slow connections or cold starts, classic scripts run before ES module finishes
- `waitForSupabase()` has 10s timeout, but may return early if `app:ready` doesn't fire

**Fix Required:**
1. ✅ Ensure `waitForSupabase()` reliably waits for `app:ready` event
2. ✅ Add loading state while checking auth (don't immediately show "sign in required")
3. ✅ Increase timeout or improve event signaling

### 6.3 Why Upload Page Stays Locked or Doesn't Upload

**Diagnosis:**

Same root cause as settings — **race condition** between auth check and Supabase initialization.

`js/upload.js` (lines 13-26):
```javascript
document.addEventListener("DOMContentLoaded", async () => {
  const { requireSession } = window.AuthContract;
  const session = await requireSession();
  
  if (!session) {
    console.log("🔒 Upload page access denied - user not authenticated");
    renderSignInRequired();  // ⚠️ Shows sign-in UI
  } else {
    console.log("✅ User authenticated, upload page ready");
    initializeUploadForm();
  }
});
```

**Additional Issue — File Upload:**

`js/upload-handler.js` uploads to Supabase Storage. Potential failures:
1. **Storage bucket policy** — RLS may block unauthenticated uploads
2. **File size limits** — Not clearly enforced in UI
3. **Network errors** — Not gracefully handled with retries

**Fix Required:**
1. ✅ Fix auth race condition (same as settings)
2. ✅ Add explicit file size validation
3. ✅ Add retry logic for network failures
4. ✅ Add clear error messages for storage policy failures

### 6.4 Why Admin Dashboard Shows Access Denied or Partial Load

**Diagnosis:**

`admin/dashboard.js` (lines 27-66):
```javascript
document.addEventListener("DOMContentLoaded", async () => {
  const loadingState = document.getElementById('loading-state');
  const accessDenied = document.getElementById('access-denied');
  const dashboardContent = document.getElementById('dashboard-content');

  try {
    if (!window.AuthContract?.requireRole) {
      console.error('[ADMIN-DASHBOARD] AuthContract not available');
      loadingState.style.display = 'none';
      accessDenied.style.display = 'flex';  // ⚠️ Shows access denied
      return;
    }
    
    const { requireRole } = window.AuthContract;
    const session = await requireRole(['admin', 'reviewer']);
    
    if (!session) {
      console.error('[ADMIN-DASHBOARD] Access denied - insufficient permissions');
      accessDenied.style.display = 'flex';  // ⚠️ Shows access denied
      return;
    }
    
    // Success path...
  } catch (err) {
    console.error('[ADMIN-DASHBOARD] Error checking admin access:', err);
    loadingState.style.display = 'none';
    accessDenied.style.display = 'flex';  // ⚠️ Shows access denied
  }
});
```

**Three Different "Access Denied" Cases:**
1. `AuthContract` not loaded yet → Shows generic "Access Denied"
2. User not signed in → Shows generic "Access Denied"
3. User signed in but not admin → Shows generic "Access Denied"

**The Issue:**

User can't distinguish between:
- "You need to sign in first"
- "You are signed in but don't have admin privileges"
- "Something went wrong checking your permissions"

**Fix Required:**
1. ✅ Add distinct error messages for each case
2. ✅ Show "Loading..." state while checking auth
3. ✅ Add "Sign in" button if user not authenticated
4. ✅ Add "Request Access" info if user authenticated but not admin

### 6.5 Why common.js Blocked Bootstrap Failure

**Diagnosis:**

Looking at `js/common.js` (lines 8-10):
```javascript
// ⚠️ GRACEFUL DEGRADATION: Log warning instead of throwing
if (!window.__APP_BOOTED__) {
  console.warn('[COMMON] Bootstrap not loaded - continuing with degraded functionality');
}
```

**This is actually CORRECT behavior** — Phase 9.2.8 added graceful degradation.

**Previous Issue (Now Fixed):**
- Old versions threw error if `bootstrap.js` didn't load
- Blocked entire page from rendering
- Phase 9.2.8 changed to warning only

**Current State:** ✅ No longer an issue

---

## 7. System Health Summary

### 7.1 Critical Issues (Must Fix)

| Issue | Severity | Impact |
|-------|----------|--------|
| Code duplication (8 `waitForSupabase*` functions) | 🔴 High | Maintenance burden, bug multiplication |
| Multiple auth listeners | 🔴 High | Race conditions, state inconsistencies |
| Race condition in auth checks | 🔴 High | Users see "sign in required" when signed in |
| Generic "Access Denied" messages | 🟡 Medium | Poor UX, hard to debug |
| OAuth flow_state_not_found error | 🟡 Medium | Intermittent sign-in failures |
| No centralized auth controller | 🟡 Medium | Auth logic scattered across 10+ files |

### 7.2 Documentation Issues

| Issue | Severity | Impact |
|-------|----------|--------|
| Missing AUTH_SYSTEM.md | 🟡 Medium | Hard to understand auth flow |
| Missing UPLOAD_SYSTEM.md | 🟡 Medium | Hard to debug upload issues |
| Missing ADMIN_SYSTEM.md | 🟡 Medium | Hard to understand role management |
| No development guide | 🟢 Low | Onboarding difficulty |

### 7.3 Architectural Strengths

✅ **What's Working Well:**
1. **ARCHITECTURE_MASTER_PLAN.md** — Excellent documentation of current state
2. **Auth Contract Pattern** — `window.AuthContract` API is clean and consistent
3. **Separation of Concerns** — Upload, admin, settings are well-separated
4. **No auto-OAuth** — User-initiated sign-in only (good practice)
5. **Graceful Degradation** — Scripts don't crash if Supabase fails to load
6. **RLS-First Security** — All permissions enforced on backend

---

## 8. Recommended Action Plan

### Phase 1: Consolidate Auth (Priority 1)

1. ✅ Create `js/auth-controller.js` — Single centralized auth controller
2. ✅ Move all auth logic into `auth-controller.js`
3. ✅ Create `js/utils/supabase-wait.js` — Single shared wait function
4. ✅ Remove 8 duplicate `waitForSupabase*` functions
5. ✅ Consolidate auth listeners to single listener in `auth.module.js`
6. ✅ Emit custom `auth:ready` event after session initialized
7. ✅ Update all pages to wait for `auth:ready` event

### Phase 2: Fix Race Conditions (Priority 1)

1. ✅ Add loading state to settings, upload, admin pages
2. ✅ Don't immediately render "sign in required"
3. ✅ Wait for `auth:ready` event before checking session
4. ✅ Add timeout handling with user-friendly error

### Phase 3: Improve Error Messages (Priority 2)

1. ✅ Add distinct error messages for admin dashboard
2. ✅ Add OAuth error handling with user feedback
3. ✅ Add URL cleanup after OAuth callback
4. ✅ Add retry logic for upload failures

### Phase 4: Documentation (Priority 2)

1. ✅ Create `docs/AUTH_SYSTEM.md`
2. ✅ Create `docs/UPLOAD_SYSTEM.md`
3. ✅ Create `docs/ADMIN_SYSTEM.md`
4. ✅ Move legacy Phase 4-8 docs to `docs/legacy/` (if any exist)
5. ✅ Update `ARCHITECTURE_MASTER_PLAN.md` with Phase 9.2 changes

---

## 9. Future Improvements (Post-Phase 9.2)

**Not required for current phase but recommended for future:**

1. **TypeScript Migration** — Add type safety to reduce runtime errors
2. **Build System** — Use bundler (Vite/Rollup) to eliminate duplicate code
3. **Testing** — Add unit tests for auth, upload, admin logic
4. **Error Tracking** — Integrate Sentry or similar for production error monitoring
5. **Logging Framework** — Structured logging instead of console.log
6. **Performance Monitoring** — Track page load times, API latency
7. **Accessibility Audit** — Ensure WCAG 2.1 compliance
8. **Security Audit** — Penetration testing, CSP headers, XSS protection

---

## 10. Conclusion

**Current State:** Functional but fragmented architecture with auth timing issues.

**Root Causes:**
1. Incremental development without refactoring
2. Copy-paste pattern instead of shared utilities
3. ES module timing not fully accounted for in classic scripts
4. No centralized auth controller

**Required Work:**
- Create centralized auth controller
- Eliminate code duplication
- Fix race conditions
- Improve error messages
- Write comprehensive documentation

**Estimated Effort:** ~8-12 hours of focused development + testing

**Risk Level:** 🟡 Medium — Changes touch critical auth flow, requires careful testing

---

**Next Step:** Proceed to PART 2 — Create `js/auth-controller.js` and consolidate auth logic.
