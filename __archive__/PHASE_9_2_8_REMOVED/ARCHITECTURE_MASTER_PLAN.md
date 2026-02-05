# ExamArchive v2 — Architecture Master Plan

> **Version:** 2.0.0  
> **Last Updated:** Phase 9.2.7  
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

The system operates with clear trust boundaries:

1. **Frontend** — Untrusted. Never makes security decisions.
2. **Supabase Auth** — Trusted for identity verification.
3. **Supabase RLS** — Trusted for authorization. All permission checks happen here.
4. **Backend Functions** — Trusted for role-based access control.

**Critical Rule:** The frontend NEVER decides permissions. All authorization is enforced by Row Level Security (RLS) policies on the backend.

---

## 2. Execution Model

### 2.1 Page Load Sequence

Every page follows this exact load order:

```
1. HTML parsed
2. bootstrap.js loads (MUST be first script)
   └─ Creates window.App object
   └─ Installs global error handlers
3. Supabase SDK loads (CDN)
4. app.module.js loads (type="module")
   └─ Imports supabase.js → Creates client, dispatches app:ready
   └─ Imports auth.module.js → Sets up auth listener
   └─ Imports debug.module.js → Exposes window.Debug
5. Classic scripts load in order:
   └─ theme.js → Applies saved theme
   └─ common.js → Loads partials (header/footer)
   └─ Page-specific scripts
```

### 2.2 Bootstrap Flow

The bootstrap phase is critical. It MUST complete before any other JavaScript executes.

```javascript
// js/bootstrap.js — SINGLE RESPONSIBILITY
(function () {
  if (window.__APP_BOOTED__) return;
  window.__APP_BOOTED__ = true;
  
  window.App = {
    ready: false,
    supabase: null,
    session: null
  };
  
  // Global error handlers
  window.addEventListener('error', ...);
  window.addEventListener('unhandledrejection', ...);
})();
```

**Bootstrap guarantees:**
- `window.App` object exists
- Error handlers are installed
- Subsequent scripts can safely reference `window.App`

### 2.3 Error Containment Strategy

JavaScript errors are handled at two levels:

1. **Global Level** — `bootstrap.js` catches all uncaught errors and promise rejections
2. **Module Level** — Individual scripts use try/catch for recoverable errors

**Design Principle:** A failing non-critical module (e.g., debug panel) MUST NOT block critical functionality (e.g., authentication, content display).

---

## 3. Authentication Model

### 3.1 Session Lifecycle

```
User lands on page
        │
        ▼
┌───────────────────┐
│ supabase.js loads │
│ getSession()      │────▶ Session exists? ─▶ Store in window.App.session
└───────────────────┘                │
        │                            ▼ No
        │                    Guest mode (null session)
        ▼
auth.module.js sets up onAuthStateChange listener
```

### 3.2 OAuth Flow (Google)

```
1. User clicks "Sign in with Google"
2. avatar-utils.js calls supabase.auth.signInWithOAuth()
3. Redirect to Google consent screen
4. Google redirects back with auth code
5. Supabase exchanges code for session
6. onAuthStateChange fires with new session
7. UI updates to reflect authenticated state
```

### 3.3 Session Storage

- Sessions are persisted by Supabase in `localStorage`
- Auto-refresh is enabled (`autoRefreshToken: true`)
- PKCE flow is used for security (`flowType: "pkce"`)

### 3.4 Auth Contract

The `auth.js` file provides the **single source of truth** for authentication checks:

```javascript
window.AuthContract = {
  requireSession,   // Returns session or null
  requireRole       // Checks session + role from backend
};
```

**Rules:**
- Only `AuthContract` methods should be used to check auth
- Backend RPC functions verify roles, not frontend logic
- No frontend-only role caching

---

## 4. Authorization Model

### 4.1 Role Hierarchy

| Role | Level | Capabilities |
|------|-------|--------------|
| admin | 100 | Full system access, user management |
| reviewer | 50 | Review submissions, publish papers |
| user | 10 | Upload papers, view submissions |
| visitor | 0 | Read-only access to public content |

### 4.2 Backend as Source of Truth

Roles are NEVER inferred from frontend state. All role checks use backend RPC functions:

```javascript
// admin-auth.js
window.AdminAuth = {
  isAdminBackend,        // Calls is_admin() RPC
  isCurrentUserAdmin,    // Calls is_current_user_admin() RPC
  getUserRoleBackend,    // Calls get_user_role_name() RPC
  assignRole             // Admin-only role assignment
};
```

### 4.3 Admin vs User Access

**Admin Dashboard Access:**
```javascript
const session = await requireRole(['admin', 'reviewer']);
if (!session) {
  // Show access denied
  return;
}
// Proceed with admin functionality
```

**Protected Content:**
- Repeated Questions → Requires authenticated user
- Notes → Requires authenticated user  
- Upload → Requires authenticated user
- Admin Dashboard → Requires admin or reviewer role

---

## 5. Storage Model

### 5.1 Bucket Structure

