-- ============================================
-- PHASE 6: APPWRITE STORAGE MIGRATION
-- Adds Appwrite storage columns to submissions table.
-- File storage migrated from Supabase Storage to Appwrite.
-- Supabase retains Auth, DB, RLS, Roles, RPC.
-- ============================================

-- Add appwrite_file_id column to store the Appwrite file ID
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS appwrite_file_id text;

-- Add file_url column to store the direct Appwrite view URL
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS file_url text;

-- Column comments
COMMENT ON COLUMN submissions.appwrite_file_id IS 'Appwrite Storage file ID (Phase 6 migration)';
COMMENT ON COLUMN submissions.file_url IS 'Direct Appwrite file view URL (Phase 6 migration)';

-- Index for faster lookups by appwrite_file_id (e.g. for rollback / delete)
CREATE INDEX IF NOT EXISTS submissions_appwrite_file_id_idx
  ON submissions(appwrite_file_id)
  WHERE appwrite_file_id IS NOT NULL;

-- ============================================
-- MIGRATION NOTES
-- ============================================
-- New upload flow (Phase 6):
--   1. File uploaded to Appwrite papers bucket → returns appwrite_file_id
--   2. file_url constructed from endpoint + bucket + file ID
--   3. Supabase INSERT includes appwrite_file_id + file_url
--   4. If INSERT fails → Appwrite file is deleted (rollback)
--
-- Approval flow (Phase 6):
--   - No file movement needed; only DB status column is updated
--   - approved_path kept for backwards compatibility (set to file_url on approve)
--
-- Legacy records:
--   - Rows with storage_path/approved_path and NULL appwrite_file_id
--     are pre-migration records; they still use signed Supabase URLs
--     (backwards-compatible: browse.js/paper.js fall back to storage path if no file_url)
-- ============================================
