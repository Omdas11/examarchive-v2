-- ============================================
-- STORAGE BUCKET POLICIES
-- RLS for three-bucket upload workflow
-- ============================================

-- ==========================================
-- BUCKET: uploads-temp
-- ==========================================

-- Authenticated users can upload to temp
create policy "authenticated users upload temp"
on storage.objects for insert
with check (
  bucket_id = 'uploads-temp'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can read their own temp uploads
create policy "users read own temp uploads"
on storage.objects for select
using (
  bucket_id = 'uploads-temp'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins can read all temp uploads
create policy "admins read all temp uploads"
on storage.objects for select
using (
  bucket_id = 'uploads-temp'
  and exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  )
);

-- Users can delete their own temp uploads
create policy "users delete own temp uploads"
on storage.objects for delete
using (
  bucket_id = 'uploads-temp'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins can delete any temp upload
create policy "admins delete temp uploads"
on storage.objects for delete
using (
  bucket_id = 'uploads-temp'
  and exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  )
);

-- ==========================================
-- BUCKET: uploads-approved
-- ==========================================

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

-- Admins can read approved uploads
create policy "admins read approved"
on storage.objects for select
using (
  bucket_id = 'uploads-approved'
  and exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  )
);

-- Admins can delete from approved bucket
create policy "admins delete approved"
on storage.objects for delete
using (
  bucket_id = 'uploads-approved'
  and exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  )
);

-- ==========================================
-- BUCKET: uploads-public
-- ==========================================

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

-- Anyone can read public uploads (public bucket)
-- No policy needed - handled by bucket visibility

-- Admins can delete from public bucket
create policy "admins delete public"
on storage.objects for delete
using (
  bucket_id = 'uploads-public'
  and exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  )
);
