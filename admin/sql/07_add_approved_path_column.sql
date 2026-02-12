-- ============================================
-- MIGRATION: Add approved_path column to submissions
-- ============================================

-- Add approved_path column if it doesn't exist
ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS approved_path text;

-- Add comment
COMMENT ON COLUMN submissions.approved_path IS 'Path to file in uploads-approved bucket (for demo papers or after approval)';
