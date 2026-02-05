# Auth Contract — Phase 9.2.5

## 🎯 Purpose

This document defines the **single source of truth** for authentication in ExamArchive v2. 

All auth decisions must go through `js/auth.js` and use Supabase session as the only authority.

---

## ✅ Core Principles

### 1. Supabase Session is the ONLY Source of Truth

- **NO** global auth state variables (`window.App.session`, `window.__SESSION__`, `window.__APP_ROLE__`)
- **NO** frontend role caching or inference
- **NO** waiting on `window.__AUTH_READY__` flags

Every page must explicitly call `requireSession()` or `requireRole()` to check auth status.

### 2. Auth Logic Lives in ONE Place

**File:** `js/auth.js`

This is the **only** file allowed to:
- Call `supabase.auth.getSession()`
- Call `supabase.rpc('get_user_role_name')`
- Make auth/role decisions

### 3. Pages Are Explicit

Each page that needs auth must:
1. Import auth functions: `const { requireSession, requireRole } = window.AuthContract;`
2. Explicitly check auth on load
3. Handle "not authenticated" case with appropriate UI

---

## 🔧 API Reference

### `requireSession()`

**Purpose:** Check if user has an active Supabase session

**Returns:** `Promise<Object|null>`
- `Object` (session) if authenticated
- `null` if not authenticated or error

**Example:**
```javascript
const { requireSession } = window.AuthContract;
const session = await requireSession();

if (!session) {
  renderSignInRequired();
  return;
}

// User is authenticated
unlockFeatures();
```

### `requireRole(allowedRoles)`

**Purpose:** Check if user has one of the required roles

**Parameters:**
- `allowedRoles` - Array of role names (e.g., `['admin', 'reviewer']`)

**Returns:** `Promise<Object|null>`
- `Object` (session) if authenticated AND has required role
- `null` if not authenticated, no role, or insufficient permissions

**Example:**
```javascript
const { requireRole } = window.AuthContract;
const session = await requireRole(['admin', 'reviewer']);

if (!session) {
  renderAccessDenied();
  return;
}

// User has admin or reviewer role
renderDashboard();
```

---

## 📄 Page-Level Implementation

### Upload Page (`js/upload.js`)

```javascript
document.addEventListener("DOMContentLoaded", async () => {
  const { requireSession } = window.AuthContract;
  const session = await requireSession();
  
  if (!session) {
    renderSignInRequired();
    return;
  }
  
  unlockUploadUI();
});
```

### Settings Page (`js/settings.js`)

```javascript
async function renderSettings() {
  const { requireSession } = window.AuthContract;
  const session = await requireSession();
  
  if (!session) {
    renderSignInCard();
    return;
  }
  
  renderSettings(session.user);
}
```

### Admin Dashboard (`admin/dashboard.js`)

```javascript
document.addEventListener("DOMContentLoaded", async () => {
  const { requireRole } = window.AuthContract;
  const session = await requireRole(['admin', 'reviewer']);
  
  if (!session) {
    renderAccessDenied();
    return;
  }
  
  renderDashboard();
});
```

### Login Flow (Avatar Popup)

Login is **NOT** a separate page - it's handled via the avatar popup which triggers Supabase OAuth:

```javascript
// Avatar popup triggers sign-in
async function handleSignIn() {
  const supabase = window.__supabase__;
  
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin
    }
  });
}
```

The avatar popup is global and available on all pages. When a user clicks "Sign in", it:
1. Opens the avatar popup (via avatar trigger button)
2. Shows "Sign in with Google" button
3. Triggers Supabase OAuth flow
4. Redirects back to current page after authentication

---

## 🚫 What Was Removed

### Deprecated Global State

❌ **Removed:**
- `window.App.session`
- `window.__SESSION__`
- `window.__APP_ROLE__`
- `window.__AUTH_READY__`
- `waitForAuth()` function
- `waitForRole()` function

### Cleaned Files

**`common.js`** now ONLY handles:
- Theme application
- Header/footer loading
- Mobile menu toggle
- Partial loading

**Removed from `common.js`:**
- All Supabase imports
- Session checking logic
- Role verification
- Auth redirects
- `requireAuth()` function
- `syncAuthToUI()` function

---

## 🔐 Why This Prevents Desync

### Problem: Multiple Sources of Truth

Previously, auth state was duplicated across:
- `window.App.session` (set by `supabase.js`)
- `window.__SESSION__` (set by `auth.module.js`)
- `window.__APP_ROLE__` (cached frontend role)
- `waitForRole()` (frontend role inference)

**Result:** Pages could read stale/conflicting auth state

### Solution: Single Authority

Now:
1. **Only** `js/auth.js` calls Supabase
2. **Every** page explicitly awaits fresh session
3. **No** global state to get out of sync
4. **Backend** is always the role authority

**Result:** Impossible to have stale auth state

---

## 🧪 Testing Auth Flows

### Test 1: Sign In → Upload Unlocks
1. Open `/upload.html` (not signed in)
2. See "Sign in required" message
3. Click "Sign in" button
4. Complete GitHub OAuth
5. Return to `/upload.html`
6. Upload form should be visible

### Test 2: Sign In → Settings Loads
1. Open `/settings.html` (not signed in)
2. See "Sign in required" card
3. Sign in via avatar popup
4. Settings page should load content

### Test 3: Avatar Popup Sign In
1. Open any page (not signed in)
2. Click avatar trigger button in header
3. Avatar popup should open showing "Sign in with Google"
4. Click sign in button
5. Complete Google OAuth
6. Should return to same page, now authenticated
7. Avatar popup should now show user profile with sign out option

### Test 4: Admin Access
1. Sign in as admin user
2. Navigate to `/admin/dashboard.html`
3. Dashboard should load
4. Sign in as non-admin
5. Should see "Access Denied" message

### Test 5: Page Refresh Preserves Auth
1. Sign in
2. Navigate to `/upload.html`
3. Refresh page (F5)
4. Upload form should remain accessible
5. Should NOT see "Sign in required"

---

## 🔄 Migration Notes

### For Developers

If you have code that uses:
- `window.App.session` → Use `await requireSession()` instead
- `window.__SESSION__` → Use `await requireSession()` instead
- `window.requireAuth()` → Use `await requireSession()` instead
- `waitForRole()` → Use `await requireRole([...])` instead

### For Future Features

All new features MUST:
1. Use `requireSession()` or `requireRole()` from `window.AuthContract`
2. NOT create global auth state variables
3. NOT cache role/session information
4. NOT use frontend role inference

---

## 📝 Summary

| Aspect | Old (Phase 9.2.3) | New (Phase 9.2.5) |
|--------|------------------|------------------|
| **Session Source** | Multiple globals | `requireSession()` only |
| **Role Source** | Frontend cached | Backend RPC only |
| **Auth Check** | `window.__SESSION__` | `await requireSession()` |
| **Role Check** | `window.__APP_ROLE__` | `await requireRole([...])` |
| **common.js** | Auth + UI | UI only |
| **Login Flow** | Separate page | Avatar popup with OAuth |

---

## 🚀 Benefits

1. **No desync** - Single source of truth eliminates conflicting state
2. **Explicit** - Every page declares its auth requirements upfront
3. **Backend authority** - Roles are never inferred on frontend
4. **Simple** - One file (`auth.js`) handles all auth logic
5. **Testable** - Clear contract makes testing straightforward

---

**Last Updated:** Phase 9.2.5  
**Maintainers:** ExamArchive Team
