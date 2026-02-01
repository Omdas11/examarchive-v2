# ARCHITECTURE OVERVIEW

**Phase 9.2 — ExamArchive Architecture Documentation**

---

## 🏗️ System Architecture

ExamArchive follows a **Static Frontend + Supabase Backend** architecture model.

### Core Principle

> **Backend is the source of truth for all authentication, authorization, and data operations.**

The frontend is a **static HTML/CSS/JavaScript application** that communicates with Supabase services exclusively through the Supabase JavaScript client library.

---

## 🔄 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER'S BROWSER                           │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Static Frontend (HTML/CSS/JS)                │  │
│  │  • No backend server                                 │  │
│  │  • Pure client-side rendering                        │  │
│  │  • Zero server-side logic                            │  │
│  └───────────────────┬──────────────────────────────────┘  │
│                      │                                      │
│                      │  Supabase JS Client                  │
│                      │  (Single Instance)                   │
│                      ▼                                      │
└──────────────────────┼──────────────────────────────────────┘
                       │
                       │  HTTPS/WSS
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  SUPABASE BACKEND                           │
│                                                             │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────────┐  │
│  │   Auth     │  │  Database  │  │      Storage         │  │
│  │  (Goture)  │  │ (Postgres) │  │  (File Uploads)      │  │
│  └────────────┘  └────────────┘  └──────────────────────┘  │
│         │               │                    │              │
│         └───────────────┼────────────────────┘              │
│                         │                                   │
│            ┌────────────▼────────────────┐                  │
│            │   Row Level Security (RLS)  │                  │
│            │   • Enforced on ALL queries │                  │
│            │   • Uses auth.uid()         │                  │
│            │   • No frontend bypass      │                  │
│            └─────────────────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication & Authorization Flow

### 1. Authentication (Auth)

```
User Action (Sign In/Sign Up)
    ↓
Supabase Auth Service
    ↓
JWT Token Generated
    ↓
Session Created & Stored
    ↓
Frontend Uses Session for All Requests
```

**Key Points:**
- Supabase Auth handles all user authentication
- Uses OAuth 2.0 / PKCE flow for security
- JWT tokens are automatically refreshed
- Session persists in browser storage (secure)

### 2. Role Assignment

```
User Signs In
    ↓
Backend Function: get_or_create_profile()
    ↓
Check user_roles Table
    ↓
Assign Default Role: 'user'
    ↓
Store in user_roles Table
```

**Role Hierarchy:**
- **visitor** (level 0): Unauthenticated/default
- **user** (level 1): Authenticated, basic access
- **reviewer** (level 2): Can review submissions
- **admin** (level 3): Full system access

### 3. Authorization (RLS)

```
Frontend Makes Request
    ↓
Supabase Client Adds JWT Header
    ↓
Database Checks RLS Policies
    ↓
RLS Uses auth.uid() for Verification
    ↓
ALLOW or DENY Query
```

**RLS Rules:**
- **Uploads**: User must be authenticated (`auth.uid() IS NOT NULL`)
- **Submissions**: Users see only their own submissions
- **Admin Functions**: Verified via `is_admin()` or `is_current_user_admin()` functions
- **Storage**: Bucket policies enforce authenticated uploads to temp bucket

---

## 📂 Storage Flow

### Upload Workflow

```
User Selects File
    ↓
Frontend Validates (PDF, size < 50MB)
    ↓
CRITICAL: Wait for Session (auth.getSession())
    ↓
Upload to uploads-temp Bucket
    ↓
Create Submission Record in DB
    ↓
Status: 'pending'
```

### Admin Review Workflow

```
Admin Reviews Submission
    ↓
APPROVE: Move to uploads-public
    ↓
Update Status: 'published'
    ↓
Generate Public URL
    
    OR
    
REJECT: Delete from uploads-temp
    ↓
Update Status: 'rejected'
```

### Storage Buckets

1. **uploads-temp**: Temporary storage for pending submissions
   - RLS: Authenticated users can upload
   - RLS: Only file owner and admins can read

2. **uploads-public**: Public files (approved papers)
   - RLS: Public read access
   - RLS: Only admins can write

---

## 🔑 Why Backend is Source of Truth

### ❌ Frontend CANNOT Be Trusted

1. **JavaScript is Visible**: Users can read all frontend code
2. **Browser Tools**: Users can modify variables, bypass checks
3. **API Requests**: Users can craft custom requests outside the app

### ✅ Backend is Secure

1. **RLS Enforcement**: Postgres enforces policies on EVERY query
2. **JWT Verification**: Supabase verifies tokens server-side
3. **Function Security**: Database functions run with elevated privileges when needed
4. **No Bypass**: Even admin users go through RLS

### Example: Admin Check

**❌ WRONG: Frontend-only check**
```javascript
// This can be bypassed!
if (localStorage.getItem('isAdmin') === 'true') {
  showAdminPanel();
}
```

**✅ CORRECT: Backend verification**
```javascript
// Call backend function
const { data } = await supabase.rpc('is_current_user_admin');
if (data === true) {
  showAdminPanel();
}

// Backend RLS ALSO enforces on queries:
const { data } = await supabase.from('submissions').select('*');
// Returns only what user is allowed to see
```

---

## 🧩 Key Components

### Frontend Components

1. **Supabase Client** (`js/supabase.js`)
   - Single instance created once
   - Configured with auth persistence
   - Used by ALL modules

