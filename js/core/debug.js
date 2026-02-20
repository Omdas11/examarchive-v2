// js/core/debug.js
// ============================================
// STRUCTURED DEBUG LOGGING + HEALTH CHECK
// Phase 1 — Global debug helpers for classic scripts
// ============================================

/**
 * Structured debug log function
 * Types: AUTH, STORAGE, SUBMISSION, RLS, DASHBOARD, ERROR, SYSTEM
 */
window.debugLog = function(type, message, meta) {
  if (!window.DEBUG_ENABLED) return;

  var entry = {
    type: type,
    message: message,
    meta: meta || null,
    time: new Date().toLocaleTimeString()
  };

  window.DEBUG_STORE = window.DEBUG_STORE || [];
  window.DEBUG_STORE.push(entry);

  // Forward to Debug module if available
  if (window.Debug) {
    var moduleMap = {
      'AUTH': 'auth',
      'STORAGE': 'storage',
      'SUBMISSION': 'upload',
      'RLS': 'rls',
      'DASHBOARD': 'admin',
      'SYSTEM': 'system',
      'ERROR': 'system'
    };
    var mod = moduleMap[type] || 'system';
    if (type === 'ERROR') {
      window.Debug.logError(mod, message, meta);
    } else {
      window.Debug.logInfo(mod, message, meta);
    }
  }
};

/**
 * Structured debug error log
 * Extracts code, details, and hint from Supabase errors
 */
window.debugError = function(label, error) {
  if (!window.DEBUG_ENABLED) return;

  var errorInfo = {
    code: error && error.code,
    details: error && error.details,
    hint: error && error.hint,
    message: error && error.message
  };

  window.debugLog('ERROR', label + ': ' + (error && error.message || 'Unknown error'), errorInfo);
};

/**
 * System health check — call after login to verify connectivity
 */
window.systemHealthCheck = async function() {
  try {
    var supabase = window.getSupabase ? window.getSupabase() : null;
    if (!supabase) {
      window.debugLog('SYSTEM', 'Health check: Supabase client not available');
      return;
    }

    var sessionResult = await supabase.auth.getSession();
    var session = sessionResult.data;
    window.debugLog('SYSTEM', 'Session check', session);

    var countResult = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true });

    window.debugLog('SYSTEM', 'Submissions table reachable', { count: countResult.count });
  } catch (err) {
    window.debugLog('ERROR', 'Health check failed: ' + (err.message || 'Unknown error'), err);
  }
};

// Auto-run health check once after login
window.addEventListener('auth:ready', function(e) {
  if (e.detail && e.detail.session && window.DEBUG_ENABLED) {
    window.systemHealthCheck();
  }
});
