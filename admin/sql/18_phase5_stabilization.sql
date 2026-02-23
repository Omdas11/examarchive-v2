-- ============================================
-- PHASE 5 STABILIZATION MIGRATION
-- Fix: User management RPC, RLS policies
-- ============================================

-- 1. Update list_all_users_full to include avatar_url
--    so admins don't need a separate RLS-restricted query
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
    r.last_login_date,
    r.avatar_url
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

-- 2. RLS policy: Allow Founder/Admin to SELECT all rows from roles
--    This ensures supplementary queries (avatar, badges) work for admins
CREATE POLICY "Admins can view all roles"
ON roles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM roles r
    WHERE r.user_id = auth.uid()
    AND r.primary_role IN ('Founder', 'Admin', 'Senior Moderator')
  )
);
