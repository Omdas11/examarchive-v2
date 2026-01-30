-- ============================================
-- STORAGE BUCKETS SETUP
-- Three-bucket system for upload workflow
-- ============================================

-- NOTE: Buckets must be created via Supabase Dashboard or API
-- This file documents the required bucket configuration

/*
REQUIRED BUCKETS:

1. uploads-temp
   - Visibility: private
   - Purpose: User uploads pending review
   - File size limit: 50MB
   - Allowed MIME types: application/pdf

2. uploads-approved
   - Visibility: private
   - Purpose: Admin-approved PDFs (pre-publish)
   - File size limit: 50MB
   - Allowed MIME types: application/pdf

3. uploads-public
   - Visibility: public
   - Purpose: Final published PDFs
   - File size limit: 50MB
   - Allowed MIME types: application/pdf

TO CREATE BUCKETS:
1. Go to Supabase Dashboard → Storage
2. Create each bucket with settings above
3. Then apply the policies below
*/
