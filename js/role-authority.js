// js/role-authority.js
// ============================================
// AUTHORITATIVE ROLE LOADER
// Single source of truth for user roles
// NO CACHE - Always fetches fresh from database
// ============================================

import { supabase } from "./supabase.js";

/**
 * Load authoritative role directly from profiles table
 * This is the ONLY function that should be used to determine user role
 * @returns {Promise<Object>} Object with role and badge properties
 */
export async function loadAuthoritativeRole() {
  console.log('[ROLE-AUTHORITY] Loading authoritative role...');
  
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('[ROLE-AUTHORITY] Error getting user:', userError);
      return { role: 'guest', badge: 'Guest' };
    }
    
    if (!user) {
      console.log('[ROLE-AUTHORITY] No user found - returning guest');
      return { role: 'guest', badge: 'Guest' };
    }

    console.log('[ROLE-AUTHORITY] User found, fetching profile for:', user.id);

    // Fetch profile directly from database - NO CACHE
    const { data, error } = await supabase
      .from('profiles')
      .select('role, badge')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('[ROLE-AUTHORITY] Error fetching profile:', error);
      // User has auth but no profile - treat as user (new accounts)
      console.log('[ROLE-AUTHORITY] No profile found - returning user/Contributor');
      return { role: 'user', badge: 'Contributor' };
    }
    
    if (!data) {
      console.log('[ROLE-AUTHORITY] Profile data is null - returning user/Contributor');
      return { role: 'user', badge: 'Contributor' };
    }

    console.log('[ROLE-AUTHORITY] Profile loaded:', data);
    console.log('[ROLE] resolved:', data.role);
    console.log('[BADGE] resolved:', data.badge);

    return {
      role: data.role,
      badge: data.badge
    };
  } catch (err) {
    console.error('[ROLE-AUTHORITY] Unexpected error:', err);
    return { role: 'guest', badge: 'Guest' };
  }
}

/**
 * Wait for role to be ready
 * @returns {Promise<Object>} Resolves with the global role state when ready
 */
export function waitForRoleReady() {
  return new Promise((resolve) => {
    // Safety check: ensure window.__APP_ROLE__ exists
    if (!window.__APP_ROLE__) {
      console.warn('[ROLE-AUTHORITY] window.__APP_ROLE__ not initialized, waiting for role:ready event');
      window.addEventListener('role:ready', () => {
        resolve(window.__APP_ROLE__);
      }, { once: true });
      return;
    }
    
    if (window.__APP_ROLE__.ready) {
      console.log('[ROLE-AUTHORITY] Role already ready:', window.__APP_ROLE__);
      resolve(window.__APP_ROLE__);
    } else {
      console.log('[ROLE-AUTHORITY] Waiting for role:ready event...');
      window.addEventListener('role:ready', () => {
        console.log('[ROLE-AUTHORITY] role:ready event received');
        resolve(window.__APP_ROLE__);
      }, { once: true });
    }
  });
}