2. **Auth Module** (`js/common.js`, `js/auth.js`)
   - Session management
   - UI synchronization
   - Auth state listeners

3. **Upload Handler** (`js/upload-handler.js`)
   - File validation
   - Storage upload
   - Submission creation

4. **Admin Dashboard** (`admin/dashboard.js`)
   - Review interface
   - File operations (approve/reject)
   - Only accessible to admins (verified by backend)

5. **Debug System** (`js/debug/`)
   - Logger for diagnostics
   - Panel for admin/reviewer only
   - Human-readable messages

### Backend Components

1. **Database Tables**
   - `profiles`: User metadata
   - `user_roles`: Role assignments
   - `submissions`: Upload tracking

2. **Database Functions**
   - `is_admin()`: Check if user is admin
   - `is_current_user_admin()`: Check current session
   - `get_user_role_name()`: Get role name
   - `assign_role()`: Admin-only role assignment

3. **RLS Policies**
   - Defined in `admin/sql/` files
   - Enforce security at database level
   - Cannot be bypassed by frontend

4. **Storage Policies**
   - Bucket-level access control
   - Separate policies for temp/public buckets
   - Enforce authenticated uploads

---

## 🛡️ Security Model

### Defense in Depth

1. **Frontend Validation**: User experience (fast feedback)
2. **Client Library**: Adds JWT automatically
3. **RLS Policies**: Enforces authorization (CRITICAL)
4. **Storage Policies**: Controls file access
5. **Database Functions**: Server-side logic

### Trust Boundaries

```
┌─────────────────────┐
│  UNTRUSTED ZONE     │  ← Frontend, User Browser
├─────────────────────┤
│  NETWORK BOUNDARY   │  ← HTTPS/WSS, JWT verification
├─────────────────────┤
│  TRUSTED ZONE       │  ← Supabase Backend, RLS, Functions
└─────────────────────┘
```

**Rule**: Never trust data from the untrusted zone. Always verify in the trusted zone.

---

## 🔄 Session Management

### Session Lifecycle

1. **Create**: User signs in → JWT issued
2. **Persist**: Stored in browser (secure, httpOnly-like)
3. **Refresh**: Auto-refreshed before expiry
4. **Use**: Attached to all Supabase requests
5. **Destroy**: User signs out → JWT invalidated

### Session Verification

**Always use:**
```javascript
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  // User not authenticated
}
```

**Never use:**
- `localStorage` to store role/admin status manually
- Frontend flags to determine permissions
- Client-side role checks without backend verification

---

## 📡 Real-Time Features

Supabase provides real-time subscriptions via WebSockets:

```javascript
const channel = supabase
  .channel('submissions-changes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'submissions' },
    (payload) => {
      // React to changes
    }
  )
  .subscribe();
```

**Used For:**
- Live dashboard updates
- Submission status changes
- Collaborative features (future)

---

## 🚀 Deployment

### Static Site Hosting

ExamArchive frontend can be hosted on:
- GitHub Pages (current)
- Netlify
- Vercel
- Cloudflare Pages
- Any static file host

**Requirements:**
- HTTPS enabled
- Correct CORS configuration
- No server-side processing needed

### Configuration

Only one configuration file needed:
- `js/supabase.js`: Supabase URL and anon key

**Environment Variables**: Not needed (static site), but keys should be public anon keys with RLS protection.

---

## 🐛 Debugging

### Debug System (Phase 9.2)

1. **Debug Logger** (`js/debug/logger.js`)
   - Structured logging with levels (INFO, WARN, ERROR)
   - Module-based categorization
   - Console output with color coding

2. **Debug Panel** (`js/debug/panel.js`)
   - Visual interface for admins/reviewers
   - Real-time log display
   - Filter by module/level
   - Mobile-friendly

3. **Usage**
   ```javascript
   import { logInfo, logError, DebugModule } from './debug/logger.js';
   
   logInfo(DebugModule.UPLOAD, 'File upload started');
   logError(DebugModule.AUTH, 'Session verification failed');
   ```

---

## 📋 Best Practices

### DO ✅

1. **Always verify sessions before sensitive operations**
2. **Use backend functions for role checks**
3. **Log errors with context for debugging**
4. **Follow existing patterns (don't reinvent)**
5. **Test with both user and admin accounts**

### DON'T ❌

1. **Never trust frontend-only checks**
2. **Never bypass RLS "for convenience"**
3. **Never hardcode roles in frontend**
4. **Never store sensitive data in localStorage**
5. **Never create multiple Supabase clients**

---

## 🔮 Future Considerations

### Scalability

- Static frontend scales infinitely (CDN)
- Supabase backend scales automatically
- Database can be upgraded as needed

### Security

- Regular dependency updates
- Supabase security patches auto-applied
- Periodic RLS policy review

### Features

- New features require backend changes first
- Frontend adapts to backend capabilities
- RLS policies define what's possible

---

## 📚 Related Documentation

- [FILE_MAP.md](./FILE_MAP.md) - Detailed file reference
- [UPLOAD_FLOW.md](./UPLOAD_FLOW.md) - Upload process explained
- [DEBUG_SYSTEM_GUIDE.md](./DEBUG_SYSTEM_GUIDE.md) - Debug tools usage
- [ROLE_SYSTEM.md](./ROLE_SYSTEM.md) - Role hierarchy and management

---

**Last Updated**: Phase 9.2  
**Architecture Version**: Static Frontend + Supabase Backend (v1)
