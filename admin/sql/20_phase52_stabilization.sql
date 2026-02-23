-- ============================================
-- PHASE 5.2 STABILIZATION MIGRATION
-- Fix: ambiguous column in get_all_last_sign_ins
-- Fix: support_submissions missing anon/insert policy check
-- ============================================

-- 1. Fix get_all_last_sign_ins: use explicit table alias on id column
--    to avoid any potential ambiguity with the RETURNS TABLE column user_id
CREATE OR REPLACE FUNCTION get_all_last_sign_ins()
RETURNS TABLE(user_id uuid, last_sign_in timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role text;
BEGIN
  -- Use explicit table alias to avoid ambiguity with RETURNS TABLE column user_id
  SELECT primary_role INTO caller_role FROM roles WHERE roles.user_id = auth.uid();
  -- NULL means user not found in roles table — treat as insufficient permissions
  IF caller_role IS NULL OR caller_role NOT IN ('Founder', 'Admin') THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  RETURN QUERY SELECT au.id AS user_id, au.last_sign_in_at AS last_sign_in
               FROM auth.users au;
END;
$$;

GRANT EXECUTE ON FUNCTION get_all_last_sign_ins TO authenticated;

-- 2. Drop duplicate RLS policies on roles table if they exist
--    (prevents "already exists" errors on policy creation)
DO $$
BEGIN
  -- Drop the duplicate select policy if it exists from migration 18
  -- Only roles with Founder/Admin/Senior Moderator can view all
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'roles'
      AND policyname = 'Admins can view all roles'
  ) THEN
    DROP POLICY "Admins can view all roles" ON roles;
  END IF;
END
$$;

CREATE POLICY "Admins can view all roles"
ON roles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM roles r
    WHERE r.user_id = auth.uid()
    AND r.primary_role IN ('Founder', 'Admin', 'Senior Moderator')
  )
);

-- 3. Ensure support_submissions RLS is enabled and policies are correct
--    Drop and recreate to avoid duplicate policy errors
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'support_submissions'
      AND policyname = 'Users can insert own support submissions'
  ) THEN
    DROP POLICY "Users can insert own support submissions" ON support_submissions;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'support_submissions'
      AND policyname = 'Users can view own support submissions'
  ) THEN
    DROP POLICY "Users can view own support submissions" ON support_submissions;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'support_submissions'
      AND policyname = 'Admins can view all support submissions'
  ) THEN
    DROP POLICY "Admins can view all support submissions" ON support_submissions;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'support_submissions'
      AND policyname = 'Admins can update support submissions'
  ) THEN
    DROP POLICY "Admins can update support submissions" ON support_submissions;
  END IF;
END
$$;

ALTER TABLE support_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own support submissions"
ON support_submissions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own support submissions"
ON support_submissions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all support submissions"
ON support_submissions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM roles r
    WHERE r.user_id = auth.uid()
    AND r.primary_role IN ('Founder', 'Admin')
  )
);

CREATE POLICY "Admins can update support submissions"
ON support_submissions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM roles r
    WHERE r.user_id = auth.uid()
    AND r.primary_role IN ('Founder', 'Admin')
  )
);

GRANT ALL ON support_submissions TO authenticated;
