// js/auth.js
// ============================================
// AUTH CONTRACT - Phase 9.2.8
// SINGLE SOURCE OF TRUTH for authentication
// This is the ONLY file allowed to reason about auth
// ============================================

console.log("🔐 auth.js loaded - Phase 9.2.8");

/**
 * Wait for Supabase client to be initialized
 * This now delegates to the global waitForSupabase from supabase-client.js
 * @param {number} timeout - Max time to wait in ms (default 10000)
 * @returns {Promise<Object|null>} Supabase client or null on timeout
 */
async function waitForSupabase(timeout = 10000) {
  // Use the global waitForSupabase from supabase-client.js
  if (window.waitForSupabase) {
    return await window.waitForSupabase(timeout);
  }
  
  // Fallback: try to get client directly
  const client = window.getSupabase ? window.getSupabase() : null;
  return client || null;
}

/**
 * Get Supabase client (helper)
 * @returns {Object} Supabase client
 */
function getSupabaseClient() {
  const client = window.getSupabase ? window.getSupabase() : null;
  if (!client) {
    console.warn('[AUTH] Supabase client not yet available');
    return null;
  }
  return client;
}

/**
 * Require active session
 * This is the ONLY way to check authentication
 * Waits for Supabase to be initialized first
 * @returns {Promise<Object|null>} Session object or null
 */
async function requireSession() {
  // Wait for Supabase to be ready
  const supabase = await waitForSupabase();
  if (!supabase) {
    console.error('[AUTH] Supabase not initialized after waiting');
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
 * Waits for Supabase to be initialized first
 * @param {Array<string>} allowedRoles - Array of allowed role names (e.g., ['admin', 'reviewer'])
 * @returns {Promise<Object|null>} Session object or null if not authorized
 */
async function requireRole(allowedRoles = []) {
  // First check session (this already waits for Supabase)
  const session = await requireSession();
  if (!session) {
    console.log('[AUTH] No session for role check');
    return null;
  }

  // Get supabase client
  const supabase = window.getSupabase ? window.getSupabase() : null;
  if (!supabase) {
    console.error('[AUTH] Supabase not available for role check');
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
