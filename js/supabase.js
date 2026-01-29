import { createClient } from "https://esm.sh/@supabase/supabase-js";

export const supabase = createClient(
  "https://jigeofftrhhyvnjpptxw.supabase.co",
  "sb_publishable_nwdMKnjcV_o-WSe_VMs9CQ_xpaMeGAT",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false, // 👈 MUST be false since YOU handle it manually
      flowType: "implicit",      // 👈 REQUIRED for #access_token
      storage: window.localStorage, // 👈 IMPORTANT on mobile
    },
  }
);
