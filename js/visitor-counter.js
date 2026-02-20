// js/visitor-counter.js
// ============================================
// VISITOR COUNTER
// Increments on new session only (not refresh)
// Uses sessionStorage to prevent counting refreshes
// ============================================

(function () {
  const SESSION_KEY = 'examarchive_visit_counted';

  // Only increment once per browser session
  if (sessionStorage.getItem(SESSION_KEY) === 'true') {
    return;
  }

  async function incrementCounter() {
    try {
      if (!window.waitForSupabase) return;
      const supabase = await window.waitForSupabase();
      if (!supabase) return;

      const { data, error } = await supabase.rpc('increment_visit_counter');

      if (error) {
        console.warn('[VISITOR] Could not increment counter:', error.message);
        return;
      }

      sessionStorage.setItem(SESSION_KEY, 'true');

      if (window.Debug) {
        window.Debug.logInfo('system', `[VISITOR] Counter incremented: ${data}`);
      }
    } catch (err) {
      console.warn('[VISITOR] Error incrementing counter:', err);
    }
  }

  // Delay slightly to not block page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(incrementCounter, 1000);
    });
  } else {
    setTimeout(incrementCounter, 1000);
  }
})();
