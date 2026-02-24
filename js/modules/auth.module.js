// js/modules/auth.module.js
// ============================================
// AUTH MODULE — Clean Architecture
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
  
  if (!supabase) {
    console.warn('[AUTH-MODULE] Supabase not available - auth will not work');
    return;
  }
  
  try {
    document.addEventListener('app:ready', () => {
      console.log('[AUTH-MODULE] App ready, session available');
      
      if (window.App?.session) {
        console.log('[AUTH-MODULE] Session active:', window.App.session.user.email);
      } else {
        console.log('[AUTH-MODULE] No active session');
      }
    });
    
    // NOTE: auth-controller.js registers the single onAuthStateChange listener
    // and fires the 'auth-state-changed' event.  Do NOT add another listener
    // here to avoid duplicate events that cause double re-renders.
    
  } catch (err) {
    console.error('[AUTH-MODULE] Fatal error during auth init:', err);
  }
}

/**
 * Get current session (safe accessor)
 */
export function getSession() {
  return window.App?.session || null;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  return !!window.App?.session;
}

/**
 * Logout user
 */
export async function logout() {
  console.log('[AUTH-MODULE] Logging out...');
  if (!supabase) {
    console.warn('[AUTH-MODULE] Supabase not available - cannot logout');
    return;
  }
  await supabase.auth.signOut();
  if (window.App) {
    window.App.session = null;
  }
}
