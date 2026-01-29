// js/profile-panel.js
// ===============================
// PROFILE PANEL CONTROLLER (FIXED)
// ===============================

import { supabase } from "./supabase.js";

function debug(msg) {
  console.log("[profile-panel]", msg);
}

/* ===============================
   Wait for profile panel DOM
   =============================== */
document.addEventListener("profile-panel:loaded", () => {
  const panel = document.querySelector(".profile-panel");
  const backdrop = document.querySelector(".profile-panel-backdrop");
  const closeBtn = document.querySelector(".profile-panel-close");

  if (!panel) {
    debug("❌ profile panel NOT found");
    return;
  }

  debug("✅ profile panel DOM ready");

  function openPanel() {
    panel.classList.add("open");
    debug("🟢 profile panel opened");
  }

  function closePanel() {
    panel.classList.remove("open");
    debug("🔴 profile panel closed");
  }

  backdrop?.addEventListener("click", closePanel);
  closeBtn?.addEventListener("click", closePanel);

  /* ===============================
     Attach avatar trigger
     =============================== */
  const avatarBtn = document.querySelector(".avatar-trigger");

  if (!avatarBtn) {
    debug("⚠️ avatar trigger not found");
    return;
  }

  avatarBtn.addEventListener("click", () => {
    debug("👉 avatar clicked");
    openPanel();
  });
});
