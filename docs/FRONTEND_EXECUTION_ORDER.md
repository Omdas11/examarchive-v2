# Frontend Execution Order

**Phase 9.2.4 — Bootstrap Architecture & Execution Flow**

---

## Overview

This document explains the **frontend execution order** and how the application initializes in a safe, predictable way. Understanding this flow is critical for maintaining stability and avoiding race conditions.

---

## 🎯 Core Principles

1. **Single Bootstrap Authority** — Only `bootstrap.js` sets `window.__APP_BOOTED__` and `window.App`
2. **Single Session Source** — Only `supabase.js` calls `getSession()`
3. **Event-Driven Initialization** — UI components wait for `app:ready` event
4. **Guarded Globals** — Global variables use guards to prevent duplication

---

## 📋 Execution Flow

### Step 1: Bootstrap (`js/bootstrap.js`)

**Runs:** FIRST, before any other script

**Purpose:** 
- Set global execution flag (`window.__APP_BOOTED__`)
- Create global `window.App` object
- Install global error handlers

**Code:**
```javascript
window.App = {
  ready: false,
  supabase: null,
  session: null
};
```

**No other script may run before this.**

---

### Step 2: Supabase SDK (CDN)

**Runs:** After bootstrap

**Purpose:** Load the Supabase JavaScript SDK from CDN

**Source:** `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.93.3`

---

### Step 3: Supabase Initialization (`js/supabase.js`)

**Runs:** After Supabase SDK is loaded (via `js/app.module.js`)

**Purpose:**
- Create Supabase client
- Initialize session (ONLY PLACE that calls `getSession()`)
- Dispatch `app:ready` event when session is initialized

**Code:**
```javascript
if (!window.App) throw new Error('Bootstrap missing');

window.App.supabase = supabase;

supabase.auth.getSession().then(({ data }) => {
  window.App.session = data.session;
  window.App.ready = true;
  
  document.dispatchEvent(new Event('app:ready'));
});
```

**Critical:** This is the ONLY file that calls `getSession()`. All other files must use `window.App.session`.

---

### Step 4: Auth Module (`js/modules/auth.module.js`)

**Runs:** After supabase.js initializes

**Purpose:**
- Set up auth state change listener
- Sync `window.__SESSION__` for backward compatibility
- Dispatch `auth-state-changed` events

**Does NOT call `getSession()`** — uses session from `window.App.session`

---

### Step 5: Classic Scripts (Common, UI Components)

**Runs:** After auth module

**Purpose:**
- Load partials (header, footer, avatar popup, profile panel)
- Apply theme settings
- Set up UI event listeners

**Important:** These scripts should NOT access Supabase or session data until `app:ready` fires.

---

### Step 6: `app:ready` Event

**Dispatched:** When `window.App.ready = true` in `supabase.js`

**Purpose:** Signal that Supabase and session are ready for use

**Who listens:**
- `profile-panel.js` — Sets up auth state listener
- `avatar-popup.js` — Sets up auth state listener
- `settings.js` — Initializes settings page
- Any other script that needs auth/session data

---

## 🛡️ Global Variable Guards

To prevent duplicate execution and race conditions, global variables are guarded:

### Example: Profile Panel
```javascript
if (window.__PROFILE_PANEL_INIT__) {
  console.warn('[profile-panel] Already initialized, skipping');
} else {
  window.__PROFILE_PANEL_INIT__ = true;
}
```

### Example: Avatar Popup
```javascript
if (window.__AVATAR_POPUP_INIT__) {
  console.warn('[avatar-popup] Already initialized, skipping');
} else {
  window.__AVATAR_POPUP_INIT__ = true;
}
```

**Why:** Prevents header/avatar/profile scripts from racing each other or executing multiple times.

---

## 🔑 Correct Script Order in HTML

Every HTML file MUST follow this exact order:

