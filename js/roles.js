// js/roles.js
// ============================================
// ROLE & PERMISSION SYSTEM
// ============================================

import { supabase } from "./supabase.js";

// In-memory cache for user role to avoid repeated queries
let roleCache = null;
let roleCacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Global role state for UI synchronization
if (!window.__APP_ROLE__) {
  window.__APP_ROLE__ = {
    status: 'unknown',
    badge: null,
    ready: false
  };
}

/**
 * Role definitions with badges and permissions
 */
export const ROLES = {
  guest: {
    name: 'guest',
    badge: null,
    permissions: ['view_public']
  },
  user: {
    name: 'user',
    badge: 'Contributor',
    color: '#4CAF50',
    permissions: ['view_public', 'upload_pending']
  },
  reviewer: {
    name: 'reviewer',
    badge: 'Moderator',
    color: '#2196F3',
    permissions: ['view_public', 'upload_pending', 'review_submissions', 'comment']
  },
  admin: {
    name: 'admin',
    badge: 'Admin',
    color: '#f44336',
    permissions: ['view_public', 'upload_pending', 'review_submissions', 'comment', 'approve_reject', 'publish', 'delete', 'manage_users']
  }
};

/**
 * Normalize role name to lowercase canonical form
 * Ensures case-insensitive role handling (admin, Admin, ADMIN → admin)
 * @param {string|null|undefined} role - Role string to normalize
 * @returns {string} Normalized role ('admin' | 'reviewer' | 'user' | 'guest')
 */
export function normalizeRole(role) {
  if (!role || typeof role !== 'string') {
    return 'guest';
  }
  
  const normalized = role.toLowerCase().trim();
  
  // Validate against known roles using Set for O(1) lookup
  const VALID_ROLES = new Set(['admin', 'reviewer', 'user', 'guest']);
  if (VALID_ROLES.has(normalized)) {
    return normalized;
  }
  
  // Default to guest for unknown roles
  console.warn('[ROLE] Unknown role:', role, '- defaulting to guest');
  return 'guest';
}

/**
 * Clear role cache (useful after auth state changes)
 */
export function clearRoleCache() {
  roleCache = null;
  roleCacheTimestamp = null;
  // Reset global role state
  window.__APP_ROLE__ = {
    status: 'unknown',
    badge: null,
    ready: false
  };
  console.log('[ROLE] Cache cleared');
}

/**
 * Get user's profile with role information
 * @param {boolean} useCache - Whether to use cached data (default: true)
 * @returns {Promise<Object|null>} Profile data or null
 */
export async function getUserProfile(useCache = true) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log('[ROLE] No session found');
      clearRoleCache();
      return null;
    }

    // Check cache first
    const now = Date.now();
    if (useCache && roleCache && roleCacheTimestamp && (now - roleCacheTimestamp) < CACHE_DURATION) {
      console.log('[ROLE] Using cached profile data');
      return roleCache;
    }

    console.log('[ROLE] Fetching profile from database for user:', session.user.id);

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('[ROLE] Error fetching profile:', error);
      // User has auth but no profile - treat as guest/user
      console.log('[ROLE] No profile found - treating as guest');
      clearRoleCache(); // Clear cache on error
      return null;
    }

    // Normalize role before caching (case-insensitive handling)
    if (profile && profile.role) {
      profile.role = normalizeRole(profile.role);
    }
    
    // Cache the result
    roleCache = profile;
    roleCacheTimestamp = now;
    console.log('[ROLE] Profile fetched and cached:', profile.role);

    return profile;
  } catch (err) {
    console.error('[ROLE] Error in getUserProfile:', err);
    clearRoleCache(); // Clear cache on exception
    return null;
  }
}

/**
 * Map role to badge name (single source of truth for UI)
 * This is the ONLY function that should be used for role->badge conversion
 * @param {string} role - Role name (admin, reviewer, user, guest)
 * @returns {string} Badge display name
 */
export function mapRoleToBadge(role) {
  switch (role) {
    case 'admin':
      return 'Admin';
    case 'reviewer':
      return 'Moderator';
    case 'user':
      return 'Contributor';
    case 'guest':
      return 'Guest';
    default:
      return 'Guest';
  }
}

/**
 * Get badge icon for a role badge name
 * @param {string} badgeName - Badge name (Admin, Moderator, Contributor, Guest)
 * @returns {string} Badge icon emoji
 */
