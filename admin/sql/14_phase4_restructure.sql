-- ============================================
-- PHASE 4 RESTRUCTURE MIGRATION
-- Decouple XP from permissions, founder uniqueness,
-- daily streak, XP backfill, multi-badge, security
-- ============================================

-- ============================================
-- 1. DECOUPLE XP FROM SYSTEM ROLES
-- XP is now cosmetic only. Permissions depend
-- solely on primary_role, NOT on level/XP.
-- ============================================

-- Update XP-to-level function: level is now COSMETIC ONLY
-- It does NOT grant any permissions
CREATE OR REPLACE FUNCTION calculate_level_from_xp(xp_value integer)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Cosmetic level tiers (no permission implications)
  IF xp_value >= 5000 THEN RETURN 100;
  ELSIF xp_value >= 3000 THEN RETURN 90;
  ELSIF xp_value >= 1500 THEN RETURN 50;
  ELSIF xp_value >= 800 THEN RETURN 25;
  ELSIF xp_value >= 300 THEN RETURN 10;
  ELSIF xp_value >= 100 THEN RETURN 5;
  ELSE RETURN 0;
  END IF;
END;
$$;

COMMENT ON FUNCTION calculate_level_from_xp IS 'Cosmetic level from XP. Does NOT control permissions.';

-- Update role title function: cosmetic only
CREATE OR REPLACE FUNCTION get_role_title_from_xp(xp_value integer)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Cosmetic titles only — system permissions use primary_role
  IF xp_value >= 5000 THEN RETURN 'Legend';
  ELSIF xp_value >= 3000 THEN RETURN 'Elite';
  ELSIF xp_value >= 1500 THEN RETURN 'Senior';
  ELSIF xp_value >= 800 THEN RETURN 'Veteran';
  ELSIF xp_value >= 300 THEN RETURN 'Contributor';
  ELSIF xp_value >= 100 THEN RETURN 'Explorer';
  ELSE RETURN 'Visitor';
  END IF;
END;
$$;

COMMENT ON FUNCTION get_role_title_from_xp IS 'Cosmetic XP title. Does NOT control permissions.';

-- ============================================
-- 2. FOUNDER UNIQUENESS CONSTRAINT
-- Only ONE user can have primary_role = 'Founder'
-- ============================================

-- Create a unique partial index: only one Founder allowed
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_founder
  ON roles ((1))
  WHERE primary_role = 'Founder';

-- Update the auto_promote_contributor trigger to NOT set system roles from XP
CREATE OR REPLACE FUNCTION auto_promote_contributor()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Award +50 XP for upload (cosmetic only)
  UPDATE roles SET
    xp = COALESCE(xp, 0) + 50,
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
-- 3. XP BACKFILL FROM PREVIOUS LEVELS
-- Safely backfill XP for users with 0 XP
-- based on their existing level values
-- ============================================

UPDATE roles SET xp = 3000 WHERE xp = 0 AND level = 90;
UPDATE roles SET xp = 1500 WHERE xp = 0 AND level = 50;
UPDATE roles SET xp = 800  WHERE xp = 0 AND level = 25;
UPDATE roles SET xp = 300  WHERE xp = 0 AND level = 10;
UPDATE roles SET xp = 100  WHERE xp = 0 AND level = 5;

-- ============================================
-- 4. DAILY STREAK SYSTEM
-- ============================================

ALTER TABLE roles
ADD COLUMN IF NOT EXISTS streak_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_login_date date;

COMMENT ON COLUMN roles.streak_count IS 'Consecutive daily login streak count';
COMMENT ON COLUMN roles.last_login_date IS 'Last login date for streak tracking';

