// js/login-modal.js
// ===================================
// Login Modal Controller (Supabase)
// MOBILE DEBUG – STABLE
// ===================================

import { supabase } from "./supabase.js";

alert("✅ login-modal.js loaded");

/* ===============================
   WAIT FOR MODAL DOM (SAFE)
   =============================== */
function initLoginModal() {
  const modal = document.querySelector(".login-modal");
  const loginBtn = document.querySelector(".login-trigger");
  const googleBtn = document.querySelector('[data-provider="google"]');
  const closeBtn = document.querySelector(".modal-close");

  if (!modal || !loginBtn || !googleBtn) {
    alert("⏳ Waiting for login modal DOM…");
    return setTimeout(initLoginModal, 300);
  }

  alert("🔥 Login modal DOM ready");

  /* ===============================
     OPEN MODAL
     =============================== */
  loginBtn.addEventListener("click", () => {
    alert("🟢 Login button clicked → opening modal");
    modal.classList.add("open");
  });

  /* ===============================
     CLOSE MODAL
     =============================== */
  closeBtn?.addEventListener("click", () => {
    alert("❌ Modal closed");
    modal.classList.remove("open");
  });

  /* ===============================
     GOOGLE OAUTH (NO LOCK HERE)
     =============================== */
  googleBtn.addEventListener("click", async () => {
    alert("🚀 Google OAuth started");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin
      }
    });

    if (error) {
      alert("❌ OAuth error: " + error.message);
    } else {
      alert("🔁 Redirecting to Google…");
    }
  });
}

/* ===============================
   START AFTER PARTIAL LOAD
   =============================== */
document.addEventListener("login-modal:loaded", initLoginModal);
