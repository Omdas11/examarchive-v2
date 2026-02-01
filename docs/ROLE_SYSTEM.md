# ROLE SYSTEM

**Phase 9.2 — Complete Role & Permission Documentation**

This document explains the role hierarchy, how roles are assigned and verified, why `auth.uid()` differs from manual UUID checks, and how to safely promote users.

---

## 🏗️ Role Architecture

### Core Principle

> **Backend is the ONLY authority for roles. Frontend displays are cosmetic only.**

The role system enforces a clear hierarchy where higher-level roles inherit permissions from lower levels.

---

## 📊 Role Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│                    ROLE HIERARCHY                       │
└─────────────────────────────────────────────────────────┘

Level 3: admin      ← Full system access
           │
           ├─ Can approve/reject submissions
           ├─ Can delete any content
           ├─ Can assign roles
           └─ Can access debug panel

Level 2: reviewer   ← Review permissions
           │
           ├─ Can approve/reject submissions
           ├─ Can view pending queue
           └─ Can access debug panel

Level 1: user       ← Basic authenticated access
           │
           ├─ Can upload papers
           ├─ Can view own submissions
           └─ Can update profile

Level 0: visitor    ← Unauthenticated / default
           │
           ├─ Can browse papers
           ├─ Can search
           └─ Can view public content
```

---

## 🎭 Role Details

### Visitor (Level 0)

**Description**: Unauthenticated users or users without assigned roles

**Permissions**:
- ✅ Browse public papers
- ✅ Search papers
- ✅ View public profiles
- ❌ Upload papers
- ❌ Access dashboard
- ❌ View submissions

**Database Check**:
```sql
-- No record in user_roles table
SELECT * FROM user_roles WHERE user_id = auth.uid();
-- Returns no rows
```

**Frontend Badge**: "👤 Visitor" (Gray)

---

### User (Level 1)

**Description**: Authenticated users with basic permissions

**Permissions**:
- ✅ All visitor permissions, plus:
- ✅ Upload papers
- ✅ View own submissions
- ✅ Edit own profile
- ✅ Save preferences
- ❌ Review submissions
- ❌ Access admin dashboard
- ❌ Access debug panel

**Database Check**:
```sql
SELECT role_name, role_level 
FROM user_roles 
WHERE user_id = auth.uid()
AND role_name = 'user';
```

**Frontend Badge**: "📝 Contributor" (Green)

**Auto-Assignment**: Users get this role automatically on first sign-in

---

### Reviewer (Level 2)

**Description**: Trusted users who can review submissions

**Permissions**:
- ✅ All user permissions, plus:
- ✅ Access admin dashboard
- ✅ View pending submissions queue
- ✅ Approve submissions
- ✅ Reject submissions
- ✅ Access debug panel
- ❌ Delete submissions
- ❌ Assign roles
- ❌ Manage users

**Database Check**:
```sql
SELECT role_name, role_level 
FROM user_roles 
WHERE user_id = auth.uid()
AND role_name = 'reviewer';
```

**Frontend Badge**: "🛡️ Moderator" (Blue)

**Assignment**: Manually assigned by admin

---

### Admin (Level 3)

**Description**: Full system access, highest authority

**Permissions**:
- ✅ All reviewer permissions, plus:
- ✅ Delete any submission
- ✅ Assign/remove roles
- ✅ Manage users
- ✅ Access debug panel
- ✅ Reset demo data
- ✅ View all system logs

**Database Check**:
```sql
SELECT role_name, role_level 
FROM user_roles 
WHERE user_id = auth.uid()
AND role_name = 'admin';
```

**Frontend Badge**: "👑 Admin" (Red)

**Assignment**: Manually assigned by another admin or via SQL

---

## 🔐 Permission Enforcement

### Row Level Security (RLS)

All permissions are enforced by PostgreSQL RLS policies. Frontend checks are only for UI display.

#### Example: Upload Permission

```sql
-- Storage policy: uploads-temp bucket
CREATE POLICY "Authenticated uploads only"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'uploads-temp' 
  AND auth.uid() IS NOT NULL
);
```

**What this means**:
- Only authenticated users can upload
- Frontend cannot bypass this
- Even if frontend allows upload button, backend will reject if not authenticated

#### Example: View Own Submissions

```sql
-- Database policy: submissions table
CREATE POLICY "Users see only own submissions"
ON submissions FOR SELECT
USING (auth.uid() = user_id);
```

**What this means**:
- Users can only see their own submissions
- Admin/reviewer role checks happen via backend functions (not RLS)
- Frontend cannot query other users' submissions

---

## 🔍 Role Verification

### Backend Functions (CORRECT WAY)

#### Check if user is admin

```javascript
import { isCurrentUserAdmin } from './admin-auth.js';

const isAdmin = await isCurrentUserAdmin();
if (isAdmin) {
  // Show admin controls
}
```

**Backend Function**:
```sql
CREATE OR REPLACE FUNCTION is_current_user_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role_name = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Get user's role

