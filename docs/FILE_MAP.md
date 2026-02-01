# FILE MAP

**Phase 9.2 — Complete File Reference for ExamArchive**

This document explains the purpose of every important file in the repository, what it controls, what can be safely edited, and what must NOT be edited.

---

## 📁 Repository Structure

```
examarchive-v2/
├── admin/              # Admin dashboard and SQL setup
├── ai/                 # Future AI automation
├── assets/             # Images, icons, static files
├── css/                # Stylesheets
├── docs/               # Documentation (this file)
├── js/                 # JavaScript modules
│   ├── debug/          # Debug system
│   └── ...             # Core modules
├── partials/           # Reusable HTML components
├── scripts/            # Build/utility scripts
├── *.html              # Page files
└── admin/sql/          # Database setup scripts
```

---

## 🔑 Critical Files (DO NOT EDIT Without Understanding)

### `js/supabase.js`

**Purpose**: Creates the **ONE AND ONLY** Supabase client instance

**What it controls**:
- Supabase connection configuration
- Auth persistence settings
- Auto token refresh
- PKCE flow configuration

**Edit Safety**:
- ⚠️ **CRITICAL**: Do not create multiple clients
- ⚠️ Only edit if you need to change Supabase URL/key
- ⚠️ Do not modify auth configuration unless you understand implications

**What NOT to edit**:
- The `persistSession: true` setting
- The `autoRefreshToken: true` setting
- The `flowType: "pkce"` setting

```javascript
// THIS IS THE ONLY SUPABASE CLIENT IN THE ENTIRE APP
export const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,      // REQUIRED for login persistence
      autoRefreshToken: true,    // REQUIRED for security
      detectSessionInUrl: true,  // REQUIRED for OAuth
      flowType: "pkce"          // REQUIRED for security
    }
  }
);
```

---

### `js/common.js`

**Purpose**: Global bootstrap - loads partials, applies theme, manages auth state

**What it controls**:
- Header/footer loading
- Theme application
- Auth UI synchronization
- Debug system initialization
- Avatar display

**Edit Safety**:
- ✅ Safe to add new global utilities
- ⚠️ Be careful with auth sync logic
- ⚠️ Don't break partial loading

**What NOT to edit**:
- Auth state change listener
- Session cleanup logic
- Partial loading order

**Common Tasks**:
- Add new global event listeners: ✅ Safe
- Modify theme loading: ⚠️ Test thoroughly
- Change auth sync: ❌ Dangerous

---

### `admin/sql/*.sql`

**Purpose**: Database schema, RLS policies, and security functions

**Files**:
1. `01_profiles_table.sql` - User profiles
2. `02_submissions_table.sql` - Upload tracking
3. `03_storage_buckets.sql` - File storage setup
4. `04_storage_policies.sql` - Storage RLS
5. `05_roles_system.sql` - Role management

**Edit Safety**:
- ❌ **DO NOT EDIT** unless you are adding features that require database changes
- ⚠️ Always test in a development database first
- ⚠️ Understand RLS implications before modifying policies
- ✅ Safe to add new functions (but test thoroughly)

**What NOT to edit**:
- Existing RLS policies without understanding them
- `auth.uid()` checks (critical for security)
- Storage bucket public/private settings

**Critical Security Rules**:
```sql
-- This protects user data - DO NOT REMOVE
CREATE POLICY "Users see only own submissions"
ON submissions FOR SELECT
USING (auth.uid() = user_id);

-- This protects uploads - DO NOT WEAKEN
CREATE POLICY "Authenticated uploads only"
ON storage.objects FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
```

---

## 🎨 Frontend Files

### HTML Pages

#### `index.html`
**Purpose**: Home page with search
**Edit Safety**: ✅ Safe to edit content
**Avoid**: Breaking search functionality

#### `upload.html`
**Purpose**: Upload page for question papers
**Edit Safety**: ✅ Safe to edit UI/layout
**Avoid**: Changing form field names/structure

#### `settings.html`
**Purpose**: User settings and preferences
**Edit Safety**: ✅ Safe to add new settings sections
**Avoid**: Breaking existing settings logic

#### `admin/dashboard.html`
**Purpose**: Admin review interface
**Edit Safety**: ⚠️ Edit carefully - admin-only
**Avoid**: Breaking review workflow

---

### JavaScript Modules

#### `js/upload-handler.js`

**Purpose**: Handles file uploads and submission creation

**What it controls**:
- File validation (PDF, size)
- Upload to Supabase Storage
- Submission record creation
- Error handling and user messages

**Edit Safety**:
- ✅ Safe to improve error messages
- ✅ Safe to add progress tracking enhancements
- ⚠️ Be careful with session verification logic
- ❌ DO NOT remove session check before upload

**Critical Section**:
```javascript
// CRITICAL: Always wait for session before uploading
const { data: { session }, error: sessionError } = await supabase.auth.getSession();

if (!session) {
  throw new Error('You must be signed in to upload');
}
```

