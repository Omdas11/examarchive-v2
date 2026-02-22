// js/roles.js
// ============================================
// ROLE & BADGE SYSTEM
// Badges are DISPLAY ONLY — backend is authority
// ============================================

/**
 * Badge slot definitions (3 slots)
 * Slot 1: Primary role (VISITOR/USER/ADMIN/REVIEWER)
 */

/**
 * Map role to badge name (display only)
 * @param {string} role - Role name from backend
 * @returns {string} Badge display name
 */
function mapRoleToBadge(role) {
  switch (role) {
    case 'founder':
      return 'Founder';
    case 'admin':
      return 'Admin';
    case 'senior_moderator':
      return 'Senior Moderator';
    case 'moderator':
      return 'Moderator';
    case 'reviewer':
      return 'Reviewer';
    case 'contributor':
      return 'Contributor';
    case 'member':
      return 'Member';
    case 'visitor':
      return 'Visitor';
    default:
      return 'Visitor';
  }
}

/**
 * Get badge icon for a role, functional role, or badge name
 * Comprehensive mapping for all badge types (Phase 4)
 * Covers: permission roles, functional roles (academic/technical/community),
 * and achievement badges.
 * @param {string} badgeName - Badge or role name
 * @returns {string} Badge icon emoji
 */
function getBadgeIcon(badgeName) {
  const icons = {
    // Permission roles (primary_role)
    'Founder': '👑',
    'Admin': '🛡️',
    'Senior Moderator': '⚡',
    'Moderator': '🔰',
    'Reviewer': '📋',
    'Contributor': '✨',
    'Member': '👤',
    'Visitor': '👁️',
    // Functional roles — Academic
    'Subject Expert': '🧪',
    'Physics Expert': '🧪',
    'Chemistry Expert': '🧪',
    'Mathematics Expert': '🧪',
    'Paper Analyzer': '📊',
    'Syllabus Architect': '📐',
    'Question Curator': '📝',
    // Functional roles — Technical
    'UI/UX Designer': '🎨',
    'Backend Engineer': '⚙️',
    'Security Auditor': '🔒',
    'Database Architect': '🗄️',
    // Functional roles — Community
    'University Coordinator': '🎓',
    'University Lead': '🎓',
    'Campus Ambassador': '📢',
    'Community Lead': '🤝',
    'Content Curator': '📚',
    // Legacy / general
    'Top Contributor': '🏆',
    'Early Adopter': '🌟',
    'Beta Tester': '🔬',
    'Top Reviewer': '📝'
  };
  // Support partial matching (e.g., "Subject Expert (Physics)")
  for (const [key, icon] of Object.entries(icons)) {
    if (badgeName && badgeName.startsWith(key)) return icon;
  }
  return '🏷️';
}

/**
 * Get badge color for a role
 * @param {string} role - Role name
 * @returns {string} Badge color
 */
function getBadgeColor(role) {
  const colors = {
    'admin': 'var(--color-error)',
    'founder': 'var(--color-warning)',
    'senior_moderator': 'var(--color-warning)',
    'moderator': 'var(--color-info)',
    'reviewer': 'var(--color-info)',
    'contributor': 'var(--color-success)',
    'member': 'var(--color-muted)',
    'user': 'var(--color-muted)',
    'visitor': 'var(--color-muted)',
    // Cosmetic XP tier names
    'legend': 'var(--color-warning)',
    'elite': 'var(--color-error)',
    'senior': 'var(--color-warning)',
    'veteran': 'var(--color-info)',
    'explorer': 'var(--color-info)',
    // Custom/functional
    'custom': 'var(--color-muted)'
  };
  return colors[role] || 'var(--color-muted)';
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

// Expose to window for global access
window.Roles = {
  mapRoleToBadge,
  getBadgeIcon,
  getBadgeColor,
  getUserBadge
};
