# Admin System Documentation

> **Phase:** 9.2  
> **Last Updated:** 2026-02-05  
> **Status:** CANONICAL — Single source of truth for admin implementation

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Components](#core-components)
4. [Role-Based Access Control](#role-based-access-control)
5. [Admin Dashboard](#admin-dashboard)
6. [Review Workflow](#review-workflow)
7. [Backend RPC Functions](#backend-rpc-functions)
8. [Real-Time Updates](#real-time-updates)
9. [Security Model](#security-model)
10. [API Reference](#api-reference)
11. [Debugging Guide](#debugging-guide)
12. [Adding Admins & Reviewers](#adding-admins--reviewers)

---

## Overview

ExamArchive's admin system provides a **backend-verified, role-based access control** system for managing user submissions. The system follows a strict security model where **the frontend never decides permissions** — all authorization happens on the backend.

### Key Principles

1. **Backend Authority** — Frontend never decides who is an admin
2. **Role-Based Access** — Hierarchical roles (visitor → user → reviewer → admin)
3. **Secure by Design** — RLS policies enforce access at database level
4. **Real-Time Updates** — Dashboard updates automatically via Supabase subscriptions
5. **Audit Trail** — Complete tracking of who reviewed what and when

### System Capabilities

- ✅ Backend-verified role checking
- ✅ Admin dashboard with real-time updates
- ✅ Submission review workflow (approve/reject/publish)
- ✅ Multi-stage storage (temp → approved → public)
- ✅ Role assignment (admin-only)
- ✅ Submission status tracking
- ✅ Reviewer notes and rejection reasons

---

## Architecture

### System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN DASHBOARD UI                        │
│              admin/dashboard.html + dashboard.js             │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Pending    │  │  Approved    │  │  All         │       │
│  │  Tab        │  │  Tab         │  │  Submissions │       │
│  └─────────────┘  └──────────────┘  └──────────────┘       │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│            AUTH CONTROLLER (js/auth-controller.js)           │
│  - requireRole(['admin', 'reviewer'])                        │
│  - Calls get_user_role_name() RPC                            │
│  - Verifies backend response                                 │
└──────────────────────────┬──────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Supabase       │ │  RPC Functions  │ │  RLS Policies   │
│  Auth           │ │  (Backend)      │ │  (Database)     │
│  (JWT tokens)   │ │  - is_admin()   │ │  - Admin-only   │
│                 │ │  - get_user_    │ │    queries      │
│                 │ │    role_name()  │ │  - Reviewer     │
│                 │ │  - assign_role()│ │    access       │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

### Component Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                   SUPABASE BACKEND                           │
│  - Roles table (role definitions)                            │
│  - User_roles table (user → role mapping)                    │
│  - RPC functions (backend verification)                      │
│  - RLS policies (access enforcement)                         │
└─────────────────────────────────────────────────────────────┘
                           ▲
                           │ JWT + RPC calls
                           │
┌─────────────────────────────────────────────────────────────┐
│              AUTHENTICATION LAYER                            │
│  - auth-controller.js (requireRole API)                      │
│  - admin-auth.js (backend verification helpers)              │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  ADMIN UI LAYER                              │
│  - dashboard.html (admin interface)                          │
│  - dashboard.js (review logic)                               │
│  - roles.js (badge display)                                  │
└─────────────────────────────────────────────────────────────┘
```

### File Structure

```
admin/
├── dashboard.html          # Admin dashboard page
├── dashboard.js            # Dashboard logic & review workflow
├── dashboard.css           # Dashboard styles
└── sql/
    ├── 01_profiles_table.sql         # User profiles
    ├── 02_submissions_table.sql      # Submissions tracking
    ├── 03_storage_buckets.sql        # Storage configuration
    ├── 04_storage_policies.sql       # RLS for storage
    └── 05_roles_system.sql           # ⭐ Core roles system

js/
├── auth-controller.js      # ⭐ requireRole() implementation
├── admin-auth.js           # Backend verification helpers
└── roles.js                # Badge display logic
```

---

## Core Components

### 1. Auth Controller (`js/auth-controller.js`)

**Purpose:** Provides `requireRole()` API for role-based access control

**Key Method: `requireRole(allowedRoles)`**

```javascript
const session = await window.AuthController.requireRole(['admin', 'reviewer']);

if (!session) {
  // Access denied - show error
  showAccessDenied();
  return;
}

// Access granted - proceed
initializeAdminDashboard();
```

**Flow:**

```
1. Check if user has session
2. If no session → return null
3. Call backend get_user_role_name(user_id)
4. Check if role is in allowedRoles array
5. If match → return session
6. If no match → return null
```

**Security:** Backend RPC function is the source of truth, not frontend

---

### 2. Admin Auth Module (`js/admin-auth.js`)

**Purpose:** Backend verification helpers for role checking

**Functions:**

```javascript
// Check if user is admin (backend-verified)
const isAdmin = await window.AdminAuth.isAdminBackend(userId);

// Check if current user is admin
const isCurrent = await window.AdminAuth.isCurrentUserAdmin();

// Get user's role info
const roleInfo = await window.AdminAuth.getUserRoleBackend(userId);
// Returns: { name: 'admin', level: 100 }

// Assign role to user (admin-only)
const result = await window.AdminAuth.assignRole(targetUserId, 'reviewer');
// Returns: { success: true, role: 'reviewer', level: 50 }
```

**Wait for Supabase:**

```javascript
// All functions wait for Supabase to initialize
const supabase = await waitForSupabaseAdmin();
if (!supabase) {
  console.error('Supabase not initialized');
  return false;
}
```

---

### 3. Admin Dashboard (`admin/dashboard.html` + `dashboard.js`)

**Purpose:** UI for reviewing and managing submissions

**Features:**

- **Three Tabs:**
  - Pending — Submissions awaiting review
  - Approved — Approved/published submissions
  - All — All submissions regardless of status

- **Stats Cards:**
  - Pending count
  - Approved count
  - Published count
  - Rejected count

- **Actions:**
  - View Details
  - Approve & Publish
  - Reject
  - Delete

**Initialization Flow:**

```javascript
// Wait for auth:ready event
window.addEventListener("auth:ready", async (e) => {
  // Require admin or reviewer role
  const session = await window.AuthController.requireRole(['admin', 'reviewer']);
  
  if (!session) {
    const userSession = window.AuthController.getSession();
    
    if (!userSession) {
      showAccessDenied('You need to sign in to access the admin dashboard.', true);
    } else {
      showAccessDenied('You don\'t have admin or reviewer permissions.', false);
    }
    return;
  }

  // Access granted - initialize dashboard
  initializeDashboard();
});
```

**Real-Time Updates:**

```javascript
function setupRealtimeSubscriptions() {
  const supabase = getSupabase();
  
  const channel = supabase
    .channel('submissions-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'submissions' },
      (payload) => {
        console.log('Submission change detected:', payload);
        loadSubmissions(); // Reload data
      }
    )
    .subscribe();
}
```

---

### 4. Roles Module (`js/roles.js`)

**Purpose:** Display-only badge system for UI

```javascript
// Get user's badge for display
const badge = await window.Roles.getUserBadge();
// Returns:
// {
//   role: 'admin',
//   badge: 'Admin',
//   icon: '👑',
//   color: '#f44336',
//   level: 100
// }
```

**Badge Mapping:**

| Role      | Badge        | Icon | Color   | Level |
|-----------|--------------|------|---------|-------|
| visitor   | Visitor      | 👤   | #9E9E9E | 0     |
| user      | Contributor  | 📝   | #4CAF50 | 10    |
| reviewer  | Moderator    | 🛡️   | #2196F3 | 50    |
| admin     | Admin        | 👑   | #f44336 | 100   |

**Important:** Badges are display-only. Backend is authority for permissions.

---

## Role-Based Access Control

### Role Hierarchy

```
Level 0   → VISITOR   (Guest, no account)
Level 10  → USER      (Logged in, can upload)
Level 40  → AI_REVIEWER (Future: automated reviews)
Level 50  → REVIEWER  (Can review submissions)
Level 60  → MODERATOR (Community moderation)
Level 70  → CURATOR   (Content organization)
Level 100 → ADMIN     (Full access)
```

### Database Schema

**roles table:**

```sql
create table roles (
  id uuid primary key,
  name text unique not null,  -- 'visitor', 'user', 'reviewer', 'admin', etc.
  level int not null,          -- Hierarchical level
  description text,
  created_at timestamptz default now()
);
```

**user_roles table:**

```sql
create table user_roles (
  user_id uuid references auth.users(id) on delete cascade,
  role_id uuid references roles(id) on delete cascade,
  assigned_by uuid references auth.users(id),
  assigned_at timestamptz default now(),
  primary key (user_id, role_id)
);
```

### RLS Policies

**Users can read their own role:**

```sql
create policy "users can read own role"
on user_roles for select
using (auth.uid() = user_id);
```

**Only admins can assign roles:**

```sql
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

---

## Admin Dashboard

### Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│                     Admin Dashboard                          │
│              Review and manage submissions                    │
└─────────────────────────────────────────────────────────────┘

┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Pending  │ │ Approved │ │Published │ │ Rejected │
│    12    │ │    45    │ │    320   │ │     8    │
└──────────┘ └──────────┘ └──────────┘ └──────────┘

┌─────────────────────────────────────────────────────────────┐
│  [Pending] [Approved] [All Submissions]                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │ CS101 - 2024                            ⏳ Pending   │   │
│  │ Submitted by: user@example.com                       │   │
│  │ File: CS101_2024_final.pdf (2.4 MB)                  │   │
│  │ Jan 15, 2024                                         │   │
│  │                                                       │   │
│  │ [View Details] [Reject] [Approve & Publish]          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ MATH201 - 2023                          ✓ Approved   │   │
│  │ ...                                                   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Tab Filtering

**Pending Tab:**

```javascript
filtered = allSubmissions.filter(s => s.status === 'pending');
```

**Approved Tab:**

```javascript
filtered = allSubmissions.filter(s => 
  s.status === 'approved' || s.status === 'published'
);
```

**All Tab:**

```javascript
filtered = allSubmissions; // No filtering
```

### Submission Card

Each submission displays:

- **Metadata:** Paper code, exam year, paper name
- **User Info:** Submitted by (email)
- **File Info:** Original filename, file size
- **Timestamps:** Created, reviewed, published dates
- **Status Badge:** Pending, Approved, Rejected, Published
- **Review Notes:** Optional admin notes
- **Actions:** Context-appropriate buttons

---

## Review Workflow

### Submission Lifecycle

```
┌─────────────┐
│   USER      │
│  UPLOADS    │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────────┐
│  STATUS: pending                     │
│  STORAGE: uploads-temp bucket        │
│  PATH: {userId}/{timestamp}-file.pdf │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│      ADMIN/REVIEWER REVIEWS          │
│  Options: Approve | Reject | Delete  │
└──────┬───────────────────────────────┘
       │
       ├─────── APPROVE ────────┐
       │                         ▼
       │              ┌──────────────────────────┐
       │              │  STATUS: published       │
       │              │  STORAGE: uploads-public │
       │              │  PATH: papers/{file}.pdf │
       │              │  PUBLIC_URL: generated   │
       │              └──────────────────────────┘
       │
       └─────── REJECT ─────────┐
                                ▼
                     ┌──────────────────────────┐
                     │  STATUS: rejected        │
                     │  STORAGE: file deleted   │
                     │  REASON: stored in DB    │
                     └──────────────────────────┘
```

### Approve & Publish Flow

```javascript
async function approveSubmission(submission, notes = '') {
  // 1. Get reviewer ID
  const reviewerId = session.user.id;

  // 2. Move file: temp → public
  const timestamp = Date.now();
  const filename = `${submission.paper_code}_${submission.exam_year}_${timestamp}.pdf`;
  const publicPath = `papers/${filename}`;

  const moved = await window.SupabaseClient.moveFile(
    window.SupabaseClient.BUCKETS.TEMP,
    submission.temp_path,
    window.SupabaseClient.BUCKETS.PUBLIC,
    publicPath
  );

  if (!moved) {
    throw new Error('Failed to move file to public storage');
  }

  // 3. Get public URL
  const publicUrl = window.SupabaseClient.getPublicUrl(publicPath);

  // 4. Update submission in database
  const { error } = await supabase
    .from('submissions')
    .update({
      status: 'published',
      reviewer_id: reviewerId,
      review_notes: notes || null,
      reviewed_at: new Date().toISOString(),
      published_at: new Date().toISOString(),
      public_path: publicPath,
      public_url: publicUrl
    })
    .eq('id', submission.id);

  if (error) throw error;

  // 5. Reload dashboard
  await loadSubmissions();
}
```

### Reject Flow

```javascript
async function rejectSubmission(submission, notes = '') {
  // 1. Get reviewer ID
  const reviewerId = session.user.id;

  // 2. Delete file from temp storage
  await window.SupabaseClient.deleteFile(
    window.SupabaseClient.BUCKETS.TEMP,
    submission.temp_path
  );

  // 3. Update submission status
  const { error } = await supabase
    .from('submissions')
    .update({
      status: 'rejected',
      reviewer_id: reviewerId,
      rejection_reason: notes || null,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', submission.id);

  if (error) throw error;

  // 4. Reload dashboard
  await loadSubmissions();
}
```

### Delete Flow

```javascript
async function deleteSubmission(submission) {
  // 1. Confirm deletion
  if (!confirm('Are you sure you want to delete this submission?')) {
    return;
  }

  // 2. Delete files from storage (based on status)
  if (submission.temp_path) {
    await window.SupabaseClient.deleteFile(
      window.SupabaseClient.BUCKETS.TEMP,
      submission.temp_path
    );
  }
  if (submission.approved_path) {
    await window.SupabaseClient.deleteFile(
      window.SupabaseClient.BUCKETS.APPROVED,
      submission.approved_path
    );
  }
  if (submission.public_path) {
    await window.SupabaseClient.deleteFile(
      window.SupabaseClient.BUCKETS.PUBLIC,
      submission.public_path
    );
  }

  // 3. Delete submission record from database
  const { error } = await supabase
    .from('submissions')
    .delete()
    .eq('id', submission.id);

  if (error) throw error;

  // 4. Reload dashboard
  await loadSubmissions();
}
```

---

## Backend RPC Functions

### 1. `get_user_role_name(user_id_param)`

**Purpose:** Get user's primary role name

**Implementation:**

```sql
create or replace function get_user_role_name(user_id_param uuid)
returns text as $$
declare
  role_name text;
begin
  select r.name
  into role_name
  from user_roles ur
  join roles r on r.id = ur.role_id
  where ur.user_id = user_id_param
  order by r.level desc
  limit 1;
  
  -- Default to 'user' if logged in but no role assigned
  if role_name is null and user_id_param is not null then
    return 'user';
  end if;
  
  return coalesce(role_name, 'visitor');
end;
$$ language plpgsql security definer;
```

**Usage:**

```javascript
const { data: roleName, error } = await supabase.rpc('get_user_role_name', {
  user_id_param: userId
});

console.log('User role:', roleName); // 'admin', 'reviewer', 'user', etc.
```

---

### 2. `get_user_role_level(user_id_param)`

**Purpose:** Get user's role level (for hierarchy checks)

**Implementation:**

```sql
create or replace function get_user_role_level(user_id_param uuid)
returns int as $$
declare
  max_level int;
begin
  select coalesce(max(r.level), 0)
  into max_level
  from user_roles ur
  join roles r on r.id = ur.role_id
  where ur.user_id = user_id_param;
  
  return max_level;
end;
$$ language plpgsql security definer;
```

**Usage:**

```javascript
const { data: roleLevel, error } = await supabase.rpc('get_user_role_level', {
  user_id_param: userId
});

console.log('User level:', roleLevel); // 0, 10, 50, 100, etc.
```

---

### 3. `is_admin(user_id_param)`

**Purpose:** Check if user is admin (level >= 100)

**Implementation:**

```sql
create or replace function is_admin(user_id_param uuid)
returns boolean as $$
declare
  user_level int;
begin
  user_level := get_user_role_level(user_id_param);
  return user_level >= 100;
end;
$$ language plpgsql security definer;
```

**Usage:**

```javascript
const { data: isAdmin, error } = await supabase.rpc('is_admin', {
  user_id_param: userId
});

console.log('Is admin:', isAdmin); // true or false
```

---

### 4. `is_current_user_admin()`

**Purpose:** Convenience function to check if current user is admin

**Implementation:**

```sql
create or replace function is_current_user_admin()
returns boolean as $$
begin
  return is_admin(auth.uid());
end;
$$ language plpgsql security definer;
```

**Usage:**

```javascript
const { data: isAdmin, error } = await supabase.rpc('is_current_user_admin');

console.log('Current user is admin:', isAdmin);
```

---

### 5. `assign_role(target_user_id, role_name_param)`

**Purpose:** Assign role to user (admin-only)

**Implementation:**

```sql
create or replace function assign_role(
  target_user_id uuid,
  role_name_param text
)
returns json as $$
declare
  role_record record;
  is_admin_user boolean;
begin
  -- Check if current user is admin
  is_admin_user := is_admin(auth.uid());
  
  if not is_admin_user then
    return json_build_object(
      'success', false,
      'error', 'Unauthorized: Only admins can assign roles'
    );
  end if;
  
  -- Get role by name
  select * into role_record from roles where name = role_name_param;
  
  if role_record is null then
    return json_build_object(
      'success', false,
      'error', 'Invalid role name'
    );
  end if;
  
  -- Remove existing roles for user (one primary role)
  delete from user_roles where user_id = target_user_id;
  
  -- Assign new role
  insert into user_roles (user_id, role_id, assigned_by)
  values (target_user_id, role_record.id, auth.uid());
  
  return json_build_object(
    'success', true,
    'role', role_name_param,
    'level', role_record.level
  );
end;
$$ language plpgsql security definer;
```

**Usage:**

```javascript
const { data: result, error } = await supabase.rpc('assign_role', {
  target_user_id: '123e4567-e89b-12d3-a456-426614174000',
  role_name_param: 'reviewer'
});

console.log(result);
// { success: true, role: 'reviewer', level: 50 }
```

---

## Real-Time Updates

### Supabase Realtime Subscriptions

The dashboard subscribes to database changes for live updates:

```javascript
function setupRealtimeSubscriptions() {
  const supabase = getSupabase();
  
  const channel = supabase
    .channel('submissions-changes')
    .on(
      'postgres_changes',
      {
        event: '*',              // Listen to all events
        schema: 'public',
        table: 'submissions'
      },
      (payload) => {
        console.log('Change detected:', payload);
        
        // Reload submissions
        loadSubmissions();
      }
    )
    .subscribe();
}
```

### Supported Events

- `INSERT` — New submission created
- `UPDATE` — Submission status changed
- `DELETE` — Submission deleted

### Automatic Refresh

When any admin/reviewer performs an action (approve, reject, delete), **all connected dashboards** automatically refresh to show the latest data.

**Example Flow:**

```
1. Admin A approves submission
2. Database record updated
3. Supabase broadcasts change event
4. Admin B's dashboard receives event
5. Admin B's dashboard reloads data
6. Admin B sees updated submission status
```

---

## Security Model

### Trust Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                      UNTRUSTED                               │
│                    Frontend Code                             │
│  - NEVER decides who is admin                                │
│  - NEVER grants permissions                                  │
│  - Only displays what backend allows                         │
│  - Calls backend for ALL permission checks                   │
└─────────────────────────────────────────────────────────────┘
                           ▲
                           │ JWT Token + RPC calls
                           │
┌─────────────────────────────────────────────────────────────┐
│                      TRUSTED                                 │
│               Supabase Backend + Database                    │
│  - Verifies JWT on every request                             │
│  - Executes RPC functions with SECURITY DEFINER              │
│  - Enforces RLS policies on all queries                      │
│  - Returns role info only to authorized users                │
└─────────────────────────────────────────────────────────────┘
```

### Security Principles

#### 1. Backend-Only Authorization

**✅ CORRECT:**

```javascript
// Backend decides admin status
const session = await window.AuthController.requireRole(['admin']);
if (!session) {
  showAccessDenied();
  return;
}
```

**❌ WRONG:**

```javascript
// Never do this - frontend should not decide
if (user.email.endsWith('@admin.com')) {
  showAdminPanel(); // Attacker can bypass
}
```

#### 2. JWT Token is Authority

- All Supabase requests include JWT token in headers
- Backend validates token on every request
- Token contains user ID, not role
- Role is looked up via `user_roles` table
- RLS policies enforce access based on role

#### 3. RLS Policy Enforcement

All database queries are protected by RLS policies:

**Submissions table:**

```sql
-- Users can only see their own submissions
create policy "users see own submissions"
on submissions for select
using (auth.uid() = user_id);

-- Admins/reviewers can see all submissions
create policy "admins and reviewers see all submissions"
on submissions for select
using (
  exists (
    select 1 from profiles
    where id = auth.uid() 
    and role in ('admin', 'reviewer')
  )
);

-- Only admins can update submissions
create policy "admins manage submissions"
on submissions for update
using (
  exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  )
);
```

**User_roles table:**

```sql
-- Users can read their own role
create policy "users can read own role"
on user_roles for select
using (auth.uid() = user_id);

-- Only admins can assign roles
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

#### 4. Storage Security

**Three-bucket architecture:**

| Bucket           | Access                      | Purpose                |
|------------------|-----------------------------|------------------------|
| uploads-temp     | User: own files only        | Pending review         |
|                  | Admin: all files            |                        |
| uploads-approved | Admin: all files            | Approved, not published|
| uploads-public   | Everyone: read-only         | Published papers       |
|                  | Admin: write/delete         |                        |

**RLS Policies:**

```sql
-- Users can only upload to their own folder in temp
create policy "authenticated users upload temp"
on storage.objects for insert
with check (
  bucket_id = 'uploads-temp'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Only admins can write to approved bucket
create policy "admins write approved"
on storage.objects for insert
with check (
  bucket_id = 'uploads-approved'
  and exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  )
);

-- Only admins can publish to public bucket
create policy "admins publish public"
on storage.objects for insert
with check (
  bucket_id = 'uploads-public'
  and exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  )
);
```

#### 5. No Secrets in Frontend

- Only public Supabase anon key in code
- No admin keys, no private credentials
- All sensitive operations use backend RPC functions
- RPC functions run with `SECURITY DEFINER` (elevated privileges)

---

## API Reference

### AuthController.requireRole()

**Signature:**

```typescript
requireRole(allowedRoles: string[]): Promise<Session | null>
```

**Parameters:**

- `allowedRoles` — Array of allowed role names (e.g., `['admin', 'reviewer']`)

**Returns:**

- `Session` object if user has one of the allowed roles
- `null` if user doesn't have required role or not signed in

**Example:**

```javascript
// Require admin access
const session = await window.AuthController.requireRole(['admin']);

if (!session) {
  console.log('Access denied - not an admin');
  return;
}

console.log('Admin access granted:', session.user.email);
```

**Usage Pattern:**

```javascript
window.addEventListener("auth:ready", async () => {
  const session = await window.AuthController.requireRole(['admin', 'reviewer']);
  
  if (!session) {
    showAccessDenied();
    return;
  }
  
  initializeAdminDashboard();
});
```

---

### AdminAuth.isAdminBackend()

**Signature:**

```typescript
isAdminBackend(userId?: string): Promise<boolean>
```

**Parameters:**

- `userId` — Optional user ID to check (defaults to current user)

**Returns:**

- `true` if user is admin
- `false` otherwise

**Example:**

```javascript
const isAdmin = await window.AdminAuth.isAdminBackend();

if (isAdmin) {
  console.log('Current user is admin');
}
```

---

### AdminAuth.getUserRoleBackend()

**Signature:**

```typescript
getUserRoleBackend(userId?: string): Promise<{ name: string, level: number } | null>
```

**Parameters:**

- `userId` — Optional user ID to check (defaults to current user)

**Returns:**

- Object with `name` and `level` properties
- `null` on error

**Example:**

```javascript
const roleInfo = await window.AdminAuth.getUserRoleBackend();

console.log(roleInfo);
// { name: 'admin', level: 100 }
```

---

### AdminAuth.assignRole()

**Signature:**

```typescript
assignRole(targetUserId: string, roleName: string): Promise<{
  success: boolean,
  role?: string,
  level?: number,
  error?: string
}>
```

**Parameters:**

- `targetUserId` — UUID of user to assign role to
- `roleName` — Role name to assign ('admin', 'reviewer', 'user', etc.)

**Returns:**

- Object with `success` boolean and either role info or error message

**Example:**

```javascript
const result = await window.AdminAuth.assignRole(
  '123e4567-e89b-12d3-a456-426614174000',
  'reviewer'
);

if (result.success) {
  console.log('Role assigned:', result.role, result.level);
} else {
  console.error('Failed:', result.error);
}
```

---

## Debugging Guide

### Common Issues

#### Issue 1: "Access Denied" for Admins

**Symptom:** Admin user sees "Access Denied" message on dashboard

**Causes:**

1. User not actually assigned admin role in database
2. RPC function failing to retrieve role
3. Timing issue — role check happening before auth ready

**Debug Steps:**

```javascript
// 1. Check if auth is ready
console.log('Auth ready:', window.AuthController.isAuthenticated());

// 2. Check current session
const session = window.AuthController.getSession();
console.log('Session:', session);

// 3. Check role from backend
const roleInfo = await window.AdminAuth.getUserRoleBackend();
console.log('Role info:', roleInfo);

// 4. Check is_admin result
const isAdmin = await window.AdminAuth.isAdminBackend();
console.log('Is admin:', isAdmin);
```

**Solution:**

```sql
-- Check user_roles table in Supabase SQL Editor
select 
  u.email,
  r.name as role_name,
  r.level as role_level
from auth.users u
left join public.user_roles ur on ur.user_id = u.id
left join public.roles r on r.id = ur.role_id
where u.email = 'your-email@example.com';

-- If no role assigned, assign it:
select assign_role(
  (select id from auth.users where email = 'your-email@example.com'),
  'admin'
);
```

---

#### Issue 2: Dashboard Not Loading Submissions

**Symptom:** Dashboard shows "No submissions found" but submissions exist

**Causes:**

1. RLS policies blocking query
2. User role not recognized by RLS policy
3. Query error not being caught

**Debug Steps:**

```javascript
// 1. Check Supabase client
const supabase = window.__supabase__;
console.log('Supabase:', supabase);

// 2. Try query with error logging
const { data, error } = await supabase
  .from('submissions')
  .select('*');

console.log('Data:', data);
console.log('Error:', error);

// 3. Check RLS policies in Supabase dashboard
// Go to: Database → Tables → submissions → RLS policies
```

**Solution:**

```sql
-- Check if RLS policies reference correct tables
-- Old policies might reference profiles.role instead of user_roles

-- Update policy to use new roles system:
drop policy if exists "admins and reviewers see all submissions" on submissions;

create policy "admins and reviewers see all submissions"
on submissions for select
using (
  exists (
    select 1 from user_roles ur
    join roles r on r.id = ur.role_id
    where ur.user_id = auth.uid() 
    and r.level >= 50  -- Reviewer level or higher
  )
);
```

---

#### Issue 3: Real-Time Updates Not Working

**Symptom:** Dashboard doesn't update when another admin makes changes

**Causes:**

1. Realtime not enabled on submissions table
2. Subscription not set up correctly
3. RLS policies blocking subscription

**Debug Steps:**

```javascript
// 1. Check if subscription is active
const supabase = getSupabase();
const channels = supabase.getChannels();
console.log('Active channels:', channels);

// 2. Test subscription
supabase
  .channel('test-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'submissions' },
    (payload) => console.log('Change detected:', payload)
  )
  .subscribe((status) => {
    console.log('Subscription status:', status);
  });
```

**Solution:**

1. **Enable Realtime in Supabase Dashboard:**
   - Go to Database → Replication
   - Enable replication for `submissions` table

2. **Check RLS policies allow subscription:**
   - Realtime respects RLS policies
   - Ensure user has SELECT permission on table

---

#### Issue 4: Role Assignment Not Working

**Symptom:** `assign_role()` returns error or success: false

**Causes:**

1. Current user not admin
2. Invalid role name
3. Target user doesn't exist

**Debug Steps:**

```javascript
// 1. Check if current user is admin
const isAdmin = await window.AdminAuth.isCurrentUserAdmin();
console.log('Is admin:', isAdmin);

// 2. Check available roles
const { data: roles } = await supabase
  .from('roles')
  .select('*');
console.log('Available roles:', roles);

// 3. Check if target user exists
const { data: user } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', targetUserId)
  .single();
console.log('Target user:', user);
```

**Solution:**

```javascript
// Use correct role name (lowercase)
const result = await window.AdminAuth.assignRole(
  targetUserId,
  'reviewer'  // ✅ Correct: lowercase
  // 'Reviewer' // ❌ Wrong: capitalized
);
```

---

### Debugging Tools

#### Enable Verbose Logging

```javascript
// In browser console
localStorage.setItem('DEBUG_ADMIN', 'true');
location.reload();
```

#### Check Auth State

```javascript
// Current session
console.log(window.AuthController.getSession());

// Is authenticated?
console.log(window.AuthController.isAuthenticated());

// Get role info
window.AdminAuth.getUserRoleBackend().then(console.log);

// Check admin status
window.AdminAuth.isCurrentUserAdmin().then(console.log);
```

#### Monitor Events

```javascript
// Listen to auth events
window.addEventListener('auth:ready', (e) => {
  console.log('auth:ready', e.detail);
});

window.addEventListener('auth-state-changed', (e) => {
  console.log('auth-state-changed', e.detail);
});
```

#### Inspect Database

```sql
-- Check user's role
select 
  u.email,
  r.name as role,
  r.level,
  ur.assigned_at
from auth.users u
left join user_roles ur on ur.user_id = u.id
left join roles r on r.id = ur.role_id
where u.email = 'user@example.com';

-- Check all admins
select 
  u.email,
  r.name as role,
  r.level
from auth.users u
join user_roles ur on ur.user_id = u.id
join roles r on r.id = ur.role_id
where r.level >= 100
order by u.email;

-- Check submission counts by status
select 
  status,
  count(*) as count
from submissions
group by status;
```

---

## Adding Admins & Reviewers

### Prerequisites

- You must be an admin to assign roles
- Target user must have an account (signed up at least once)
- You need the user's email or user ID

### Method 1: Using Supabase SQL Editor (Recommended)

**Step 1:** Get user ID from email

```sql
select id, email from auth.users where email = 'newadmin@example.com';
```

**Step 2:** Assign admin role

```sql
select assign_role(
  'user-id-from-step-1'::uuid,
  'admin'
);

-- Expected result: {"success": true, "role": "admin", "level": 100}
```

**Step 3:** Verify assignment

```sql
select 
  u.email,
  r.name as role,
  r.level
from auth.users u
join user_roles ur on ur.user_id = u.id
join roles r on r.id = ur.role_id
where u.email = 'newadmin@example.com';
```

### Method 2: Using Admin Dashboard (Future)

> **Note:** Role assignment UI not yet implemented in dashboard

**Planned Feature:**

```javascript
// Future implementation
async function addAdmin(userEmail) {
  // 1. Look up user by email
  const { data: user } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', userEmail)
    .single();

  if (!user) {
    alert('User not found');
    return;
  }

  // 2. Assign role
  const result = await window.AdminAuth.assignRole(user.id, 'admin');

  if (result.success) {
    alert('Admin role assigned successfully!');
  } else {
    alert('Failed: ' + result.error);
  }
}
```

### Method 3: Using Browser Console

**Step 1:** Sign in as existing admin

**Step 2:** Open browser console (F12)

**Step 3:** Run assignment function

```javascript
// Get user ID from email
const { data: user } = await window.__supabase__
  .from('profiles')
  .select('id, email')
  .eq('email', 'newadmin@example.com')
  .single();

console.log('User:', user);

// Assign admin role
const result = await window.AdminAuth.assignRole(user.id, 'admin');

console.log('Result:', result);
// { success: true, role: 'admin', level: 100 }
```

### Available Roles

| Role      | Level | Permissions                          |
|-----------|-------|--------------------------------------|
| user      | 10    | Upload submissions                   |
| reviewer  | 50    | Review/approve/reject submissions    |
| admin     | 100   | All permissions + role assignment    |

### Role Assignment Examples

**Assign reviewer:**

```sql
select assign_role(
  (select id from auth.users where email = 'reviewer@example.com'),
  'reviewer'
);
```

**Assign admin:**

```sql
select assign_role(
  (select id from auth.users where email = 'admin@example.com'),
  'admin'
);
```

**Downgrade admin to user:**

```sql
select assign_role(
  (select id from auth.users where email = 'formeradmin@example.com'),
  'user'
);
```

### Removing Roles

**Remove all roles (revert to default 'user'):**

```sql
delete from user_roles 
where user_id = (select id from auth.users where email = 'user@example.com');

-- Trigger will auto-assign 'user' role on next login
```

### Bulk Assignment

**Assign multiple users at once:**

```sql
-- Assign reviewer role to multiple users
do $$
declare
  user_email text;
begin
  for user_email in 
    select unnest(array[
      'reviewer1@example.com',
      'reviewer2@example.com',
      'reviewer3@example.com'
    ])
  loop
    perform assign_role(
      (select id from auth.users where email = user_email),
      'reviewer'
    );
  end loop;
end $$;
```

### Security Notes

- ✅ Only admins can assign roles
- ✅ Role assignments are logged (assigned_by, assigned_at)
- ✅ Users can only have one primary role at a time
- ✅ Assigning new role removes old role
- ⚠️ Be careful when assigning admin role — full access granted

---

## Future Improvements

**Planned for Post-Phase 9.2:**

1. **Role Assignment UI** — Add admin interface for managing user roles
2. **Activity Logs** — Track all admin actions (who approved what, when)
3. **Bulk Actions** — Approve/reject multiple submissions at once
4. **Advanced Filters** — Filter by date, paper code, reviewer, etc.
5. **Reviewer Workload** — Show stats per reviewer
6. **Automated Reviews** — AI-assisted quality checks (ai_reviewer role)
7. **Reviewer Notes Templates** — Common rejection/approval reasons
8. **Export Dashboard Data** — CSV export of submissions
9. **Email Notifications** — Notify users when their submission is reviewed
10. **Audit Trail** — Complete history of all changes to submissions

---

## Support

**For Issues:**

1. Check [Debugging Guide](#debugging-guide)
2. Review [AUTH_SYSTEM.md](./AUTH_SYSTEM.md) for auth issues
3. Check Supabase dashboard logs (Database → Logs)
4. Verify RLS policies are correct
5. Open GitHub issue with full error logs

**Key Files:**

- `admin/dashboard.js` — Dashboard logic
- `js/auth-controller.js` — Role verification
- `js/admin-auth.js` — Backend helpers
- `admin/sql/05_roles_system.sql` — Database schema
- `admin/sql/02_submissions_table.sql` — Submissions schema

**Useful SQL Queries:**

```sql
-- Check all admins
select u.email, r.name, r.level
from auth.users u
join user_roles ur on ur.user_id = u.id
join roles r on r.id = ur.role_id
where r.level >= 100;

-- Check pending submissions
select paper_code, exam_year, status, created_at
from submissions
where status = 'pending'
order by created_at desc;

-- Check reviewer activity
select 
  u.email as reviewer,
  count(*) as reviewed_count
from submissions s
join auth.users u on u.id = s.reviewer_id
where s.reviewer_id is not null
group by u.email
order by reviewed_count desc;
```

---

## Summary

The ExamArchive admin system provides:

- ✅ **Secure, backend-verified role checking** via `requireRole()`
- ✅ **Real-time dashboard** with live submission updates
- ✅ **Complete review workflow** (approve, reject, publish, delete)
- ✅ **Multi-stage storage** with RLS-enforced access control
- ✅ **Hierarchical role system** with flexible permissions
- ✅ **Audit trail** of all review actions
- ✅ **Easy role assignment** via SQL or (future) UI

**Remember:** Frontend NEVER decides permissions — backend is always the authority.
