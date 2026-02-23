-- ============================================
-- PHASE 5.3 STABILIZATION MIGRATION
-- Fix: support_submissions type column (schema cache)
-- Add: lookup_user_by_identifier RPC (email/username/UUID)
-- ============================================

-- 1. Ensure 'type' column exists on support_submissions
--    Fixes schema cache errors if the column was added later or cache is stale
ALTER TABLE support_submissions
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'general';

-- 2. Drop and recreate lookup_user_by_identifier RPC
DROP FUNCTION IF EXISTS lookup_user_by_identifier(text);

CREATE OR REPLACE FUNCTION lookup_user_by_identifier(identifier text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role text;
  result_id uuid;
  uuid_pattern text := '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';
BEGIN
  -- Only Founder can call this
  SELECT primary_role INTO caller_role FROM roles WHERE user_id = auth.uid();
  IF caller_role IS NULL OR caller_role != 'Founder' THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  -- If input looks like a UUID, look up directly in roles
  IF identifier ~* uuid_pattern THEN
    SELECT user_id INTO result_id FROM roles WHERE user_id = identifier::uuid;
    RETURN result_id;
  END IF;

  -- Try username match (case-insensitive)
  SELECT user_id INTO result_id
    FROM roles
    WHERE lower(username) = lower(trim(identifier))
    LIMIT 1;
  IF result_id IS NOT NULL THEN RETURN result_id; END IF;

  -- Try email match via auth.users (requires SECURITY DEFINER)
  SELECT id INTO result_id
    FROM auth.users
    WHERE lower(email) = lower(trim(identifier))
    LIMIT 1;
  RETURN result_id;
END;
$$;

GRANT EXECUTE ON FUNCTION lookup_user_by_identifier TO authenticated;

-- 3. Notify PostgREST to reload schema cache
--    This resolves "column not found" errors after schema changes
NOTIFY pgrst, 'reload schema';
