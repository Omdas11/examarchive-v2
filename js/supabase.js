// js/supabase.js
// ============================================
// SUPABASE CLIENT – STATIC + MOBILE SAFE
// ============================================

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
