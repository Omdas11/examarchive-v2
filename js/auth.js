import { supabase } from "./supabase.js";

console.log("🔐 auth.js loaded");

async function checkAuth() {
  const { data } = await supabase.auth.getSession();

  if (!data.session) {
    alert("ℹ️ No active session");
    return;
  }

  const user = data.session.user;
  alert("✅ Logged in as: " + user.email);

  // expose user globally
  window.currentUser = user;

  // update UI
  document.body.classList.add("logged-in");
}

checkAuth();

// listen for auth changes
supabase.auth.onAuthStateChange((_event, session) => {
  if (session) {
    alert("🔄 Session updated");
    window.location.reload();
  }
});
