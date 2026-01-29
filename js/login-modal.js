import { supabase } from "./supabase.js";

function waitForModal() {
  const modal = document.querySelector(".login-modal");
  const loginBtn = document.querySelector(".login-trigger");
  const googleBtn = document.querySelector('[data-provider="google"]');
  const closeBtn = document.querySelector(".modal-close");

  if (!modal || !googleBtn) {
    return setTimeout(waitForModal, 300);
  }

  loginBtn?.addEventListener("click", () => {
    modal.classList.add("open");
  });

  closeBtn?.addEventListener("click", () => {
    modal.classList.remove("open");
  });

  googleBtn.addEventListener("click", async () => {
    alert("🚀 Starting Google OAuth");

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
