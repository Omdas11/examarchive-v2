import { supabase } from "./supabase.js";

async function restoreSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    alert("❌ Auth error");
    return;
  }

  if (!data.session) {
    alert("ℹ️ No active session");
    return;
  }

  alert("✅ Logged in: " + data.session.user.email);

  // example UI update
  document.querySelector(".login-trigger")?.classList.add("hidden");
}

restoreSession();