```html
<!-- ⚡ BOOTSTRAP (MUST BE FIRST) -->
<script src="js/bootstrap.js"></script>

<!-- Supabase SDK -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.93.3"></script>

<!-- ⚡ SUPABASE INITIALIZATION (Phase 9.2.4) -->
<script type="module" src="js/app.module.js"></script>

<!-- Classic Scripts (NO type="module") -->
<script src="js/common.js"></script>
<script src="js/avatar-utils.js"></script>
<script src="js/roles.js"></script>
<script src="js/admin-auth.js"></script>
<script src="js/profile-panel.js"></script>
<script src="js/avatar-popup.js"></script>
<!-- Page-specific scripts -->
<script src="js/theme.js"></script>
```

**Rules:**
- ❌ NO additional `type="module"` scripts
- ❌ NO script imports outside `js/modules/`
- ❌ NO duplicate script tags
- ✅ ALWAYS maintain this exact order

---

## 🚀 How to Safely Add New JS Files

### Option 1: Event-Driven (Recommended)

If your script needs auth or session data:

```javascript
document.addEventListener('app:ready', () => {
  const supabase = window.App.supabase;
  const session = window.App.session;
  
  if (!session) {
    console.log('User not logged in');
    return;
  }
  
  // Your initialization code here
  initMyFeature();
});
```

### Option 2: Classic Script (No Auth Needed)

If your script doesn't need auth or session:

```javascript
console.log('[MY-SCRIPT] Loaded');

function myFunction() {
  // Your code here
}

// Run on DOMContentLoaded if needed
document.addEventListener('DOMContentLoaded', () => {
  myFunction();
});
```

---

## ⚠️ Common Mistakes to Avoid

### ❌ DON'T: Call getSession() Multiple Times
```javascript
// WRONG - only supabase.js should call this
const { data } = await supabase.auth.getSession();
```

### ✅ DO: Use window.App.session
```javascript
// CORRECT - use the session from global state
const session = window.App.session;
```

---

### ❌ DON'T: Access Supabase Before app:ready
```javascript
// WRONG - supabase might not be initialized yet
const supabase = window.App.supabase;
supabase.auth.onAuthStateChange(...);
```

### ✅ DO: Wait for app:ready
```javascript
// CORRECT - wait for initialization
document.addEventListener('app:ready', () => {
  const supabase = window.App.supabase;
  supabase.auth.onAuthStateChange(...);
});
```

---

### ❌ DON'T: Create Duplicate Global Variables
```javascript
// WRONG - creates race condition
let headerLoaded = false;
let headerLoaded = false; // Duplicate!
```

### ✅ DO: Use Global Guards
```javascript
// CORRECT - prevents duplication
if (window.__MY_SCRIPT_INIT__) {
  console.warn('Already initialized');
} else {
  window.__MY_SCRIPT_INIT__ = true;
}
```

---

## 🔍 Debugging Tips

### Check Bootstrap Status
```javascript
console.log('Bootstrap:', window.__APP_BOOTED__);
console.log('App object:', window.App);
```

### Check Session Status
```javascript
console.log('Session ready:', window.App.ready);
console.log('Current session:', window.App.session);
```

### Check Event Dispatch
```javascript
document.addEventListener('app:ready', () => {
  console.log('[DEBUG] app:ready event fired');
});
```

---

## 📦 File Dependency Map

```
bootstrap.js (sets window.App)
    ↓
Supabase SDK (loads from CDN)
    ↓
app.module.js (type="module" entry point)
    ↓
supabase.js (initializes client, dispatches app:ready)
    ↓
auth.module.js (sets up listeners)
    ↓
common.js (loads partials, applies theme)
    ↓
[Other classic scripts load in parallel]
    ↓
app:ready event fires
    ↓
[UI components initialize with auth state]
```

---

## 🎓 Summary

**Remember these key points:**

1. **Bootstrap → Supabase → app:ready → UI** is the flow
2. **Only supabase.js calls getSession()**
3. **Use app:ready event for auth-dependent code**
4. **Guard globals to prevent duplication**
5. **Follow the exact script order in HTML**

Following this architecture ensures a stable, predictable frontend with no race conditions or undefined errors.

---

**Last Updated:** Phase 9.2.4 (February 2026)
