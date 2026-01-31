# Admin System Guide

**Version**: 8.3 (Backend-First Architecture)  
**Date**: 2026-01-31  
**Status**: ✅ Production Ready

---

## Overview

ExamArchive uses a **backend-first admin system** where the database is the ONLY source of truth for roles and permissions. The frontend NEVER decides admin access.

---

## Core Principles

1. **Backend is Authority**: All admin checks go through backend functions
2. **Frontend is Display**: UI shows what backend says, never decides
3. **No Timing Dependencies**: No reliance on `role:ready` events for security
4. **Explicit Verification**: Every admin action requires backend confirmation

---

## Architecture

### Database Tables

#### `roles` Table
```sql
- id (uuid, primary key)
- name (text, unique) → 'visitor', 'user', 'reviewer', 'admin'
- level (int) → 0, 10, 50, 100
- description (text)
- created_at (timestamptz)
```

#### `user_roles` Table
```sql
- user_id (uuid, references auth.users)
- role_id (uuid, references roles)
- assigned_by (uuid, references auth.users)
- assigned_at (timestamptz)
- PRIMARY KEY (user_id, role_id)
```

### Backend Functions

#### `is_admin(user_id uuid) → boolean`
- Returns true if user has role level ≥ 100
- Used for all admin access checks
- Cannot be bypassed by frontend

#### `is_current_user_admin() → boolean`
- Convenience wrapper for current session user
- Calls `is_admin(auth.uid())`

#### `get_user_role_name(user_id uuid) → text`
- Returns user's primary role name
- Defaults to 'user' if logged in, 'visitor' if not

#### `get_user_role_level(user_id uuid) → int`
- Returns user's highest role level
- Returns 0 for visitors

#### `assign_role(target_user_id uuid, role_name text) → json`
- Admin-only function to assign roles
- Removes existing roles (one primary role per user)
- Returns success/error status

---

## Frontend Integration

### Admin Dashboard Access

**File**: `admin/dashboard/dashboard.js`

```javascript
import { isCurrentUserAdmin } from "../../js/admin-auth.js";

// Check admin access (backend-verified)
const hasAdminAccess = await isCurrentUserAdmin();

if (!hasAdminAccess) {
  // Show access denied
  return;
}

// Load dashboard
```

### Badge Display

**File**: `js/roles.js`

```javascript
import { getUserBadge } from "./roles.js";

// Get badge from backend
const badgeInfo = await getUserBadge();
// Returns: { role, badge, icon, color, level }
```

### Role Assignment (Admin Only)

```javascript
import { assignRole } from "./admin-auth.js";

const result = await assignRole(targetUserId, 'admin');
if (result.success) {
  console.log('Role assigned:', result.role);
}
```

---

## Security Model

### What Frontend CAN Do
- Display badges from backend
- Show UI elements based on backend role
- Request admin verification

### What Frontend CANNOT Do
- Decide admin status
- Bypass backend checks
- Assign roles directly
- Trust cached role state for security

---

## Migration from Phase 8.2

### Deprecated Functions (Backward Compatible)
- `normalizeRole()` → Use `getUserBadge()` instead
- `getUserProfile()` → Use `getUserRoleBackend()` instead
- `waitForRole()` → No longer needed
- `initializeGlobalRoleState()` → Removed

### Breaking Changes
- `window.__APP_ROLE__` global state removed
- `role:ready` event no longer used for security
- Admin dashboard no longer waits for frontend role initialization

---

## Troubleshooting

### Admin Dashboard Shows "Access Denied"

**Cause**: User does not have admin role in backend

**Solution**: 
1. Check user's role: `SELECT * FROM user_roles WHERE user_id = 'xxx'`
2. Assign admin role: `SELECT assign_role('user-id', 'admin')`

### Badge Shows Wrong Role

**Cause**: Backend role not properly assigned

**Solution**:
1. Verify role assignment: `SELECT get_user_role_name('user-id')`
2. Check user_roles table for correct mapping

### "is_admin is not a function" Error

**Cause**: SQL migration not applied

**Solution**:
1. Run `admin/sql/05_roles_system.sql` in Supabase SQL Editor
2. Verify functions exist: `SELECT proname FROM pg_proc WHERE proname LIKE '%admin%'`

---

## Future Enhancements (Phase 9+)

- Multi-role support (e.g., user can be both reviewer and moderator)
- Role-based permissions matrix
- Audit log for role changes
- Admin re-authentication for sensitive actions

---

**Last Updated**: 2026-01-31  
**Next Review**: Phase 9 Implementation
