// Phase 9.2.8 - Fixed timing issues with ES modules
// js/admin-auth.js
// ============================================
// ADMIN AUTHENTICATION - Backend Verification
// Phase 9.2.8: Fixed to wait for Supabase initialization
// ============================================

/**
 * Wait for Supabase client to be initialized
 * This now delegates to the global waitForSupabase from supabase-client.js
 * @param {number} timeout - Max time to wait in ms (default 10000)
 * @returns {Promise<Object|null>} Supabase client or null on timeout
 */
async function waitForSupabaseAdmin(timeout = 10000) {
  // Use the global waitForSupabase from supabase-client.js
  if (window.waitForSupabase) {
    return await window.waitForSupabase(timeout);
  }
  
  // Fallback if waitForSupabase not available
  const client = window.getSupabase ? window.getSupabase() : null;
  return client || null;
}

/**
 * Backend-verified admin check using is_admin() function
 * This is the ONLY authorized way to check admin access
 * Frontend NEVER decides admin status
 * 
 * @param {string} userId - User ID to check (optional, defaults to current user)
 * @returns {Promise<boolean>} True if user is admin
 */
async function isAdminBackend(userId = null) {
  try {
    // Wait for Supabase to be ready
    const supabase = await waitForSupabaseAdmin();
    if (!supabase) {
      console.error('[ADMIN-AUTH] Supabase not initialized');
      return false;
    }

    // Get current session if no userId provided
    if (!userId) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('[ADMIN-AUTH] No session found');
        return false;
      }
      userId = session.user.id;
    }

    console.log('[ADMIN-AUTH] Checking admin access for user:', userId);

    // Call backend is_admin() function
    const { data, error } = await supabase.rpc('is_admin', {
      user_id_param: userId
    });

    if (error) {
      console.error('[ADMIN-AUTH] Error calling is_admin():', error);
      return false;
    }

    console.log('[ADMIN-AUTH] Backend result:', data);
    return data === true;
  } catch (err) {
    console.error('[ADMIN-AUTH] Exception in isAdminBackend():', err);
    return false;
  }
}

/**
 * Check if current user is admin (convenience wrapper)
 * Uses primary_role as primary check, falls back to is_current_user_admin RPC
 * @returns {Promise<boolean>}
 */
async function isCurrentUserAdmin() {
  try {
    // Wait for Supabase to be ready
    const supabase = await waitForSupabaseAdmin();
    if (!supabase) {
      console.error('[ADMIN-AUTH] Supabase not initialized');
      return false;
    }

    // Primary check: use primary_role
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    const { data: roleData } = await supabase
      .from('roles')
      .select('primary_role')
      .eq('user_id', session.user.id)
      .single();

    if (roleData && (roleData.primary_role === 'Founder' || roleData.primary_role === 'Admin')) {
      return true;
    }

    // Fallback: legacy RPC check
    const { data, error } = await supabase.rpc('is_current_user_admin');
    
    if (error) {
      console.error('[ADMIN-AUTH] Error calling is_current_user_admin():', error);
      return false;
    }

    return data === true;
  } catch (err) {
    console.error('[ADMIN-AUTH] Exception in isCurrentUserAdmin():', err);
    return false;
  }
}

/**
 * Get user's role from backend (using user_roles table)
 * @param {string} userId - User ID (optional)
 * @returns {Promise<Object>} Role info {name, level} or null
 */
async function getUserRoleBackend(userId = null) {
  try {
    // Wait for Supabase to be ready
    const supabase = await waitForSupabaseAdmin();
    if (!supabase) {
      console.error('[ADMIN-AUTH] Supabase not initialized');
      return { name: 'visitor', level: 0 };
    }

    // Get current session if no userId provided
    if (!userId) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { name: 'visitor', level: 0 };
      }
      userId = session.user.id;
    }

    // Call backend function to get role
    const { data: roleName, error: nameError } = await supabase.rpc('get_user_role_name', {
      user_id_param: userId
    });

    if (nameError) {
      console.error('[ADMIN-AUTH] Error getting role name:', nameError);
      return null;
    }

    const { data: roleLevel, error: levelError } = await supabase.rpc('get_user_role_level', {
      user_id_param: userId
    });

    if (levelError) {
      console.error('[ADMIN-AUTH] Error getting role level:', levelError);
      return null;
    }

    return {
      name: roleName || 'visitor',
      level: roleLevel || 0
    };
  } catch (err) {
    console.error('[ADMIN-AUTH] Exception in getUserRoleBackend():', err);
    return null;
  }
}

/**
 * Assign a role to a user (admin only)
 * @param {string} targetUserId - User to assign role to
 * @param {string} roleName - Role name to assign
 * @returns {Promise<Object>} Result object {success, error?, role?, level?}
 */
async function assignRole(targetUserId, roleName) {
  try {
    // Wait for Supabase to be ready
    const supabase = await waitForSupabaseAdmin();
    if (!supabase) {
      return { success: false, error: 'Supabase not initialized' };
    }

    const { data, error } = await supabase.rpc('assign_role', {
      target_user_id: targetUserId,
      role_name_param: roleName
    });

    if (error) {
      console.error('[ADMIN-AUTH] Error assigning role:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return data;
  } catch (err) {
    console.error('[ADMIN-AUTH] Exception in assignRole():', err);
    return {
      success: false,
      error: err.message
    };
  }
}

// Expose to window for global access
window.AdminAuth = {
  isAdminBackend,
  isCurrentUserAdmin,
  getUserRoleBackend,
  assignRole
};
