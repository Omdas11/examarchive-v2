# ExamArchive — Role Architecture (Phase 4)

> **Golden Rule:** Permissions depend ONLY on `primary_role`. Never on XP. Never on level.

---

## Three Separate Concepts

ExamArchive uses three independent systems that must never be conflated:

| System | Column(s) | Purpose | Grants Permissions? |
|--------|-----------|---------|---------------------|
| **Permission Role** | `primary_role` | Controls access to features | ✅ YES — the ONLY source |
| **Functional Roles** | `functional_roles[]` | Describes what a user does (badges) | ❌ NO — display only |
| **Achievement Badges** | `achievements` table | Auto-earned gamification | ❌ NO — cosmetic only |

### A) `primary_role` — Permission Role (Power Control)

- Stored in `roles.primary_role` (TEXT)
- Controls dashboard access, moderation, publishing, role management
- Can ONLY be changed manually by Founder or Admin
- Never auto-assigned from XP thresholds

### B) Functional Roles — Responsibility Badges

- Stored in `roles.secondary_role`, `roles.tertiary_role`, and `roles.custom_badges` (JSONB array)
- Describes expertise and responsibilities (e.g., "Physics Expert", "UI/UX Designer")
- Displayed on profile as badge pills
- Do NOT grant any permissions

### C) Achievement Badges — Gamification

- Stored in `achievements` table (separate from `roles`)
- Auto-earned based on actions (uploads, streaks, milestones)
- Cosmetic only — never affects access

---

## Permission Role Hierarchy

| Tier | Role | Dashboard | Manage Users | Approve Papers | Review | Upload | Browse |
|------|------|-----------|-------------|----------------|--------|--------|--------|
| 0 | **Founder** (unique) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 1 | **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 2 | **Senior Moderator** | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| 3 | **Moderator** | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| 4 | **Reviewer** | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| 5 | **Contributor** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| 6 | **Member** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| 7 | **Visitor** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

### Tier Details

**Tier 0 — Founder (Unique, Only 1)**
- Full system access
- Can assign/remove any role including Admin
- Can reset system data
- Enforced unique via `idx_unique_founder` partial index in database

**Tier 1 — Admin**
- Full admin dashboard access
- Manage users and roles (except cannot assign Founder)
- Approve/reject/publish papers

**Tier 2 — Senior Moderator**
- Access admin dashboard (read + submissions management)
- Approve/reject submissions
- Cannot manage users or assign roles

**Tier 3 — Moderator**
- Review and approve submissions
- No dashboard access
- No user management

**Tier 4 — Reviewer**
- Review submissions only
- Cannot publish or approve

**Tier 5 — Contributor**
- Upload papers
- Track own submissions
- Auto-assigned on first upload via database trigger

**Tier 6 — Member**
- Normal authenticated user
- Can browse and download

**Tier 7 — Visitor**
- Not logged in
- Browse published papers only

---

## Functional Roles (Non-Permission Badges)

Functional roles describe what a user does without granting permissions. They are stored in `roles.secondary_role`, `roles.tertiary_role`, and `roles.custom_badges[]`.

### Academic
| Role | Icon | Description |
|------|------|-------------|
| Physics Expert | 🧪 | Domain expertise in Physics |
| Chemistry Expert | 🧪 | Domain expertise in Chemistry |
| Mathematics Expert | 🧪 | Domain expertise in Mathematics |
| Subject Expert (*) | 🧪 | Generic subject expertise |
| Paper Analyzer | 📊 | Analyzes paper patterns and trends |
| Syllabus Architect | 📐 | Syllabus mapping and organization |
| Question Curator | 📝 | Curates and organizes questions |

### Technical
| Role | Icon | Description |
|------|------|-------------|
| UI/UX Designer | 🎨 | Interface design contributions |
| Backend Engineer | ⚙️ | Backend system contributions |
| Security Auditor | 🔒 | Security review and auditing |
| Database Architect | 🗄️ | Database design contributions |

### Community
| Role | Icon | Description |
|------|------|-------------|
| University Coordinator | 🎓 | Coordinates university content |
| Campus Ambassador | 📢 | Promotes platform on campus |
| Community Lead | 🤝 | Leads community initiatives |
| Content Curator | 📚 | Curates and organizes content |

These roles:
- ✅ Display on profile as badge pills
- ✅ Can be assigned by Founder/Admin via dashboard
- ❌ Do NOT affect permissions
- ❌ Do NOT grant dashboard access

---

## Achievement Badge System

Achievements are auto-earned and stored in the `achievements` table (separate from roles).

