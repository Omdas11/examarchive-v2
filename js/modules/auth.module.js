// js/modules/auth.module.js
// ============================================
// AUTH MODULE - Phase 9.2.4
// Handles authentication state management
// Does NOT call getSession() - that's done in supabase.js
// ============================================

import { supabase } from "../supabase.js";

/**
 * Initialize authentication listeners
 * This MUST be called after supabase.js initializes
 */
export async function initAuth() {
  console.log('[AUTH-MODULE] Setting up auth state listener...');
  
  try {
    // Wait for app:ready event to ensure session is initialized
    document.addEventListener('app:ready', () => {
      console.log('[AUTH-MODULE] App ready, session available');
      
      // Store session globally for backward compatibility
      window.__SESSION__ = window.App.session;
      window.__AUTH_READY__ = true;
      
      if (window.App.session) {
        console.log('[AUTH-MODULE] Session active:', window.App.session.user.email);
      } else {
        console.log('[AUTH-MODULE] No active session');
      }
    });
    
    // Set up auth state listener
    supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AUTH-MODULE] Auth state changed:', event);
      window.App.session = session;
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
  return window.App?.session || window.__SESSION__;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  return !!(window.App?.session || window.__SESSION__);
}

/**
 * Logout user
 */
export async function logout() {
  console.log('[AUTH-MODULE] Logging out...');
  await supabase.auth.signOut();
  window.App.session = null;
  window.__SESSION__ = null;
}
