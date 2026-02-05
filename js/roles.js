// Phase 9.2.8 - Fixed timing issues with ES modules
// js/roles.js
// ============================================
// ROLE & BADGE SYSTEM - Phase 9.2.8
// Badges are DISPLAY ONLY
// Backend is the ONLY authority
// ============================================

/**
 * Wait for Supabase client to be initialized
 * @param {number} timeout - Max time to wait in ms (default 10000)
 * @returns {Promise<Object|null>} Supabase client or null on timeout
 */
async function waitForSupabaseRoles(timeout = 10000) {
  if (window.__supabase__) {
    return window.__supabase__;
  }

  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const readyHandler = () => {
      if (window.__supabase__) {
        resolve(window.__supabase__);
      }
    };
    document.addEventListener('app:ready', readyHandler, { once: true });
    
    const interval = setInterval(() => {
      if (window.__supabase__) {
        clearInterval(interval);
        document.removeEventListener('app:ready', readyHandler);
        resolve(window.__supabase__);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(interval);
        document.removeEventListener('app:ready', readyHandler);
        console.warn('[ROLES] Timeout waiting for Supabase client');
        resolve(null);
      }
    }, 50);
  });
}

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
      return 'Moderator';
    case 'user':
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
    'Moderator': '🛡️',
    'Contributor': '📝',
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
    'user': '#4CAF50',
    'visitor': '#9E9E9E'
  };
  return colors[role] || '#9E9E9E';
}

/**
 * Get user's badge information from backend
 * This is the ONLY way to get badge info - no frontend inference
 * @returns {Promise<Object>} Badge info {role, badge, icon, color}
 */
async function getUserBadge() {
  try {
    // Wait for Supabase to be ready
    const supabase = await waitForSupabaseRoles();
    if (!supabase) {
      console.warn('[BADGE] Supabase not ready, returning visitor badge');
      return {
        role: 'visitor',
        badge: 'Visitor',
        icon: getBadgeIcon('Visitor'),
        color: getBadgeColor('visitor')
      };
    }
    
    // Wait for AdminAuth to be available
    if (!window.AdminAuth?.getUserRoleBackend) {
      console.warn('[BADGE] AdminAuth not available, returning visitor badge');
      return {
        role: 'visitor',
        badge: 'Visitor',
        icon: getBadgeIcon('Visitor'),
        color: getBadgeColor('visitor')
      };
    }
    
    const getUserRoleBackend = window.AdminAuth.getUserRoleBackend;
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      // Guest/Visitor
      return {
        role: 'visitor',
        badge: 'Visitor',
        icon: getBadgeIcon('Visitor'),
        color: getBadgeColor('visitor')
      };
    }

    // Get role from backend
    const roleInfo = await getUserRoleBackend(session.user.id);
    
    if (!roleInfo) {
      // Default to user if backend fails
      return {
        role: 'user',
        badge: 'Contributor',
        icon: getBadgeIcon('Contributor'),
        color: getBadgeColor('user')
      };
    }

    const badgeName = mapRoleToBadge(roleInfo.name);
    
    return {
      role: roleInfo.name,
      badge: badgeName,
      icon: getBadgeIcon(badgeName),
      color: getBadgeColor(roleInfo.name),
      level: roleInfo.level
    };
  } catch (err) {
    console.error('[BADGE] Error getting user badge:', err);
    return {
      role: 'visitor',
      badge: 'Visitor',
      icon: getBadgeIcon('Visitor'),
      color: getBadgeColor('visitor')
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
  const VALID_ROLES = new Set(['admin', 'reviewer', 'user', 'visitor']);
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
    const supabase = await waitForSupabaseRoles();
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
