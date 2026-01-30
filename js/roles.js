// js/roles.js
// ============================================
// ROLE & PERMISSION SYSTEM
// ============================================

import { supabase } from "./supabase.js";

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
 * Get user's profile with role information
 * @returns {Promise<Object|null>} Profile data or null
 */
export async function getUserProfile() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return null;
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return profile;
  } catch (err) {
    console.error('Error in getUserProfile:', err);
    return null;
  }
}

/**
 * Get user's role
 * @returns {Promise<string>} Role name (guest, user, reviewer, admin)
 */
export async function getUserRole() {
  const profile = await getUserProfile();
  return profile?.role || 'guest';
}

/**
 * Check if user has a specific permission
 * @param {string} permission - Permission to check
 * @returns {Promise<boolean>}
 */
export async function hasPermission(permission) {
  const role = await getUserRole();
  const roleConfig = ROLES[role];
  return roleConfig?.permissions.includes(permission) || false;
}

/**
 * Check if user has admin role
 * @returns {Promise<boolean>}
 */
export async function isAdmin() {
  const role = await getUserRole();
  return role === 'admin';
}

/**
 * Check if user has reviewer or admin role
 * @returns {Promise<boolean>}
 */
export async function isReviewer() {
  const role = await getUserRole();
  return role === 'reviewer' || role === 'admin';
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
