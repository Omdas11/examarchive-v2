// js/auth.js
// ============================================
// AUTH CONTRACT - Phase 9.2.8
// SINGLE SOURCE OF TRUTH for authentication
// This is the ONLY file allowed to reason about auth
// ============================================

console.log("🔐 auth.js loaded - Phase 9.2.8");

/**
 * Wait for Supabase client to be initialized
 * @param {number} timeout - Max time to wait in ms (default 10000)
 * @returns {Promise<Object|null>} Supabase client or null on timeout
 */
async function waitForSupabase(timeout = 10000) {
  // If already available, return immediately
  if (window.__supabase__) {
    return window.__supabase__;
  }

  // Wait for app:ready event or check periodically
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    // Set up app:ready listener
    const readyHandler = () => {
      if (window.__supabase__) {
        resolve(window.__supabase__);
      }
    };
    document.addEventListener('app:ready', readyHandler, { once: true });
    
    // Also poll in case event was already fired
    const interval = setInterval(() => {
      if (window.__supabase__) {
        clearInterval(interval);
        document.removeEventListener('app:ready', readyHandler);
        resolve(window.__supabase__);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(interval);
        document.removeEventListener('app:ready', readyHandler);
        console.error('[AUTH] Timeout waiting for Supabase client');
        resolve(null);
      }
    }, 50);
  });
}

/**
 * Get Supabase client (helper)
 * @returns {Object} Supabase client
 */
function getSupabaseClient() {
  if (!window.__supabase__) {
    console.warn('[AUTH] Supabase client not yet available');
    return null;
  }
  return window.__supabase__;
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

  // Get supabase client directly (should be ready after requireSession)
  const supabase = window.__supabase__;
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
