// js/modules/auth.module.js
// ============================================
// AUTH MODULE - Phase 9.2.3
// Handles authentication initialization and session management
// This is the ONLY place that uses ES module imports for auth
// ============================================

import { supabase } from "../supabase.js";

/**
 * Initialize authentication
 * This MUST be called first before any other module
 */
export async function initAuth() {
  console.log('[AUTH-MODULE] Initializing authentication...');
  
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('[AUTH-MODULE] Error getting session:', error);
      window.__SESSION__ = null;
      window.__AUTH_READY__ = true;
      return;
    }
    
    if (!data.session) {
      console.log('[AUTH-MODULE] No active session');
      window.__SESSION__ = null;
      window.__AUTH_READY__ = true;
      return;
    }
    
    // Store session globally
    window.__SESSION__ = data.session;
    window.__AUTH_READY__ = true;
    
    console.log('[AUTH-MODULE] Session restored:', data.session.user.email);
    
    // Set up auth state listener
    supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AUTH-MODULE] Auth state changed:', event);
      window.__SESSION__ = session;
      
      // Trigger custom event for other parts of the app
      window.dispatchEvent(new CustomEvent('auth-state-changed', {
        detail: { event, session }
      }));
    });
    
  } catch (err) {
    console.error('[AUTH-MODULE] Fatal error during auth init:', err);
    window.__SESSION__ = null;
    window.__AUTH_READY__ = true;
  }
}

/**
 * Get current session (safe accessor)
 */
export function getSession() {
  return window.__SESSION__;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  return !!window.__SESSION__;
}

/**
 * Logout user
 */
export async function logout() {
  console.log('[AUTH-MODULE] Logging out...');
  await supabase.auth.signOut();
  window.__SESSION__ = null;
}
