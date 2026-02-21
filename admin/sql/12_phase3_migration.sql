-- ============================================
-- PHASE 3 MIGRATION
-- Role system redesign, achievements, paper requests
-- ============================================

-- ============================================
-- 1. ROLE SYSTEM UPGRADE
-- Add new columns to roles table
-- ============================================

ALTER TABLE roles
ADD COLUMN IF NOT EXISTS primary_role text,
ADD COLUMN IF NOT EXISTS secondary_role text,
ADD COLUMN IF NOT EXISTS tertiary_role text,
ADD COLUMN IF NOT EXISTS custom_badges jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Update level descriptions for new hierarchy:
-- 0   = Visitor
-- 10  = User
-- 20  = Contributor (auto after first upload)
-- 50  = Reviewer
-- 75  = Moderator (can approve)
-- 90  = Senior Moderator (can publish)
-- 100 = Founder/Admin (full access)

COMMENT ON COLUMN roles.level IS 'Role level: 0=Visitor, 10=User, 20=Contributor, 50=Reviewer, 75=Moderator, 90=SeniorMod, 100=Admin';
COMMENT ON COLUMN roles.primary_role IS 'Primary display role/badge';
COMMENT ON COLUMN roles.secondary_role IS 'Secondary display role/badge';
COMMENT ON COLUMN roles.tertiary_role IS 'Tertiary display role/badge';
COMMENT ON COLUMN roles.custom_badges IS 'JSON array of custom badge names';

-- ============================================
-- 2. RPC: Update user role (admin only, level >= 100)
-- ============================================

CREATE OR REPLACE FUNCTION update_user_role(
  target_user_id uuid,
  new_level int DEFAULT NULL,
  new_primary_role text DEFAULT NULL,
  new_secondary_role text DEFAULT NULL,
  new_tertiary_role text DEFAULT NULL,
  new_custom_badges jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller_level int;
BEGIN
  -- Check caller is admin (level >= 100)
  SELECT level INTO caller_level FROM roles WHERE user_id = auth.uid();
  IF caller_level IS NULL OR caller_level < 100 THEN
    RAISE EXCEPTION 'Insufficient permissions: admin level required';
  END IF;

  -- Update the target user's role
  UPDATE roles SET
    level = COALESCE(new_level, level),
    primary_role = COALESCE(new_primary_role, primary_role),
    secondary_role = COALESCE(new_secondary_role, secondary_role),
    tertiary_role = COALESCE(new_tertiary_role, tertiary_role),
    custom_badges = COALESCE(new_custom_badges, custom_badges),
    updated_at = now()
  WHERE user_id = target_user_id;
END;
$$;

-- ============================================
-- 3. RPC: Search users by email
-- ============================================

CREATE OR REPLACE FUNCTION search_users_by_email(search_email text)
RETURNS TABLE(user_id uuid, email text, display_name text, level int, primary_role text, secondary_role text, tertiary_role text, custom_badges jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller_level int;
BEGIN
  SELECT r.level INTO caller_level FROM roles r WHERE r.user_id = auth.uid();
  IF caller_level IS NULL OR caller_level < 75 THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  RETURN QUERY
  SELECT
    au.id AS user_id,
    au.email::text,
    COALESCE(au.raw_user_meta_data->>'full_name', au.email)::text AS display_name,
    COALESCE(r.level, 10) AS level,
    r.primary_role,
    r.secondary_role,
    r.tertiary_role,
    COALESCE(r.custom_badges, '[]'::jsonb)
  FROM auth.users au
  LEFT JOIN roles r ON r.user_id = au.id
  WHERE au.email ILIKE '%' || search_email || '%'
  LIMIT 20;
END;
$$;

-- ============================================
-- 4. RPC: Get user role by UUID
-- ============================================

CREATE OR REPLACE FUNCTION get_user_role_by_id(target_user_id uuid)
RETURNS TABLE(user_id uuid, email text, display_name text, level int, primary_role text, secondary_role text, tertiary_role text, custom_badges jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller_level int;
BEGIN
  SELECT r.level INTO caller_level FROM roles r WHERE r.user_id = auth.uid();
  IF caller_level IS NULL OR caller_level < 75 THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  RETURN QUERY
  SELECT
    au.id AS user_id,
    au.email::text,
    COALESCE(au.raw_user_meta_data->>'full_name', au.email)::text AS display_name,
    COALESCE(r.level, 10) AS level,
    r.primary_role,
    r.secondary_role,
    r.tertiary_role,
    COALESCE(r.custom_badges, '[]'::jsonb)
  FROM auth.users au
  LEFT JOIN roles r ON r.user_id = au.id
  WHERE au.id = target_user_id
  LIMIT 1;
END;
$$;

-- ============================================
-- 5. ACHIEVEMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  badge_type text NOT NULL,
  awarded_at timestamptz DEFAULT now()
);

-- RLS for achievements
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements"
  ON achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all achievements"
  ON achievements FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM roles WHERE roles.user_id = auth.uid() AND roles.level >= 75)
  );

