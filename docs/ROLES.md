# ExamArchive — Roles & Permissions

## Role Hierarchy

| # | Role | Scope | Assigned By |
|---|------|-------|-------------|
| 1 | **Founder** | Full system access, unique role | System |
| 2 | **Admin** | Full management access | Founder |
| 3 | **Senior Moderator** | Submission review + stats | Founder, Admin |
| 4 | **Moderator** | Submission approval | Founder, Admin |
| 5 | **Reviewer** | Upload papers | Auto / Admin |
| 6 | **Contributor** | Upload papers | Auto (XP-based title) |
| 7 | **Explorer** | Browse papers | Auto (XP-based title) |
| 8 | **Visitor** | Browse only | Default |

---

## Permissions Matrix

| Permission | Visitor | Explorer | Contributor | Reviewer | Moderator | Senior Mod | Admin | Founder |
|-----------|---------|----------|-------------|----------|-----------|-----------|-------|---------|
| Browse papers | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| Upload papers | — | — | Yes | Yes | Yes | Yes | Yes | Yes |
| Approve submissions | — | — | — | — | Yes | Yes | Yes | Yes |
| View admin dashboard | — | — | — | — | — | Yes | Yes | Yes |
| View submissions tab | — | — | — | — | — | Yes | Yes | Yes |
| View stats page | — | — | — | — | — | Yes | Yes | Yes |
| Manage user roles | — | — | — | — | — | — | Yes | Yes |
| View users page | — | — | — | — | — | — | Yes | Yes |
| Access developer tools | — | — | — | — | — | — | — | Yes |
| Assign Founder role | — | — | — | — | — | — | — | Yes |
| Assign Admin role | — | — | — | — | — | — | — | Yes |

---

## Promotion Hierarchy

- **Founder** can promote to: Any role (including Admin and Founder)
- **Admin** can promote to: Senior Moderator, Moderator, Reviewer, Contributor, Explorer, Visitor
- **Senior Moderator**: Cannot promote users
- **Moderator and below**: Cannot promote users

### Promotion Rules

1. Only Founder can assign the Founder role
2. Only Founder can assign the Admin role
3. Role changes are enforced server-side via `update_user_role()` RPC
4. All role changes are subject to cooldown periods

---

## Cooldown Rules

After changing a user's role, the **actor** (person performing the change) must wait before making another role change.

| Actor Role | Cooldown Duration |
|-----------|-------------------|
| Founder | 2 hours |
| Admin | 3 hours |
| Senior Moderator | 6 hours |
| Moderator | 12 hours |

- Cooldown is tracked via `last_role_change` column in the `roles` table
- Enforced server-side — frontend cannot bypass
- Cooldown applies to the actor, not the target user
- Can be reset via Developer Tools (Founder only)

---

## Badge System

### Custom Badges

Custom badges are stored in the `custom_badges` column (JSON array) in the `roles` table.

- Assigned manually by Admin/Founder
- Examples: "Subject Expert (Physics)", "Beta Tester", "Founding Member"
- Displayed on user profile and in admin user table

### Avatar Ring Badges

Visual rings around user avatars indicate role/level:

| Ring | Criteria | Color |
|------|----------|-------|
| Founder | Role = Founder | Gold |
| Admin | Role = Admin | Red |
| Senior Moderator | Role = Senior Moderator | Orange |
| Reviewer | Role = Reviewer | Blue |
| Senior | Level >= 50 | Purple |
| Veteran | Level >= 25 | Teal |
| Contributor | Level >= 10 | Green |
| Explorer | Level >= 5 | Cyan |
| Visitor | Default | Gray |

---

## Achievement System

Achievements are auto-earned based on user activity and stored in the `achievements` table.

### Available Achievements

| Achievement | Trigger | XP Reward |
|------------|---------|-----------|
| First Upload | Upload first paper | +50 XP |
| 10 Uploads | Reach 10 submissions | +100 XP |
| 7-Day Streak | 7 consecutive daily logins | +50 XP |
| 30-Day Streak | 30 consecutive daily logins | +100 XP |
| Early Adopter | Among first 10 users | +200 XP |

### Achievement Display

- Achievements appear on user profile page
- Achievement count shown in admin user table with hover tooltip showing actual titles
- Trophy icon used for achievement indicators
- Achievement titles shown on hover: "First Upload", "10 Uploads", "7-Day Streak", etc.

---

## XP & Level System

XP and levels are **cosmetic only** — they never affect permissions.

### XP Sources

| Action | XP Earned |
|--------|-----------|
| Upload a paper | +50 XP |
| Paper approved | +100 XP |
| Daily login streak | +5 XP/day |

### Level Thresholds

| Level | XP Required | Title |
|-------|------------|-------|
| 0 | 0 | Visitor |
| 5 | 100 | Explorer |
| 10 | 300 | Contributor |
| 25 | 800 | Veteran |
| 50 | 1,500 | Senior |
| 90 | 3,000 | Elite |
| 100 | 5,000 | Legend |

Levels are calculated from XP via the `calculate_level_from_xp()` database function. The `recalc_levels()` RPC can be triggered by the Founder to fix any mismatches.

---

## Security Notes

- All role changes are enforced via `SECURITY DEFINER` RPCs with `auth.uid()` checks
- Frontend access checks are supplementary — never the sole enforcement
- Row Level Security (RLS) policies restrict data access by role
- Cooldown enforcement is server-side only
- Developer tools are restricted to Founder role only
