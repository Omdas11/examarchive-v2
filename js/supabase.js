// js/supabase.js
// ============================================
// SUPABASE CLIENT – OAUTH SAFE (STATIC + MOBILE)
// ============================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://jigeofftrhhyvnjpptxw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_nwdMKnjcV_o-WSe_VMs9CQ_xpaMeGAT";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true, // 🔥 REQUIRED
      flowType: "pkce"          // 🔥 REQUIRED for OAuth
    }
  }
);
