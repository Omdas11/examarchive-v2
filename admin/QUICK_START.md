# Phase 8 - Quick Reference

## What Was Built

### Core System
1. **Role Management** - 4 roles (guest, user, reviewer, admin) with permissions
2. **Admin Dashboard** - Complete moderation interface with real-time updates
3. **Upload System** - PDF upload with tracking and status management
4. **Storage Workflow** - Three-bucket system (temp → approved → public)
5. **Profile Badges** - Role-based badges displayed in user profiles

### Database
- `profiles` table - User roles and badges
- `submissions` table - Upload lifecycle tracking
- RLS policies on all tables
- Auto-create profile on signup trigger

### Storage
- `uploads-temp` - Private bucket for user uploads
- `uploads-approved` - Private bucket for approved files
- `uploads-public` - Public bucket for published PDFs
- RLS policies for access control

## Quick Start

### 1. Setup Supabase (5 minutes)
```sql
-- Run these SQL files in order:
admin/sql/01_profiles_table.sql
admin/sql/02_submissions_table.sql
admin/sql/04_storage_policies.sql
```

### 2. Create Buckets (2 minutes)
Go to Supabase Dashboard → Storage → New Bucket:
- Create: `uploads-temp` (private, 50MB limit, PDF only)
- Create: `uploads-approved` (private, 50MB limit, PDF only)
- Create: `uploads-public` (public, 50MB limit, PDF only)

### 3. Make Yourself Admin (1 minute)
```sql
UPDATE profiles 
SET role = 'admin', badge = 'Admin' 
WHERE email = 'your@email.com';
```

### 4. Test It (5 minutes)
1. Sign in to the app
2. Go to `/upload.html` and upload a test PDF
3. Go to `/admin/dashboard.html` (should see your upload)
4. Click "Approve & Publish"
5. Verify public URL is generated

## File Organization

```
Phase 8 Files
├── Database (admin/sql/)
│   ├── 01_profiles_table.sql       ← Run first
│   ├── 02_submissions_table.sql    ← Run second
│   ├── 03_storage_buckets.sql      ← Reference only
│   └── 04_storage_policies.sql     ← Run third
│
├── Core Logic (js/)
│   ├── roles.js                    ← Role utilities
│   ├── supabase-client.js          ← Storage helpers
│   ├── upload-handler.js           ← Upload logic
│   ├── upload.js                   ← Upload page (updated)
│   └── profile-panel.js            ← Badges (updated)
│
├── Admin Dashboard (admin/)
│   ├── dashboard.html              ← Admin UI
│   ├── dashboard.js                ← Dashboard logic
│   └── dashboard.css               ← Styling
│
└── Documentation (admin/)
    ├── SETUP.md                    ← Full setup guide
    ├── README.md                   ← Feature docs
    └── IMPLEMENTATION.md           ← Technical summary
```

## Key Functions

### Role Checking (js/roles.js)
```javascript
import { isAdmin, getUserRole, hasPermission } from './roles.js';

// Check if user is admin
const admin = await isAdmin(); // true/false

// Get user's role
const role = await getUserRole(); // 'admin', 'user', etc.

// Check permission
const canApprove = await hasPermission('approve_reject'); // true/false
```

### Upload File (js/upload-handler.js)
```javascript
import { handlePaperUpload } from './upload-handler.js';

const result = await handlePaperUpload(
  file,
  { paperCode: 'PHYDSC102T', examYear: 2023 },
  (progress) => console.log(`${progress}%`)
);

if (result.success) {
  console.log('Uploaded!', result.submissionId);
}
```

### Storage Operations (js/supabase-client.js)
```javascript
import { moveFile, getPublicUrl, BUCKETS } from './supabase-client.js';

// Move file between buckets
await moveFile(
  BUCKETS.TEMP, 'user-id/file.pdf',
  BUCKETS.PUBLIC, 'papers/file.pdf'
);

// Get public URL
const url = getPublicUrl('papers/file.pdf');
```

## Common Tasks

### Add Admin User
```sql
UPDATE profiles 
SET role = 'admin', badge = 'Admin' 
WHERE email = 'admin@example.com';
```

### Add Reviewer
```sql
UPDATE profiles 
SET role = 'reviewer', badge = 'Moderator' 
WHERE email = 'reviewer@example.com';
```

### Check Pending Submissions
```sql
SELECT * FROM submissions 
WHERE status = 'pending' 
ORDER BY created_at DESC;
```

### View All Admin Users
```sql
SELECT email, role, badge, created_at 
FROM profiles 
WHERE role = 'admin';
```

### Delete Test Submissions
```sql
DELETE FROM submissions 
WHERE user_id = 'test-user-id';
```

## Workflow

### User Perspective
1. Sign in with Google
2. Go to Upload page
3. Enter paper code and year
4. Select PDF file
5. Click "Upload Paper"
6. See status: "⏳ Pending Review"
7. Wait for admin approval
8. Status changes to "🌐 Published" when approved

### Admin Perspective
1. Sign in with admin account
2. Go to Admin Dashboard
3. See pending submissions with details
4. Click submission to review
5. Click "Approve & Publish" or "Reject"
6. File automatically moves to public bucket
7. Public URL generated
8. User sees updated status

## Troubleshooting

### "Access Denied" on Dashboard
→ User needs admin role in profiles table

### Upload Fails
→ Check storage buckets exist and policies are applied

### No Submissions Showing
→ Verify RLS policies on submissions table

### Profile Not Created
→ Trigger may not be working, create manually:
```sql
INSERT INTO profiles (id, email, role, badge)
VALUES ('user-uuid', 'user@email.com', 'user', 'Contributor');
```

### Storage Policy Error
→ Re-run `admin/sql/04_storage_policies.sql`

## Security Checklist

- [x] RLS enabled on profiles table
- [x] RLS enabled on submissions table
- [x] Storage policies applied to all buckets
- [x] Admin checks on dashboard page
- [x] Auth required for uploads
- [x] Users can only see own submissions
- [x] Admins verified before approve/reject

## Next Steps After Setup

1. **Test Everything**
   - Upload a PDF as regular user
   - Review it as admin
   - Verify public URL works

2. **Create More Admins** (if needed)
   - Update profiles table with admin role

3. **Monitor Submissions**
   - Check dashboard regularly
   - Review pending uploads

4. **Plan Phase 9**
   - GitHub Actions integration
   - Email notifications
   - Bulk operations

## Resources

- **Full Setup**: `admin/SETUP.md`
- **Features**: `admin/README.md`
- **Technical**: `admin/IMPLEMENTATION.md`
- **Supabase Docs**: https://supabase.com/docs

## Support

If something doesn't work:
1. Check browser console for errors
2. Verify SQL migrations ran successfully
3. Confirm storage buckets exist
4. Check RLS policies are active
5. Review Supabase logs in dashboard

---

**Last Updated**: 2026-01-30  
**Phase**: 8 - Complete  
**Status**: Ready for Production Setup
