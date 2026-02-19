// Phase 9.2.8 - Fixed timing issues with ES modules
// js/roles.js
// ============================================
// ROLE & BADGE SYSTEM - Phase 9.2.8
// Badges are DISPLAY ONLY
// Backend is the ONLY authority
// ============================================

/**
 * Badge slot definitions (3 slots)
 * Slot 1: Primary role (VISITOR/USER/ADMIN/REVIEWER)
 * Slot 2: Empty (future use)
 * Slot 3: Empty (future use)
 */

/**
 * Map role to badge name (display only)
 * @param {string} role - Role name from backend
 * @returns {string} Badge display name
 */
function mapRoleToBadge(role) {
  switch (role) {
    case 'admin':
      return 'Admin';
    case 'reviewer':
      return 'Reviewer';
    case 'contributor':
      return 'Contributor';
    case 'visitor':
      return 'Visitor';
    default:
      return 'Visitor';
  }
}

/**
 * Get badge icon for a role
 * @param {string} badgeName - Badge name
 * @returns {string} Badge icon emoji
 */
function getBadgeIcon(badgeName) {
  const icons = {
    'Admin': '👑',
    'Reviewer': '🛡️',
    'Contributor': '✍️',
    'Visitor': '👤'
  };
  return icons[badgeName] || '✓';
}

/**
 * Get badge color for a role
 * @param {string} role - Role name
 * @returns {string} Badge color
 */
function getBadgeColor(role) {
  const colors = {
    'admin': '#f44336',
    'reviewer': '#2196F3',
    'contributor': '#4CAF50',
    'visitor': '#9E9E9E'
  };
  return colors[role] || '#9E9E9E';
}

/**
 * Get user's badge information from backend
 * This is the ONLY way to get badge info - no frontend inference
 * Fetches role LEVEL and uses centralized mapRole() function
 * @returns {Promise<Object>} Badge info {role, badge, icon, color, level}
 */
async function getUserBadge() {
  try {
    // Wait for Supabase to be ready
    const supabase = await window.waitForSupabase();
    if (!supabase) {
      console.warn('[BADGE] Supabase not ready, returning visitor badge');
      return {
        role: 'visitor',
        badge: 'Visitor',
        icon: getBadgeIcon('Visitor'),
        color: getBadgeColor('visitor'),
        level: 0
      };
    }
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      // Guest/Visitor
      return {
        role: 'visitor',
        badge: 'Visitor',
        icon: getBadgeIcon('Visitor'),
        color: getBadgeColor('visitor'),
        level: 0
      };
    }

    // Get role LEVEL from backend (not name)
    const { data: roleLevel, error } = await supabase.rpc('get_user_role_level', {
      user_id_param: session.user.id
    });

    if (error) {
      console.error('[BADGE] Error getting role level:', error);
      // Default to contributor if backend fails
      const level = 10;
      const roleInfo = window.RoleUtils?.mapRole ? window.RoleUtils.mapRole(level) : { name: 'contributor', displayName: '✍️ Contributor', icon: '✍️' };
      return {
        role: roleInfo.name,
        badge: roleInfo.displayName.replace(/^[^\s]+ /, ''), // Remove icon from display name
        icon: roleInfo.icon,
        color: getBadgeColor(roleInfo.name),
        level: level
      };
    }

    // Default to level 10 if no role row exists
    const level = roleLevel !== null && roleLevel !== undefined ? roleLevel : 10;
    
    // Use centralized mapRole function
    const roleInfo = window.RoleUtils?.mapRole ? window.RoleUtils.mapRole(level) : { name: 'contributor', displayName: '✍️ Contributor', icon: '✍️' };
    
    return {
      role: roleInfo.name,
      badge: roleInfo.displayName.replace(/^[^\s]+ /, ''), // Remove icon from display name
      icon: roleInfo.icon,
      color: getBadgeColor(roleInfo.name),
      level: level
    };
  } catch (err) {
    console.error('[BADGE] Error getting user badge:', err);
    const level = 10;
    const roleInfo = window.RoleUtils?.mapRole ? window.RoleUtils.mapRole(level) : { name: 'contributor', displayName: '✍️ Contributor', icon: '✍️' };
    return {
      role: roleInfo.name,
      badge: roleInfo.displayName.replace(/^[^\s]+ /, ''),
      icon: roleInfo.icon,
      color: getBadgeColor(roleInfo.name),
      level: level
    };
  }
}

// ============================================
// LEGACY COMPATIBILITY (Deprecated)
// These functions are kept for backward compatibility
// but should not be used in new code
// ============================================

/**
 * @deprecated Use getUserBadge() instead
 */
function normalizeRole(role) {
  console.warn('[ROLE] normalizeRole() is deprecated, use getUserBadge() instead');
  if (!role || typeof role !== 'string') {
    return 'visitor';
  }
  const normalized = role.toLowerCase().trim();
  const VALID_ROLES = new Set(['admin', 'reviewer', 'contributor', 'visitor']);
  return VALID_ROLES.has(normalized) ? normalized : 'visitor';
}

/**
 * @deprecated Backend is now the source of truth
 */
function clearRoleCache() {
  console.warn('[ROLE] clearRoleCache() is deprecated in Phase 8.3');
}

/**
 * @deprecated Use getUserRoleBackend() from admin-auth.js instead
 */
async function getUserProfile(useCache = true) {
  console.warn('[ROLE] getUserProfile() is deprecated, use getUserRoleBackend() instead');
  try {
    const supabase = await window.waitForSupabase();
    if (!supabase) return null;
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    return profile;
  } catch (err) {
    console.error('[ROLE] Error in getUserProfile:', err);
    return null;
  }
}

/**
 * @deprecated Global role state removed in Phase 8.3
 */
function initializeGlobalRoleState() {
  console.warn('[ROLE] initializeGlobalRoleState() is deprecated in Phase 8.3');
  // No-op for backward compatibility
}

/**
 * @deprecated No longer needed - backend verification only
 */
function waitForRole() {
  console.warn('[ROLE] waitForRole() is deprecated in Phase 8.3');
  return Promise.resolve({
    status: 'unknown',
    badge: null,
    ready: true
  });
}

// Expose to window for global access
window.Roles = {
  mapRoleToBadge,
  getBadgeIcon,
  getBadgeColor,
  getUserBadge,
  normalizeRole,
  clearRoleCache,
  getUserProfile,
  initializeGlobalRoleState,
  waitForRole
};
