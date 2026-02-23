# ExamArchive — Roles System v2

> **Last Updated:** Phase 5 · February 2026
>
> **Golden Rule:** Permissions depend **ONLY** on `roles.primary_role`.
> XP and level are cosmetic. Functional badges do NOT grant permissions. Achievements do NOT grant permissions.

---

## 1. Permission Role Hierarchy

All authorization decisions use `primary_role` exclusively. No other field affects access.

| Tier | Role | Unique? | Dashboard | Users Tab | Approve | Review | Upload | Browse |
|------|------|---------|-----------|-----------|---------|--------|--------|--------|
| 0 | **Founder** | ✅ Yes (1 only) | ✅ Full | ✅ | ✅ | ✅ | ✅ | ✅ |
| 1 | **Admin** | No | ✅ Full | ✅ | ✅ | ✅ | ✅ | ✅ |
| 2 | **Senior Moderator** | No | ✅ Submissions only | ❌ | ✅ | ✅ | ✅ | ✅ |
| 3 | **Moderator** | No | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| 4 | **Reviewer** | No | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| 5 | **Contributor** | No | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| 6 | **Explorer** | No | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| 7 | **Visitor** | No | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

### Access Details

- **Founder**: Full system access. Can assign/remove any role including Admin. Can reset system data. Enforced unique via `idx_unique_founder` partial index.
- **Admin**: Full admin dashboard. Manage users and roles (except cannot assign Founder). Approve/reject/publish papers.
- **Senior Moderator**: Dashboard access limited to Submissions tab only. Cannot see Users tab. Cannot assign roles. Can approve/reject submissions.
- **Moderator**: Review and approve submissions. No dashboard access.
- **Reviewer**: Review submissions only. Cannot publish or approve.
- **Contributor**: Upload papers. Track own submissions. Auto-assigned on first upload via database trigger.
- **Explorer**: Authenticated user. Can browse and download.
- **Visitor**: Default role. Browse published papers only.

---

## 2. Functional Badges (Non-Permission)

Functional badges describe what a user does. They are stored in `roles.secondary_role`, `roles.tertiary_role`, and `roles.custom_badges[]` (JSONB array).

**These NEVER grant permissions.**

### Academic Badges
| Badge | Description |
|-------|-------------|
| Subject Expert (*) | Domain expertise (e.g., Physics, Chemistry, Mathematics) |
| Paper Analyzer | Analyzes paper patterns and trends |
| Syllabus Architect | Syllabus mapping and organization |
| Question Curator | Curates and organizes questions |

### Technical Badges
| Badge | Description |
|-------|-------------|
| UI/UX Designer | Interface design contributions |
| Backend Engineer | Backend system contributions |
| Security Auditor | Security review and auditing |
| Database Architect | Database design contributions |

### Community Badges
| Badge | Description |
|-------|-------------|
| University Coordinator | Coordinates university content |
| Campus Ambassador | Promotes platform on campus |
| Community Lead | Leads community initiatives |
| Content Curator | Curates and organizes content |

---

## 3. Achievement Badge System

Achievements are auto-earned and stored in the `achievements` table (separate from roles).

| Badge Type | Display Name | Trigger |
|------------|-------------|---------|
| `first_upload` | First Upload | First paper submission |
| `10_uploads` | 10 Uploads | 10 paper submissions |
| `100_uploads` | 100 Uploads | 100 paper submissions |
| `first_review` | First Review | First submission review |
| `first_publish` | First Publish | First paper published |
| `early_user` | Early Adopter | Among first 10 users |
| `7_day_streak` | 7-Day Streak | 7 consecutive daily logins |
| `30_day_streak` | 30-Day Streak | 30 consecutive daily logins |
| `approval_90` | 90% Approval | 90%+ submission approval rate |
| `top_contributor` | Top Contributor | Monthly top uploader |

### Rules
- Auto-earned only — cannot be manually assigned
- Stored separately from roles (`achievements` table)
- Cosmetic only — never affects permissions
- Idempotent — `award_achievement()` skips if already awarded

---

## 4. XP System (Cosmetic Only)

XP and levels are **purely cosmetic** — they display titles but NEVER affect permissions.

| XP Threshold | Cosmetic Title | Level |
|-------------|---------------|-------|
| 0 | Visitor | 0 |
| 100 | Explorer | 5 |
| 300 | Contributor | 10 |
| 800 | Veteran | 25 |
| 1500 | Senior | 50 |
| 3000 | Elite | 90 |
| 5000 | Legend | 100 |

### XP Sources
- Daily login streak: +5 XP/day
- Paper upload: +50 XP (via `auto_promote_contributor` trigger)
- Admin-awarded XP: via `add_user_xp()` RPC

### ⚠️ XP Rules
1. XP NEVER changes `primary_role`
2. XP NEVER grants dashboard access
3. XP NEVER enables moderation features
4. Level is derived from XP via database trigger (`trigger_sync_level_from_xp`)
5. Cosmetic titles are mapped client-side via `mapRole(level)` in `role-utils.js`

