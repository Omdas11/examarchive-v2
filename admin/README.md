# Admin Review & Workflow

**Status**: ✅ Implemented (Phase 8)

This directory contains **admin dashboard, review workflows, and database setup** for Phase 8.

## Purpose

Phase 8 implements a complete content moderation system:
- **Role-based access control** (guest, user, reviewer, admin)
- **Admin dashboard** for reviewing submissions
- **Three-bucket storage workflow** (temp → approved → public)
- **Upload tracking** via submissions table
- **Supabase Storage integration** with 50GB+ support

## Structure

```
admin/
├── README.md              # This file
├── SETUP.md              # Supabase setup instructions
├── dashboard.html        # Admin moderation interface
├── dashboard.js          # Dashboard logic
├── dashboard.css         # Dashboard styling
├── sql/                  # Database migrations
│   ├── 01_profiles_table.sql
│   ├── 02_submissions_table.sql
│   ├── 03_storage_buckets.sql
│   └── 04_storage_policies.sql
└── review-queues/        # Legacy (replaced by submissions table)
    └── README.md
```

## Features

### Role System
- **Guest**: View public content only
- **User**: Upload PDFs (pending review)
- **Reviewer**: Review and comment on submissions
- **Admin**: Approve/reject, publish, delete, manage users

### Upload Workflow
```
User Upload → Temp Storage → Admin Review → Approved/Rejected → Published/Deleted
```

### Admin Dashboard
- View pending submissions
- Review submission details
- Approve and publish to public storage
- Reject with optional feedback
- Real-time updates via Supabase subscriptions

### Storage Buckets
1. **uploads-temp**: Private bucket for pending uploads
2. **uploads-approved**: Private bucket for approved pre-publish
3. **uploads-public**: Public bucket for published PDFs

## Access Control

### Dashboard Access
- URL: `/admin/dashboard.html`
- **Restricted to**: Admin role only
- **Auth check**: Runs on page load via `isAdmin()`

### Permissions
- Enforced via **Supabase RLS policies**
- Client-side UI gating for UX
- Server-side validation via database policies

## Setup

See **[SETUP.md](./SETUP.md)** for complete setup instructions including:
1. Running SQL migrations
2. Creating storage buckets
3. Applying RLS policies
4. Creating admin users
5. Testing the workflow

## Database Schema

### Profiles Table
Stores user roles and badges:
```sql
- id (uuid, PK)
- email (text)
- role (text): guest | user | reviewer | admin
- badge (text): Contributor | Moderator | Admin
- created_at, updated_at
```

### Submissions Table
Tracks upload lifecycle:
```sql
- id (uuid, PK)
- user_id (uuid, FK)
- original_filename, file_size, content_type
- temp_path, approved_path, public_path, public_url
- paper_code, paper_name, exam_year
- status: pending | approved | rejected | published
- reviewer_id, review_notes, rejection_reason
- created_at, reviewed_at, published_at
```

## Integration

### Frontend Files
- `js/roles.js` - Role checking utilities
- `js/supabase-client.js` - Storage helpers
- `js/upload-handler.js` - Upload logic
- `js/upload.js` - Upload page
- `js/profile-panel.js` - Badge display

### Workflow States
```
draft → pending → [approved | rejected] → published
```

### Security
- **RLS enabled** on all tables
- **Storage policies** restrict bucket access
- **Admin verification** required before publish
- **Audit trail** via submission timestamps

## Usage

### As Admin
1. Sign in with admin account
2. Navigate to `/admin/dashboard.html`
3. Review pending submissions
4. Click "Approve & Publish" or "Reject"
5. Published files appear with public URLs

### As User
1. Sign in
2. Go to `/upload.html`
3. Fill paper details and select PDF
4. Upload and track status
5. Wait for admin review

## Monitoring

### Dashboard Stats
- Pending count
- Approved count
- Published count
- Rejected count

### Real-time Updates
Dashboard automatically refreshes when:
- New submissions are created
- Submissions are approved/rejected
- Files are published

## Future Enhancements (Phase 9+)

- Bulk approve/reject
- Auto-tag suggestions via AI
- Advanced search/filtering
- Email notifications
- GitHub Action integration for papers.json
- User reputation system

## Security Notes

1. **Never commit** admin credentials
2. **RLS policies** are primary security
3. **Client-side checks** are for UX only
4. **Review all uploads** before publishing
5. **Monitor admin activity** regularly

---

**Created**: 2026-01-30 (Phase 7)  
**Implemented**: 2026-01-30 (Phase 8)  
**Status**: ✅ Production Ready
