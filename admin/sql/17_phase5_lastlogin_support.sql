-- Phase 5: Last Login + Support Submissions Migration
-- ====================================================

-- 1. RPC to fetch real last_sign_in_at from auth.users
-- Returns the actual authentication timestamp, not the roles table value
CREATE OR REPLACE FUNCTION get_user_last_sign_in(target_user_id uuid)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role text;
  result timestamptz;
BEGIN
  -- Only Founder/Admin can call this
  SELECT primary_role INTO caller_role FROM roles WHERE user_id = auth.uid();
  IF caller_role IS NULL OR caller_role NOT IN ('Founder', 'Admin') THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  SELECT last_sign_in_at INTO result FROM auth.users WHERE id = target_user_id;
  RETURN result;
END;
$$;

-- Batch version: get all users' last sign in times at once
CREATE OR REPLACE FUNCTION get_all_last_sign_ins()
RETURNS TABLE(user_id uuid, last_sign_in timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role text;
BEGIN
  SELECT primary_role INTO caller_role FROM roles WHERE user_id = auth.uid();
  IF caller_role IS NULL OR caller_role NOT IN ('Founder', 'Admin') THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  RETURN QUERY SELECT id, au.last_sign_in_at FROM auth.users au;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_last_sign_in TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_last_sign_ins TO authenticated;

-- 2. Support submissions table
CREATE TABLE IF NOT EXISTS support_submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  type text NOT NULL DEFAULT 'general',
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- RLS for support_submissions
ALTER TABLE support_submissions ENABLE ROW LEVEL SECURITY;

-- Users can insert their own submissions
CREATE POLICY "Users can insert own support submissions"
ON support_submissions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own submissions
CREATE POLICY "Users can view own support submissions"
ON support_submissions FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all support submissions
CREATE POLICY "Admins can view all support submissions"
ON support_submissions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM roles r
    WHERE r.user_id = auth.uid()
    AND r.primary_role IN ('Founder', 'Admin')
  )
);

-- Admins can update support submissions (change status)
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
