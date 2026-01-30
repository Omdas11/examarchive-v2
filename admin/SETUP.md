# Phase 8 Supabase Setup Guide

This guide walks you through setting up Supabase for Phase 8: Admin, Roles, Review Workflow & Storage Integration.

## Prerequisites

- Supabase project created
- Supabase URL and anon key configured in `js/supabase.js`
- Admin access to Supabase Dashboard

## Step 1: Run SQL Migrations

Execute the SQL files in order via Supabase SQL Editor:

### 1.1 Create Profiles Table
```bash
# File: admin/sql/01_profiles_table.sql
```
This creates:
- `profiles` table with roles (guest, user, reviewer, admin)
- RLS policies for profile access
- Trigger to auto-create profiles on user signup
- Updated_at timestamp function

### 1.2 Create Submissions Table
```bash
# File: admin/sql/02_submissions_table.sql
```
This creates:
- `submissions` table for tracking upload lifecycle
- Indexes for performance
- RLS policies for submission access
- User and admin access controls

### 1.3 Create Storage Buckets

Go to **Supabase Dashboard → Storage** and create 3 buckets:

#### Bucket 1: `uploads-temp`
- **Visibility**: Private
- **Purpose**: User uploads pending review
- **File size limit**: 50MB
- **Allowed MIME types**: application/pdf

#### Bucket 2: `uploads-approved`
- **Visibility**: Private
- **Purpose**: Admin-approved PDFs (pre-publish)
- **File size limit**: 50MB
- **Allowed MIME types**: application/pdf

#### Bucket 3: `uploads-public`
- **Visibility**: Public
- **Purpose**: Final published PDFs
- **File size limit**: 50MB
- **Allowed MIME types**: application/pdf

### 1.4 Apply Storage Policies
```bash
# File: admin/sql/04_storage_policies.sql
```
This creates RLS policies for:
- Authenticated users uploading to temp bucket
- Users reading their own temp uploads
- Admins managing all buckets
- Public read access to public bucket (via bucket visibility)

## Step 2: Create Admin User

After running migrations, manually set admin role for your user:

```sql
-- Replace with your actual user email
UPDATE profiles
SET role = 'admin', badge = 'Admin'
WHERE email = 'your-email@example.com';
```

Or get your user ID and update:
```sql
-- Get your user ID from auth.users
SELECT id, email FROM auth.users;

-- Update role
UPDATE profiles
SET role = 'admin', badge = 'Admin'
WHERE id = 'your-user-id-here';
```

## Step 3: Verify Setup

### 3.1 Test Database Access
```sql
-- Check profiles table
SELECT * FROM profiles LIMIT 5;

-- Check submissions table
SELECT * FROM submissions LIMIT 5;
```

### 3.2 Test Storage Buckets
Go to **Storage** in Supabase Dashboard and verify all 3 buckets exist.

### 3.3 Test Application

1. **Sign in** to the application
2. **Check Profile Panel** - You should see your role badge
3. **Access Admin Dashboard** - Navigate to `/admin/dashboard.html`
4. **Try Upload** - Go to `/upload.html` and upload a PDF

## Step 4: Role Management

### Grant Admin Access
```sql
UPDATE profiles
SET role = 'admin', badge = 'Admin'
WHERE email = 'user@example.com';
```

### Grant Reviewer Access
```sql
UPDATE profiles
SET role = 'reviewer', badge = 'Moderator'
WHERE email = 'reviewer@example.com';
```

### Revoke Special Access (back to user)
```sql
UPDATE profiles
SET role = 'user', badge = 'Contributor'
WHERE email = 'user@example.com';
```

## Step 5: Test Upload Workflow

### As Regular User:
1. Sign in
2. Go to Upload page
3. Upload a PDF with paper code and year
4. Check your submissions list

### As Admin:
1. Sign in with admin account
2. Go to Admin Dashboard
3. See pending submissions
4. Approve or reject submissions
5. Check that approved files are published

## Troubleshooting

### Issue: "RLS policy violation"
- **Cause**: User doesn't have a profile or wrong role
- **Fix**: Check `profiles` table and ensure user has correct role

### Issue: "Storage upload failed"
- **Cause**: Bucket doesn't exist or policies not applied
- **Fix**: Verify buckets exist and run storage policies SQL

### Issue: "Can't access admin dashboard"
- **Cause**: User role is not 'admin'
- **Fix**: Update user role in profiles table

### Issue: "Profile not created on signup"
- **Cause**: Trigger not working
- **Fix**: Manually create profile or re-run profiles SQL migration

## Security Notes

1. **Never expose admin credentials** in code
2. **RLS policies enforce access** at database level
3. **Storage policies** prevent unauthorized uploads
4. **Review all submissions** before publishing
5. **Monitor admin actions** via audit logs (future)

## Next Steps

After setup is complete:

1. Test the full upload workflow
2. Create test submissions as regular user
3. Review and approve as admin
4. Verify public URLs work
5. Check role badges display correctly

## Support

For issues or questions:
- Check Supabase logs in Dashboard
- Review browser console for errors
- Verify SQL migrations ran successfully
- Check RLS policies are active

---

**Phase 8 Setup Complete** ✅

You now have:
- ✓ Role-based access control
- ✓ Admin dashboard
- ✓ Upload workflow with review
- ✓ Three-bucket storage system
- ✓ Public PDF hosting