```javascript
import { getUserRoleBackend } from './admin-auth.js';

const roleInfo = await getUserRoleBackend(userId);
console.log(roleInfo.name); // 'admin', 'reviewer', 'user', or 'visitor'
console.log(roleInfo.level); // 3, 2, 1, or 0
```

**Backend Function**:
```sql
CREATE OR REPLACE FUNCTION get_user_role_name(user_id_param uuid)
RETURNS text AS $$
BEGIN
  RETURN COALESCE(
    (SELECT role_name FROM user_roles WHERE user_id = user_id_param),
    'visitor'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### ❌ WRONG: Frontend-Only Checks

**DON'T DO THIS**:
```javascript
// ❌ Can be bypassed!
const isAdmin = localStorage.getItem('isAdmin') === 'true';

// ❌ Can be manipulated!
window.userRole = 'admin';

// ❌ Not secure!
if (user.email.includes('admin')) {
  showAdminPanel();
}
```

**Why it's wrong**:
- Users can modify localStorage
- Users can edit JavaScript variables
- Users can craft API requests directly
- Frontend is NEVER secure

---

## 🆔 auth.uid() vs Manual UUID

### What is auth.uid()?

`auth.uid()` is a PostgreSQL function provided by Supabase that returns the user ID from the current JWT token.

```sql
SELECT auth.uid();
-- Returns: '123e4567-e89b-12d3-a456-426614174000' (if signed in)
-- Returns: NULL (if not signed in)
```

### Why Not Use Manual UUID Checks?

**Manual approach (❌ WRONG)**:
```sql
-- Hardcoded UUID
WHERE user_id = '123e4567-e89b-12d3-a456-426614174000'
```

**Problems**:
1. **Not dynamic**: Works only for one user
2. **Security risk**: Anyone knowing the UUID can access data
3. **No session verification**: Doesn't check if user is signed in
4. **Bypasses auth**: Ignores JWT token

**Correct approach (✅ RIGHT)**:
```sql
-- Uses authenticated session
WHERE user_id = auth.uid()
```

**Benefits**:
1. **Dynamic**: Works for whoever is signed in
2. **Secure**: Verified against JWT token
3. **Session-aware**: Returns NULL if not signed in
4. **Cannot be bypassed**: Backend verifies token

---

### SQL Editor vs Browser Session

**Important**: SQL editor in Supabase Dashboard runs with **elevated privileges**, not as the signed-in user.

#### Example: Why this confuses people

**In Browser (as signed-in user)**:
```javascript
// This works because user is signed in
const { data } = await supabase
  .from('submissions')
  .select('*')
  .eq('user_id', session.user.id);
// RLS policy allows this
```

**In SQL Editor (as admin)**:
```sql
-- This bypasses RLS!
SELECT * FROM submissions WHERE user_id = auth.uid();
-- Returns NULL because SQL editor is not the user's session
```

**Solution**: Always test queries in the actual app (browser), not SQL editor.

---

## 🎯 Role Assignment

### How Users Get Roles

#### 1. Automatic (First Sign-In)

When a user signs up:

1. Supabase Auth creates user account
2. Trigger function `get_or_create_profile()` runs
3. Profile created in `profiles` table
4. Default role 'user' assigned in `user_roles` table

**Code** (automatic):
```sql
-- Trigger on profiles INSERT
CREATE TRIGGER on_profile_created
AFTER INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION assign_default_role();

-- Function assigns 'user' role
CREATE FUNCTION assign_default_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_roles (user_id, role_name, role_level)
  VALUES (NEW.id, 'user', 1);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### 2. Manual (Admin Assignment)

Admin can promote users:

**Via Admin Panel** (future feature):
```javascript
import { assignRole } from './admin-auth.js';

await assignRole(targetUserId, 'reviewer');
```

**Via SQL** (current method):
```sql
-- Promote user to reviewer
UPDATE user_roles
SET role_name = 'reviewer', role_level = 2
WHERE user_id = '<user-uuid>';

-- Promote user to admin
UPDATE user_roles
SET role_name = 'admin', role_level = 3
WHERE user_id = '<user-uuid>';
```

---

### Safe Role Promotion

#### Step 1: Identify User

```sql
-- Find user by email
SELECT id, email FROM auth.users WHERE email = 'user@example.com';
```

#### Step 2: Verify Current Role

```sql
-- Check current role
SELECT * FROM user_roles WHERE user_id = '<user-id>';
```

#### Step 3: Update Role

```sql
-- Promote to reviewer
UPDATE user_roles
SET role_name = 'reviewer', role_level = 2, updated_at = NOW()
WHERE user_id = '<user-id>';

-- OR promote to admin
UPDATE user_roles
SET role_name = 'admin', role_level = 3, updated_at = NOW()
WHERE user_id = '<user-id>';
```

#### Step 4: Verify Update

```sql
-- Confirm role change
SELECT * FROM user_roles WHERE user_id = '<user-id>';
```

