-- 10_cleanup_duplicate_policies.sql
-- Remove legacy duplicate SELECT policy on submissions
-- Keep only: user_select_own_submissions, admin_select_all_submissions
-- Do NOT touch insert policies

DROP POLICY IF EXISTS "select own submission" ON submissions;
