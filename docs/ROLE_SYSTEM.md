# Role System

## Role Levels

| Level | Role | Access |
|---|---|---|
| 0 | Visitor | Browse approved papers only |
| 10 | Contributor | Upload papers, view own submissions |
| 80 | Reviewer | Approve/reject submissions, view all submissions |
| 100 | Admin | Full access, manage users and roles |

## How Roles Work

### Assignment

- New users are **automatically assigned level 10** (Contributor) on signup via a database trigger
- Users without a role record default to level **0** (Visitor)
- Unauthenticated visitors are treated as level **0**

### Resolution Logic

1. Frontend calls `get_user_role_name(user_id)` RPC function
2. If no role record exists:
   - Logged in → defaults to level 10 (Contributor) via auto-assignment trigger
   - Not logged in → level 0 (Visitor)
3. Role name is mapped to a display badge in `js/roles.js`

### Frontend Display

| Role | Badge | Icon | Color |
|---|---|---|---|
| Admin | Admin | 👑 | Red (#f44336) |
| Reviewer | Reviewer | 🛡️ | Blue (#2196F3) |
| Contributor | Contributor | 📝 | Green (#4CAF50) |
| Visitor | Visitor | 👤 | Grey (#9E9E9E) |

## Promoting a User

To promote a user to Reviewer or Admin, run SQL in the Supabase SQL Editor:

### Promote to Reviewer (level 80)

```sql
update roles
set level = 80
where user_id = 'USER_UUID_HERE';
```

### Promote to Admin (level 100)

```sql
update roles
set level = 100
where user_id = 'USER_UUID_HERE';
```

### Find a User's ID

```sql
select id, email
from auth.users
where email = 'user@example.com';
```

### View All Roles

```sql
select r.user_id, r.level, u.email
from roles r
join auth.users u on r.user_id = u.id
order by r.level desc;
```

## Access Control Summary

| Action | Visitor (0) | Contributor (10) | Reviewer (80) | Admin (100) |
|---|---|---|---|---|
| Browse papers | ✅ | ✅ | ✅ | ✅ |
| Upload papers | ❌ | ✅ | ✅ | ✅ |
| View own submissions | ❌ | ✅ | ✅ | ✅ |
| View all submissions | ❌ | ❌ | ✅ | ✅ |
| Approve/reject | ❌ | ❌ | ✅ | ✅ |
| Manage roles | ❌ | ❌ | ❌ | ✅ |
| Admin dashboard | ❌ | ❌ | ❌ | ✅ |
