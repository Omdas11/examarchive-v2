// js/utils/role-utils.js
// ============================================
// ROLE UTILITIES
// Hard verification from database (no frontend guessing)
// ============================================

/**
 * Map role level to display name and icon
 * Centralized mapping function - SINGLE SOURCE OF TRUTH
 * @param {number} level - Role level from database
 * @returns {Object} {name, displayName, icon}
 */
function mapRole(level) {
  if (level >= 100) {
    return {
      name: 'admin',
      displayName: '👑 Admin',
      icon: '👑'
    };
  }
  if (level >= 80) {
    return {
      name: 'reviewer',
      displayName: '🛡️ Reviewer',
      icon: '🛡️'
    };
  }
  if (level >= 10) {
    return {
      name: 'contributor',
      displayName: '✍️ Contributor',
      icon: '✍️'
    };
  }
  return {
    name: 'visitor',
    displayName: '👤 Visitor',
    icon: '👤'
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

    // Get role level directly from roles table (fresh, no caching)
    const { data: roleRow, error } = await supabase
      .from('roles')
      .select('level')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (error) {
      console.warn('[ROLE-UTILS] Error getting role level, defaulting to 10:', error);
      return 10; // Default to contributor
    }

    // If no role row exists, default to 10 (contributor)
    return (roleRow?.level !== null && roleRow?.level !== undefined) ? roleRow.level : 10;
  } catch (err) {
    console.error('[ROLE-UTILS] Error getting user role level:', err);
    return 10; // Default to contributor
  }
}

/**
 * Get current user's role from database
 * This is the ONLY reliable way to check user role
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

    // Use backend RPC function to get role (same as AdminAuth)
    const { data: roleName, error } = await supabase.rpc('get_user_role_name', {
      user_id_param: session.user.id
    });

    if (error) {
      console.warn('[ROLE-UTILS] Error getting role, defaulting to "contributor":', error);
      return "contributor";
    }

    return roleName ? roleName.toLowerCase() : "contributor";
  } catch (err) {
    console.error('[ROLE-UTILS] Error getting user role:', err);
    return "contributor";
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
 * Check if current user has at least reviewer access
 * @returns {Promise<boolean>} True if user is admin or reviewer
 */
async function isCurrentUserReviewer() {
  const role = await getCurrentUserRole();
  return role === "admin" || role === "reviewer";
}

// Expose to window
window.RoleUtils = {
  mapRole,
  getCurrentUserRoleLevel,
  getCurrentUserRole,
  isCurrentUserAdmin,
  isCurrentUserReviewer
};
