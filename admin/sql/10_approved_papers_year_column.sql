-- ============================================
-- MIGRATION: Rename exam_year → year in approved_papers
-- Aligns column naming with submissions table (see 08_submission_fields_migration.sql)
-- Idempotent: only renames if exam_year column still exists
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'approved_papers'
    AND column_name = 'exam_year'
  ) THEN
    ALTER TABLE approved_papers RENAME COLUMN exam_year TO year;
  END IF;
END $$;

COMMENT ON COLUMN approved_papers.year IS 'Examination year';
