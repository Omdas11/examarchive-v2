-- ============================================
-- PHASE 6 STABILIZATION
-- 1. user_profiles table (clean architecture)
-- 2. RLS policies for user_profiles
-- 3. Migrate existing avatars from roles table
-- 4. Trigger: sync role changes to user_profiles
-- 5. RPC: update_last_login()
-- ============================================

-- ============================================
-- 1. CREATE user_profiles TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar_url text,
  role text DEFAULT 'user',
  promoted_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 2. ENABLE RLS
-- ============================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before recreating (idempotent)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_profiles' AND policyname = 'Users can view own profile') THEN
    DROP POLICY "Users can view own profile" ON user_profiles;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_profiles' AND policyname = 'Users can update own profile') THEN
    DROP POLICY "Users can update own profile" ON user_profiles;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_profiles' AND policyname = 'Users can insert own profile') THEN
    DROP POLICY "Users can insert own profile" ON user_profiles;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_profiles' AND policyname = 'Admins can view all profiles') THEN
    DROP POLICY "Admins can view all profiles" ON user_profiles;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_profiles' AND policyname = 'Admins can manage all profiles') THEN
    DROP POLICY "Admins can manage all profiles" ON user_profiles;
  END IF;
END
$$;

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile (avatar_url, last_login_at only)
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile row
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Admins/Founders can read all profiles
CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM roles r
      WHERE r.user_id = auth.uid()
        AND r.primary_role IN ('Founder', 'Admin', 'Senior Moderator')
    )
  );

-- Admins/Founders can manage (update/delete) all profiles
CREATE POLICY "Admins can manage all profiles"
  ON user_profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM roles r
      WHERE r.user_id = auth.uid()
        AND r.primary_role IN ('Founder', 'Admin')
    )
  );

GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;

-- ============================================
-- 3. MIGRATE EXISTING DATA FROM roles TABLE
-- Populate user_profiles from current roles data.
-- avatar_url: from roles (custom avatar takes priority over OAuth metadata).
-- role: lowercase of primary_role.
-- ON CONFLICT: update avatar_url and role if row already exists.
-- ============================================
INSERT INTO user_profiles (id, avatar_url, role, created_at)
SELECT
  r.user_id,
  r.avatar_url,
  LOWER(COALESCE(r.primary_role, 'user')),
  NOW()
FROM roles r
ON CONFLICT (id) DO UPDATE
  SET avatar_url = EXCLUDED.avatar_url,
      role       = EXCLUDED.role;

-- ============================================
-- 4. TRIGGER: sync role changes to user_profiles
-- When roles.primary_role changes, update user_profiles.role
-- and set promoted_at to the current timestamp.
-- ============================================
CREATE OR REPLACE FUNCTION sync_user_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- IS DISTINCT FROM handles NULL safely: fires when transitioning from/to NULL roles
  IF NEW.primary_role IS DISTINCT FROM OLD.primary_role THEN
    INSERT INTO user_profiles (id, role, promoted_at)
    VALUES (NEW.user_id, LOWER(COALESCE(NEW.primary_role, 'user')), NOW())
    ON CONFLICT (id) DO UPDATE
      SET role       = EXCLUDED.role,
          promoted_at = EXCLUDED.promoted_at;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_role_to_user_profiles ON roles;
CREATE TRIGGER sync_role_to_user_profiles
  AFTER UPDATE OF primary_role ON roles
  FOR EACH ROW EXECUTE FUNCTION sync_user_profile_role();

-- ============================================
-- 5. RPC: update_last_login()
-- Called by the frontend after each login / session restore.
-- Upserts the authenticated user's last_login_at in user_profiles.
-- ============================================
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_profiles (id, last_login_at)
  VALUES (auth.uid(), NOW())
  ON CONFLICT (id) DO UPDATE
    SET last_login_at = EXCLUDED.last_login_at;
END;
$$;

GRANT EXECUTE ON FUNCTION update_last_login TO authenticated;

-- ============================================
-- 6. RELOAD SCHEMA CACHE
-- ============================================
NOTIFY pgrst, 'reload schema';
