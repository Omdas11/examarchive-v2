# JavaScript Execution Model - Phase 9.2.3

**Last Updated:** 2026-02-02  
**Status:** ✅ Active Architecture

---

## 🎯 Core Principle

**Only ONE file uses ES modules (`type="module"`). All other JavaScript files are classic scripts.**

This architecture prevents module isolation crashes and ensures deterministic execution order.

---

## 📐 Architecture Overview

### Single Module Entry Point

```
js/app.module.js  ← ONLY ES MODULE FILE
├── imports js/modules/auth.module.js
├── imports js/modules/debug.module.js
└── exposes functionality via window globals
```

**All other JavaScript files are classic scripts with NO imports/exports.**

---

## 🗂️ File Organization

### ES Modules (js/modules/)
These files use ES module syntax and are ONLY imported by `app.module.js`:

- **`js/app.module.js`** - Single entry point, loads all modules
- **`js/modules/auth.module.js`** - Authentication initialization
- **`js/modules/debug.module.js`** - Debug logger and panel
- **`js/supabase.js`** - Supabase client (imported by modules)

### Classic Scripts (js/)
These files use NO imports/exports and expose functionality via `window`:

**Core Infrastructure:**
- `js/bootstrap.js` - Error handling and global flags
- `js/common.js` - Partials loader, theme, auth UI sync
- `js/theme.js` - Theme management

**Auth & User:**
- `js/avatar.js` - Avatar UI bindings
- `js/avatar-utils.js` → `window.AvatarUtils`
- `js/avatar-popup.js` - Avatar popup controller
- `js/profile-panel.js` - Profile panel controller
- `js/admin-auth.js` → `window.AdminAuth`
- `js/roles.js` → `window.Roles`

**Page-Specific:**
- `js/upload.js` - Upload page logic
- `js/upload-handler.js` → `window.UploadHandler`
- `js/settings.js` - Settings page logic
- `js/browse.js` - Browse page logic
- `js/paper.js` - Paper detail page logic
- `js/home-search.js` - Home search functionality
- `js/notices-calendar.js` - Notices calendar

---

## 🔄 Execution Flow

### 1. Bootstrap Phase
```html
<script src="js/bootstrap.js"></script>
```
- Sets `window.__APP_BOOTED__ = true`
- Installs global error handlers
- Makes errors visible (no silent failures)

