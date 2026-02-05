// js/auth.js
// ============================================
// AUTH CONTRACT - Phase 9.2.5
// SINGLE SOURCE OF TRUTH for authentication
// This is the ONLY file allowed to reason about auth
// ============================================

console.log("🔐 auth.js loaded - Phase 9.2.5");

/**
 * Get Supabase client (helper)
 * @returns {Object} Supabase client
 */
function getSupabaseClient() {
  if (!window.__supabase__) {
    console.error('[AUTH] Supabase client not available');
    return null;
  }
  return window.__supabase__;
}

/**
 * Require active session
 * This is the ONLY way to check authentication
 * @returns {Promise<Object|null>} Session object or null
 */
async function requireSession() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.error('[AUTH] Supabase not initialized');
    return null;
  }

  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('[AUTH] Error getting session:', error);
      return null;
    }
    
    if (!data?.session) {
      console.log('[AUTH] No active session');
      return null;
    }
    
    console.log('[AUTH] Session verified:', data.session.user.email);
    return data.session;
  } catch (err) {
    console.error('[AUTH] Exception in requireSession:', err);
    return null;
  }
}

/**
 * Require role-based access
 * Checks if user has one of the allowed roles
 * @param {Array<string>} allowedRoles - Array of allowed role names (e.g., ['admin', 'reviewer'])
 * @returns {Promise<Object|null>} Session object or null if not authorized
 */
async function requireRole(allowedRoles = []) {
  // First check session
  const session = await requireSession();
  if (!session) {
    console.log('[AUTH] No session for role check');
    return null;
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return null;
  }

  try {
    // Get user role from backend
    const { data, error } = await supabase.rpc('get_user_role_name', { 
      user_id_param: session.user.id 
    });

    if (error) {
      console.error('[AUTH] Error getting user role:', error);
      return null;
    }

    const userRole = data;
    console.log('[AUTH] User role:', userRole);

    // Check if user has required role
    if (!allowedRoles.includes(userRole)) {
      console.log('[AUTH] Access denied - role not allowed:', userRole);
      return null;
    }

    console.log('[AUTH] Role check passed:', userRole);
    return session;
  } catch (err) {
    console.error('[AUTH] Exception in requireRole:', err);
    return null;
  }
}

// Expose functions globally for classic scripts
window.AuthContract = {
  requireSession,
  requireRole
};
