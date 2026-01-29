// js/login-modal.js
// ============================================
// LOGIN MODAL CONTROLLER – SUPABASE (FINAL FIX)
// ============================================

import { supabase } from "./supabase.js";

/* ===============================
   Mobile debug helper
   =============================== */
function debug(msg) {
  alert(msg);
  console.log(msg);
}

/* ===============================
   Wait for modal DOM
   =============================== */
document.addEventListener("login-modal:loaded", () => {
  const modal = document.querySelector(".login-modal");
  if (!modal) {
    debug("❌ login modal NOT found");
    return;
  }

  debug("🔥 Login modal DOM ready");

  const closeBtn = modal.querySelector(".modal-close");
  const backdrop = modal.querySelector(".login-modal-backdrop");
  const providerBtns = modal.querySelectorAll(".login-provider");

  // Expose global open
  window.openLoginModal = () => {
    modal.classList.add("open");
    debug("🟢 Login modal opened");
  };

  function closeModal() {
    modal.classList.remove("open");
    debug("❌ Login modal closed");
  }

  closeBtn?.addEventListener("click", closeModal);
  backdrop?.addEventListener("click", closeModal);

  /* ===============================
     OAuth buttons
     =============================== */
  providerBtns.forEach(btn => {
    btn.addEventListener("click", async () => {
      const provider = btn.dataset.provider;
      debug("🚀 OAuth start: " + provider);

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin
        }
      });

      if (error) {
        debug("❌ OAuth error: " + error.message);
      }
    });
  });
});

/* ==================================================
   ✅ EVENT DELEGATION — FIXES YOUR ISSUE
   ================================================== */
document.addEventListener("click", (e) => {
  const loginBtn = e.target.closest(".login-trigger");
  if (!loginBtn) return;

  debug("👉 Login button clicked (delegated)");
  window.openLoginModal?.();
});

/* ===============================
   OAuth return handler
   =============================== */
(async function handleOAuthReturn() {
  if (!window.location.hash.includes("access_token")) return;

  debug("🔁 OAuth return detected");

  await supabase.auth.getSession();

  history.replaceState({}, document.title, window.location.pathname);
})();
