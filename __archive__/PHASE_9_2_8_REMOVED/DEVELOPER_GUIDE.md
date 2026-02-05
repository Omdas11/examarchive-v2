# Developer Guide

> Derived from [Architecture Master Plan](ARCHITECTURE_MASTER_PLAN.md)

## Architecture Overview

ExamArchive v2 is a static frontend application. See [Architecture Master Plan - Section 1](ARCHITECTURE_MASTER_PLAN.md#1-system-overview) for details.

Key principles:
- No build step required
- Plain HTML/CSS/JavaScript
- Supabase for all backend services
- Frontend never makes security decisions

## Script Loading Order

Scripts MUST load in this order (see [Section 2.1](ARCHITECTURE_MASTER_PLAN.md#21-page-load-sequence)):

```html
<!-- 1. Bootstrap (MUST BE FIRST) -->
<script src="js/bootstrap.js"></script>

<!-- 2. Supabase SDK (CDN) -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- 3. App Module Entry -->
<script type="module" src="js/app.module.js"></script>

<!-- 4. Classic Scripts -->
<script src="js/theme.js"></script>
<script src="js/common.js"></script>
<!-- Page-specific scripts -->
```

## Adding New Pages

1. Create HTML file with standard script loading order
2. Add page-specific script in `/js/`
3. Update navigation in `/partials/header.html`

Example page structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Page Title | ExamArchive</title>
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
  <div id="header"></div>
  
  <main>
    <!-- Page content -->
  </main>
  
  <div id="footer"></div>
  <div id="avatar-portal"></div>
  <div id="profile-panel-portal"></div>
  
  <!-- Scripts -->
  <script src="js/bootstrap.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script type="module" src="js/app.module.js"></script>
  <script src="js/theme.js"></script>
  <script src="js/common.js"></script>
  <script src="js/admin-auth.js"></script>
  <script src="js/auth.js"></script>
  <script src="js/roles.js"></script>
  <script src="js/avatar-utils.js"></script>
  <script src="js/avatar-popup.js"></script>
  <script src="js/profile-panel.js"></script>
  <script src="js/your-page.js"></script>
</body>
</html>
```

## Authentication

Use `AuthContract` for all auth checks (see [Section 3](ARCHITECTURE_MASTER_PLAN.md#3-authentication-model)):

```javascript
// Check if user is logged in
const session = await window.AuthContract.requireSession();
if (!session) {
  // Handle unauthenticated user
  return;
}

// Check if user has specific role
const adminSession = await window.AuthContract.requireRole(['admin', 'reviewer']);
if (!adminSession) {
  // Handle unauthorized user
  return;
}
```

## Role Checks

Use `AdminAuth` for role verification (see [Section 4](ARCHITECTURE_MASTER_PLAN.md#4-authorization-model)):

```javascript
// Check admin status
const isAdmin = await window.AdminAuth.isCurrentUserAdmin();

// Get user role
const roleInfo = await window.AdminAuth.getUserRoleBackend(userId);
console.log(roleInfo.name);  // 'admin', 'reviewer', 'user', 'visitor'
console.log(roleInfo.level); // 100, 50, 10, 0
```

## Storage Operations

Use `SupabaseClient` for file operations (see [Section 5](ARCHITECTURE_MASTER_PLAN.md#5-storage-model)):

```javascript
// Upload file
const result = await window.SupabaseClient.uploadFile(file, {
  bucket: window.SupabaseClient.BUCKETS.TEMP,
  path: `${userId}/${timestamp}-${filename}`,
  onProgress: (percent) => console.log(`${percent}% uploaded`)
});

// Get public URL
const url = window.SupabaseClient.getPublicUrl(path);

// Move file between buckets
await window.SupabaseClient.moveFile(
  BUCKETS.TEMP, tempPath,
  BUCKETS.PUBLIC, publicPath
);
```

## Debug Logging

Use `window.Debug` for logging (see [Section 6](ARCHITECTURE_MASTER_PLAN.md#6-debug-philosophy)):

```javascript
// Log messages
window.Debug.logInfo('module-name', 'Operation completed', { data: value });
window.Debug.logWarn('module-name', 'Something unexpected', { warning: msg });
window.Debug.logError('module-name', 'Operation failed', { error: err });

// Available modules
const { DebugModule } = window.Debug;
// AUTH, UPLOAD, ADMIN, STORAGE, ROLE, SETTINGS, SYSTEM
```

## Code Style

- No semicolons required (but consistent usage within files)
- Use `const` and `let`, not `var`
- Prefer `async/await` over `.then()` chains
- Use descriptive function names
- Add comments for complex logic

## Error Handling

1. Always wrap async operations in try/catch
2. Log errors with `window.Debug.logError`
3. Show user-friendly messages (not technical errors)
4. Never let errors crash the page

```javascript
async function myOperation() {
  try {
    const result = await riskyOperation();
    return result;
  } catch (err) {
    window.Debug.logError('module', 'Operation failed', { error: err.message });
    showUserMessage('Something went wrong. Please try again.');
    return null;
  }
}
```

## Testing

Manual testing workflow:
1. Test in Chrome, Firefox, Safari
2. Test mobile viewport
3. Test with/without authentication
4. Test with different user roles

---

*Reference: [Architecture Master Plan](ARCHITECTURE_MASTER_PLAN.md)*
