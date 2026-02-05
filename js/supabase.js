// js/supabase.js
// ============================================
// SUPABASE CLIENT – Phase 9.2.8 (ES Module for use in modules/)
// This file is ONLY imported by ES modules in js/modules/
// Initializes Supabase ONCE and dispatches app:ready event
// ============================================

// Graceful degradation if Bootstrap is missing
if (!window.App) {
  console.warn('[SUPABASE] Bootstrap missing - creating minimal App object');
  window.App = {
    ready: false,
    supabase: null,
    session: null
  };
}

const SUPABASE_URL = "https://jigeofftrhhyvnjpptxw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_nwdMKnjcV_o-WSe_VMs9CQ_xpaMeGAT";

// Load Supabase UMD safely
if (!window.supabase) {
  console.error("Supabase SDK not loaded. Make sure to include the CDN script before this module.");
  // Don't throw - just log and continue, the app will degrade gracefully
}

// Only create client if SDK is available
let supabaseClient = null;

if (window.supabase) {
  supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce"
      }
    }
  );

  // Store in window.App
  window.App.supabase = supabaseClient;

  // Also expose globally for classic scripts (backward compatibility)
  window.__supabase__ = supabaseClient;

  // Initialize session and dispatch app:ready event
  supabaseClient.auth.getSession().then(({ data }) => {
    window.App.session = data.session;
    window.App.ready = true;

    console.log('[SUPABASE] Session initialized, dispatching app:ready');
    document.dispatchEvent(new Event('app:ready'));
  }).catch(err => {
    console.error('[SUPABASE] Error getting session:', err);
    window.App.session = null;
    window.App.ready = true;
    document.dispatchEvent(new Event('app:ready'));
  });
} else {
  // Dispatch app:ready even if Supabase failed to load
  // This allows the UI to render without blocking
  setTimeout(() => {
    console.warn('[SUPABASE] SDK not available, dispatching app:ready anyway');
    window.App.ready = true;
    document.dispatchEvent(new Event('app:ready'));
  }, 100);
}

// Export a getter function to avoid mutable export issues
export function getSupabaseClient() {
  return supabaseClient;
}

// Also export as 'supabase' for backward compatibility with modules
export const supabase = supabaseClient;
