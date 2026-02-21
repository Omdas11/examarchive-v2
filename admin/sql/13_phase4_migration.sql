-- ============================================
-- PHASE 4 MIGRATION
-- XP system, username, remove_vote RPC, level auto-calc
-- ============================================

-- ============================================
-- 1. ADD XP COLUMN TO ROLES TABLE
-- ============================================

ALTER TABLE roles
ADD COLUMN IF NOT EXISTS xp integer DEFAULT 0;

COMMENT ON COLUMN roles.xp IS 'Experience points: determines level automatically';

-- ============================================
-- 2. ADD USERNAME TO PROFILES/ROLES
-- ============================================

ALTER TABLE roles
ADD COLUMN IF NOT EXISTS username text UNIQUE,
ADD COLUMN IF NOT EXISTS display_name text;

-- Username constraint: 4-15 chars, alphanumeric + underscore
ALTER TABLE roles
ADD CONSTRAINT username_format CHECK (
  username IS NULL OR (
    length(username) BETWEEN 4 AND 15
    AND username ~ '^[a-zA-Z0-9_]+$'
  )
);

COMMENT ON COLUMN roles.username IS 'Unique username: 4-15 chars, alphanumeric + underscore';
COMMENT ON COLUMN roles.display_name IS 'Display name shown in profile';

-- ============================================
-- 3. XP-TO-LEVEL CALCULATION FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION calculate_level_from_xp(xp_value integer)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF xp_value >= 5000 THEN RETURN 100;  -- Founder
  ELSIF xp_value >= 3000 THEN RETURN 90;  -- Admin
  ELSIF xp_value >= 1500 THEN RETURN 50;  -- Senior Moderator
  ELSIF xp_value >= 800 THEN RETURN 25;   -- Reviewer
  ELSIF xp_value >= 300 THEN RETURN 10;   -- Contributor
  ELSIF xp_value >= 100 THEN RETURN 5;    -- Explorer
  ELSE RETURN 0;                           -- Visitor
  END IF;
END;
$$;

-- ============================================
-- 4. XP-TO-ROLE-TITLE FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION get_role_title_from_xp(xp_value integer)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF xp_value >= 5000 THEN RETURN 'Founder';
  ELSIF xp_value >= 3000 THEN RETURN 'Admin';
  ELSIF xp_value >= 1500 THEN RETURN 'Senior Moderator';
  ELSIF xp_value >= 800 THEN RETURN 'Reviewer';
  ELSIF xp_value >= 300 THEN RETURN 'Contributor';
  ELSIF xp_value >= 100 THEN RETURN 'Explorer';
  ELSE RETURN 'Visitor';
  END IF;
END;
$$;

-- ============================================
-- 5. TRIGGER: Auto-recalculate level when XP changes
-- ============================================

CREATE OR REPLACE FUNCTION sync_level_from_xp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.xp IS DISTINCT FROM OLD.xp THEN
    NEW.level := calculate_level_from_xp(NEW.xp);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_level_from_xp ON roles;
CREATE TRIGGER trigger_sync_level_from_xp
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION sync_level_from_xp();

-- ============================================
-- 6. RPC: Add XP to user (with auto level sync)
-- ============================================

