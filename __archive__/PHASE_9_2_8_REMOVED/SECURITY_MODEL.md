# Security Model

> Derived from [Architecture Master Plan](ARCHITECTURE_MASTER_PLAN.md) - Sections 1.3, 3, 4, 5

## Trust Boundaries

The system operates with explicit trust boundaries:

| Component | Trust Level | Responsibility |
|-----------|-------------|----------------|
| Frontend (JavaScript) | **Untrusted** | Display only, no security decisions |
| Supabase Auth | **Trusted** | Identity verification |
| Supabase RLS | **Trusted** | Authorization enforcement |
| Backend RPC Functions | **Trusted** | Role-based access control |

**Critical Rule:** The frontend NEVER decides permissions. All authorization is enforced by Row Level Security (RLS) policies on the backend.

## Authentication

### Session Management

- Sessions managed by Supabase Auth
- Stored in `localStorage` (Supabase default)
- Auto-refresh enabled
- PKCE flow for OAuth (prevents code interception)

### OAuth Flow

```
User → Google OAuth → Supabase Auth → Session Token → Frontend
```

The frontend receives a JWT token that is automatically included in all Supabase requests.

### Auth Verification

Always use `AuthContract` for auth checks:

```javascript
// CORRECT - Backend verification
const session = await window.AuthContract.requireSession();

// WRONG - Never trust frontend state alone
if (window.App.session) { ... }
```

## Authorization

### Role Hierarchy

| Role | Level | Description |
|------|-------|-------------|
| admin | 100 | Full system access |
| reviewer | 50 | Review and publish papers |
| user | 10 | Upload and view own content |
| visitor | 0 | Read-only public content |

### Backend Role Verification

All role checks MUST use backend RPC functions:

```javascript
// CORRECT - Backend verification
const isAdmin = await window.AdminAuth.isCurrentUserAdmin();

// WRONG - Never check roles from JWT claims directly
const role = session.user.user_metadata.role; // DON'T DO THIS
```

### RLS Policy Examples

**Users can only view their own submissions:**
```sql
CREATE POLICY "Users view own submissions"
ON submissions FOR SELECT
USING (auth.uid() = user_id);
```

**Reviewers can view all pending submissions:**
```sql
CREATE POLICY "Reviewers view pending"
ON submissions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.name IN ('admin', 'reviewer')
  )
);
```

## Storage Security

### Bucket Policies

| Bucket | Read | Write | Delete |
|--------|------|-------|--------|
| uploads-temp | Owner, Reviewer | Owner | Admin |
| uploads-approved | Reviewer | Reviewer | Admin |
| uploads-public | Public | Reviewer | Admin |

### Upload Path Structure

Files are uploaded to user-specific paths:
```
uploads-temp/{user_id}/{timestamp}-{filename}
```

This ensures users can only access their own uploads (enforced by RLS).

## Protected Features

### Requires Authentication

- Upload papers
- View repeated questions
- View notes
- Access settings page

### Requires Admin/Reviewer Role

- Admin dashboard access
- Approve/reject submissions
- Publish papers
- Delete submissions

## Security Checklist

### Frontend

- [ ] Never store sensitive data in localStorage (except Supabase session)
- [ ] Never make security decisions based on frontend state
- [ ] Always use `AuthContract` for auth checks
- [ ] Always use `AdminAuth` for role checks
- [ ] Sanitize all user input before display

### Backend (Supabase)

- [ ] RLS enabled on all tables
- [ ] Policies defined for SELECT, INSERT, UPDATE, DELETE
- [ ] Storage policies match table policies
- [ ] RPC functions verify caller permissions

### OAuth

- [ ] PKCE flow enabled
- [ ] Redirect URLs whitelisted
- [ ] No client secrets in frontend code

## Common Vulnerabilities (Avoided)

### IDOR (Insecure Direct Object Reference)
**Mitigated by:** RLS policies that verify `auth.uid()` matches resource owner.

### XSS (Cross-Site Scripting)
**Mitigated by:** Using `textContent` instead of `innerHTML` for user data.

### CSRF (Cross-Site Request Forgery)
**Mitigated by:** Supabase uses JWTs, not cookies, for authentication.

### Privilege Escalation
**Mitigated by:** Backend RPC functions verify roles before performing actions.

---

*Reference: [Architecture Master Plan](ARCHITECTURE_MASTER_PLAN.md) - Sections 1.3, 3, 4, 5*
