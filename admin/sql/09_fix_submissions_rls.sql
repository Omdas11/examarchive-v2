-- ============================================
-- MIGRATION: Fix Admin SELECT RLS for submissions
-- Ensures admins (level >= 80) can read ALL submissions
-- and users can read their own submissions
-- ============================================

-- Drop any broken SELECT policies first (safe: IF EXISTS)
DROP POLICY IF EXISTS "users see own submissions" ON submissions;
DROP POLICY IF EXISTS "reviewers see all submissions" ON submissions;
DROP POLICY IF EXISTS "admin_select_all_submissions" ON submissions;
DROP POLICY IF EXISTS "user_select_own_submissions" ON submissions;

-- Recreate: Users can read their own submissions
CREATE POLICY "user_select_own_submissions"
ON submissions
FOR SELECT
USING (user_id = auth.uid());

-- Recreate: Admin/Reviewer (level >= 80) can read ALL submissions
CREATE POLICY "admin_select_all_submissions"
ON submissions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM roles
    WHERE roles.user_id = auth.uid()
    AND roles.level >= 80
  )
);
