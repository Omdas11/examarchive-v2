// js/core/debug.js
// ============================================
// STRUCTURED DEBUG LOGGING + HEALTH CHECK
// Phase 5 — Enhanced debug with error capture
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
      console.warn('[HEALTH-CHECK] Supabase client not available');
      window.debugLog('SYSTEM', 'Health check: Supabase client not available');
      return;
    }

    var sessionResult = await supabase.auth.getSession();
    var session = sessionResult.data;
    window.debugLog('SYSTEM', 'Session check', { 
      hasSession: !!(session && session.session),
      userId: session && session.session && session.session.user ? session.session.user.id : null
    });

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

// ============================================
// PHASE 5: Enhanced Error Capture System
// ============================================

(function() {
  'use strict';

  // Error store for mobile debug panel
  var MAX_ERROR_HISTORY = 100;
  window.DEBUG_ERRORS = window.DEBUG_ERRORS || [];

  function addError(entry) {
    window.DEBUG_ERRORS.push(entry);
    if (window.DEBUG_ERRORS.length > MAX_ERROR_HISTORY) {
      window.DEBUG_ERRORS.shift();
    }
    updateErrorBadge();
    window.debugLog('ERROR', entry.source + ': ' + entry.message, entry);
  }

  function updateErrorBadge() {
    var badge = document.getElementById('debug-error-badge');
    if (badge) {
      var count = window.DEBUG_ERRORS.length;
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline-block' : 'none';
    }
  }

  // Capture console.error
  var origConsoleError = console.error;
  console.error = function() {
    origConsoleError.apply(console, arguments);
    var args = Array.prototype.slice.call(arguments);
    var msg = args.map(function(a) {
      return typeof a === 'object' ? JSON.stringify(a) : String(a);
    }).join(' ');
    addError({ source: 'console.error', message: msg, time: new Date().toISOString() });
  };

  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', function(event) {
    var reason = event.reason;
    var msg = reason ? (reason.message || String(reason)) : 'Unknown rejection';
    addError({ source: 'unhandledrejection', message: msg, stack: reason && reason.stack, time: new Date().toISOString() });
  });

  // Capture global errors
  window.addEventListener('error', function(event) {
    addError({
      source: 'window.error',
      message: event.message || 'Unknown error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      time: new Date().toISOString()
    });
  });

  // Capture failed fetch calls
  var origFetch = window.fetch;
  window.fetch = function() {
    return origFetch.apply(this, arguments).then(function(response) {
      if (!response.ok) {
        addError({
          source: 'fetch',
          message: 'HTTP ' + response.status + ' ' + response.statusText,
          url: response.url,
          time: new Date().toISOString()
        });
      }
      return response;
    }).catch(function(err) {
      addError({
        source: 'fetch',
        message: err.message || 'Network error',
        time: new Date().toISOString()
      });
      throw err;
    });
  };

  // Debug panel helper functions
  window.debugGetErrors = function() { return window.DEBUG_ERRORS; };
  window.debugClearErrors = function() {
    window.DEBUG_ERRORS = [];
    updateErrorBadge();
  };
  window.debugCopyErrors = function() {
    var text = JSON.stringify(window.DEBUG_ERRORS, null, 2);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    return text;
  };

  // Auto-enable debug on localhost or for Founder role
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.DEBUG_ENABLED = true;
  }

  window.addEventListener('auth:ready', function(e) {
    if (!e.detail || !e.detail.session) return;
    var supabase = window.getSupabase ? window.getSupabase() : null;
    if (!supabase) return;
    supabase.from('roles').select('primary_role').eq('user_id', e.detail.session.user.id).single().then(function(res) {
      if (res.data && res.data.primary_role === 'Founder') {
        window.DEBUG_ENABLED = true;
      }
    });
  });
})();
