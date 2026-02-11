# Role Management Documentation

## Overview

ExamArchive uses a role-based access control system with four levels of access. Roles are stored in the `user_roles` database table and verified server-side for all sensitive operations.

---

## Available Roles

### visitor
- **Level:** 0
- **Description:** Anonymous or unauthenticated users
- **Permissions:** Browse public content only

### user
- **Level:** 1  
- **Description:** Standard authenticated user (default for new signups)
- **Permissions:** Upload papers, view own submissions, access settings

### reviewer
- **Level:** 2
- **Description:** Trusted community member who helps moderate content
- **Permissions:** All user permissions + approve/reject submissions (limited scope)

### admin
- **Level:** 3
- **Description:** Full system administrator
- **Permissions:** All permissions including admin dashboard, user management, and system settings

---

## Role Permissions Matrix

| Role     | Upload | Approve | Access Settings | Admin Dashboard |
|----------|--------|---------|-----------------|-----------------|
| visitor  | ❌     | ❌      | ❌              | ❌              |
| user     | ✅     | ❌      | ✅              | ❌              |
| reviewer | ✅     | ✅      | ✅              | ❌              |
| admin    | ✅     | ✅      | ✅              | ✅              |

---

## Manual Role Promotion

### Prerequisites
- Direct access to the Supabase dashboard
- Admin privileges on the Supabase project

### Promotion via SQL (Recommended)

1. Open Supabase Dashboard → SQL Editor
2. Run the following query to promote a user:

```sql
INSERT INTO user_roles (user_id, role)
VALUES ('USER_UUID_HERE', 'admin')
ON CONFLICT (user_id)
DO UPDATE SET role = 'admin';
```

**Replace `USER_UUID_HERE` with the actual user UUID from auth.users table**

### Example: Promote to Reviewer

```sql
INSERT INTO user_roles (user_id, role)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'reviewer')
ON CONFLICT (user_id)
DO UPDATE SET role = 'reviewer';
```

### Finding User UUID

To find a user's UUID by email:

```sql
SELECT id, email FROM auth.users WHERE email = 'user@example.com';
```

---

## Role Verification

### Backend Verification (Secure)

All role checks must go through backend verification:

```javascript
// Using RoleUtils (Phase 1.2)
const role = await window.RoleUtils.getCurrentUserRole();
const isAdmin = role === "admin";

// Using AdminAuth (existing)
const roleInfo = await window.AdminAuth.getUserRoleBackend(userId);
const isAdmin = roleInfo.name === "admin";
```

### Frontend Display Only

Frontend role display is for UI purposes only and MUST NOT be used for access control:

```javascript
// For badge display only - DO NOT use for permissions
const badgeInfo = await window.Roles.getUserBadge();
```

---

## Database Schema

### user_roles Table

```sql
CREATE TABLE user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('visitor', 'user', 'reviewer', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Row Level Security (RLS)

- **Read Access:** All authenticated users can read their own role
- **Write Access:** Only via RPC functions that verify admin status
- **Insert/Update:** Restricted to backend functions with admin checks

---

## Security Best Practices

### ✅ DO

- Always verify roles server-side using RPC functions
- Use `getCurrentUserRole()` for reliable role checking
- Check roles before rendering sensitive UI sections
- Log all role changes for audit purposes

### ❌ DON'T

- Never trust frontend role state for access control
- Don't cache roles indefinitely - re-fetch when needed
- Don't hardcode admin user IDs in frontend code
- Don't expose role management UI to non-admins

---

## Troubleshooting

### User has no role after signup

**Issue:** New users don't appear in `user_roles` table

**Solution:** Default role insertion should happen via trigger or during signup. If missing, manually insert:

```sql
INSERT INTO user_roles (user_id, role)
VALUES ('USER_UUID', 'user');
```

### Role changes not reflecting immediately

**Issue:** UI still shows old role after promotion

**Solution:** Role checks cache the session but not the role. Have user:
1. Sign out completely
2. Sign back in
3. Role will be fetched fresh from database

### Upload fails despite being admin

**Issue:** Storage RLS policy doesn't recognize admin role

**Solution:** Storage policies use `auth.role()` which returns 'authenticated', not user_roles. Ensure policy is:

```sql
-- Correct policy for uploads-temp bucket
(bucket_id = 'uploads-temp') AND auth.role() = 'authenticated'
```

---

## Related Documentation

- [AUTH_SYSTEM.md](./AUTH_SYSTEM.md) - Authentication flow and session management
- [UPLOAD_SYSTEM.md](./UPLOAD_SYSTEM.md) - Upload pipeline and storage
- [ADMIN_SYSTEM.md](./ADMIN_SYSTEM.md) - Admin dashboard and approval flow
- [DATA_ARCHITECTURE.md](./DATA_ARCHITECTURE.md) - Database schema reference

---

## Change Log

- **Phase 1.2** (2024-02-11): Initial role management documentation created
  - Added manual promotion guide
  - Added role verification best practices
  - Added troubleshooting section
