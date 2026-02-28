-- ============================================
-- Phase 7.1: Remove last_login timestamp logic
-- Run this migration to clean up last_login columns and RPCs
-- ============================================

-- Drop the update_last_login RPC function
DROP FUNCTION IF EXISTS public.update_last_login();

-- Drop the get_user_last_sign_in RPC function
DROP FUNCTION IF EXISTS public.get_user_last_sign_in(uuid);

-- Drop the get_all_last_sign_ins RPC function
DROP FUNCTION IF EXISTS public.get_all_last_sign_ins();

-- Remove last_login_date column from roles table (if exists)
ALTER TABLE public.roles DROP COLUMN IF EXISTS last_login_date;

-- Remove last_login_at column from user_profiles table (if exists)
ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS last_login_at;
