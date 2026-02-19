// js/utils/role-utils.js
// ============================================
// ROLE UTILITIES - Phase 1.2
// Hard verification from database (no frontend guessing)
// ============================================

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
  getCurrentUserRole,
  isCurrentUserAdmin,
  isCurrentUserReviewer
};
