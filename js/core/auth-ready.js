// js/core/auth-ready.js
// ============================================
// GLOBAL AUTH HELPER - Phase 2.0
// Reusable async session checker for all protected pages
// ============================================

/**
 * Wait for Supabase session to be available
 * Use this BEFORE any Supabase query on protected pages
 *
 * @returns {Promise<Object|null>} Session object or null
 */
window.waitForSession = async function () {
  try {
    const supabase = window.getSupabase ? window.getSupabase() : null;
    if (!supabase) {
      console.warn('[AUTH-READY] Supabase client not available');
      return null;
    }

    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch (err) {
    console.error('[AUTH-READY] Error getting session:', err);
    return null;
  }
};
