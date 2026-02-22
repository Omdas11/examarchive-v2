# ExamArchive — Role Promotion Guide

## Role Hierarchy

ExamArchive uses a **role-based permission system** where `primary_role` controls all access.

| Role | Access Level | Description |
|------|-------------|-------------|
| **Founder** | Full access | Unique role (only one user). Full control over all features. |
| **Admin** | Full management | Can manage users, roles, submissions, and access dashboard. |
| **Senior Moderator** | Dashboard access | Can review submissions and access admin dashboard. |
| **Reviewer** | Review access | Can review and approve/reject submissions. |
| **Contributor** | Upload access | Can upload papers. Auto-assigned on first upload. |
| **Visitor** | Read-only | Default role for all new users. Can browse and download. |

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
