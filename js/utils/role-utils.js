// js/utils/role-utils.js
// ============================================
// ROLE UTILITIES
// Hard verification from database (no frontend guessing)
// ============================================

/**
 * Map role level to display name and icon
 * Centralized mapping function - SINGLE SOURCE OF TRUTH
 * NOTE: Level is COSMETIC only (from XP). System permissions
 * are controlled by primary_role, NOT by level.
 * Phase 4 Restructure XP tiers:
 *   0   = Visitor       (0 XP)
 *   5   = Explorer      (100 XP)
 *   10  = Contributor   (300 XP)
 *   25  = Veteran       (800 XP)
 *   50  = Senior        (1500 XP)
 *   90  = Elite         (3000 XP)
 *   100 = Legend         (5000 XP)
 * @param {number} level - Role level from database (cosmetic)
 * @returns {Object} {name, displayName, icon}
 */
function mapRole(level) {
  if (level >= 100) {
    return {
      name: 'legend',
      displayName: '🏆 Legend',
      icon: '🏆',
      level
    };
  }
  if (level >= 90) {
    return {
      name: 'elite',
      displayName: '⚡ Elite',
      icon: '⚡',
      level
    };
  }
  if (level >= 50) {
    return {
      name: 'senior',
      displayName: '🛡️ Senior',
      icon: '🛡️',
      level
    };
  }
  if (level >= 25) {
    return {
      name: 'veteran',
      displayName: '📋 Veteran',
      icon: '📋',
      level
    };
  }
  if (level >= 10) {
    return {
      name: 'contributor',
      displayName: '✍️ Contributor',
      icon: '✍️',
      level
    };
  }
  if (level >= 5) {
    return {
      name: 'explorer',
      displayName: '🔍 Explorer',
      icon: '🔍',
      level
    };
  }
  return {
    name: 'visitor',
    displayName: '👁️ Visitor',
    icon: '👁️',
    level
  };
}

/**
 * Get current user's role level from database
 * Returns the numeric level, defaults to 10 if no role exists
 * @returns {Promise<number>} Role level
 */
async function getCurrentUserRoleLevel() {
  try {
    // Wait for Supabase to be ready
    const supabase = await window.waitForSupabase();
    if (!supabase) {
      console.warn('[ROLE-UTILS] Supabase not ready');
      return 10; // Default to contributor
    }

    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return 0; // Visitor/guest
    }

    // Use backend RPC function to get role level
    const { data: roleLevel, error } = await supabase.rpc('get_user_role_level', {
      user_id_param: session.user.id
    });

    if (error) {
      console.warn('[ROLE-UTILS] Error getting role level, defaulting to 10:', error);
      return 10; // Default to contributor
    }

    // If no role row exists, default to 10 (contributor)
    return roleLevel !== null && roleLevel !== undefined ? roleLevel : 10;
  } catch (err) {
    console.error('[ROLE-UTILS] Error getting user role level:', err);
    return 10; // Default to contributor
  }
}

/**
 * Get current user's role from database
 * Uses primary_role as the source of truth for permissions
 * @returns {Promise<string>} Role name: "admin", "reviewer", "contributor", or "guest"
 */
async function getCurrentUserRole() {
  try {
    // Wait for Supabase to be ready
    const supabase = await window.waitForSupabase();
    if (!supabase) {
      console.warn('[ROLE-UTILS] Supabase not ready');
      return "guest";
    }

    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return "guest";
    }

    // Use primary_role for permission checks
    const { data, error } = await supabase
      .from('roles')
      .select('primary_role')
      .eq('user_id', session.user.id)
      .single();

    if (error || !data || !data.primary_role) {
      return "visitor";
    }

    const role = data.primary_role;
    if (role === 'Founder' || role === 'Admin') return 'admin';
    if (role === 'Senior Moderator') return 'senior_moderator';
    if (role === 'Reviewer') return 'reviewer';
    if (role === 'Contributor') return 'contributor';
    return 'visitor';
  } catch (err) {
    console.error('[ROLE-UTILS] Error getting user role:', err);
    return "visitor";
  }
}

/**
 * Check if current user is admin
 * @returns {Promise<boolean>} True if user is admin
 */
async function isCurrentUserAdmin() {
  const role = await getCurrentUserRole();
  return role === "admin";
}

/**
 * Check if current user has at least reviewer access (via primary_role)
 * @returns {Promise<boolean>} True if user has reviewer+ role
 */
async function isCurrentUserReviewer() {
  const role = await getCurrentUserRole();
  return role === 'admin' || role === 'senior_moderator' || role === 'reviewer';
}

// Expose to window
window.RoleUtils = {
  mapRole,
  getCurrentUserRoleLevel,
  getCurrentUserRole,
  isCurrentUserAdmin,
  isCurrentUserReviewer
};
