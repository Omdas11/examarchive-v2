// js/utils/role-utils.js
// ============================================
// ROLE UTILITIES
// Hard verification from database (no frontend guessing)
// ============================================

/**
 * Map role level to display name and icon
 * Centralized mapping function - SINGLE SOURCE OF TRUTH
 * Phase 3 hierarchy:
 *   0   = Visitor
 *   10  = User
 *   20  = Contributor (auto after first upload)
 *   50  = Reviewer
 *   75  = Moderator (can approve)
 *   90  = Senior Moderator (can publish)
 *   100 = Founder/Admin (full access)
 * @param {number} level - Role level from database
 * @returns {Object} {name, displayName, icon}
 */
function mapRole(level) {
  if (level >= 100) {
    return {
      name: 'admin',
      displayName: '👑 Founder',
      icon: '👑',
      level
    };
  }
  if (level >= 90) {
    return {
      name: 'senior_moderator',
      displayName: '🔰 Senior Moderator',
      icon: '🔰',
      level
    };
  }
  if (level >= 75) {
    return {
      name: 'moderator',
      displayName: '🛡️ Moderator',
      icon: '🛡️',
      level
    };
  }
  if (level >= 50) {
    return {
      name: 'reviewer',
      displayName: '📋 Reviewer',
      icon: '📋',
      level
    };
  }
  if (level >= 20) {
    return {
      name: 'contributor',
      displayName: '✍️ Contributor',
      icon: '✍️',
      level
    };
  }
  if (level >= 10) {
    return {
      name: 'user',
      displayName: '👤 User',
      icon: '👤',
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
 * Check if current user has at least reviewer access (level >= 75)
 * @returns {Promise<boolean>} True if user level >= 75
 */
async function isCurrentUserReviewer() {
  const level = await getCurrentUserRoleLevel();
  return level >= 75;
}

// Expose to window
window.RoleUtils = {
  mapRole,
  getCurrentUserRoleLevel,
  getCurrentUserRole,
  isCurrentUserAdmin,
  isCurrentUserReviewer
};
