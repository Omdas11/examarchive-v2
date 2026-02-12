# Roles System

## Roles Table

```sql
CREATE TABLE roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  level INT NOT NULL DEFAULT 10
);
```

## Role Levels

| Level | Role | Capabilities |
|---|---|---|
| 0 | Visitor | Browse public papers only |
| 10 | User | Upload papers, view own submissions |
| 50 | Reviewer | Review pending submissions, approve/reject |
| 80 | Moderator | Manage users, bulk operations |
| 100 | Admin | Full access, role assignment, system config |

## RPC Function

```sql
CREATE FUNCTION get_current_user_role_level()
RETURNS INT AS $$
  SELECT COALESCE(
    (SELECT level FROM roles WHERE user_id = auth.uid()),
    0
  );
$$ LANGUAGE sql SECURITY DEFINER;
```

Call from the frontend:

```js
const { data } = await supabase.rpc('get_current_user_role_level');
```

## Auto-Assignment

A database trigger assigns level 10 to every new user on signup. No manual intervention required for basic access.

## Source of Truth

The backend `roles` table is the single source of truth for permissions. The frontend reads role levels for UI gating, but all security enforcement happens via RLS policies and the RPC function.
