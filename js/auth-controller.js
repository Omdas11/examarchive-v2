// js/auth-controller.js
// ============================================
// CENTRAL AUTH CONTROLLER - Phase 9.2
// SINGLE SOURCE OF TRUTH for all authentication
// This is the ONLY file that should manage auth state
// ============================================

/**
 * Central Authentication Controller
 * Responsibilities:
 * - Restore session once on app load
 * - Handle OAuth callback on any page
 * - Clean URL params after callback
 * - Emit global auth:ready event
 * - Provide session access API
 */
(function () {
  'use strict';

  // Prevent duplicate initialization
  if (window.__AUTH_CONTROLLER_INIT__) {
    console.warn('[AUTH-CONTROLLER] Already initialized');
    return;
  }
  window.__AUTH_CONTROLLER_INIT__ = true;

  // Auth state
  let authReady = false;
  let currentSession = null;
  let supabaseClient = null;

  /**
   * Initialize auth controller
   * This runs once when the script loads
   */
  async function init() {
    // Get Supabase client using singleton
    supabaseClient = window.getSupabase ? window.getSupabase() : null;
    
    if (!supabaseClient) {
      console.error('[AUTH-CONTROLLER] Supabase client not available');
      authReady = true;
      emitAuthReady(null);
      return;
    }

    // Handle OAuth callback if present in URL
    await handleOAuthCallback();

    // Get current session
    try {
      const { data, error } = await supabaseClient.auth.getSession();
      
      if (error) {
        console.error('[AUTH-CONTROLLER] Error getting session:', error);
        currentSession = null;
      } else if (data?.session) {
        currentSession = data.session;
      } else {
        currentSession = null;
      }
    } catch (err) {
      console.error('[AUTH-CONTROLLER] Exception getting session:', err);
      currentSession = null;
    }

    // Set up auth state change listener (SINGLE LISTENER)
    supabaseClient.auth.onAuthStateChange((event, session) => {
      currentSession = session;
      
      // Update window.App session for backward compatibility
      if (window.App) {
        window.App.session = session;
      }
      
      // Track last login in user_profiles on sign-in or session restore
      if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')) {
        supabaseClient.rpc('update_last_login').catch(() => {});
      }

      // Emit custom event for UI components
      window.dispatchEvent(new CustomEvent('auth-state-changed', {
        detail: { event, session }
      }));
    });

    // Mark auth as ready and emit event
    authReady = true;
    emitAuthReady(currentSession);
  }

  /**
   * Handle OAuth callback
   * Detects and processes OAuth redirect
   * Cleans up URL parameters after successful callback
   */
  async function handleOAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const hasOAuthParams = urlParams.has('code') || urlParams.has('error');

    if (!hasOAuthParams) {
      return; // No OAuth callback to handle
    }

    // Check for errors
    const error = urlParams.get('error');
    const errorCode = urlParams.get('error_code');
    const errorDescription = urlParams.get('error_description');

    if (error) {
      console.error('[AUTH-CONTROLLER] OAuth error:', {
        error,
        errorCode,
        errorDescription
      });

      // Show user-friendly error message
      showOAuthError(error, errorCode, errorDescription);

      // Clean URL immediately
      cleanURL();
      return;
    }

    // OAuth success - Supabase will automatically handle the code exchange
    // due to detectSessionInUrl: true in supabase.js
    // Wait a bit for Supabase to process the callback
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Clean URL to remove OAuth parameters
    cleanURL();
  }

  /**
   * Clean OAuth parameters from URL
   * Preserves other query parameters and hash
   */
  function cleanURL() {
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);

    // Remove OAuth-related parameters
    params.delete('code');
    params.delete('error');
    params.delete('error_code');
    params.delete('error_description');
    params.delete('state');

    // Reconstruct URL
    const newSearch = params.toString();
    const newURL = url.pathname + (newSearch ? '?' + newSearch : '') + url.hash;

    // Replace history state to clean URL
    if (newURL !== window.location.pathname + window.location.search + window.location.hash) {
      window.history.replaceState({}, '', newURL);
    }
  }

  /**
   * Show OAuth error to user
   */
  function showOAuthError(error, errorCode, errorDescription) {
    let message = 'Sign in failed. Please try again.';

    if (errorCode === 'flow_state_not_found') {
      message = 'Sign in session expired. Please try again.';
    } else if (errorDescription) {
      message = errorDescription;
    }

    // Create error notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem 1.5rem;
      background: var(--surface, #fff);
      border: 1px solid var(--border, #e0e0e0);
      border-left: 4px solid var(--color-error, #f44336);
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      max-width: 400px;
      animation: slideIn 0.3s ease;
    `;
    notification.innerHTML = `
      <div style="display: flex; align-items: start; gap: 0.75rem;">
        <span style="font-size: 1.5rem;">${window.SvgIcons ? window.SvgIcons.get('warning', {size: 24}) : ''}</span>
        <div>
          <strong style="display: block; margin-bottom: 0.25rem; color: var(--text, #000);">
            Sign In Error
          </strong>
          <p style="margin: 0; font-size: 0.9rem; color: var(--text-muted, #666);">
            ${message}
          </p>
        </div>
      </div>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 8 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 8000);

    // Add animation styles if not already present
    if (!document.getElementById('auth-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'auth-notification-styles';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Emit auth:ready event
   * Other parts of the app should wait for this event before checking auth
   */
  function emitAuthReady(session) {
    window.dispatchEvent(new CustomEvent('auth:ready', {
      detail: { session }
    }));
  }

  /**
   * Public API - Get current session
   * This is the ONLY way to get the current session
   */
  function getSession() {
    if (!authReady) {
      console.warn('[AUTH-CONTROLLER] Auth not ready yet, returning null');
      return null;
    }
    return currentSession;
  }

  /**
   * Public API - Check if authenticated
   */
  function isAuthenticated() {
    return authReady && currentSession !== null;
  }

  /**
   * Public API - Wait for auth to be ready
   * Returns a promise that resolves when auth is initialized
   */
  function waitForAuthReady() {
    if (authReady) {
      return Promise.resolve(currentSession);
    }

    return new Promise((resolve) => {
      window.addEventListener('auth:ready', (e) => {
        resolve(e.detail.session);
      }, { once: true });
    });
  }

  /**
   * Public API - Require active session
   * Waits for auth to be ready, then returns session or null
   */
  async function requireSession() {
    await waitForAuthReady();
    return currentSession;
  }

  /**
   * Public API - Require role-based access
   * Checks if user has one of the allowed roles
   */
  async function requireRole(allowedRoles = []) {
    const session = await requireSession();
    
    if (!session) {
      return null;
    }

    if (!supabaseClient) {
      console.error('[AUTH-CONTROLLER] Supabase not available for role check');
      return null;
    }

    try {
      // Get user role from backend
      const { data, error } = await supabaseClient.rpc('get_user_role_name', { 
        user_id_param: session.user.id 
      });

      if (error) {
        console.error('[AUTH-CONTROLLER] Error getting user role:', error);
        return null;
      }

      const userRole = data;

      // Check if user has required role
      if (!allowedRoles.includes(userRole)) {
        return null;
      }

      return session;
    } catch (err) {
      console.error('[AUTH-CONTROLLER] Exception in requireRole:', err);
      return null;
    }
  }

  /**
   * Public API - Sign in with email and password
   */
  async function signInWithPassword(email, password) {
    if (!supabaseClient) {
      return { error: { message: 'Supabase not initialized' } };
    }
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) return { error };
      return { data };
    } catch (err) {
      return { error: err };
    }
  }

  /**
   * Public API - Sign up with email and password
   */
  async function signUp(email, password) {
    if (!supabaseClient) {
      return { error: { message: 'Supabase not initialized' } };
    }
    try {
      const { data, error } = await supabaseClient.auth.signUp({ email, password });
      if (error) return { error };
      return { data };
    } catch (err) {
      return { error: err };
    }
  }

  /**
   * Public API - Send password reset email
   */
  async function resetPassword(email) {
    if (!supabaseClient) {
      return { error: { message: 'Supabase not initialized' } };
    }
    try {
      const { data, error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin
      });
      if (error) return { error };
      return { data };
    } catch (err) {
      return { error: err };
    }
  }

  /**
   * Public API - Sign in with OAuth
   */
  async function signInWithGoogle() {
    if (!supabaseClient) {
      console.error('[AUTH-CONTROLLER] Supabase not available for sign in');
      return { error: 'Supabase not initialized' };
    }

    try {
      const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });

      if (error) {
        console.error('[AUTH-CONTROLLER] Sign in error:', error);
        return { error };
      }

      return { data };
    } catch (err) {
      console.error('[AUTH-CONTROLLER] Exception in signInWithGoogle:', err);
      return { error: err };
    }
  }

  /**
   * Public API - Sign out
   */
  async function signOut() {
    if (!supabaseClient) {
      console.error('[AUTH-CONTROLLER] Supabase not available for sign out');
      return;
    }

    try {
      await supabaseClient.auth.signOut();
      currentSession = null;
      
      // Update window.App session
      if (window.App) {
        window.App.session = null;
      }
    } catch (err) {
      console.error('[AUTH-CONTROLLER] Error signing out:', err);
    }
  }

  // Expose public API
  window.AuthController = {
    getSession,
    isAuthenticated,
    waitForAuthReady,
    requireSession,
    requireRole,
    signInWithGoogle,
    signInWithPassword,
    signUp,
    resetPassword,
    signOut
  };

  // Also expose as AuthContract for backward compatibility
  window.AuthContract = {
    requireSession,
    requireRole
  };

  // Initialize when script loads
  // Wait for getSupabase to be available (should be loaded before this script)
  if (window.getSupabase) {
    init();
  } else {
    // Wait for DOMContentLoaded to ensure all scripts are loaded
    document.addEventListener('DOMContentLoaded', () => {
      if (window.getSupabase) {
        init();
      } else {
        console.error('[AUTH-CONTROLLER] getSupabase not available');
      }
    });
  }
})();
