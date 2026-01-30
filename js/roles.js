// js/roles.js
// ============================================
// ROLE & PERMISSION SYSTEM
// ============================================

import { supabase } from "./supabase.js";

// In-memory cache for user role to avoid repeated queries
let roleCache = null;
let roleCacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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
 * Clear role cache (useful after auth state changes)
 */
export function clearRoleCache() {
  roleCache = null;
  roleCacheTimestamp = null;
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
 * Get user's role
 * @param {boolean} useCache - Whether to use cached data (default: true)
 * @returns {Promise<string>} Role name (guest, user, reviewer, admin)
 */
export async function getUserRole(useCache = true) {
  const profile = await getUserProfile(useCache);
  const role = profile?.role || 'guest';
  console.log('[ROLE] getUserRole returning:', role);
  return role;
}

/**
 * Get role badge information
 * @param {string} roleName - Role name
 * @returns {Object|null} Badge info with name and color
 */
export function getRoleBadge(roleName) {
  const role = ROLES[roleName];
  if (!role || !role.badge) {
    return null;
  }
  return {
    name: role.badge,
    color: role.color
  };
}

/**
 * Get current user's role and badge information
 * @param {boolean} useCache - Whether to use cached data (default: true)
 * @returns {Promise<Object>} Object with role and badge properties
 */
export async function getCurrentUserRole(useCache = true) {
  const profile = await getUserProfile(useCache);
  
  if (!profile) {
    console.log('[ROLE] getCurrentUserRole: No profile, returning guest');
    return { role: 'guest', badge: null };
  }
  
  const roleBadge = getRoleBadge(profile.role);
  const result = {
    role: profile.role,
    badge: roleBadge ? roleBadge.name : null
  };
  
  console.log('[ROLE] getCurrentUserRole returning:', result);
  return result;
}

/**
 * Check if user has a specific permission
 * @param {string} permission - Permission to check
 * @param {boolean} useCache - Whether to use cached data (default: true)
 * @returns {Promise<boolean>}
 */
export async function hasPermission(permission, useCache = true) {
  const role = await getUserRole(useCache);
  const roleConfig = ROLES[role];
  return roleConfig?.permissions.includes(permission) || false;
}

/**
 * Check if user has admin role
 * @param {boolean} useCache - Whether to use cached data (default: true)
 * @returns {Promise<boolean>}
 */
export async function isAdmin(useCache = true) {
  const role = await getUserRole(useCache);
  const result = role === 'admin';
  console.log('[ADMIN]', result, '(role:', role + ')');
  return result;
}

/**
 * Check if user has reviewer or admin role
 * @param {boolean} useCache - Whether to use cached data (default: true)
 * @returns {Promise<boolean>}
 */
export async function isReviewer(useCache = true) {
  const role = await getUserRole(useCache);
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