export function getBadgeIcon(badgeName) {
  const icons = {
    'Admin': '👑',
    'Moderator': '🛡️',
    'Contributor': '📝',
    'Guest': '👤'
  };
  return icons[badgeName] || '✓';
}

/**
 * Get badge color for a role
 * @param {string} role - Role name
 * @returns {string} Badge color
 */
export function getBadgeColor(role) {
  const colors = {
    'admin': '#f44336',
    'reviewer': '#2196F3',
    'user': '#4CAF50',
    'guest': '#9E9E9E'
  };
  return colors[role] || '#9E9E9E';
}

/**
 * Check if user has a specific permission
 * Uses window.__APP_ROLE__ as single source of truth
 * @param {string} permission - Permission to check
 * @returns {boolean}
 */
export function hasPermission(permission) {
  // Use global role state - single source of truth
  const role = window.__APP_ROLE__?.status || 'guest';
  const roleConfig = ROLES[role];
  return roleConfig?.permissions.includes(permission) || false;
}

/**
 * Check if user has reviewer or admin role
 * Uses window.__APP_ROLE__ as single source of truth
 * @returns {boolean}
 */
export function isReviewer() {
  const role = window.__APP_ROLE__?.status || 'guest';
  return role === 'reviewer' || role === 'admin';
}

/**
 * Create profile for user if it doesn't exist
 * This is a fallback in case the trigger doesn't fire
 * @param {string} userId - User ID
 * @param {string} email - User email
 * @returns {Promise<boolean>}
 */
export async function ensureProfile(userId, email) {
  try {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (existing) {
      return true;
    }

    const { error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: email,
        role: 'user',
        badge: 'Contributor'
      });

    if (error) {
      console.error('Error creating profile:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error in ensureProfile:', err);
    return false;
  }
}

/**
 * Initialize global role state based on current session
 * This should be called during app initialization
 * @returns {Promise<void>}
 */
export async function initializeGlobalRoleState() {
  try {
    console.log('[ROLE] Initializing global role state...');
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      // User is not logged in - set guest state
      window.__APP_ROLE__ = {
        status: 'guest',
        badge: 'Guest',
        ready: true
      };
      console.log('[ROLE] Global state initialized: guest');
      console.log('[ROLE] resolved: guest');
    } else {
      // User is logged in - fetch profile
      console.log('[ROLE] Session found, fetching profile for user:', session.user.id);
      const profile = await getUserProfile(false); // Force fresh fetch
      
      if (profile && profile.role) {
        // Normalize role to ensure case-insensitive handling
        const normalizedRole = normalizeRole(profile.role);
        const badgeName = mapRoleToBadge(normalizedRole);
        window.__APP_ROLE__ = {
          status: normalizedRole,
          badge: badgeName,
          ready: true
        };
        console.log('[ROLE] Global state initialized:', normalizedRole);
        console.log('[ROLE] resolved:', normalizedRole);
        console.log('[BADGE] resolved:', badgeName);
      } else {
        // Logged in but no profile - treat as user
        window.__APP_ROLE__ = {
          status: 'user',
          badge: 'Contributor',
          ready: true
        };
        console.log('[ROLE] Global state initialized: user (no profile found)');
        console.log('[ROLE] resolved: user');
      }
    }
    
    // Dispatch event to notify UI components
    console.log('[ROLE] Dispatching role:ready event');
    window.dispatchEvent(new Event('role:ready'));
    console.log('[ROLE] role:ready event dispatched');
  } catch (err) {
    console.error('[ROLE] Error initializing global role state:', err);
    // Default to guest on error
    window.__APP_ROLE__ = {
      status: 'guest',
      badge: 'Guest',
      ready: true
    };
    console.log('[ROLE] Defaulted to guest due to error');
    window.dispatchEvent(new Event('role:ready'));
  }
}

/**
 * Wait for role to be ready
 * @returns {Promise<Object>} Resolves with the role state when ready
 */
export function waitForRole() {
  return new Promise((resolve) => {
    // Safety check: ensure window.__APP_ROLE__ exists
    if (!window.__APP_ROLE__) {
      console.warn('[ROLE] window.__APP_ROLE__ not initialized, waiting for role:ready event');
      window.addEventListener('role:ready', () => {
        resolve(window.__APP_ROLE__);
      }, { once: true });
      return;
    }
    
    if (window.__APP_ROLE__.ready) {
      resolve(window.__APP_ROLE__);
    } else {
      window.addEventListener('role:ready', () => {
        resolve(window.__APP_ROLE__);
      }, { once: true });
    }
  });
}
