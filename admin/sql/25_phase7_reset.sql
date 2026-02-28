-- ============================================
-- PHASE 7: DATABASE RESET MIGRATION
-- Prepares the database for Phase 7 launch.
--
-- Actions:
--   1. Clear XP, level, streak, cooldowns for all users
--   2. Delete all achievements
--   3. Delete all submissions (demo + real)
--   4. Delete all approved_papers
--   5. Delete all paper_requests and votes
--   6. Reset all roles to 'Visitor' EXCEPT Founder
--   7. Clear user_profiles stats (last_login_at, promoted_at)
--
-- Safety: All UPDATE/DELETE statements include WHERE clauses.
-- The Founder role is explicitly preserved.
-- ============================================

-- 1. Reset XP, level, streak, cooldowns for all non-Founder users
UPDATE public.roles
SET xp = 0,
    level = 0,
    streak_count = 0,
    last_login_date = NULL,
    last_role_change = NULL
WHERE primary_role != 'Founder';

-- 2. Reset Founder stats (keep role intact)
UPDATE public.roles
SET xp = 0,
    level = 0,
    streak_count = 0,
    last_login_date = NULL,
    last_role_change = NULL
WHERE primary_role = 'Founder';

-- 3. Reset all non-Founder roles to Visitor
UPDATE public.roles
SET primary_role = 'Visitor',
    secondary_role = NULL,
    tertiary_role = NULL
WHERE primary_role != 'Founder';

-- 4. Delete all achievements
DELETE FROM public.achievements WHERE id IS NOT NULL;

-- 5. Delete all submissions
DELETE FROM public.submissions WHERE id IS NOT NULL;

-- 6. Delete all approved papers
DELETE FROM public.approved_papers WHERE id IS NOT NULL;

-- 7. Delete all paper requests and votes
DELETE FROM public.paper_request_votes WHERE id IS NOT NULL;
DELETE FROM public.paper_requests WHERE id IS NOT NULL;

-- 8. Clear user_profiles stats
UPDATE public.user_profiles
SET last_login_at = NULL,
    promoted_at = NULL
WHERE id IS NOT NULL;

-- 9. Refresh schema cache
NOTIFY pgrst, 'reload schema';
