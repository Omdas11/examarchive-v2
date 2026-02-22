// js/visitor-counter.js
// ============================================
// VISITOR COUNTER
// Increments on new session only (not refresh)
// Uses sessionStorage to prevent counting refreshes
// Displays visitor count + active users in footer
// ============================================

(function () {
  const SESSION_KEY = 'examarchive_visit_counted';
  const STATS_CACHE_KEY = 'examarchive_visitor_stats';
  const STATS_CACHE_TTL = 30000; // 30 seconds

  async function getSupabaseClient() {
    if (window.waitForSupabase) return await window.waitForSupabase();
    if (window.getSupabase) return window.getSupabase();
    return null;
  }

  // Increment counter once per session
  async function incrementCounter() {
    if (sessionStorage.getItem(SESSION_KEY) === 'true') return;

    try {
      const supabase = await getSupabaseClient();
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

  // Fetch and display visitor stats in footer
  async function displayVisitorStats() {
    // Check cache
    try {
      const cached = JSON.parse(sessionStorage.getItem(STATS_CACHE_KEY));
      if (cached && Date.now() - cached.time < STATS_CACHE_TTL) {
        renderFooterStats(cached.totalVisits, cached.activeUsers);
        return;
      }
    } catch (e) { /* ignore parse errors */ }

    try {
      const supabase = await getSupabaseClient();
      if (!supabase) return;

      // Fetch total visits from site_stats
      const { data: statsData, error: statsError } = await supabase
        .from('site_stats')
        .select('total_visits')
        .eq('id', 1)
        .single();

      const totalVisits = statsError ? 0 : (statsData?.total_visits || 0);

      // Get active users (signed in within last 10 minutes)
      let activeUsers = 0;
      try {
        const { data: activeCount, error: activeError } = await supabase.rpc('get_active_user_count');
        activeUsers = activeError ? 0 : (activeCount || 0);
      } catch (e) {
        activeUsers = 0;
      }

      // Cache results
      sessionStorage.setItem(STATS_CACHE_KEY, JSON.stringify({
        totalVisits,
        activeUsers,
        time: Date.now()
      }));

      renderFooterStats(totalVisits, activeUsers);
    } catch (err) {
      console.warn('[VISITOR] Error fetching stats:', err);
    }
  }

  function renderFooterStats(totalVisits, activeUsers) {
    const el = document.getElementById('footerStats');
    if (!el) return;

    const formattedVisits = totalVisits.toLocaleString();
    const parts = [`Visitors: ${formattedVisits}`];
    if (activeUsers > 0) {
      parts.push(`Active: ${activeUsers}`);
    }
    el.textContent = parts.join(' · ');

    // Show admin reset button if user has level >= 100
    showAdminResetButton();
  }

  async function showAdminResetButton() {
    try {
      const supabase = await getSupabaseClient();
      if (!supabase) return;

      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) return;

      const isAdmin = await (window.AdminAuth?.isCurrentUserAdmin?.() || Promise.resolve(false));
      if (isAdmin) {
        const el = document.getElementById('footerStats');
        if (!el || el.querySelector('.reset-counter-btn')) return;

        const btn = document.createElement('button');
        btn.className = 'reset-counter-btn';
        btn.textContent = '↺ Reset';
        btn.title = 'Reset visitor counter (Admin only)';
        btn.style.cssText = 'margin-left:8px;font-size:0.7rem;padding:2px 8px;border:1px solid var(--border);border-radius:4px;background:var(--bg-soft);color:var(--text-muted);cursor:pointer;';
        btn.addEventListener('click', async () => {
          if (!confirm('Reset the visitor counter to 0? This is for official launch reset.')) return;
          const { error } = await supabase.rpc('reset_site_counter');
          if (error) {
            alert('Reset failed: ' + error.message);
          } else {
            sessionStorage.removeItem(STATS_CACHE_KEY);
            displayVisitorStats();
          }
        });
        el.appendChild(btn);
      }
    } catch (e) {
      // Silently fail - admin button is optional
    }
  }

  // Run on page load
  function init() {
    incrementCounter();
    // Slight delay for footer to be loaded via partial
    setTimeout(displayVisitorStats, 1500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 500));
  } else {
    setTimeout(init, 500);
  }
})();