CREATE OR REPLACE FUNCTION add_user_xp(
  target_user_id uuid,
  xp_amount integer
)
RETURNS TABLE(new_xp integer, new_level integer, old_level integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prev_level integer;
  updated_xp integer;
  updated_level integer;
  caller_level integer;
BEGIN
  -- Only admins (level >= 100) or service_role can call this
  SELECT level INTO caller_level FROM roles WHERE user_id = auth.uid();
  IF caller_level IS NULL OR caller_level < 100 THEN
    RAISE EXCEPTION 'Insufficient permissions: admin level (>= 100) required';
  END IF;

  SELECT level INTO prev_level FROM roles WHERE user_id = target_user_id;
  IF prev_level IS NULL THEN prev_level := 0; END IF;

  UPDATE roles
  SET xp = GREATEST(0, COALESCE(xp, 0) + xp_amount)
  WHERE user_id = target_user_id
  RETURNING xp, level INTO updated_xp, updated_level;

  RETURN QUERY SELECT updated_xp, updated_level, prev_level;
END;
$$;

-- ============================================
-- 7. RPC: Get user XP info
-- ============================================

CREATE OR REPLACE FUNCTION get_user_xp_info(target_user_id uuid)
RETURNS TABLE(xp integer, level integer, role_title text, username text, display_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow users to query their own XP info
  IF target_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Can only query own XP info';
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(r.xp, 0) AS xp,
    COALESCE(r.level, 0) AS level,
    get_role_title_from_xp(COALESCE(r.xp, 0)) AS role_title,
    r.username,
    r.display_name
  FROM roles r
  WHERE r.user_id = auth.uid();
END;
$$;

-- ============================================
-- 8. RPC: Remove vote (missing from Phase 3)
-- ============================================

CREATE OR REPLACE FUNCTION remove_vote(request_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if vote exists
  IF NOT EXISTS (
    SELECT 1 FROM paper_request_votes
    WHERE request_id = request_id_param AND user_id = auth.uid()
  ) THEN
    RETURN false;
  END IF;

  -- Delete vote
  DELETE FROM paper_request_votes
  WHERE request_id = request_id_param AND user_id = auth.uid();

  -- Decrement vote count (prevent going below 0)
  UPDATE paper_requests
  SET votes = GREATEST(0, votes - 1)
  WHERE id = request_id_param;

  RETURN true;
END;
$$;

-- Add RLS policy for vote deletion
DROP POLICY IF EXISTS "Users can delete own votes" ON paper_request_votes;
CREATE POLICY "Users can delete own votes"
  ON paper_request_votes FOR DELETE
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- ============================================
-- 9. RPC: Get user upload stats
-- ============================================

CREATE OR REPLACE FUNCTION get_user_upload_stats(target_user_id uuid)
RETURNS TABLE(total_uploads bigint, approved_uploads bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow users to query their own upload stats
  IF target_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Can only query own upload stats';
  END IF;

  RETURN QUERY
  SELECT
    COUNT(*)::bigint AS total_uploads,
    COUNT(*) FILTER (WHERE status IN ('approved', 'published'))::bigint AS approved_uploads
  FROM submissions
  WHERE user_id = auth.uid();
END;
$$;

-- ============================================
-- 10. RPC: Search users by username
-- ============================================

CREATE OR REPLACE FUNCTION search_users_by_username(search_username text)
RETURNS TABLE(user_id uuid, email text, display_name text, level int, xp int, username text, primary_role text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_level int;
BEGIN
  SELECT r.level INTO caller_level FROM roles r WHERE r.user_id = auth.uid();
  IF caller_level IS NULL OR caller_level < 90 THEN
    RAISE EXCEPTION 'Insufficient permissions: level >= 90 required';
  END IF;

  RETURN QUERY
  SELECT
    au.id AS user_id,
    au.email::text,
    COALESCE(r.display_name, au.raw_user_meta_data->>'full_name', au.email)::text AS display_name,
    COALESCE(r.level, 0) AS level,
    COALESCE(r.xp, 0) AS xp,
    r.username,
    r.primary_role
  FROM auth.users au
  LEFT JOIN roles r ON r.user_id = au.id
  WHERE r.username ILIKE '%' || search_username || '%'
     OR au.email ILIKE '%' || search_username || '%'
  LIMIT 20;
END;
$$;

-- ============================================
-- 11. RPC: Set username
-- ============================================

CREATE OR REPLACE FUNCTION set_username(new_username text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate format
  IF new_username IS NULL
     OR length(new_username) < 4
     OR length(new_username) > 15
     OR new_username !~ '^[a-zA-Z0-9_]+$' THEN
    RAISE EXCEPTION 'Invalid username: must be 4-15 alphanumeric characters or underscores';
  END IF;

  -- Check uniqueness
  IF EXISTS (SELECT 1 FROM roles WHERE username = new_username AND user_id != auth.uid()) THEN
    RAISE EXCEPTION 'Username already taken';
  END IF;

  UPDATE roles SET username = new_username, updated_at = now()
  WHERE user_id = auth.uid();

  RETURN true;
END;
$$;

-- ============================================
-- 12. Updated auto-promote with XP
-- ============================================

CREATE OR REPLACE FUNCTION auto_promote_contributor()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Award +50 XP for upload
  UPDATE roles SET
    xp = COALESCE(xp, 0) + 50,
    primary_role = COALESCE(primary_role, 'Contributor'),
    updated_at = now()
  WHERE user_id = NEW.user_id;

  -- Award first upload achievement
  PERFORM award_achievement(NEW.user_id, 'first_upload');

  -- Check for 10 uploads achievement
  IF (SELECT COUNT(*) FROM submissions WHERE user_id = NEW.user_id) >= 10 THEN
    PERFORM award_achievement(NEW.user_id, '10_uploads');
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================
-- 13. Grant execute permissions
-- ============================================

GRANT EXECUTE ON FUNCTION calculate_level_from_xp TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_role_title_from_xp TO authenticated, anon;
GRANT EXECUTE ON FUNCTION add_user_xp TO service_role;
GRANT EXECUTE ON FUNCTION get_user_xp_info TO authenticated;
GRANT EXECUTE ON FUNCTION remove_vote TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_upload_stats TO authenticated;
GRANT EXECUTE ON FUNCTION search_users_by_username TO authenticated;
GRANT EXECUTE ON FUNCTION set_username TO authenticated;

-- ============================================
-- END OF PHASE 4 MIGRATION
-- ============================================
