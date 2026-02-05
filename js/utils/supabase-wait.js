// js/utils/supabase-wait.js
// ============================================
// SHARED SUPABASE WAIT UTILITY - Phase 9.2
// Single implementation to replace 8 duplicate functions
// ============================================

/**
 * Wait for Supabase client to be initialized
 * This is the ONLY implementation of this function in the codebase
 * 
 * @param {number} timeout - Max time to wait in ms (default 10000)
 * @returns {Promise<Object|null>} Supabase client or null on timeout
 */
function waitForSupabase(timeout = 10000) {
  // If already available, return immediately
  if (window.__supabase__) {
    console.log('[SUPABASE-WAIT] Client already available');
    return Promise.resolve(window.__supabase__);
  }

  console.log('[SUPABASE-WAIT] Waiting for Supabase initialization...');

  return new Promise((resolve) => {
    const startTime = Date.now();
    
    // Set up app:ready listener
    const readyHandler = () => {
      if (window.__supabase__) {
        console.log('[SUPABASE-WAIT] Client ready via app:ready event');
        resolve(window.__supabase__);
      }
    };
    document.addEventListener('app:ready', readyHandler, { once: true });
    
    // Also poll in case event was already fired
    const interval = setInterval(() => {
      if (window.__supabase__) {
        clearInterval(interval);
        document.removeEventListener('app:ready', readyHandler);
        console.log('[SUPABASE-WAIT] Client ready via polling');
        resolve(window.__supabase__);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(interval);
        document.removeEventListener('app:ready', readyHandler);
        console.error('[SUPABASE-WAIT] Timeout waiting for Supabase client');
        resolve(null);
      }
    }, 50);
  });
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.waitForSupabase = waitForSupabase;
}
