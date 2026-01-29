import { createClient } from "https://esm.sh/@supabase/supabase-js";

export const supabase = createClient(
  "https://jigeofftrhhyvnjpptxw.supabase.co",
  "sb_publishable_nwdMKnjcV_o-WSe_VMs9CQ_xpaMeGAT",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true, // 🔥 THIS IS THE FIX
      flowType: "implicit",     // 🔥 REQUIRED for hash tokens
    },
  }
);