CREATE POLICY "System can insert achievements"
  ON achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 6. RPC: Award achievement (idempotent)
-- ============================================

CREATE OR REPLACE FUNCTION award_achievement(
  target_user_id uuid,
  achievement_type text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if already awarded
  IF EXISTS (
    SELECT 1 FROM achievements
    WHERE user_id = target_user_id AND badge_type = achievement_type
  ) THEN
    RETURN false;
  END IF;

  INSERT INTO achievements (user_id, badge_type)
  VALUES (target_user_id, achievement_type);

  RETURN true;
END;
$$;

-- ============================================
-- 7. RPC: Get user achievements
-- ============================================

CREATE OR REPLACE FUNCTION get_user_achievements(target_user_id uuid)
RETURNS TABLE(badge_type text, awarded_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT a.badge_type, a.awarded_at
  FROM achievements a
  WHERE a.user_id = target_user_id
  ORDER BY a.awarded_at ASC;
END;
$$;

-- ============================================
-- 8. PAPER REQUESTS (BOUNTY BOARD) TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS paper_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  paper_code text,
  year int,
  description text,
  votes int DEFAULT 0,
  status text DEFAULT 'open',
  created_at timestamptz DEFAULT now()
);

-- RLS for paper_requests
ALTER TABLE paper_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view open requests"
  ON paper_requests FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create requests"
  ON paper_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update requests"
  ON paper_requests FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM roles WHERE roles.user_id = auth.uid() AND roles.level >= 75)
  );

-- ============================================
-- 9. PAPER REQUEST VOTES TABLE (one vote per user per request)
-- ============================================

CREATE TABLE IF NOT EXISTS paper_request_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES paper_requests ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(request_id, user_id)
);

ALTER TABLE paper_request_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view votes"
  ON paper_request_votes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can vote"
  ON paper_request_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 10. RPC: Upvote a paper request (one per user)
-- ============================================

CREATE OR REPLACE FUNCTION upvote_paper_request(request_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if already voted
  IF EXISTS (
    SELECT 1 FROM paper_request_votes
    WHERE request_id = request_id_param AND user_id = auth.uid()
  ) THEN
    RETURN false;
  END IF;

  -- Insert vote
  INSERT INTO paper_request_votes (request_id, user_id)
  VALUES (request_id_param, auth.uid());

  -- Increment vote count
  UPDATE paper_requests SET votes = votes + 1
  WHERE id = request_id_param;

  RETURN true;
END;
$$;

-- ============================================
-- 11. RPC: Get active user count (signed in within last 10 minutes)
-- ============================================

CREATE OR REPLACE FUNCTION get_active_user_count()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  active_count int;
BEGIN
  SELECT COUNT(*) INTO active_count
  FROM auth.users
  WHERE last_sign_in_at >= now() - interval '10 minutes';

  RETURN active_count;
END;
$$;

-- ============================================
-- 12. RPC: Auto-promote to Contributor (level 20) on first upload
-- ============================================

CREATE OR REPLACE FUNCTION auto_promote_contributor()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only promote if current level is less than 20
  UPDATE roles SET
    level = GREATEST(level, 20),
    primary_role = COALESCE(primary_role, 'Contributor'),
    updated_at = now()
  WHERE user_id = NEW.user_id AND level < 20;

  -- Award first upload achievement
  PERFORM award_achievement(NEW.user_id, 'first_upload');

  -- Check for 10 uploads achievement
  IF (SELECT COUNT(*) FROM submissions WHERE user_id = NEW.user_id) >= 10 THEN
    PERFORM award_achievement(NEW.user_id, '10_uploads');
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for auto-promotion on upload
DROP TRIGGER IF EXISTS trigger_auto_promote_contributor ON submissions;
CREATE TRIGGER trigger_auto_promote_contributor
  AFTER INSERT ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION auto_promote_contributor();

-- ============================================
-- 13. Grant execute permissions
-- ============================================

GRANT EXECUTE ON FUNCTION update_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION search_users_by_email TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role_by_id TO authenticated;
GRANT EXECUTE ON FUNCTION award_achievement TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_achievements TO authenticated;
GRANT EXECUTE ON FUNCTION upvote_paper_request TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_user_count TO authenticated, anon;
GRANT EXECUTE ON FUNCTION auto_promote_contributor TO authenticated;
