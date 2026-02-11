// js/utils/role-utils.js
// ============================================
// ROLE UTILITIES - Phase 1.2
// Hard verification from database (no frontend guessing)
// ============================================

/**
 * Get current user's role from database
 * This is the ONLY reliable way to check user role
 * @returns {Promise<string>} Role name: "admin", "reviewer", "user", or "guest"
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

    // Query user_roles table directly
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .single();

    if (error || !data) {
      console.warn('[ROLE-UTILS] No role found in user_roles, defaulting to "user"');
      return "user";
    }

    return data.role.toLowerCase();
  } catch (err) {
    console.error('[ROLE-UTILS] Error getting user role:', err);
    return "user";
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
