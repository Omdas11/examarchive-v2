-- ============================================
-- Phase 7.1: Custom Badge Assignment RPC
-- Senior Moderator+ can assign Custom Badge 1 & 2
-- to users whose role tier is <= their own
-- No cooldown. Backend validated.
-- ============================================

-- Role tier mapping: lower number = higher rank
-- Founder=0, Admin=1, Senior Moderator=2, Moderator=3,
-- Reviewer=4, Contributor=5, Explorer=6, Visitor=7

CREATE OR REPLACE FUNCTION public.assign_custom_badges(
  target_user_id UUID,
  new_secondary_role TEXT DEFAULT NULL,
  new_tertiary_role TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID := auth.uid();
  caller_role TEXT;
  target_role TEXT;
  caller_tier INT;
  target_tier INT;
BEGIN
  -- Get caller's primary_role
  SELECT primary_role INTO caller_role
  FROM roles WHERE user_id = caller_id;

  IF caller_role IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Caller not found');
  END IF;

  -- Map roles to tiers
  caller_tier := CASE caller_role
    WHEN 'Founder' THEN 0
    WHEN 'Admin' THEN 1
    WHEN 'Senior Moderator' THEN 2
    WHEN 'Moderator' THEN 3
    WHEN 'Reviewer' THEN 4
    WHEN 'Contributor' THEN 5
    WHEN 'Explorer' THEN 6
    WHEN 'Visitor' THEN 7
    ELSE 99
  END;

  -- Only Senior Moderator+ (tier <= 2) can assign badges
  IF caller_tier > 2 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient permissions: Senior Moderator or above required');
  END IF;

  -- Get target's primary_role
  SELECT primary_role INTO target_role
  FROM roles WHERE user_id = target_user_id;

  IF target_role IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Target user not found');
  END IF;

  target_tier := CASE target_role
    WHEN 'Founder' THEN 0
    WHEN 'Admin' THEN 1
    WHEN 'Senior Moderator' THEN 2
    WHEN 'Moderator' THEN 3
    WHEN 'Reviewer' THEN 4
    WHEN 'Contributor' THEN 5
    WHEN 'Explorer' THEN 6
    WHEN 'Visitor' THEN 7
    ELSE 99
  END;

  -- Can only assign badges to users at or below caller's tier
  IF target_tier < caller_tier THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot assign badges to users with higher role tier');
  END IF;

  -- Perform the update
  -- NULL parameter = no change, empty string = clear badge
  UPDATE roles
  SET
    secondary_role = CASE
      WHEN new_secondary_role IS NULL THEN secondary_role
      WHEN new_secondary_role = '' THEN NULL
      ELSE new_secondary_role
    END,
    tertiary_role = CASE
      WHEN new_tertiary_role IS NULL THEN tertiary_role
      WHEN new_tertiary_role = '' THEN NULL
      ELSE new_tertiary_role
    END,
    updated_at = now()
  WHERE user_id = target_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$;
