# Role System

## Role Levels (Phase 3)

| Level | Role | Access |
|---|---|---|
| 0 | Visitor | Browse published papers only |
| 10 | User | Basic authenticated access |
| 20 | Contributor | Auto-assigned after first upload |
| 50 | Reviewer | Can review submissions |
| 75 | Moderator | Approve or reject pending submissions |
| 90 | Senior Moderator | Publish approved papers, debug panel |
| 100 | Founder/Admin | Full access, manage roles, reset counters |

## How Roles Work

### Assignment

- New users are **automatically assigned level 10** (User) on signup via a database trigger
- After first upload, users are **auto-promoted to level 20** (Contributor) via `auto_promote_contributor()` trigger
- Users without a role record default to level **0** (Visitor)
- Unauthenticated visitors are treated as level **0**

### Extended Role Columns (Phase 3)

The `roles` table now includes:
- `primary_role` (text) — Primary display role/badge
- `secondary_role` (text) — Secondary display role/badge
- `tertiary_role` (text) — Tertiary display role/badge
- `custom_badges` (jsonb) — Array of custom badge names
- `updated_at` (timestamptz) — Last role update timestamp

### Resolution Logic

1. Frontend calls `get_user_role_level(user_id)` RPC function
2. Level is mapped client-side via `mapRole(level)` in `js/utils/role-utils.js`
3. Badge display uses the role level as primary badge, plus optional contributor/founder/custom badges

### Frontend Display

The `mapRole(level)` function evaluates in descending order:

```javascript
if (level >= 100) → Founder (👑)
if (level >= 90)  → Senior Moderator (🔰)
if (level >= 75)  → Moderator (🛡️)
if (level >= 50)  → Reviewer (📋)
if (level >= 20)  → Contributor (✍️)
if (level >= 10)  → User (👤)
else              → Visitor (👁️)
```

## Badge Display (3 Slots)

| Slot | Badge | Source |
|---|---|---|
| 1 | Primary Role | From `mapRole(level)` |
| 2 | Founder / Contributor | Auto: Founder if level=100, Contributor if ≥1 upload |
| 3 | Custom Badge | From `custom_badges` column |

## Admin Role Management

Admins (level ≥ 100) can manage roles from the Admin Dashboard:

1. Search users by email or UUID
2. View current level, roles, and badges
3. Edit level, primary/secondary/tertiary roles, custom badges
4. Save via `update_user_role()` RPC (level ≥ 100 required)

### RPC Functions

```sql
-- Update user role (admin only)
update_user_role(target_user_id, new_level, new_primary_role, new_secondary_role, new_tertiary_role, new_custom_badges)

-- Search users by email
search_users_by_email(search_email) → TABLE(user_id, email, display_name, level, ...)

-- Get user by UUID
get_user_role_by_id(target_user_id) → TABLE(user_id, email, display_name, level, ...)
```

## Access Control Summary

| Action | Visitor (0) | User (10) | Contributor (20) | Reviewer (50) | Moderator (75) | Sr. Mod (90) | Admin (100) |
|---|---|---|---|---|---|---|---|
| Browse papers | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Upload papers | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Review submissions | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Approve/reject | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Publish papers | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Debug panel | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Manage roles | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Admin dashboard | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