#### Step 5: User Signs Out & Back In

**Important**: Changes may not take effect immediately. User should:
1. Sign out of the app
2. Sign back in
3. Role will be updated in their session

---

## 🔒 Security Best Practices

### DO ✅

1. **Always use backend functions** for role checks
2. **Use auth.uid()** in RLS policies, never hardcoded UUIDs
3. **Test with multiple roles** before deploying
4. **Log role changes** for audit trail
5. **Require re-authentication** after role changes

### DON'T ❌

1. **Never trust frontend role checks** for security
2. **Never hardcode user IDs** in policies
3. **Never bypass RLS** "for convenience"
4. **Never store role in localStorage** (use backend)
5. **Never test only in SQL editor** (test in browser)

---

## 🧪 Testing Roles

### Test Checklist

#### As Visitor (Not Signed In)

- [ ] Cannot access upload page
- [ ] Cannot see submissions
- [ ] Cannot access admin dashboard
- [ ] Cannot see debug panel

#### As User (Level 1)

- [ ] Can upload papers
- [ ] Can see own submissions
- [ ] Cannot see admin dashboard
- [ ] Cannot approve/reject submissions
- [ ] Cannot see debug panel

#### As Reviewer (Level 2)

- [ ] Can do everything user can
- [ ] Can access admin dashboard
- [ ] Can approve submissions
- [ ] Can reject submissions
- [ ] Can see debug panel
- [ ] Cannot delete submissions
- [ ] Cannot assign roles

#### As Admin (Level 3)

- [ ] Can do everything reviewer can
- [ ] Can delete any submission
- [ ] Can assign/remove roles
- [ ] Can reset demo data
- [ ] Can see debug panel

---

## 📊 Role Data Structure

### Database Table: user_roles

```sql
CREATE TABLE user_roles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role_name text NOT NULL,
  role_level integer NOT NULL,
  assigned_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  assigned_by uuid REFERENCES auth.users(id),
  UNIQUE(user_id)
);
```

### Fields Explained

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Links to auth.users |
| `role_name` | TEXT | 'visitor', 'user', 'reviewer', 'admin' |
| `role_level` | INTEGER | 0, 1, 2, or 3 |
| `assigned_at` | TIMESTAMP | When role first assigned |
| `updated_at` | TIMESTAMP | Last role change |
| `assigned_by` | UUID | Who assigned this role (admin) |

---

## 🎨 Frontend Display (Badges)

### Badge Mapping

```javascript
// js/roles.js
export function mapRoleToBadge(role) {
  switch (role) {
    case 'admin':     return 'Admin';
    case 'reviewer':  return 'Moderator';
    case 'user':      return 'Contributor';
    case 'visitor':   return 'Visitor';
    default:          return 'Visitor';
  }
}
```

### Badge Colors

| Role | Badge Name | Color | Icon |
|------|------------|-------|------|
| admin | Admin | Red (#f44336) | 👑 |
| reviewer | Moderator | Blue (#2196F3) | 🛡️ |
| user | Contributor | Green (#4CAF50) | 📝 |
| visitor | Visitor | Gray (#9E9E9E) | 👤 |

**Remember**: Badges are display only! Backend determines actual permissions.

---

## 🔮 Future Enhancements

### Planned Features

1. **Role Management UI**
   - Admin panel for assigning roles
   - Bulk role changes
   - Role history/audit log

2. **Custom Roles**
   - Define custom roles with specific permissions
   - Permission-based access control (PBAC)
   - Role templates

3. **Temporary Roles**
   - Time-limited role assignments
   - Auto-revoke after expiration
   - Notification system

4. **Role Groups**
   - Organize users into groups
   - Group-based permissions
   - Nested groups

---

## 📚 Related Documentation

- [ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md) - System architecture
- [FILE_MAP.md](./FILE_MAP.md) - File reference
- [UPLOAD_FLOW.md](./UPLOAD_FLOW.md) - Upload process
- [DEBUG_SYSTEM_GUIDE.md](./DEBUG_SYSTEM_GUIDE.md) - Debug tools

---

## 📋 Quick Reference

### Check User Role

```javascript
import { getUserRoleBackend } from './admin-auth.js';

const roleInfo = await getUserRoleBackend();
console.log(roleInfo.name);  // 'admin', 'reviewer', 'user', 'visitor'
console.log(roleInfo.level); // 3, 2, 1, 0
```

### Check if Admin

```javascript
import { isCurrentUserAdmin } from './admin-auth.js';

if (await isCurrentUserAdmin()) {
  // User is admin
}
```

### Promote User (SQL)

```sql
-- To reviewer
UPDATE user_roles SET role_name = 'reviewer', role_level = 2 WHERE user_id = '<id>';

-- To admin
UPDATE user_roles SET role_name = 'admin', role_level = 3 WHERE user_id = '<id>';
```

---

**Last Updated**: Phase 9.2  
**Role System Version**: v1.0
