-- ============================================
-- MIGRATION: Fix RLS SELECT policies on submissions
-- Drops potentially broken existing SELECT policies and replaces
-- them with reliable versions using direct roles-table subquery
-- ============================================

-- Drop existing SELECT policies (handles both original and any previously applied name)
DROP POLICY IF EXISTS "users see own submissions" ON submissions;
DROP POLICY IF EXISTS "reviewers see all submissions" ON submissions;
DROP POLICY IF EXISTS "user_select_own_submissions" ON submissions;
DROP POLICY IF EXISTS "admin_select_all_submissions" ON submissions;

-- Users can read their own submissions
CREATE POLICY "user_select_own_submissions"
ON submissions
FOR SELECT
USING (user_id = auth.uid());

-- Admin/Reviewer (level >= 80) can read ALL submissions
-- Uses a direct subquery on the roles table for reliability
-- (avoids potential issues with get_current_user_role_level() function)
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
