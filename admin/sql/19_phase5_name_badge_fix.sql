-- ============================================
-- PHASE 5 NAME + BADGE FIX MIGRATION
-- Fix: display_name fallback from auth.users.raw_user_meta_data->>'name'
-- So users who signed in via Google OAuth but never set a display name
-- will still show their Google display name in User Management.
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
  last_login_date date,
  avatar_url text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    r.user_id,
    COALESCE(NULLIF(TRIM(r.display_name), ''), u.raw_user_meta_data->>'name') AS display_name,
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
    r.last_login_date,
    r.avatar_url
  FROM roles r
  LEFT JOIN auth.users u ON u.id = r.user_id
  LEFT JOIN (
    SELECT user_id,
      COUNT(*)::integer AS uploads,
      COUNT(*) FILTER (WHERE status='approved')::integer AS approved,
      COUNT(*) FILTER (WHERE status='rejected')::integer AS rejected
    FROM submissions
    GROUP BY user_id
  ) s ON s.user_id = r.user_id;
$$;
