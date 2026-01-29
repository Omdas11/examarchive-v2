/* ================================
   Expanded Profile Panel – EVENT SAFE (Supabase)
   ================================ */

import { supabase } from "./supabase.js";

(function () {

  function initProfilePanel() {
    const panel = document.getElementById("profile-panel");
    if (!panel) {
      console.warn("profile-panel not found at init");
      return;
    }

    console.log("profile-panel initialized");

    const logoutBtn = document.getElementById("profileLogoutBtn");

    // ---------- OPEN ----------
    document.addEventListener("click", (e) => {
      const openBtn = e.target.closest("[data-open-profile]");
      if (!openBtn) return;

      e.preventDefault();
      panel.classList.add("open");
      panel.setAttribute("aria-hidden", "false");
    });

    // ---------- CLOSE ----------
    document.addEventListener("click", (e) => {
      if (!panel.classList.contains("open")) return;

      const closeBtn = e.target.closest("[data-close-profile]");
      const card = e.target.closest(".profile-panel-card");

      if (closeBtn || !card) {
        panel.classList.remove("open");
        panel.setAttribute("aria-hidden", "true");
      }
    });

    // ---------- ESC ----------
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && panel.classList.contains("open")) {
        panel.classList.remove("open");
        panel.setAttribute("aria-hidden", "true");
      }
    });

    // ---------- LOGOUT (SUPABASE) ----------
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        const { error } = await supabase.auth.signOut();

        if (error) {
          console.error("Logout error:", error);
          alert("❌ Logout failed");
          return;
        }

        alert("👋 Logged out");
        location.reload();
      });
    }
  }

  // 🔑 WAIT until partial is injected
  document.addEventListener("profile-panel:loaded", initProfilePanel);

})();
