-- ============================================
-- PHASE 6: ROLE CHANGE BUG FIX
-- Fixes update_user_role RPC to:
--   1. Validate target UUID exists in roles table
--   2. Raise exception if target user not found
--      (previously silently succeeded with 0 rows updated)
--   3. Explicitly sync user_profiles.role after role change
-- ============================================

CREATE OR REPLACE FUNCTION public.update_user_role(
  target_user_id uuid,
  new_role text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_id       uuid;
  actor_role     text;
  cooldown_hours int;
  last_change    timestamptz;
  time_remaining interval;
BEGIN
  -- Authenticate the caller
  actor_id := auth.uid();
  IF actor_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate target_user_id is provided
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Target user ID is required';
  END IF;

  -- Get actor role
  SELECT primary_role INTO actor_role
  FROM public.roles
  WHERE user_id = actor_id;

  IF actor_role IS NULL THEN
    RAISE EXCEPTION 'Actor role not found';
  END IF;

  -- Only Founder/Admin can change roles
  IF actor_role NOT IN ('Founder', 'Admin') THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  -- Verify target user exists in roles table before any writes
  IF NOT EXISTS (SELECT 1 FROM public.roles WHERE user_id = target_user_id) THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;

  -- Prevent non-Founder from assigning Founder role
  IF new_role = 'Founder' AND actor_role != 'Founder' THEN
    RAISE EXCEPTION 'Only the Founder can assign the Founder role';
  END IF;

  -- Determine cooldown based on actor role
  CASE actor_role
    WHEN 'Founder'          THEN cooldown_hours := 2;
    WHEN 'Admin'            THEN cooldown_hours := 3;
    WHEN 'Senior Moderator' THEN cooldown_hours := 6;
    WHEN 'Moderator'        THEN cooldown_hours := 12;
    ELSE                         cooldown_hours := 24;
  END CASE;

  -- Check cooldown for actor (not target)
  SELECT last_role_change INTO last_change
  FROM public.roles
  WHERE user_id = actor_id;

  IF last_change IS NOT NULL AND (NOW() - last_change) < (cooldown_hours || ' hours')::interval THEN
    time_remaining := (last_change + (cooldown_hours || ' hours')::interval) - NOW();
    RAISE EXCEPTION 'Cooldown active. Approximately % hour(s) and % minute(s) remaining.',
      FLOOR(EXTRACT(EPOCH FROM time_remaining) / 3600),
      FLOOR(MOD(EXTRACT(EPOCH FROM time_remaining), 3600) / 60);
  END IF;

  -- Update the target user role (target existence already validated above)
  UPDATE public.roles
  SET primary_role = new_role
  WHERE user_id = target_user_id;

  -- Update actor cooldown timestamp
  UPDATE public.roles
  SET last_role_change = NOW()
  WHERE user_id = actor_id;

  -- Sync user_profiles.role via direct update (trigger handles this, but
  -- explicit sync guards against trigger being absent in older deployments)
  INSERT INTO user_profiles (id, role, promoted_at)
  VALUES (target_user_id, LOWER(new_role), NOW())
  ON CONFLICT (id) DO UPDATE
    SET role        = EXCLUDED.role,
        promoted_at = EXCLUDED.promoted_at;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_user_role(uuid, text) TO authenticated;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