| Bucket | Purpose | Access |
|--------|---------|--------|
| `uploads-temp` | Pending submissions | User (write), Reviewer (read) |
| `uploads-approved` | Approved, unpublished | Reviewer only |
| `uploads-public` | Published papers | Public (read) |

### 5.2 Upload Flow

```
1. User selects PDF file
2. Frontend validates (size, type)
3. AuthContract.requireSession() called
4. File uploaded to uploads-temp bucket
5. Submission record created in database
6. Reviewer sees pending submission
7. Reviewer approves → file moves to uploads-public
8. Public URL generated
```

### 5.3 RLS Enforcement

All storage operations are protected by RLS:

- Users can only upload to their own folder
- Users can only view their own submissions
- Reviewers can view all pending submissions
- Public bucket is read-only for all

### 5.4 Demo vs Production Behavior

The system uses the same Supabase project for demo and production. The only difference is the data in the database. No code changes are required.

---

## 6. Debug Philosophy

### 6.1 Core Principle

**Debug functionality MUST NEVER block page execution.**

A user should never see a blank page or broken functionality because the debug system failed.

### 6.2 Debug Architecture

```javascript
// js/modules/debug.module.js
window.Debug = {
  logInfo,      // Log info message
  logWarn,      // Log warning
  logError,     // Log error
  showPanel,    // Show debug panel
  hidePanel,    // Hide debug panel
  togglePanel,  // Toggle panel visibility
  DebugModule,  // Module identifiers
  DebugLevel    // Severity levels
};
```

### 6.3 Admin-Only Visibility

Debug panel visibility is controlled by:
1. User role (admin/reviewer only)
2. LocalStorage preference (`debug-panel-enabled`)

Currently, `DEBUG_FORCE_ENABLE = true` is set for development. Set to `false` for production.

### 6.4 Mobile-Safe Behavior

Debug panel is:
- Fixed to bottom-right corner
- Responsive (max-width on mobile)
- Collapsible to minimize screen real estate
- Hidden by default on page load

---

## 7. Non-Goals

This section explicitly states what ExamArchive v2 intentionally does NOT do:

### 7.1 No Server-Side Rendering

ExamArchive is purely static. There is no server-side rendering, no Node.js backend, no SSR framework.

### 7.2 No Complex State Management

There is no Redux, no MobX, no complex state management library. State is managed through:
- `window.App` for global state
- Supabase subscriptions for real-time updates
- LocalStorage for preferences

### 7.3 No Build Step Required

The JavaScript is plain ES5/ES6. There is no webpack, no Babel, no TypeScript compilation required. The code runs directly in the browser.

### 7.4 No Offline Support

There is no service worker, no offline caching strategy. The application requires an internet connection to function.

### 7.5 No Multi-Tenant Support

The system serves a single university/organization. There is no tenant isolation, no subdomain-based routing.

### 7.6 No API Gateway

All communication is directly with Supabase. There is no API gateway, no rate limiting layer, no custom middleware.

---

## File Structure Reference

```
/js
├── bootstrap.js         # App initialization (MUST load first)
├── app.module.js        # ES module entry point
├── supabase.js          # Supabase client (ES module)
├── auth.js              # Auth contract (classic script)
├── admin-auth.js        # Admin role verification
├── common.js            # UI helpers (header/footer/theme)
├── theme.js             # Theme controller
├── roles.js             # Badge/role display utilities
├── avatar-utils.js      # Avatar helper functions
├── avatar-popup.js      # Avatar popup controller
├── profile-panel.js     # Profile panel controller
├── supabase-client.js   # Storage helper functions
├── upload-handler.js    # Upload logic
├── upload.js            # Upload page controller
├── settings.js          # Settings page controller
├── browse.js            # Browse page controller
├── paper.js             # Paper page controller
├── home-search.js       # Home search controller
├── notices-calendar.js  # Notices/calendar controller
├── about.js             # About page controller
└── modules/
    ├── auth.module.js   # Auth state management (ES module)
    └── debug.module.js  # Debug system (ES module)

/admin
├── dashboard.html       # Admin dashboard page
├── dashboard.js         # Admin dashboard controller
└── dashboard/
    └── index.html       # Admin dashboard (alternate path)

/docs
└── ARCHITECTURE_MASTER_PLAN.md  # This document (canonical)
```

---

## Quick Reference

### Checking Auth State
```javascript
// Use AuthContract
const session = await window.AuthContract.requireSession();
if (!session) {
  // User not logged in
}
```

### Checking Admin Access
```javascript
// Use AuthContract with role check
const session = await window.AuthContract.requireRole(['admin', 'reviewer']);
if (!session) {
  // Access denied
}
```

### Logging Debug Messages
```javascript
// Use window.Debug
window.Debug.logInfo('auth', 'User signed in', { email: user.email });
window.Debug.logError('upload', 'Upload failed', { error: err.message });
```

### Accessing Supabase Client
```javascript
// Use window.__supabase__ (set by supabase.js)
const { data, error } = await window.__supabase__.from('submissions').select('*');
```

---

*This document is the single source of truth. All other documentation must derive from and reference this document.*
