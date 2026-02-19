-- ============================================
-- MIGRATION: Rename submission columns and add file metadata fields
-- Renames exam_year → year, temp_path → storage_path
-- Adds original_filename (NOT NULL) and file_size (NOT NULL)
-- ============================================

-- Rename exam_year to year
ALTER TABLE submissions RENAME COLUMN exam_year TO year;

-- Rename temp_path to storage_path
ALTER TABLE submissions RENAME COLUMN temp_path TO storage_path;

-- Add original_filename (NOT NULL with descriptive placeholder for existing rows)
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS original_filename text NOT NULL DEFAULT 'legacy_upload.pdf';

-- Add file_size (NOT NULL with 0 default for existing rows; 0 indicates unknown size for legacy records)
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS file_size bigint NOT NULL DEFAULT 0;

-- Remove defaults (only needed to satisfy NOT NULL for existing rows)
ALTER TABLE submissions ALTER COLUMN original_filename DROP DEFAULT;
ALTER TABLE submissions ALTER COLUMN file_size DROP DEFAULT;

-- Add comments
COMMENT ON COLUMN submissions.year IS 'Examination year';
COMMENT ON COLUMN submissions.storage_path IS 'Path to file in uploads-temp bucket (pending) or uploads-approved (demo/approved)';
COMMENT ON COLUMN submissions.original_filename IS 'Original filename as uploaded by the user (NOT NULL)';
COMMENT ON COLUMN submissions.file_size IS 'File size in bytes (NOT NULL)';