-- RPC: Update daily streak
CREATE OR REPLACE FUNCTION update_daily_streak()
RETURNS TABLE(streak integer, streak_updated boolean, xp_awarded integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_streak integer;
  last_login date;
  today date := CURRENT_DATE;
  was_updated boolean := false;
  xp_bonus integer := 0;
BEGIN
  SELECT r.streak_count, r.last_login_date
  INTO current_streak, last_login
  FROM roles r
  WHERE r.user_id = auth.uid();

  IF NOT FOUND THEN
    RETURN QUERY SELECT 0, false, 0;
    RETURN;
  END IF;

  current_streak := COALESCE(current_streak, 0);

  -- Already logged in today
  IF last_login = today THEN
    RETURN QUERY SELECT current_streak, false, 0;
    RETURN;
  END IF;

  -- Consecutive day
  IF last_login = today - 1 THEN
    current_streak := current_streak + 1;
  ELSE
    -- Gap > 1 day: reset streak
    current_streak := 1;
  END IF;

  was_updated := true;
  xp_bonus := 5; -- +5 XP per streak day

  UPDATE roles SET
    streak_count = current_streak,
    last_login_date = today,
    xp = COALESCE(xp, 0) + xp_bonus,
    updated_at = now()
  WHERE user_id = auth.uid();

  RETURN QUERY SELECT current_streak, was_updated, xp_bonus;
END;
$$;

GRANT EXECUTE ON FUNCTION update_daily_streak TO authenticated;

-- ============================================
-- 5. ROLE-BASED ACCESS CONTROL RPCs
-- Permissions based on primary_role, NOT level/XP
-- ============================================

-- Helper: Check if user has admin-level access via primary_role
CREATE OR REPLACE FUNCTION has_admin_access(check_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM roles
    WHERE user_id = check_user_id
    AND primary_role IN ('Founder', 'Admin')
  );
END;
$$;

-- Helper: Check if user has moderator-level access
CREATE OR REPLACE FUNCTION has_moderator_access(check_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM roles
    WHERE user_id = check_user_id
    AND primary_role IN ('Founder', 'Admin', 'Senior Moderator')
  );
END;
$$;

-- Helper: Check if user has reviewer-level access
CREATE OR REPLACE FUNCTION has_reviewer_access(check_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM roles
    WHERE user_id = check_user_id
    AND primary_role IN ('Founder', 'Admin', 'Senior Moderator', 'Reviewer')
  );
END;
$$;

GRANT EXECUTE ON FUNCTION has_admin_access TO authenticated;
GRANT EXECUTE ON FUNCTION has_moderator_access TO authenticated;
GRANT EXECUTE ON FUNCTION has_reviewer_access TO authenticated;

-- ============================================
-- 6. UPDATE update_user_role TO USE ROLE-BASED AUTH
-- AND PREVENT DUPLICATE FOUNDERS
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
SET search_path = public
AS $$
DECLARE
  caller_role text;
BEGIN
  -- Check caller has admin access via primary_role
  SELECT primary_role INTO caller_role FROM roles WHERE user_id = auth.uid();
  IF caller_role IS NULL OR caller_role NOT IN ('Founder', 'Admin') THEN
    RAISE EXCEPTION 'Insufficient permissions: Founder or Admin role required';
  END IF;

  -- Prevent assigning Founder if one already exists (and it's not the same user)
  IF new_primary_role = 'Founder' THEN
    IF EXISTS (
      SELECT 1 FROM roles
      WHERE primary_role = 'Founder'
      AND user_id != target_user_id
    ) THEN
      RAISE EXCEPTION 'Founder role is unique: another user already has this role';
    END IF;
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
-- 7. UPDATE add_user_xp TO USE ROLE-BASED AUTH
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
  caller_role text;
BEGIN
  -- Only Founder/Admin can award XP
  SELECT primary_role INTO caller_role FROM roles WHERE user_id = auth.uid();
  IF caller_role IS NULL OR caller_role NOT IN ('Founder', 'Admin') THEN
    RAISE EXCEPTION 'Insufficient permissions: Founder or Admin role required';
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
-- 8. UPDATE search_users_by_username TO USE ROLE-BASED AUTH
-- ============================================

CREATE OR REPLACE FUNCTION search_users_by_username(search_username text)
RETURNS TABLE(user_id uuid, email text, display_name text, level int, xp int, username text, primary_role text, secondary_role text, tertiary_role text, custom_badges jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role text;
BEGIN
  SELECT r.primary_role INTO caller_role FROM roles r WHERE r.user_id = auth.uid();
  IF caller_role IS NULL OR caller_role NOT IN ('Founder', 'Admin', 'Senior Moderator') THEN
    RAISE EXCEPTION 'Insufficient permissions: moderator access required';
  END IF;

  RETURN QUERY
  SELECT
    au.id AS user_id,
    au.email::text,
    COALESCE(r.display_name, au.raw_user_meta_data->>'full_name', au.email)::text AS display_name,
    COALESCE(r.level, 0) AS level,
    COALESCE(r.xp, 0) AS xp,
    r.username,
    r.primary_role,
    r.secondary_role,
    r.tertiary_role,
    COALESCE(r.custom_badges, '[]'::jsonb)
  FROM auth.users au
  LEFT JOIN roles r ON r.user_id = au.id
  WHERE r.username ILIKE '%' || search_username || '%'
     OR au.email ILIKE '%' || search_username || '%'
  LIMIT 20;
END;
$$;

-- ============================================
-- 9. RPC: List all users (Admin dashboard)
-- ============================================

CREATE OR REPLACE FUNCTION list_all_users(
  page_number integer DEFAULT 1,
  page_size integer DEFAULT 25,
  search_query text DEFAULT NULL,
  sort_by text DEFAULT 'created_at',
  sort_dir text DEFAULT 'desc'
)
RETURNS TABLE(
  user_id uuid,
  email text,
  display_name text,
  username text,
  xp integer,
  level integer,
  primary_role text,
  secondary_role text,
  tertiary_role text,
  custom_badges jsonb,
  streak_count integer,
  created_at timestamptz,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role text;
  offset_val integer;
  total bigint;
BEGIN
  -- Only Founder/Admin can list all users
  SELECT r.primary_role INTO caller_role FROM roles r WHERE r.user_id = auth.uid();
  IF caller_role IS NULL OR caller_role NOT IN ('Founder', 'Admin') THEN
    RAISE EXCEPTION 'Insufficient permissions: admin access required';
  END IF;

  offset_val := (GREATEST(1, page_number) - 1) * page_size;

  -- Get total count
  IF search_query IS NOT NULL AND search_query != '' THEN
    SELECT COUNT(*) INTO total
    FROM auth.users au
    LEFT JOIN roles r ON r.user_id = au.id
    WHERE au.email ILIKE '%' || search_query || '%'
       OR r.username ILIKE '%' || search_query || '%'
       OR r.primary_role ILIKE '%' || search_query || '%';
  ELSE
    SELECT COUNT(*) INTO total FROM auth.users;
  END IF;

  RETURN QUERY
  SELECT
    au.id AS user_id,
    au.email::text,
    COALESCE(r.display_name, au.raw_user_meta_data->>'full_name', au.email)::text AS display_name,
    r.username,
    COALESCE(r.xp, 0) AS xp,
    COALESCE(r.level, 0) AS level,
    r.primary_role,
    r.secondary_role,
    r.tertiary_role,
    COALESCE(r.custom_badges, '[]'::jsonb) AS custom_badges,
    COALESCE(r.streak_count, 0) AS streak_count,
    au.created_at,
    total AS total_count
  FROM auth.users au
  LEFT JOIN roles r ON r.user_id = au.id
  WHERE (search_query IS NULL OR search_query = ''
    OR au.email ILIKE '%' || search_query || '%'
    OR r.username ILIKE '%' || search_query || '%'
    OR r.primary_role ILIKE '%' || search_query || '%')
  ORDER BY
    CASE WHEN sort_by = 'xp' AND sort_dir = 'desc' THEN COALESCE(r.xp, 0) END DESC NULLS LAST,
    CASE WHEN sort_by = 'xp' AND sort_dir = 'asc' THEN COALESCE(r.xp, 0) END ASC NULLS LAST,
    CASE WHEN sort_by = 'level' AND sort_dir = 'desc' THEN COALESCE(r.level, 0) END DESC NULLS LAST,
    CASE WHEN sort_by = 'level' AND sort_dir = 'asc' THEN COALESCE(r.level, 0) END ASC NULLS LAST,
    CASE WHEN sort_by = 'email' AND sort_dir = 'asc' THEN au.email END ASC NULLS LAST,
    CASE WHEN sort_by = 'email' AND sort_dir = 'desc' THEN au.email END DESC NULLS LAST,
    CASE WHEN sort_by = 'created_at' AND sort_dir = 'asc' THEN au.created_at END ASC,
    CASE WHEN sort_dir = 'desc' OR sort_by IS NULL THEN au.created_at END DESC
  LIMIT page_size
  OFFSET offset_val;
END;
$$;

GRANT EXECUTE ON FUNCTION list_all_users TO authenticated;

-- ============================================
-- 10. RPC: Get user's primary_role for access checks
-- ============================================

CREATE OR REPLACE FUNCTION get_current_user_primary_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT primary_role FROM roles WHERE user_id = auth.uid() LIMIT 1),
    'Visitor'
  );
$$;

GRANT EXECUTE ON FUNCTION get_current_user_primary_role TO authenticated, anon;

-- ============================================
-- 11. MULTI-BADGE SUPPORT
-- custom_badges already exists as jsonb column
-- Ensure it is properly typed and documented
-- ============================================

COMMENT ON COLUMN roles.custom_badges IS 'JSON array of custom badge strings, e.g. ["Subject Expert (Physics)", "Beta Tester"]';

-- ============================================
-- END OF PHASE 4 RESTRUCTURE MIGRATION
-- ============================================