### 2. Supabase SDK Load
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.93.3"></script>
```
- Loads Supabase client library
- Available as `window.supabase`

### 3. Module Entry Point
```html
<script type="module" src="js/app.module.js"></script>
```
- **ONLY file with `type="module"`**
- Initializes auth (sets `window.__SESSION__`)
- Initializes debug (exposes `window.Debug`)
- Sets `window.__AUTH_READY__ = true`

### 4. Classic Scripts Load
```html
<script src="js/common.js"></script>
<script src="js/avatar-utils.js"></script>
<script src="js/roles.js"></script>
<script src="js/admin-auth.js"></script>
<!-- ... more scripts ... -->
```
- Load in dependency order
- Use `window` globals for cross-script communication
- Wait for `window.__AUTH_READY__` before using auth

---

## 🔐 Authentication System

### Session Management

**Initialization (in app.module.js):**
```javascript
await initAuth();  // Sets window.__SESSION__
```

**Checking Auth (in any classic script):**
```javascript
if (window.__SESSION__) {
  // User is authenticated
  const user = window.__SESSION__.user;
}
```

**Waiting for Auth Ready:**
```javascript
function waitForAuth() {
  return new Promise((resolve) => {
    if (window.__AUTH_READY__) {
      resolve();
      return;
    }
    const checkInterval = setInterval(() => {
      if (window.__AUTH_READY__) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 50);
  });
}

await waitForAuth();
// Auth is now ready
```

### Auth State Changes

Modules emit events that classic scripts can listen to:

```javascript
window.addEventListener('auth-state-changed', (e) => {
  const session = e.detail.session;
  // Update UI based on new session
});
```

---

## 🐛 Debug System

### Initialization
Debug system is initialized in `app.module.js` and exposed via `window.Debug`.

### Usage in Classic Scripts
```javascript
// Check if debug is available
if (window.Debug) {
  window.Debug.logInfo('module-name', 'Message', { data: 'optional' });
  window.Debug.logWarn('module-name', 'Warning message');
  window.Debug.logError('module-name', 'Error message');
}
```

### Debug Modules
```javascript
const DebugModule = window.Debug.DebugModule;
// DebugModule.AUTH, DebugModule.UPLOAD, DebugModule.ADMIN, etc.
```

### Debug Panel
```javascript
window.Debug.showPanel();   // Show debug panel
window.Debug.hidePanel();   // Hide debug panel
window.Debug.togglePanel(); // Toggle debug panel
window.Debug.clear();       // Clear debug logs
```

---

## 🔧 Window Globals Reference

### Auth & Session
- `window.__SESSION__` - Current auth session (or null)
- `window.__AUTH_READY__` - Boolean, true when auth is initialized
- `window.__supabase__` - Supabase client instance
- `window.requireAuth(options)` - Function to check/enforce auth

### Debug
- `window.Debug.logInfo(module, message, data)`
- `window.Debug.logWarn(module, message, data)`
- `window.Debug.logError(module, message, data)`
- `window.Debug.DebugModule` - Debug module constants
- `window.Debug.DebugLevel` - Debug level constants

### Utilities
- `window.AvatarUtils` - Avatar rendering utilities
- `window.Roles` - Role checking functions
- `window.AdminAuth` - Admin authentication functions
- `window.UploadHandler` - Upload handling functions

### App State
- `window.__APP_BOOTED__` - Boolean, true when bootstrap is complete

---

## 📋 How to Add New JavaScript

### For Reusable Modules (Classic)

1. Create file in `js/` (e.g., `js/my-feature.js`)
2. Wrap in namespace:
   ```javascript
   // js/my-feature.js
   // Phase 9.2.3 - Classic JS (NO IMPORTS)
   
   window.MyFeature = {
     init: function() {
       // Your code
     },
     
     doSomething: function(param) {
       // Use window globals
       const supabase = window.__supabase__;
       if (window.Debug) {
         window.Debug.logInfo('my-feature', 'Doing something');
       }
       // ...
     }
   };
   ```
3. Add to HTML files:
   ```html
   <script src="js/my-feature.js"></script>
   ```

### For ES Modules (Rare)

**⚠️ ONLY do this if absolutely necessary!**

1. Create file in `js/modules/` (e.g., `js/modules/my-module.js`)
2. Import in `js/app.module.js`:
   ```javascript
   import { initMyModule } from './modules/my-module.js';
   await initMyModule();
   ```
3. Expose functionality via `window`:
   ```javascript
   // In my-module.js
   export function initMyModule() {
     window.MyModule = {
       // Exposed functions
     };
   }
   ```

---

## 🚨 Common Pitfalls & Solutions

### ❌ "Cannot use import statement outside a module"

**Cause:** File uses `import` but is loaded as classic script.

**Fix:** Convert to classic JS:
```javascript
// BEFORE
import { something } from './other.js';

// AFTER
// Access via window global
const something = window.SomeModule.something;
```

### ❌ "Uncaught ReferenceError: supabase is not defined"

**Cause:** Trying to use `supabase` directly in classic script.

**Fix:** Use `window.__supabase__`:
```javascript
const supabase = window.__supabase__;
```

### ❌ Session appears as undefined

**Cause:** Trying to access session before auth module initializes.

**Fix:** Wait for auth ready:
```javascript
await waitForAuth();
const session = window.__SESSION__;
```

### ❌ Debug functions not available

**Cause:** Trying to use debug before module initializes.

**Fix:** Check availability:
```javascript
if (window.Debug) {
  window.Debug.logInfo('module', 'message');
}
```

---

## 📱 Mobile-Safe Debugging

### Console Visibility
All errors are visible via:
1. Browser console (desktop)
2. Alert popups (mobile - critical errors)
3. Debug panel (when enabled)

### Debug Panel Access
- Automatically shown when `DEBUG_FORCE_ENABLE = true`
- Toggle visibility: Triple-tap header (mobile) or keyboard shortcut (desktop)
- Persists across page loads via localStorage

### Remote Debugging
For mobile testing:
1. Enable debug panel
2. Check logs in panel
3. Use desktop Chrome DevTools with USB debugging

---

## 🔒 Security Considerations

### No Dynamic Imports
Dynamic imports (`import()`) are **NOT allowed** in classic scripts. They create async module loading issues.

### XSS Protection
- All user content is sanitized before rendering
- Debug panel HTML-escapes all log messages
- Avatar URLs are validated before use

### Session Security
- Session stored in `window.__SESSION__` (memory only)
- Cleared on logout
- Auto-refreshed by Supabase

---

## 📚 Related Documentation

- [DEBUG_SYSTEM_GUIDE.md](./DEBUG_SYSTEM_GUIDE.md) - Complete debug system documentation
- [ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md) - Overall app architecture
- [BOOTSTRAP_DEBUG.md](./BOOTSTRAP_DEBUG.md) - Bootstrap and error handling
- [ROLE_SYSTEM.md](./ROLE_SYSTEM.md) - User roles and permissions

---

## 🎓 Key Takeaways

1. **Only `js/app.module.js` uses `type="module"`**
2. **All other scripts are classic (no imports/exports)**
3. **Use `window` globals for cross-script communication**
4. **Wait for `window.__AUTH_READY__` before using auth**
5. **Check `window.Debug` exists before using debug functions**
6. **Never add dynamic imports to classic scripts**

---

**For Questions or Issues:**  
See existing code examples in `js/` directory or consult architecture documentation.
