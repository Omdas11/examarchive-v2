-- ============================================
-- STORAGE BUCKETS SETUP
-- Two-bucket system for upload workflow
-- ============================================

-- NOTE: Buckets must be created via Supabase Dashboard or API.
-- This file documents the required bucket configuration.

/*
REQUIRED BUCKETS:

1. uploads-temp
   - Visibility: private
   - Purpose: User uploads pending review
   - File size limit: 50MB
   - Allowed MIME types: application/pdf

2. uploads-approved
   - Visibility: public
   - Purpose: Approved papers, publicly readable
   - File size limit: 50MB
   - Allowed MIME types: application/pdf

3. avatars
   - Visibility: public
   - Purpose: User profile photos
   - File size limit: 2MB
   - Allowed MIME types: image/png, image/jpeg, image/webp
   - Path structure: avatars/{user_id}.{png|jpg|webp}
   - RLS: Authenticated users can upload/update their own avatar

TO CREATE BUCKETS:
1. Go to Supabase Dashboard → Storage
2. Create each bucket with the settings above
3. Then apply the policies in 04_storage_policies.sql
*/
