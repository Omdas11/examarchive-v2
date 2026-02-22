# ExamArchive — Role Promotion Guide

> **See [docs/roles.md](roles.md) for the complete role architecture reference.**

## Role Hierarchy

ExamArchive uses a **role-based permission system** where `primary_role` controls all access.

| Tier | Role | Access Level | Description |
|------|------|-------------|-------------|
| 0 | **Founder** | Full access | Unique role (only one user). Full control over all features. |
| 1 | **Admin** | Full management | Can manage users, roles, submissions, and access dashboard. |
| 2 | **Senior Moderator** | Dashboard access | Can review submissions and access admin dashboard. |
| 3 | **Moderator** | Approve access | Can review and approve/reject submissions. No dashboard. |
| 4 | **Reviewer** | Review access | Can review submissions only. Cannot approve/publish. |
| 5 | **Contributor** | Upload access | Can upload papers. Auto-assigned on first upload. |
| 6 | **Member** | Authenticated | Normal authenticated user. Can browse and download. |
| 7 | **Visitor** | Read-only | Not signed in. Can browse published papers only. |

## XP System (Cosmetic Only)

XP and levels are **cosmetic only** — they do NOT affect permissions.

| XP Threshold | Cosmetic Title |
|-------------|---------------|
| 0 | Visitor |
| 100 | Explorer |
| 300 | Contributor |
| 800 | Veteran |
| 1500 | Senior |
| 3000 | Elite |
| 5000 | Legend |

XP is earned from:
- Daily login streak (+5 XP/day)
- Paper uploads (awarded by backend)
- Approved submissions (awarded by backend)

## How to Promote Users

### From the Frontend (Admin Dashboard)

**Who can promote:** Only users with `Founder` or `Admin` primary_role.

1. **Navigate to Admin Dashboard**
   - Click your avatar → "Admin Dashboard"
   - Or go to `/admin/dashboard/`

2. **Search for the user**
   - In the "Role Management" section, enter the user's **username**, **email**, or **UUID**
   - Click "Search"

3. **Select the user**
   - Click "Edit" on the search result

4. **Update their role**
   - **Primary Role**: Select the new role from the dropdown
   - **XP/Level**: Adjust if needed (cosmetic only)
   - **Secondary/Tertiary Role**: Optional display roles
   - **Custom Badges**: Comma-separated badge names (e.g., "Subject Expert (Physics), Beta Tester")
   - Click "Save Changes"

5. **Founder role warning**
   - If assigning Founder, a confirmation dialog appears
   - The system enforces that only ONE Founder can exist
   - The backend will reject the assignment if a Founder already exists

### From the Users Table

1. Navigate to Admin Dashboard
2. Scroll to "All Users" table
3. Search, sort by XP/Role/Date
4. Click "Edit" on any user row
5. Same role editing form appears

### From the Backend (Supabase SQL)

For direct database access:

```sql
-- Promote a user to Reviewer
SELECT update_user_role(
  'target-user-uuid',
  NULL,              -- new_level (NULL = no change)
  'Reviewer',        -- new_primary_role
  NULL,              -- new_secondary_role
  NULL,              -- new_tertiary_role
  NULL               -- new_custom_badges
);
```

```sql
-- Check current role
SELECT user_id, primary_role, secondary_role, xp, level
FROM roles
WHERE user_id = 'target-user-uuid';
```

```sql
-- List all admins
SELECT user_id, primary_role, username, xp
FROM roles
WHERE primary_role IN ('Founder', 'Admin', 'Senior Moderator');
```

## Promotion Rules

1. **Manual only** — promotions are Founder/Admin controlled
2. **Never triggered by XP** — XP is cosmetic only, cannot escalate `primary_role`
3. **Founder is unique** — only one Founder allowed (enforced by unique partial index)
4. **Only Founder can assign Admin** — Admins cannot promote others to Admin
5. **Auto-promotion exception** — `Contributor` is auto-assigned on first upload via database trigger
6. **Demotion allowed** — Founder/Admin can demote any non-Founder user

## Functional Roles (Non-Permission Badges)

In addition to `primary_role`, users can have functional roles that describe their expertise.
These are stored in `secondary_role`, `tertiary_role`, and `custom_badges[]` and **never grant permissions**.

### Academic
- Physics Expert 🧪, Chemistry Expert 🧪, Mathematics Expert 🧪
- Paper Analyzer 📊, Syllabus Architect 📐, Question Curator 📝

### Technical
- UI/UX Designer 🎨, Backend Engineer ⚙️, Security Auditor 🔒, Database Architect 🗄️

### Community
- University Coordinator 🎓, Campus Ambassador 📢, Community Lead 🤝, Content Curator 📚

## Important Rules

1. **Never allow XP to change roles automatically** — XP is cosmetic only
2. **Only ONE Founder allowed** — enforced by unique partial index
3. **Permissions depend ONLY on `primary_role`** — not on level or XP
4. **RLS policies enforce security** — frontend role checks are for UI only; the backend is the authority
5. **Auto-promotion**: Users are auto-promoted to `Contributor` on their first upload via a database trigger

## Custom Badges

Admins can assign custom badges to any user. Available badge types:

- `Subject Expert (Physics)` 🧪 — Domain expertise
- `Paper Analyzer` 📊 — Analytical contributions
- `Top Contributor` 🏆 — High upload count
- `Early Adopter` 🌟 — Early platform user
- `Beta Tester` 🔬 — Beta testing participation
- `Top Reviewer` 📝 — Active reviewer
- `Content Curator` 📚 — Content organization
- `University Lead` 🎓 — University representative

Badges are stored as a JSON array in `roles.custom_badges` and displayed as pills in the profile panel.

## Security Considerations

- The `update_user_role` RPC requires the caller to have `Founder` or `Admin` primary_role
- The RLS policy `admins manage roles` restricts direct table access
- Frontend never decides admin status — always verified via backend RPCs
- All role changes are logged in the database
