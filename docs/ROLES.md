# ExamArchive — Roles & Permissions (Phase 7)

> **Golden Rule:** Permissions depend **ONLY** on `roles.primary_role`.
> XP and level are cosmetic. Functional badges do NOT grant permissions.

---

## 1. Three Separate Systems

| System | Storage | Purpose | Grants Permissions? |
|--------|---------|---------|---------------------|
| **Permission Role** | `roles.primary_role` | Access control | ✅ YES — the ONLY source |
| **Functional Roles** | `secondary_role`, `tertiary_role`, `custom_badges[]` | Display badges | ❌ NO |
| **Achievement Badges** | `achievements` table | Gamification | ❌ NO |

---

## 2. Permission Role Hierarchy

| Tier | Role | Unique? | Dashboard | Users Tab | Approve | Review | Upload | Browse |
|------|------|---------|-----------|-----------|---------|--------|--------|--------|
| 0 | **Founder** | ✅ (1 only) | ✅ Full | ✅ | ✅ | ✅ | ✅ | ✅ |
| 1 | **Admin** | No | ✅ Full | ✅ | ✅ | ✅ | ✅ | ✅ |
| 2 | **Senior Moderator** | No | ✅ Submissions | ❌ | ✅ | ✅ | ✅ | ✅ |
| 3 | **Moderator** | No | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| 4 | **Reviewer** | No | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| 5 | **Contributor** | No | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| 6 | **Explorer** | No | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| 7 | **Visitor** | No | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

### Access Details

- **Founder**: Full system access. Assign/remove any role including Admin. Reset system data. Enforced unique via `idx_unique_founder`.
- **Admin**: Full admin dashboard. Manage users and roles (except Founder). Approve/reject/publish papers.
- **Senior Moderator**: Dashboard limited to Submissions tab. Approve/reject submissions. Can assign Custom Badge 1 & 2 to roles ≤ their own tier.
- **Moderator**: Review and approve submissions. No dashboard access.
- **Reviewer**: Review submissions only. Cannot publish or approve.
- **Contributor**: Upload papers. Track own submissions. Auto-assigned on first upload.
- **Explorer**: Authenticated user. Browse and download.
- **Visitor**: Default role. Browse published papers only.

---

## 3. Promotion Rules

- **Manual only** — Founder/Admin assign roles via Admin Dashboard or `update_user_role()` RPC
- **Founder** can assign any role (including Admin and Founder)
- **Admin** can assign Senior Moderator down to Visitor (not Founder)
- **Senior Moderator and below** cannot assign roles
- **Founder is unique** — enforced by `idx_unique_founder` partial index
- **Auto-promotion exception** — Contributor is auto-assigned on first upload via DB trigger

---

## 4. Custom Badge Assignment

Senior Moderator and above can assign **Custom Badge 1** (`secondary_role`) and **Custom Badge 2** (`tertiary_role`) to users whose role tier is ≤ their own.

- No cooldown on badge assignment
- Backend validated via `assign_custom_badges()` RPC
- Badges are display-only — they never grant permissions
- Only preset roles from the list below are allowed (validated on backend)
- Custom Role 1 and Custom Role 2 cannot be the same (duplicate prevention)
- Frontend uses a dropdown select (no free-text input)

### Preset Custom Roles (Single Source of Truth)

| # | Role | Description |
|---|------|-------------|
| 1 | Top Contributor | Outstanding content contributions |
| 2 | Elite Uploader | High-volume quality uploads |
| 3 | Verified Reviewer | Trusted paper reviewer |
| 4 | Community Helper | Active community support |
| 5 | Subject Expert | Domain expertise across subjects |
| 6 | Physics Star | Physics domain specialist |
| 7 | Maths Mentor | Mathematics mentor/guide |
| 8 | Chemistry Guide | Chemistry domain specialist |
| 9 | Active Member | Consistently active participant |
| 10 | Early Supporter | Early platform supporter |
| 11 | Research Contributor | Research content contributions |
| 12 | QA Specialist | Quality assurance specialist |
| 13 | Content Curator | Content organization & curation |
| 14 | Senior Helper | Senior-level community helper |
| 15 | Beta Tester | Platform beta testing |
| 16 | Legacy Member | Long-standing member |
| 17 | Bug Hunter | Bug discovery & reporting |
| 18 | Documentation Lead | Documentation contributions |
| 19 | Mentor | Peer mentoring |
| 20 | Power User | Advanced platform usage |
| 21 | Campus Ambassador | Campus promotion & outreach |
| 22 | Event Contributor | Event organization & participation |

---

## 5. Functional Badges (Non-Permission)

### Academic
| Badge | Description |
|-------|-------------|
| Subject Expert (*) | Domain expertise (Physics, Chemistry, etc.) |
| Paper Analyzer | Paper pattern analysis |
| Syllabus Architect | Syllabus mapping |
| Question Curator | Question organization |

### Technical
| Badge | Description |
|-------|-------------|
| UI/UX Designer | Interface design |
| Backend Engineer | Backend contributions |
| Security Auditor | Security review |
| Database Architect | Database design |

### Community
| Badge | Description |
|-------|-------------|
| University Coordinator | University content coordination |
| Campus Ambassador | Campus promotion |
| Community Lead | Community initiatives |
| Content Curator | Content organization |

---

## 6. Achievement System

Achievements are auto-earned and stored in the `achievements` table.

| Badge Type | Display Name | Trigger |
|------------|-------------|---------|
| `first_upload` | First Upload | First paper submission |
| `10_uploads` | 10 Uploads | 10 submissions |
| `100_uploads` | 100 Uploads | 100 submissions |
| `first_review` | First Review | First submission review |
| `first_publish` | First Publish | First paper published |
| `early_user` | Early Adopter | Among first 10 users |
| `7_day_streak` | 7-Day Streak | 7 consecutive daily logins |
| `30_day_streak` | 30-Day Streak | 30 consecutive daily logins |
| `approval_90` | 90% Approval | 90%+ approval rate |
| `top_contributor` | Top Contributor | Monthly top uploader |

---

## 7. XP & Level System (Cosmetic Only)

| XP | Title | Level |
|----|-------|-------|
| 0 | Visitor | 0 |
| 100 | Explorer | 5 |
| 300 | Contributor | 10 |
| 800 | Veteran | 25 |
| 1,500 | Senior | 50 |
| 3,000 | Elite | 90 |
| 5,000 | Legend | 100 |

⚠️ XP **never** changes `primary_role` or grants permissions.

---

## 8. RPC Reference

| RPC | Required Role | Description |
|-----|--------------|-------------|
| `has_admin_access()` | — | Check Founder/Admin |
| `has_moderator_access()` | — | Check Sr. Moderator+ |
| `has_reviewer_access()` | — | Check Reviewer+ |
| `update_user_role()` | Founder/Admin | Change user roles |
| `assign_custom_badges()` | Sr. Moderator+ | Assign Custom Badge 1 & 2 |
| `add_user_xp()` | Founder/Admin | Award/deduct XP |
| `award_achievement()` | System | Auto-award achievements |
| `get_current_user_primary_role()` | Authenticated | Get own role |

---

## 9. Security Notes

1. **RLS enforced** — Row Level Security on all tables
2. **Backend is authority** — frontend checks are UI-only; RPCs enforce access
3. **SECURITY DEFINER RPCs** — elevated privileges with internal caller validation
4. **No client-side role inference** — roles fetched from DB, never guessed from XP
5. **Founder protected** — unique index + RPC pre-check
6. **Cooldown enforcement** — server-side only for role changes
