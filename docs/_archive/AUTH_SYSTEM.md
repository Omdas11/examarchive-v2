# Authentication System Documentation

> **Phase:** 9.2  
> **Last Updated:** 2026-02-05  
> **Status:** CANONICAL — Single source of truth for auth implementation

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Components](#core-components)
4. [Authentication Flow](#authentication-flow)
5. [API Reference](#api-reference)
6. [Usage Patterns](#usage-patterns)
7. [Debugging Guide](#debugging-guide)
8. [Security Model](#security-model)

---

## Overview

ExamArchive uses **Supabase Auth** for authentication with Google OAuth as the identity provider. The system is built around a **centralized auth controller** that ensures consistent authentication state across the entire application.

### Key Principles

1. **Single Source of Truth** — All auth logic is centralized in `js/auth-controller.js`
2. **Event-Driven** — Components react to `auth:ready` and `auth-state-changed` events
3. **Race-Condition Free** — Pages wait for auth initialization before checking session
4. **User-Initiated Only** — No automatic OAuth triggers on page load
5. **Backend-Verified Roles** — Frontend never decides permissions

---

## Architecture

### Component Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Auth Backend                     │
│           (OAuth, Session Management, Token Refresh)         │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │
┌─────────────────────────────────────────────────────────────┐
│              js/auth-controller.js (Phase 9.2)               │
│  - Initializes Supabase client                               │
│  - Handles OAuth callbacks                                   │
│  - Manages auth state                                        │
│  - Emits auth:ready event                                    │
│  - Single auth state listener                                │
└─────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │   Pages     │ │  Components │ │   Services  │
    │ (await      │ │  (listen to │ │  (use       │
    │ auth:ready) │ │  events)    │ │  API)       │
    └─────────────┘ └─────────────┘ └─────────────┘
```

### File Structure

```
js/
├── utils/
│   └── supabase-wait.js      # Shared wait utility
├── auth-controller.js         # ✅ Central auth controller (Phase 9.2)
├── avatar-utils.js            # OAuth UI helpers (uses AuthController)
├── avatar-popup.js            # Auth UI popup (listens to events)
├── profile-panel.js           # User profile (listens to events)
└── admin-auth.js              # Backend admin verification
```

---

## Core Components

### 1. Supabase Wait Utility (`js/utils/supabase-wait.js`)

**Purpose:** Single shared function to wait for Supabase client initialization

```javascript
window.waitForSupabase(timeout = 10000)
```

**Returns:** `Promise<Object|null>` — Supabase client or null on timeout

**Usage:**
```javascript
const supabase = await window.waitForSupabase();
if (!supabase) {
  console.error('Supabase not available');
  return;
}
```

**Why It Exists:**
- ES modules load asynchronously
- Classic scripts load synchronously
- Need to coordinate timing between them

---

### 2. Auth Controller (`js/auth-controller.js`)

**Purpose:** Central authentication orchestrator

**Responsibilities:**
1. Initialize Supabase client (waits for it to be ready)
2. Restore session on app load
3. Handle OAuth callbacks from URL
4. Clean URL parameters after callback
5. Set up single auth state listener
6. Emit `auth:ready` event when initialized
7. Emit `auth-state-changed` event on changes
8. Provide public API for auth operations

**Initialization Sequence:**
```
1. auth-controller.js loads
2. Waits for window.waitForSupabase() to resolve
3. Handles OAuth callback if present in URL
4. Gets current session
5. Sets up onAuthStateChange listener (SINGLE LISTENER)
6. Emits 'auth:ready' event
7. Updates session on auth changes
```

---

### 3. Auth Events

#### `auth:ready` Event

**When:** Emitted once when auth system is fully initialized

**Payload:**
```javascript
{
  detail: {
    session: Object|null  // Current session or null
  }
}
```

**Usage:**
```javascript
window.addEventListener('auth:ready', (e) => {
  const session = e.detail.session;
  if (session) {
    console.log('User signed in:', session.user.email);
    initializeAuthenticatedFeatures();
  } else {
    console.log('No active session');
    showSignInPrompt();
  }
});
```

#### `auth-state-changed` Event

**When:** Emitted whenever auth state changes (sign in, sign out, token refresh)

**Payload:**
```javascript
{
  detail: {
    event: string,        // 'SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED', etc.
    session: Object|null  // New session or null
  }
}
```

**Usage:**
```javascript
window.addEventListener('auth-state-changed', (e) => {
  console.log('Auth state changed:', e.detail.event);
  updateUIForAuthState(e.detail.session);
});
```

---

## Authentication Flow

### Sign-In Flow

```
┌──────────────┐
│ User clicks  │
│ "Sign in"    │
└──────┬───────┘
       │
       ▼
┌────────────────────────────────┐
│ avatar-utils.js:               │
│ handleSignIn()                 │
│   → AuthController.            │
│     signInWithGoogle()         │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ Redirect to Google OAuth       │
│ User approves                  │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ Redirect back with ?code=...   │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ auth-controller.js:            │
│ handleOAuthCallback()          │
│   → Detects code in URL        │
│   → Supabase exchanges code    │
│   → Session established        │
│   → Clean URL params           │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ onAuthStateChange fires        │
│ 'SIGNED_IN' event              │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ Emit 'auth-state-changed'      │
│ Components update UI           │
└────────────────────────────────┘
```

### Page Load with Existing Session

```
┌──────────────┐
│ Page loads   │
└──────┬───────┘
       │
       ▼
┌────────────────────────────────┐
│ bootstrap.js creates           │
│ window.App                     │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ Supabase SDK loads from CDN    │
└──────┬─────────────────────────┘
       │
       ▼
┌────────────────────────────────┐
│ app.module.js loads (async)    │
│   → supabase.js initializes    │
│   → auth.module.js sets up     │
│   → Dispatches 'app:ready'     │
└──────┬─────────────────────────┘
       │
       ├─────────────────────────┐
       │                         │
       ▼                         ▼
┌────────────────┐      ┌────────────────┐
│ Classic        │      │ auth-          │
│ scripts load   │      │ controller.js  │
│ (common.js,    │      │ initializes    │
│ etc.)          │      └──────┬─────────┘
└────────────────┘             │
                               ▼
                      ┌────────────────────────┐
                      │ Waits for Supabase     │
                      │ Gets session           │
                      │ Emits 'auth:ready'     │
                      └──────┬─────────────────┘
                             │
                             ▼
                      ┌────────────────────────┐
                      │ Pages receive event    │
                      │ Check session          │
                      │ Render appropriate UI  │
                      └────────────────────────┘
```

---

## API Reference

### AuthController Public API

#### `waitForAuthReady()`

Wait for auth system to be fully initialized.

```javascript
const session = await window.AuthController.waitForAuthReady();
if (session) {
  console.log('User:', session.user.email);
}
```

**Returns:** `Promise<Object|null>` — Session or null

---

#### `getSession()`

Get current session synchronously (auth must be ready).

```javascript
const session = window.AuthController.getSession();
if (session) {
  console.log('Current user:', session.user.email);
}
```

**Returns:** `Object|null` — Session or null

---

#### `isAuthenticated()`

Check if user is currently authenticated.

```javascript
if (window.AuthController.isAuthenticated()) {
  console.log('User is signed in');
}
```

**Returns:** `boolean`

---

#### `requireSession()`

**Async** method to require an active session.

```javascript
const session = await window.AuthController.requireSession();
if (!session) {
  console.log('User not signed in');
  showSignInPrompt();
  return;
}
// Continue with authenticated logic
```

**Returns:** `Promise<Object|null>` — Session or null

**Use Case:** Page-level auth guards (upload, settings, etc.)

---

#### `requireRole(allowedRoles)`

**Async** method to require specific user role.

```javascript
const session = await window.AuthController.requireRole(['admin', 'reviewer']);
if (!session) {
  console.log('Access denied - user not admin/reviewer');
  showAccessDenied();
  return;
}
// Continue with admin logic
```

**Parameters:**
- `allowedRoles` (Array<string>) — Array of allowed role names

**Returns:** `Promise<Object|null>` — Session if role matches, null otherwise

**Backend Call:** Calls `get_user_role_name` RPC function

---

#### `signInWithGoogle()`

Initiate OAuth sign-in flow with Google.

```javascript
const result = await window.AuthController.signInWithGoogle();
if (result.error) {
  console.error('Sign in failed:', result.error);
}
```

**Returns:** `Promise<Object>` — `{ data, error }`

**Side Effects:**
- Redirects to Google OAuth
- Returns to `window.location.origin` after approval

---

#### `signOut()`

Sign out current user.

```javascript
await window.AuthController.signOut();
console.log('User signed out');
location.reload(); // Refresh page
```

**Returns:** `Promise<void>`

**Side Effects:**
- Clears session
- Updates global state
- Triggers `auth-state-changed` event

---

### Backward Compatibility

#### `window.AuthContract`

For backward compatibility, `AuthContract` is an alias:

```javascript
window.AuthContract = {
  requireSession: window.AuthController.requireSession,
  requireRole: window.AuthController.requireRole
};
```

Existing code using `AuthContract` will continue to work.

---

## Usage Patterns

### Pattern 1: Auth-Protected Page

**Use Case:** Upload page, settings page, etc.

```javascript
// Show loading state immediately
document.addEventListener("DOMContentLoaded", () => {
  showLoadingState();
});

// Wait for auth to be ready
window.addEventListener("auth:ready", async (e) => {
  const session = e.detail.session;
  
  if (!session) {
    showSignInRequired();
  } else {
    hideLoadingState();
    initializePage();
  }
});
```

### Pattern 2: Role-Protected Page

**Use Case:** Admin dashboard

```javascript
window.addEventListener("auth:ready", async () => {
  const session = await window.AuthController.requireRole(['admin', 'reviewer']);
  
  if (!session) {
    const userSession = window.AuthController.getSession();
    if (!userSession) {
      showSignInPrompt();
    } else {
      showAccessDenied('You need admin permissions');
    }
    return;
  }
  
  initializeAdminDashboard();
});
```

### Pattern 3: UI Component Reacting to Auth Changes

**Use Case:** Avatar popup, profile panel

```javascript
window.addEventListener('auth-state-changed', (e) => {
  const session = e.detail.session;
  updateUIForAuthState(session);
});
```

### Pattern 4: Checking Auth in Existing Code

**Use Case:** Legacy code or specific checks

```javascript
async function doSomething() {
  const session = await window.AuthController.requireSession();
  if (!session) {
    console.log('Not authenticated');
    return;
  }
  
  // Do authenticated work
}
```

---

## Debugging Guide

### Common Issues

#### Issue 1: "AuthController not available"

**Symptom:** `window.AuthController is undefined`

**Causes:**
1. `auth-controller.js` not loaded
2. Script running before auth-controller.js loads

**Solution:**
```html
<!-- Ensure correct load order -->
<script src="js/utils/supabase-wait.js"></script>
<script src="js/auth-controller.js"></script>
<script src="js/your-page.js"></script>
```

---

#### Issue 2: "Settings shows sign in required when signed in"

**Symptom:** User is signed in but page shows "Sign in required"

**Cause:** Page checking auth before `auth:ready` event

**Solution:**
```javascript
// ❌ WRONG - Runs immediately
document.addEventListener("DOMContentLoaded", async () => {
  const session = await requireSession(); // May not be ready yet
});

// ✅ CORRECT - Wait for auth:ready
window.addEventListener("auth:ready", async (e) => {
  const session = e.detail.session;
});
```

---

#### Issue 3: "flow_state_not_found" OAuth Error

**Symptom:** OAuth redirect shows error with `error_code=flow_state_not_found`

**Causes:**
1. Redirect URL mismatch in Supabase dashboard
2. Browser cookies/localStorage blocked
3. User navigated during OAuth flow

**Solution:**
1. Check Supabase dashboard → Authentication → URL Configuration
2. Ensure redirect URL matches: `https://yourdomain.com` (no trailing path)
3. User will see error notification, can retry

**Auto-Handled:** auth-controller.js shows user-friendly error message

---

#### Issue 4: Multiple Auth Listeners

**Symptom:** Auth change handlers fire multiple times

**Cause:** Multiple files calling `supabase.auth.onAuthStateChange()`

**Solution:** Only auth-controller.js should have a listener. Others use events:

```javascript
// ❌ WRONG - Creates duplicate listener
supabase.auth.onAuthStateChange(() => {
  updateUI();
});

// ✅ CORRECT - Listen to centralized event
window.addEventListener('auth-state-changed', () => {
  updateUI();
});
```

---

### Debugging Tools

#### Enable Verbose Logging

```javascript
// In browser console
localStorage.setItem('DEBUG_AUTH', 'true');
location.reload();
```

#### Check Auth State

```javascript
// Current session
console.log(window.AuthController.getSession());

// Is authenticated?
console.log(window.AuthController.isAuthenticated());

// Supabase client
console.log(window.__supabase__);
```

#### Monitor Events

```javascript
window.addEventListener('auth:ready', (e) => {
  console.log('auth:ready', e.detail);
});

window.addEventListener('auth-state-changed', (e) => {
  console.log('auth-state-changed', e.detail);
});
```

---

## Security Model

### Trust Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                      UNTRUSTED                               │
│                    Frontend Code                             │
│  - Never decides permissions                                 │
│  - Never stores sensitive data                               │
│  - Only displays what backend allows                         │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │ JWT Token
                            │
┌─────────────────────────────────────────────────────────────┐
│                      TRUSTED                                 │
│               Supabase Auth + Backend                        │
│  - Verifies identity (OAuth)                                 │
│  - Issues JWT tokens                                         │
│  - Enforces RLS policies                                     │
│  - Validates roles via RPC                                   │
└─────────────────────────────────────────────────────────────┘
```

### Security Principles

1. **Frontend Never Decides Permissions**
   - All authorization happens in backend RLS policies
   - Frontend only checks if user is signed in
   - Role checks call backend RPC functions

2. **JWT Token is Authority**
   - Stored in httpOnly cookie (Supabase manages)
   - Automatically included in all Supabase requests
   - Backend validates on every request

3. **No Secrets in Frontend**
   - Only public Supabase anon key in code
   - No admin keys, no private keys
   - No hardcoded credentials

4. **Role-Based Access Control (RBAC)**
   - Roles stored in `user_roles` table
   - Backend functions verify roles
   - RLS policies enforce access

### Secure Patterns

#### ✅ CORRECT: Backend-Verified Role Check

```javascript
const session = await window.AuthController.requireRole(['admin']);
if (!session) {
  // Backend said no - trust it
  showAccessDenied();
  return;
}
```

#### ❌ WRONG: Frontend-Only Role Check

```javascript
// Never do this!
if (user.email.endsWith('@admin.com')) {
  showAdminPanel(); // Attacker can bypass
}
```

---

## Future Improvements

**Planned for Post-Phase 9.2:**

1. **Multi-Provider Support** — Add GitHub, email/password auth
2. **Session Persistence Options** — Remember me checkbox
3. **2FA Support** — Optional two-factor authentication
4. **Token Refresh Handling** — Better UX for expired tokens
5. **Offline Support** — Graceful degradation when offline

---

## Support

**For Issues:**
1. Check [Debugging Guide](#debugging-guide)
2. Review [REPO_HEALTH_CHECK.md](./REPO_HEALTH_CHECK.md)
3. Check Supabase Auth logs in dashboard
4. Open GitHub issue with full error logs

**Key Files:**
- `js/auth-controller.js` — Main auth logic
- `js/utils/supabase-wait.js` — Timing utility
- `js/supabase.js` — Supabase initialization
- `docs/ARCHITECTURE_MASTER_PLAN.md` — Overall architecture
