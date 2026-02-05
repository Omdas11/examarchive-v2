// js/supabase.js
// ============================================
// SUPABASE CLIENT – Phase 9.2.4 (ES Module for use in modules/)
// This file is ONLY imported by ES modules in js/modules/
// Initializes Supabase ONCE and dispatches app:ready event
// ============================================

if (!window.App) throw new Error('Bootstrap missing');

const SUPABASE_URL = "https://jigeofftrhhyvnjpptxw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_nwdMKnjcV_o-WSe_VMs9CQ_xpaMeGAT";

// Load Supabase UMD safely
if (!window.supabase) {
  console.error("Supabase SDK not loaded. Make sure to include the CDN script before this module.");
  throw new Error("Supabase SDK not loaded");
}

export const supabase = window.supabase.createClient(
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
window.App.supabase = supabase;

// Also expose globally for classic scripts (backward compatibility)
window.__supabase__ = supabase;

// Initialize session and dispatch app:ready event
supabase.auth.getSession().then(({ data }) => {
  window.App.session = data.session;
  window.App.ready = true;

  console.log('[SUPABASE] Session initialized, dispatching app:ready');
  document.dispatchEvent(new Event('app:ready'));
});
