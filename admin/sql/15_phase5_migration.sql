-- ============================================
-- PHASE 5 MIGRATION
-- New RPCs, columns, and security hardening
-- ============================================

-- ============================================
-- 1. NEW COLUMNS
-- ============================================

-- Username change tracking
ALTER TABLE roles
ADD COLUMN IF NOT EXISTS username_last_changed timestamptz;

-- Streak week start preference
ALTER TABLE roles
ADD COLUMN IF NOT EXISTS week_start text DEFAULT 'Monday';

-- ============================================
-- 2. LIST ALL USERS (FULL) RPC
-- Access: Founder / Admin only
-- ============================================

CREATE OR REPLACE FUNCTION list_all_users_full()
RETURNS TABLE (
  user_id uuid,
  display_name text,
  username text,
  xp integer,
  level integer,
  primary_role text,
  secondary_role text,
  tertiary_role text,
  custom_badges jsonb,
  uploads integer,
  approved integer,
  rejected integer,
  last_login_date date
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    r.user_id,
    r.display_name,
    r.username,
    r.xp,
    r.level,
    r.primary_role,
    r.secondary_role,
    r.tertiary_role,
    r.custom_badges,
    COALESCE(s.uploads,0)::integer,
    COALESCE(s.approved,0)::integer,
    COALESCE(s.rejected,0)::integer,
    r.last_login_date
  FROM roles r
  LEFT JOIN (
    SELECT user_id,
      COUNT(*)::integer AS uploads,
      COUNT(*) FILTER (WHERE status='approved')::integer AS approved,
      COUNT(*) FILTER (WHERE status='rejected')::integer AS rejected
    FROM submissions
    GROUP BY user_id
  ) s ON s.user_id = r.user_id;
$$;

-- ============================================
-- 3. UPDATE USER ROLE RPC
-- Access: Founder / Admin only
-- Founder role can only be assigned by Founder
-- ============================================

CREATE OR REPLACE FUNCTION update_user_role(
  target_user uuid,
  new_role text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_role text;
BEGIN
  SELECT primary_role INTO current_role
  FROM roles
  WHERE user_id = auth.uid();

  IF current_role NOT IN ('Founder','Admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF new_role = 'Founder' AND current_role <> 'Founder' THEN
    RAISE EXCEPTION 'Only Founder can assign Founder';
  END IF;

  UPDATE roles
  SET primary_role = new_role
  WHERE user_id = target_user;
END;
$$;

-- ============================================
-- 4. GET PLATFORM STATS RPC
-- Access: Founder / Admin / Senior Moderator
-- ============================================

CREATE OR REPLACE FUNCTION get_platform_stats()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM roles),
    'total_uploads', (SELECT COUNT(*) FROM submissions),
    'approved', (SELECT COUNT(*) FROM submissions WHERE status='approved'),
    'pending', (SELECT COUNT(*) FROM submissions WHERE status='pending'),
    'rejected', (SELECT COUNT(*) FROM submissions WHERE status='rejected'),
    'active_7', (
      SELECT COUNT(*) FROM roles
      WHERE last_login_date >= CURRENT_DATE - INTERVAL '7 days'
    )
  );
$$;

-- ============================================
-- 5. DEVELOPER TOOL RPCs
-- Access: Founder only (checked in function)
-- ============================================

CREATE OR REPLACE FUNCTION reset_user_xp(target uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (SELECT primary_role FROM roles WHERE user_id = auth.uid()) <> 'Founder' THEN
    RAISE EXCEPTION 'Unauthorized: Founder only';
  END IF;
  UPDATE roles SET xp = 0, level = 0 WHERE user_id = target;
END;
$$;

CREATE OR REPLACE FUNCTION reset_achievements(target uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (SELECT primary_role FROM roles WHERE user_id = auth.uid()) <> 'Founder' THEN
    RAISE EXCEPTION 'Unauthorized: Founder only';
  END IF;
  DELETE FROM achievements WHERE user_id = target;
END;
$$;

CREATE OR REPLACE FUNCTION reset_streak(target uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (SELECT primary_role FROM roles WHERE user_id = auth.uid()) <> 'Founder' THEN
    RAISE EXCEPTION 'Unauthorized: Founder only';
  END IF;
  UPDATE roles SET streak_count = 0, last_login_date = NULL WHERE user_id = target;
END;
$$;

CREATE OR REPLACE FUNCTION reset_submissions(target uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (SELECT primary_role FROM roles WHERE user_id = auth.uid()) <> 'Founder' THEN
    RAISE EXCEPTION 'Unauthorized: Founder only';
  END IF;
  DELETE FROM submissions WHERE user_id = target;
END;
$$;

CREATE OR REPLACE FUNCTION recalc_levels()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (SELECT primary_role FROM roles WHERE user_id = auth.uid()) <> 'Founder' THEN
    RAISE EXCEPTION 'Unauthorized: Founder only';
  END IF;
  UPDATE roles SET level = calculate_level_from_xp(xp);
END;
$$;

CREATE OR REPLACE FUNCTION rebuild_achievements()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (SELECT primary_role FROM roles WHERE user_id = auth.uid()) <> 'Founder' THEN
    RAISE EXCEPTION 'Unauthorized: Founder only';
  END IF;
  -- Rebuild first_upload achievements
  INSERT INTO achievements (user_id, badge_type, awarded_at)
  SELECT DISTINCT user_id, 'first_upload', NOW()
  FROM submissions
  WHERE user_id NOT IN (
    SELECT user_id FROM achievements WHERE badge_type = 'first_upload'
  )
  ON CONFLICT DO NOTHING;
END;
$$;
