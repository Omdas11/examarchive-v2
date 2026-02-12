// js/supabase.js
// ============================================
// SUPABASE CLIENT – Phase 1.4 (ES Module for use in modules/)
// This file is ONLY imported by ES modules in js/modules/
// Uses getSupabase() singleton and dispatches app:ready event
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

// Wait for getSupabase to be available
// (supabase-client.js should load before this module)
const supabaseClient = window.getSupabase ? window.getSupabase() : null;

if (supabaseClient) {
  console.log('[SUPABASE] Client obtained from getSupabase()');

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
    console.warn('[SUPABASE] Client not available, dispatching app:ready anyway');
    window.App.ready = true;
    document.dispatchEvent(new Event('app:ready'));
  }, 100);
}

// Export a getter function that uses getSupabase
export function getSupabaseClient() {
  return window.getSupabase ? window.getSupabase() : null;
}

// Also export as 'supabase' for backward compatibility with modules
export const supabase = supabaseClient;
