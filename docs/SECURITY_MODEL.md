# Security Model

**Version**: 8.3  
**Date**: 2026-01-31

---

## Core Security Principle

> **Frontend ≠ Security**
> 
> The frontend is a presentation layer. It NEVER makes security decisions.

---

## Why Frontend Security Fails

### The Problem

Before Phase 8.3, ExamArchive had security vulnerabilities:

1. **Frontend-controlled roles**: `window.__APP_ROLE__` could be manipulated
2. **Timing-dependent access**: Relied on `role:ready` event
3. **Cached state**: Stale role data could grant unauthorized access
4. **No verification**: Admin dashboard checked frontend state only

### The Risk

```javascript
// ❌ INSECURE (Old system)
if (window.__APP_ROLE__.status === 'admin') {
  // Load admin dashboard
}
// → Anyone could modify window.__APP_ROLE__ in browser console
```

### The Reality

**Any frontend check can be bypassed:**
- Browser DevTools can modify JavaScript variables
- Network requests can be intercepted and modified
- localStorage/sessionStorage can be manipulated
- Client-side validation can be disabled

---

## Backend-First Security

### The Solution

```javascript
// ✅ SECURE (Phase 8.3)
const isAdmin = await isCurrentUserAdmin(); // Backend RPC call
if (!isAdmin) {
  // Access denied by backend
  return;
}
// → Backend verifies role from database
```

### How It Works

1. **Frontend Request**: Client calls `isCurrentUserAdmin()`
2. **Backend Verification**: Supabase executes `is_admin(auth.uid())`
3. **Database Query**: Checks `user_roles` table for role level ≥ 100
4. **Response**: Returns boolean (true/false)
5. **Frontend Action**: UI responds to backend decision

### Security Guarantees

- **Immutable**: Backend code cannot be modified by client
- **Verified**: Database is source of truth
- **Authenticated**: Uses Supabase auth session (JWT)
- **Auditable**: All role checks logged in database

---

## Security Layers

### Layer 1: Authentication (Who are you?)

**Provider**: Supabase Auth  
**Method**: JWT tokens in HTTP-only cookies

```javascript
const { data: { session } } = await supabase.auth.getSession();
// Session contains: user.id, email, JWT token
```

### Layer 2: Authorization (What can you do?)

**Provider**: Role-based access control (RBAC)  
**Method**: Backend functions + Row Level Security (RLS)

```sql
-- RLS Policy Example
create policy "admins can assign roles"
on user_roles for all
using (
  exists (
    select 1 from user_roles ur
    join roles r on r.id = ur.role_id
    where ur.user_id = auth.uid() and r.level >= 100
  )
);
```

### Layer 3: Validation (Is this action safe?)

**Provider**: Database constraints + application logic  
**Method**: CHECK constraints, foreign keys, triggers

```sql
-- Role name validation
check (name in ('visitor', 'user', 'reviewer', 'admin'))

-- User can only have one primary role
primary key (user_id, role_id)
```

---

## Attack Vectors & Mitigations

### 1. Role Impersonation

**Attack**: User modifies frontend to claim admin role

**Mitigation**:
- Backend verification for all admin actions
- RLS policies on database tables
- No frontend role state used for security

**Example**:
```javascript
// ❌ Attacker tries to bypass
window.__APP_ROLE__ = { status: 'admin' };

// ✅ Backend still denies access
const isAdmin = await isCurrentUserAdmin(); // Returns false
```

---

### 2. Token Theft

**Attack**: JWT token stolen via XSS or network sniffing

**Mitigation**:
- HTTP-only cookies (no JavaScript access)
- Secure flag (HTTPS only)
- Short token expiration (1 hour)
- Refresh token rotation

---

### 3. SQL Injection

**Attack**: Malicious SQL in user input

**Mitigation**:
- Parameterized queries (Supabase client)
- RLS policies (row-level filtering)
- Input validation on backend

**Example**:
```javascript
// ✅ Safe: Supabase uses parameterized queries
supabase.rpc('assign_role', {
  target_user_id: userId,  // Validated as UUID
  role_name_param: 'admin' // Validated against enum
});
```

---

### 4. Privilege Escalation

**Attack**: User assigns themselves admin role

**Mitigation**:
- Only admins can call `assign_role()`
- RLS policy checks caller's role level
- Assignment logged with `assigned_by`

**Example**:
```sql
-- Only admins (level >= 100) can assign roles
create policy "admins can assign roles"
using (
  exists (
    select 1 from user_roles ur
    join roles r on r.id = ur.role_id
    where ur.user_id = auth.uid() and r.level >= 100
  )
);
```

---

### 5. Timing Attacks

**Attack**: Race condition between role check and action

**Mitigation**:
- Atomic database operations
- Re-verify role before each sensitive action
- Transaction isolation

---

## Best Practices

### Frontend Code

✅ **DO**:
- Call backend functions for role verification
- Display badges from backend data
- Show/hide UI elements based on backend response
- Handle auth errors gracefully

❌ **DON'T**:
- Trust any frontend state for security
- Cache role decisions beyond current request
- Skip verification for "trusted" users
- Implement security logic in JavaScript

---

### Backend Code

✅ **DO**:
- Use RLS policies on all tables
- Validate all inputs
- Log security-relevant actions
- Use transactions for multi-step operations
- Re-authenticate for sensitive actions

❌ **DON'T**:
- Trust client-provided user IDs
- Allow SQL injection vectors
- Grant blanket permissions
- Skip authorization checks
- Return sensitive data in errors

---

## Security Checklist

### Before Deployment

- [ ] All admin actions use backend verification
- [ ] RLS policies enabled on all tables
- [ ] No security logic in frontend code
- [ ] Input validation on backend
- [ ] Audit logging for role changes
- [ ] JWT expiration configured (< 1 hour)
- [ ] HTTPS enforced
- [ ] Database backups enabled

### Regular Audits

- [ ] Review RLS policies monthly
- [ ] Check audit logs for suspicious activity
- [ ] Test role escalation scenarios
- [ ] Verify no frontend security shortcuts
- [ ] Update dependencies for security patches

---

## Incident Response

### Suspected Role Breach

1. **Immediate**: Revoke all sessions for affected user
2. **Investigate**: Check audit logs for unauthorized role changes
3. **Remediate**: Reset user to correct role
4. **Review**: Check for similar patterns across users

### SQL Injection Suspected

1. **Immediate**: Review recent database logs
2. **Investigate**: Check for malformed queries
3. **Remediate**: Sanitize affected tables
4. **Prevent**: Add validation for missed input vectors

---

## Future Enhancements

### Phase 9+

- **Multi-factor authentication** (MFA/2FA)
- **Admin re-authentication** for sensitive actions
- **Device fingerprinting** for suspicious login detection
- **WebAuthn/Passkeys** for passwordless auth
- **Rate limiting** on admin actions
- **IP allowlisting** for admin access

---

**Last Updated**: 2026-01-31  
**See Also**: ADMIN_SYSTEM_GUIDE.md, ROLE_MODEL.md
