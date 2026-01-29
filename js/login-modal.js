import { supabase } from "./supabase.js";

alert("✅ login-modal.js (supabase) loaded");

function waitForModal() {
  const modal = document.querySelector(".login-modal");
  const loginBtn = document.querySelector(".login-trigger");
  const googleBtn = document.querySelector('[data-provider="google"]');
  const closeBtn = document.querySelector(".modal-close");

  if (!modal || !googleBtn) {
    return setTimeout(waitForModal, 300);
  }

  alert("🔥 Modal + Google button FOUND");

  // Open modal
  loginBtn?.addEventListener("click", () => {
    alert("🟢 LOGIN CLICKED");
    modal.classList.add("open");
  });

  // Close modal
  closeBtn?.addEventListener("click", () => {
    modal.classList.remove("open");
  });

  // GOOGLE LOGIN
  googleBtn.addEventListener("click", async () => {
    alert("🚀 GOOGLE OAUTH START");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin
      }
    });

    if (error) {
      alert("❌ OAuth error: " + error.message);
    }
  });
}

waitForModal();