---

## 5. Promotion Rules

1. **Manual only** — promotions are Founder/Admin controlled
2. **Never triggered by XP** — XP cannot escalate `primary_role`
3. **Founder is unique** — only one Founder allowed (enforced by DB constraint `idx_unique_founder`)
4. **Only Founder can assign Founder** — Admin cannot assign Founder
5. **Only Founder can assign Admin** — Admins cannot promote to Admin
6. **Senior Moderator cannot assign roles** — no promotion UI shown
7. **Founder cannot self-demote** — protected by frontend and backend checks
8. **Auto-promotion exception** — `Contributor` is auto-assigned on first upload via DB trigger
9. **Demotion allowed** — Founder/Admin can demote any non-Founder user

---

## 6. RPC Reference

| RPC | Required Role | Parameters | Description |
|-----|--------------|------------|-------------|
| `has_admin_access(check_user_id)` | — | `uuid` | Returns `true` if user has Founder/Admin primary_role |
| `has_moderator_access(check_user_id)` | — | `uuid` | Returns `true` if user has Founder/Admin/Senior Moderator primary_role |
| `has_reviewer_access(check_user_id)` | — | `uuid` | Returns `true` if user has Reviewer+ primary_role |
| `update_user_role(target_user_id, ...)` | Founder/Admin | `uuid, int, text, text, text, jsonb` | Update any user's role/level/badges |
| `add_user_xp(target_user_id, xp_amount)` | Founder/Admin | `uuid, int` | Award/deduct XP |
| `list_all_users(page_number, ...)` | Founder/Admin | `int, int, text, text, text` | Paginated user listing with stats |
| `search_users_by_username(search_username)` | Founder/Admin/Sr. Mod | `text` | Search users by username/email |
| `get_current_user_primary_role()` | Authenticated | — | Returns current user's primary_role |
| `update_daily_streak()` | Authenticated | — | Update daily login streak and award XP |
| `set_username(new_username)` | Authenticated | `text` | Set or change username |
| `get_user_xp_info(target_user_id)` | Authenticated (self only) | `uuid` | Get own XP/level info |
| `get_user_upload_stats(target_user_id)` | Authenticated (self only) | `uuid` | Get own upload statistics |

---

## 7. Database Schema

```sql
-- Permission + display roles
CREATE TABLE roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  level INTEGER DEFAULT 0,                  -- Cosmetic only
  xp INTEGER DEFAULT 0,                     -- Cosmetic only
  primary_role TEXT DEFAULT 'Visitor',       -- ✅ Permission control (ONLY source)
  secondary_role TEXT,                       -- Functional badge (display only)
  tertiary_role TEXT,                        -- Functional badge (display only)
  custom_badges JSONB DEFAULT '[]'::jsonb,  -- Additional functional badges
  username TEXT UNIQUE,                      -- 4-15 chars, alphanumeric + underscore
  display_name TEXT,
  avatar_url TEXT,
  streak_count INTEGER DEFAULT 0,
  last_login_date DATE,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Founder uniqueness constraint (only 1 Founder allowed)
CREATE UNIQUE INDEX idx_unique_founder ON roles ((1)) WHERE primary_role = 'Founder';

-- Auto-sync level from XP changes
CREATE TRIGGER trigger_sync_level_from_xp
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION sync_level_from_xp();

-- Achievement badges (separate table, cosmetic only)
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  awarded_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 8. Security Notes

1. **RLS enforced** — `roles` table has Row Level Security; only Founder/Admin can modify other users' roles via the `"admins manage roles"` policy.
2. **Backend is authority** — frontend role checks are for UI only; backend RPCs enforce actual access control.
3. **SECURITY DEFINER RPCs** — `update_user_role`, `award_achievement`, `add_user_xp` run with elevated privileges but validate caller role internally.
4. **No client-side role inference** — roles are always fetched from the database, never guessed from XP or level.
5. **Founder protected** — cannot be assigned if one already exists (partial unique index + RPC pre-check).
6. **Parameter validation** — RPC parameter names must match SQL function signatures exactly (e.g., `check_user_id`, not `uid`).

---

## 9. Who Can Access What

| Feature | Founder | Admin | Sr. Moderator | Moderator | Reviewer | Contributor | Visitor |
|---------|---------|-------|---------------|-----------|----------|-------------|---------|
| Admin Dashboard | ✅ | ✅ | ✅ (Submissions only) | ❌ | ❌ | ❌ | ❌ |
| Users Tab | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Role Management | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Promote Users | ✅ (all roles) | ✅ (not Founder) | ❌ | ❌ | ❌ | ❌ | ❌ |
| Approve Submissions | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Publish Papers | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Review Submissions | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Upload Papers | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Browse Papers | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View Own Profile | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Developer Tools | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Stats Page | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
