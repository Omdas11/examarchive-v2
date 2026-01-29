// js/login-modal.js
// ============================================
// LOGIN MODAL CONTROLLER – SUPABASE (MOBILE SAFE)
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

  /* ===============================
     Open modal (GLOBAL)
     =============================== */
  window.openLoginModal = () => {
    modal.classList.add("open");
    debug("🟢 Login modal opened");
  };

  /* ===============================
     Close modal
     =============================== */
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
      } else {
        debug("➡️ Redirecting to " + provider);
      }
    });
  });
});

/* ===============================
   Attach Login button in header
   =============================== */
document.addEventListener("header:loaded", () => {
  const loginBtn = document.querySelector("[data-login-btn]");
  if (!loginBtn) {
    debug("⚠️ Login button NOT found");
    return;
  }

  loginBtn.addEventListener("click", () => {
    debug("👉 Login button clicked");
    window.openLoginModal?.();
  });
});

/* ===============================
   OAuth return handler (SAFE)
   =============================== */
(async function handleOAuthReturn() {
  if (!window.location.hash.includes("access_token")) return;

  debug("🔁 OAuth return detected");

  const { data, error } = await supabase.auth.getSession();

  if (error) {
    debug("❌ Session error");
    return;
  }

  if (data?.session) {
    debug("✅ Session restored from OAuth");
  } else {
    debug("⚠️ No session after OAuth");
  }

  // 🔥 Clean hash ALWAYS
  history.replaceState({}, document.title, window.location.pathname);
})();
