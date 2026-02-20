-- ============================================
-- PHASE 2 MIGRATION
-- Browse page migration + visitor counter + admin requests
-- ============================================

-- ============================================
-- 1. Add is_demo column to submissions if not exists
-- ============================================
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS is_demo boolean DEFAULT false;

-- ============================================
-- 2. Add published_at column to submissions if not exists
-- ============================================
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS published_at timestamptz;

-- ============================================
-- 3. Add content_type column to submissions if not exists
-- ============================================
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS content_type text;

-- ============================================
-- 4. Add role_title column to roles if not exists
-- ============================================
ALTER TABLE roles ADD COLUMN IF NOT EXISTS role_title text;

-- ============================================
-- 5. VISITOR COUNTER TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS site_stats (
  id int PRIMARY KEY DEFAULT 1,
  total_visits bigint DEFAULT 0
);

-- Insert initial row if not exists
INSERT INTO site_stats (id, total_visits)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

-- RLS for site_stats
ALTER TABLE site_stats ENABLE ROW LEVEL SECURITY;

-- Anyone can read site stats
CREATE POLICY IF NOT EXISTS "anyone can read site_stats"
ON site_stats FOR SELECT
USING (true);

-- Only level 100 can update/reset
CREATE POLICY IF NOT EXISTS "admin can update site_stats"
ON site_stats FOR UPDATE
USING (get_current_user_role_level() >= 100);

-- ============================================
-- 6. INCREMENT VISITOR COUNTER RPC
-- ============================================
CREATE OR REPLACE FUNCTION increment_visit_counter()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count bigint;
BEGIN
  UPDATE site_stats
  SET total_visits = total_visits + 1
  WHERE id = 1
  RETURNING total_visits INTO new_count;
  RETURN new_count;
END;
$$;

-- ============================================
-- 7. RESET VISITOR COUNTER RPC (admin only)
-- ============================================
CREATE OR REPLACE FUNCTION reset_site_counter()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF get_current_user_role_level() < 100 THEN
    RAISE EXCEPTION 'Only admins can reset the visitor counter';
  END IF;
  UPDATE site_stats SET total_visits = 0 WHERE id = 1;
END;
$$;

-- ============================================
-- 8. ADMIN REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS admin_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  reason text NOT NULL,
  subject_expertise text,
  experience text,
  portfolio_link text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_requests ENABLE ROW LEVEL SECURITY;

-- Users can insert their own requests
CREATE POLICY IF NOT EXISTS "users insert own admin_requests"
ON admin_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can read their own requests
CREATE POLICY IF NOT EXISTS "users read own admin_requests"
ON admin_requests FOR SELECT
USING (auth.uid() = user_id);

-- Admins can read all requests
CREATE POLICY IF NOT EXISTS "admins read all admin_requests"
ON admin_requests FOR SELECT
USING (get_current_user_role_level() >= 100);

-- Admins can update requests
CREATE POLICY IF NOT EXISTS "admins update admin_requests"
ON admin_requests FOR UPDATE
USING (get_current_user_role_level() >= 100);

-- ============================================
-- 9. Published papers SELECT policy for anonymous access
-- ============================================
-- Allow anyone to read published submissions (for browse page)
CREATE POLICY IF NOT EXISTS "anyone can read published submissions"
ON submissions FOR SELECT
USING (status = 'published');

-- ============================================
-- END OF PHASE 2 MIGRATION
-- ============================================