**Common Tasks**:
- Improve error messages: ✅ Safe
- Add file type validation: ✅ Safe
- Change upload logic: ⚠️ Test thoroughly
- Remove session check: ❌ Security risk

---

#### `js/supabase-client.js`

**Purpose**: Helper functions for Supabase Storage operations

**What it controls**:
- File upload with progress
- File movement between buckets
- File deletion
- URL generation

**Edit Safety**:
- ✅ Safe to add new helper functions
- ⚠️ Be careful modifying existing functions (used everywhere)

**What NOT to edit**:
- Bucket name constants (BUCKETS.TEMP, BUCKETS.PUBLIC, etc.)
- Error handling in critical functions

---

#### `js/auth.js`

**Purpose**: Legacy auth checker (mostly replaced by common.js)

**Edit Safety**: ⚠️ Consider deprecated, avoid editing

**Better Alternative**: Use `requireAuth()` from `common.js`

---

#### `js/admin-auth.js`

**Purpose**: Backend-verified admin checks

**What it controls**:
- `isAdminBackend()` - Check if user is admin
- `isCurrentUserAdmin()` - Check current session
- `getUserRoleBackend()` - Get user's role
- `assignRole()` - Admin-only role assignment

**Edit Safety**:
- ✅ Safe to add new role-related functions
- ❌ DO NOT modify existing functions (security critical)

**Critical Functions**:
```javascript
// ONLY way to check admin status - uses backend
export async function isCurrentUserAdmin() {
  const { data } = await supabase.rpc('is_current_user_admin');
  return data === true;
}
```

**What NOT to edit**:
- Function names (used throughout codebase)
- RPC call logic
- Error handling defaults

---

#### `js/roles.js`

**Purpose**: Role display and badge system

**What it controls**:
- Badge name mapping
- Badge colors/icons
- Role normalization

**Edit Safety**:
- ✅ Safe to modify badge appearance
- ✅ Safe to add new role mappings
- ⚠️ Be careful with role hierarchy

**Note**: This is DISPLAY ONLY. Backend is source of truth.

---

#### `js/settings.js`

**Purpose**: Settings page controller

**What it controls**:
- Theme settings
- Accessibility options
- Admin debug controls
- Font customization

**Edit Safety**:
- ✅ Safe to add new settings
- ✅ Safe to reorganize settings
- ⚠️ Test localStorage interactions

**Common Tasks**:
- Add new theme: ✅ Safe
- Add new toggle: ✅ Safe
- Modify existing setting behavior: ⚠️ Test thoroughly

---

### Debug System (Phase 9.2)

#### `js/debug/logger.js`

**Purpose**: Structured logging system for diagnostics

**What it controls**:
- Log storage (in-memory)
- Log levels (INFO, WARN, ERROR)
- Module categorization
- Access control (admin/reviewer only)

**Edit Safety**:
- ✅ Safe to add new debug modules
- ✅ Safe to modify log formatting
- ⚠️ Don't break admin access check

**Usage**:
```javascript
import { logInfo, logError, DebugModule } from './debug/logger.js';

logInfo(DebugModule.UPLOAD, 'File upload started');
logError(DebugModule.AUTH, 'Session expired');
```

**Common Tasks**:
- Add new debug module: ✅ Safe
- Change log format: ✅ Safe
- Modify access control: ⚠️ Security consideration

---

#### `js/debug/panel.js`

**Purpose**: Visual debug panel for admin/reviewer

**What it controls**:
- Panel visibility
- Log rendering
- Filtering controls
- Mobile layout

**Edit Safety**:
- ✅ Safe to modify UI/styling
- ✅ Safe to add features
- ⚠️ Keep mobile-friendly

**Common Tasks**:
- Style changes: ✅ Safe
- Add filter options: ✅ Safe
- Change visibility logic: ⚠️ Test with roles

---

## 🎨 Style Files

### CSS Structure

**Global**:
- `css/common.css` - Base styles, variables
- `css/header.css` - Navigation styling
- `css/footer.css` - Footer styling

**Page-Specific**:
- `css/upload.css` - Upload page
- `css/settings.css` - Settings page
- `css/admin-dashboard.css` - Admin panel

**Edit Safety**: ✅ Generally safe to edit CSS
**Best Practice**: Use CSS variables for colors/spacing

---

## 📦 Admin Dashboard

### `admin/dashboard.js`

**Purpose**: Admin review interface logic

**What it controls**:
- Submission loading
- Approve/reject workflows
- File operations (move/delete)
- Real-time updates

**Edit Safety**:
- ✅ Safe to improve UI
- ⚠️ Be careful with file operations
- ❌ DO NOT bypass admin checks

**Critical Section**:
```javascript
// Wait for role verification - DO NOT REMOVE
const roleState = await waitForRole();
const hasAdminAccess = roleState.status === 'admin';

if (!hasAdminAccess) {
  // Deny access
  return;
}
```

