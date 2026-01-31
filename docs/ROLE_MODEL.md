# Role Model

**Version**: 8.3  
**Date**: 2026-01-31

---

## Overview

ExamArchive uses a hierarchical role system where roles are assigned based on trust level and responsibilities. Each role has a numeric level that determines access permissions.

---

## Role Hierarchy

| Role | Level | Badge | Description |
|------|-------|-------|-------------|
| **visitor** | 0 | Visitor | Guest user without account |
| **user** | 10 | Contributor | Logged-in user with basic permissions |
| **reviewer** | 50 | Moderator | Can review and approve submissions |
| **admin** | 100 | Admin | Full administrative access |

### Future Roles (Phase 7+)
- **moderator** (Level 60): Community content moderator
- **ai_reviewer** (Level 40): AI-assisted review role
- **curator** (Level 70): Content curator and organizer

---

## Role Definitions

### Visitor (Level 0)
**Who**: Anyone without an account

**Permissions**:
- Browse public papers
- View syllabus
- Read notes
- No upload capability

**Badge**: 👤 Visitor

---

### User (Level 10)
**Who**: Registered users with email verification

**Permissions**:
- All visitor permissions
- Upload papers (pending review)
- Create notes (pending review)
- Report issues

**Badge**: 📝 Contributor

**Assignment**: Automatic on signup

---

### Reviewer (Level 50)
**Who**: Trusted community members

**Permissions**:
- All user permissions
- Review submissions
- Approve/reject papers
- Moderate comments
- Flag inappropriate content

**Badge**: 🛡️ Moderator

**Assignment**: By admin only

---

### Admin (Level 100)
**Who**: System administrators

**Permissions**:
- All reviewer permissions
- Assign roles to users
- Manage all content
- Access admin dashboard
- Delete content
- Configure system settings

**Badge**: 👑 Admin

**Assignment**: By admin only or SQL

---

## Role Assignment

### Automatic Assignment
- New signups → `user` role (Level 10)
- Triggered by `handle_new_user_role()` function

### Manual Assignment (Admin Only)
```javascript
import { assignRole } from "./admin-auth.js";

// Assign reviewer role
await assignRole(userId, 'reviewer');

// Assign admin role
await assignRole(userId, 'admin');
```

### SQL Assignment (Direct)
```sql
-- Assign admin role
SELECT assign_role(
  'user-id-here'::uuid,
  'admin'
);
```

---

## Role Rules

### One Primary Role Per User
- Each user has ONE primary role
- Assigning a new role replaces the old one
- Future: Multi-role support (Phase 9+)

### Role Hierarchy Enforcement
- Higher level roles inherit lower level permissions
- Level determines access order: 100 > 50 > 10 > 0

### Assignment Authority
- Only admins (Level ≥ 100) can assign roles
- Self-assignment is not allowed
- Assignment is logged (assigned_by, assigned_at)

---

## Badge System

### Badge Display (Frontend Only)

Badges are **display-only** visual indicators. They do not control access.

#### 3 Badge Slots
1. **Slot 1**: Primary role badge (VISITOR/USER/ADMIN/REVIEWER)
2. **Slot 2**: Empty (future: achievements, activity level)
3. **Slot 3**: Empty (future: certifications, special roles)

#### Badge Mapping
```javascript
// Backend provides role → Frontend displays badge
visitor → "👤 Visitor"
user → "📝 Contributor"
reviewer → "🛡️ Moderator"
admin → "👑 Admin"
```

#### Badge Colors
```javascript
visitor: #9E9E9E (gray)
user: #4CAF50 (green)
reviewer: #2196F3 (blue)
admin: #f44336 (red)
```

---

## Permission Matrix

| Permission | Visitor | User | Reviewer | Admin |
|------------|---------|------|----------|-------|
| View public papers | ✓ | ✓ | ✓ | ✓ |
| Upload papers | ✗ | ✓ | ✓ | ✓ |
| Review submissions | ✗ | ✗ | ✓ | ✓ |
| Approve/reject | ✗ | ✗ | ✓ | ✓ |
| Publish content | ✗ | ✗ | ✓ | ✓ |
| Assign roles | ✗ | ✗ | ✗ | ✓ |
| Delete content | ✗ | ✗ | ✗ | ✓ |
| System config | ✗ | ✗ | ✗ | ✓ |

---

## Role Verification

### Backend Verification (Security)
```javascript
// Check if user is admin (backend call)
const isAdmin = await isCurrentUserAdmin();
if (!isAdmin) {
  return; // Access denied
}
```

### Frontend Display (UI Only)
```javascript
// Get badge for display
const badge = await getUserBadge();
console.log(badge.badge); // "Admin", "Contributor", etc.
```

### ⚠️ Important
**Never use badge display for security checks!**
- Badges are for UI only
- Always verify with backend functions

---

## Migration & Compatibility

### From Phase 8.2
- Old `profiles.role` column → read-only (deprecated)
- New `user_roles` table → source of truth
- Existing roles migrated automatically

### Backward Compatibility
- Badge display functions retained
- Old API marked as deprecated
- Gradual migration path provided

---

## Future Enhancements

### Phase 9+
- Multi-role support (user can have multiple roles)
- Role expiration dates
- Temporary role elevation
- Role-based feature flags
- Custom role creation (for institutions)

---

**Last Updated**: 2026-01-31  
**See Also**: ADMIN_SYSTEM_GUIDE.md, SECURITY_MODEL.md
