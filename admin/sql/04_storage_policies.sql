-- ============================================
-- STORAGE BUCKET POLICIES
-- Two-bucket system: uploads-temp, uploads-approved
-- ============================================

-- ==========================================
-- BUCKET: uploads-temp (private)
-- ==========================================

-- Authenticated users can upload to temp
create policy "authenticated users upload temp"
on storage.objects for insert
with check (
  bucket_id = 'uploads-temp'
  and auth.role() = 'authenticated'
);

-- Authenticated users can read temp uploads
create policy "authenticated users read temp"
on storage.objects for select
using (
  bucket_id = 'uploads-temp'
  and auth.role() = 'authenticated'
);

-- ==========================================
-- BUCKET: uploads-approved (public read)
-- ==========================================
-- Public read is handled by bucket visibility — no SELECT policy needed.

-- Only reviewer+ (level >= 50) can insert into approved bucket
create policy "reviewers insert approved"
on storage.objects for insert
with check (
  bucket_id = 'uploads-approved'
  and get_current_user_role_level() >= 50
);
