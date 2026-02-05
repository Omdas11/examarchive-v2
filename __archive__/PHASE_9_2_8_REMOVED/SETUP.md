# Setup Guide

> Derived from [Architecture Master Plan](ARCHITECTURE_MASTER_PLAN.md)

## Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Static file server for local development
- Supabase account (for backend setup)

## Local Development

### Option 1: Python HTTP Server

```bash
cd examarchive-v2
python -m http.server 8000
```

Open `http://localhost:8000`

### Option 2: Node.js HTTP Server

```bash
npx serve .
```

### Option 3: VS Code Live Server

Install the "Live Server" extension and click "Go Live".

## Supabase Configuration

The application connects to Supabase using credentials in `js/supabase.js`:

```javascript
const SUPABASE_URL = "https://your-project.supabase.co";
const SUPABASE_ANON_KEY = "your-anon-key";
```

### Required Supabase Setup

1. **Authentication**
   - Enable Google OAuth provider
   - Set authorized redirect URL to your domain

2. **Database Tables**
   - `profiles` - User profile information
   - `submissions` - Paper submissions
   - `user_roles` - Role assignments

3. **Storage Buckets**
   - `uploads-temp` - Pending uploads
   - `uploads-approved` - Approved papers
   - `uploads-public` - Published papers (public read)

4. **RLS Policies**
   - Enable Row Level Security on all tables
   - Configure policies per [Security Model](SECURITY_MODEL.md)

5. **RPC Functions**
   - `is_admin(user_id_param)` - Check admin status
   - `is_current_user_admin()` - Check current user admin status
   - `get_user_role_name(user_id_param)` - Get user role name
   - `get_user_role_level(user_id_param)` - Get user role level
   - `assign_role(target_user_id, role_name_param)` - Assign role

## File Structure

See [Architecture Master Plan - File Structure Reference](ARCHITECTURE_MASTER_PLAN.md#file-structure-reference)

## Deployment

The application is deployed to GitHub Pages automatically on push to main branch.

For custom domain setup:
1. Add `CNAME` file with your domain
2. Configure DNS to point to GitHub Pages
3. Enable HTTPS in repository settings

## Troubleshooting

### "Bootstrap not loaded" error
Ensure `bootstrap.js` is the first script loaded on the page.

### Authentication not working
Check that the Supabase URL and anon key are correct in `js/supabase.js`.

### Admin dashboard access denied
Verify the user has admin or reviewer role in the `user_roles` table.

---

*Reference: [Architecture Master Plan](ARCHITECTURE_MASTER_PLAN.md) - Sections 1, 2*
