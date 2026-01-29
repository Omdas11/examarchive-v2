import { supabase } from "./supabase.js";

alert("✅ login-modal.js loaded");

function waitForModal() {
  const modal = document.querySelector(".login-modal");
  const loginBtn = document.querySelector(".login-trigger");
  const googleBtn = document.querySelector('[data-provider="google"]');
  const closeBtn = document.querySelector(".modal-close");

  if (!modal) {
    alert("⏳ modal NOT found");
    return setTimeout(waitForModal, 300);
  }

  if (!loginBtn) {
    alert("⏳ login button NOT found");
    return setTimeout(waitForModal, 300);
  }

  if (!googleBtn) {
    alert("❌ GOOGLE BUTTON NOT FOUND");
    return setTimeout(waitForModal, 300);
  }

  alert("🔥 Modal + Google button FOUND");

  // Open modal
  loginBtn.addEventListener("click", () => {
    alert("🟢 Login clicked → opening modal");
    modal.classList.add("open");
  });

  // Close modal
  closeBtn?.addEventListener("click", () => {
    alert("❌ Modal closed");
    modal.classList.remove("open");
  });

  // Google OAuth
  googleBtn.addEventListener("click", async () => {
    alert("🚀 GOOGLE BUTTON CLICKED");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      alert("❌ OAuth error: " + error.message);
    } else {
      alert("🔁 Redirecting to Google…");
    }
  });
}

waitForModal();
