# Role System (Phase 4)

> **See [docs/roles.md](roles.md) for the complete role architecture reference.**

## Three Separate Systems

ExamArchive separates three independent concepts:

| System | Storage | Purpose | Grants Permissions? |
|--------|---------|---------|---------------------|
| **Permission Role** | `roles.primary_role` | Access control | ✅ YES — the ONLY source |
| **Functional Roles** | `roles.secondary_role`, `tertiary_role`, `custom_badges[]` | Display badges | ❌ NO |
| **Achievement Badges** | `achievements` table | Gamification | ❌ NO |

## Permission Role Hierarchy (primary_role)

All authorization checks use `primary_role` exclusively. XP and level are cosmetic only.

| Tier | Role | Dashboard | Manage Users | Approve | Review | Upload |
|------|------|-----------|-------------|---------|--------|--------|
| 0 | **Founder** (unique) | ✅ | ✅ | ✅ | ✅ | ✅ |
| 1 | **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ |
| 2 | **Senior Moderator** | ✅ | ❌ | ✅ | ✅ | ✅ |
| 3 | **Moderator** | ❌ | ❌ | ✅ | ✅ | ✅ |
| 4 | **Reviewer** | ❌ | ❌ | ❌ | ✅ | ✅ |
| 5 | **Contributor** | ❌ | ❌ | ❌ | ❌ | ✅ |
| 6 | **Member** | ❌ | ❌ | ❌ | ❌ | ✅ |
| 7 | **Visitor** | ❌ | ❌ | ❌ | ❌ | ❌ |

## XP Tiers (Cosmetic Only)

| XP | Title | Level |
|----|-------|-------|
| 0 | Visitor | 0 |
| 100 | Explorer | 5 |
| 300 | Contributor | 10 |
| 800 | Veteran | 25 |
| 1500 | Senior | 50 |
| 3000 | Elite | 90 |
| 5000 | Legend | 100 |

⚠️ These XP tiers **never** affect `primary_role` or grant permissions.

## Authorization Pattern

```javascript
// ✅ CORRECT — check primary_role only
if (['Founder', 'Admin', 'Senior Moderator'].includes(primary_role)) {
  // Grant dashboard access
}

// ❌ WRONG — never use XP or level for permission checks
if (level >= 90) { /* NEVER */ }
```

## Role Assignment

- **Manual only**: Founder/Admin assign roles via Admin Dashboard or `update_user_role()` RPC
- **Exception**: `Contributor` is auto-assigned on first upload via database trigger
- **Founder is unique**: enforced by `idx_unique_founder` partial index

## Role Table Schema

```sql
roles (
  user_id UUID PRIMARY KEY,
  primary_role TEXT DEFAULT 'Visitor',   -- Permission control
  secondary_role TEXT,                    -- Functional badge
  tertiary_role TEXT,                     -- Functional badge
  custom_badges JSONB DEFAULT '[]',      -- Additional badges array
  xp INTEGER DEFAULT 0,                  -- Cosmetic only
  level INTEGER DEFAULT 0,               -- Cosmetic only
  ...
)
```

## Key RPCs

| RPC | Required Role | Purpose |
|-----|--------------|---------|
| `update_user_role()` | Founder/Admin | Change any user's role |
| `has_admin_access()` | — | Check if user has Founder/Admin primary_role |
| `has_moderator_access()` | — | Check if user has Sr. Mod+ primary_role |
| `has_reviewer_access()` | — | Check if user has Reviewer+ primary_role |