### Current Achievements
| Badge Type | Display Name | Trigger | Icon |
|------------|-------------|---------|------|
| `first_upload` | First Upload | First paper submission | 📤 |
| `10_uploads` | 10 Uploads | 10 paper submissions | 🏆 |
| `100_uploads` | 100 Uploads | 100 paper submissions | 💎 |
| `first_review` | First Review | First submission review | 📝 |
| `first_publish` | First Publish | First paper published | 🌐 |
| `early_user` | Early Adopter | Among first 10 users | 🌟 |
| `7_day_streak` | 7-Day Streak | 7 consecutive daily logins | 🔥 |
| `30_day_streak` | 30-Day Streak | 30 consecutive daily logins | ⚡ |
| `approval_90` | 90% Approval | 90%+ submission approval rate | ✅ |
| `top_contributor` | Top Contributor | Monthly top uploader | 🥇 |

### Rules
- Auto-earned only — cannot be manually assigned
- Stored separately from roles (`achievements` table)
- Cosmetic only — never affects permissions
- Idempotent — `award_achievement()` skips if already awarded

---

## XP System (Cosmetic Only)

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
- Paper uploads: awarded by backend
- Approved submissions: awarded by backend

### ⚠️ XP Rules
1. XP NEVER changes `primary_role`
2. XP NEVER grants dashboard access
3. XP NEVER enables moderation features
4. Level is derived from XP via database trigger (`trigger_sync_level_from_xp`)
5. Cosmetic titles are mapped client-side via `mapRole(level)` in `role-utils.js`

---

## Authorization Checks

### Frontend Pattern

```javascript
// ✅ CORRECT — check primary_role
if (primary_role === 'Founder' || 
    primary_role === 'Admin' || 
    primary_role === 'Senior Moderator') {
  // Grant dashboard access
}

// ❌ WRONG — never check XP or level for permissions
if (level >= 90) { /* NEVER DO THIS */ }
if (xp >= 3000) { /* NEVER DO THIS */ }
```

### Backend Pattern (RPC)

```sql
-- ✅ CORRECT — check primary_role
IF (SELECT primary_role FROM roles WHERE user_id = auth.uid()) 
   IN ('Founder', 'Admin') THEN ...

-- ❌ WRONG — never check level for permissions
IF (SELECT level FROM roles WHERE user_id = auth.uid()) >= 90 THEN ...
```

### Key RPCs
| RPC | Access Required | Description |
|-----|----------------|-------------|
| `has_admin_access()` | Founder/Admin | Full admin check |
| `has_moderator_access()` | Founder/Admin/Sr. Mod | Moderation check |
| `has_reviewer_access()` | Founder/Admin/Sr. Mod/Reviewer | Review check |
| `update_user_role()` | Founder/Admin | Change user roles |

---

## Promotion Rules

1. **Manual only** — promotions are Founder/Admin controlled
2. **Never triggered by XP** — XP cannot escalate `primary_role`
3. **Founder is unique** — only one Founder allowed (enforced by DB constraint)
4. **Only Founder can assign Admin** — Admins cannot promote to Admin
5. **Auto-promotion exception** — `Contributor` is auto-assigned on first upload via DB trigger
6. **Demotion allowed** — Founder/Admin can demote any non-Founder user

---

## Database Schema

```sql
-- Permission + display roles
CREATE TABLE roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  level INTEGER DEFAULT 0,
  xp INTEGER DEFAULT 0,
  primary_role TEXT DEFAULT 'Visitor',       -- Permission control
  secondary_role TEXT,                        -- Functional badge (display)
  tertiary_role TEXT,                         -- Functional badge (display)
  custom_badges JSONB DEFAULT '[]'::jsonb,   -- Additional functional badges
  username TEXT,
  avatar_url TEXT,
  streak_count INTEGER DEFAULT 0,
  last_login_date DATE,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Founder uniqueness constraint
CREATE UNIQUE INDEX idx_unique_founder ON roles ((1)) WHERE primary_role = 'Founder';

-- Achievement badges (separate table)
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  awarded_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Security Considerations

1. **RLS enforced** — `roles` table has Row Level Security; only Founder/Admin can modify other users' roles
2. **Backend is authority** — frontend role checks are for UI only; backend RPCs enforce actual access
3. **SECURITY DEFINER RPCs** — `update_user_role`, `award_achievement` run with elevated privileges
4. **No client-side role inference** — roles are always fetched from the database, never guessed from XP
5. **Founder protected** — cannot be assigned if one already exists (partial unique index + RPC pre-check)