**Common Tasks**:
- Improve submission display: ✅ Safe
- Add filtering options: ✅ Safe
- Modify approval logic: ⚠️ Test thoroughly
- Remove role check: ❌ Security risk

---

### `admin/dashboard.html`

**Purpose**: Admin dashboard HTML structure

**Edit Safety**:
- ✅ Safe to modify layout/styling
- ⚠️ Keep data attributes intact (used by JS)

---

## 🔧 Utility Files

### `js/avatar-utils.js`

**Purpose**: Avatar and auth utilities

**What it controls**:
- Logout handling
- Avatar generation
- Auth helpers

**Edit Safety**: ✅ Safe to add utilities

---

### `js/theme.js`

**Purpose**: Theme switching logic

**Edit Safety**: ✅ Safe to modify
**Note**: Mostly legacy, newer themes use CSS variables

---

## 🚫 Files to Avoid Editing

### Build/Generated Files

- `node_modules/` - Dependencies (auto-generated)
- `.git/` - Version control
- `package-lock.json` - Dependency lock (auto-generated)

### Sensitive Files

- `.github/agents/` - GitHub Copilot agent configs
- `.gitignore` - Git exclusions (be very careful)

---

## ✅ Safe to Edit

### Content Files

- `README.md` - Project documentation
- `docs/*.md` - All documentation
- `CHANGES_SUMMARY.md` - Change log
- `about.html` - About page content
- `privacy.html` - Privacy policy
- `terms.html` - Terms of service

### Asset Files

- `assets/` - Images, logos, icons (all safe)
- `css/` - Styling (safe, just test)

---

## 📋 Edit Safety Quick Reference

| File/Directory | Edit Safety | Notes |
|---------------|-------------|-------|
| `js/supabase.js` | ❌ Critical | ONE client only |
| `js/common.js` | ⚠️ Careful | Global auth logic |
| `js/upload-handler.js` | ⚠️ Careful | Session verification critical |
| `js/admin-auth.js` | ❌ Critical | Security functions |
| `admin/sql/*.sql` | ❌ Critical | RLS policies |
| `js/settings.js` | ✅ Safe | Add settings freely |
| `js/debug/` | ✅ Safe | Debug system |
| `css/` | ✅ Safe | Just test changes |
| `docs/` | ✅ Safe | Documentation |
| `*.html` (pages) | ✅ Safe | Content/layout |

---

## 🎯 Common Tasks & Where to Edit

### Task: Add new setting
**Files**: `js/settings.js`
**Safety**: ✅ Safe
**Steps**: Add to `settingsConfig` array, add handler in `attachEventListeners()`

### Task: Change upload validation
**Files**: `js/upload-handler.js`
**Safety**: ⚠️ Careful
**Steps**: Modify validation logic in `handlePaperUpload()`, test thoroughly

### Task: Update theme colors
**Files**: `css/common.css` (CSS variables)
**Safety**: ✅ Safe
**Steps**: Modify `:root` variables, test in light/dark modes

### Task: Add admin feature
**Files**: `admin/dashboard.js`, `admin/dashboard.html`, possibly `admin/sql/*.sql`
**Safety**: ⚠️ Careful
**Steps**: 
1. Add backend functions/policies if needed
2. Add UI in HTML
3. Add logic in JS
4. Test with admin and non-admin accounts

### Task: Fix security issue
**Files**: Varies - usually `admin/sql/*.sql` or `js/*-auth.js`
**Safety**: ❌ Critical
**Steps**: 
1. Understand the vulnerability
2. Plan the fix (backend first)
3. Test in development
4. Deploy with caution

### Task: Improve error messages
**Files**: `js/upload-handler.js`, `js/admin-auth.js`, etc.
**Safety**: ✅ Safe
**Steps**: Modify error message strings, test all error cases

---

## 🐛 Debugging Guide

**See also**: [DEBUG_SYSTEM_GUIDE.md](./DEBUG_SYSTEM_GUIDE.md)

### Where to add debug logs

```javascript
// In any module
import { logInfo, logError, DebugModule } from './debug/logger.js';

// Add contextual logging
logInfo(DebugModule.UPLOAD, 'Starting upload', { filename });
logError(DebugModule.AUTH, 'Session expired', { error });
```

### Where NOT to add logs

- Performance-critical loops
- High-frequency functions (e.g., scroll handlers)
- Inside CSS or HTML files (use JS)

---

## 📚 Related Documentation

- [ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md) - System architecture
- [UPLOAD_FLOW.md](./UPLOAD_FLOW.md) - Upload process
- [DEBUG_SYSTEM_GUIDE.md](./DEBUG_SYSTEM_GUIDE.md) - Debug tools
- [ROLE_SYSTEM.md](./ROLE_SYSTEM.md) - Role management

---

**Last Updated**: Phase 9.2  
**Maintainer**: Keep this up to date when adding new files or changing file purposes
