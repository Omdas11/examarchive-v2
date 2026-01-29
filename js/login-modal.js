// js/login-modal.js
// ============================================
// LOGIN MODAL CONTROLLER – SUPABASE (FINAL FIX)
// ============================================

import { supabase } from "./supabase.js";

/* ===============================
   Debug helper (mobile)
   =============================== */
function debug(msg) {
  alert(msg);
  console.log(msg);
}

/* ===============================
   Global modal open helper
   =============================== */
window.openLoginModal = function () {
  const modal = document.querySelector(".login-modal");
  if (!modal) {
    debug("❌ login modal NOT found");
    return;
  }
  modal.classList.add("open");
  debug("🟢 Login modal opened");
};

/* ===============================
   Modal DOM ready
   =============================== */
document.addEventListener("login-modal:loaded", () => {
  const modal = document.querySelector(".login-modal");
  if (!modal) {
    debug("❌ login modal missing after load");
    return;
  }

  debug("🔥 Login modal DOM ready");

  const close = () => modal.classList.remove("open");

  modal.querySelectorAll("[data-close-modal]").forEach(el =>
    el.addEventListener("click", close)
  );

  modal.querySelectorAll(".login-provider").forEach(btn => {
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

/* ===============================
   🔥 GLOBAL CLICK DELEGATION
   Works even if header reloads
   =============================== */
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".login-trigger");
  if (!btn) return;

  debug("👉 Login button clicked");
  window.openLoginModal();
});

/* ===============================
   OAuth return handler
   =============================== */
(async function () {
  if (!location.hash.includes("access_token")) return;

  debug("🔁 OAuth return detected");

  await supabase.auth.getSession();

  history.replaceState({}, document.title, location.pathname);
})();
